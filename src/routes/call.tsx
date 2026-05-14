import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaAvatar } from "@/components/YunaAvatar";
import { getVoice, useYunaIdentity } from "@/lib/yuna-session";
import { VOICES } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import {
  isSpeechRecognitionSupported,
  startRecognition,
  type RecognitionHandle,
} from "@/lib/speech";
import { chatUid, loadStoredMessages, saveStoredMessages, type ChatMsg } from "@/lib/chat-store";
import { YunaHeaderTrigger } from "@/components/YunaHeaderTrigger";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/call")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    voice?: string;
    returnTo?: string;
  } => ({
    voice: (s.voice as string | undefined) ?? "Aria",
    returnTo: (s.returnTo as string | undefined) ?? "home",
  }),
  head: () => ({
    meta: [{ title: "Calling Yuna" }, { name: "description", content: "A voice call with Yuna." }],
  }),
  component: CallScreen,
});

// Phases drive both the headline label and which background loop is running.
//   connecting — TTS audio for the opener is still being fetched / about to play
//   listening  — recognition is open, waiting for the user to talk
//   thinking   — Claude is generating
//   speaking   — Yuna's TTS is playing
//   muted      — user paused the mic; nothing else is running
//   ending     — End Call tapped; tearing down for navigation
type Phase = "connecting" | "listening" | "thinking" | "speaking" | "muted" | "ending";

const PHASE_LABEL: Record<Phase, string> = {
  connecting: "Connecting…",
  listening: "Listening",
  thinking: "Thinking…",
  speaking: "Yuna",
  muted: "Muted",
  ending: "Wrapping up…",
};

// Silence after the user's last partial transcript before we treat the turn
// as finished. 1500ms feels natural — long enough for a beat but not so
// long the conversation drags.
const TURN_END_SILENCE_MS = 1500;

