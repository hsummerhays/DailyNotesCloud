import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";
import notesRouter from "./routes/notes.js";
import tasksRouter from "./routes/tasks.js";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Generous but bounded: protects against abuse without affecting normal use.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.use(healthRouter);

app.get("/api", (req, res) => {
  res.json({ message: "Welcome to the DailyNotesCloud API" });
});

app.use("/api/notes", notesRouter);
app.use("/api/tasks", tasksRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
