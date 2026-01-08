#!/usr/bin/env node
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Starting database setup...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ NOT SET');

try {
    console.log('\n📊 Step 1: Running Prisma migrations...');
    try {
        execSync('npx prisma migrate deploy --skip-generate', {
            stdio: 'inherit',
            env: { ...process.env }
        });
        console.log('✅ Migrations completed\n');

        console.log('🌱 Step 2: Seeding database...');
        execSync('tsx prisma/seed.ts', {
            stdio: 'inherit',
            env: { ...process.env }
        });
        console.log('✅ Database seeded\n');
    } catch (migrationError) {
        console.warn('⚠️  Migrations may have failed, continuing anyway...');
        console.warn('ℹ️  Hint: You can manually seed by running: npm run seed\n');
    }

    console.log('✅ Setup phase completed! Server starting now...');
    process.exit(0);
} catch (error) {
    console.error('\n❌ Critical error:', error.message);
    process.exit(1);
}
