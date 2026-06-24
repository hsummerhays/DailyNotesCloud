import { pool } from "./index.js";

// Assumes migrations have already been applied (npm run migrate:up).
async function seedDatabase() {
  try {
    // Check if a seed user already exists
    const userCheck = await pool.query("SELECT id FROM users LIMIT 1;");
    if (userCheck.rows.length > 0) {
      console.log("[seed]: Database already contains data. Skipping seeding.");
      return;
    }

    console.log("[seed]: Seeding default data...");

    // 1. Insert Default User (Password hash is a mock placeholder)
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id;`,
      ["user@dailynotescloud.com", "$2b$10$MOCKHASHPASSWORDPLACEHOLDER", "Demo User"]
    );
    const userId = userResult.rows[0].id;
    console.log(`[seed]: Created default user with ID: ${userId}`);

    // 2. Insert Default Tags
    const tags = ["gcp", "gke", "docker", "postgres", "secrets"];
    const tagIds: Record<string, string> = {};

    for (const tag of tags) {
      const tagResult = await pool.query(
        `INSERT INTO tags (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id;`,
        [tag]
      );
      tagIds[tag] = tagResult.rows[0].id;
    }
    console.log("[seed]: Created default tags.");

    // 3. Insert Default Notes
    const note1 = await pool.query(
      `INSERT INTO notes (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING id;`,
      [
        userId,
        "DailyNotesCloud Architectural Design",
        "This project showcases a TypeScript monorepo combining a Next.js client with an Express API. In production, GKE orchestrates the frontend and backend, connecting to a private Cloud SQL PostgreSQL database."
      ]
    );

    const note2 = await pool.query(
      `INSERT INTO notes (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING id;`,
      [
        userId,
        "GCP GKE Workload Identity Setup",
        "To enable secure GCP service access without service account JSON keys on disk:\n1. Create a Google Service Account (GSA).\n2. Bind it to the Kubernetes Service Account (KSA) using IAM policy binding.\n3. Annotate the KSA with the GSA email."
      ]
    );

    // 4. Map Tags to Notes (Join Table)
    await pool.query(
      `INSERT INTO note_tags (note_id, tag_id) VALUES
       ($1, $2), ($1, $3), ($1, $4),
       ($5, $2), ($5, $6);`,
      [
        note1.rows[0].id, tagIds["gcp"], tagIds["gke"], tagIds["postgres"],
        note2.rows[0].id, tagIds["secrets"]
      ]
    );
    console.log("[seed]: Populated notes and mapped tags.");

    // 5. Insert Default Tasks
    const tasksData = [
      { title: "Review GCP architecture blueprint", completed: true },
      { title: "Define PostgreSQL database schema", completed: true },
      { title: "Orchestrate local environment with Docker Compose", completed: false },
      { title: "Configure GitHub Actions CI/CD workflows", completed: false },
      { title: "Create GKE autopilot cluster", completed: false }
    ];

    for (const task of tasksData) {
      await pool.query(
        `INSERT INTO tasks (user_id, title, completed) VALUES ($1, $2, $3);`,
        [userId, task.title, task.completed]
      );
    }
    console.log("[seed]: Populated default tasks.");
    console.log("[seed]: Database seeding completed successfully.");

  } catch (error) {
    console.error("[seed]: Database seeding failed:", error);
  } finally {
    // End the pool connection so the process terminates
    await pool.end();
  }
}

// Execute seeding
seedDatabase();
