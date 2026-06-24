"use client";

import { useState } from "react";

interface TaskFormProps {
  onSubmit: (title: string) => void;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title);
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Add a deployment task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
      />
      <button
        type="submit"
        className="px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm font-semibold text-white transition-colors cursor-pointer"
      >
        Add
      </button>
    </form>
  );
}
