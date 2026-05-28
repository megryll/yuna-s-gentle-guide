import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Hand, Radio } from "lucide-react";
import { YunaAvatar } from "@/components/YunaAvatar";
import { getVoice, useYunaIdentity } from "@/lib/yuna-session";
import { useAppMode } from "@/lib/theme-prefs";
import { VOICES } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import {
  isSpeechRecognitionSupported,
  startRecognition,
  type RecognitionHandle,
} from "@/lib/speech";
import {
  chatUid,
  getVoiceGreeted,
  loadStoredMessages,
  setVoiceGreeted,
  type ChatMsg,
} from "@/lib/chat-store";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { NavList } from "@/components/yuna-settings-shared";

type Phase = "connecting" | "idle" | "listening" | "thinking" | "speaking" | "muted" | "ending";

type InputMode = "hold" | "hands-free";

// Hands-free auto-commit window: how long after the user goes silent we
// treat the turn as finished and ship the transcript. Matches the prior
// continuous-listen behavior from before hold-to-talk landed.
const TURN_END_SILENCE_MS = 1500;

const PHASE_LABEL_HOLD: Record<Phase, string> = {
  connecting: "Connecting…",
  idle: "Hold the mic to talk",
  listening: "Listening",
  thinking: "Thinking…",
  speaking: "Yuna",
  muted: "Muted",
  ending: "Wrapping up…",
};

const PHASE_LABEL_HANDSFREE: Record<Phase, string> = {
  connecting: "Connecting…",
  idle: "Just a moment…",
  listening: "Listening",
  thinking: "Thinking…",
  speaking: "Yuna",
  muted: "Tap mic to resume",
  ending: "Wrapping up…",
};

export type VoiceSessionHandle = {
  /**
   * Imperatively make Yuna speak a line and resume listening — used when an
   * outside-the-session event (e.g. completing the intro questionnaire)
   * needs to drive Yuna's verbal reply instead of waiting for the user to
   * say something first.
   */
  speakYunaLine: (text: string) => Promise<void>;
};

type VoiceSessionProps = {
  onEndCall: (durationSec: number) => void;
  /**
   * Optional spoken opener. When provided, VoiceSession speaks these lines
   * in sequence on mount instead of calling composeGreeting. Used by the
   * chat-now → voice flow so Yuna says the same welcome + questionnaire
   * ask that the text-mode flow types out.
   */
  initialGreetingLines?: string[];
  /**
   * Called each time a voice turn (Yuna or user) is added to the conversation
   * so the parent can mirror it into the chat thread. The parent owns
   * persistence — VoiceSession no longer writes to sessionStorage directly,
   * which avoids two writers stomping each other.
   */
  onMessageAppended?: (msg: ChatMsg) => void;
  /**
   * Fires the moment Yuna's TTS for a given line actually starts playing
   * (audio `onplaying` event). Lets the parent sync visual state — e.g.
   * surfacing the questionnaire card — with the exact spoken cue.
   */
  onSpeechStart?: (text: string) => void;
  /**
   * Optional content rendered in the spoken-text area (between the phase
   * label and the waveform). The voice screen no longer shows Yuna's
   * transcript — this slot is used for in-session prompts like the intro
   * questionnaire chips.
   */
  spokenAreaSlot?: ReactNode;
  /**
   * Whether the user has granted mic permission. When false, the mic
   * button + mode-switch pill are hidden and the phase label avoids
   * hold-to-talk copy — used during the chat-now voice opener where Yuna
   * speaks + the on-device survey runs before the permission ask.
   * Defaults to true so existing call sites are unaffected.
   */
  micEnabled?: boolean;
  /**
   * When true the avatar shrinks + snugs to the top to make room for a
   * tall slot (the questionnaire). Single-button slots like the mic CTA
   * keep the avatar in its default centered position.
   */
  compactLayout?: boolean;
};

