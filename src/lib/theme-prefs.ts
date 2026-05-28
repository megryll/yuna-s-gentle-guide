import { useSyncExternalStore } from "react";

// App-level light/dark mode. Drives the photo background for `themed` screens
// (Home, Wrap-up, Chat), the surface treatment of overlays (drawer, dialog,
// tooltip), and the hardcoded photo on onboarding routes so the whole app
// reads consistently in either mode.
//
// - "dark"  → /dark4-blur.png (heavily blurred forest photo), white text
// - "light" → /light-blur-bg.png (frosted light photo, ink text)
//
// The dark cluster ships two photos: the lush "welcome" photo (used only on
// the Welcome route) and a heavily-blurred companion used everywhere else so
// foreground UI stays legible.

const APP_MODE_KEY = "yuna.appMode";

export const APP_MODES = ["dark", "light"] as const;
export type AppMode = (typeof APP_MODES)[number];

const DARK_WELCOME_IMAGE = "/dark4.png";
const DARK_BLUR_IMAGE = "/dark4-blur.png";
const LIGHT_IMAGE = "/light-blur-bg.png";

export function isLightMode(m: AppMode): boolean {
  return m === "light";
}

export function getAppMode(): AppMode {
  if (typeof window === "undefined") return "dark";
  const raw = window.localStorage.getItem(APP_MODE_KEY);
  return (APP_MODES as readonly string[]).includes(raw ?? "")
    ? (raw as AppMode)
    : "dark";
}

export function setAppMode(v: AppMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_MODE_KEY, v);
  emit();
}

export function darkBlurImage(): string {
  return DARK_BLUR_IMAGE;
}

export function darkWelcomeImage(): string {
  return DARK_WELCOME_IMAGE;
}

export function modeImage(mode: AppMode): string {
  return mode === "light" ? LIGHT_IMAGE : DARK_BLUR_IMAGE;
}

// `APP_MODE_META` is preserved for legacy DS pages that pin to the original
// dark photo.
export const APP_MODE_META: Record<AppMode, { image: string }> = {
  dark: { image: "/background.png" },
  light: { image: LIGHT_IMAGE },
};

let cached: AppMode =
  typeof window !== "undefined" ? getAppMode() : "dark";

const listeners = new Set<() => void>();
let storageBound = false;

function emit() {
  const next = getAppMode();
  if (next === cached) return;
  cached = next;
  listeners.forEach((cb) => cb());
}

function bindStorageOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === APP_MODE_KEY) emit();
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
const getServerSnapshot = (): AppMode => "dark";

export function useAppMode(): AppMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Returns the photo path for the active mode. Use for themed surfaces that
// follow the user's mode toggle (Home, Chat, ScreenChrome, drawer/dialog
// overlays).
export function useModeImage(): string {
  return modeImage(useAppMode());
}

// Returns the welcome-route photo. Use on the Welcome screen and any
// onboarding route that wants the lush, un-blurred dark photo.
export function useWelcomeImage(): string {
  return DARK_WELCOME_IMAGE;
}

// Returns the blurred dark photo regardless of mode. Use for onboarding
// routes that lock to the dark cluster even when the user has flipped the
// app to light mode (auth, login, accept-terms, intro, employer-access).
export function useDarkBlurImage(): string {
  return DARK_BLUR_IMAGE;
}
