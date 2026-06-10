import { useSyncExternalStore } from "react";

// ─── Therapist Recommendations — local prototype state ───────────────────────
// localStorage-backed so saved therapists and "preferences applied" persist
// across the prototype's screen-to-screen navigation. Mirrors the lightweight
// store pattern used by notes-prefs.ts / theme-prefs.ts. Filter selections in
// the drawer are ephemeral screen state, not persisted here.

type State = {
  savedIds: string[];
  preferencesApplied: boolean;
};

const KEY = "yuna.therapistPrefs";

function read(): State {
  if (typeof window === "undefined") return { savedIds: [], preferencesApplied: false };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { savedIds: [], preferencesApplied: false };
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      savedIds: Array.isArray(parsed.savedIds) ? parsed.savedIds : [],
      preferencesApplied: !!parsed.preferencesApplied,
    };
  } catch {
    return { savedIds: [], preferencesApplied: false };
  }
}

let state: State = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function write(next: State) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / privacy-mode errors in the prototype */
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ─── Saved therapists ────────────────────────────────────────────────────────

export function toggleSaved(id: string) {
  const has = state.savedIds.includes(id);
  write({
    ...state,
    savedIds: has ? state.savedIds.filter((x) => x !== id) : [...state.savedIds, id],
  });
}

export function useSavedIds(): string[] {
  return useSyncExternalStore(subscribe, () => state.savedIds, () => state.savedIds);
}

export function useIsSaved(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.savedIds.includes(id),
    () => false,
  );
}

// ─── Preferences applied ─────────────────────────────────────────────────────

export function setPreferencesApplied(v: boolean) {
  if (state.preferencesApplied === v) return;
  write({ ...state, preferencesApplied: v });
}

/** Reset to the brand-new-user starting state: no saved therapists, survey not
 *  yet taken (so the recommendations screen shows its pre-survey teaser). Used
 *  when the admin "New" user toggle is flipped. */
export function resetTherapistPrefs() {
  if (!state.preferencesApplied && state.savedIds.length === 0) return;
  write({ savedIds: [], preferencesApplied: false });
}

export function usePreferencesApplied(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.preferencesApplied,
    () => false,
  );
}
