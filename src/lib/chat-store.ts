// Shared session-storage schema for the chat thread. Used by chat.tsx for
// persistence across navigations and by VoiceSession so any spoken turns
// during a call survive as text bubbles in the chat thread.
//
// Persisted in sessionStorage (not localStorage) on purpose. The chat is
// scoped to one browsing session for this prototype.

export type ChatMsg =
  | { id: string; from: "you" | "yuna"; kind: "text"; text: string }
  | {
      id: string;
      from: "system";
      kind: "voice-pitch";
    };

export const CHAT_STORE_KEY = "yuna.chatMessages";
// Set when the session began via "Chat Now". Used by chat.tsx to gate the
// first-session structured-question injection so suggestion-chip entries
// from /home keep their existing flow.
export const CHAT_NOW_SESSION_KEY = "yuna.chatNowSession";
// Set the first time VoiceSession's greeting (initial chat-now lines or
// composeGreeting) starts speaking in this chat session. While set,
// subsequent voice (re-)mounts skip composeGreeting so toggling
// text↔voice doesn't reset the conversation with a fresh "hi, I'm
// here" line.
export const VOICE_GREETED_KEY = "yuna.voiceGreeted";

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

export function getChatNowSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(CHAT_NOW_SESSION_KEY) === "1";
}

export function setChatNowSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CHAT_NOW_SESSION_KEY, "1");
}

export function clearChatNowSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CHAT_NOW_SESSION_KEY);
}

export function getVoiceGreeted(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(VOICE_GREETED_KEY) === "1";
}

export function setVoiceGreeted() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(VOICE_GREETED_KEY, "1");
}

export function clearVoiceGreeted() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(VOICE_GREETED_KEY);
}

export function chatUid(): string {
  return crypto.randomUUID();
}
