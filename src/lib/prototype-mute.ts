import { useSyncExternalStore } from "react";

// Global prototype mute — admin/QA toggle that silences every voice (TTS,
// voice previews, chat preroll) and ambient bed without each call site having
// to opt in. Works by wrapping the `Audio` constructor on the client: every
// element the app creates is registered and its `muted` flag is kept in sync
// with the store. Setting `muted` is independent of `volume`, so existing
// fade/duck logic keeps working — it just produces no sound while muted.

const KEY = "yuna.prototypeMute";

const tracked = new Set<HTMLAudioElement>();
const listeners = new Set<() => void>();
let cached = false;
let installed = false;
// Non-persisted force: any document loaded with `?chrome=off` (the /gallery
// board's iframes) is muted regardless of the saved toggle, so 60 embedded
// screens never play over each other. Set once at install from the URL; never
// written to localStorage, so it can't leak into the real app or other tabs.
let forced = false;

function effectiveMute(): boolean {
  return cached || forced;
}

export function getPrototypeMute(): boolean {
  if (forced) return true;
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

function applyToAll() {
  for (const el of tracked) {
    el.muted = effectiveMute();
  }
}

export function setPrototypeMute(v: boolean) {
  cached = v;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, v ? "1" : "0");
  }
  applyToAll();
  listeners.forEach((cb) => cb());
}

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  forced = window.location.search.includes("chrome=off");
  cached = window.localStorage.getItem(KEY) === "1";
  const Orig = window.Audio;
  // Preserve the original prototype chain so `instanceof Audio`, event APIs,
  // and any subclassing keep working.
  const Wrapped = function (...args: ConstructorParameters<typeof Audio>) {
    // eslint-disable-next-line new-cap
    const el = new Orig(...args);
    tracked.add(el);
    el.muted = cached;
    el.addEventListener(
      "ended",
      () => {
        tracked.delete(el);
      },
      { once: true },
    );
    return el;
  } as unknown as typeof Audio;
  Wrapped.prototype = Orig.prototype;
  window.Audio = Wrapped;

  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    cached = getPrototypeMute();
    applyToAll();
    listeners.forEach((cb) => cb());
  });
}

install();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => cached;
const getServerSnapshot = () => false;

export function usePrototypeMute(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
