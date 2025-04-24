const express = require('express');
const authMiddleware = require('../auth/middleware');
const { adminOnly } = require('../users/middleware');
const validate = require('../middlewares/validate');
const { getGlobalConfig, updateGlobalConfig } = require('./controller');
const { body } = require('express-validator');

const router = express.Router();

// 전역 시스템 메시지 조회 (ADMIN)
router.get('/', authMiddleware, adminOnly, getGlobalConfig);

// 전역 시스템 메시지 수정 (ADMIN)
router.put(
  '/',
  authMiddleware,
  adminOnly,
  validate([ body('systemMessage').isString().withMessage('systemMessage must be string') ]),
  updateGlobalConfig
);

module.exports = router;
