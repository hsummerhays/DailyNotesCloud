import type { BackendStatus } from "@/lib/types";

const STATUS_LABEL: Record<BackendStatus, string> = {
  connected: "Backend Connected",
  connecting: "Connecting to API...",
  offline: "Offline Mode (Local)",
};

const STATUS_DOT: Record<BackendStatus, string> = {
  connected: "bg-emerald-500 shadow-lg shadow-emerald-500/50",
  connecting: "bg-amber-500 animate-pulse",
  offline: "bg-rose-500",
};

export function StatusBadge({ status }: { status: BackendStatus }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium">
      <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
      <span className="text-slate-400">{STATUS_LABEL[status]}</span>
    </div>
  );
}
