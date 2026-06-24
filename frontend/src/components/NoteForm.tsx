"use client";

import { useState } from "react";

interface NoteFormProps {
  onSubmit: (data: { title: string; content: string; tags: string[] }) => void;
}

export function NoteForm({ onSubmit }: NoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      content,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setTitle("");
    setContent("");
    setTags("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-900 rounded-2xl p-6 space-y-4 shadow-xl">
      <h3 className="font-semibold text-white">Create a New Note</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
        <textarea
          placeholder="Write your note content here..."
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
        />
        <input
          type="text"
          placeholder="Tags (comma separated: e.g. docker, gcp, secrets)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
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
  );
}
