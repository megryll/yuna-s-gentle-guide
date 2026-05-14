// Saved keepsakes from session wrap-ups. Persisted in localStorage so they
// survive across browsing sessions (unlike the chat thread, which is per-tab).
//
// Schema is intentionally narrow — the wrap-up screen is the only writer; a
// future "you/journal" surface will be the reader.

export type Keepsake = {
  id: string;
  quote: string;
  themes: string[];
  note?: string;
  reflections?: string[];
  mood: number | null;
  stress: number | null;
  createdAt: number;
};

export const KEEPSAKES_KEY = "yuna.keepsakes";

export function loadKeepsakes(): Keepsake[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEEPSAKES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Keepsake[]) : [];
  } catch {
    return [];
  }
}

export function saveKeepsake(k: Keepsake) {
  if (typeof window === "undefined") return;
  const existing = loadKeepsakes();
  // Newest first; replace if same id (re-save with updated note/mood/stress).
  const next = [k, ...existing.filter((e) => e.id !== k.id)];
  window.localStorage.setItem(KEEPSAKES_KEY, JSON.stringify(next));
}

export function deleteKeepsake(id: string) {
  if (typeof window === "undefined") return;
  const next = loadKeepsakes().filter((k) => k.id !== id);
  window.localStorage.setItem(KEEPSAKES_KEY, JSON.stringify(next));
}

export function keepsakeUid(): string {
  return crypto.randomUUID();
}
