const express = require('express');
const validate = require('../middlewares/validate');
const { idParamRule } = require('./validation');
const authMiddleware = require('../auth/middleware');
const { getConversations, getConversation, deleteConversation, createConversation } = require('./controller');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// 대화 생성 (rate limit 적용)
router.post('/', rateLimit({ windowMs: 60 * 1000, max: 30 }), authMiddleware, createConversation);

// 대화 리스트 조회 (rate limit 적용)
router.get('/', rateLimit({ windowMs: 60 * 1000, max: 30 }), authMiddleware, getConversations);

// 대화 상세 조회 (ADMIN or 본인)
router.get('/:id', authMiddleware, validate(idParamRule), getConversation);

// 대화 삭제 (ADMIN or 본인)
router.delete('/:id', authMiddleware, validate(idParamRule), deleteConversation);

module.exports = router; 