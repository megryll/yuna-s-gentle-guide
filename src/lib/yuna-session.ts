import { useSyncExternalStore } from "react";
import { AVATAR_VARIANTS, type AvatarVariant } from "@/components/YunaAvatar";
import { VOICE_IDS, type VoiceId } from "@/lib/voices";

const NAME_KEY = "yuna.name";
const AVATAR_KEY = "yuna.avatar";
const VOICE_KEY = "yuna.voice";
const HAS_CHATTED_KEY = "yuna.hasChatted";
const LAST_TOPICS_KEY = "yuna.lastTopics";
const AMBIENCE_KEY = "yuna.ambience";

export const AMBIENCE_OPTIONS = [
  "None",
  "Forest",
  "Campfire",
  "Ocean",
  "Busy Cafe",
] as const;
export type Ambience = (typeof AMBIENCE_OPTIONS)[number];

// Filename per option — only Forest currently ships an audio file. Picking
// another option still persists the choice so we can swap a file in later
// without touching call sites.
export const AMBIENCE_FILES: Record<Ambience, string | null> = {
  None: null,
  Forest: "/forest-background.m4a",
  Campfire: null,
  Ocean: null,
  "Busy Cafe": null,
};

export function getName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(NAME_KEY);
}

export function setName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name);
  emit();
}

export function getAvatar(): AvatarVariant | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AVATAR_KEY);
  if (!raw) return null;
  // Drop stale values from prior avatar sets so a removed variant doesn't
  // render a broken image.
  if (!AVATAR_VARIANTS.includes(raw as AvatarVariant)) {
    window.localStorage.removeItem(AVATAR_KEY);
    return null;
  }
  return raw as AvatarVariant;
}

// Avatar and voice are 1:1 in this app — every avatar variant is also a
// VoiceId. The setters keep both keys in lockstep so a write through either
// API can never produce a mismatch (e.g. an avatar with the wrong voice
// playing on top of it).
export function setAvatar(v: AvatarVariant) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AVATAR_KEY, v);
  window.localStorage.setItem(VOICE_KEY, v);
  emit();
}

export function getVoice(): VoiceId | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(VOICE_KEY);
  if (!raw) return null;
  if (!VOICE_IDS.includes(raw as VoiceId)) {
    window.localStorage.removeItem(VOICE_KEY);
    return null;
  }
  return raw as VoiceId;
}

export function setVoice(v: VoiceId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VOICE_KEY, v);
  // VoiceId === AvatarVariant by construction (see voices.ts) — mirror to
  // the avatar key so onboarding's single setVoice call lights up the
  // picked face everywhere.
  window.localStorage.setItem(AVATAR_KEY, v);
  emit();
}

export function getHasChatted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(HAS_CHATTED_KEY) === "1";
}

export function setHasChatted() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HAS_CHATTED_KEY, "1");
}

export function getLastTopics(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LAST_TOPICS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function setLastTopics(topics: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_TOPICS_KEY, JSON.stringify(topics.slice(0, 5)));
}

export function getAmbience(): Ambience {
  if (typeof window === "undefined") return "None";
  const raw = window.localStorage.getItem(AMBIENCE_KEY);
  if (!raw) return "None";
  return (AMBIENCE_OPTIONS as readonly string[]).includes(raw)
    ? (raw as Ambience)
    : "None";
}

export function setAmbience(v: Ambience) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AMBIENCE_KEY, v);
}

// ── Reactive identity store ──────────────────────────────────────────────────
// One source of truth for the user's name, voice, and avatar across every
// screen. Components subscribe via `useYunaIdentity()` and re-render the
// instant a setter writes — no remount or refresh needed. This is what makes
// "change voice in Personalize Yuna and see it reflected in chat/call/header
// behind the drawer" work.

export type YunaIdentity = {
  name: string | null;
  voice: VoiceId | null;
  avatar: AvatarVariant | null;
};

const EMPTY_IDENTITY: YunaIdentity = { name: null, voice: null, avatar: null };

const computeIdentity = (): YunaIdentity => ({
  name: getName(),
  voice: getVoice(),
  avatar: getAvatar(),
});

// Cache the snapshot so useSyncExternalStore receives a stable reference
// between renders. Only emit/storage events bump it.
let cachedIdentity: YunaIdentity =
  typeof window !== "undefined" ? computeIdentity() : EMPTY_IDENTITY;

const identityListeners = new Set<() => void>();
let storageBound = false;

function emit() {
  const next = computeIdentity();
  if (
    next.name === cachedIdentity.name &&
    next.voice === cachedIdentity.voice &&
    next.avatar === cachedIdentity.avatar
  ) {
    return;
  }
  cachedIdentity = next;
  identityListeners.forEach((cb) => cb());
}

function bindStorageListenerOnce() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  // Pick up changes from another tab so the prototype stays consistent if
  // the user has it open in two windows.
  window.addEventListener("storage", (e) => {
    if (e.key === NAME_KEY || e.key === VOICE_KEY || e.key === AVATAR_KEY) {
      emit();
    }
  });
}

const subscribeIdentity = (cb: () => void) => {
  bindStorageListenerOnce();
  identityListeners.add(cb);
  return () => {
    identityListeners.delete(cb);
  };
};

const getIdentitySnapshot = () => cachedIdentity;
const getServerIdentitySnapshot = () => EMPTY_IDENTITY;

export function useYunaIdentity(): YunaIdentity {
  return useSyncExternalStore(
    subscribeIdentity,
    getIdentitySnapshot,
    getServerIdentitySnapshot,
  );
}
