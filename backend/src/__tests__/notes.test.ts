import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const DEMO_USER_ID = "11111111-1111-4111-8111-111111111111";
const NOTE_ID = "22222222-2222-4222-8222-222222222222";

const queryMock = vi.fn();
const connectMock = vi.fn();

vi.mock("../db/index.js", () => ({
  pool: {
    query: (...args: unknown[]) => queryMock(...args),
    connect: (...args: unknown[]) => connectMock(...args),
    on: vi.fn(),
  },
}));

const { default: app } = await import("../app.js");
const { JWT_SECRET } = await import("../config.js");

// Create a valid signed token for the mock user
const token = jwt.sign(
  { id: DEMO_USER_ID, email: "test@example.com", displayName: "Test User" },
  JWT_SECRET
);

describe("notes routes", () => {
  beforeEach(() => {
    queryMock.mockReset();
    connectMock.mockReset();
  });

  it("returns 401 Unauthorized when no token is provided", async () => {
    const res = await request(app).get("/api/notes");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required. Please log in.");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects creating a note without a title", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid note id instead of hitting the database", async () => {
    const res = await request(app)
      .delete("/api/notes/not-a-uuid")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("lists notes for the authenticated user", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: "n1", title: "Hello", content: "World", createdAt: "2024-01-01", tags: ["a"] }],
    });

    const res = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("FROM notes"), [DEMO_USER_ID]);
  });

  it("creates a note, trimming and lowercasing tags", async () => {
    const client = { query: vi.fn(), release: vi.fn() };
    connectMock.mockResolvedValue(client);

    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: "n1", title: "Test", content: "c", createdAt: "2024-01-01" }],
      }) // INSERT note
      .mockResolvedValueOnce({ rows: [{ id: "t1" }] }) // INSERT tag
      .mockResolvedValueOnce(undefined) // INSERT note_tags
      .mockResolvedValueOnce(undefined); // COMMIT

    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test", content: "c", tags: ["  GCP  "] });

    expect(res.status).toBe(201);
    expect(res.body.tags).toEqual(["gcp"]);
    expect(client.release).toHaveBeenCalled();
  });

  it("rolls back and returns a generic 500 if the transaction fails", async () => {
    const client = { query: vi.fn(), release: vi.fn() };
    connectMock.mockResolvedValue(client);

    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error("duplicate key value violates unique constraint")) // INSERT note fails
      .mockResolvedValueOnce(undefined); // ROLLBACK

    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalled();
  });

  it("returns 404 when updating a note that does not exist", async () => {
    queryMock.mockReset();
    const client = { query: vi.fn(), release: vi.fn() };
    connectMock.mockResolvedValue(client);

    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // UPDATE ... RETURNING (no match)
      .mockResolvedValueOnce(undefined); // ROLLBACK

    const res = await request(app)
      .put(`/api/notes/${NOTE_ID}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New title" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Note not found" });
  });
});
