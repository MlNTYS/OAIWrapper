#!/usr/bin/env sh
set -e

# Postgres 준비 시간 확보
sleep 5

echo "Pushing Prisma schema to database..."
npx prisma db push

echo "Generating Prisma client..."
npx prisma generate

echo "Seeding database..."
npm run seed

echo "Starting application..."
exec npm run start 