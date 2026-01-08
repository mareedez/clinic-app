#!/usr/bin/env tsx
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function migrate() {
    try {
        console.log('🔄 Starting database setup...');
        
        // Verify DATABASE_URL
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set!');
        }
        console.log('✅ DATABASE_URL is set');

        // Run migrations
        console.log('📊 Running Prisma migrations...');
        await execAsync('npx prisma migrate deploy --skip-generate');
        console.log('✅ Migrations completed');

        // Run seed
        console.log('🌱 Seeding database...');
        await execAsync('tsx prisma/seed.ts');
        console.log('✅ Database seeded');

        console.log('✅ Database setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

migrate();
