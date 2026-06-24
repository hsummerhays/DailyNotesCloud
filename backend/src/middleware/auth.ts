import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

// Extend the Express Request interface to support req.user
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Please log in." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Session expired or invalid token. Please log in again." });
  }
}
