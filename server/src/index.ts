import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Middleware
import { errorHandler } from "./api/middleware/errorHandler.js";
import { authMiddleware } from "./api/middleware/auth.js";

// Routes & Repos
import { createAppointmentRouter } from "./api/routes/appointmentRoutes.js";
import { InMemoryAppointmentRepository } from "./infrastructure/persistence/InMemoryAppointmentRepository.js";
import {createAuthRouter} from "./api/routes/authRoutes.js";
import {InMemoryUserRepository} from "./infrastructure/persistence/InMemoryUserRepository.js";

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";


app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173" || "http://127.0.0.1:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use(helmet());
app.use(express.json());
app.use(morgan(isProduction ? "combined" : "dev"));


const appointmentRepo = new InMemoryAppointmentRepository();
const userRepo = new InMemoryUserRepository();
const appointmentRouter = createAppointmentRouter(appointmentRepo, userRepo);
const authRouter = createAuthRouter(userRepo);

app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/", (_req, res) => {
    res.status(200).send("ClinicFlow API is running");
});

app.use("/api/auth", authRouter);
app.use("/api/appointments", authMiddleware, appointmentRouter);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
    console.log(`
    🚀 Server is running!
    📡 URL: http://localhost:${port}
    🔧 Environment: ${process.env.NODE_ENV ?? 'not set'}
    `);
});