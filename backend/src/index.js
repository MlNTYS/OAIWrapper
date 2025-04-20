const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const authRoutes = require('./auth/routes');
const userRoutes = require('./users/routes');
const errorHandler = require('./middlewares/errorHandler');
const cors = require('cors');
const chatRoutes = require('./chat/routes');
const modelRoutes = require('./models/routes');
const conversationRoutes = require('./conversations/routes');

dotenv.config();

const app = express();
const port = process.env.BACKEND_PORT || 3001;
const prisma = new PrismaClient();

// Trust proxy headers (for Express behind Traefik)
app.set('trust proxy', true);

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/conversations', conversationRoutes);

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