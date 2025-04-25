const prisma = require('../prisma');

// 대화 리스트 조회
async function getConversations(req, res, next) {
  try {
    const { userId, userRole } = req;
    const allParam = req.query.all === 'true';
    let conversations;
    if (userRole === 'ADMIN' && allParam) {
      conversations = await prisma.conversation.findMany({
        select: {
          id: true,
          title: true,
          updated_at: true,
          total_tokens: true,
          user: { select: { id: true, email: true } },
        },
        orderBy: { updated_at: 'desc' },
      });
    } else {
      conversations = await prisma.conversation.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          title: true,
          updated_at: true,
          total_tokens: true,
          user: { select: { id: true, email: true } },
        },
        orderBy: { updated_at: 'desc' },
      });
    }
    res.json(conversations);
  } catch (err) {
    next(err);
  }
}

// 개별 대화 조회
async function getConversation(req, res, next) {
  try {
    const { userId, userRole } = req;
    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: { 
        messages: { 
          orderBy: { created_at: 'asc' }, 
          select: { id: true, role: true, content: true, type: true, assetId: true, created_at: true } 
        },
        last_model: { select: { id: true, api_name: true, name: true, cost: true, is_inference_model: true, reasoning_effort: true } } 
      },
    });
    if (!conv) return res.sendStatus(404);
    if (userRole !== 'ADMIN' && conv.user_id !== userId) return res.sendStatus(403);
    res.json(conv);
  } catch (err) {
    next(err);
  }
}

// 대화 삭제
async function deleteConversation(req, res, next) {
  try {
    const { userId, userRole } = req;
    const conv = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conv) return res.sendStatus(404);
    if (userRole !== 'ADMIN' && conv.user_id !== userId) return res.sendStatus(403);
    await prisma.conversation.delete({ where: { id: req.params.id } });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

// 새로운 대화 생성 함수: user_id로 대화를 생성하고 UUID를 반환합니다.
async function createConversation(req, res, next) {
  try {
    const conv = await prisma.conversation.create({ data: { user_id: req.userId } });
    return res.status(201).json({ id: conv.id });
  } catch (err) {
    next(err);
  }
}

// 대화 제목 수정
async function updateConversationTitle(req, res, next) {
  try {
    const { userId, userRole } = req;
    const { id } = req.params;
    const { title } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'title은 비어 있을 수 없습니다.' });
    }
    const conv = await prisma.conversation.findUnique({ where: { id } });
    if (!conv) return res.sendStatus(404);
    if (userRole !== 'ADMIN' && conv.user_id !== userId) return res.sendStatus(403);
    const updated = await prisma.conversation.update({ where: { id }, data: { title: title.trim() } });
    res.json({ id: updated.id, title: updated.title });
  } catch (err) {
    next(err);
  }
}

module.exports = { getConversations, getConversation, deleteConversation, createConversation, updateConversationTitle }; 