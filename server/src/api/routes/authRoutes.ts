import { Router } from "express";
import { AuthService } from "../../application/services/auth/AuthService.js";
import { RegisterPatient } from "../../application/services/auth/RegisterPatient.js";
import type {UserRepository} from "../../ports/repositories/UserRepository.js";

export function createAuthRouter(userRepo: UserRepository) {
    const router = Router();
    const authService = new AuthService();
    const registerService = new RegisterPatient(userRepo);

    router.post("/login", async (req, res, next) => {
        try {
            const result = await authService.login(req.body);
            res.status(200).json(result);
        } catch (error) {
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