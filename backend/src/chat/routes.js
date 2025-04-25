const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const { check } = require('express-validator');
const axios = require('axios');
const prisma = require('../prisma');
const authMiddleware = require('../auth/middleware');
const OPENAI_API = 'https://api.openai.com/v1/chat/completions';
const { encoding_for_model, get_encoding } = require("tiktoken");
const encoderCache = {};
/**
 * 모델별 토큰 인코딩을 캐시하여 제공
 * @param {string} model
 * @returns encoder
 */
function getEncoder(model) {
  if (encoderCache[model]) return encoderCache[model];
  try {
    encoderCache[model] = encoding_for_model(model);
  } catch {
    encoderCache[model] = get_encoding('cl100k_base');
  }
  return encoderCache[model];
}
const fs = require('fs');
const path = require('path');
const IMAGE_DIR = process.env.IMAGE_DIR || path.join(process.cwd(), 'images');
const router = express.Router();

// SSE 스트림 user별 rate limit (1분당 30회)
const streamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.userId,
  message: 'Too many requests, please slow down.'
});

// SSE 스트리밍 채팅
router.post(
  '/stream',
  authMiddleware,
  streamLimiter,
  validate([
    check('model').notEmpty().withMessage('Model is required').isString(),
    check('messages').isArray().withMessage('Messages must be an array'),
    check('conversationId').optional().isUUID().withMessage('conversationId must be UUID'),
  ]),
  async (req, res) => {
    // SSE headers for event-stream (must be set before any writes)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    // predeclare SSE heartbeat for error handling
    let heartbeat;
    const userId = req.userId;
    const { model, messages, conversationId } = req.body;
    const baseUrl = req.protocol + '://' + req.get('host');

    // 모델 정보 조회 및 사용 가능 여부 확인
    const modelInfo = await prisma.model.findUnique({ where: { api_name: model } });
    if (!modelInfo || !modelInfo.is_enabled) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: '모델을 사용할 수 없습니다.' })}\n\n`);
      clearInterval(heartbeat);
      res.end();
      return;
    }

    // 입력 검증
    if (!model || !Array.isArray(messages)) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: '잘못된 요청입니다.' })}\n\n`);
      clearInterval(heartbeat);
      res.end();
      return;
    }

    // Pre-check credit before title generation
    const creditUser = await prisma.user.findUnique({ where: { id: userId } });
    if (creditUser.current_credit < modelInfo.cost) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: '크레딧이 부족합니다.' })}\n\n`);
      clearInterval(heartbeat);
      res.end();
      return;
    }

    let convId = conversationId;
    // Conversation 생성/확인
    if (!convId) {
      const conv = await prisma.conversation.create({ data: { user_id: userId, last_model_id: modelInfo.id } });
      convId = conv.id;
    } else {
      // 기존 대화 확인 및 권한 체크
      let conv = await prisma.conversation.findUnique({ where: { id: convId } });
      if (!conv || (req.userRole !== 'ADMIN' && conv.user_id !== userId)) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: '권한이 없습니다.' })}\n\n`);
        clearInterval(heartbeat);
        res.end();
        return;
      }
    }
    // 이미지 메시지인 경우 DB에 저장 및 토큰 계산
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m.type === 'image' && m.assetId) {
          const widthTiles = m.widthTiles || 1;
          const heightTiles = m.heightTiles || 1;
          let imageTokenCount = 85 + 170 * widthTiles * heightTiles;
          if (imageTokenCount < 255) imageTokenCount = 255;
          const convMeta = await prisma.conversation.findUnique({ where: { id: convId }, select: { total_tokens: true } });
          const newTotalTokens = convMeta.total_tokens + imageTokenCount;
          if (newTotalTokens > modelInfo.context_limit) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: '대화 한도를 초과했습니다.' })}\n\n`);
            clearInterval(heartbeat);
            res.end();
            return;
          } else if (newTotalTokens >= Math.floor(modelInfo.context_limit * 0.80)) {
            res.write(`event: warning\ndata: ${JSON.stringify({ warning: '대화 한도에 거의 도달했습니다.', percent: Math.round(newTotalTokens / modelInfo.context_limit * 100) })}\n\n`);
          }
          await prisma.$transaction([
            prisma.message.create({ data: { conversation_id: convId, role: 'user', type: 'image', assetId: m.assetId, token_count: imageTokenCount } }),
            prisma.conversation.update({ where: { id: convId }, data: { total_tokens: { increment: imageTokenCount } } })
          ]);
        }
      }
    }
    // find last text message for token accounting
    const lastUser = Array.isArray(messages) && [...messages].reverse().find(m => m.role === 'user' && m.content);
    if (lastUser) {
      const encoding = getEncoder(model);
      const userTokenCount = encoding.encode(lastUser.content).length;
      // Enforce per-model context limit
      const convMeta = await prisma.conversation.findUnique({ where: { id: convId }, select: { total_tokens: true } });
      const newTotalTokens = convMeta.total_tokens + userTokenCount;
      if (newTotalTokens > modelInfo.context_limit) {
        // abort if context limit exceeded
        res.write(`event: error\ndata: ${JSON.stringify({ error: '대화 한도를 초과했습니다.' })}\n\n`);
        clearInterval(heartbeat);
        res.end();
        return;
      } else if (newTotalTokens >= Math.floor(modelInfo.context_limit * 0.80)) {
        // warning when nearing limit
        res.write(`event: warning\ndata: ${JSON.stringify({ warning: '대화 한도에 거의 도달했습니다.', percent: Math.round(newTotalTokens / modelInfo.context_limit * 100) })}\n\n`);
      }
      await prisma.$transaction([
        prisma.message.create({ data: { conversation_id: convId, role: 'user', content: lastUser.content, token_count: userTokenCount } }),
        prisma.conversation.update({ where: { id: convId }, data: { total_tokens: { increment: userTokenCount }, last_model_id: modelInfo.id } })
      ]);
    }

    // 크레딧 확인
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.current_credit < modelInfo.cost) {
      // Insufficient credit: send SSE error
      res.write(`event: error\ndata: ${JSON.stringify({ error: '크레딧이 부족합니다.' })}\n\n`);
      clearInterval(heartbeat);
      res.end();
      return;
    }

    // 크레딧 즉시 차감 및 ledger 기록
    await prisma.user.update({ where: { id: userId }, data: { current_credit: user.current_credit - modelInfo.cost } });
    await prisma.creditLedger.create({ data: { user_id: userId, delta: -modelInfo.cost, reason: 'usage' } });

    // 제목 생성은 스트리밍 시작 후 비동기로 수행합니다
    const convTitle = await prisma.conversation.findUnique({ where: { id: convId }, select: { title: true } });
    if (!convTitle.title) {
      try {
        const firstUser = messages.find(m => m.role === 'user');
        const titlePrompt = firstUser?.content || messages.map(m => m.content).join('\\n');
        const titleRes = await axios.post(
          OPENAI_API,
          {
            model: 'gpt-4.1-mini-2025-04-14',
            messages: [
              { role: 'system', content:
                'You are a title generator. ' +
                'When given a conversation snippet, output only the title in the same language—no extra words, no explanations.'
              },
              { role: 'user', content: titlePrompt }
            ],
            max_tokens: 15,
            temperature: 0,
            stop: ['\n']
          },
          { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
        );
        const title = titleRes.data.choices[0].message.content.trim();
        await prisma.conversation.update({ where: { id: convId }, data: { title } });
      } catch {
        await prisma.conversation.update({ where: { id: convId }, data: { title: 'Untitled' } });
      }
    }

    // heartbeat to keep connection alive
    heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 20000);

    // 신규 대화 ID 전송 (클라이언트에서 리다이렉트 처리)
    if (!conversationId) {
      res.write(`data: ${JSON.stringify({ conversationId: convId })}\n\n`);
    }

    // AbortController로 요청 취소 처리
    const controller = new AbortController();
    req.on('close', () => {
      clearInterval(heartbeat);
      controller.abort();
    });

    try {
      // Load full conversation for context-aware
      const dbMessages = await prisma.message.findMany({
        where: { conversation_id: convId },
        orderBy: { created_at: 'asc' },
        select: { role: true, content: true, type: true, assetId: true }
      });
      const globalConfig = await prisma.globalConfig.findUnique({ where: { id: 1 } });
      let callMessages = [];
      const hasNewImageAttachment = messages.some(m => m.type === 'image' && m.assetId);
      if (globalConfig?.systemMessage) {
        callMessages.push({ role: 'system', content: globalConfig.systemMessage });
      }
      if (modelInfo.system_message) {
        callMessages.push({ role: 'system', content: modelInfo.system_message });
      }
      // 기존 대화 메시지 처리
      dbMessages.forEach(m => {
        if (m.type === 'image' && m.assetId && hasNewImageAttachment) {
          const filePath = path.join(IMAGE_DIR, `${m.assetId}.jpg`);
          try {
            if (fs.existsSync(filePath)) {
              const b64 = fs.readFileSync(filePath).toString('base64');
              console.log(`[DEBUG] Embedding image ${m.assetId} from ${filePath}, base64 length=${b64.length}`);
              callMessages.push({
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'high' } }
                ]
              });
            } else {
              console.log(`[DEBUG] Image file not found: ${filePath}`);
              callMessages.push({ role: 'user', content: `[이미지를 불러올 수 없습니다: ${m.assetId}]` });
            }
          } catch (fileErr) {
            console.error(`[ERROR] Failed to read image file ${filePath}:`, fileErr);
            callMessages.push({ role: 'user', content: `[이미지 로딩 오류: ${m.assetId}]` });
          }
        } else if (m.type === 'image' && m.assetId) {
          // 새 이미지 없음: Vision 페이로드로 처리
          const filePath = path.join(IMAGE_DIR, `${m.assetId}.jpg`);
          try {
            if (fs.existsSync(filePath)) {
              const b64 = fs.readFileSync(filePath).toString('base64');
              console.log(`[DEBUG] Re-embedding historical image ${m.assetId} as Vision payload`);
              callMessages.push({
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'auto' } }
                ]
              });
            } else {
              // 파일이 존재하지 않으면 마크다운 링크로 대체
              callMessages.push({ role: 'user', content: `![이미지를 찾을 수 없음: ${m.assetId}](${baseUrl}/api/images/${m.assetId})` });
            }
          } catch (fileErr) {
            console.error(`[ERROR] Failed to read historical image ${m.assetId}:`, fileErr);
            callMessages.push({ role: 'user', content: `[이미지 로딩 오류: ${m.assetId}]` });
          }
        } else if (m.content) {
          callMessages.push({ role: m.role, content: m.content });
        }
      });

      // payload 생성
      const payload = { model, messages: callMessages, stream: true };
      const attachmentCount = callMessages.reduce((a, m) => a + (m.attachments?.length || 0), 0);
      console.log(`[DEBUG] Payload built: messages=${callMessages.length}, attachments=${attachmentCount}`);
      if (modelInfo.is_inference_model) {
        payload.reasoning_effort = modelInfo.reasoning_effort;
      }
      console.log(`[DEBUG] OpenAI endpoint: ${OPENAI_API}, API key present: ${!!process.env.OPENAI_API_KEY}`);
      let openaiRes;
      try {
        openaiRes = await axios.post(
          OPENAI_API,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            responseType: 'stream',
            signal: controller.signal,
            timeout: 120000
          }
        );
      } catch (err) {
        let errorBody = '';
        if (err.response?.data && typeof err.response.data.on === 'function') {
          for await (const chunk of err.response.data) {
            errorBody += chunk.toString('utf8');
          }
          console.error('[DEBUG] OpenAI error body:', errorBody);
        } else {
          console.error('[DEBUG] OpenAI request error:', err.message);
        }
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'OpenAI API 요청 실패', detail: errorBody })}\n\n`);
        clearInterval(heartbeat);
        res.end();
        return;
      }
      let assistantContent = '';
      let buffer = '';
      openaiRes.data.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        const parts = buffer.split('\n\n');
        buffer = parts.pop();
        for (const part of parts) {
          if (!part.startsWith('data:')) continue;
          const dataStr = part.replace(/^data: /, '').trim();
          if (dataStr === '[DONE]') {
            clearInterval(heartbeat);
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content !== undefined) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
              assistantContent += content;
            }
          } catch (e) {
            // incomplete JSON fragment, 무시
          }
        }
      });

      openaiRes.data.on('end', async () => {
        // flush any remaining buffer fragments
        if (buffer) {
          const parts = buffer.split('\n\n');
          for (const part of parts) {
            if (!part.startsWith('data:')) continue;
            const dataStr = part.replace(/^data: /, '').trim();
            if (dataStr !== '[DONE]') {
              try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  assistantContent += content;
                }
              } catch {}
            }
          }
        }
        // Assistant message saving with token count
        const encoding = getEncoder(model);
        const assistantTokenCount = encoding.encode(assistantContent).length;
        await prisma.$transaction([
          prisma.message.create({ data: { conversation_id: convId, role: 'assistant', content: assistantContent, token_count: assistantTokenCount } }),
          prisma.conversation.update({ where: { id: convId }, data: { total_tokens: { increment: assistantTokenCount }, last_model_id: modelInfo.id } })
        ]);
        // Calculate prompt tokens (sum of user message tokens)
        const promptAgg = await prisma.message.aggregate({
          where: { conversation_id: convId, role: 'user' },
          _sum: { token_count: true }
        });
        const promptTokens = promptAgg._sum.token_count || 0;
        const completionTokens = assistantTokenCount;
        // Create usage log with actual token counts
        await prisma.usageLog.create({
          data: {
            user_id: userId,
            model_id: modelInfo.id,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            cost: modelInfo.cost
          }
        });
      });
    } catch (err) {
      // 클라이언트 취소 에러: 추가 처리 없이 종료
      if (err.name === 'CanceledError' || err.message.includes('aborted')) {
        return;
      }
      // 오류 발생 시 환불 및 ledger 기록
      await prisma.user.update({ where: { id: userId }, data: { current_credit: user.current_credit + modelInfo.cost } });
      await prisma.creditLedger.create({ data: { user_id: userId, delta: modelInfo.cost, reason: 'refund' } });
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'OpenAI API 오류가 발생했습니다.' })}\n\n`);
      res.end();
    }
  }
);

module.exports = router;