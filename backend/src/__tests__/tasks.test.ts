import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const DEMO_USER_ID = "11111111-1111-4111-8111-111111111111";
const TASK_ID = "22222222-2222-4222-8222-222222222222";

const queryMock = vi.fn();

vi.mock("../db/index.js", () => ({
  pool: {
    query: (...args: unknown[]) => queryMock(...args),
    connect: vi.fn(),
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

describe("tasks routes", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("returns 401 Unauthorized when no token is provided", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required. Please log in.");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects creating a task without a title", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects an update without a completed flag", async () => {
    const res = await request(app)
      .put(`/api/tasks/${DEMO_USER_ID}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("creates a task with completed defaulting to false", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: "t1", title: "Write tests", completed: false, createdAt: "2024-01-01" }],
    });

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Write tests" });

    expect(res.status).toBe(201);
    expect(res.body.completed).toBe(false);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO tasks"), [
      DEMO_USER_ID,
      "Write tests",
      false,
    ]);
  });

  it("toggles a task as completed", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: "t1", title: "Write tests", completed: true, createdAt: "2024-01-01" }],
    });

    const res = await request(app)
      .put(`/api/tasks/${TASK_ID}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it("returns 404 when deleting a task that does not exist", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete(`/api/tasks/${TASK_ID}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Task not found" });
  });
});
