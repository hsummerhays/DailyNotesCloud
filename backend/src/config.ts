import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  if (isProduction) {
    throw new Error("JWT_SECRET must be set in production. Refusing to start with an insecure default.");
  }

  console.warn(
    "[config]: JWT_SECRET is not set. Using an insecure development-only default -- set JWT_SECRET before deploying."
  );
  return "dev-only-insecure-jwt-secret-do-not-use-in-production";
}

export const JWT_SECRET = resolveJwtSecret();

// Google OAuth client IDs are public identifiers, not secrets -- safe to
// leave undefined. Routes that need it must fail closed when it's absent.
// Normalize "" (e.g. an empty .env/k8s value) to undefined.
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || undefined;
