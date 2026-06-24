import { pool } from "../db/index.js";

// The app has no auth yet, so every request acts on behalf of one seeded
// "demo" user. Cached after first lookup to avoid a query per request.
let cachedUserId: string | null = null;

export async function getOrCreateDemoUser(): Promise<string> {
  if (cachedUserId) {
    return cachedUserId;
  }

  const existing = await pool.query("SELECT id FROM users LIMIT 1");
  if (existing.rows.length > 0) {
    const userId: string = existing.rows[0].id;
    cachedUserId = userId;
    return userId;
  }

  // ON CONFLICT + re-select handles the case where two concurrent requests
  // both find no user and race to create one.
  const inserted = await pool.query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id;`,
    ["user@dailynotescloud.com", "$2b$10$MOCKHASHPASSWORDPLACEHOLDER", "Demo User"]
  );

  if (inserted.rows.length > 0) {
    const userId: string = inserted.rows[0].id;
    cachedUserId = userId;
    return userId;
  }

  const retry = await pool.query("SELECT id FROM users LIMIT 1");
  const userId: string = retry.rows[0].id;
  cachedUserId = userId;
  return userId;
}
