import { useSyncExternalStore } from "react";
import { KIND_META, type CardKind } from "@/lib/home-cards";

// Per-card-type feed preferences — which kinds of content Yuna includes in the
// Home feed. Drives three things off one source of truth:
//   • the Home feed filter (a disabled kind drops out of "Created For You"),
//   • the 3-dot card menu's "Stop seeing …" action (sets a kind to off),
//   • the Settings → Content Preferences screen (a switch per kind).
// Defaults: every kind on. Persisted to localStorage so a "Stop seeing …"
// choice survives reloads, mirroring the theme-prefs store pattern.

const KEY = "yuna.contentPrefs";
const ALL_KINDS = Object.keys(KIND_META) as CardKind[];

export type ContentPrefs = Record<CardKind, boolean>;

function allOn(): ContentPrefs {
  return Object.fromEntries(ALL_KINDS.map((k) => [k, true])) as ContentPrefs;
}

function read(): ContentPrefs {
  const base = allOn();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ContentPrefs>;
    for (const k of ALL_KINDS) {
      if (typeof parsed[k] === "boolean") base[k] = parsed[k] as boolean;
    }
  } catch {
    // Malformed storage — fall back to all-on.
  }
  return base;
}

const SERVER_SNAPSHOT = allOn();
let cached: ContentPrefs = typeof window !== "undefined" ? read() : SERVER_SNAPSHOT;

const listeners = new Set<() => void>();
let storageBound = false;

function notify() {
  listeners.forEach((cb) => cb());
}

function bindStorageOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cached = read();
      notify();
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
const getServerSnapshot = (): ContentPrefs => SERVER_SNAPSHOT;

export function setContentPref(kind: CardKind, enabled: boolean) {
  if (typeof window === "undefined") return;
  const next = { ...cached, [kind]: enabled };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  cached = next;
  notify();
}

export function useContentPrefs(): ContentPrefs {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useContentPref(kind: CardKind): boolean {
  return useContentPrefs()[kind];
}
