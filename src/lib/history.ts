export interface Attempt {
  id: string;
  sopTitle: string;
  score: number;
  total: number;
  date: string; // ISO
}

export const HISTORY_KEY = "sop-trainer:history:v1";
const MAX_ENTRIES = 25;

export function loadHistory(): Attempt[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const data: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? (data as Attempt[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: Attempt): Attempt[] {
  const next = [attempt, ...loadHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable or full: history is best-effort */
  }
  return next;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

/** First non-empty line of the SOP, trimmed, as a display title. */
export function deriveTitle(sop: string): string {
  const line = sop.split("\n").map((l) => l.trim()).find(Boolean) ?? "Untitled SOP";
  return line.length > 70 ? `${line.slice(0, 67)}...` : line;
}
