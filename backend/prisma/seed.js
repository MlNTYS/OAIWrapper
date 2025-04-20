"use strict";

const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

async function main() {
  // Roles 테이블에 ADMIN, USER 레코드가 있는지 확인하고 없으면 생성
  await prisma.role.upsert({
    where: { id: 'ADMIN' },
    update: {},
    create: { id: 'ADMIN', name: 'ADMIN' },
  });
  await prisma.role.upsert({
    where: { id: 'USER' },
    update: {},
    create: { id: 'USER', name: 'USER' },
  });

  const adminPassword = await argon2.hash('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password_hash: adminPassword,
      is_verified: true,
      current_credit: 1000,
      role: { connect: { id: 'ADMIN' } },
    },
  });
  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 