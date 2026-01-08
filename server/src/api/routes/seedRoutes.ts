import express from "express";
import * as argon2 from "argon2";
import { UserRole } from "../../domain/users/UserEnum.js";
import type { UserRepository } from "../../ports/repositories/UserRepository.js";

export function createSeedRouter(userRepo: UserRepository) {
    const router = express.Router();

    // POST /api/seed/demo - Creates demo accounts
    // Call this ONCE after deployment
    router.post("/demo", async (req, res, next) => {
        try {
            console.log("🌱 Seeding demo accounts...");
            const passwordHash = await argon2.hash("Demo@12345");

            // Demo accounts to create
            const demoAccounts = [
                {
                    email: "demo.patient@clinic.local",
                    firstName: "Demo",
                    lastName: "Patient",
                    role: UserRole.PATIENT
                },
                {
                    email: "demo.doctor@clinic.local",
                    firstName: "Demo",
                    lastName: "Doctor",
                    role: UserRole.PHYSICIAN
                },
                {
                    email: "demo.desk@clinic.local",
                    firstName: "Demo",
                    lastName: "Desk",
                    role: UserRole.FRONT_DESK
                }
            ];

            const results = [];
            
            for (const account of demoAccounts) {
                try {
                    // Check if exists
                    const existing = await userRepo.findByEmail(account.email);
                    if (existing) {
                        results.push({
                            email: account.email,
                            status: "exists"
                        });
                        continue;
                    }

                    // For now, just return the data needed
                    // The actual user creation would require the domain User class
                    results.push({
                        email: account.email,
                        firstName: account.firstName,
                        lastName: account.lastName,
                        role: account.role,
                        passwordHash,
                        status: "ready"
                    });
                } catch (error) {
                    console.error(`Error processing ${account.email}:`, error);
                    results.push({
                        email: account.email,
                        status: "error",
                        error: (error as any).message
                    });
                }
            }

            res.json({
                message: "Use the SQL below to seed your database",
                password: "Demo@12345",
                passwordHash,
                sql: generateSQL(passwordHash),
                results
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
}

function generateSQL(passwordHash: string): string {
    return `
-- Copy and paste this into Neon Console SQL Editor

-- Delete existing users (careful!)
-- DELETE FROM "appointments";
-- DELETE FROM "physician_profiles";
-- DELETE FROM "patient_profiles";
-- DELETE FROM "users";

-- Insert demo users
INSERT INTO "users" ("id", "email", "passwordHash", "firstName", "lastName", "role", "isActive", "createdAt", "updatedAt") 
VALUES 
('pat-demo', 'demo.patient@clinic.local', '${passwordHash}', 'Demo', 'Patient', 'PATIENT', true, NOW(), NOW()),
('doc-demo', 'demo.doctor@clinic.local', '${passwordHash}', 'Demo', 'Doctor', 'PHYSICIAN', true, NOW(), NOW()),
('fd-demo', 'demo.desk@clinic.local', '${passwordHash}', 'Demo', 'Desk', 'FRONT_DESK', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert patient profile
INSERT INTO "patient_profiles" ("id", "userId", "phone", "dateOfBirth") 
VALUES ('patient-prof-1', 'pat-demo', '555-0101', '1990-01-01'::TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert physician profile
INSERT INTO "physician_profiles" ("id", "userId", "specialization", "workingHoursStart", "workingHoursEnd", "workingDays") 
VALUES ('physician-prof-1', 'doc-demo', 'General Practice', '09:00', '17:00', ARRAY[1,2,3,4,5])
ON CONFLICT DO NOTHING;
`;
}
