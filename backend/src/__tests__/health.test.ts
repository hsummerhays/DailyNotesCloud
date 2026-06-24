import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const queryMock = vi.fn();

vi.mock("../db/index.js", () => ({
  pool: {
    query: (...args: unknown[]) => queryMock(...args),
    connect: vi.fn(),
    on: vi.fn(),
  },
}));

const { default: app } = await import("../app.js");

describe("health endpoints", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("GET /live never touches the database", async () => {
    const res = await request(app).get("/live");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("GET /health returns 200 when the database is reachable", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.database).toBe("connected");
  });

  it("GET /health returns 503 without leaking error details when the database is down", async () => {
    queryMock.mockRejectedValueOnce(new Error("password authentication failed for user secret"));

    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "error", database: "disconnected" });
    expect(JSON.stringify(res.body)).not.toContain("secret");
  });
});
