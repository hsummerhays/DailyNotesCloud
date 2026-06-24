import type { Note, Task } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("dailynotescloud_token") : null;
  
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? `Request failed with status ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export const notesApi = {
  list: () => request<Note[]>("/api/notes"),
  create: (data: { title: string; content: string; tags: string[] }) =>
    request<Note>("/api/notes", { method: "POST", body: JSON.stringify(data) }),
  remove: (id: string) => request<{ id: string }>(`/api/notes/${id}`, { method: "DELETE" }),
};

export const tasksApi = {
  list: () => request<Task[]>("/api/tasks"),
  create: (data: { title: string; completed?: boolean }) =>
    request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { completed: boolean }) =>
    request<Task>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<{ id: string }>(`/api/tasks/${id}`, { method: "DELETE" }),
};
