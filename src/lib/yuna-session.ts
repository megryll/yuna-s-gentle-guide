import type { AvatarVariant } from "@/components/YunaAvatar";

const NAME_KEY = "yuna.name";
const AVATAR_KEY = "yuna.avatar";

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