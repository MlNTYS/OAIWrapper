const express = require('express');
const prisma = require('../prisma');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { createAccessToken, createRefreshToken, parseExpiresIn } = require('./utils');
const authMiddleware = require('./middleware');
const validate = require('../middlewares/validate');
const { check } = require('express-validator');

const router = express.Router();

// 로그인
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await argon2.verify(user.password_hash, password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const expiresAt = new Date(Date.now() + parseExpiresIn(process.env.REFRESH_TOKEN_EXPIRES_IN));

  await prisma.session.create({ data: { user_id: user.id, refresh_token: refreshToken, expires_at: expiresAt } });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: parseExpiresIn(process.env.REFRESH_TOKEN_EXPIRES_IN),
    sameSite: 'none',
    path: '/api/auth/refresh',
  });
  return res.json({ accessToken });
});

// 로그아웃
router.post('/logout', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) await prisma.session.deleteMany({ where: { refresh_token: token } });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh', sameSite: 'none', secure: process.env.NODE_ENV === 'production' });
  return res.sendStatus(204);
});

// 토큰 재발급
router.post('/refresh', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET);
  } catch {
    return res.sendStatus(401);
  }
  const session = await prisma.session.findUnique({ where: { refresh_token: token } });
  if (!session || session.expires_at < new Date()) return res.sendStatus(401);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return res.sendStatus(401);

  const accessToken = createAccessToken(user);
  return res.json({ accessToken });
});

// 내 정보 조회
router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, is_verified: true, role_id: true, current_credit: true } });
  if (!user) return res.sendStatus(404);
  return res.json(user);
});

// 비밀번호 변경
router.put(
  '/me/password',
  authMiddleware,
  validate([
    check('currentPassword').notEmpty().withMessage('현재 비밀번호를 입력해주세요'),
    check('newPassword').isLength({ min: 8 }).withMessage('새 비밀번호는 최소 8자 이상이어야 합니다'),
  ]),
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      // 현재 비밀번호 확인
      const valid = await argon2.verify(user.password_hash, currentPassword);
      if (!valid) return res.status(400).json({ error: '현재 비밀번호가 일치하지 않습니다' });
      // 새 비밀번호 해싱 및 저장
      const hash = await argon2.hash(newPassword);
      await prisma.user.update({ where: { id: req.userId }, data: { password_hash: hash } });
      return res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;