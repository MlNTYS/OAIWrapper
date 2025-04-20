const express = require('express');
const validate = require('../middlewares/validate');
const { createModelRules, updateModelRules, idParamRule } = require('./validation');
const authMiddleware = require('../auth/middleware');
const { adminOnly } = require('../users/middleware');
const { getAvailableModels, createModel, updateModel, deleteModel } = require('./controller');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// 사용가능 모델 조회 (rate limit 적용)
router.get('/', rateLimit({ windowMs: 60 * 1000, max: 30 }), authMiddleware, getAvailableModels);

// 모델 생성 (ADMIN)
router.post('/', authMiddleware, adminOnly, validate(createModelRules), createModel);

// 모델 수정 (ADMIN)
router.patch('/:id', authMiddleware, validate(idParamRule), adminOnly, validate(updateModelRules), updateModel);

// 모델 삭제 (ADMIN)
router.delete('/:id', authMiddleware, validate(idParamRule), adminOnly, deleteModel);

module.exports = router; 