import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { YunaAvatar } from "@/components/YunaAvatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useAppMode } from "@/lib/theme-prefs";
import { getVoice, useYunaIdentity } from "@/lib/yuna-session";
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

type Phase = "connecting" | "idle" | "listening" | "thinking" | "speaking" | "muted" | "ending";

type InputMode = "hold" | "hands-free";

// Hands-free auto-commit window: how long after the user goes silent we
// treat the turn as finished and ship the transcript. Matches the prior
// continuous-listen behavior from before hold-to-talk landed.
const TURN_END_SILENCE_MS = 1500;

const PHASE_LABEL_HOLD: Record<Phase, string> = {
  connecting: "Connecting…",
  idle: "Hold the mic to talk",
  listening: "I'm listening",
  thinking: "Thinking…",
  speaking: "Yuna is speaking",
  muted: "Muted",
  ending: "Wrapping up…",
};

const PHASE_LABEL_HANDSFREE: Record<Phase, string> = {
  connecting: "Connecting…",
  idle: "Just a moment…",
  listening: "I'm listening",
  thinking: "Thinking…",
  speaking: "Yuna is speaking",
  muted: "Tap mic to resume",
  ending: "Wrapping up…",
};

type VoiceSessionProps = {
  onEndCall: (durationSec: number) => void;
  /**
   * Optional spoken opener. When provided, VoiceSession speaks these lines
   * in sequence on mount instead of calling composeGreeting. Used by the
   * chat-now → voice flow so Yuna says the same welcome the text-mode flow
   * types out.
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
   * Whether the user has granted mic permission. When false the hold-to-talk
   * button still renders, but pressing it routes through
   * `onRequestMicPermission` (the parent owns the permission dialog) instead
   * of starting recognition.
   */
  micEnabled?: boolean;
  /**
   * Called when the user activates the mic without permission yet — hold
   * press in hold-mode, or tap in hands-free. The parent surfaces the
   * permission dialog; once granted it flips `micEnabled` and the next
   * press records normally.
   */
  onRequestMicPermission?: () => void;
};

