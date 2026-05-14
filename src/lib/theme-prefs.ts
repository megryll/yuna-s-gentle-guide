import { useSyncExternalStore } from "react";

const MAIN_BG_KEY = "yuna.mainBg";

export const MAIN_BG_OPTIONS = ["Forest", "Snowy"] as const;
export type MainBg = (typeof MAIN_BG_OPTIONS)[number];

export const MAIN_BG_META: Record<MainBg, { image: string; preview: string }> = {
  Forest: { image: "/background.png", preview: "/background.png" },
  Snowy: { image: "/snowy-background.png", preview: "/snowy-peak.jpg" },
};

export function isDarkBg(bg: MainBg): boolean {
  return bg === "Snowy";
}

export function getMainBg(): MainBg {
  if (typeof window === "undefined") return "Forest";
  const raw = window.localStorage.getItem(MAIN_BG_KEY);
  return (MAIN_BG_OPTIONS as readonly string[]).includes(raw ?? "")
    ? (raw as MainBg)
    : "Forest";
}

export function setMainBg(v: MainBg) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MAIN_BG_KEY, v);
  emit();
}

export type ThemePrefs = { mainBg: MainBg };

const EMPTY: ThemePrefs = { mainBg: "Forest" };

const compute = (): ThemePrefs => ({
  mainBg: getMainBg(),
});

let cached: ThemePrefs =
  typeof window !== "undefined" ? compute() : EMPTY;

const listeners = new Set<() => void>();
let storageBound = false;

function emit() {
  const next = compute();
  if (next.mainBg === cached.mainBg) {
    return;
  }
  cached = next;
  listeners.forEach((cb) => cb());
}

function bindStorageOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === MAIN_BG_KEY) emit();
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
