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

// Routes & Repos
import { createAppointmentRouter } from "./api/routes/appointmentRoutes.js";
import { createAuthRouter } from "./api/routes/authRoutes.js";
import { InMemoryAppointmentRepository } from "./infrastructure/persistence/InMemoryAppointmentRepository.js";
import { InMemoryUserRepository } from "./infrastructure/persistence/InMemoryUserRepository.js";

dotenv.config();

//Core Init
const app = express();
const httpServer = createServer(app);

const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 4000);


const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
    : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4000"];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
});

app.set("io", io);

//Middleware Stack
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
            "connect-src": ["'self'", "ws://localhost:4000", "http://localhost:4000", ...allowedOrigins],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(morgan(isProduction ? "combined" : "dev"));

//Repositories & Routing
const appointmentRepo = new InMemoryAppointmentRepository();
const userRepo = new InMemoryUserRepository();

const appointmentRouter = createAppointmentRouter(appointmentRepo, userRepo);
const authRouter = createAuthRouter(userRepo);

// Base Routes
app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
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
    });

    socket.on("disconnect", () => {
    });
});


httpServer.listen(port, () => {
    console.log(`
    🚀 Server & WebSockets are running!
    📡 URL: http://localhost:${port}
    🔧 Environment: ${process.env.NODE_ENV ?? 'development'}
    `);
});
