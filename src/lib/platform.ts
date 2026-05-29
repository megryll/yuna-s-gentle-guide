import { useSyncExternalStore } from "react";

export type Platform = "ios" | "android";

const KEY = "yuna.platform";

export function getPlatform(): Platform {
  if (typeof window === "undefined") return "ios";
  const raw = window.localStorage.getItem(KEY);
  return raw === "android" ? "android" : "ios";
}

export function setPlatform(p: Platform) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, p);
  cached = p;
  listeners.forEach((cb) => cb());
}

let cached: Platform =
  typeof window !== "undefined" ? getPlatform() : "ios";

const listeners = new Set<() => void>();
let storageBound = false;

function bindStorageListenerOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cached = getPlatform();
      listeners.forEach((cb) => cb());
    }
  });
}

const subscribe = (cb: () => void) => {
  bindStorageListenerOnce();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const getSnapshot = () => cached;
const getServerSnapshot = (): Platform => "ios";

export function usePlatform(): Platform {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
