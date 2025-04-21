const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const { check } = require('express-validator');
const axios = require('axios');
const prisma = require('../prisma');
const authMiddleware = require('../auth/middleware');
const OPENAI_API = 'https://api.openai.com/v1/chat/completions';

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
    const userId = req.userId;
    const { model, messages, conversationId } = req.body;

    // 입력 검증
    if (!model || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    let convId = conversationId;
    // Conversation 생성/확인
    if (!convId) {
      const conv = await prisma.conversation.create({ data: { user_id: userId } });
      convId = conv.id;
      // 자동 제목 생성
      try {
        const firstUser = messages.find(m => m.role === 'user');
        const titlePrompt = firstUser?.content || messages.map(m => m.content).join('\n');
        const titleRes = await axios.post(OPENAI_API,
          { model: 'gpt-4.1-mini-2025-04-14', messages: [
              { role: 'system', content: 'Generate a short title for this conversation. Do not answer it directly, Write it in language of the conversation.' },
              { role: 'user', content: titlePrompt }
            ], max_tokens: 10 },
          { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
        );
        const title = titleRes.data.choices[0].message.content.trim();
        await prisma.conversation.update({ where: { id: convId }, data: { title } });
      } catch {
        await prisma.conversation.update({ where: { id: convId }, data: { title: 'Untitled' } });
      }
    } else {
      // 기존 대화 확인 및 권한 체크
      let conv = await prisma.conversation.findUnique({ where: { id: convId } });
      if (!conv || (req.userRole !== 'ADMIN' && conv.user_id !== userId)) {
        return res.sendStatus(403);
      }
      // title이 아직 없는 경우 자동 생성
      if (!conv.title) {
        try {
          const firstUser = messages.find(m => m.role === 'user');
          const titlePrompt = firstUser?.content || messages.map(m => m.content).join('\n');
          const titleRes = await axios.post(
            OPENAI_API,
            {
              model: 'gpt-4.1-nano-2025-04-14',
              messages: [
                { role: 'system', content: 'Generate a short title for this conversation. Do not answer it directly, just generate the title. Write it in language of the conversation.' },
                { role: 'user', content: titlePrompt }
              ],
              max_tokens: 10
            },
            { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
          );
          const title = titleRes.data.choices[0].message.content.trim();
          await prisma.conversation.update({ where: { id: convId }, data: { title } });
        } catch {
          await prisma.conversation.update({ where: { id: convId }, data: { title: 'Untitled' } });
        }
      }
    }
    // 유저 메시지 저장
    const lastUser = Array.isArray(messages) && [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      await prisma.message.create({ data: { conversation_id: convId, role: 'user', content: lastUser.content } });
    }

    // 모델 조회 및 사용 가능 여부 확인 (api_name 기반 조회)
    const modelInfo = await prisma.model.findUnique({ where: { api_name: model } });
    if (!modelInfo || !modelInfo.is_enabled) {
      return res.status(400).json({ error: 'Model not available' });
    }

    // 크레딧 확인
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.current_credit < modelInfo.cost) {
      return res.status(403).json({ error: 'Insufficient credit' });
    }

    // 크레딧 즉시 차감 및 ledger 기록
    await prisma.user.update({ where: { id: userId }, data: { current_credit: user.current_credit - modelInfo.cost } });
    await prisma.creditLedger.create({ data: { user_id: userId, delta: -modelInfo.cost, reason: 'usage' } });

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
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
      // Prepare payload and include reasoning_effort if inference model
      const payload = { model, messages, stream: true };
      if (modelInfo.is_inference_model) {
        payload.reasoning_effort = modelInfo.reasoning_effort;
      }
      const openaiRes = await axios.post(
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

      let assistantContent = '';

      openaiRes.data.on('data', (chunk) => {
        const lines = chunk.toString('utf8').split('\n').filter(line => line.trim());
        for (const line of lines) {
          const trimmed = line.replace(/^data: /, '');
          if (trimmed === '[DONE]') {
            clearInterval(heartbeat);
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
          try {
            const parsed = JSON.parse(trimmed);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content !== undefined) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
              assistantContent += content;
            }
          } catch (err) {}
        }
      });

      openaiRes.data.on('end', async () => {
        // assistant 메시지 저장
        await prisma.message.create({ data: { conversation_id: convId, role: 'assistant', content: assistantContent } });
        // 사용 기록 생성 (modelInfo.id 사용)
        await prisma.usageLog.create({ data: { user_id: userId, model_id: modelInfo.id, prompt_tokens: 0, completion_tokens: 0, cost: modelInfo.cost } });
      });
    } catch (err) {
      // 클라이언트 취소 에러: 추가 처리 없이 종료
      if (err.name === 'CanceledError' || err.message.includes('aborted')) {
        return;
      }
      // 오류 발생 시 환불 및 ledger 기록
      await prisma.user.update({ where: { id: userId }, data: { current_credit: user.current_credit + modelInfo.cost } });
      await prisma.creditLedger.create({ data: { user_id: userId, delta: modelInfo.cost, reason: 'refund' } });
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'OpenAI API error' })}\n\n`);
      res.end();
    }
  }
);

module.exports = router; 