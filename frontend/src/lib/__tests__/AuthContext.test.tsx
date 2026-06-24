import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../AuthContext";

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return { ok, status, json: async () => body } as Response;
}

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("starts unauthenticated once there is no cached session", async () => {
    const { result } = renderAuth();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("restores and refreshes a cached session via /api/auth/me", async () => {
    localStorage.setItem("dailynotescloud_token", "cached-token");
    localStorage.setItem(
      "dailynotescloud_user",
      JSON.stringify({ id: "1", email: "a@b.com", displayName: "Stale Name" })
    );
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ user: { id: "1", email: "a@b.com", displayName: "Fresh Name" } })
    );

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.displayName).toBe("Fresh Name");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/me"),
      expect.objectContaining({ headers: { Authorization: "Bearer cached-token" } })
    );
  });

  it("logs out a cached session the backend no longer accepts", async () => {
    localStorage.setItem("dailynotescloud_token", "stale-token");
    localStorage.setItem(
      "dailynotescloud_user",
      JSON.stringify({ id: "1", email: "a@b.com", displayName: "A" })
    );
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: "Session expired" }, false, 401));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("dailynotescloud_token")).toBeNull();
  });

  it("login() stores the session on success", async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ token: "new-token", user: { id: "1", email: "a@b.com", displayName: "A" } })
    );

    await act(async () => {
      await result.current.login("a@b.com", "password123");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe("new-token");
    expect(localStorage.getItem("dailynotescloud_token")).toBe("new-token");
  });

  it("login() surfaces the server error message and rejects", async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: "Invalid email or password." }, false, 401));

    await act(async () => {
      await expect(result.current.login("a@b.com", "wrong")).rejects.toThrow("Invalid email or password.");
    });

    expect(result.current.error).toBe("Invalid email or password.");
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("signup() stores the session on success", async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ token: "new-token", user: { id: "1", email: "a@b.com", displayName: "A" } }, true, 201)
    );

    await act(async () => {
      await result.current.signup("a@b.com", "password123", "A");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.displayName).toBe("A");
  });

  it("logout() clears in-memory and persisted session state", async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ token: "new-token", user: { id: "1", email: "a@b.com", displayName: "A" } })
    );
    await act(async () => {
      await result.current.login("a@b.com", "password123");
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("dailynotescloud_token")).toBeNull();
  });

  it("clearError() resets the error state", async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: "Invalid email or password." }, false, 401));
    await act(async () => {
      await expect(result.current.login("a@b.com", "wrong")).rejects.toThrow();
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
