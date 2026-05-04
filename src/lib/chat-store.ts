// Shared session-storage schema for the chat thread. Used by chat.tsx for
// persistence across navigations and by call.tsx so any spoken turns
// during a call become text bubbles in the chat thread when the call ends.
//
// Persisted in sessionStorage (not localStorage) on purpose — the chat is
// scoped to one browsing session for this prototype.

export type LimitationItem = { id: string; text: string; checked: boolean };

export type ChatMsg =
  | { id: string; from: "you" | "yuna"; kind: "text"; text: string }
  | {
      id: string;
      from: "system";
      kind: "call-summary";
      startedAt: string;
      endedAt: string;
      durationLabel: string;
    }
  | {
      id: string;
      from: "system";
      kind: "limitations";
      items: LimitationItem[];
    }
  | {
      id: string;
      from: "system";
      kind: "voice-pitch";
    };

export const CHAT_STORE_KEY = "yuna.chatMessages";

export function loadStoredMessages(): ChatMsg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(CHAT_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMsg[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredMessages(msgs: ChatMsg[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CHAT_STORE_KEY, JSON.stringify(msgs));
}

export function clearStoredMessages() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CHAT_STORE_KEY);
}

export function chatUid(): string {
  return crypto.randomUUID();
}
