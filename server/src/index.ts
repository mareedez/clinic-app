import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

// Middleware
import { errorHandler } from "./api/middleware/errorHandler.js";
import { authMiddleware } from "./api/middleware/auth.js";

// Domain & Application Layers
import { UserMapper } from "./domain/users/UserMapper.js";
import { AppointmentMapper } from "./application/services/appointments/AppointmentMapper.js";


// Infrastructure Layer (PostgreSQL)
import { PostgresUserRepository } from "./infrastructure/persistence/PostgresUserRepository.js";
import { PostgresAppointmentRepository } from "./infrastructure/persistence/PostgresAppointmentRepository.js";

// Routes
import { createAppointmentRouter } from "./api/routes/appointmentRoutes.js";
import { createAuthRouter } from "./api/routes/authRoutes.js";
import {AuthService} from "./application/services/auth/AuthService.js";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === "production") {
    throw new Error("FATAL: JWT_SECRET environment variable is required in production");
}
const FINAL_JWT_SECRET = jwtSecret ?? "dev-insecure-secret-key";

//Core Init
const app = express();
const httpServer = createServer(app);
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 4000);

// Websockets & CORS
const corsOriginString = process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174,http://localhost:4000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:4000";
const allowedOrigins = corsOriginString.split(",").map(o => o.trim()).filter(Boolean);

// CORS origin validation function to support wildcards
const corsOriginValidator = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    try {
        // Allow no origin (same-origin requests)
        if (!origin) {
            console.log(`CORS: No origin header (same-origin request)`);
            return callback(null, true);
        }

        // Check exact matches
        if (allowedOrigins.includes(origin)) {
            console.log(`CORS: ✓ Allowed (exact match): ${origin}`);
            return callback(null, true);
        }

        // Check wildcard patterns (e.g., *.netlify.app)
        for (const allowedOrigin of allowedOrigins) {
            if (allowedOrigin.includes("*")) {
                // Build pattern: escape special chars, then replace * with regex pattern
                const pattern = "^" + allowedOrigin
                    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")  // Escape all special regex chars first
                    .replace(/\\\*/g, "[a-zA-Z0-9-]+") + "$";  // Then replace escaped * with pattern

                try {
                    const regex = new RegExp(pattern);
                    console.log(`CORS: Testing "${origin}" against pattern "${pattern}"`);
                    if (regex.test(origin)) {
                        console.log(`CORS: ✓ Allowed (wildcard match)`);
                        return callback(null, true);
                    }
                } catch (regexError) {
                    console.warn(`CORS: Invalid regex pattern "${allowedOrigin}":`, regexError);
                }
            }
        }

        // Not allowed
        console.warn(`CORS: ✗ Rejected (no match): ${origin}`);
        callback(null, false);
    } catch (error) {
        console.error("CORS validation error:", error);
        // On error, reject (safer than allowing)
        callback(null, false);
    }
};

const io = new Server(httpServer, {
    cors: {
        origin: corsOriginValidator,
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true
    },
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000
});

app.set("io", io);

// Middleware Stack
// Log CORS configuration
console.log(`🔐 CORS Configuration: Allowed origins: ${allowedOrigins.join(", ")}`);

app.use(cors({
    origin: corsOriginValidator,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200 // For legacy browser compatibility
}));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "connect-src": ["'self'", "ws:", "wss:", "http:", "https:", "localhost:*", "127.0.0.1:*"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json());
app.use(morgan(isProduction ? "combined" : "dev"));

//Repositories & Routing
const userMapper = new UserMapper();
const userRepo = new PostgresUserRepository(userMapper);
const appointmentMapper = new AppointmentMapper(userRepo);
const appointmentRepo = new PostgresAppointmentRepository(appointmentMapper);
const authService = new AuthService(userRepo, userMapper, FINAL_JWT_SECRET);

console.log("🚀 Creating routers...");
const appointmentRouter = createAppointmentRouter(appointmentRepo, userRepo, userMapper);
const authRouter = createAuthRouter(authService, userRepo, userMapper);

console.log("📌 Registering routes...");
app.use("/api/auth", authRouter);
console.log("✅ /api/auth route registered");
app.use("/api/appointments", authMiddleware, appointmentRouter);
console.log("✅ /api/appointments route registered");

// Base Routes
app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), database: "connected" });
});

app.get("/", (_req, res) => {
    res.status(200).send("ClinicFlow API is running with WebSockets");
});

// 404 Handler (catch-all for unmatched routes)
app.use((req, res) => {
    console.warn(`⚠️ 404: ${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        url: req.url
    });
    res.status(404).json({
        code: "NOT_FOUND",
        message: `Cannot ${req.method} ${req.path}`,
        path: req.path,
        method: req.method
    });
});

// Error Handling
app.use(errorHandler);

// WebSockets
io.on("connection", (socket) => {
    socket.on("authenticate", (data: { roles: string[], userId: string }) => {
        if (data.roles.includes("FRONT_DESK")) {
            socket.join("front-desk");
        }

        if (data.roles.includes("PHYSICIAN")) {
            socket.join("physicians");
            socket.join(`physician-${data.userId}`);
        }

        if (data.roles.includes("PATIENT")) {
            socket.join(`patient-${data.userId}`);
        }
    });

    socket.on("disconnect", () => {
    });
});


httpServer.listen(port, () => {
    console.log(`
    🚀 Server & WebSockets are running!
    📡 URL: http://localhost:${port}
    🔧 Environment: ${process.env.NODE_ENV ?? 'development'}
    🔑 Auth: Argon2 + JWT
    `);
});
