import express from "express";
const { Router } = express;
import { AuthService } from "../../application/services/auth/AuthService.js";
import { RegisterPatient } from "../../application/services/auth/RegisterPatient.js";
import type { UserRepository } from "../../ports/repositories/UserRepository.js";
import { UserMapper } from "../../domain/users/UserMapper.js";

export function createAuthRouter(
    authService: AuthService,
    userRepo: UserRepository,
    userMapper: UserMapper
) {
    const router = Router();
    const registerService = new RegisterPatient(userRepo, userMapper);

    console.log("✅ Auth router created");

    router.post("/login", async (req, res, next) => {
        console.log("📝 POST /login received", { body: req.body });
        try {
            const result = await authService.login(req.body);
            res.status(200).json(result);
        } catch (error) {
            console.error("❌ Login error:", error);
            next(error);
        }
    });

    router.post("/register-patient", async (req, res, next) => {
        try {
            const result = await registerService.execute(req.body);
            res.status(201).json(result);
        } catch (error) { next(error); }
    });

    return router;
}
