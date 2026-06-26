import { useSyncExternalStore } from "react";

// Whether the admin/dev chrome (page-index sidebar, engineer panel, top toggle
// cluster) is shown. Persisted so the choice sticks across reloads. Hidden by
// default so the responsive web app fills the viewport for a clean preview; a
// small always-present tab brings it back.

const KEY = "yuna.adminChrome";

export function getAdminChrome(): boolean {
  if (typeof window === "undefined") return false;
  // Default hidden; only an explicit "1" shows it.
  return window.localStorage.getItem(KEY) === "1";
}

export function setAdminChrome(visible: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, visible ? "1" : "0");
  cached = visible;
  listeners.forEach((cb) => cb());
}

let cached: boolean = typeof window !== "undefined" ? getAdminChrome() : false;

const listeners = new Set<() => void>();
let storageBound = false;

function bindStorageOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cached = getAdminChrome();
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

export function useAdminChrome(): boolean {
  return useSyncExternalStore(subscribe, () => cached, () => false);
}