export const VoiceSession = forwardRef<VoiceSessionHandle, VoiceSessionProps>(function VoiceSession(
  {
    onEndCall,
    initialGreetingLines,
    onMessageAppended,
    onSpeechStart,
    spokenAreaSlot,
    micEnabled = true,
    compactLayout = false,
  },
  ref,
) {
  const { avatar } = useYunaIdentity();
  const [phase, setPhase] = useState<Phase>("connecting");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("hold");
  const [modeDrawerOpen, setModeDrawerOpen] = useState(false);

  const recognitionRef = useRef<RecognitionHandle | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const turnsRef = useRef<ChatMsg[]>(loadStoredMessages());
  // Guards against StrictMode's double-invoked mount effect appending the
  // greeting turns twice. The audio pipeline already has its own
  // supersession check; this protects the chat thread state.
  const greetingAppendedRef = useRef(false);
  const speakerOnRef = useRef(speakerOn);
  const phaseRef = useRef<Phase>(phase);
  const endedRef = useRef(false);
  const secondsRef = useRef(0);
  const inputModeRef = useRef<InputMode>(inputMode);
  const onMessageAppendedRef = useRef(onMessageAppended);
  const onSpeechStartRef = useRef(onSpeechStart);

  useEffect(() => {
    onMessageAppendedRef.current = onMessageAppended;
  }, [onMessageAppended]);
  useEffect(() => {
    onSpeechStartRef.current = onSpeechStart;
  }, [onSpeechStart]);
  useEffect(() => {
    speakerOnRef.current = speakerOn;
  }, [speakerOn]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);
  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;
    if (!speakerOnRef.current) return;
    const voiceId = getVoice();
    if (!voiceId) return;
    const cfg = VOICES[voiceId];

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

    try {
      const blobUrl = await fetchTtsBlobUrl(cfg.elevenlabsId, text);
      if (endedRef.current) return;
      // Bail if a newer speak() call has superseded us — without this,
      // a StrictMode double-mount (or any concurrent invocation) can leave
      // two audio elements both calling play() once their blob fetches
      // resolve, producing the "two voices at once" echo.
      if (ttsAudioRef.current !== el) return;
      el.src = blobUrl;
      el.currentTime = 0;
      await new Promise<void>((resolve) => {
        const done = () => {
          el.onended = null;
          el.onerror = null;
          el.onplaying = null;
          resolve();
        };
        el.onplaying = () => {
          if (endedRef.current) return;
          setPhase("speaking");
          onSpeechStartRef.current?.(text);
        };
        el.onended = done;
        el.onerror = done;
        el.play().catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") {
            done();
            return;
          }
          console.error("Call TTS play failed", err);
          done();
        });
      });
    } catch (err) {
      console.error("Call TTS fetch failed", err);
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const beginListening = useCallback(() => {
    if (endedRef.current) return;
    if (!isSpeechRecognitionSupported()) {
      setLiveTranscript("");
      setPhase("muted");
      return;
    }
    setLiveTranscript("");
    setPhase("listening");
    clearSilenceTimer();

    const handsFree = inputModeRef.current === "hands-free";

    const handle = startRecognition({
      onTranscript: (live) => {
        setLiveTranscript(live);
        if (!handsFree) return;
        // Auto-commit: when the user pauses, ship the turn. Resets on
        // every new partial so a long answer doesn't get clipped mid-thought.
        clearSilenceTimer();
        if (live.trim()) {
          silenceTimerRef.current = setTimeout(() => {
            recognitionRef.current?.stop();
          }, TURN_END_SILENCE_MS);
        }
      },
      onFinal: (committed) => {
        clearSilenceTimer();
        recognitionRef.current = null;
        const text = committed.trim();
        if (!text) {
          if (endedRef.current) return;
          if (phaseRef.current !== "listening") return;
          // Empty result in hands-free → loop back into listening so the
          // session stays open; hold-to-talk falls back to idle so the user
          // can press again.
          if (inputModeRef.current === "hands-free") {
            beginListening();
          } else {
            setPhase("idle");
          }
          return;
        }
        void handleUserTurn(text);
      },
      onError: (err) => {
        clearSilenceTimer();
        recognitionRef.current = null;
        if (err.error === "not-allowed" || err.error === "service-not-allowed") {
          console.warn("Call mic permission denied");
          requestEnd();
          return;
        }
        if (endedRef.current) return;
        if (phaseRef.current !== "listening") return;
        if (inputModeRef.current === "hands-free") {
          // Re-arm after transient errors (no-speech, network blip) so the
          // call doesn't silently fall out of hands-free.
          setTimeout(() => {
            if (!endedRef.current && inputModeRef.current === "hands-free") {
              beginListening();
            }
          }, 400);
        } else {
          setPhase("idle");
        }
      },
    });

    if (!handle) {
      setPhase("muted");
      return;
    }
    recognitionRef.current = handle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSilenceTimer]);

  const stopYunaSpeaking = useCallback(() => {
    const el = ttsAudioRef.current;
    if (el) {
      el.onended = null;
      el.onerror = null;
      el.onplaying = null;
      el.pause();
      try {
        el.removeAttribute("src");
        el.load();
      } catch {
        /* ignore */
      }
      ttsAudioRef.current = null;
    }
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
  }, []);

  const startHold = useCallback(() => {
    if (endedRef.current) return;
    if (inputModeRef.current !== "hold") return;
    const p = phaseRef.current;
    if (p === "listening" || p === "ending" || p === "muted") return;
    if (p === "speaking" || p === "thinking") {
      stopYunaSpeaking();
    }
    beginListening();
  }, [beginListening, stopYunaSpeaking]);

  const endHold = useCallback(() => {
    if (endedRef.current) return;
    if (inputModeRef.current !== "hold") return;
    const handle = recognitionRef.current;
    if (handle) {
      handle.stop();
    } else if (phaseRef.current === "listening") {
      setPhase("idle");
    }
  }, []);

  // Hands-free tap behavior on the big mic button: toggle mute. If Yuna is
  // mid-sentence, treat the tap as a barge-in so the user can interrupt
  // without having to switch modes first.
  const toggleHandsFreeMic = useCallback(() => {
    if (endedRef.current) return;
    if (inputModeRef.current !== "hands-free") return;
    const p = phaseRef.current;
    if (p === "ending") return;
    if (p === "muted") {
      beginListening();
      return;
    }
    if (p === "speaking" || p === "thinking") {
      stopYunaSpeaking();
      beginListening();
      return;
    }
    if (p === "listening") {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      clearSilenceTimer();
      setLiveTranscript("");
      setPhase("muted");
      return;
    }
    // idle / connecting → kick off listening
    beginListening();
  }, [beginListening, clearSilenceTimer, stopYunaSpeaking]);

  // Mode switch from the pill. Switching INTO hands-free from idle starts
  // listening so the user doesn't have to take a second action; switching
  // OUT while listening releases the mic and waits for the next press.
  const switchInputMode = useCallback(
    (next: InputMode) => {
      if (endedRef.current) return;
      if (next === inputModeRef.current) return;
      inputModeRef.current = next;
      setInputMode(next);
      const p = phaseRef.current;
      if (next === "hands-free") {
        if (p === "idle" || p === "muted") {
          beginListening();
        }
        return;
      }
      // Switching to hold-to-talk: stop any auto-listen so we don't keep
      // capturing audio behind the user's back.
      clearSilenceTimer();
      if (p === "listening") {
        recognitionRef.current?.abort();
        recognitionRef.current = null;
        setLiveTranscript("");
        setPhase("idle");
      } else if (p === "muted") {
        setPhase("idle");
      }
    },
    [beginListening, clearSilenceTimer],
  );

  const handleUserTurn = useCallback(
    async (userText: string) => {
      if (endedRef.current) return;
      setLiveTranscript("");
      setPhase("thinking");

      const userMsg: ChatMsg = {
        id: chatUid(),
        from: "you",
        kind: "text",
        text: userText,
      };
      turnsRef.current = [...turnsRef.current, userMsg];
      onMessageAppendedRef.current?.(userMsg);

      const conversation = turnsRef.current
        .filter((m): m is Extract<ChatMsg, { kind: "text" }> => m.kind === "text")
        .map((m) => ({
          role: m.from === "you" ? "user" : "assistant",
          content: m.text,
        }));

      let buffer = "";
      const ctrl = new AbortController();
      chatAbortRef.current = ctrl;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: conversation }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) throw new Error(`chat ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let pending = "";
        let finalText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (endedRef.current) break;
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
            } else if (eventType === "done") {
              finalText = (data.text as string | undefined) ?? buffer;
            } else if (eventType === "error") {
              throw new Error(data.message ?? "Server error");
            }
          }
        }
        if (endedRef.current) return;
        if (phaseRef.current === "listening") return;
        const replyText = (finalText || buffer).trim();
        if (!replyText) {
          settleAfterYuna();
          return;
        }

        const yunaMsg: ChatMsg = {
          id: chatUid(),
          from: "yuna",
          kind: "text",
          text: replyText,
        };
        turnsRef.current = [...turnsRef.current, yunaMsg];
        onMessageAppendedRef.current?.(yunaMsg);

        setPhase("speaking");
        await speak(replyText);
        if (endedRef.current) return;
        if (phaseRef.current === "speaking") settleAfterYuna();
      } catch (err) {
        if (endedRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (phaseRef.current === "listening") return;
        console.error("Call chat error", err);
        const fallback = "I'm having trouble connecting right now. Could we try again in a moment?";
        setPhase("speaking");
        await speak(fallback);
        if (endedRef.current) return;
        if (phaseRef.current === "speaking") settleAfterYuna();
      } finally {
        if (chatAbortRef.current === ctrl) chatAbortRef.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speak],
  );

  // After Yuna finishes a turn, settle into the next phase based on input
  // mode: hands-free auto-resumes listening so the conversation flows;
  // hold-to-talk drops back to idle so the user can press when ready.
  const settleAfterYuna = useCallback(() => {
    if (endedRef.current) return;
    if (phaseRef.current === "muted") return;
    if (inputModeRef.current === "hands-free") {
      beginListening();
    } else {
      setPhase("idle");
    }
  }, [beginListening]);

  useImperativeHandle(
    ref,
    () => ({
      speakYunaLine: async (text: string) => {
        if (endedRef.current) return;
        if (!text.trim()) return;
        // Tear down any in-flight recognition turn so Yuna doesn't talk over
        // the user's mic input and the silence timer doesn't fire mid-speech.
        recognitionRef.current?.abort();
        recognitionRef.current = null;
        clearSilenceTimer();
        setLiveTranscript("");
        setPhase("speaking");

        const yunaMsg: ChatMsg = {
          id: chatUid(),
          from: "yuna",
          kind: "text",
          text,
        };
        turnsRef.current = [...turnsRef.current, yunaMsg];
        onMessageAppendedRef.current?.(yunaMsg);

        await speak(text);
        if (endedRef.current) return;
        settleAfterYuna();
      },
    }),
    [speak, clearSilenceTimer, settleAfterYuna],
  );

  useEffect(() => {
    endedRef.current = false;
    let cancelled = false;
    (async () => {
      const hasInitialLines = !!initialGreetingLines && initialGreetingLines.length > 0;
      // Re-entry into voice mid-session (text↔voice toggle) shouldn't
      // re-greet — the user already heard or read the opener. Skip
      // composeGreeting and drop straight into the listen/idle loop so
      // the conversation feels continuous.
      if (!hasInitialLines && getVoiceGreeted()) {
        if (cancelled || endedRef.current) return;
        settleAfterYuna();
        return;
      }

      // Caller-provided lines (chat-now → voice) skip the API roundtrip so
      // Yuna says the exact same welcome + ask as the text-mode flow.
      const lines = hasInitialLines
        ? initialGreetingLines!
        : [await composeGreeting(turnsRef.current)];

      if (cancelled || endedRef.current) return;

      if (!greetingAppendedRef.current) {
        greetingAppendedRef.current = true;
        const newTurns: ChatMsg[] = lines.map((text) => ({
          id: chatUid(),
          from: "yuna",
          kind: "text",
          text,
        }));
        turnsRef.current = [...turnsRef.current, ...newTurns];
        for (const m of newTurns) onMessageAppendedRef.current?.(m);
      }

      // Flip the session flag before speaking so a mid-greeting unmount
      // (e.g. user toggles back to text) still prevents the next voice
      // mount from re-greeting.
      setVoiceGreeted();

      for (const line of lines) {
        if (cancelled || endedRef.current) return;
        await speak(line);
      }
      if (cancelled || endedRef.current) return;
      settleAfterYuna();
    })();

    return () => {
      cancelled = true;
      // Pause any in-flight greeting audio so a StrictMode double-mount (or
      // unmount mid-utterance) doesn't leave the first invocation playing
      // alongside the second. The supersession check inside speak() handles
      // the racing-fetch case; this handles the already-playing case.
      ttsAudioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestEnd = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setPhase("ending");
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    onEndCall(secondsRef.current);
  }, [onEndCall]);

  useEffect(() => {
    endedRef.current = false;
    return () => {
      endedRef.current = true;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      ttsAudioRef.current?.pause();
      ttsAudioRef.current = null;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Smooth the swap between the default layout (big avatar + waveform) and
  // the compact layout (small row + answer slot). When the compact flag
  // flips, we hold the old layout briefly and fade it out, then swap the
  // DOM and let the new layout fade back in via the wrapper's opacity
  // transition. Slot-only changes (e.g. moving from question N to N+1)
  // swap immediately so chip taps feel responsive.
  const [displayedCompact, setDisplayedCompact] = useState(compactLayout);
  const [displayedSlot, setDisplayedSlot] = useState<ReactNode>(spokenAreaSlot);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (displayedCompact === compactLayout) {
      if (displayedSlot !== spokenAreaSlot) setDisplayedSlot(spokenAreaSlot);
      return;
    }
    setFadingOut(true);
    const t = setTimeout(() => {
      setDisplayedCompact(compactLayout);
      setDisplayedSlot(spokenAreaSlot);
      setFadingOut(false);
    }, 220);
    return () => clearTimeout(t);
  }, [compactLayout, spokenAreaSlot, displayedCompact, displayedSlot]);

  const showPulseRings = phase === "speaking";
  // Pre-mic-permission the hold-to-talk vocabulary doesn't apply yet —
  // Yuna is doing the talking; the user's interaction is the questionnaire
  // / CTA in the slot. "Tap to respond" only applies to the chips/picker
  // (compact layout); when the slot is just the Enable-microphone CTA after
  // onboarding, fall through to the normal speaking label so the user sees
  // Yuna reflecting on what they just answered.
  const phaseLabel = displayedSlot && displayedCompact
    ? "Tap to respond"
    : !micEnabled
      ? phase === "speaking"
        ? "Yuna is speaking"
        : ""
      : inputMode === "hands-free"
        ? PHASE_LABEL_HANDSFREE[phase]
        : PHASE_LABEL_HOLD[phase];
  // With the mic button hidden in hands-free, the old "Tap mic to …" copy
  // doesn't apply — just show the mode name. Hold mode keeps its
  // press-state copy so the user always knows whether they're holding.
  const helperLabel =
    inputMode === "hands-free"
      ? "Hands-free"
      : phase === "listening"
        ? "Release to send"
        : "Hold to talk";

  return (
    <div
      className={
        "relative flex-1 flex flex-col items-center px-8 min-h-0 transition-[padding] duration-300 ease-out " +
        (displayedCompact ? "pb-8" : "pb-12")
      }
    >
      <div
        className={
          "flex-1 w-full flex flex-col items-center min-h-0 transition-opacity duration-300 ease-out " +
          (fadingOut ? "opacity-0" : "opacity-100")
        }
      >
        {displayedCompact && displayedSlot ? (
          // Compact + slot: a small avatar + instruction row sits at the top,
          // and the answer panel grows to fill the remaining vertical space so
          // long pickers (multi-priority list) can scroll inside their own
          // bounded area rather than pushing the rest of the screen around.
          <>
            <div className="w-full flex items-center justify-center gap-3 shrink-0 mt-8 mb-8">
              <div className="relative h-10 w-10 shrink-0 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm overflow-hidden flex items-center justify-center">
                {avatar ? (
                  <YunaAvatar variant={avatar} size={40} />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <p className="font-display text-base leading-snug text-white">
                Tap a response below to continue
              </p>
            </div>
            <div className="w-full flex-1 min-h-0 flex flex-col items-stretch gap-3">
              {displayedSlot}
            </div>
          </>
        ) : (
          <>
            <div
              className="w-full shrink-0 transition-[flex-grow] duration-300 ease-out"
              style={{ flexGrow: 1 }}
            />
            <div className="relative flex items-center justify-center shrink-0 transition-all duration-300 ease-out h-44 w-44">
              {showPulseRings && (
                <>
                  <span className="absolute inset-0 rounded-full border border-white/40 yuna-pulse-ring" />
                  <span
                    className="absolute inset-3 rounded-full border border-white/40 yuna-pulse-ring"
                    style={{ animationDelay: "600ms" }}
                  />
                </>
              )}
              <div className="relative rounded-full border border-white/25 bg-white/10 backdrop-blur-sm overflow-hidden flex items-center justify-center transition-all duration-300 ease-out h-32 w-32">
                {avatar ? (
                  <YunaAvatar variant={avatar} size={128} />
                ) : (
                  <span className="h-3 w-3 rounded-full bg-white" />
                )}
              </div>
            </div>

            <div className="text-center transition-all duration-300 ease-out mt-8">
              <h1 className="text-xl tracking-tight text-white">{phaseLabel}</h1>
            </div>

            {!displayedSlot && (
              <div className="flex-1 flex items-end justify-center min-h-[64px] w-full">
                <div
                  className="w-full"
                  style={{ marginLeft: "-2rem", marginRight: "-2rem", width: "calc(100% + 4rem)" }}
                >
                  <VoiceWaveform active={phase === "listening"} />
                </div>
              </div>
            )}

            {displayedSlot && (
              <>
                <div className="w-full shrink-0 flex-1" />
                <div className="w-full max-w-[20rem] flex flex-col items-center text-center gap-2">
                  {displayedSlot}
                </div>
              </>
            )}

            {!displayedSlot && micEnabled && (
              <div className="mt-4 flex flex-col items-center gap-3 shrink-0">
                {inputMode === "hold" && (
                  <VoiceMicButton
                    phase={phase}
                    inputMode={inputMode}
                    onPressStart={startHold}
                    onPressEnd={endHold}
                    onTap={toggleHandsFreeMic}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setModeDrawerOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={modeDrawerOpen}
                  aria-label={`Switch mic mode (current: ${inputMode === "hold" ? "Hold to talk" : "Hands-free"})`}
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/70 active:text-white transition-colors"
                >
                  {helperLabel}
                  <ChevronDown size={11} strokeWidth={1.6} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <VoiceModeDrawer
        open={modeDrawerOpen}
        onOpenChange={setModeDrawerOpen}
        current={inputMode}
        onSelect={(next) => {
          switchInputMode(next);
          setModeDrawerOpen(false);
        }}
      />
    </div>
  );
});

function VoiceModeDrawer({
  open,
  onOpenChange,
  current,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  current: InputMode;
  onSelect: (next: InputMode) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[1.5rem]">
        <DrawerHeader className="text-left px-6 pt-2">
          <DrawerTitle className="font-serif text-xl tracking-tight">
            Conversation mode
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-6 pb-10">
          <NavList>
            <ModeRow
              icon={<Hand size={18} strokeWidth={1.5} aria-hidden="true" />}
              title="Hold to talk"
              description="Press and hold the mic when you want to speak."
              selected={current === "hold"}
              onClick={() => onSelect("hold")}
            />
            <ModeRow
              icon={<Radio size={18} strokeWidth={1.5} aria-hidden="true" />}
              title="Hands-free"
              description="I'll listen continuously. Just talk when you're ready."
              selected={current === "hands-free"}
              onClick={() => onSelect("hands-free")}
            />
          </NavList>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ModeRow({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-t border-border first:border-t-0 active:bg-accent/40"
    >
      <span className="h-9 w-9 rounded-full flex items-center justify-center text-foreground shrink-0">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs leading-snug text-foreground/70 mt-0.5">{description}</span>
      </span>
      {selected && (
        <Check size={16} strokeWidth={2} aria-hidden="true" className="text-foreground shrink-0 mt-1" />
      )}
    </button>
  );
}

function VoiceMicButton({
  phase,
  inputMode,
  onPressStart,
  onPressEnd,
  onTap,
}: {
  phase: Phase;
  inputMode: InputMode;
  onPressStart: () => void;
  onPressEnd: () => void;
  onTap: () => void;
}) {
  const listening = phase === "listening";
  const muted = phase === "muted";
  const disabled = phase === "ending" || (inputMode === "hold" && muted);
  const handsFree = inputMode === "hands-free";

  // Hold mode: capture press to drive recognition lifecycle.
  // Hands-free: a tap toggles mute, so we only fire onTap on click.
  const handlers = handsFree
    ? {
        onClick: () => {
          if (disabled) return;
          onTap();
        },
      }
    : {
        onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          onPressStart();
        },
        onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          onPressEnd();
        },
        onPointerCancel: () => onPressEnd(),
        onContextMenu: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
      };

  const ariaLabel = handsFree
    ? muted
      ? "Tap to unmute"
      : listening
        ? "Tap to mute"
        : "Tap to start listening"
    : listening
      ? "Release to send"
      : "Hold to talk";

  const classes = (() => {
    const base =
      "relative h-20 w-20 rounded-full flex items-center justify-center select-none transition-transform duration-150 ";
    if (disabled) return base + "bg-white/15 text-white/40 cursor-not-allowed";
    if (handsFree && muted) {
      return base + "bg-white/15 text-white/65 border border-white/30 active:scale-95";
    }
    if (listening) {
      return base + "bg-white text-foreground scale-110 shadow-[0_0_0_10px_rgba(255,255,255,0.12)]";
    }
    return base + "bg-white text-foreground active:scale-95";
  })();

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={handsFree ? !muted : undefined}
      disabled={disabled}
      {...handlers}
      className={classes}
    >
      {listening && (
        <>
          <span className="absolute inset-0 rounded-full border border-white/30 yuna-pulse-ring" />
          <span
            className="absolute -inset-2 rounded-full border border-white/20 yuna-pulse-ring"
            style={{ animationDelay: "500ms" }}
          />
        </>
      )}
      {handsFree && muted ? <MicOffGlyph /> : <MicGlyph />}
    </button>
  );
}

function MicGlyph() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function MicOffGlyph() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="3" y1="3" x2="21" y2="21" />
      <path d="M9 9.05V6a3 3 0 0 1 5.7-1.32" />
      <path d="M15 9.34V11a3 3 0 0 1-3 3" />
      <path d="M5 11a7 7 0 0 0 10.7 5.95" />
      <path d="M19 11a7 7 0 0 1-.16 1.5" />
      <path d="M12 18v3" />
    </svg>
  );
}

const WAVE_VIEW_W = 400;
const WAVE_VIEW_H = 120;
const WAVE_MID = WAVE_VIEW_H / 2;
const WAVE_SEGMENTS = 96;
const WAVE_LEVEL_GAIN = 6;

function VoiceWaveform({ active }: { active: boolean }) {
  const pathRef = useRef<SVGPathElement>(null);
  const mode = useAppMode();
  const stroke = mode === "light" ? "rgba(20, 20, 22, 0.75)" : "rgba(255, 255, 255, 0.7)";

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let raf = 0;
    let smoothed = 0;
    let phase = 0;

    const draw = () => {
      const path = pathRef.current;
      if (!path) return;
      const boosted = Math.min(1, smoothed * WAVE_LEVEL_GAIN);
      const amp = 0.5 + boosted * (WAVE_MID - 2);
      let d = `M 0 ${WAVE_MID.toFixed(2)}`;
      for (let i = 1; i <= WAVE_SEGMENTS; i++) {
        const x = (i / WAVE_SEGMENTS) * WAVE_VIEW_W;
        const t = i / WAVE_SEGMENTS;
        const wave = (Math.sin(t * 7 + phase) + Math.sin(t * 13 + phase * 1.4) * 0.35) / 1.35;
        const taper = 0.3 + 0.7 * Math.sin(t * Math.PI);
        const y = WAVE_MID + wave * amp * taper;
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      path.setAttribute("d", d);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const Ctx: typeof AudioContext =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new Ctx();
        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.85;
        source.connect(analyser);

        const buf = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (cancelled || !analyser) return;
          analyser.getByteFrequencyData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i];
          const lvl = sum / buf.length / 255;
          smoothed = smoothed * 0.65 + lvl * 0.35;
          phase += 0.04 + smoothed * 0.12;
          draw();
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.warn("Voice waveform mic unavailable", err);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (audioCtx) audioCtx.close().catch(() => {});
      if (stream) stream.getTracks().forEach((t) => t.stop());
      pathRef.current?.setAttribute("d", `M 0 ${WAVE_MID} L ${WAVE_VIEW_W} ${WAVE_MID}`);
    };
  }, [active]);

  return (
    <div
      aria-hidden
      className={
        "w-full pointer-events-none transition-opacity duration-500 " +
        (active ? "opacity-100" : "opacity-0")
      }
    >
      <svg
        className="block w-full h-16 overflow-visible"
        viewBox={`0 0 ${WAVE_VIEW_W} ${WAVE_VIEW_H}`}
        preserveAspectRatio="none"
      >
        <path
          ref={pathRef}
          d={`M 0 ${WAVE_MID} L ${WAVE_VIEW_W} ${WAVE_MID}`}
          fill="none"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

async function composeGreeting(history: ChatMsg[]): Promise<string> {
  const textTurns = history.filter(
    (m): m is Extract<ChatMsg, { kind: "text" }> => m.kind === "text",
  );
  const continuing = textTurns.length > 0;

  if (!continuing) {
    return "Hey, I'm here. What's coming up for you?";
  }

  const conversation = textTurns.map((m) => ({
    role: m.from === "you" ? "user" : "assistant",
    content: m.text,
  }));
  conversation.push({
    role: "user",
    content:
      "[The user just switched to voice. Greet them warmly and pick the conversation up in one or two short sentences. Do not recap or apologise. Speak as if continuing naturally out loud.]",
  });

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 6000);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) throw new Error(`chat ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    let buffer = "";
    let final = "";
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
        let data: { text?: string };
        try {
          data = JSON.parse(dataLine.slice(6));
        } catch {
          continue;
        }
        if (eventType === "delta" && typeof data.text === "string") {
          buffer += data.text;
        } else if (eventType === "done" && typeof data.text === "string") {
          final = data.text;
        }
      }
    }
    const out = (final || buffer).trim();
    if (out) return out;
  } catch (err) {
    console.warn("Greeting generation failed; falling back", err);
  } finally {
    clearTimeout(timeout);
  }

  return "I'm right here. Keep going whenever you're ready.";
}
