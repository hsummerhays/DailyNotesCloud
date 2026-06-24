import app from "./app.js";
import { pool } from "./db/index.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[server]: CloudNotes backend is running at http://localhost:${PORT}`);
});

function shutdown(signal: string) {
  console.log(`[server]: Received ${signal}, shutting down gracefully...`);

  server.close(async () => {
    try {
      await pool.end();
      console.log("[server]: Closed remaining connections.");
      process.exit(0);
    } catch (err) {
      console.error("[server]: Error while closing database pool", err);
      process.exit(1);
    }
  });

  // Don't hang forever waiting for in-flight requests to drain.
  setTimeout(() => {
    console.error("[server]: Forcing shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
