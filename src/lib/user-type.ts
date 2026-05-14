import { useSyncExternalStore } from "react";

export type UserType = "new" | "returning";

const KEY = "yuna.userType";

// Onboarding routes — the toggle's "Returning" option is disabled here so
// the prototype always starts in "new" while a user is being welcomed.
export const ONBOARDING_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/auth",
  "/accept-terms",
  "/intro",
]);

export function isOnboardingPath(pathname: string): boolean {
  return ONBOARDING_PATHS.has(pathname);
}

export function getUserType(): UserType {
  if (typeof window === "undefined") return "new";
  const raw = window.localStorage.getItem(KEY);
  return raw === "returning" ? "returning" : "new";
}

export function setUserType(t: UserType) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, t);
  cached = t;
  listeners.forEach((cb) => cb());
}

let cached: UserType =
  typeof window !== "undefined" ? getUserType() : "new";

const listeners = new Set<() => void>();
let storageBound = false;

function bindStorageListenerOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cached = getUserType();
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
const getServerSnapshot = (): UserType => "new";

export function useUserType(): UserType {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
