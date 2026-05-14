import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { YunaAvatar } from "@/components/YunaAvatar";
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
  loadStoredMessages,
  saveStoredMessages,
  type ChatMsg,
} from "@/lib/chat-store";
import { Button } from "@/components/Button";

type Phase =
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "muted"
  | "ending";

const PHASE_LABEL: Record<Phase, string> = {
  connecting: "Connecting…",
  listening: "Listening",
  thinking: "Thinking…",
  speaking: "Yuna",
  muted: "Muted",
  ending: "Wrapping up…",
};

const TURN_END_SILENCE_MS = 1500;

export function VoiceSession({
  onEndCall,
}: {
  onEndCall: (durationSec: number) => void;
}) {
  const { avatar } = useYunaIdentity();
  const [phase, setPhase] = useState<Phase>("connecting");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [yunaSpoken, setYunaSpoken] = useState("");

  const recognitionRef = useRef<RecognitionHandle | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnsRef = useRef<ChatMsg[]>(loadStoredMessages());
  const speakerOnRef = useRef(speakerOn);
  const phaseRef = useRef<Phase>(phase);
  const endedRef = useRef(false);
  const secondsRef = useRef(0);

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
          if (!endedRef.current) setPhase("speaking");
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

    const clearSilenceTimer = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    const handle = startRecognition({
      onTranscript: (live) => {
        setLiveTranscript(live);
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
          if (!endedRef.current && phaseRef.current !== "muted") {
            beginListening();
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
        if (!endedRef.current && phaseRef.current !== "muted") {
          setTimeout(() => beginListening(), 400);
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
      saveStoredMessages(turnsRef.current);

      const conversation = turnsRef.current
        .filter((m): m is Extract<ChatMsg, { kind: "text" }> => m.kind === "text")
        .map((m) => ({
          role: m.from === "you" ? "user" : "assistant",
          content: m.text,
        }));

      let buffer = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: conversation }),
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
        const replyText = (finalText || buffer).trim();
        if (!replyText) {
          beginListening();
          return;
        }

        const yunaMsg: ChatMsg = {
          id: chatUid(),
          from: "yuna",
          kind: "text",
          text: replyText,
        };
        turnsRef.current = [...turnsRef.current, yunaMsg];
        saveStoredMessages(turnsRef.current);

        setPhase("speaking");
        await speak(replyText);
        if (endedRef.current) return;
        if (phaseRef.current !== "muted") beginListening();
      } catch (err) {
        if (endedRef.current) return;
        console.error("Call chat error", err);
        const fallback =
          "I'm having trouble connecting right now. Could we try again in a moment?";
        setYunaSpoken(fallback);
        setPhase("speaking");
        await speak(fallback);
        if (!endedRef.current && phaseRef.current !== "muted") beginListening();
      }
    },
    [beginListening, speak],
  );

  useEffect(() => {
    endedRef.current = false;
    let cancelled = false;
    (async () => {
      const greeting = await composeGreeting(turnsRef.current);
      if (cancelled || endedRef.current) return;

      setYunaSpoken(greeting);
      const yunaMsg: ChatMsg = {
        id: chatUid(),
        from: "yuna",
        kind: "text",
        text: greeting,
      };
      turnsRef.current = [...turnsRef.current, yunaMsg];
      saveStoredMessages(turnsRef.current);

      await speak(greeting);
      if (cancelled || endedRef.current) return;
      beginListening();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    if (phase === "muted") {
      setPhase("listening");
      beginListening();
    } else {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setLiveTranscript("");
      setPhase("muted");
    }
  };

  const toggleSpeaker = () => {
    setSpeakerOn((s) => {
      const next = !s;
      if (!next) {
        ttsAudioRef.current?.pause();
      }
      return next;
    });
  };

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
        <p className="mt-1 font-sans-ui text-xs tracking-[0.2em] uppercase text-white/70 tabular-nums">
          {mm}:{ss}
        </p>
      </div>

      <div className="mt-6 w-full max-w-[20rem] min-h-[100px] flex flex-col items-center text-center gap-2">
        {yunaSpoken && <p className="text-sm leading-relaxed text-white">{yunaSpoken}</p>}
        {liveTranscript && (
          <p className="text-xs leading-relaxed text-white/60 italic">{liveTranscript}</p>
        )}
      </div>

      <div className="flex-1 w-full flex items-center justify-center min-h-[64px]">
        <VoiceWaveform active={phase === "listening"} />
      </div>

      <div className="w-full grid grid-cols-3 gap-4 px-2 shrink-0">
        <CallButton
          label={phase === "muted" ? "Unmute" : "Mute"}
          active={phase === "muted"}
          onClick={toggleMute}
          icon={phase === "muted" ? <MicOffIcon /> : <MicIcon />}
        />
        <CallButton
          label={speakerOn ? "Speaker" : "Silent"}
          active={!speakerOn}
          onClick={toggleSpeaker}
          icon={<SpeakerIcon />}
        />
        <CallButton label="End Call" destructive onClick={requestEnd} icon={<EndIcon />} />
      </div>
    </div>
  );
}

function CallButton({
  label,
  icon,
  onClick,
  active,
  destructive,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  destructive?: boolean;
}) {
  return (
    <Button
      surface="dark"
      variant="secondary"
      size="icon-lg"
      pressed={destructive ? true : active}
      label={label}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </Button>
  );
}

function MicIcon() {
  return <Mic size={18} strokeWidth={1.5} />;
}
function MicOffIcon() {
  return <MicOff size={18} strokeWidth={1.5} />;
}
function SpeakerIcon() {
  return <Volume2 size={18} strokeWidth={1.5} />;
}
function EndIcon() {
  return <PhoneOff size={18} strokeWidth={1.5} />;
}

const WAVE_VIEW_W = 400;
const WAVE_VIEW_H = 120;
const WAVE_MID = WAVE_VIEW_H / 2;
const WAVE_SEGMENTS = 96;
const WAVE_LEVEL_GAIN = 6;

function VoiceWaveform({ active }: { active: boolean }) {
  const pathRef = useRef<SVGPathElement>(null);

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
        const taper = Math.sin(t * Math.PI);
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
          stroke="rgba(255,255,255,0.7)"
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
