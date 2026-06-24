// Wraps localStorage access so a corrupted value or a disabled/full store
// (e.g. private browsing) can never crash the app.
export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore -- offline mode degrades to in-memory-only state for this session.
  }
}
