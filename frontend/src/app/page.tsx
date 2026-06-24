"use client";

import React, { useState, useEffect } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTags, setNewNoteTags] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [backendStatus, setBackendStatus] = useState<"connecting" | "connected" | "offline">("connecting");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const healthRes = await fetch(`${API_URL}/health`);
        if (healthRes.ok) {
          setBackendStatus("connected");
          const notesRes = await fetch(`${API_URL}/api/notes`);
          const tasksRes = await fetch(`${API_URL}/api/tasks`);
          
          if (notesRes.ok) {
            const notesData = await notesRes.json();
            setNotes(notesData);
          }
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            setTasks(tasksData);
          }
        } else {
          throw new Error("Backend health check failed");
        }
      } catch (err) {
        console.warn("Backend offline, falling back to local state.", err);
        setBackendStatus("offline");
        
        // Populate local mock data
        const localNotes = localStorage.getItem("dailynotescloud_notes");
        const localTasks = localStorage.getItem("dailynotescloud_tasks");
        
        if (localNotes) {
          setNotes(JSON.parse(localNotes));
        } else {
          const defaultNotes = [
            {
              id: "1",
              title: "Welcome to DailyNotesCloud",
              content: "This is a cloud-native platform designed to run on GKE with fully automated CI/CD and secure PostgreSQL storage.",
              tags: ["cloud", "gke", "architecture"],
              createdAt: new Date().toISOString()
            },
            {
              id: "2",
              title: "GCP Integration Goals",
              content: "Next steps: Configure Secret Manager for database credentials and set up Workload Identity for Cloud Storage exports.",
              tags: ["gcp", "security", "roadmap"],
              createdAt: new Date().toISOString()
            }
          ];
          setNotes(defaultNotes);
          localStorage.setItem("dailynotescloud_notes", JSON.stringify(defaultNotes));
        }

        if (localTasks) {
          setTasks(JSON.parse(localTasks));
        } else {
          const defaultTasks = [
            { id: "1", title: "Set up local Docker Compose environment", completed: true, createdAt: new Date().toISOString() },
            { id: "2", title: "Configure Google Artifact Registry (GAR)", completed: false, createdAt: new Date().toISOString() },
            { id: "3", title: "Deploy Kubernetes manifests to GKE", completed: false, createdAt: new Date().toISOString() },
            { id: "4", title: "Verify Cloud SQL IAM database authentication", completed: false, createdAt: new Date().toISOString() }
          ];
          setTasks(defaultTasks);
          localStorage.setItem("dailynotescloud_tasks", JSON.stringify(defaultTasks));
        }
      }
    }
    fetchData();
  }, [API_URL]);

  // Save to local storage when state changes (only in offline mode)
  useEffect(() => {
    if (backendStatus === "offline" && notes.length > 0) {
      localStorage.setItem("dailynotescloud_notes", JSON.stringify(notes));
    }
  }, [notes, backendStatus]);

  useEffect(() => {
    if (backendStatus === "offline" && tasks.length > 0) {
      localStorage.setItem("dailynotescloud_tasks", JSON.stringify(tasks));
    }
  }, [tasks, backendStatus]);

  // Handle Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const tagsArray = newNoteTags.split(",").map(t => t.trim()).filter(Boolean);

    if (backendStatus === "connected") {
      try {
        const res = await fetch(`${API_URL}/api/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newNoteTitle, content: newNoteContent, tags: tagsArray })
        });
        if (res.ok) {
          const savedNote = await res.json();
          setNotes([savedNote, ...notes]);
          setNewNoteTitle("");
          setNewNoteContent("");
          setNewNoteTags("");
        }
      } catch (err) {
        console.error("Failed to save note to API:", err);
      }
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: newNoteTitle,
        content: newNoteContent,
        tags: tagsArray,
        createdAt: new Date().toISOString()
      };
      setNotes([newNote, ...notes]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setNewNoteTags("");
    }
  };

  // Handle Task Submission
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (backendStatus === "connected") {
      try {
        const res = await fetch(`${API_URL}/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTaskTitle, completed: false })
        });
        if (res.ok) {
          const savedTask = await res.json();
          setTasks([...tasks, savedTask]);
          setNewTaskTitle("");
        }
      } catch (err) {
        console.error("Failed to add task to API:", err);
      }
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
    }
  };

  // Toggle Task Completion
  const toggleTask = async (id: string) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;

    if (backendStatus === "connected") {
      try {
        const res = await fetch(`${API_URL}/api/tasks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !taskToToggle.completed })
        });
        if (res.ok) {
          const updatedTask = await res.json();
          setTasks(tasks.map(t => t.id === id ? updatedTask : t));
        }
      } catch (err) {
        console.error("Failed to toggle task in API:", err);
      }
    } else {
      setTasks(
        tasks.map(task =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
    }
  };

  // Delete Note
  const deleteNote = async (id: string) => {
    if (backendStatus === "connected") {
      try {
        const res = await fetch(`${API_URL}/api/notes/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setNotes(notes.filter(note => note.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete note from API:", err);
      }
    } else {
      setNotes(notes.filter(note => note.id !== id));
    }
  };

  // Delete Task
  const deleteTask = async (id: string) => {
    if (backendStatus === "connected") {
      try {
        const res = await fetch(`${API_URL}/api/tasks/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setTasks(tasks.filter(task => task.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete task from API:", err);
      }
    } else {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Navigation Bar */}
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
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium">
            <span className={`h-2.5 w-2.5 rounded-full ${
              backendStatus === "connected" ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" :
              backendStatus === "connecting" ? "bg-amber-500 animate-pulse" : "bg-rose-500"
            }`} />
            <span className="text-slate-400">
              {backendStatus === "connected" ? "Backend Connected" :
               backendStatus === "connecting" ? "Connecting to API..." : "Offline Mode (Local)"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Notes */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Your Notes</h2>
              <p className="text-sm text-slate-400">Manage, organize, and filter your cloud-synchronized notes.</p>
            </div>
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="bg-slate-900/50 border border-slate-900 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-semibold text-white">Create a New Note</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Note Title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <textarea
                placeholder="Write your note content here..."
                rows={4}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
              />
              <input
                type="text"
                placeholder="Tags (comma separated: e.g. docker, gcp, secrets)"
                value={newNoteTags}
                onChange={(e) => setNewNoteTags(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-sm font-semibold text-white hover:opacity-95 transition-opacity shadow-lg shadow-sky-500/10 cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </form>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-900/40 border border-slate-900/80 hover:border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="font-semibold text-white text-base leading-snug">{note.title}</h4>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete note"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 mb-4 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                </div>

                <div className="space-y-3">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Date */}
                  <div className="text-[11px] text-slate-500">
                    {new Date(note.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Tasks */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Tasks & Checklist</h2>
            <p className="text-sm text-slate-400">Track implementation milestones and cloud deployment steps.</p>
          </div>

          {/* Quick Stats Widget */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-900 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                {tasks.filter(t => t.completed).length} / {tasks.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Tasks Completed</div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a deployment task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Tasks List */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 divide-y divide-slate-900/80">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                      task.completed
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : "border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {task.completed && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                  <span className={`text-sm transition-all ${
                    task.completed ? "text-slate-500 line-through" : "text-slate-200"
                  }`}>
                    {task.title}
                  </span>
                </div>
                
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-600 hover:text-rose-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Delete task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
