import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../db/index.js";
import { GOOGLE_CLIENT_ID, JWT_SECRET } from "../config.js";
import { signupSchema, loginSchema, googleAuthSchema } from "../validation/schemas.js";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Stricter than the general API limiter: these endpoints accept credential
// guesses, so they need a much smaller budget per IP.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

function generateToken(userId: string, email: string, displayName: string) {
  return jwt.sign({ id: userId, email, displayName }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

// 1. Sign Up Route
router.post("/signup", credentialLimiter, async (req, res, next) => {
  try {
    const { email, password, displayName } = signupSchema.parse(req.body);
    const cleanEmail = email.toLowerCase();

    // Check if user already exists
    const userCheck = await pool.query("SELECT id FROM users WHERE email = $1", [cleanEmail]);
    if (userCheck.rows.length > 0) {
      res.status(400).json({ error: "A user with this email address already exists." });
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, display_name as "displayName", created_at as "createdAt";`,
      [cleanEmail, passwordHash, displayName]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email, user.displayName);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// 2. Login Route
router.post("/login", credentialLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const cleanEmail = email.toLowerCase();

    // Fetch user
    const result = await pool.query(
      `SELECT id, email, password_hash as "passwordHash", display_name as "displayName" 
       FROM users WHERE email = $1;`,
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const user = result.rows[0];

    if (!user.passwordHash) {
      res.status(400).json({
        error: "This account was created using Google Sign-In. Please log in using Google.",
      });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const token = generateToken(user.id, user.email, user.displayName);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 3. Google OAuth Login/Registration Route
router.post("/google", credentialLimiter, async (req, res, next) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      res.status(503).json({ error: "Google sign-in is not configured on this server." });
      return;
    }

    const { credential } = googleAuthSchema.parse(req.body);

    // Always cryptographically verify the token against Google's public
    // keys -- never decode-and-trust, which would let anyone forge a
    // credential for an arbitrary email/account.
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      res.status(400).json({ error: "Invalid Google token payload." });
      return;
    }
    const email = payload.email.toLowerCase();
    const displayName = payload.name || payload.email;
    const googleId = payload.sub;

    // Find or create user
    // 1. Check by google_id
    let userRes = await pool.query(
      `SELECT id, email, display_name as "displayName", google_id as "googleId" 
       FROM users WHERE google_id = $1;`,
      [googleId]
    );

    let user;

    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
    } else {
      // 2. Check by email to link existing email-signup accounts
      userRes = await pool.query(
        `SELECT id, email, display_name as "displayName", google_id as "googleId" 
         FROM users WHERE email = $1;`,
        [email]
      );

      if (userRes.rows.length > 0) {
        // Link google_id to existing email user
        user = userRes.rows[0];
        await pool.query("UPDATE users SET google_id = $1 WHERE id = $2", [googleId, user.id]);
      } else {
        // Create new user (password is null since they register via OAuth)
        const insertRes = await pool.query(
          `INSERT INTO users (email, display_name, google_id) 
           VALUES ($1, $2, $3) 
           RETURNING id, email, display_name as "displayName";`,
          [email, displayName, googleId]
        );
        user = insertRes.rows[0];
      }
    }

    const token = generateToken(user.id, user.email, user.displayName);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 4. Me Route (Get current profile)
router.get("/me", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

export default router;
