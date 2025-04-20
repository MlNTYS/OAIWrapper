const express = require('express');
const validate = require('../middlewares/validate');
const authMiddleware = require('../auth/middleware');
const { createUserRules, updateUserRules, idParamRule } = require('./validation');
const { adminOnly, ownerOrAdmin } = require('./middleware');
const { getUsers, getUser, createUser, updateUser, deleteUser } = require('./controller');

const router = express.Router();

// 전체 유저 조회 (ADMIN)
router.get('/', authMiddleware, adminOnly, getUsers);

// 개별 유저 조회 (ADMIN or 본인)
router.get('/:id', authMiddleware, validate(idParamRule), ownerOrAdmin, getUser);

// 유저 생성 (ADMIN)
router.post('/', authMiddleware, adminOnly, validate(createUserRules), createUser);

// 유저 수정 (ADMIN or 본인)
router.patch('/:id', authMiddleware, validate(idParamRule), ownerOrAdmin, validate(updateUserRules), updateUser);

// 유저 삭제 (ADMIN)
router.delete('/:id', authMiddleware, validate(idParamRule), adminOnly, deleteUser);

module.exports = router; 