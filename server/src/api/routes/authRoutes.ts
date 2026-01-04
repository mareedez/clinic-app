import { Router } from "express";
import { AuthService } from "../../application/services/auth/AuthService.js";

export function createAuthRouter() {
    const router = Router();
    const authService = new AuthService();

    router.post("/login", async (req, res, next) => {
        try {
            const result = await authService.login(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    });

    return router;
}