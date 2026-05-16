import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Mic,
  MessageCircle,
  Phone,
  Settings,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaMark } from "@/components/YunaMark";
import { YunaAvatar } from "@/components/YunaAvatar";
import {
  AMBIENCE_FILES,
  getAmbience,
  getVoice,
  setHasChatted,
  setLastTopics,
  useYunaIdentity,
} from "@/lib/yuna-session";
import { useUserType } from "@/lib/user-type";
import { VOICES } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import {
  isSpeechRecognitionSupported,
  startRecognition,
  type RecognitionHandle,
} from "@/lib/speech";
import { YunaSettingsDrawer } from "@/components/YunaSettingsDrawer";
import { VoiceSession } from "@/components/VoiceSession";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { KEYBOARD_HEIGHT } from "@/components/KeyboardSimulator";
import { useAppMode } from "@/lib/theme-prefs";

export const Route = createFileRoute("/chat")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    q?: string;
    callEnded?: string;
    callDuration?: string;
    revisit?: string;
    mode?: "text" | "voice";
  } => ({
    q: (s.q as string | undefined) ?? "",
    callEnded: s.callEnded as string | undefined,
    callDuration: s.callDuration as string | undefined,
    revisit: s.revisit as string | undefined,
    mode: s.mode === "voice" ? "voice" : "text",
  }),
  head: () => ({
    meta: [
      { title: "Conversation — Yuna" },
      { name: "description", content: "A private conversation with Yuna." },
    ],
  }),
  component: Chat,
});

import {
  chatUid as uid,
  clearStoredMessages,
  loadStoredMessages,
  saveStoredMessages,
  type ChatMsg as Msg,
  type LimitationItem,
} from "@/lib/chat-store";

const LIMITATIONS_PROMPT =
  "Before we continue, you'll need to acknowledge my limitations. Tap the checkmarks to agree.";

// Spoken version of the voice-pitch card copy. The card itself bolds
// "75% more likely" for emphasis; we strip that markup here so TTS reads
// the sentence cleanly. The follow-up question is enqueued as its own
// utterance so the serial TTS queue gives it a fresh fetch + a natural
// beat — keeps the call-to-action from feeling tacked on or clipped.
const VOICE_PITCH_SPOKEN_LINES = [
  "People who chat with me over voice are 75% more likely to find value in our conversations.",
  "Want to give me a call?",
];

const LIMITATIONS_ITEMS: LimitationItem[] = [
  { id: "person", text: "I am not a real person", checked: false },
  { id: "crisis", text: "I am not a crisis service", checked: false },
  { id: "private", text: "I keep our chats 100% private", checked: false },
];

function followUpAfterLimitations(initial: string): string {
  const v = initial.toLowerCase();
  if (v.includes("specific")) {
    return "So — what's on your mind today?";
  }
  if (v.includes("guide")) {
    return "Let's start with whatever feels easy. What brought you here today?";
  }
  if (v.includes("how yuna works") || v.includes("tell me more")) {
    return "I'm here to listen and reflect — we can talk about your day, a feeling, anything that's stirring. There's no right place to begin.";
  }
  return "What feels most present right now?";
}

function acknowledgeChoice(initial: string): string {
  const v = initial.toLowerCase();
  if (v.includes("specific")) {
    return "Wonderful — thank you for bringing something to the table.";
  }
  if (v.includes("guide")) {
    return "I'd love to. Let's take it slow — I'll lead the way.";
  }
  if (v.includes("how yuna works") || v.includes("tell me more")) {
    return "Happy to walk you through how I can support you.";
  }
  return "Thank you for sharing that.";
}

