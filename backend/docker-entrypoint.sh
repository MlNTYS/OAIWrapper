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

echo "Creating and checking image directory..."
mkdir -p "$IMAGE_DIR"
ls -la "$IMAGE_DIR"
echo "IMAGE_DIR=$IMAGE_DIR"

echo "Starting application..."
exec npm run start 