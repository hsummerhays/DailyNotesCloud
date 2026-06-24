import { Router } from "express";
import { pool } from "../db/index.js";
import { HttpError } from "../middleware/errorHandler.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { createNoteSchema, idParamSchema, updateNoteSchema } from "../validation/schemas.js";

const router = Router();

async function applyTags(client: import("pg").PoolClient, noteId: string, tags: string[]) {
  const cleanTags: string[] = [];
  for (const rawTag of tags) {
    const cleanTagName = rawTag.toLowerCase();

    const tagRes = await client.query(
      `INSERT INTO tags (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [cleanTagName]
    );
    const tagId = tagRes.rows[0].id;

    await client.query(
      `INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
      [noteId, tagId]
    );
    cleanTags.push(cleanTagName);
  }
  return cleanTags;
}

router.get("/", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const result = await pool.query(
    `SELECT n.id, n.title, n.content, n.created_at as "createdAt",
            COALESCE(json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]') as tags
     FROM notes n
     LEFT JOIN note_tags nt ON n.id = nt.note_id
     LEFT JOIN tags t ON nt.tag_id = t.id
     WHERE n.user_id = $1
     GROUP BY n.id
     ORDER BY n.created_at DESC;`,
    [userId]
  );
  res.json(result.rows);
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  const { title, content, tags } = createNoteSchema.parse(req.body);
  const userId = req.user!.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const noteRes = await client.query(
      `INSERT INTO notes (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING id, title, content, created_at as "createdAt";`,
      [userId, title, content]
    );
    const note = noteRes.rows[0];
    note.tags = await applyTags(client, note.id, tags);

    await client.query("COMMIT");
    res.status(201).json(note);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

router.put("/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = idParamSchema.parse(req.params);
  const updates = updateNoteSchema.parse(req.body);
  const userId = req.user!.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.title !== undefined) {
      setClauses.push(`title = $${values.length + 1}`);
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      setClauses.push(`content = $${values.length + 1}`);
      values.push(updates.content);
    }
    setClauses.push("updated_at = CURRENT_TIMESTAMP");

    const noteRes = await client.query(
      `UPDATE notes SET ${setClauses.join(", ")}
       WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
       RETURNING id, title, content, created_at as "createdAt";`,
      [...values, id, userId]
    );

    if (noteRes.rows.length === 0) {
      throw new HttpError(404, "Note not found");
    }

    const note = noteRes.rows[0];

    if (updates.tags !== undefined) {
      await client.query("DELETE FROM note_tags WHERE note_id = $1;", [id]);
      note.tags = await applyTags(client, id, updates.tags);
    } else {
      const tagRes = await client.query(
        `SELECT t.name FROM tags t
         JOIN note_tags nt ON nt.tag_id = t.id
         WHERE nt.note_id = $1
         ORDER BY t.name;`,
        [id]
      );
      note.tags = tagRes.rows.map((row: { name: string }) => row.name);
    }

    await client.query("COMMIT");
    res.json(note);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = idParamSchema.parse(req.params);
  const userId = req.user!.id;
  const result = await pool.query(
    "DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id;",
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new HttpError(404, "Note not found");
  }
  res.json({ message: "Note deleted successfully", id });
});

export default router;
