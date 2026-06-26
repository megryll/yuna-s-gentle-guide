import { useSyncExternalStore } from "react";

// Whether the user has dismissed the Yuna Plus promo card in the nav rail.
// When dismissed, the rail collapses the card into a single "Upgrade" nav item
// in the lower-left group instead. Persisted to localStorage so the choice
// survives reloads + per-route remounts of WebShell, mirroring the
// content-prefs / theme-prefs store pattern.

const KEY = "yuna.upgradePromoDismissed";

function read(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

let cached: boolean = typeof window !== "undefined" ? read() : false;

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
const getServerSnapshot = () => false;

export function setUpgradePromoDismissed(dismissed: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, dismissed ? "1" : "0");
  cached = dismissed;
  notify();
}

export function useUpgradePromoDismissed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
