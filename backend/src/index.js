const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const authRoutes = require('./auth/routes');
const userRoutes = require('./users/routes');
const errorHandler = require('./middlewares/errorHandler');
const helmet = require('helmet');
const cors = require('cors');
const csurf = require('csurf');
const chatRoutes = require('./chat/routes');
const modelRoutes = require('./models/routes');
const conversationRoutes = require('./conversations/routes');

dotenv.config();

const app = express();
const port = process.env.BACKEND_PORT || 3001;
const prisma = new PrismaClient();

// Trust first proxy (Traefik) for correct IP and rate-limit
app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// CSRF protection for admin routes
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/api' } });
function setCsrfCookie(req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken(), { httpOnly: false, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' });
  next();
}

// Auth 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', csrfProtection, setCsrfCookie, chatRoutes);
app.use('/api/models', csrfProtection, setCsrfCookie, modelRoutes);
app.use('/api/conversations', csrfProtection, setCsrfCookie, conversationRoutes);

// 에러 핸들러 등록
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// 필요시 Prisma 연결 해제 처리
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
}); 