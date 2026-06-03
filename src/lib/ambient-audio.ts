// Shared nature-ambient bed. Lives at module scope so it survives route
// changes — the intro starts it, the home screen keeps it going, and chat
// pauses it while its own per-mount ambient plays. The track itself is
// selectable via the admin soundtrack toggle (see soundtrack-prefs).

import { getNatureSoundsOn } from "./nature-sounds-prefs";
import { getSoundtrackSrc } from "./soundtrack-prefs";

export const AMBIENT_VOLUME = 0.35;
const FADE_IN_MS = 1000;

let audio: HTMLAudioElement | null = null;
let fadeRaf: number | null = null;
let gestureBound = false;

function cancelFade() {
  if (fadeRaf != null) {
    cancelAnimationFrame(fadeRaf);
    fadeRaf = null;
  }
}

function fadeTo(target: number, ms: number) {
  cancelFade();
  const el = audio;
  if (!el) return;
  if (ms <= 0) {
    el.volume = target;
    return;
  }
  const startVol = el.volume;
  const startT = performance.now();
  const tick = (t: number) => {
    const p = Math.min((t - startT) / ms, 1);
    el.volume = startVol + (target - startVol) * p;
    if (p < 1) {
      fadeRaf = requestAnimationFrame(tick);
    } else {
      fadeRaf = null;
    }
  };
  fadeRaf = requestAnimationFrame(tick);
}

function ensureEl(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (audio) return audio;
  const el = new Audio(getSoundtrackSrc());
  el.loop = true;
  el.preload = "auto";
  el.volume = 0;
  audio = el;
  return el;
}

function bindGestureRetry() {
  if (gestureBound) return;
  gestureBound = true;
  const onGesture = () => {
    document.removeEventListener("pointerdown", onGesture, true);
    document.removeEventListener("keydown", onGesture, true);
    document.removeEventListener("touchstart", onGesture, true);
    gestureBound = false;
    const el = audio;
    if (!el) return;
    if (!getNatureSoundsOn()) return;
    el.play()
      .then(() => fadeTo(AMBIENT_VOLUME, FADE_IN_MS))
      .catch(() => {});
  };
  document.addEventListener("pointerdown", onGesture, true);
  document.addEventListener("keydown", onGesture, true);
  document.addEventListener("touchstart", onGesture, true);
}

// Idempotent. Ensures the bed is playing at AMBIENT_VOLUME — unless the user
// has turned Nature Sounds off in Settings, in which case this no-ops so
// callers don't have to gate each call site.
export function startAmbient() {
  if (!getNatureSoundsOn()) return;
  const el = ensureEl();
  if (!el) return;
  if (!el.paused) {
    if (el.volume < AMBIENT_VOLUME) fadeTo(AMBIENT_VOLUME, FADE_IN_MS);
    return;
  }
  el.volume = 0;
  el.play()
    .then(() => fadeTo(AMBIENT_VOLUME, FADE_IN_MS))
    .catch(() => bindGestureRetry());
}

// Swap the bed to the currently-selected soundtrack. No-op until the element
// exists (the next startAmbient picks up the selection via ensureEl). When it
// is already playing we restart on the new source with a fade so the change is
// audible immediately on intro/home.
export function switchSoundtrack() {
  const el = audio;
  if (!el) return;
  const src = getSoundtrackSrc();
  if (el.src.endsWith(src)) return;
  const wasPlaying = !el.paused;
  cancelFade();
  el.src = src;
  el.volume = 0;
  if (wasPlaying && getNatureSoundsOn()) {
    el.play()
      .then(() => fadeTo(AMBIENT_VOLUME, FADE_IN_MS))
      .catch(() => bindGestureRetry());
  }
}

// Stop with optional fade. Pauses the element when the fade completes so
// the audio decoder doesn't keep running at zero volume.
export function stopAmbient(fadeMs = 0) {
  const el = audio;
  if (!el) return;
  if (fadeMs <= 0) {
    cancelFade();
    el.pause();
    el.volume = 0;
    return;
  }
  fadeTo(0, fadeMs);
  window.setTimeout(() => {
    const cur = audio;
    if (!cur) return;
    if (cur.volume <= 0.01) {
      cur.pause();
      cur.volume = 0;
    }
  }, fadeMs + 50);
}

// Pause without fade — for routes that mount their own ambient and want the
// singleton silent without tearing it down. A subsequent startAmbient()
// will resume from the same element.
export function pauseAmbient() {
  const el = audio;
  if (!el) return;
  cancelFade();
  el.pause();
}

// Smoothly fade to `target` (0..1) over `ms`. Used by the intro to duck the
// bed while a voice preview plays.
export function fadeAmbientTo(target: number, ms: number) {
  if (!audio) return;
  fadeTo(target, ms);
}

export function isAmbientPlaying(): boolean {
  return audio != null && !audio.paused;
}

// Vite HMR: when this module is hot-reloaded the new instance creates a fresh
// `audio` variable, but any Audio element from the prior instance is orphaned
// and keeps playing. Pause and null it on dispose so reloads don't pile up
// duplicate forest beds (and so the new module's stopAmbient can't fail to
// find an element the old module created).
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (audio) {
      cancelFade();
      audio.pause();
      audio = null;
    }
  });
}
