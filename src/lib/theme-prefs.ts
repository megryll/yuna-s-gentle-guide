import { useSyncExternalStore } from "react";

// App-level light/dark mode. Drives the photo background for `themed` screens
// (Home, Wrap-up, Chat) plus the surface treatment of overlays (drawer,
// dialog, tooltip) so the whole app reads consistently in either mode.
//
// - "dark"  → /background.png  (current dark forest photo, white text)
// - "light" → /light-blur-bg.png (frosted light photo, ink text)

const APP_MODE_KEY = "yuna.appMode";

export const APP_MODES = ["dark", "light"] as const;
export type AppMode = (typeof APP_MODES)[number];

export const APP_MODE_META: Record<AppMode, { image: string }> = {
  dark: { image: "/background.png" },
  light: { image: "/light-blur-bg.png" },
};

export function isLightMode(m: AppMode): boolean {
  return m === "light";
}

export function getAppMode(): AppMode {
  if (typeof window === "undefined") return "dark";
  const raw = window.localStorage.getItem(APP_MODE_KEY);
  return (APP_MODES as readonly string[]).includes(raw ?? "")
    ? (raw as AppMode)
    : "dark";
}

export function setAppMode(v: AppMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_MODE_KEY, v);
  emit();
}

export type ThemePrefs = { mode: AppMode };

const EMPTY: ThemePrefs = { mode: "dark" };

const compute = (): ThemePrefs => ({
  mode: getAppMode(),
});

let cached: ThemePrefs =
  typeof window !== "undefined" ? compute() : EMPTY;

const listeners = new Set<() => void>();
let storageBound = false;

function emit() {
  const next = compute();
  if (next.mode === cached.mode) return;
  cached = next;
  listeners.forEach((cb) => cb());
}

function bindStorageOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === APP_MODE_KEY) emit();
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
const getServerSnapshot = () => EMPTY;

export function useThemePrefs(): ThemePrefs {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useAppMode(): AppMode {
  return useThemePrefs().mode;
}
