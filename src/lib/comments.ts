import { useEffect, useSyncExternalStore } from "react";

// Lightweight teammate-feedback layer for the prototype. Reviewers drop pinned
// comments on any screen; they sync through /api/comments (Upstash-backed) so
// everyone on the shared link sees each other's notes. When the API is
// unreachable — e.g. `vite dev`, which doesn't run the serverless functions —
// the store transparently falls back to per-browser localStorage so the UI
// still works for solo testing.

export type Comment = {
  id: string;
  route: string; // pathname the comment is pinned to
  x: number; // 0..1 fraction of the phone-frame width
  y: number; // 0..1 fraction of the phone-frame height
  text: string;
  name: string; // "" → shown as Anonymous
  createdAt: number; // epoch ms
};

export type NewComment = Omit<Comment, "id" | "createdAt">;

// Context attached to the Slack notification only — not persisted in the DB.
export type CommentMeta = {
  url?: string; // full page URL, for a one-click "open screen" link
  device?: string; // frame size label, e.g. "15 Plus"
  platform?: string; // "iOS" | "Android"
  mode?: string; // "dark" | "light"
};

// ─── "Comments visible" admin toggle (per-browser) ───────────────────────────

const ENABLED_KEY = "yuna.commentsEnabled";

export function getCommentsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ENABLED_KEY) === "1";
}

export function setCommentsEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
  enabledCached = on;
  enabledListeners.forEach((cb) => cb());
}

let enabledCached: boolean =
  typeof window !== "undefined" ? getCommentsEnabled() : false;
const enabledListeners = new Set<() => void>();
let enabledStorageBound = false;

function bindEnabledStorageOnce() {
  if (enabledStorageBound || typeof window === "undefined") return;
  enabledStorageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === ENABLED_KEY) {
      enabledCached = getCommentsEnabled();
      enabledListeners.forEach((cb) => cb());
    }
  });
}

export function useCommentsEnabled(): boolean {
  return useSyncExternalStore(
    (cb) => {
      bindEnabledStorageOnce();
      enabledListeners.add(cb);
      return () => enabledListeners.delete(cb);
    },
    () => enabledCached,
    () => false,
  );
}

// ─── Commenter name (remembered so repeat reviewers don't retype) ────────────

const NAME_KEY = "yuna.commenterName";

export function getCommenterName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function setCommenterName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name);
}

// ─── Comment data store (API with localStorage fallback) ─────────────────────

const LOCAL_KEY = "yuna.commentsLocal";

let comments: Comment[] = [];
let useLocal = false;
let fetchedOnce = false;
const dataListeners = new Set<() => void>();

function emitData() {
  dataListeners.forEach((cb) => cb());
}

function loadLocal(): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(comments));
  } catch {
    // storage full / disabled — nothing actionable in a prototype
  }
}

function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function apiGet(): Promise<Comment[] | null> {
  try {
    const res = await fetch("/api/comments", { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.comments)) return data.comments;
    return [];
  } catch {
    return null;
  }
}

export async function refreshComments() {
  const remote = await apiGet();
  if (remote) {
    useLocal = false;
    comments = remote;
  } else {
    useLocal = true;
    comments = loadLocal();
  }
  emitData();
}

function ensureLoaded() {
  if (fetchedOnce) return;
  fetchedOnce = true;
  void refreshComments();
}

export async function addComment(input: NewComment, meta?: CommentMeta) {
  const optimistic: Comment = { ...input, id: newId(), createdAt: Date.now() };
  comments = [...comments, optimistic];
  emitData();

  if (useLocal) {
    saveLocal();
    return;
  }
  try {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, meta }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const saved: Comment = await res.json();
    comments = comments.map((c) => (c.id === optimistic.id ? saved : c));
    emitData();
  } catch {
    // API unavailable — keep the optimistic entry and persist locally.
    useLocal = true;
    saveLocal();
  }
}

export async function editComment(
  id: string,
  patch: Partial<Pick<Comment, "text" | "name">>,
) {
  comments = comments.map((c) => (c.id === id ? { ...c, ...patch } : c));
  emitData();

  if (useLocal) {
    saveLocal();
    return;
  }
  try {
    const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(String(res.status));
    const saved: Comment = await res.json();
    comments = comments.map((c) => (c.id === id ? saved : c));
    emitData();
  } catch {
    useLocal = true;
    saveLocal();
  }
}

export async function deleteComment(id: string) {
  comments = comments.filter((c) => c.id !== id);
  emitData();

  if (useLocal) {
    saveLocal();
    return;
  }
  try {
    await fetch(`/api/comments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch {
    useLocal = true;
    saveLocal();
  }
}

const EMPTY: Comment[] = [];

function useCommentsData(): Comment[] {
  return useSyncExternalStore(
    (cb) => {
      dataListeners.add(cb);
      return () => dataListeners.delete(cb);
    },
    () => comments,
    () => EMPTY,
  );
}

/**
 * Comments pinned to a single route, plus bound add/remove helpers. Loads once
 * on first mount and polls every 15s while mounted so teammates' new comments
 * appear without a manual refresh.
 */
export function useComments(route: string) {
  const all = useCommentsData();

  useEffect(() => {
    ensureLoaded();
    const t = window.setInterval(() => void refreshComments(), 15_000);
    return () => window.clearInterval(t);
  }, []);

  return {
    items: all.filter((c) => c.route === route),
    add: (input: Omit<NewComment, "route">, meta?: CommentMeta) =>
      addComment({ ...input, route }, meta),
    edit: editComment,
    remove: deleteComment,
  };
}
