import express from "express";
import jwt from "jsonwebtoken";

type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;

export interface AuthenticatedRequest extends Request {
    headers: Record<string, any>;
    query: Record<string, any>;
    params: Record<string, any>;
    body: any;
    context?: {
        userId: string;
        roles: string[];
    };
}


declare global {
    namespace Express {
        interface Request {
            context?: {
                userId: string;
                roles: string[];
            };
        }
    }
}

export function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return _res.status(401).json({ code: "UNAUTHORIZED", message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("CRITICAL: JWT_SECRET is not defined in .env");
        return _res.status(500).json({ message: "Internal server security error" });
    }

    try {
        const decoded = jwt.verify(token!, secret) as any;

        req.context = {
            userId: decoded.sub || decoded.userId,
            roles: decoded.roles || []
        };
        
        next();
    } catch (error: any) {
        return _res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid or expired token" });
    }
}
