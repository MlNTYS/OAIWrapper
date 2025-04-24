const prisma = require('../prisma');

// 전역 시스템 메시지 조회
async function getGlobalConfig(req, res, next) {
  try {
    const config = await prisma.globalConfig.findUnique({ where: { id: 1 } });
    res.json(config);
  } catch (err) {
    next(err);
  }
}

// 전역 시스템 메시지 업데이트
async function updateGlobalConfig(req, res, next) {
  try {
    const { systemMessage } = req.body;
    const config = await prisma.globalConfig.upsert({
      where: { id: 1 },
      update: { systemMessage },
      create: { id: 1, systemMessage },
    });
    res.json(config);
  } catch (err) {
    next(err);
  }
}

module.exports = { getGlobalConfig, updateGlobalConfig };
