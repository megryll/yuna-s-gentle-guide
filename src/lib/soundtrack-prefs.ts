import { useSyncExternalStore } from "react";

// Which nature-ambient soundtrack the shared bed plays across intro / home /
// etc. The original forest bed stays the default; the rest are alternatives
// selectable from the admin toggle at the top of the screen. Persisted so a
// pick sticks across reloads. The on/off switch lives separately in
// nature-sounds-prefs — this only chooses the track.

export type Soundtrack = {
  id: string;
  label: string;
  src: string;
};

export const SOUNDTRACKS: Soundtrack[] = [
  { id: "forest", label: "1", src: "/forest-background.m4a" },
  { id: "daytime", label: "2", src: "/forest-daytime.mp3" },
  { id: "birdsong", label: "3", src: "/morning-birdsong.mp3" },
  { id: "sunrise", label: "4", src: "/birds-morning.mp3" },
];

const DEFAULT_ID = SOUNDTRACKS[0].id;
const KEY = "yuna.soundtrack";

function read(): string {
  if (typeof window === "undefined") return DEFAULT_ID;
  const raw = window.localStorage.getItem(KEY);
  return SOUNDTRACKS.some((s) => s.id === raw) ? (raw as string) : DEFAULT_ID;
}

export function getSoundtrackId(): string {
  return read();
}

export function getSoundtrackSrc(): string {
  const id = read();
  return (SOUNDTRACKS.find((s) => s.id === id) ?? SOUNDTRACKS[0]).src;
}

export function setSoundtrackId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, id);
  emit();
}

let cached = typeof window !== "undefined" ? read() : DEFAULT_ID;

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

export function useSoundtrackId(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
