import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"] }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

app.get("/", (_req, res) => {
    res.status(200).send("ClinicFlow API is running");
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API running on http://localhost:${port}`));