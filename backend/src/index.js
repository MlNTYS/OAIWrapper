const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.BACKEND_PORT || 3001;
const prisma = new PrismaClient();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// 필요시 Prisma 연결 해제 처리
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
}); 