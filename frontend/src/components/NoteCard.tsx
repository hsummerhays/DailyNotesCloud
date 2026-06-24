import type { Note } from "@/lib/types";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-900/80 hover:border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-md">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h4 className="font-semibold text-white text-base leading-snug">{note.title}</h4>
          <button
            onClick={() => onDelete(note.id)}
            className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Delete note"
            aria-label="Delete note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
        <p className="text-sm text-slate-300 mb-4 whitespace-pre-wrap leading-relaxed">{note.content}</p>
      </div>

      <div className="space-y-3">
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

        <div className="text-[11px] text-slate-500">
          {new Date(note.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}
