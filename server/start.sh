#!/bin/bash
set -e

echo "🚀 ClinicFlow Server Startup"
echo "📡 DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "🔐 CORS_ORIGIN: $CORS_ORIGIN"
echo "🔧 NODE_ENV: $NODE_ENV"

echo ""
echo "📊 Running Prisma migrations..."
npx prisma migrate deploy

echo ""
echo "🌱 Seeding database..."
tsx prisma/seed.ts

echo ""
echo "✅ Database setup complete. Starting server..."
node dist/index.js
