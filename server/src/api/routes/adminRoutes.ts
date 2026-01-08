import express from "express";
import * as argon2 from "argon2";
import { UserRole } from "../../domain/users/UserEnum.js";
import type { UserRepository } from "../../ports/repositories/UserRepository.js";
import { UserMapper } from "../../domain/users/UserMapper.js";
import { User } from "../../domain/users/User.js";
import { UserId } from "../../domain/common/id.js";

export function createAdminRouter(userRepo: UserRepository, userMapper: UserMapper) {
    const router = express.Router();

    // Seed database endpoint - call once to populate demo data
    // WARNING: This is for development/testing only!
    router.post("/seed", async (req, res, next) => {
        try {
            console.log("🌱 Seeding database with demo accounts...");
            const passwordHash = await argon2.hash("Demo@12345");

            // Demo accounts
            const accounts = [
                {
                    id: "pat-demo",
                    email: "demo.patient@clinic.local",
                    firstName: "Demo",
                    lastName: "Patient",
                    role: UserRole.PATIENT
                },
                {
                    id: "doc-demo",
                    email: "demo.doctor@clinic.local",
                    firstName: "Demo",
                    lastName: "Doctor",
                    role: UserRole.PHYSICIAN
                },
                {
                    id: "fd-demo",
                    email: "demo.desk@clinic.local",
                    firstName: "Demo",
                    lastName: "Desk",
                    role: UserRole.FRONT_DESK
                }
            ];

            let createdCount = 0;
            for (const account of accounts) {
                try {
                    // Check if user exists
                    const existing = await userRepo.findByEmail(account.email);
                    if (existing) {
                        console.log(`⏭️  User already exists: ${account.email}`);
                        continue;
                    }

                    // Create user domain object
                    const user = new User(
                        new UserId(account.id),
                        account.email,
                        passwordHash,
                        account.firstName,
                        account.lastName,
                        account.role,
                        true,
                        new Date(),
                        new Date()
                    );

                    // Save user
                    await userRepo.save(user);
                    console.log(`✅ Created: ${account.email}`);
                    createdCount++;
                } catch (error) {
                    console.error(`⚠️  Failed to create ${account.email}:`, error);
                }
            }

            res.status(200).json({
                message: "Database seeded successfully",
                created: createdCount,
                accounts: accounts.map(a => ({ email: a.email, password: "Demo@12345" }))
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
}
