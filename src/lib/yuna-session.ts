import type { AvatarVariant } from "@/components/YunaAvatar";

const NAME_KEY = "yuna.name";
const AVATAR_KEY = "yuna.avatar";
const HAS_CHATTED_KEY = "yuna.hasChatted";
const LAST_TOPICS_KEY = "yuna.lastTopics";

export function getName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(NAME_KEY);
}

export function setName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name);
}

export function getAvatar(): AvatarVariant | null {
  if (typeof window === "undefined") return null;
  return (window.localStorage.getItem(AVATAR_KEY) as AvatarVariant | null) ?? null;
}

export function setAvatar(v: AvatarVariant) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AVATAR_KEY, v);
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