// Treat any opener that doesn't match a suggestion chip as a real share
// — we want Yuna to reflect on it after the onboarding gate, not reset.
function isCustomInitial(initial: string): boolean {
  const v = initial.trim().toLowerCase();
  if (!v) return false;
  if (v.includes("specific")) return false;
  if (v.includes("guide")) return false;
  if (v.includes("how yuna works")) return false;
  if (v.includes("tell me more")) return false;
  return true;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const REMINISCE_OPENERS = [
  "Hi, I'm glad you're back. I've been thinking about what you shared last time — how have things felt since?",
  "Hey you. Last we spoke you were carrying a lot at work — I'd love to hear where that's sitting now.",
  "Hi again. Something from our last chat has been sitting with me — that bit about wanting more space to breathe. How's that going?",
];

function isReminisceEntry(initial: string): boolean {
  const v = initial.trim().toLowerCase();
  if (!v) return true;
  return v.includes("start a new chat");
}

function Chat() {
  const { q, callEnded, callDuration, revisit, mode } = Route.useSearch();
  const navigate = useNavigate();
  const appMode = useAppMode();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  // Live-subscribed: a voice change in Personalize Yuna (which mirrors to
  // avatar via setVoice) instantly re-renders every bubble, the typing
  // indicator, and the voice-pitch card without remounting the chat. The
  // TTS drain still calls getVoice() directly so an in-flight queue picks
  // up the latest pick on the next chunk.
  const { avatar } = useYunaIdentity();
  const userType = useUserType();
  const [speakerOn, setSpeakerOn] = useState(true);
  const [micOpen, setMicOpen] = useState(false);
  const [micState, setMicState] = useState<"idle" | "asking" | "granted" | "denied">("idle");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [pendingLimitations, setPendingLimitations] = useState(false);
  const [voicePitchActive, setVoicePitchActive] = useState(false);
  const voiceStartedAtRef = useRef<number | null>(null);
  // Voice-note dictation state. While recording, the input is read-only
  // and the live transcript is rendered into `text` so the user sees what
  // was heard before they tap the check to send.
  const [recordingVoice, setRecordingVoice] = useState(false);
  const recognitionRef = useRef<RecognitionHandle | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userTopicsRef = useRef<string[]>([]);
  const initialPromptRef = useRef<string>("");
  const bootedRef = useRef(false);
  const limitationsResolvedRef = useRef(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const speakerOnRef = useRef(true);
  const ttsQueueRef = useRef<string[]>([]);
  const ttsBusyRef = useRef(false);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  const AMBIENT_VOLUME = 0.18;
  const AMBIENT_DUCK = 0.04;

  // Mount the chosen ambience bed once. Autoplay may be blocked on direct
  // navigation (no prior gesture); we fall back to starting on the first
  // user gesture anywhere on the page.
  useEffect(() => {
    const ambience = getAmbience();
    const file = AMBIENCE_FILES[ambience];
    if (!file) return;

    const el = new Audio(file);
    el.loop = true;
    el.volume = AMBIENT_VOLUME;
    ambientRef.current = el;

    let bound = false;
    const start = () => {
      el.play().catch(() => {
        if (bound) return;
        bound = true;
        const onGesture = () => {
          document.removeEventListener("pointerdown", onGesture, true);
          document.removeEventListener("keydown", onGesture, true);
          document.removeEventListener("touchstart", onGesture, true);
          el.play().catch(() => {});
        };
        document.addEventListener("pointerdown", onGesture, true);
        document.addEventListener("keydown", onGesture, true);
        document.addEventListener("touchstart", onGesture, true);
      });
    };
    start();

    return () => {
      el.pause();
      ambientRef.current = null;
    };
  }, []);

  // Boot — guarded so Strict Mode's double-mount doesn't fire respondCanned twice
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    setHasChatted();

    const isReturnFromCall = !!callEnded && !!callDuration;
    const isRevisit = revisit === "1" || revisit === "true";
    const isReturningReminisce =
      userType === "returning" && !isReturnFromCall && !isRevisit && isReminisceEntry(q ?? "");

    const seed: Msg[] = isReturnFromCall || isRevisit ? loadStoredMessages() : [];

    if (isReturnFromCall) {
      const ended = new Date(Number(callEnded));
      const durSec = Number(callDuration);
      const started = new Date(ended.getTime() - durSec * 1000);
      const mm = String(Math.floor(durSec / 60)).padStart(2, "0");
      const ss = String(durSec % 60).padStart(2, "0");
      seed.push({
        id: uid(),
        from: "system",
        kind: "call-summary",
        startedAt: fmtTime(started),
        endedAt: fmtTime(ended),
        durationLabel: `${mm}:${ss}`,
      });
    } else if (!isRevisit) {
      // Any non-call, non-revisit entry starts a fresh thread — wipe the
      // persisted log so the next conversation begins clean.
      clearStoredMessages();
      if (!isReturningReminisce && q) {
        seed.push({ id: uid(), from: "you", kind: "text", text: q });
        userTopicsRef.current.push(q);
      }
    }

    setMessages(seed);
    if (isReturningReminisce) {
      respondReminisce();
    } else if (q && !isReturnFromCall && !isRevisit) {
      respondToInitial(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const respondReminisce = () => {
    setTyping(true);
    const line = REMINISCE_OPENERS[Math.floor(Math.random() * REMINISCE_OPENERS.length)];
    setTimeout(() => {
      setMessages((m) => [...m, { id: uid(), from: "yuna", kind: "text", text: line }]);
      setTyping(false);
      speakIfEnabled(line);
    }, 900);
  };

  // Persist messages so a roundtrip through the call screen doesn't drop them.
  useEffect(() => {
    if (messages.length > 0) saveStoredMessages(messages);
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    // After the keyboard's padding-bottom transition (≈200ms) shrinks the
    // scroll area, scrollHeight - clientHeight grows — re-anchor to the new
    // bottom so the latest message lifts above the keyboard instead of being
    // clipped behind the input bar.
    const t = window.setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 240);
    return () => window.clearTimeout(t);
  }, [messages, typing, inputFocused]);

  // Keep a ref so speakIfEnabled — used inside async callbacks — sees the
  // current toggle without needing to be re-bound on every change.
  useEffect(() => {
    speakerOnRef.current = speakerOn;
    if (!speakerOn) {
      // Drop anything queued and stop the current playback so muting feels
      // immediate. We don't try to "resume" later — the message will already
      // be on screen as text.
      ttsQueueRef.current = [];
      ttsBusyRef.current = false;
      ttsAudioRef.current?.pause();
      ambientRef.current?.pause();
    } else {
      const el = ambientRef.current;
      if (el && el.paused) el.play().catch(() => {});
      setAmbientVolume(AMBIENT_VOLUME);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerOn]);

  const setAmbientVolume = (v: number) => {
    const el = ambientRef.current;
    if (el) el.volume = v;
  };

  // Serial TTS queue — every call to speakIfEnabled appends, and the worker
  // drains entries one at a time so successive bubbles don't talk over each
  // other (issue: "second bubble interrupted the first").
  const drainTtsQueue = async () => {
    if (ttsBusyRef.current) return;
    if (!speakerOnRef.current) return;
    const next = ttsQueueRef.current.shift();
    if (!next) {
      setAmbientVolume(AMBIENT_VOLUME);
      return;
    }
    const voiceId = getVoice();
    if (!voiceId) return;
    const cfg = VOICES[voiceId];

    ttsBusyRef.current = true;
    setAmbientVolume(AMBIENT_DUCK);
    try {
      const blobUrl = await fetchTtsBlobUrl(cfg.elevenlabsId, next);
      if (!speakerOnRef.current) {
        ttsBusyRef.current = false;
        return;
      }
      // Always fresh — a reused element that already played to `ended`
      // can swallow the next play() in Chrome.
      const prior = ttsAudioRef.current;
      if (prior) {
        prior.onended = null;
        prior.pause();
        prior.removeAttribute("src");
        prior.load();
      }
      const el = new Audio();
      ttsAudioRef.current = el;
      el.volume = 1;
      el.onended = () => {
        ttsBusyRef.current = false;
        if (ttsQueueRef.current.length === 0) setAmbientVolume(AMBIENT_VOLUME);
        void drainTtsQueue();
      };
      el.src = blobUrl;
      el.currentTime = 0;
      await el.play();
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        console.error("TTS failed", err);
      }
      ttsBusyRef.current = false;
      // Skip the broken entry and try the next; otherwise one failure
      // would freeze the queue.
      void drainTtsQueue();
    }
  };

  const speakIfEnabled = (text: string) => {
    if (!speakerOnRef.current) return;
    if (!text.trim()) return;
    ttsQueueRef.current.push(text);
    void drainTtsQueue();
  };

  // Hard-stop the TTS pipeline. Used when handing off to the call screen so
  // chat's in-flight utterance doesn't talk over the call's opener, and on
  // unmount as a belt-and-suspenders.
  const stopTts = () => {
    ttsQueueRef.current = [];
    ttsBusyRef.current = false;
    const el = ttsAudioRef.current;
    if (el) {
      el.onended = null;
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
  };

  // Stream a Yuna reply from the chat API given an explicit conversation.
  // Returns whether a bubble was rendered + the final text so callers can
  // decide on fallbacks.
  const streamYunaReply = async (
    conversation: { role: string; content: string }[],
  ): Promise<{ ok: boolean; bubbleAdded: boolean; text: string }> => {
    setTyping(true);
    const bubbleId = uid();
    let buffer = "";
    let bubbleAdded = false;

    const upsertBubble = (text: string) => {
      if (!bubbleAdded) {
        setTyping(false);
        bubbleAdded = true;
        setMessages((m) => [...m, { id: bubbleId, from: "yuna", kind: "text", text }]);
      } else {
        setMessages((m) =>
          m.map((x) => (x.id === bubbleId && x.kind === "text" ? { ...x, text } : x)),
        );
      }
    };

    let finalText = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`chat ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const events = pending.split("\n\n");
        pending = events.pop() ?? "";
        for (const ev of events) {
          const lines = ev.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event: "));
          const dataLine = lines.find((l) => l.startsWith("data: "));
          if (!eventLine || !dataLine) continue;
          const eventType = eventLine.slice(7);
          let data: { text?: string; message?: string };
          try {
            data = JSON.parse(dataLine.slice(6));
          } catch {
            continue;
          }
          if (eventType === "delta" && typeof data.text === "string") {
            buffer += data.text;
            upsertBubble(buffer);
          } else if (eventType === "done") {
            finalText = (data.text as string | undefined) ?? buffer;
            upsertBubble(finalText);
          } else if (eventType === "error") {
            throw new Error(data.message ?? "Unknown server error");
          }
        }
      }
      if (finalText) speakIfEnabled(finalText);
      return { ok: true, bubbleAdded, text: finalText };
    } catch (err) {
      console.error("Claude error", err);
      setTyping(false);
      return { ok: false, bubbleAdded, text: "" };
    }
  };

  const respondClaude = async (newUserText: string) => {
    // Build the conversation Claude sees: every prior text turn plus the
    // user's just-sent message. System messages (limitations, voice-pitch,
    // call-summary) are UI artifacts and don't belong in the API call.
    const conversation = [
      ...messages
        .filter((m): m is Extract<Msg, { kind: "text" }> => m.kind === "text")
        .map((m) => ({
          role: m.from === "you" ? "user" : "assistant",
          content: m.text,
        })),
      { role: "user", content: newUserText },
    ];
    const result = await streamYunaReply(conversation);
    if (!result.ok && !result.bubbleAdded) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          from: "yuna",
          kind: "text",
          text: "I'm having trouble connecting right now. Could we try again in a moment?",
        },
      ]);
      return;
    }
  };

  const respondToInitial = (initial: string) => {
    initialPromptRef.current = initial;
    setTyping(true);
    setTimeout(() => {
      const ackText = acknowledgeChoice(initial);
      setMessages((m) => [...m, { id: uid(), from: "yuna", kind: "text", text: ackText }]);
      setTyping(false);
      speakIfEnabled(ackText);
      setTimeout(() => {
        setTyping(true);
        setTimeout(() => {
          setMessages((m) => [...m, { id: uid(), from: "system", kind: "voice-pitch" }]);
          setTyping(false);
          setVoicePitchActive(true);
          VOICE_PITCH_SPOKEN_LINES.forEach(speakIfEnabled);
        }, 1100);
      }, 700);
    }, 1100);
  };

  const sendText = (value: string) => {
    if (!value.trim() || pendingLimitations) return;
    const isFirstUserMessage = !messages.some((m) => m.from === "you");
    setMessages((m) => [...m, { id: uid(), from: "you", kind: "text", text: value }]);
    setText("");
    userTopicsRef.current.push(value);
    setLastTopics(userTopicsRef.current);
    inputRef.current?.blur();
    if (isFirstUserMessage) {
      respondToInitial(value);
    } else {
      void respondClaude(value);
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    sendText(text.trim());
  };

  // Voice note: tap mic to start dictation, tap the check to stop and send.
  // The input stays empty during capture — only the "Listening…" placeholder
  // and the green dot signal active recording. Hitting stop sends the
  // accumulated transcript as a single message.
  const startVoiceNote = () => {
    if (recordingVoice || pendingLimitations) return;
    if (!isSpeechRecognitionSupported()) {
      alert("Voice notes need a browser that supports speech recognition (try Chrome or Safari).");
      return;
    }
    // Kill any in-flight Yuna utterance so the mic doesn't pick up her voice
    // through the speakers and transcribe it back into the input.
    stopTts();
    setText("");
    const handle = startRecognition({
      onFinal: (committed) => {
        recognitionRef.current = null;
        setRecordingVoice(false);
        const trimmed = committed.trim();
        if (trimmed) sendText(trimmed);
        else setText("");
      },
      onError: (err) => {
        recognitionRef.current = null;
        setRecordingVoice(false);
        if (err.error !== "aborted" && err.error !== "no-speech") {
          console.error("Voice note recognition error", err);
        }
      },
    });
    if (!handle) return;
    recognitionRef.current = handle;
    setRecordingVoice(true);
  };

  const finishVoiceNote = () => {
    recognitionRef.current?.stop();
  };

  // If the user navigates away or the limitations gate trips while recording,
  // tear down the recognition so the mic indicator doesn't persist. Also
  // stop any in-flight TTS so the chat voice doesn't bleed into /call.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      stopTts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkLimitation = (msgId: string, itemId: string) => {
    setMessages((msgs) =>
      msgs.map((m) => {
        if (m.id !== msgId || m.kind !== "limitations") return m;
        return {
          ...m,
          items: m.items.map((i) => (i.id === itemId && !i.checked ? { ...i, checked: true } : i)),
        };
      }),
    );
  };

  // Once all three limitations are checked, unlock the input and let Yuna
  // acknowledge before continuing the conversation.
  useEffect(() => {
    if (!pendingLimitations) return;
    if (limitationsResolvedRef.current) return;
    const lim = messages.find((m) => m.kind === "limitations");
    if (!lim || lim.kind !== "limitations") return;
    if (!lim.items.every((i) => i.checked)) return;
    limitationsResolvedRef.current = true;
    setPendingLimitations(false);
    setTyping(true);
    setTimeout(() => {
      const thanksText = "Thanks, now let's get into it.";
      setMessages((m) => [...m, { id: uid(), from: "yuna", kind: "text", text: thanksText }]);
      setTyping(false);
      speakIfEnabled(thanksText);
      setTimeout(() => {
        setTyping(true);
        setTimeout(() => {
          setMessages((m) => [...m, { id: uid(), from: "system", kind: "voice-pitch" }]);
          setTyping(false);
          setVoicePitchActive(true);
          VOICE_PITCH_SPOKEN_LINES.forEach(speakIfEnabled);
        }, 1300);
      }, 700);
    }, 900);
    // speakIfEnabled is stable via refs, no need to track it as a dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, pendingLimitations]);

  const dismissVoicePitch = () => {
    setVoicePitchActive(false);

    // Suggestion-chip openers haven't surfaced anything substantive yet, so
    // a canned re-engagement reads warmly. A custom opener (e.g. "I just
    // lost my dog") is a real share — let Yuna actually respond to it
    // instead of pivoting to "What feels most present right now?".
    if (isCustomInitial(initialPromptRef.current)) {
      const conversation = messages
        .filter((m): m is Extract<Msg, { kind: "text" }> => m.kind === "text")
        .map((m) => ({
          role: m.from === "you" ? "user" : "assistant",
          content: m.text,
        }));
      // Hidden cue — sent only to the API, never persisted to chat state.
      // Tells Yuna to honor the share she briefly acknowledged earlier
      // before the limitations gate broke the rhythm.
      conversation.push({
        role: "user",
        content:
          "(I just finished tapping through the acknowledgements. Please pick our conversation back up — gently reflect on what I shared at the start, in your own words, then ask one warm open follow-up. Don't restart, don't repeat lines you've already used, and don't reference this bracketed note.)",
      });
      void streamYunaReply(conversation).then((r) => {
        if (!r.ok && !r.bubbleAdded) {
          const fallback = followUpAfterLimitations(initialPromptRef.current);
          setMessages((m) => [...m, { id: uid(), from: "yuna", kind: "text", text: fallback }]);
          speakIfEnabled(fallback);
        }
      });
      return;
    }

    setTyping(true);
    setTimeout(() => {
      const followText = followUpAfterLimitations(initialPromptRef.current);
      setMessages((m) => [...m, { id: uid(), from: "yuna", kind: "text", text: followText }]);
      setTyping(false);
      speakIfEnabled(followText);
    }, 900);
  };

  const endChat = () => navigate({ to: "/wrap-up" });

  const switchToText = () => {
    if (mode !== "voice") return;
    const startedAt = voiceStartedAtRef.current;
    voiceStartedAtRef.current = null;
    const durSec = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0;
    const ended = new Date();
    const started = new Date(ended.getTime() - durSec * 1000);
    const mm = String(Math.floor(durSec / 60)).padStart(2, "0");
    const ss = String(durSec % 60).padStart(2, "0");
    const restored = loadStoredMessages();
    setMessages([
      ...restored,
      {
        id: uid(),
        from: "system",
        kind: "call-summary",
        startedAt: fmtTime(started),
        endedAt: fmtTime(ended),
        durationLabel: `${mm}:${ss}`,
      },
    ]);
    navigate({ to: "/chat", search: { q: "", mode: "text" } });
  };

  // Voice-pitch is interactive while in text mode; dismiss it the moment the
  // user commits to switching so a stray "Continue Over Voice" tap doesn't
  // get re-rendered behind the mic prompt.
  const openMicForVoice = () => {
    stopTts();
    setVoicePitchActive(false);
    setMicState("idle");
    setMicOpen(true);
  };
  const requestMic = async () => {
    setMicState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState("granted");
      setMicOpen(false);
      voiceStartedAtRef.current = Date.now();
      navigate({ to: "/chat", search: { q: "", mode: "voice" } });
    } catch {
      setMicState("denied");
    }
  };

  const inVoice = mode === "voice";

  return (
    <PhoneFrame backgroundImage="/background.png" themed>
      <div
        className="relative flex-1 flex flex-col yuna-fade-in min-h-0 text-white transition-[padding-bottom] duration-200 ease-out"
        style={inputFocused ? { paddingBottom: KEYBOARD_HEIGHT } : undefined}
      >
        {/* Header */}
        <div className="relative grid grid-cols-3 items-center px-5 pt-14 pb-2 shrink-0">
          <div className="justify-self-start">
            <Button
              surface="dark"
              variant="ghost"
              size="icon-lg"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open Yuna settings"
            >
              <SettingsIcon />
            </Button>
          </div>
          <div className="justify-self-center">
            <SegmentedToggle
              value={inVoice ? "voice" : "text"}
              onChange={(next) => {
                if (next === "voice") openMicForVoice();
                else switchToText();
              }}
              surface={appMode === "dark" ? "dark" : "light"}
              ariaLabel="Conversation mode"
              options={CHAT_MODE_OPTIONS}
            />
          </div>
          <div className="justify-self-end">
            <Button
              surface="dark"
              variant="ghost"
              size="icon-lg"
              onClick={endChat}
              aria-label="End conversation"
            >
              <CloseIcon />
            </Button>
          </div>
        </div>

        {!inVoice && (
          <div className="absolute left-5 top-[112px] z-10">
            <div
              aria-hidden="true"
              className="h-16 w-16 rounded-full overflow-hidden bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center"
            >
              {avatar ? (
                <YunaAvatar variant={avatar} size={64} />
              ) : (
                <YunaMark size={28} className="text-white" />
              )}
            </div>
            <Button
              surface="dark"
              variant="primary"
              size="icon"
              onClick={() => setSpeakerOn((v) => !v)}
              aria-label={speakerOn ? "Mute Yuna" : "Unmute Yuna"}
              aria-pressed={!speakerOn}
              className="absolute bottom-0 -right-[22px]"
            >
              {speakerOn ? (
                <Volume2 size={18} strokeWidth={1.75} aria-hidden />
              ) : (
                <VolumeX size={18} strokeWidth={1.75} aria-hidden />
              )}
            </Button>
          </div>
        )}

        {inVoice ? (
          <VoiceSession onEndCall={endChat} />
        ) : (
          <>
            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 pt-20 pb-6 flex flex-col gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {messages.map((m) => {
                if (m.kind === "call-summary") return <CallSummary key={m.id} msg={m} />;
                if (m.kind === "limitations")
                  return (
                    <LimitationsCard
                      key={m.id}
                      msg={m}
                      onCheck={(itemId) => checkLimitation(m.id, itemId)}
                    />
                  );
                if (m.kind === "voice-pitch") return <VoicePitchCard key={m.id} />;
                return <Bubble key={m.id} msg={m} />;
              })}
              {typing && <TypingBubble />}
            </div>

            {/* Input + Call Yuna footer */}
            <div>
              {voicePitchActive ? (
                <div className="px-5 pt-3 pb-6 flex flex-col gap-1.5">
                  <Button surface="dark" variant="primary" fullWidth onClick={openMicForVoice}>
                    <PhoneCallIcon />
                    Continue Over Voice
                  </Button>
                  <Button surface="dark" variant="ghost" fullWidth onClick={dismissVoicePitch}>
                    Keep Texting For Now
                  </Button>
                </div>
              ) : (
                <form onSubmit={send} className="px-5 pt-3 pb-6">
                  <TextField
                    ref={inputRef}
                    surface="dark"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder={
                      pendingLimitations
                        ? "Tap each checkmark above to continue"
                        : recordingVoice
                          ? "Listening…"
                          : "Write to Yuna…"
                    }
                    readOnly={recordingVoice}
                    disabled={pendingLimitations}
                    containerClassName={recordingVoice ? "border-white" : undefined}
                    className="disabled:opacity-60"
                    leading={
                      recordingVoice ? (
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 rounded-full bg-success-green shrink-0"
                          style={{ animation: "yuna-fade 900ms ease-in-out infinite alternate" }}
                        />
                      ) : undefined
                    }
                    trailing={
                      <>
                        <Button
                          surface="dark"
                          variant={recordingVoice ? "primary" : "ghost"}
                          size="icon-sm"
                          type="button"
                          pressed={recordingVoice}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={recordingVoice ? finishVoiceNote : startVoiceNote}
                          aria-label={
                            recordingVoice ? "Stop recording and send" : "Record a voice note"
                          }
                          disabled={pendingLimitations}
                        >
                          {recordingVoice ? <CheckIcon /> : <MicIcon />}
                        </Button>
                        <Button
                          surface="dark"
                          variant="primary"
                          size="icon-sm"
                          type="submit"
                          onMouseDown={(e) => e.preventDefault()}
                          aria-label="Send"
                          disabled={pendingLimitations || recordingVoice || !text.trim()}
                        >
                          <ArrowUpIcon />
                        </Button>
                      </>
                    }
                  />
                </form>
              )}
            </div>
          </>
        )}
      </div>

      <Dialog open={micOpen} onOpenChange={setMicOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl tracking-tight">
              Allow microphone access
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Yuna needs to hear you to hold a conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="h-20 w-20 rounded-full hairline flex items-center justify-center">
              <MicLargeIcon />
            </div>
          </div>
          {micState === "denied" && (
            <p className="text-xs text-destructive text-center">
              Microphone blocked. Update your browser settings and try again.
            </p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              surface="light"
              variant="primary"
              fullWidth
              onClick={requestMic}
              disabled={micState === "asking"}
            >
              {micState === "asking" ? "Requesting…" : "Allow microphone"}
            </Button>
            <Button
              surface="light"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => setMicOpen(false)}
            >
              Not now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <YunaSettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
    </PhoneFrame>
  );
}

function Bubble({ msg }: { msg: Extract<Msg, { kind: "text" }> }) {
  const mine = msg.from === "you";
  return (
    <div className={"flex yuna-rise " + (mine ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[82%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl " +
          (mine
            ? "bg-white text-neutral-900 rounded-br-sm"
            : "border border-white/25 bg-white/10 backdrop-blur-sm text-white rounded-bl-sm")
        }
      >
        {msg.text}
      </div>
    </div>
  );
}

function CallSummary({ msg }: { msg: Extract<Msg, { kind: "call-summary" }> }) {
  return (
    <div className="yuna-rise flex justify-center">
      <div className="w-full max-w-[92%] rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-full border border-white/30 flex items-center justify-center">
            <PhoneIcon />
          </div>
          <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/70">
            Voice call · ended
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Started" value={msg.startedAt} />
          <Stat label="Ended" value={msg.endedAt} />
          <Stat label="Length" value={msg.durationLabel} />
        </div>
        <Button surface="dark" variant="secondary" size="sm" fullWidth className="mt-4">
          View transcript
        </Button>
      </div>
    </div>
  );
}

function LimitationsCard({
  msg,
  onCheck,
}: {
  msg: Extract<Msg, { kind: "limitations" }>;
  onCheck: (itemId: string) => void;
}) {
  const allChecked = msg.items.every((i) => i.checked);

  if (allChecked) {
    return (
      <div className="yuna-rise w-full flex justify-end">
        <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm px-3.5 py-1.5 text-xs text-white/85">
          <span
            aria-hidden="true"
            className="shrink-0 h-4 w-4 rounded-full bg-white text-neutral-900 flex items-center justify-center"
          >
            <Check size={10} strokeWidth={2.6} />
          </span>
          Acknowledgements accepted
        </div>
      </div>
    );
  }

  return (
    <div className="yuna-rise w-full flex flex-col gap-2">
      {msg.items.map((item) => {
        const checked = item.checked;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onCheck(item.id)}
            disabled={checked}
            aria-pressed={checked}
            className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm px-4 py-3 text-left transition-colors active:bg-white/20"
          >
            <span className="flex-1 text-sm leading-snug text-white">{item.text}</span>
            <span
              aria-hidden="true"
              className={
                "shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-colors " +
                (checked
                  ? "bg-white text-neutral-900"
                  : "border border-white/40 text-transparent")
              }
            >
              <Check size={14} strokeWidth={2.2} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function VoicePitchCard() {
  const appMode = useAppMode();
  // Dark cluster keeps the bright leaf for both stroke and fill. Light
  // cluster splits them: stroke is a darker olive so the curve reads on the
  // pale photo bg, fill is the vibrant Yuna brand green (the onboarding
  // avatar's starting hue) at higher top opacity so the area reads as a
  // clearly filled shape — not a parallel line.
  const isDark = appMode === "dark";
  const voiceStroke = isDark ? "#cdebb5" : "#7C9A4F";
  const voiceFill = isDark ? "#cdebb5" : "#54B047";
  const voiceFillTop = isDark ? 0.14 : 0.32;
  return (
    <div className="flex yuna-rise justify-start">
      <div className="max-w-[82%] border border-white/25 bg-white/10 backdrop-blur-sm rounded-2xl rounded-bl-sm overflow-hidden text-white">
        <p className="text-sm leading-relaxed px-4 pt-3 pb-2">
          People who chat with me over voice are{" "}
          <span className="font-semibold">75% more likely</span> to find value in our conversations.
        </p>
        <div className="px-3 pb-3">
          <svg viewBox="0 -12 280 144" className="w-full block" aria-hidden="true">
            <defs>
              <linearGradient id="vpVoice" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={voiceFill} stopOpacity={voiceFillTop} />
                <stop offset="100%" stopColor={voiceFill} stopOpacity="0.005" />
              </linearGradient>
              <linearGradient id="vpText" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.04" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.005" />
              </linearGradient>
            </defs>

            {/* subtle horizontal grid */}
            <line
              x1="22"
              y1="36"
              x2="266"
              y2="36"
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="2 3"
            />
            <line
              x1="22"
              y1="68"
              x2="266"
              y2="68"
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="2 3"
            />
            <line
              x1="22"
              y1="100"
              x2="266"
              y2="100"
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="2 3"
            />

            {/* text chat (muted, dashed) */}
            <path
              d="M 22 118 C 60 108, 110 92, 170 80 C 210 74, 246 70, 266 68 L 266 118 Z"
              fill="url(#vpText)"
            />
            <path
              d="M 22 118 C 60 108, 110 92, 170 80 C 210 74, 246 70, 266 68"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.75"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeDasharray="3 3"
            />

            {/* voice chat (foreground, prominent) */}
            <path
              d="M 22 118 C 60 92, 100 56, 160 32 C 210 18, 246 12, 266 10 L 266 118 Z"
              fill="url(#vpVoice)"
            />
            <path
              d="M 22 118 C 60 92, 100 56, 160 32 C 210 18, 246 12, 266 10"
              fill="none"
              stroke={voiceStroke}
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* axes */}
            <line
              x1="22"
              y1="14"
              x2="22"
              y2="120"
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <line
              x1="22"
              y1="118"
              x2="266"
              y2="118"
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* endpoint dots */}
            <circle cx="266" cy="10" r="3.5" fill={voiceStroke} />
            <circle cx="266" cy="68" r="2.75" fill="currentColor" fillOpacity="0.95" />

            {/* in-line legend at endpoints */}
            <text
              x="260"
              y="4"
              textAnchor="end"
              fill={voiceStroke}
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.8"
              className="font-sans-ui"
            >
              VOICE
            </text>
            <text
              x="260"
              y="62"
              textAnchor="end"
              fill="currentColor"
              fillOpacity="0.9"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.8"
              className="font-sans-ui"
            >
              TEXT
            </text>
          </svg>
          <p className="font-sans-ui text-[10.5px] tracking-[0.22em] uppercase text-white/90 text-center -mt-1">
            Reported positive impact
          </p>
        </div>
        <p className="text-sm leading-relaxed px-4 pt-1 pb-3">Want to give me a call?</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-white">{value}</p>
      <p className="font-sans-ui text-[9px] tracking-[0.2em] uppercase text-white/70 mt-0.5">
        {label}
      </p>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex yuna-fade-in justify-start">
      <div className="border border-white/25 bg-white/10 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </div>
    </div>
  );
}

const CHAT_MODE_OPTIONS = [
  {
    value: "text" as const,
    label: "Text",
    ariaLabel: "Text mode",
    icon: <MessageCircle size={14} strokeWidth={1.6} aria-hidden />,
  },
  {
    value: "voice" as const,
    label: "Voice",
    ariaLabel: "Voice mode",
    icon: <Phone size={14} strokeWidth={1.6} aria-hidden />,
  },
];

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-white"
      style={{
        animation: "yuna-fade 900ms ease-in-out infinite alternate",
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

function CloseIcon() {
  return <X size={22} strokeWidth={1.6} aria-hidden="true" />;
}
function SettingsIcon() {
  return <Settings size={22} strokeWidth={1.5} aria-hidden="true" />;
}
function ArrowUpIcon() {
  return <ArrowUp size={13} strokeWidth={2} aria-hidden="true" />;
}
function MicIcon() {
  return <Mic size={14} strokeWidth={1.5} />;
}
function CheckIcon() {
  return <Check size={14} strokeWidth={2.2} />;
}
function PhoneIcon() {
  return <Phone size={14} strokeWidth={1.5} />;
}
function PhoneCallIcon() {
  return (
    <Phone
      size={14}
      strokeWidth={1.5}
      fill="currentColor"
      aria-hidden="true"
    />
  );
}
function MicLargeIcon() {
  return <Mic size={32} strokeWidth={1.5} />;
}
