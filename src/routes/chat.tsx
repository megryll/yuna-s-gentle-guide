import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaMark } from "@/components/YunaMark";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import {
  AMBIENCE_FILES,
  getAmbience,
  getVoice,
  setHasChatted,
  setLastTopics,
  useYunaIdentity,
} from "@/lib/yuna-session";
import { VOICES } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import {
  isSpeechRecognitionSupported,
  startRecognition,
  type RecognitionHandle,
} from "@/lib/speech";
import { YunaHeaderTrigger } from "@/components/YunaHeaderTrigger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/Button";
import { FIRST_TIME_SUGGESTIONS } from "@/components/SuggestionChips";
import { SuggestionChip } from "@/components/SuggestionChip";

export const Route = createFileRoute("/chat")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    q?: string;
    callEnded?: string;
    callDuration?: string;
    revisit?: string;
  } => ({
    q: (s.q as string | undefined) ?? "",
    callEnded: s.callEnded as string | undefined,
    callDuration: s.callDuration as string | undefined,
    revisit: s.revisit as string | undefined,
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

function Chat() {
  const { q, callEnded, callDuration, revisit } = Route.useSearch();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  // Live-subscribed: a voice change in Personalize Yuna (which mirrors to
  // avatar via setVoice) instantly re-renders every bubble, the typing
  // indicator, and the voice-pitch card without remounting the chat. The
  // TTS drain still calls getVoice() directly so an in-flight queue picks
  // up the latest pick on the next chunk.
  const { avatar } = useYunaIdentity();
  // Audio on by default — Yuna's replies read aloud unless the user mutes
  // from the top-left toggle. Same default as the intro screen.
  const [speakerOn, setSpeakerOn] = useState(true);
  const [micOpen, setMicOpen] = useState(false);
  const [micState, setMicState] = useState<"idle" | "asking" | "granted" | "denied">("idle");
  const [inputFocused, setInputFocused] = useState(false);
  const [pendingLimitations, setPendingLimitations] = useState(false);
  const [voicePitchActive, setVoicePitchActive] = useState(false);
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

  const KEYBOARD_OFFSET = 260;

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
    // Returning from a voice call OR revisiting from wrap-up: keep the
    // existing chat. Anything else (a fresh `q` from Home, or a clean open)
    // starts a new thread.
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
      if (q) {
        seed.push({ id: uid(), from: "you", kind: "text", text: q });
        userTopicsRef.current.push(q);
      }
    }

    setMessages(seed);
    if (q && !isReturnFromCall && !isRevisit) respondToInitial(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages so a roundtrip through the call screen doesn't drop them.
  useEffect(() => {
    if (messages.length > 0) saveStoredMessages(messages);
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

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
  // The input is locked while recording and shows the live transcript so
  // the user can confirm what's being heard before commit.
  const startVoiceNote = () => {
    if (recordingVoice || pendingLimitations) return;
    if (!isSpeechRecognitionSupported()) {
      alert("Voice notes need a browser that supports speech recognition (try Chrome or Safari).");
      return;
    }
    setText("");
    const handle = startRecognition({
      onTranscript: (live) => setText(live),
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

  const openCall = () => {
    // Hush the chat voice the moment the user commits to switching — the mic
    // dialog and any subsequent navigation can take a beat, and we don't want
    // "Want to give me a call?" still finishing while the call screen loads.
    stopTts();
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
      navigate({ to: "/call", search: { returnTo: "chat" } });
    } catch {
      setMicState("denied");
    }
  };

  return (
    <PhoneFrame backgroundImage="/background.png">
      <div className="flex-1 flex flex-col yuna-fade-in min-h-0 text-white">
        {/* Header */}
        <div className="grid grid-cols-3 items-center px-5 pt-14 pb-2 border-b border-white/15">
          <div className="justify-self-start">
            <Button
              surface="dark"
              variant="ghost"
              size="icon-lg"
              pressed={!speakerOn}
              onClick={() => setSpeakerOn((s) => !s)}
              aria-label={speakerOn ? "Mute Yuna's voice" : "Unmute Yuna's voice"}
            >
              {speakerOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
            </Button>
          </div>
          <div className="justify-self-center">
            <YunaHeaderTrigger surface="dark" />
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

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3 transition-[padding] duration-200 ease-out"
          style={inputFocused ? { paddingBottom: KEYBOARD_OFFSET + 24 } : undefined}
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
            if (m.kind === "voice-pitch") return <VoicePitchCard key={m.id} avatar={avatar} />;
            return <Bubble key={m.id} msg={m} avatar={avatar} />;
          })}
          {typing && <TypingBubble avatar={avatar} />}
        </div>

        {/* Input + Call Yuna footer */}
        <div
          className="transition-transform duration-200 ease-out"
          style={inputFocused ? { transform: `translateY(-${KEYBOARD_OFFSET}px)` } : undefined}
        >
          {voicePitchActive ? (
            <div className="px-5 pt-3 pb-6 flex flex-col gap-1.5">
              <Button surface="dark" variant="primary" fullWidth onClick={openCall}>
                <PhoneCallIcon />
                Continue Over Voice
              </Button>
              <Button surface="dark" variant="ghost" fullWidth onClick={dismissVoicePitch}>
                Keep Texting
              </Button>
            </div>
          ) : (
            <>
              {!messages.some((m) => m.from === "you") && (
                <div className="px-5 pt-3 flex flex-col gap-2 items-end">
                  {FIRST_TIME_SUGGESTIONS.map((s) => (
                    <SuggestionChip
                      key={s}
                      onClick={() => sendText(s)}
                      disabled={pendingLimitations}
                      size="sm"
                      fullWidth={false}
                    >
                      {s}
                    </SuggestionChip>
                  ))}
                </div>
              )}
              <form onSubmit={send} className="px-5 pt-3">
                <div
                  className={
                    "flex items-center gap-1 rounded-full pl-5 pr-1.5 py-1.5 bg-background text-foreground transition-colors " +
                    (recordingVoice
                      ? "border border-foreground"
                      : "hairline focus-within:border-foreground")
                  }
                >
                  {recordingVoice && (
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full bg-destructive shrink-0"
                      style={{ animation: "yuna-fade 900ms ease-in-out infinite alternate" }}
                    />
                  )}
                  <input
                    ref={inputRef}
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
                    className="flex-1 bg-transparent text-sm py-2 outline-none placeholder:text-muted-foreground min-w-0 disabled:opacity-60"
                  />
                  <Button
                    surface="light"
                    variant={recordingVoice ? "primary" : "ghost"}
                    size="icon-sm"
                    type="button"
                    pressed={recordingVoice}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={recordingVoice ? finishVoiceNote : startVoiceNote}
                    aria-label={recordingVoice ? "Stop recording and send" : "Record a voice note"}
                    disabled={pendingLimitations}
                  >
                    {recordingVoice ? <CheckIcon /> : <MicIcon />}
                  </Button>
                  <Button
                    surface="light"
                    variant="primary"
                    size="icon-sm"
                    type="submit"
                    onMouseDown={(e) => e.preventDefault()}
                    aria-label="Send"
                    disabled={pendingLimitations || recordingVoice || !text.trim()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </div>
              </form>

              <div
                className={
                  "px-5 pt-3 pb-6 flex justify-center transition-opacity duration-150 " +
                  (inputFocused
                    ? "opacity-0 pointer-events-none h-0 overflow-hidden p-0"
                    : "opacity-100")
                }
              >
                <Button surface="dark" variant="secondary" size="sm" onClick={openCall}>
                  <PhoneCallIcon />
                  Call Yuna
                </Button>
              </div>
            </>
          )}
        </div>
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
    </PhoneFrame>
  );
}

function Bubble({
  msg,
  avatar,
}: {
  msg: Extract<Msg, { kind: "text" }>;
  avatar: AvatarVariant | null;
}) {
  const mine = msg.from === "you";
  return (
    <div className={"flex items-end gap-2 yuna-rise " + (mine ? "justify-end" : "justify-start")}>
      {!mine && (
        <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-white/15">
          {avatar ? (
            <YunaAvatar variant={avatar} size={28} />
          ) : (
            <span className="h-7 w-7 rounded-full border border-white/30 flex items-center justify-center">
              <YunaMark size={14} className="text-white" />
            </span>
          )}
        </div>
      )}
      <div
        className={
          "max-w-[78%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl " +
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
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4.5 4.5L19 7"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12.5l4.5 4.5L19 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function VoicePitchCard({ avatar }: { avatar: AvatarVariant | null }) {
  return (
    <div className="flex items-end gap-2 yuna-rise justify-start">
      <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-white/15">
        {avatar ? (
          <YunaAvatar variant={avatar} size={28} />
        ) : (
          <span className="h-7 w-7 rounded-full border border-white/30 flex items-center justify-center">
            <YunaMark size={14} className="text-white" />
          </span>
        )}
      </div>
      <div className="max-w-[78%] border border-white/25 bg-white/10 backdrop-blur-sm rounded-2xl rounded-bl-sm overflow-hidden text-white">
        <p className="text-sm leading-relaxed px-4 pt-3 pb-2">
          People who chat with me over voice are{" "}
          <span className="font-semibold">75% more likely</span> to find value in our conversations.
        </p>
        <div className="px-3 pb-3">
          <svg viewBox="0 0 280 132" className="w-full block" aria-hidden="true">
            <defs>
              <linearGradient id="vpVoice" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
              </linearGradient>
              <linearGradient id="vpText" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
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
              strokeOpacity="0.45"
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
              stroke="currentColor"
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
            <circle cx="266" cy="10" r="3" fill="currentColor" />
            <circle cx="266" cy="68" r="2.5" fill="currentColor" fillOpacity="0.45" />

            {/* in-line legend at endpoints */}
            <text
              x="260"
              y="6"
              textAnchor="end"
              fill="currentColor"
              fontSize="7"
              letterSpacing="1.6"
              className="font-sans-ui"
            >
              VOICE
            </text>
            <text
              x="260"
              y="64"
              textAnchor="end"
              fill="currentColor"
              fillOpacity="0.55"
              fontSize="7"
              letterSpacing="1.6"
              className="font-sans-ui"
            >
              TEXT
            </text>
          </svg>
          <p className="font-sans-ui text-[8.5px] tracking-[0.22em] uppercase text-white/70 text-center -mt-1">
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

function TypingBubble({ avatar }: { avatar: AvatarVariant | null }) {
  return (
    <div className="flex items-end gap-2 yuna-fade-in justify-start">
      <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-white/15">
        {avatar ? (
          <YunaAvatar variant={avatar} size={28} />
        ) : (
          <span className="h-7 w-7 rounded-full border border-white/30 flex items-center justify-center">
            <YunaMark size={14} className="text-white" />
          </span>
        )}
      </div>
      <div className="border border-white/25 bg-white/10 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </div>
    </div>
  );
}

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

function SpeakerOnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10v4h4l5 4V6L8 10H4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 9c1.2 1 1.2 5 0 6M19 6c2.5 2 2.5 10 0 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function SpeakerOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10v4h4l5 4V6L8 10H4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PhoneCallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
        fill="currentColor"
      />
    </svg>
  );
}
function MicLargeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
