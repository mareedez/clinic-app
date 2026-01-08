#!/bin/bash
set -e

echo "🔧 Setting up database..."
echo "DATABASE_URL: $DATABASE_URL"

# Run migrations
echo "📊 Running Prisma migrations..."
npx prisma migrate deploy --skip-generate

# Run seed
echo "🌱 Seeding database..."
tsx --env-file=.env prisma/seed.ts

echo "✅ Setup completed!"
