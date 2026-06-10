import { useSyncExternalStore } from "react";

// Which simulated iPhone the PhoneFrame renders at. Admin-only, persisted so a
// pick sticks across reloads. Width/height feed the frame via CSS vars so the
// `sm:` breakpoint still collapses to full-screen on real small viewports.
export type FrameSizeId = "se" | "15" | "plus";

export type FrameSize = {
  id: FrameSizeId;
  label: string;
  w: number;
  h: number;
};

export const FRAME_SIZES: FrameSize[] = [
  { id: "se", label: "SE", w: 375, h: 667 },
  { id: "15", label: "15", w: 390, h: 844 },
  { id: "plus", label: "15 Plus", w: 430, h: 932 },
];

const DEFAULT_ID: FrameSizeId = "15";
const KEY = "yuna.frameSize";

function read(): FrameSizeId {
  if (typeof window === "undefined") return DEFAULT_ID;
  const raw = window.localStorage.getItem(KEY);
  return FRAME_SIZES.some((s) => s.id === raw) ? (raw as FrameSizeId) : DEFAULT_ID;
}

export function getFrameSizeId(): FrameSizeId {
  return read();
}

export function getFrameSize(): FrameSize {
  const id = read();
  return FRAME_SIZES.find((s) => s.id === id) ?? FRAME_SIZES[1];
}

export function setFrameSizeId(id: FrameSizeId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, id);
  emit();
}

let cached: FrameSizeId = typeof window !== "undefined" ? read() : DEFAULT_ID;

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
const getServerSnapshot = () => DEFAULT_ID;

export function useFrameSizeId(): FrameSizeId {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useFrameSize(): FrameSize {
  const id = useFrameSizeId();
  return FRAME_SIZES.find((s) => s.id === id) ?? FRAME_SIZES[1];
}
