import type { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle(task.id)}
          aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
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
        <span className={`text-sm transition-all ${task.completed ? "text-slate-500 line-through" : "text-slate-200"}`}>
          {task.title}
        </span>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="text-slate-600 hover:text-rose-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        title="Delete task"
        aria-label="Delete task"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
      </button>
    </div>
  );
}
