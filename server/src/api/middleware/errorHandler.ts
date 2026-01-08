import express from "express";
import { ZodError } from "zod";
import { UseCaseError } from "../../application/services/appointments/errors.js";

type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    const requestId = (_req as any).ctx?.requestId;
    const message = err.message;
    const name = err.name;

    console.error(`[Error] ${name}: ${message}`, { requestId, err });

    if (err instanceof ZodError) {
        return res.status(400).json({
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            requestId,
            details: err.issues.map(e => ({ path: e.path, message: e.message }))
        });
    }

    if (err instanceof UseCaseError) {
        const statusMap: Record<string, number> = {
            "NOT_FOUND": 404,
            "FORBIDDEN": 403,
            "UNAUTHORIZED": 401,
            "VALIDATION_ERROR": 400,
            "CONFLICT": 409
        };
        return res.status(statusMap[err.code] || 400).json({
            code: err.code,
            message: err.message,
            requestId
        });
    }

    return res.status(500).json({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        requestId
    });
}