export function VoiceSession({
  onEndCall,
  initialGreetingLines,
  onMessageAppended,
  micEnabled = true,
  onRequestMicPermission,
}: VoiceSessionProps) {
  const { avatar } = useYunaIdentity();
  const [phase, setPhase] = useState<Phase>("connecting");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("hold");
  const [modeDrawerOpen, setModeDrawerOpen] = useState(false);
  const [voiceAnalyser, setVoiceAnalyser] = useState<AnalyserNode | null>(null);

  const recognitionRef = useRef<RecognitionHandle | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
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
  const onRequestMicPermissionRef = useRef(onRequestMicPermission);
  const micEnabledRef = useRef(micEnabled);

  useEffect(() => {
    onMessageAppendedRef.current = onMessageAppended;
  }, [onMessageAppended]);
  useEffect(() => {
    onRequestMicPermissionRef.current = onRequestMicPermission;
  }, [onRequestMicPermission]);
  useEffect(() => {
    micEnabledRef.current = micEnabled;
  }, [micEnabled]);
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

  // Live waveform analyser — runs in parallel with speech recognition so the
  // hold-to-talk pad can render the user's actual voice. Recognition opens
  // its own mic stream; the analyser takes a second getUserMedia handle and
  // pipes it through an AudioContext. Both are torn down whenever listening
  // ends so we don't leak the mic indicator.
  const stopAudioAnalyser = useCallback(() => {
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setVoiceAnalyser(null);
  }, []);

  const startAudioAnalyser = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (endedRef.current || phaseRef.current !== "listening") {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
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
      // Mic blocked — Waveform falls back to its baseline bars.
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
        stopAudioAnalyser();
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
        stopAudioAnalyser();
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
    void startAudioAnalyser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSilenceTimer, startAudioAnalyser, stopAudioAnalyser]);

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
    if (!micEnabledRef.current) {
      // Pre-permission: the button is the grant trigger. Hand off to the
      // parent's permission flow; recognition resumes via the same button
      // on a subsequent press once `micEnabled` flips true.
      onRequestMicPermissionRef.current?.();
      return;
    }
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
      stopAudioAnalyser();
      setPhase("idle");
    }
  }, [stopAudioAnalyser]);

  // Hands-free tap behavior on the big mic button: toggle mute. If Yuna is
  // mid-sentence, treat the tap as a barge-in so the user can interrupt
  // without having to switch modes first.
  const toggleHandsFreeMic = useCallback(() => {
    if (endedRef.current) return;
    if (inputModeRef.current !== "hands-free") return;
    const p = phaseRef.current;
    if (p === "ending") return;
    if (!micEnabledRef.current) {
      onRequestMicPermissionRef.current?.();
      return;
    }
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
      stopAudioAnalyser();
      setLiveTranscript("");
      setPhase("muted");
      return;
    }
    // idle / connecting → kick off listening
    beginListening();
  }, [beginListening, clearSilenceTimer, stopYunaSpeaking, stopAudioAnalyser]);

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
        stopAudioAnalyser();
        setLiveTranscript("");
        setPhase("idle");
      } else if (p === "muted") {
        setPhase("idle");
      }
    },
    [beginListening, clearSilenceTimer, stopAudioAnalyser],
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
    stopAudioAnalyser();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    onEndCall(secondsRef.current);
  }, [onEndCall, stopAudioAnalyser]);

  useEffect(() => {
    endedRef.current = false;
    return () => {
      endedRef.current = true;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      ttsAudioRef.current?.pause();
      ttsAudioRef.current = null;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, []);

  const showPulseRings = phase === "speaking";
  const phaseLabel =
    inputMode === "hands-free" ? PHASE_LABEL_HANDSFREE[phase] : PHASE_LABEL_HOLD[phase];

  return (
    <div className="relative flex-1 flex flex-col items-center px-8 min-h-0 pb-6">
      <div className="flex-1 w-full flex flex-col items-center min-h-0">
        <VoicePad
          phase={phase}
          phaseLabel={phaseLabel}
          avatar={avatar}
          showPulseRings={showPulseRings}
          analyser={voiceAnalyser}
          inputMode={inputMode}
          onPressStart={startHold}
          onPressEnd={endHold}
          onToggleMic={toggleHandsFreeMic}
          onOpenModeDrawer={() => setModeDrawerOpen(true)}
        />
      </div>

      <PrivacyFooter
        onLeaveFeedback={() => {
          // Placeholder — wire to a real feedback drawer once it exists.
          console.log("Leave feedback tapped");
        }}
      />

      <ModeDrawer
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
}

function VoicePad({
  phase,
  phaseLabel,
  avatar,
  showPulseRings,
  analyser,
  inputMode,
  onPressStart,
  onPressEnd,
  onToggleMic,
  onOpenModeDrawer,
}: {
  phase: Phase;
  phaseLabel: string;
  avatar: ReturnType<typeof useYunaIdentity>["avatar"];
  showPulseRings: boolean;
  analyser: AnalyserNode | null;
  inputMode: InputMode;
  onPressStart: () => void;
  onPressEnd: () => void;
  onToggleMic: () => void;
  onOpenModeDrawer: () => void;
}) {
  const listening = phase === "listening";
  const muted = phase === "muted";
  const disabled = phase === "ending" || phase === "muted";
  const holdMode = inputMode === "hold";
  // Only the hold-to-talk surface captures press gestures. Hands-free keeps
  // the same visual frame but doesn't react to taps on the pad itself —
  // the mic toggle and mode drawer drive that flow instead.
  const pressActive = holdMode && !disabled;

  const pressHandlers = pressActive
    ? {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onPressStart();
        },
        onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          onPressEnd();
        },
        onPointerCancel: () => onPressEnd(),
        onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => e.preventDefault(),
      }
    : {};

  const containerBase =
    "relative w-full flex-1 min-h-0 rounded-2xl overflow-hidden backdrop-blur-md transition-colors duration-150 ";
  const containerState = disabled
    ? "bg-white/[0.06] text-white/40"
    : listening
      ? "bg-white/[0.18] text-white"
      : "bg-white/[0.08] text-white";

  // Stops a tap on the 3-dot menu from also triggering the surrounding
  // press-to-talk gesture when it lives inside the pressable region.
  const stopPress = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      {...pressHandlers}
      aria-label={pressActive ? (listening ? "Release to send" : "Hold to talk") : undefined}
      role={pressActive ? "button" : undefined}
      className={
        containerBase +
        containerState +
        (pressActive ? " cursor-pointer select-none active:bg-white/[0.14]" : "")
      }
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.10) 0.9px, transparent 1.2px)",
          backgroundSize: "12px 12px",
        }}
      />
      <VoiceWaveform active={listening} analyser={analyser} />
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center gap-5 px-5 py-8">
        {/* Idle hold-mode hides the label — "HOLD TO TALK" below the avatar
            already states the affordance, so doubling it is just noise. Slot
            stays mounted (just invisible) so the avatar and footer row don't
            shift up when we drop the label. */}
        <div
          className={
            "shrink-0 text-center transition-opacity duration-200 " +
            (inputMode === "hold" && phase === "idle" ? "opacity-0" : "opacity-100")
          }
          aria-hidden={inputMode === "hold" && phase === "idle"}
        >
          <p className="text-base tracking-tight text-white/85">{phaseLabel}</p>
        </div>

        <div className="relative flex items-center justify-center h-40 w-40 shrink-0">
          {showPulseRings && (
            <>
              <span className="absolute inset-0 rounded-full border border-white/40 yuna-pulse-ring" />
              <span
                className="absolute inset-3 rounded-full border border-white/40 yuna-pulse-ring"
                style={{ animationDelay: "600ms" }}
              />
            </>
          )}
          <div className="relative rounded-full border border-white/25 bg-white/10 backdrop-blur-sm overflow-hidden flex items-center justify-center h-32 w-32">
            {avatar ? (
              <YunaAvatar variant={avatar} size={128} />
            ) : (
              <span className="h-3 w-3 rounded-full bg-white" />
            )}
          </div>
        </div>

        <div className="shrink-0 w-full flex items-center justify-center min-h-12">
          {holdMode ? (
            <div className="inline-flex items-center gap-2 text-white/85">
              <MicGlyph />
              <span className="text-[12px] uppercase tracking-[0.18em]">
                {listening ? "Release to send" : "Hold to talk"}
              </span>
              <Button
                surface="dark"
                variant="ghost"
                size="icon-sm"
                aria-label="Voice options"
                onClick={onOpenModeDrawer}
                onPointerDown={stopPress}
                className="ml-1"
              >
                <MoreDotsGlyph />
              </Button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2">
              <Button
                surface="dark"
                variant="secondary"
                size="md"
                onClick={onToggleMic}
                disabled={phase === "ending" || phase === "connecting"}
                aria-pressed={muted}
                className="text-[12px] uppercase tracking-[0.18em]"
              >
                {muted ? <MicOffGlyph /> : <MicGlyph />}
                {muted ? "Unmute mic" : "Mute mic"}
              </Button>
              <Button
                surface="dark"
                variant="ghost"
                size="icon"
                aria-label="Voice options"
                onClick={onOpenModeDrawer}
              >
                <MoreDotsGlyph />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PrivacyFooter({ onLeaveFeedback }: { onLeaveFeedback: () => void }) {
  return (
    <div className="shrink-0 w-full flex items-center justify-center gap-2 pt-4 text-[12px] tracking-[0.02em] text-white/75">
      <span className="inline-flex items-center gap-1.5">
        <span>100% Private</span>
        <LockGlyph />
      </span>
      <span aria-hidden className="text-white/45">
        ·
      </span>
      <button
        type="button"
        onClick={onLeaveFeedback}
        className="text-white/85 active:text-white transition-colors"
      >
        Leave Feedback
      </button>
    </div>
  );
}

function ModeDrawer({
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
        <DrawerHeader className="text-left px-6 pt-3 pb-3">
          <DrawerTitle>
            Voice mode
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-6 pb-10 flex flex-col gap-2">
          <ModeOption
            label="Hold to Talk"
            description="Press and hold the panel to speak."
            selected={current === "hold"}
            onSelect={() => onSelect("hold")}
          />
          <ModeOption
            label="Hands-Free"
            description="Yuna listens continuously between turns."
            selected={current === "hands-free"}
            onSelect={() => onSelect("hands-free")}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ModeOption({
  label,
  description,
  selected,
  onSelect,
}: {
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={
        "w-full text-left rounded-2xl px-4 py-3 border transition-colors " +
        (selected
          ? "border-foreground/40 bg-foreground/5"
          : "border-border bg-transparent active:bg-foreground/[0.03]")
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-base text-foreground">{label}</span>
        {selected && <CheckGlyph />}
      </div>
      <p className="text-[13px] text-foreground/65 mt-0.5">{description}</p>
    </button>
  );
}

function MoreDotsGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MicGlyph() {
  return (
    <svg
      width="16"
      height="16"
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

const WAVE_VIEW_W = 400;
const WAVE_VIEW_H = 120;
const WAVE_MID = WAVE_VIEW_H / 2;
const WAVE_SEGMENTS = 96;
const WAVE_LEVEL_GAIN = 6;

function VoiceWaveform({
  active,
  analyser,
}: {
  active: boolean;
  analyser: AnalyserNode | null;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const mode = useAppMode();
  const stroke = mode === "light" ? "rgba(20, 20, 22, 0.55)" : "rgba(255, 255, 255, 0.55)";

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let smoothed = 0;
    let wavePhase = 0;
    const buf = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {
      const path = pathRef.current;
      if (!path) return;
      const boosted = Math.min(1, smoothed * WAVE_LEVEL_GAIN);
      const amp = 0.5 + boosted * (WAVE_MID - 2);
      let d = `M 0 ${WAVE_MID.toFixed(2)}`;
      for (let i = 1; i <= WAVE_SEGMENTS; i++) {
        const x = (i / WAVE_SEGMENTS) * WAVE_VIEW_W;
        const t = i / WAVE_SEGMENTS;
        const wave =
          (Math.sin(t * 7 + wavePhase) + Math.sin(t * 13 + wavePhase * 1.4) * 0.35) / 1.35;
        const taper = 0.3 + 0.7 * Math.sin(t * Math.PI);
        const y = WAVE_MID + wave * amp * taper;
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      path.setAttribute("d", d);
    };

    const tick = () => {
      if (analyser && buf) {
        analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        smoothed = smoothed * 0.65 + (sum / buf.length / 255) * 0.35;
      } else {
        // No mic feed yet — keep the line gently breathing so it doesn't
        // look frozen while permission is pending.
        smoothed = smoothed * 0.9;
      }
      wavePhase += 0.04 + smoothed * 0.12;
      draw();
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      pathRef.current?.setAttribute("d", `M 0 ${WAVE_MID} L ${WAVE_VIEW_W} ${WAVE_MID}`);
    };
  }, [active, analyser]);

  return (
    <div
      aria-hidden
      className={
        "pointer-events-none absolute inset-x-0 bottom-16 z-0 transition-opacity duration-500 " +
        (active ? "opacity-100" : "opacity-0")
      }
    >
      <svg
        className="block w-full h-24 overflow-visible"
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

function MicOffGlyph() {
  return (
    <svg
      width="16"
      height="16"
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