function CallScreen() {
  const { returnTo } = Route.useSearch();
  const navigate = useNavigate();
  const { avatar } = useYunaIdentity();
  const [phase, setPhase] = useState<Phase>("connecting");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  // Live partial of what the user is currently saying. Renders subtly under
  // Yuna's last reply so people see the system is hearing them.
  const [liveTranscript, setLiveTranscript] = useState("");
  // Last reply Yuna spoke this call — shown as the headline copy.
  const [yunaSpoken, setYunaSpoken] = useState("");

  const startedAtRef = useRef<number>(Date.now());
  const recognitionRef = useRef<RecognitionHandle | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Conversation history maintained on the call screen itself. Seeded from
  // the chat thread so Yuna has context, and flushed back into the chat
  // store on End Call so the chat continues seamlessly.
  const turnsRef = useRef<ChatMsg[]>(loadStoredMessages());
  // Refs for state read inside async callbacks (closure freshness).
  const speakerOnRef = useRef(speakerOn);
  const phaseRef = useRef<Phase>(phase);
  const endedRef = useRef(false);

  useEffect(() => {
    speakerOnRef.current = speakerOn;
  }, [speakerOn]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Conversation timer.
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── TTS playback ──────────────────────────────────────────────────────────
  // Resolves when the audio finishes (or immediately if speaker is off).
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;
    if (!speakerOnRef.current) return;
    const voiceId = getVoice();
    if (!voiceId) return;
    const cfg = VOICES[voiceId];

    // Tear down any prior playback — calling play() on an `ended` element
    // is unreliable in Chrome.
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
        // Flip to "speaking" phase the moment audio actually starts so the
        // pulse rings only animate while there's voice. This also gets us
        // out of "Connecting…" the instant playback begins.
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

  // ── Recognition loop ──────────────────────────────────────────────────────
  // Forward declaration for mutual recursion (listen → handle turn → listen).
  const beginListening = useCallback(() => {
    if (endedRef.current) return;
    if (!isSpeechRecognitionSupported()) {
      // Without recognition we can't take a turn — drop into "muted" so
      // the headline isn't stuck on whatever the previous phase was
      // (otherwise the screen reads "Connecting…" forever on Firefox etc.).
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
            // User has paused — end the recognition session, which fires
            // onFinal with the committed transcript.
            recognitionRef.current?.stop();
          }, TURN_END_SILENCE_MS);
        }
      },
      onFinal: (committed) => {
        clearSilenceTimer();
        recognitionRef.current = null;
        const text = committed.trim();
        if (!text) {
          // The user didn't say anything substantive — re-arm the mic.
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
          // Permission denied — back the user out to the chat.
          console.warn("Call mic permission denied");
          endCall();
          return;
        }
        // Most errors (no-speech, aborted) are routine. Retry shortly so
        // the call doesn't go silent.
        if (!endedRef.current && phaseRef.current !== "muted") {
          setTimeout(() => beginListening(), 400);
        }
      },
    });

    if (!handle) {
      // Couldn't start (no SR support, or browser refused). Bail out of
      // the listening state.
      setPhase("muted");
      return;
    }
    recognitionRef.current = handle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Turn handler ──────────────────────────────────────────────────────────
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

      // Build the conversation Claude sees: just the text turns from
      // history + this latest user turn.
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
          // Empty completion — re-arm the mic.
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
        // After Yuna finishes speaking, hand the mic back to the user.
        if (phaseRef.current !== "muted") beginListening();
      } catch (err) {
        if (endedRef.current) return;
        console.error("Call chat error", err);
        const fallback = "I'm having trouble connecting right now. Could we try again in a moment?";
        setYunaSpoken(fallback);
        setPhase("speaking");
        await speak(fallback);
        if (!endedRef.current && phaseRef.current !== "muted") beginListening();
      }
    },
    [beginListening, speak],
  );

  // ── Greeting ──────────────────────────────────────────────────────────────
  // Greet, then start listening. The opener varies by entry path:
  //   - Fresh (no prior chat turns):     warm static opener.
  //   - From chat with prior turns:      stream a contextual continuation
  //                                      from Claude so the line references
  //                                      what was already being discussed.
  useEffect(() => {
    // React StrictMode (dev) double-invokes effects: setup → cleanup → setup.
    // The teardown effect below sets `endedRef.current = true` on cleanup,
    // and nothing resets it. Without this line every guard fires on the
    // re-mount and the screen stays stuck on "Connecting…" with no audio.
    endedRef.current = false;
    let cancelled = false;
    (async () => {
      const greeting = await composeGreeting(turnsRef.current, returnTo);
      if (cancelled || endedRef.current) return;

      setYunaSpoken(greeting);
      // Persist the greeting so the chat thread shows it as a Yuna bubble
      // even if End Call happens before the user speaks.
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

  // ── Mute / unmute ─────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (phase === "muted") {
      setPhase("listening");
      beginListening();
    } else {
      // Stop whatever's running. We don't kill the TTS — feels jarring
      // mid-sentence. We just stop arming the mic.
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

  // ── Speaker toggle ────────────────────────────────────────────────────────
  const toggleSpeaker = () => {
    setSpeakerOn((s) => {
      const next = !s;
      if (!next) {
        // Cut current playback immediately so the toggle feels instant.
        ttsAudioRef.current?.pause();
      }
      return next;
    });
  };

  // ── End call ──────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
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
    // History is already in sessionStorage via saveStoredMessages on every turn.
    if (returnTo === "chat") {
      // Mid-session call inside an open chat thread — drop the user back
      // into the chat with a summary card. The full session ends (and
      // wrap-up runs) when the user closes the chat with the X.
      navigate({
        to: "/chat",
        search: {
          q: "",
          callEnded: String(Date.now()),
          callDuration: String(seconds),
        },
      });
    } else {
      // Standalone call — go straight to wrap-up. The persisted call turns
      // become the transcript the keepsake is distilled from.
      navigate({ to: "/wrap-up" });
    }
  }, [navigate, returnTo, seconds]);

  // Tidy up if the component unmounts via back-button etc.
  useEffect(() => {
    // Mirror the reset in the greeting effect so StrictMode's double-invoke
    // can't leave us in the "ended" state on a real mount.
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

  // Concentric pulse rings exist only while Yuna is *speaking* — the user's
  // mic input is visualised separately (waveform behind the controls).
  // Other phases either ride a different visual (waveform for listening) or
  // stay still (connecting/thinking/muted/ending).
  const showPulseRings = phase === "speaking";

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col yuna-fade-in min-h-0">
        <header className="grid grid-cols-3 items-center px-5 pt-14 pb-2 shrink-0">
          <div />
          <div className="justify-self-center">
            <YunaHeaderTrigger />
          </div>
          <div />
        </header>

        <div className="flex-1 flex flex-col items-center px-8 pb-12 min-h-0">
          {/* Avatar */}
          <div className="mt-16 relative h-44 w-44 flex items-center justify-center shrink-0">
            {showPulseRings && (
              <>
                <span className="absolute inset-0 rounded-full hairline yuna-pulse-ring" />
                <span
                  className="absolute inset-3 rounded-full hairline yuna-pulse-ring"
                  style={{ animationDelay: "600ms" }}
                />
              </>
            )}
            <div className="relative h-32 w-32 rounded-full hairline overflow-hidden flex items-center justify-center bg-background">
              {avatar ? (
                <YunaAvatar variant={avatar} size={128} />
              ) : (
                <span className="h-3 w-3 rounded-full bg-foreground" />
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-xl tracking-tight">{PHASE_LABEL[phase]}</h1>
            <p className="mt-1 font-sans-ui text-xs tracking-[0.2em] uppercase text-muted-foreground tabular-nums">
              {mm}:{ss}
            </p>
          </div>

          {/* Yuna's last spoken line is shown as the conversation surface.
              We deliberately don't render the live transcript while the
              user is talking — the waveform below is the "we hear you" signal. */}
          <div className="mt-6 w-full max-w-[20rem] min-h-[100px] flex flex-col items-center text-center gap-2">
            {yunaSpoken && <p className="text-sm leading-relaxed text-foreground">{yunaSpoken}</p>}
          </div>

          {/* Spacer that vertically centres the waveform between Yuna's
              line and the controls. Only visible while we're listening. */}
          <div className="flex-1 w-full flex items-center justify-center min-h-[64px]">
            <VoiceWaveform active={phase === "listening"} />
          </div>

          {/* Controls */}
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
            <CallButton label="End Call" destructive onClick={endCall} icon={<EndIcon />} />
          </div>
        </div>
      </div>
      <span className="hidden">{startedAtRef.current}</span>
    </PhoneFrame>
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
      surface="light"
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

// ── Voice waveform ──────────────────────────────────────────────────────────
// A single thin squiggly line that sits centred above the call controls.
// Designed to echo the hairline pulse rings around Yuna's avatar — same 1px
// border-coloured stroke, same restrained energy.
//
// The line sits nearly flat in silence and stretches dramatically as the
// mic picks up sound, so the user can read "I'm being heard" at a glance
// without any text on screen.
//
// We DOM-mutate the path's `d` attribute per frame instead of using React
// state so the visualizer never re-renders the rest of the call screen.
const WAVE_VIEW_W = 400;
const WAVE_VIEW_H = 120;
const WAVE_MID = WAVE_VIEW_H / 2;
const WAVE_SEGMENTS = 96;
// Multiplier on the analyser's averaged level — raw mic input averages
// around 0.05–0.2 for a normal speaking voice, so we boost it hard so a
// quiet voice still produces an obvious wave and a loud one nearly fills
// the available height.
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
      // Boost + clamp so quiet speech still produces a noticeable wave and
      // shouting nearly fills the available height. Headroom of 2px keeps
      // the line from kissing the SVG edges.
      const boosted = Math.min(1, smoothed * WAVE_LEVEL_GAIN);
      const amp = 0.5 + boosted * (WAVE_MID - 2);
      let d = `M 0 ${WAVE_MID.toFixed(2)}`;
      for (let i = 1; i <= WAVE_SEGMENTS; i++) {
        const x = (i / WAVE_SEGMENTS) * WAVE_VIEW_W;
        const t = i / WAVE_SEGMENTS;
        // Two overlapping sine harmonics for an organic squiggle. We
        // normalise by the worst-case sum (1 + 0.35) so |wave| ≤ 1 and the
        // line can never overshoot `amp` — otherwise peaks get clipped at
        // the top/bottom of the SVG.
        const wave = (Math.sin(t * 7 + phase) + Math.sin(t * 13 + phase * 1.4) * 0.35) / 1.35;
        // Taper amplitude near both ends so the line eases into the centre
        // line at the screen edges instead of cutting off mid-wave.
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
          // EMA smoothing — light enough that the wave reacts quickly to
          // voice volume changes but still doesn't twitch frame-to-frame.
          smoothed = smoothed * 0.65 + lvl * 0.35;
          // Phase advances faster when there's more energy, so the line
          // reads as "more active" not just "taller".
          phase += 0.04 + smoothed * 0.12;
          draw();
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        // Mic access can fail (permissions, second tab) — degrade silently.
        console.warn("Voice waveform mic unavailable", err);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      // Reset to flat baseline so the line doesn't freeze mid-wave.
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
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

// ── Greeting composer ───────────────────────────────────────────────────────
// First line Yuna says when the call opens. We tailor it to how the user
// arrived so it doesn't feel scripted:
//   - No prior chat history → warm, generic opener.
//   - Prior chat history    → stream a short continuation from Claude with
//                             a gentle "you just switched to voice" nudge so
//                             the line picks up where things left off.
async function composeGreeting(history: ChatMsg[], returnTo: string | undefined): Promise<string> {
  const textTurns = history.filter(
    (m): m is Extract<ChatMsg, { kind: "text" }> => m.kind === "text",
  );
  const continuing = textTurns.length > 0;

  if (!continuing) {
    return returnTo === "chat"
      ? "Hey, I'm here. What would you like to talk about?"
      : "Hey, I'm here. What's coming up for you?";
  }

  // Send the existing turns to Claude with one synthetic user nudge that
  // tells it to write the opening line. The nudge is local-only — we don't
  // persist it to the chat thread.
  const conversation = textTurns.map((m) => ({
    role: m.from === "you" ? "user" : "assistant",
    content: m.text,
  }));
  conversation.push({
    role: "user",
    content:
      "[The user just opened a voice call with you. Greet them warmly and pick up the conversation in one or two short sentences. Do not recap or apologise — speak as if continuing naturally out loud.]",
  });

  // Belt and braces: if Claude stalls, don't let the user sit on "Connecting…"
  // forever. 6s is more than enough for a normal short reply.
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

  // Fallback if Claude is unavailable or timed out.
  return "I'm right here. Keep going whenever you're ready.";
}
