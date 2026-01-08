import 'dotenv/config';
import * as argon2 from 'argon2';
import { UserRole } from "../src/generated/prisma/enums.js";
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import { PrismaClient } from "../src/generated/prisma/client.js";


const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({adapter});




async function main() {
    console.log('--- Starting Database Seeding ---');
    const passwordHash = await argon2.hash("Demo@12345");

    // 1. Doctors
    const doctors = [
        { id: "doc-demo", email: "demo.doctor@clinic.local", first: "Demo", last: "Doctor", spec: "General Practice" },
        { id: "doc-001", email: "dr.smith@clinic.com", first: "John", last: "Smith", spec: "Cardiology" },
        { id: "doc-002", email: "dr.johnson@clinic.com", first: "Sarah", last: "Johnson", spec: "Pediatrics" },
        { id: "doc-003", email: "dr.chen@clinic.com", first: "Michael", last: "Chen", spec: "Dermatology" },
    ];

    for (const doc of doctors) {
        await prisma.user.upsert({
            where: { id: doc.id },
            update: { email: doc.email },
            create: {
                id: doc.id,
                email: doc.email,
                passwordHash,
                firstName: doc.first,
                lastName: doc.last,
                role: UserRole.PHYSICIAN,
                physicianProfile: {
                    create: {
                        specialization: doc.spec,
                        workingDays: [1, 2, 3, 4, 5],
                        workingHoursStart: "09:00",
                        workingHoursEnd: "17:00"
                    }
                }
            }
        });
    }

    // 2. Patients
    const patients = [
        { id: "pat-demo", email: "demo.patient@clinic.local", first: "Demo", last: "Patient" },
        { id: "pat-001", email: "john.doe@example.com", first: "John", last: "Doe" },
        { id: "pat-002", email: "jane.smith@example.com", first: "Jane", last: "Smith" },
        { id: "pat-003", email: "bob.wilson@example.com", first: "Robert", last: "Wilson" },
    ];

    for (const pat of patients) {
        await prisma.user.upsert({
            where: { id: pat.id },
            update: { email: pat.email },
            create: {
                id: pat.id,
                email: pat.email,
                passwordHash,
                firstName: pat.first,
                lastName: pat.last,
                role: UserRole.PATIENT,
                patientProfile: {
                    create: {
                        phone: `555-010${patients.indexOf(pat)}`,
                        dateOfBirth: new Date(1980 + patients.indexOf(pat), 0, 1)
                    }
                }
            }
        });
    }

    // 3. Front Desk
    await prisma.user.upsert({
        where: { id: "fd-demo" },
        update: { email: 'demo.desk@clinic.local' },
        create: {
            id: "fd-demo",
            email: 'demo.desk@clinic.local',
            firstName: 'Demo',
            lastName: 'Desk',
            passwordHash,
            role: UserRole.FRONT_DESK,
            isActive: true
        },
    });

    console.log(`--- Seed completed successfully ---`);
}

main()
    .catch((e) => {
        console.error('Seed Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });