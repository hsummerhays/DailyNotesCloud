"use client";

import { useEffect, useState } from "react";
import { ApiError, checkHealth, notesApi, tasksApi } from "@/lib/api";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import type { BackendStatus, Note, Task } from "@/lib/types";
import { ErrorBanner } from "@/components/ErrorBanner";
import { NoteCard } from "@/components/NoteCard";
import { NoteForm } from "@/components/NoteForm";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskForm } from "@/components/TaskForm";
import { TaskItem } from "@/components/TaskItem";

const NOTES_STORAGE_KEY = "dailynotescloud_notes";
const TASKS_STORAGE_KEY = "dailynotescloud_tasks";

const DEFAULT_NOTES: Note[] = [
  {
    id: "1",
    title: "Welcome to DailyNotesCloud",
    content:
      "This is a cloud-native platform designed to run on GKE with fully automated CI/CD and secure PostgreSQL storage.",
    tags: ["cloud", "gke", "architecture"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "GCP Integration Goals",
    content:
      "Next steps: Configure Secret Manager for database credentials and set up Workload Identity for Cloud Storage exports.",
    tags: ["gcp", "security", "roadmap"],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_TASKS: Task[] = [
  { id: "1", title: "Set up local Docker Compose environment", completed: true, createdAt: new Date().toISOString() },
  { id: "2", title: "Configure Google Artifact Registry (GAR)", completed: false, createdAt: new Date().toISOString() },
  { id: "3", title: "Deploy Kubernetes manifests to GKE", completed: false, createdAt: new Date().toISOString() },
  { id: "4", title: "Verify Cloud SQL IAM database authentication", completed: false, createdAt: new Date().toISOString() },
];

function describeError(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof Error ? err.message : fallback;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const healthy = await checkHealth();

      if (!healthy) {
        setBackendStatus("offline");
        setNotes(loadFromStorage<Note[]>(NOTES_STORAGE_KEY) ?? DEFAULT_NOTES);
        setTasks(loadFromStorage<Task[]>(TASKS_STORAGE_KEY) ?? DEFAULT_TASKS);
        return;
      }

      setBackendStatus("connected");
      try {
        const [notesData, tasksData] = await Promise.all([notesApi.list(), tasksApi.list()]);
        setNotes(notesData);
        setTasks(tasksData);
      } catch (err) {
        setError(describeError(err, "Failed to load your notes and tasks."));
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (backendStatus === "offline" && notes.length > 0) {
      saveToStorage(NOTES_STORAGE_KEY, notes);
    }
  }, [notes, backendStatus]);

  useEffect(() => {
    if (backendStatus === "offline" && tasks.length > 0) {
      saveToStorage(TASKS_STORAGE_KEY, tasks);
    }
  }, [tasks, backendStatus]);

  const handleAddNote = async (data: { title: string; content: string; tags: string[] }) => {
    if (backendStatus !== "connected") {
      setNotes((prev) => [{ id: Date.now().toString(), createdAt: new Date().toISOString(), ...data }, ...prev]);
      return;
    }

    try {
      const savedNote = await notesApi.create(data);
      setNotes((prev) => [savedNote, ...prev]);
    } catch (err) {
      setError(describeError(err, "Failed to save note."));
    }
  };

  const handleAddTask = async (title: string) => {
    if (backendStatus !== "connected") {
      setTasks((prev) => [...prev, { id: Date.now().toString(), title, completed: false, createdAt: new Date().toISOString() }]);
      return;
    }

    try {
      const savedTask = await tasksApi.create({ title, completed: false });
      setTasks((prev) => [...prev, savedTask]);
    } catch (err) {
      setError(describeError(err, "Failed to add task."));
    }
  };

  const toggleTask = async (id: string) => {
    const taskToToggle = tasks.find((t) => t.id === id);
    if (!taskToToggle) return;

    if (backendStatus !== "connected") {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
      return;
    }

    try {
      const updatedTask = await tasksApi.update(id, { completed: !taskToToggle.completed });
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    } catch (err) {
      setError(describeError(err, "Failed to update task."));
    }
  };

  const deleteNote = async (id: string) => {
    if (backendStatus === "connected") {
      try {
        await notesApi.remove(id);
      } catch (err) {
        setError(describeError(err, "Failed to delete note."));
        return;
      }
    }
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const deleteTask = async (id: string) => {
    if (backendStatus === "connected") {
      try {
        await tasksApi.remove(id);
      } catch (err) {
        setError(describeError(err, "Failed to delete task."));
        return;
      }
    }
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <span className="font-bold text-white text-lg">D</span>
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            DailyNotesCloud
          </span>
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge status={backendStatus} />
        </div>
      </header>

      {error && (
        <div className="max-w-7xl w-full mx-auto px-6 pt-6">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Your Notes</h2>
              <p className="text-sm text-slate-400">Manage, organize, and filter your cloud-synchronized notes.</p>
            </div>
          </div>

          <NoteForm onSubmit={handleAddNote} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={deleteNote} />
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Tasks & Checklist</h2>
            <p className="text-sm text-slate-400">Track implementation milestones and cloud deployment steps.</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-900 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                {tasks.filter((t) => t.completed).length} / {tasks.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Tasks Completed</div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
          </div>

          <TaskForm onSubmit={handleAddTask} />

          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 divide-y divide-slate-900/80">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
