import { useSyncExternalStore } from "react";

// Admin-only toggle: which intro flow to render at /intro.
// - "continuous" → polished persistent-chat version (current main)
// - "stepped"    → production version (one PhoneFrame screen per step)
//
// Persists to localStorage so reloads / sidebar nav respect the choice.

const KEY = "yuna.introVariant";

export const INTRO_VARIANTS = ["continuous", "stepped"] as const;
export type IntroVariant = (typeof INTRO_VARIANTS)[number];

export function getIntroVariant(): IntroVariant {
  if (typeof window === "undefined") return "continuous";
  const raw = window.localStorage.getItem(KEY);
  return (INTRO_VARIANTS as readonly string[]).includes(raw ?? "")
    ? (raw as IntroVariant)
    : "continuous";
}

export function setIntroVariant(v: IntroVariant) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, v);
  emit();
}

let cached: IntroVariant =
  typeof window !== "undefined" ? getIntroVariant() : "continuous";
const listeners = new Set<() => void>();
let storageBound = false;

function emit() {
  const next = getIntroVariant();
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
const getServerSnapshot = (): IntroVariant => "continuous";

export function useIntroVariant(): IntroVariant {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
