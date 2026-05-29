import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { Waveform } from "@/components/Waveform";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { pauseAmbient } from "@/lib/ambient-audio";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { KEYBOARD_HEIGHT } from "@/components/KeyboardSimulator";
import { useAppMode } from "@/lib/theme-prefs";

export const Route = createFileRoute("/chat")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    q?: string;
    revisit?: string;
    mode?: "text" | "voice";
  } => ({
    q: (s.q as string | undefined) ?? "",
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
  clearChatNowSession,
  clearStoredMessages,
  clearVoiceGreeted,
  getChatNowSession,
  loadStoredMessages,
  saveStoredMessages,
  setChatNowSession,
  type ChatMsg as Msg,
  type LimitationItem,
} from "@/lib/chat-store";

const LIMITATIONS_PROMPT =
  "Before we continue, you'll need to acknowledge my limitations. Tap the checkmarks to agree.";

// Spoken version of the voice-pitch card copy. The card itself bolds
// "75% more likely" for emphasis; we strip that markup here so TTS reads
// the sentence cleanly. The follow-up question is enqueued as its own
// utterance so the serial TTS queue gives it a fresh fetch + a natural
// beat keeps the call-to-action from feeling tacked on or clipped.
const VOICE_PITCH_SPOKEN_LINES = [
  "People who chat with me over voice are 75% more likely to find value in our conversations.",
  "Want to give me a call?",
];

const LIMITATIONS_ITEMS: LimitationItem[] = [
  { id: "person", text: "I am not a real person", checked: false },
  { id: "crisis", text: "I am not a crisis service", checked: false },
  { id: "private", text: "I keep our chats 100% private", checked: false },
];

// Suggestion-chip entry follow-ups (used when the user lands in /chat from
// a Home suggestion chip, e.g. "Tell me more about Yuna"). Chat-now uses a
// separate intake flow — see CHAT_NOW_OPENER below.
function followUpAfterLimitations(initial: string): string {
  const v = initial.toLowerCase();
  if (v.includes("specific")) {
    return "So, what's on your mind today?";
  }
  if (v.includes("guide")) {
    return "Let's start with whatever feels easy. What brought you here today?";
  }
  if (v.includes("how yuna works") || v.includes("tell me more")) {
    return "I'm here to listen and reflect. We can talk about your day, a feeling, anything that's stirring. There's no right place to begin.";
  }
  return "What feels most present right now?";
}

function acknowledgeChoice(initial: string): string {
  const v = initial.toLowerCase();
  if (v.includes("specific")) {
    return "Wonderful. Thank you for bringing something to the table.";
  }
  if (v.includes("guide")) {
    return "I'd love to. Let's take it slow. I'll lead the way.";
  }
  if (v.includes("how yuna works") || v.includes("tell me more")) {
    return "Happy to walk you through how I can support you.";
  }
  return "Thank you for sharing that.";
}

// Treat any opener that doesn't match a suggestion chip as a real share so
// Yuna reflects on it after the onboarding gate, not resets.
function isCustomInitial(initial: string): boolean {
  const v = initial.trim().toLowerCase();
  if (!v) return false;
  if (v.includes("specific")) return false;
  if (v.includes("guide")) return false;
  if (v.includes("how yuna works")) return false;
  if (v.includes("tell me more")) return false;
  return true;
}

// Chat-now opener. One bubble, ends with an open question that hands the
// floor to the user.
function chatNowOpener(name: string | null): string {
  const trimmed = name?.trim();
  const greeting = trimmed ? `Hi ${trimmed}, welcome.` : "Hi, welcome.";
  return `${greeting} Take a breath if you need one. There's no rush here. What brought you in today?`;
}

function isChatNowOpener(initial: string): boolean {
  return initial.trim().toLowerCase() === "chat now";
}

const REMINISCE_OPENERS = [
  "Hi, I'm glad you're back. I've been thinking about what you shared last time. How have things felt since?",
  "Hey you. Last we spoke you were carrying a lot at work. I'd love to hear where that's sitting now.",
  "Hi again. Something from our last chat has been sitting with me: that bit about wanting more space to breathe. How's that going?",
];

function isReminisceEntry(initial: string): boolean {
  const v = initial.trim().toLowerCase();
  if (!v) return true;
  return v.includes("start a new chat");
}

function Chat() {
  const { q, revisit, mode } = Route.useSearch();
  const navigate = useNavigate();
  const appMode = useAppMode();
  const inVoice = mode === "voice";
  // Initial chat-now landing in voice mode (no revisit flag). This branch
  // defers the mic-permission prompt: Yuna introduces herself, walks the
  // user through the four-question survey on-device, then surfaces an
  // "Enable microphone" CTA so the permission ask lands with context.
  const isChatNowVoice =
    inVoice && isChatNowOpener(q ?? "") && revisit !== "1" && revisit !== "true";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  // Live-subscribed: a voice change in Personalize Yuna (which mirrors to
  // avatar via setVoice) instantly re-renders every bubble, the typing
  // indicator, and the voice-pitch card without remounting the chat. The
  // TTS drain still calls getVoice() directly so an in-flight queue picks
  // up the latest pick on the next chunk.
  const { avatar, name: yunaUserName } = useYunaIdentity();
  const userType = useUserType();
  const [speakerOn, setSpeakerOn] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [pendingLimitations, setPendingLimitations] = useState(false);
  const [voicePitchActive, setVoicePitchActive] = useState(false);
  // True when the current chat session began via "Chat Now". Suggestion-chip
  // entries from /home use the limitations + voice-pitch flow; chat-now skips
  // straight to open conversation.
  const isChatNowSessionRef = useRef(false);
  // Voice-note dictation state. While recording, the input is read-only
  // and the live transcript is rendered into `text` so the user sees what
  // was heard before they tap the check to send.
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceAnalyser, setVoiceAnalyser] = useState<AnalyserNode | null>(null);
  const [keyboardLatched, setKeyboardLatched] = useState(false);
  const recognitionRef = useRef<RecognitionHandle | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
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
  // user gesture anywhere on the page. Pause the shared home/intro ambient
  // singleton first so the two beds don't double up.
  useEffect(() => {
    pauseAmbient();
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

    const isRevisit = revisit === "1" || revisit === "true";
    const isChatNow = isChatNowOpener(q ?? "");
    const isReturningReminisce =
      userType === "returning" && !isRevisit && isReminisceEntry(q ?? "");

    // We do NOT call an absolute `setMessages(seed)` here. Effects fire
    // children-first, so VoiceSession's mount effect already queued its
    // `onMessageAppended` functional updates (greeting lines for the
    // chat-now-voice path) before this boot effect runs. An absolute set
    // here would replay AFTER those appends and wipe them. Use targeted
    // setMessages calls only when this branch has something specific to
    // seed.
    if (isRevisit) {
      // Resume persisted thread + chat-now flag so a mode-switch remount
      // picks up where the user left off.
      const stored = loadStoredMessages();
      if (stored.length > 0) setMessages(stored);
      isChatNowSessionRef.current = getChatNowSession();
    } else {
      // Any non-revisit entry starts a fresh thread. Wipe persisted log +
      // session flags so the next conversation begins clean.
      clearStoredMessages();
      clearChatNowSession();
      clearVoiceGreeted();
      // "Chat Now" isn't an actual user share, don't seed a user bubble
      // for it; Yuna opens the conversation with the intake opener.
      if (!isReturningReminisce && !isChatNow && q) {
        setMessages([{ id: uid(), from: "you", kind: "text", text: q }]);
        userTopicsRef.current.push(q);
      }
      if (isChatNow) {
        setChatNowSession();
        isChatNowSessionRef.current = true;
      }
    }

    if (isReturningReminisce) {
      respondReminisce();
    } else if (isChatNow && !isRevisit) {
      respondToChatNow();
    } else if (q && !isRevisit) {
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

  // First time text mode renders with a populated thread (e.g. after the
  // user toggles voice→text mid-conversation), jump straight to the bottom
  // instead of starting at the top and smooth-scrolling past every bubble.
  // Subsequent updates fall through to the smooth-scroll effect below.
  const initialScrollDoneRef = useRef(false);
  useLayoutEffect(() => {
    if (initialScrollDoneRef.current) return;
    if (messages.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    initialScrollDoneRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
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
    // Stara loads via @font-face with font-display: swap. The swap grows
    // bubble line heights after the initial scroll lands, leaving the last
    // bubble a few pixels below the visible bottom — re-anchor once fonts
    // are ready. Guarded by a near-bottom check so we don't yank a user
    // who's scrolled up to read earlier messages.
    let cancelled = false;
    document.fonts?.ready?.then(() => {
      if (cancelled) return;
      const cur = scrollRef.current;
      if (!cur) return;
      const slack = cur.scrollHeight - cur.scrollTop - cur.clientHeight;
      if (slack > 0 && slack < 120) {
        cur.scrollTo({ top: cur.scrollHeight, behavior: "instant" });
      }
    });
    return () => {
      window.clearTimeout(t);
      cancelled = true;
    };
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
    // user's just-sent message. System messages (limitations, voice-pitch)
    // are UI artifacts and don't belong in the API call.
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

  const transitionToVoicePitch = (delay = 1100) => {
    // No point pitching voice when the user is already on a call.
    if (mode === "voice") return;
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: uid(), from: "system", kind: "voice-pitch" }]);
      setTyping(false);
      setVoicePitchActive(true);
      VOICE_PITCH_SPOKEN_LINES.forEach(speakIfEnabled);
    }, delay);
  };

  // Chat-now text opener. Voice mode is driven separately by VoiceSession's
  // initialGreetingLines (see chatNowVoiceGreeting below) so we don't speak
  // from here in that branch.
  const respondToChatNow = () => {
    if (mode === "voice") return;
    setTyping(true);
    const opener = chatNowOpener(yunaUserName);
    setTimeout(() => {
      setMessages((m) => [...m, { id: uid(), from: "yuna", kind: "text", text: opener }]);
      setTyping(false);
      speakIfEnabled(opener);
    }, 900);
  };

  const respondToInitial = (initial: string) => {
    initialPromptRef.current = initial;
    setTyping(true);
    setTimeout(() => {
      const ackText = acknowledgeChoice(initial);
      setMessages((m) => [...m, { id: uid(), from: "yuna", kind: "text", text: ackText }]);
      setTyping(false);
      speakIfEnabled(ackText);
      if (mode === "voice") return;
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
    // Suggestion-chip entries from /home still go through the older
    // limitations + voice-pitch flow (respondToInitial). Chat-now sessions
    // skip straight to Claude so the open intake exchange isn't interrupted
    // by a canned acknowledgement.
    if (isFirstUserMessage && !isChatNowSessionRef.current) {
      respondToInitial(value);
    } else {
      void respondClaude(value);
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    sendText(text.trim());
  };

  // Voice note: press-and-hold the mic to record, release to send. The input
  // stays empty during capture — a live waveform driven by the actual mic
  // signal renders inside the pill. Releasing flushes the accumulated
  // transcript through onFinal as a single message.
  const stopAudioAnalyser = () => {
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setVoiceAnalyser(null);
  };

  const startAudioAnalyser = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      setVoiceAnalyser(analyser);
    } catch {
      // Mic blocked or unavailable — Waveform falls back to its default bars.
    }
  };

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
    // Latch the keyboard up so it doesn't dismiss while the input briefly
    // loses focus during the press-and-hold gesture.
    if (inputFocused) setKeyboardLatched(true);
    const handle = startRecognition({
      onFinal: (committed) => {
        recognitionRef.current = null;
        setRecordingVoice(false);
        stopAudioAnalyser();
        const trimmed = committed.trim();
        if (trimmed) sendText(trimmed);
        else setText("");
      },
      onError: (err) => {
        recognitionRef.current = null;
        setRecordingVoice(false);
        stopAudioAnalyser();
        if (err.error !== "aborted" && err.error !== "no-speech") {
          console.error("Voice note recognition error", err);
        }
      },
    });
    if (!handle) return;
    recognitionRef.current = handle;
    setRecordingVoice(true);
    startAudioAnalyser();
  };

  const finishVoiceNote = () => {
    recognitionRef.current?.stop();
    // Restore focus so the keyboard stays up after release if it was up.
    if (keyboardLatched) {
      inputRef.current?.focus();
      setKeyboardLatched(false);
    }
  };

  // If the user navigates away or the limitations gate trips while recording,
  // tear down the recognition so the mic indicator doesn't persist. Also
  // stop any in-flight TTS so the chat voice doesn't bleed into /call.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      stopAudioAnalyser();
      stopTts();
    };
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
      if (mode === "voice") return;
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
          "(I just finished tapping through the acknowledgements. Please pick our conversation back up. Gently reflect on what I shared at the start, in your own words, then ask one warm open follow-up. Don't restart, don't repeat lines you've already used, and don't reference this bracketed note.)",
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

  const endChat = () => {
    clearVoiceGreeted();
    navigate({ to: "/wrap-up" });
  };

  const switchToText = () => {
    if (mode !== "voice") return;
    // `revisit: "1"` so the boot effect treats this as a continuation —
    // chat history survives the mode swap instead of being wiped as a
    // fresh entry.
    navigate({ to: "/chat", search: { q: "", mode: "text", revisit: "1" } });
  };

  // "Continue Over Voice" in text mode just navigates — the browser owns
  // any real mic permission prompt when recognition actually starts.
  const openMicForVoice = () => {
    stopTts();
    setVoicePitchActive(false);
    navigate({ to: "/chat", search: { q: "", mode: "voice", revisit: "1" } });
  };

  const switchToVoiceMode = () => {
    if (mode === "voice") return;
    stopTts();
    setVoicePitchActive(false);
    navigate({ to: "/chat", search: { q: "", mode: "voice", revisit: "1" } });
  };

  // Chat-now landing in voice mode: hand VoiceSession the opener line so
  // Yuna greets the user once the mic comes up.
  const chatNowVoiceGreeting = isChatNowVoice
    ? [chatNowOpener(yunaUserName)]
    : undefined;

  return (
    <PhoneFrame backgroundImage="/background.png" themed>
      <div
        className="relative flex-1 flex flex-col yuna-fade-in min-h-0 text-white transition-[padding-bottom] duration-200 ease-out"
        style={inputFocused || keyboardLatched ? { paddingBottom: KEYBOARD_HEIGHT } : undefined}
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
                if (next === "voice") switchToVoiceMode();
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
          <VoiceSession
            onEndCall={endChat}
            initialGreetingLines={chatNowVoiceGreeting}
            onMessageAppended={(msg) => {
              setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
            }}
          />
        ) : (
          <>
            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 pt-20 pb-10 flex flex-col gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {messages.map((m) => {
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
                    value={recordingVoice ? "" : text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => {
                      if (!keyboardLatched) setInputFocused(false);
                    }}
                    placeholder={
                      pendingLimitations
                        ? "Tap each checkmark above to continue"
                        : recordingVoice
                          ? ""
                          : "Type a Message..."
                    }
                    readOnly={recordingVoice}
                    disabled={pendingLimitations}
                    containerClassName={recordingVoice ? "border-white" : undefined}
                    className={recordingVoice ? "hidden" : "disabled:opacity-60"}
                    leading={recordingVoice ? <Waveform analyser={voiceAnalyser} /> : undefined}
                    trailing={
                      <Button
                        surface="dark"
                        variant="primary"
                        size={text.trim() && !recordingVoice ? "icon" : "md"}
                        type={text.trim() && !recordingVoice ? "submit" : "button"}
                        pressed={recordingVoice}
                        className={recordingVoice ? "opacity-80" : undefined}
                        onMouseDown={(e) => e.preventDefault()}
                        onTouchStart={(e) => e.preventDefault()}
                        onPointerDown={(e) => {
                          if (text.trim() || pendingLimitations || recordingVoice) return;
                          e.preventDefault();
                          startVoiceNote();
                        }}
                        onPointerUp={() => {
                          if (recordingVoice) finishVoiceNote();
                        }}
                        onPointerCancel={() => {
                          if (recordingVoice) finishVoiceNote();
                        }}
                        onPointerLeave={() => {
                          if (recordingVoice) finishVoiceNote();
                        }}
                        aria-label={
                          recordingVoice
                            ? "Release to send voice note"
                            : text.trim()
                              ? "Send"
                              : "Hold to record voice note"
                        }
                        disabled={pendingLimitations}
                      >
                        {text.trim() && !recordingVoice ? (
                          <ArrowUpIcon />
                        ) : (
                          <>
                            <MicIcon />
                            Hold to talk
                          </>
                        )}
                      </Button>
                    }
                  />
                </form>
              )}
            </div>
          </>
        )}
      </div>

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
                (checked ? "bg-white text-neutral-900" : "border border-white/40 text-transparent")
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
              fontSize="11"
              fontWeight="600"
              letterSpacing="1.8"
              className=""
            >
              VOICE
            </text>
            <text
              x="260"
              y="62"
              textAnchor="end"
              fill="currentColor"
              fillOpacity="0.9"
              fontSize="11"
              fontWeight="600"
              letterSpacing="1.8"
              className=""
            >
              TEXT
            </text>
          </svg>
          <p className="text-[11px] tracking-[0.22em] uppercase text-white/90 text-center -mt-1">
            Reported positive impact
          </p>
        </div>
        <p className="text-sm leading-relaxed px-4 pt-1 pb-3">Want to give me a call?</p>
      </div>
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
    value: "voice" as const,
    label: "Voice",
    ariaLabel: "Voice mode",
    icon: <Phone size={14} strokeWidth={1.6} aria-hidden />,
  },
  {
    value: "text" as const,
    label: "Text",
    ariaLabel: "Text mode",
    icon: <MessageCircle size={14} strokeWidth={1.6} aria-hidden />,
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
function PhoneCallIcon() {
  return <Phone size={14} strokeWidth={1.5} fill="currentColor" aria-hidden="true" />;
}
