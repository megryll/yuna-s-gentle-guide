import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
  loadStoredMessages,
  type ChatMsg,
} from "@/lib/chat-store";

type Phase =
  | "connecting"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "muted"
  | "ending";

const PHASE_LABEL: Record<Phase, string> = {
  connecting: "Connecting…",
  idle: "Hold the mic to talk",
  listening: "Listening",
  thinking: "Thinking…",
  speaking: "Yuna",
  muted: "Muted",
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
};

export const VoiceSession = forwardRef<VoiceSessionHandle, VoiceSessionProps>(
  function VoiceSession(
    { onEndCall, initialGreetingLines, onMessageAppended, onSpeechStart },
    ref,
  ) {
  const { avatar } = useYunaIdentity();
  const [phase, setPhase] = useState<Phase>("connecting");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [yunaSpoken, setYunaSpoken] = useState("");

  const recognitionRef = useRef<RecognitionHandle | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const turnsRef = useRef<ChatMsg[]>(loadStoredMessages());
  const speakerOnRef = useRef(speakerOn);
  const phaseRef = useRef<Phase>(phase);
  const endedRef = useRef(false);
  const secondsRef = useRef(0);
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

  const beginListening = useCallback(() => {
    if (endedRef.current) return;
    if (!isSpeechRecognitionSupported()) {
      setLiveTranscript("");
      setPhase("muted");
      return;
    }
    setLiveTranscript("");
    setPhase("listening");

    const handle = startRecognition({
      onTranscript: (live) => {
        setLiveTranscript(live);
      },
      onFinal: (committed) => {
        recognitionRef.current = null;
        const text = committed.trim();
        if (!text) {
          if (!endedRef.current && phaseRef.current === "listening") {
            setPhase("idle");
          }
          return;
        }
        void handleUserTurn(text);
      },
      onError: (err) => {
        recognitionRef.current = null;
        if (err.error === "not-allowed" || err.error === "service-not-allowed") {
          console.warn("Call mic permission denied");
          requestEnd();
          return;
        }
        if (!endedRef.current && phaseRef.current === "listening") {
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
  }, []);

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
    setYunaSpoken("");
  }, []);

  const startHold = useCallback(() => {
    if (endedRef.current) return;
    const p = phaseRef.current;
    if (p === "listening" || p === "ending" || p === "muted") return;
    if (p === "speaking" || p === "thinking") {
      stopYunaSpeaking();
    }
    beginListening();
  }, [beginListening, stopYunaSpeaking]);

  const endHold = useCallback(() => {
    if (endedRef.current) return;
    const handle = recognitionRef.current;
    if (handle) {
      handle.stop();
    } else if (phaseRef.current === "listening") {
      setPhase("idle");
    }
  }, []);

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
              setYunaSpoken(buffer);
            } else if (eventType === "done") {
              finalText = (data.text as string | undefined) ?? buffer;
              setYunaSpoken(finalText);
            } else if (eventType === "error") {
              throw new Error(data.message ?? "Server error");
            }
          }
        }
        if (endedRef.current) return;
        if (phaseRef.current === "listening") return;
        const replyText = (finalText || buffer).trim();
        if (!replyText) {
          setPhase("idle");
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
        if (phaseRef.current === "speaking") setPhase("idle");
      } catch (err) {
        if (endedRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (phaseRef.current === "listening") return;
        console.error("Call chat error", err);
        const fallback =
          "I'm having trouble connecting right now. Could we try again in a moment?";
        setYunaSpoken(fallback);
        setPhase("speaking");
        await speak(fallback);
        if (endedRef.current) return;
        if (phaseRef.current === "speaking") setPhase("idle");
      } finally {
        if (chatAbortRef.current === ctrl) chatAbortRef.current = null;
      }
    },
    [speak],
  );

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
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
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

        setYunaSpoken(text);
        await speak(text);
        if (endedRef.current) return;
        if (phaseRef.current !== "muted") setPhase("idle");
      },
    }),
    [speak],
  );

  useEffect(() => {
    endedRef.current = false;
    let cancelled = false;
    (async () => {
      // Caller-provided lines (chat-now → voice) skip the API roundtrip so
      // Yuna says the exact same welcome + ask as the text-mode flow.
      const lines =
        initialGreetingLines && initialGreetingLines.length > 0
          ? initialGreetingLines
          : [await composeGreeting(turnsRef.current)];

      if (cancelled || endedRef.current) return;

      const newTurns: ChatMsg[] = lines.map((text) => ({
        id: chatUid(),
        from: "yuna",
        kind: "text",
        text,
      }));
      turnsRef.current = [...turnsRef.current, ...newTurns];
      for (const m of newTurns) onMessageAppendedRef.current?.(m);

      for (const line of lines) {
        if (cancelled || endedRef.current) return;
        setYunaSpoken(line);
        await speak(line);
      }
      if (cancelled || endedRef.current) return;
      setPhase("idle");
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

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const showPulseRings = phase === "speaking";

  return (
    <div className="flex-1 flex flex-col items-center px-8 pb-12 min-h-0">
      <div className="mt-12 relative h-44 w-44 flex items-center justify-center shrink-0">
        {showPulseRings && (
          <>
            <span className="absolute inset-0 rounded-full border border-white/40 yuna-pulse-ring" />
            <span
              className="absolute inset-3 rounded-full border border-white/40 yuna-pulse-ring"
              style={{ animationDelay: "600ms" }}
            />
          </>
        )}
        <div className="relative h-32 w-32 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm overflow-hidden flex items-center justify-center">
          {avatar ? (
            <YunaAvatar variant={avatar} size={128} />
          ) : (
            <span className="h-3 w-3 rounded-full bg-white" />
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <h1 className="text-xl tracking-tight text-white">{PHASE_LABEL[phase]}</h1>
        <p className="mt-1 text-xs tracking-[0.2em] uppercase text-white/70 tabular-nums">
          {mm}:{ss}
        </p>
      </div>

      <div className="mt-6 w-full max-w-[20rem] min-h-[100px] flex flex-col items-center text-center gap-2">
        {yunaSpoken && <p className="text-sm leading-relaxed text-white">{yunaSpoken}</p>}
      </div>

      <div
        className="flex-1 flex items-end justify-center min-h-[64px] w-full"
      >
        <div
          className="w-full"
          style={{ marginLeft: "-2rem", marginRight: "-2rem", width: "calc(100% + 4rem)" }}
        >
          <VoiceWaveform active={phase === "listening"} />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3 shrink-0">
        <HoldToTalkButton
          phase={phase}
          onPressStart={startHold}
          onPressEnd={endHold}
        />
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">
          {phase === "listening" ? "Release to send" : "Hold to talk"}
        </p>
      </div>
    </div>
  );
});

function HoldToTalkButton({
  phase,
  onPressStart,
  onPressEnd,
}: {
  phase: Phase;
  onPressStart: () => void;
  onPressEnd: () => void;
}) {
  const holding = phase === "listening";
  const disabled = phase === "ending" || phase === "muted";

  return (
    <button
      type="button"
      aria-label={holding ? "Release to send" : "Hold to talk"}
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        onPressStart();
      }}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        onPressEnd();
      }}
      onPointerCancel={onPressEnd}
      onContextMenu={(e) => e.preventDefault()}
      className={
        "relative h-20 w-20 rounded-full flex items-center justify-center select-none transition-transform duration-150 " +
        (disabled
          ? "bg-white/15 text-white/40 cursor-not-allowed"
          : holding
            ? "bg-white text-foreground scale-110 shadow-[0_0_0_10px_rgba(255,255,255,0.12)]"
            : "bg-white text-foreground active:scale-95")
      }
    >
      {holding && (
        <>
          <span className="absolute inset-0 rounded-full border border-white/30 yuna-pulse-ring" />
          <span
            className="absolute -inset-2 rounded-full border border-white/20 yuna-pulse-ring"
            style={{ animationDelay: "500ms" }}
          />
        </>
      )}
      <MicGlyph />
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
        const wave =
          (Math.sin(t * 7 + phase) + Math.sin(t * 13 + phase * 1.4) * 0.35) / 1.35;
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
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
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
      "[The user just switched to voice. Greet them warmly and pick the conversation up in one or two short sentences. Do not recap or apologise — speak as if continuing naturally out loud.]",
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
