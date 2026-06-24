import { Router } from "express";
import { pool } from "../db/index.js";
import { HttpError } from "../middleware/errorHandler.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { createTaskSchema, idParamSchema, updateTaskSchema } from "../validation/schemas.js";

const router = Router();

router.get("/", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const result = await pool.query(
    `SELECT id, title, completed, created_at as "createdAt"
     FROM tasks
     WHERE user_id = $1
     ORDER BY created_at ASC;`,
    [userId]
  );
  res.json(result.rows);
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  const { title, completed } = createTaskSchema.parse(req.body);
  const userId = req.user!.id;

  const result = await pool.query(
    `INSERT INTO tasks (user_id, title, completed)
     VALUES ($1, $2, $3)
     RETURNING id, title, completed, created_at as "createdAt";`,
    [userId, title, completed]
  );
  res.status(201).json(result.rows[0]);
});

router.put("/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { completed } = updateTaskSchema.parse(req.body);
  const userId = req.user!.id;

  const result = await pool.query(
    `UPDATE tasks
     SET completed = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND user_id = $3
     RETURNING id, title, completed, created_at as "createdAt";`,
    [completed, id, userId]
  );

  if (result.rows.length === 0) {
    throw new HttpError(404, "Task not found");
  }
  res.json(result.rows[0]);
});

router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = idParamSchema.parse(req.params);
  const userId = req.user!.id;
  const result = await pool.query(
    "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id;",
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new HttpError(404, "Task not found");
  }
  res.json({ message: "Task deleted successfully", id });
});

export default router;
