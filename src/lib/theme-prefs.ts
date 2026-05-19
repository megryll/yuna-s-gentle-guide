import { useSyncExternalStore } from "react";

// App-level light/dark mode + dark-photo variant. Drives the photo background
// for `themed` screens (Home, Wrap-up, Chat), the surface treatment of
// overlays (drawer, dialog, tooltip), and the hardcoded photo on onboarding
// routes so the whole app reads consistently in either mode.
//
// - "dark"  → one of 4 forest photos (variant-selectable), white text
// - "light" → /light-blur-bg.png (frosted light photo, ink text)
//
// The dark cluster ships two photos per variant: the lush "welcome" photo
// (used only on the Welcome route) and a heavily-blurred companion used
// everywhere else so foreground UI stays legible.

const APP_MODE_KEY = "yuna.appMode";
const BG_VARIANT_KEY = "yuna.bgVariant";

export const APP_MODES = ["dark", "light"] as const;
export type AppMode = (typeof APP_MODES)[number];

export const BG_VARIANTS = ["1", "2", "3", "4"] as const;
export type BgVariant = (typeof BG_VARIANTS)[number];

const DARK_BG_IMAGES: Record<BgVariant, { welcome: string; blur: string }> = {
  "1": { welcome: "/dark1.png", blur: "/dark1-blur.png" },
  "2": { welcome: "/dark2.png", blur: "/dark2-blur.png" },
  "3": { welcome: "/dark3.png", blur: "/dark3-blur.png" },
  "4": { welcome: "/dark4.png", blur: "/dark4-blur.png" },
};

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

export function getBgVariant(): BgVariant {
  if (typeof window === "undefined") return "1";
  const raw = window.localStorage.getItem(BG_VARIANT_KEY);
  return (BG_VARIANTS as readonly string[]).includes(raw ?? "")
    ? (raw as BgVariant)
    : "1";
}

export function setBgVariant(v: BgVariant) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BG_VARIANT_KEY, v);
  emit();
}

// Resolve image paths for a given mode + variant. Pure helpers so callers
// outside React (or SSR-safe code paths) can derive paths without a hook.
export function darkBlurImage(variant: BgVariant): string {
  return DARK_BG_IMAGES[variant].blur;
}

export function darkWelcomeImage(variant: BgVariant): string {
  return DARK_BG_IMAGES[variant].welcome;
}

export function modeImage(mode: AppMode, variant: BgVariant): string {
  return mode === "light" ? LIGHT_IMAGE : darkBlurImage(variant);
}

// `APP_MODE_META` is preserved for legacy DS pages that pin to the original
// dark photo. New code should call `useModeImage()` or `useWelcomeImage()`
// so it picks up the active variant.
export const APP_MODE_META: Record<AppMode, { image: string }> = {
  dark: { image: "/background.png" },
  light: { image: LIGHT_IMAGE },
};

export type ThemePrefs = { mode: AppMode; bgVariant: BgVariant };

const EMPTY: ThemePrefs = { mode: "dark", bgVariant: "1" };

const compute = (): ThemePrefs => ({
  mode: getAppMode(),
  bgVariant: getBgVariant(),
});

let cached: ThemePrefs =
  typeof window !== "undefined" ? compute() : EMPTY;

const listeners = new Set<() => void>();
let storageBound = false;

function emit() {
  const next = compute();
  if (next.mode === cached.mode && next.bgVariant === cached.bgVariant) return;
  cached = next;
  listeners.forEach((cb) => cb());
}

function bindStorageOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === APP_MODE_KEY || e.key === BG_VARIANT_KEY) emit();
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
const getServerSnapshot = () => EMPTY;

export function useThemePrefs(): ThemePrefs {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useAppMode(): AppMode {
  return useThemePrefs().mode;
}

export function useBgVariant(): BgVariant {
  return useThemePrefs().bgVariant;
}

// Returns the photo path for the active mode + variant. Use this for any
// themed surface that follows the user's mode toggle (Home, Chat, ScreenChrome,
// drawer/dialog overlays).
export function useModeImage(): string {
  const { mode, bgVariant } = useThemePrefs();
  return modeImage(mode, bgVariant);
}

// Returns the welcome-route photo for the active variant. Use this on the
// Welcome screen and any onboarding route that wants the lush, un-blurred
// dark photo.
export function useWelcomeImage(): string {
  return darkWelcomeImage(useBgVariant());
}

// Returns the blurred dark photo for the active variant regardless of mode.
// Use this for onboarding routes that lock to the dark cluster even when
// the user has flipped the app to light mode (auth, login, accept-terms,
// intro, employer-access).
export function useDarkBlurImage(): string {
  return darkBlurImage(useBgVariant());
}
