import { useSyncExternalStore } from "react";

// Whether the admin/dev chrome (page-index sidebar, engineer panel, top toggle
// cluster) is shown. Persisted so the choice sticks across reloads. Hiding it
// lets the responsive web app fill the viewport for a clean preview; a small
// always-present tab brings it back.

const KEY = "yuna.adminChrome";

export function getAdminChrome(): boolean {
  if (typeof window === "undefined") return true;
  // Default visible; only an explicit "0" hides it.
  return window.localStorage.getItem(KEY) !== "0";
}

export function setAdminChrome(visible: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, visible ? "1" : "0");
  cached = visible;
  listeners.forEach((cb) => cb());
}

let cached: boolean = typeof window !== "undefined" ? getAdminChrome() : true;

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
  return useSyncExternalStore(subscribe, () => cached, () => true);
}
