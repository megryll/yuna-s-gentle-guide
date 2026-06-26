import { useSyncExternalStore } from "react";

// Forest ambient bed preference.
//
// DISABLED on the web build: the looping nature bed is hard-pinned off so it
// never auto-plays on desktop/web. This single getter gates every bed (the
// shared singleton, chat's per-mount bed, and the __root controller), so
// returning false silences all of them; the Settings toggle for it was removed
// accordingly. Restore the original localStorage-backed logic to bring the bed
// back. UI sound effects and Yuna's voice (TTS) are unaffected.

const KEY = "yuna.natureSounds";

function read(): boolean {
  return false;
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
const getServerSnapshot = () => false;

export function useNatureSoundsOn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
