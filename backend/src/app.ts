import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/index.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Helper to retrieve the default demo user, creating one if not exists
async function getOrCreateDemoUser() {
  try {
    const res = await pool.query("SELECT id FROM users LIMIT 1");
    if (res.rows.length > 0) {
      return res.rows[0].id;
    }
    const insertRes = await pool.query(
      `INSERT INTO users (email, password_hash, display_name) 
       VALUES ($1, $2, $3) 
       RETURNING id;`,
      ["user@dailynotescloud.com", "$2b$10$MOCKHASHPASSWORDPLACEHOLDER", "Demo User"]
    );
    return insertRes.rows[0].id;
  } catch (err) {
    console.error("[db]: Error fetching or creating demo user", err);
    throw err;
  }
}

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    // Basic query to verify db connectivity
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected", error: (err as Error).message });
  }
});

// Root API Endpoint
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to the DailyNotesCloud API" });
});

// Notes Endpoints
app.get("/api/notes", async (req, res) => {
  try {
    const userId = await getOrCreateDemoUser();
    const queryText = `
      SELECT n.id, n.title, n.content, n.created_at as "createdAt",
             COALESCE(json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]') as tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE n.user_id = $1
      GROUP BY n.id
      ORDER BY n.created_at DESC;
    `;
    const result = await pool.query(queryText, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/notes", async (req, res) => {
  const { title, content, tags = [] } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userId = await getOrCreateDemoUser();

    // 1. Insert Note
    const noteRes = await client.query(
      `INSERT INTO notes (user_id, title, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, title, content, created_at as "createdAt";`,
      [userId, title, content]
    );
    const note = noteRes.rows[0];
    note.tags = [];

    // 2. Associate Tags
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const cleanTagName = tagName.trim().toLowerCase();
        if (!cleanTagName) continue;

        // Insert tag if it doesn't exist
        const tagRes = await client.query(
          `INSERT INTO tags (name) VALUES ($1) 
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id;`,
          [cleanTagName]
        );
        const tagId = tagRes.rows[0].id;

        // Associate note and tag
        await client.query(
          `INSERT INTO note_tags (note_id, tag_id) 
           VALUES ($1, $2) 
           ON CONFLICT DO NOTHING;`,
          [note.id, tagId]
        );
        note.tags.push(cleanTagName);
      }
    }

    await client.query("COMMIT");
    res.status(201).json(note);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    const userId = await getOrCreateDemoUser();
    const result = await pool.query(
      "DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id;",
      [req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json({ message: "Note deleted successfully", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Tasks Endpoints
app.get("/api/tasks", async (req, res) => {
  try {
    const userId = await getOrCreateDemoUser();
    const result = await pool.query(
      `SELECT id, title, completed, created_at as "createdAt" 
       FROM tasks 
       WHERE user_id = $1 
       ORDER BY created_at ASC;`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/tasks", async (req, res) => {
  const { title, completed = false } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const userId = await getOrCreateDemoUser();
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, completed) 
       VALUES ($1, $2, $3) 
       RETURNING id, title, completed, created_at as "createdAt";`,
      [userId, title, completed]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  const { completed } = req.body;
  if (completed === undefined) {
    return res.status(400).json({ error: "Completed status is required" });
  }

  try {
    const userId = await getOrCreateDemoUser();
    const result = await pool.query(
      `UPDATE tasks 
       SET completed = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 
       RETURNING id, title, completed, created_at as "createdAt";`,
      [completed, req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const userId = await getOrCreateDemoUser();
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id;",
      [req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default app;
