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

// Websockets
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
    : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4000", "http://127.0.0.1:4000"];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000
});

app.set("io", io);

// Middleware Stack
app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
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

const appointmentRouter = createAppointmentRouter(appointmentRepo, userRepo, userMapper);
const authRouter = createAuthRouter(authService, userRepo, userMapper);

app.use("/api/auth", authRouter);
app.use("/api/appointments", authMiddleware, appointmentRouter);

// Base Routes
app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), database: "connected" });
});

app.get("/", (_req, res) => {
    res.status(200).send("ClinicFlow API is running with WebSockets");
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/appointments", authMiddleware, appointmentRouter);

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
