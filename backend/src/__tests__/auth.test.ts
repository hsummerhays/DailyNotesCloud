import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const USER_ID = "11111111-1111-4111-8111-111111111111";

const queryMock = vi.fn();

vi.mock("../db/index.js", () => ({
  pool: {
    query: (...args: unknown[]) => queryMock(...args),
    connect: vi.fn(),
    on: vi.fn(),
  },
}));

const { default: app } = await import("../app.js");
const { JWT_SECRET, GOOGLE_CLIENT_ID } = await import("../config.js");

describe("auth routes", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  describe("POST /api/auth/signup", () => {
    it("rejects signup with invalid email or short password", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ email: "invalid-email", password: "123", displayName: "Test" });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.details).toBeInstanceOf(Array);
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("rejects a password shorter than 8 characters", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ email: "test@example.com", password: "1234567", displayName: "Test" });

      expect(res.status).toBe(400);
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("accepts an email with surrounding whitespace and an 8-character password", async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });
      queryMock.mockResolvedValueOnce({
        rows: [{ id: USER_ID, email: "test@example.com", displayName: "Test User", createdAt: "2024-01-01" }],
      });

      const res = await request(app)
        .post("/api/auth/signup")
        .send({ email: "  test@example.com  ", password: "12345678", displayName: "Test User" });

      expect(res.status).toBe(201);
    });

    it("successfully registers a new user", async () => {
      // 1. Mock checking if user exists (returns empty rows)
      queryMock.mockResolvedValueOnce({ rows: [] });
      
      // 2. Mock inserting the user
      queryMock.mockResolvedValueOnce({
        rows: [{ id: USER_ID, email: "test@example.com", displayName: "Test User", createdAt: "2024-01-01" }],
      });

      const res = await request(app)
        .post("/api/auth/signup")
        .send({ email: "test@example.com", password: "securepassword", displayName: "Test User" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.user.displayName).toBe("Test User");
    });
  });

  describe("POST /api/auth/login", () => {
    it("authenticates valid credentials", async () => {
      const passwordHash = await bcrypt.hash("correctpassword", 10);
      
      // Mock fetching user
      queryMock.mockResolvedValueOnce({
        rows: [{ id: USER_ID, email: "test@example.com", passwordHash, displayName: "Test User" }],
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "correctpassword" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.displayName).toBe("Test User");
    });

    it("rejects invalid passwords", async () => {
      const passwordHash = await bcrypt.hash("correctpassword", 10);
      
      // Mock fetching user
      queryMock.mockResolvedValueOnce({
        rows: [{ id: USER_ID, email: "test@example.com", passwordHash, displayName: "Test User" }],
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid email or password.");
    });
  });

  describe("POST /api/auth/google", () => {
    it("fails closed with 503 instead of trusting an unverified token when GOOGLE_CLIENT_ID is unset", async () => {
      expect(GOOGLE_CLIENT_ID).toBeUndefined();

      // A self-signed token claiming to be an arbitrary user -- must never
      // be accepted without verifying it against Google's keys.
      const forged = jwt.sign(
        { email: "victim@example.com", sub: "attacker-controlled-sub", name: "Not Victim" },
        "attacker-key"
      );

      const res = await request(app).post("/api/auth/google").send({ credential: forged });

      expect(res.status).toBe(503);
      expect(queryMock).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns the user details if authenticated", async () => {
      const token = jwt.sign(
        { id: USER_ID, email: "test@example.com", displayName: "Test User" },
        JWT_SECRET
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(USER_ID);
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.user.displayName).toBe("Test User");
    });

    it("rejects the request if no authorization header is sent", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });
});
