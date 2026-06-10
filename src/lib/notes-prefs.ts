import { useSyncExternalStore } from "react";
import type { Gotcha } from "./engineer-notes";

// Per-screen implementation notes. The CODE seeds (engineer-notes.ts `gotchas`)
// are the source of truth and always render live — so a note Claude writes or
// revises is visible the next time the panel loads. This module persists only
// the ENGINEER'S local layer on top, keyed by route then by note id:
//   - edits:   id → overridden text for a code note the user changed
//   - deletes: ids of code notes the user hid
//   - added:   the user's own notes (each with its own id)
//
// Everything merges by id (see resolveNotes): an unedited code note always
// reflects current code; an added note that later gets folded into the code
// seeds with the SAME id dedupes instead of duplicating. localStorage only —
// no backend. Export the layer (exportOverlay) to fold notes into the code.

export type Note = { id: string; text: string };

type Overlay = {
  edits: Record<string, string>;
  deletes: string[];
  added: Note[];
};
type OverlayStore = Record<string, Overlay>;

const KEY = "yuna.noteOverlay";

function emptyOverlay(): Overlay {
  return { edits: {}, deletes: [], added: [] };
}

// One-time purge of the legacy "full note list" store and its seed-migration
// keys. The old model let localStorage shadow the code; the overlay model
// renders code live, so the legacy data is dropped. Anything the engineer had
// authored was already folded into the code seeds before this switchover.
function purgeLegacy() {
  if (typeof window === "undefined") return;
  for (const k of [
    "yuna.implementationNotes",
    "yuna.implementationNotes.migration",
    "yuna.implementationNotes.syncedSeeds",
  ]) {
    window.localStorage.removeItem(k);
  }
}

function readStore(): OverlayStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OverlayStore) : {};
  } catch {
    return {};
  }
}

purgeLegacy();
let cached: OverlayStore = typeof window !== "undefined" ? readStore() : {};

const listeners = new Set<() => void>();

function persist(next: OverlayStore) {
  cached = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((cb) => cb());
}

// Apply a change to one route's overlay, cloning so cached is never mutated in
// place. Prunes the route's entry when its overlay goes back to empty.
function withOverlay(path: string, fn: (ov: Overlay) => Overlay) {
  const current = cached[path] ?? emptyOverlay();
  const next = fn({
    edits: { ...current.edits },
    deletes: [...current.deletes],
    added: current.added.map((n) => ({ ...n })),
  });
  const isEmpty =
    Object.keys(next.edits).length === 0 &&
    next.deletes.length === 0 &&
    next.added.length === 0;
  const store = { ...cached };
  if (isEmpty) delete store[path];
  else store[path] = next;
  persist(store);
}

let storageBound = false;
function bindStorageOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cached = readStore();
      listeners.forEach((cb) => cb());
    }
  });
}

const subscribe = (cb: () => void) => {
  bindStorageOnce();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => cached;
const getServerSnapshot = (): OverlayStore => ({});

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `n_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

// ─── resolution ──────────────────────────────────────────────────────────────

export type ResolvedNote = { id: string; text: string; isUser: boolean };

/** Merge a route's code notes with the engineer's local overlay, by id. */
export function resolveNotes(codeNotes: Gotcha[], ov: Overlay): ResolvedNote[] {
  const codeIds = new Set(codeNotes.map((c) => c.id));
  const fromCode = codeNotes
    .filter((c) => !ov.deletes.includes(c.id))
    .map((c) => ({ id: c.id, text: ov.edits[c.id] ?? c.text, isUser: false }));
  // An added note whose id now exists in code has been folded in — render it
  // once, from code, and skip the stale local copy.
  const fromUser = ov.added
    .filter((a) => !codeIds.has(a.id))
    .map((a) => ({ id: a.id, text: a.text, isUser: true }));
  return [...fromCode, ...fromUser];
}

export function useResolvedNotes(path: string, codeNotes: Gotcha[]): ResolvedNote[] {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return resolveNotes(codeNotes, store[path] ?? emptyOverlay());
}

// ─── mutations ───────────────────────────────────────────────────────────────

/** Add a blank user note; returns its id so the caller can open it for editing. */
export function addUserNote(path: string): string {
  const id = newId();
  withOverlay(path, (ov) => ({ ...ov, added: [...ov.added, { id, text: "" }] }));
  return id;
}

/** Edit a note. `isUser` distinguishes the engineer's own note from a code note;
 *  an empty result removes it. */
export function editNote(path: string, id: string, text: string, isUser: boolean) {
  const trimmed = text.trim();
  if (!trimmed) {
    removeNote(path, id, isUser);
    return;
  }
  if (isUser) {
    withOverlay(path, (ov) => ({
      ...ov,
      added: ov.added.map((n) => (n.id === id ? { ...n, text: trimmed } : n)),
    }));
  } else {
    withOverlay(path, (ov) => ({ ...ov, edits: { ...ov.edits, [id]: trimmed } }));
  }
}

/** Remove a note. A user note is dropped; a code note is hidden via `deletes`. */
export function removeNote(path: string, id: string, isUser: boolean) {
  if (isUser) {
    withOverlay(path, (ov) => ({ ...ov, added: ov.added.filter((n) => n.id !== id) }));
  } else {
    withOverlay(path, (ov) => {
      const { [id]: _drop, ...edits } = ov.edits;
      return {
        ...ov,
        edits,
        deletes: ov.deletes.includes(id) ? ov.deletes : [...ov.deletes, id],
      };
    });
  }
}

// ─── export (fold into code) ─────────────────────────────────────────────────

/**
 * The engineer's local layer per route — only routes with changes appear. Hand
 * this to Claude to fold into the code seeds: `added` → new gotchas reusing the
 * same id (so they dedupe), `edits` → update that gotcha's text, `deletes` →
 * drop that gotcha.
 */
export function exportOverlay(): OverlayStore {
  const out: OverlayStore = {};
  for (const [path, ov] of Object.entries(cached)) {
    const added = ov.added.filter((n) => n.text.trim());
    if (Object.keys(ov.edits).length || ov.deletes.length || added.length) {
      out[path] = { edits: ov.edits, deletes: ov.deletes, added };
    }
  }
  return out;
}
