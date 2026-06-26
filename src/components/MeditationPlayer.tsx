import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/Button";
import { Slider } from "@/components/Slider";
import { useAppMode } from "@/lib/theme-prefs";
import { getAmbience, AMBIENCE_FILES } from "@/lib/yuna-session";

// Ambient bed when the user's ambience choice has no file yet. forest-daytime
// ships in /public and loops cleanly under a spoken meditation.
const FALLBACK_AMBIENCE = "/forest-daytime.mp3";

// Mix → per-source gain. The bipolar slider runs -1 (all music) → +1 (all
// voice); we floor the voice so sliding fully to "Music" never drops the
// guidance entirely, and keep music as a quieter bed even at its loudest.
function voiceGainFor(mix: number) {
  return Math.max(0.2, (mix + 1) / 2);
}
function musicGainFor(mix: number) {
  return ((1 - mix) / 2) * 0.7;
}

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Split a script into spoken sentences, keeping ellipses with their clause so
// the on-screen line breaks land on natural pauses.
function toSentences(script: string): string[] {
  return script
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type MeditationPlayerProps = {
  minutes: number;
  /** The spoken meditation text, shown a sentence at a time. */
  script: string;
  /** Pre-rendered TTS audio for the script; null if generation failed. */
  voiceUrl: string | null;
  /** Advance to the completion screen — fired on finish or close. */
  onFinish: () => void;
};

export function MeditationPlayer({ minutes, script, voiceUrl, onFinish }: MeditationPlayerProps) {
  const surface = useAppMode() === "light" ? "light" : "dark";
  const sentences = useRef<string[]>(toSentences(script)).current;

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mix, setMix] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(minutes * 60);
  const [lineIdx, setLineIdx] = useState(0);
  const [lineVisible, setLineVisible] = useState(true);

  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);
  const mixRef = useRef(mix);
  const pausedRef = useRef(paused);
  const totalRef = useRef(total);
  const lineIdxRef = useRef(0);
  const transitioningRef = useRef(false);
  useEffect(() => {
    mixRef.current = mix;
  }, [mix]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    totalRef.current = total;
  }, [total]);

  const teardown = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    voiceRef.current?.pause();
    musicRef.current?.pause();
    voiceRef.current = null;
    musicRef.current = null;
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    teardown();
    onFinish();
  }, [onFinish, teardown]);

  useEffect(() => teardown, [teardown]);

  // Live volumes follow the slider while playing.
  useEffect(() => {
    if (voiceRef.current) voiceRef.current.volume = voiceGainFor(mix);
    if (musicRef.current) musicRef.current.volume = musicGainFor(mix);
  }, [mix]);

  // Crossfade the on-screen line whenever the time-driven target index moves.
  const goToLine = useCallback((next: number) => {
    if (transitioningRef.current) return;
    if (next === lineIdxRef.current) return;
    transitioningRef.current = true;
    setLineVisible(false);
    setTimeout(() => {
      lineIdxRef.current = next;
      setLineIdx(next);
      setLineVisible(true);
      transitioningRef.current = false;
    }, 450);
  }, []);

  const begin = useCallback(() => {
    if (started) return;
    setStarted(true);

    const musicUrl = AMBIENCE_FILES[getAmbience()] ?? FALLBACK_AMBIENCE;
    const music = new Audio(musicUrl);
    music.loop = true;
    music.volume = musicGainFor(mixRef.current);
    musicRef.current = music;
    music.play().catch(() => {});

    if (voiceUrl) {
      const voice = new Audio(voiceUrl);
      voice.volume = voiceGainFor(mixRef.current);
      voiceRef.current = voice;
      voice.onended = () => finish();
      voice.onloadedmetadata = () => {
        if (Number.isFinite(voice.duration) && voice.duration > 0) {
          setTotal(Math.round(voice.duration));
        }
      };
      voice.play().catch(() => {});
    }

    tickRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setElapsed((e) => {
        const next = e + 0.25;
        // Distribute the lines evenly across the run so they pace the audio.
        if (sentences.length > 0) {
          const frac = Math.min(0.999, next / Math.max(1, totalRef.current));
          goToLine(Math.min(sentences.length - 1, Math.floor(frac * sentences.length)));
        }
        if (next >= totalRef.current) {
          finish();
          return totalRef.current;
        }
        return next;
      });
    }, 250);
  }, [started, voiceUrl, finish, goToLine, sentences.length]);

  const togglePause = useCallback(() => {
    if (!started) return;
    setPaused((p) => {
      const next = !p;
      if (next) {
        voiceRef.current?.pause();
        musicRef.current?.pause();
      } else {
        voiceRef.current?.play().catch(() => {});
        musicRef.current?.play().catch(() => {});
      }
      return next;
    });
  }, [started]);

  return (
    <div className="relative flex-1 flex flex-col text-white min-h-0">
      <header className="px-5 pt-14 pb-2 shrink-0">
        <div className="relative flex items-center justify-center">
          <span className="text-sm tabular-nums tracking-[0.04em] text-white/85">
            {fmt(elapsed)} / {fmt(total)}
          </span>
          <Button
            surface={surface}
            variant="secondary"
            size="icon"
            aria-label="Close meditation"
            onClick={finish}
            className="absolute right-0 rounded-full"
          >
            <X strokeWidth={1.75} />
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-uppercase tracking-[0.04em] uppercase text-white/85 shrink-0">
            Music
          </span>
          <div className="flex-1 min-w-0">
            <Slider surface={surface} variant="bipolar" tone="neutral" value={mix} onChange={setMix} />
          </div>
          <span className="text-uppercase tracking-[0.04em] uppercase text-white/85 shrink-0">
            Voice
          </span>
        </div>
      </header>

      {!started ? (
        <button
          type="button"
          onClick={begin}
          className="flex-1 w-full flex flex-col items-center justify-center select-none hover:opacity-90 active:opacity-80 transition-opacity"
          aria-label="Tap to begin"
        >
          <span className="font-display text-2xl tracking-tight text-white/90">Tap to begin</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={togglePause}
          className="flex-1 w-full flex flex-col items-center justify-center px-8 min-h-0 select-none"
          aria-label={paused ? "Tap anywhere to resume" : "Tap anywhere to pause"}
        >
          <p
            className={
              "font-display text-3xl leading-snug tracking-tight text-white text-center max-w-[20rem] transition-opacity duration-500 " +
              (lineVisible ? "opacity-100" : "opacity-0")
            }
          >
            {sentences[lineIdx] ?? ""}
          </p>
        </button>
      )}

      {started && (
        <p className="shrink-0 pb-10 text-center text-sm text-white/60">
          {paused ? "Tap anywhere to resume" : "Tap anywhere to pause"}
        </p>
      )}
    </div>
  );
}
