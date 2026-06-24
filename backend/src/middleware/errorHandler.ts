import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

// Express 5 forwards rejected promises from async route handlers here automatically.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ error: "Internal server error" });
}
