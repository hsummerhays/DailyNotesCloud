import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[db]: DATABASE_URL is not defined in environment variables.");
}

export const pool = new Pool({
  connectionString,
  // Automatically close idle clients after 30 seconds
  idleTimeoutMillis: 30000,
  // Maximum number of clients in the pool
  max: 10,
});

pool.on("connect", () => {
  console.log("[db]: New database client connected to the pool");
});

pool.on("error", (err) => {
  console.error("[db]: Unexpected error on idle database client", err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
