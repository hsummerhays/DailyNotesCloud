import { Router } from "express";
import { pool } from "../db/index.js";

const router = Router();

// Liveness: is the process itself alive? No external dependencies, so a
// transient database blip never causes Kubernetes to restart a healthy pod.
router.get("/live", (req, res) => {
  res.json({ status: "ok" });
});

// Readiness: can this pod actually serve traffic right now?
router.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[health] Database check failed:", err);
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

export default router;
