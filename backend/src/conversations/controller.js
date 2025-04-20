const prisma = require('../prisma');

// 대화 리스트 조회
async function getConversations(req, res, next) {
  try {
    const { userId, userRole } = req;
    let conversations;
    if (userRole === 'ADMIN') {
      conversations = await prisma.conversation.findMany({
        select: { id: true, title: true, updated_at: true },
        orderBy: { updated_at: 'desc' },
      });
    } else {
      conversations = await prisma.conversation.findMany({
        where: { user_id: userId },
        select: { id: true, title: true, updated_at: true },
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
      include: { messages: { orderBy: { created_at: 'asc' }, select: { id: true, role: true, content: true, created_at: true } } },
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

module.exports = { getConversations, getConversation, deleteConversation }; 