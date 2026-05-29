import { useSyncExternalStore } from "react";

// User preference for the forest ambient bed. Default on so first-run users
// hear the bed straight from the welcome screen onward; persists to
// localStorage so a flip in Settings sticks across reloads.

const KEY = "yuna.natureSounds";

function read(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(KEY);
  if (raw === "0") return false;
  return true;
}

export function getNatureSoundsOn(): boolean {
  return read();
}

export function setNatureSoundsOn(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, v ? "1" : "0");
  emit();
}

let cached = typeof window !== "undefined" ? read() : true;

const listeners = new Set<() => void>();
let storageBound = false;

function emit() {
  const next = read();
  if (next === cached) return;
  cached = next;
  listeners.forEach((cb) => cb());
}

function bindStorageOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) emit();
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
const getServerSnapshot = () => true;

export function useNatureSoundsOn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
