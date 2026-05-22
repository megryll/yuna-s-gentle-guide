// Shared session-storage schema for the chat thread. Used by chat.tsx for
// persistence across navigations and by VoiceSession so any spoken turns
// during a call survive as text bubbles in the chat thread.
//
// Persisted in sessionStorage (not localStorage) on purpose — the chat is
// scoped to one browsing session for this prototype.

export type LimitationItem = { id: string; text: string; checked: boolean };

export type QuestionnaireAnswer = { questionId: string; option: string };

export type ChatMsg =
  | { id: string; from: "you" | "yuna"; kind: "text"; text: string }
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
    }
  | {
      id: string;
      from: "system";
      kind: "intro-questionnaire";
      state: "pending" | "completed" | "dismissed";
    }
  | {
      id: string;
      from: "you";
      kind: "questionnaire-answers";
      answers: QuestionnaireAnswer[];
    };

export const CHAT_STORE_KEY = "yuna.chatMessages";
export const QUESTIONNAIRE_PROGRESS_KEY = "yuna.questionnaireProgress";
// Set the first time VoiceSession's greeting (initial chat-now lines or
// composeGreeting) starts speaking in this chat session. While set,
// subsequent voice (re-)mounts skip composeGreeting so toggling
// text↔voice doesn't reset the conversation with a fresh "hi, I'm
// here" line.
export const VOICE_GREETED_KEY = "yuna.voiceGreeted";

export type QuestionnaireProgress = {
  index: number;
  answers: QuestionnaireAnswer[];
};

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

export function loadQuestionnaireProgress(): QuestionnaireProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(QUESTIONNAIRE_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.index === "number" &&
      Array.isArray(parsed.answers)
    ) {
      return parsed as QuestionnaireProgress;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveQuestionnaireProgress(progress: QuestionnaireProgress) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(QUESTIONNAIRE_PROGRESS_KEY, JSON.stringify(progress));
}

export function clearQuestionnaireProgress() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(QUESTIONNAIRE_PROGRESS_KEY);
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
