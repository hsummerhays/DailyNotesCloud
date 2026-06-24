interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      <span>{message}</span>
      <button onClick={onDismiss} className="text-rose-300 hover:text-rose-100 cursor-pointer shrink-0">
        Dismiss
      </button>
    </div>
  );
}
