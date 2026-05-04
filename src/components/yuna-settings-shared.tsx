import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { VOICES, VOICE_IDS, type VoiceId } from "@/lib/voices";
import { avatarSrc, type AvatarVariant } from "@/components/YunaAvatar";

// ── Shared data ──────────────────────────────────────────────────────────────

export type Choice = { id: string; label: string; description: string };

export type IntroVoice = {
  id: VoiceId;
  photo: string;
  desc: string;
};

const VOICE_DESCRIPTIONS: Record<VoiceId, string> = {
  iris: "A warm, confident voice that grounds the room as it speaks.",
  marcus: "Steady and resonant — a calm authority that helps you settle in.",
  mei: "Soft and thoughtful, gentle enough to hold what's underneath.",
  arun: "Articulate and unhurried, like a trusted friend taking their time.",
  rosa: "Bright and warm, lifting the conversation without rushing it.",
  theo: "Easy-going and approachable, like someone who really gets you.",
  sage: "Clear and supportive, attentive to every word you offer.",
  felix: "Casual and conversational, with an open, friendly warmth.",
  aura: "A soft, mysterious presence that holds space for stillness.",
  ember: "Warm and steadying, like firelight on a quiet evening.",
  tide: "Cool and rhythmic, easing in and out like a slow breath.",
  cloud: "Light and airy — soft enough to land softly into the next moment.",
};

export const INTRO_VOICES: IntroVoice[] = VOICE_IDS.map((id) => ({
  id,
  photo: avatarSrc(id as AvatarVariant),
  desc: VOICE_DESCRIPTIONS[id],
}));

export const LANGUAGE_OPTIONS: Choice[] = [
  { id: "English", label: "English", description: "EN" },
  { id: "Español", label: "Español", description: "ES" },
  { id: "Français", label: "Français", description: "FR" },
  { id: "Deutsch", label: "Deutsch", description: "DE" },
];

export const PACE_STEPS = ["0.5x", "0.75x", "1.0x", "1.25x", "1.5x"] as const;
export const DEFAULT_PACE_IDX = 2;

// ── Building blocks ──────────────────────────────────────────────────────────

export function SubScreen({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pt-2 pb-3 yuna-fade-in">
        <button
          onClick={onBack}
          aria-label="Back"
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ChevronLeftIcon />
        </button>
        <h2 className="font-serif text-lg tracking-tight text-center">{title}</h2>
        <span className="h-10 w-10" aria-hidden="true" />
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-10 yuna-fade-in">{children}</div>
    </>
  );
}

export function ChoiceList({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Choice[];
}) {
  return (
    <div className="rounded-2xl hairline overflow-hidden bg-background">
      {options.map((o, i) => {
        const selected = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={
              "w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors " +
              (selected ? "bg-accent/70 text-foreground" : "hover:bg-accent/40 text-foreground") +
              (i > 0 ? " border-t border-border" : "")
            }
          >
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
              <span className="text-sm font-medium">{o.label}</span>
              <span className="text-xs text-muted-foreground">{o.description}</span>
            </span>
            <span
              aria-hidden="true"
              className={"shrink-0 transition-opacity " + (selected ? "opacity-100" : "opacity-0")}
            >
              <CheckIcon />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function NavList({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl hairline overflow-hidden bg-background">{children}</div>;
}

export function NavRow({
  icon,
  label,
  value,
  imageSrc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  imageSrc?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-accent/40 transition-colors border-t border-border first:border-t-0"
    >
      <span className="h-9 w-9 rounded-full flex items-center justify-center text-foreground shrink-0">
        {icon}
      </span>
      <span className="flex-1 text-sm">{label}</span>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="h-7 w-7 rounded-full object-cover hairline shrink-0"
          draggable={false}
        />
      ) : value ? (
        <span className="font-sans-ui text-xs text-muted-foreground">{value}</span>
      ) : null}
      <ChevronRightIcon />
    </button>
  );
}

// ── Pace slider ──────────────────────────────────────────────────────────────

export function PaceSlider({
  steps,
  value,
  onChange,
}: {
  steps: readonly string[];
  value: number;
  onChange: (idx: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const stepFromPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (steps.length - 1));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    onChange(stepFromPointer(e.clientX));
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    onChange(stepFromPointer(e.clientX));
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const fillPct = (value / (steps.length - 1)) * 100;

  return (
    <div className="rounded-2xl hairline bg-background p-5">
      <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-4">
        Voice pace
      </p>

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-12 rounded-full bg-muted touch-none cursor-pointer select-none"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={steps.length - 1}
        aria-valuenow={value}
        aria-valuetext={steps[value]}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Math.min(steps.length - 1, value + 1));
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.max(0, value - 1));
          }
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-[width] duration-150 ease-out"
          style={{ width: `calc(${fillPct}% + 6px)` }}
        />

        {steps.map((_, i) => {
          const pct = (i / (steps.length - 1)) * 100;
          const beforeHandle = i <= value;
          return (
            <span
              key={i}
              aria-hidden="true"
              className={
                "absolute top-1/2 -translate-y-1/2 w-px h-3 " +
                (beforeHandle ? "bg-background/60" : "bg-foreground/25")
              }
              style={{ left: `${pct}%` }}
            />
          );
        })}

        <span
          aria-hidden="true"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-11 w-11 rounded-full bg-foreground border-[3px] border-background shadow-md transition-[left] duration-150 ease-out"
          style={{ left: `${fillPct}%` }}
        />
      </div>

      <div className="grid grid-cols-5 mt-3 px-0">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => onChange(i)}
            className={
              "font-sans-ui text-xs text-center transition-colors " +
              (i === value ? "text-foreground font-medium" : "text-muted-foreground")
            }
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Intro-style voice picker ─────────────────────────────────────────────────

export const VOICE_CARD_W = 297;
export const VOICE_CARD_GAP = 14;
const VOICE_PEEK = `calc((100% - ${VOICE_CARD_W}px) / 2)`;

export function IntroVoicePicker({
  selectedIdx,
  onSelect,
  playingIdx,
  onTogglePlay,
  surface = "dark",
}: {
  selectedIdx: number;
  onSelect: (idx: number) => void;
  playingIdx: number | null;
  onTogglePlay: (idx: number) => void;
  /** "dark" matches photo-bg (intro), "light" matches the personalize drawer. */
  surface?: "dark" | "light";
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: 0,
    pointerId: 0,
  });
  const suppressNextClickRef = useRef(false);

  const cardStep = VOICE_CARD_W + VOICE_CARD_GAP;
  const DRAG_THRESHOLD = 6;

  const snapTo = (idx: number, smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(INTRO_VOICES.length - 1, idx));
    el.scrollTo({
      left: clamped * cardStep,
      behavior: smooth ? "smooth" : "auto",
    });
    onSelect(clamped);
  };

  // On mount only: jump to the pre-selected voice (e.g. when the drawer opens
  // with iris already chosen). Re-running on every selectedIdx change would
  // hijack the smooth scroll initiated by snapTo and make tap-to-select feel
  // broken, so this is intentionally mount-once.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = selectedIdx * cardStep;
    if (Math.abs(el.scrollLeft - target) > 2) {
      el.scrollTo({ left: target, behavior: "auto" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardClick = (idx: number) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    snapTo(idx);
  };

  // Mouse drag-to-scroll. We deliberately avoid setPointerCapture: capturing
  // the pointer on the carousel container also retargets the synthesized
  // `click` away from the card the user is actually clicking, breaking
  // tap-to-select. Instead we attach pointermove/up to `window` so the drag
  // continues even if the cursor leaves the carousel.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    if ((e.target as HTMLElement | null)?.closest("button")) return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: 0,
      pointerId: e.pointerId,
    };

    const handleMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d.active || ev.pointerId !== d.pointerId) return;
      const delta = ev.clientX - d.startX;
      d.moved = Math.max(d.moved, Math.abs(delta));
      el.scrollLeft = d.startScroll - delta;
    };

    const handleUp = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d.active || ev.pointerId !== d.pointerId) return;
      d.active = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      if (d.moved > DRAG_THRESHOLD) {
        suppressNextClickRef.current = true;
        // Auto-release the suppress flag in case no `click` ever fires (e.g.
        // pointerup landed off any card). Without this the next legitimate
        // tap could be silently eaten.
        setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 200);
        const idx = Math.round(el.scrollLeft / cardStep);
        snapTo(idx);
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  return (
    <div
      ref={scrollRef}
      className="voice-carousel-scroll flex overflow-x-auto snap-x snap-mandatory select-none cursor-grab active:cursor-grabbing"
      style={{
        gap: VOICE_CARD_GAP,
        paddingLeft: VOICE_PEEK,
        paddingRight: VOICE_PEEK,
        paddingTop: 6,
        paddingBottom: 6,
        scrollPaddingLeft: VOICE_PEEK,
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        touchAction: "pan-x",
      }}
      onPointerDown={onPointerDown}
    >
      {INTRO_VOICES.map((voice, idx) => (
        <VoiceIntroCard
          key={voice.id}
          voice={voice}
          active={idx === selectedIdx}
          playing={playingIdx === idx}
          onSelect={() => handleCardClick(idx)}
          onTogglePlay={() => onTogglePlay(idx)}
          surface={surface}
        />
      ))}
      <style>{`.voice-carousel-scroll::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

function VoiceIntroCard({
  voice,
  active,
  playing,
  onSelect,
  onTogglePlay,
  surface,
}: {
  voice: IntroVoice;
  active: boolean;
  playing: boolean;
  onSelect: () => void;
  onTogglePlay: () => void;
  surface: "dark" | "light";
}) {
  const ringActive = surface === "dark" ? "ring-white" : "ring-foreground";
  const ringIdle = surface === "dark" ? "ring-white/15" : "ring-border";
  const checkBg = surface === "dark" ? "rgba(255,255,255,0.95)" : "#fff";
  const checkFg = surface === "dark" ? "#0e2a18" : "#000";

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={
        "relative shrink-0 rounded-2xl overflow-hidden snap-start transition-all duration-200 cursor-pointer " +
        (active
          ? `ring-2 ${ringActive} shadow-lg scale-100`
          : `ring-1 ${ringIdle} opacity-80 scale-[0.97]`)
      }
      style={{
        width: VOICE_CARD_W,
        aspectRatio: "332 / 428",
        background: "#0e2a18",
      }}
    >
      <img
        src={voice.photo}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          objectFit: "cover",
          objectPosition: "50% 30%",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {active && (
        <div
          className="absolute h-6 w-6 rounded-full flex items-center justify-center"
          style={{
            top: 10,
            right: 10,
            background: checkBg,
            color: checkFg,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12.5l4.5 4.5L19 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-2.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          type="button"
          className="self-start flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm active:bg-white/25"
          aria-label={playing ? "Pause voice preview" : "Play voice preview"}
        >
          {playing ? <PausePill /> : <PlayPill />}
          <span className="font-sans-ui text-[10px] tracking-[0.1em] uppercase text-white">
            {playing ? "Pause" : "Play"}
          </span>
        </button>
        <p className="text-[14px] leading-snug text-white/90">{voice.desc}</p>
      </div>
    </div>
  );
}

function PlayPill() {
  return (
    <svg width="8" height="9" viewBox="0 0 8 9" fill="none" aria-hidden="true">
      <path d="M1 1L7 4.5L1 8V1Z" fill="white" />
    </svg>
  );
}

function PausePill() {
  return (
    <svg width="8" height="9" viewBox="0 0 8 9" fill="none" aria-hidden="true">
      <rect x="0.5" y="1" width="2.4" height="7" rx="0.8" fill="white" />
      <rect x="5.1" y="1" width="2.4" height="7" rx="0.8" fill="white" />
    </svg>
  );
}

// ── Voice preview (TTS) hook ─────────────────────────────────────────────────

/**
 * Plays the ElevenLabs preview for a given voice id, with a single-flight guard
 * so rapid swipes can't pile up overlapping audio. Caches blob URLs per id so
 * subsequent plays are instant.
 */
export function useVoicePreview() {
  const [playingId, setPlayingId] = useState<VoiceId | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<VoiceId, string>>(new Map());
  const playGenRef = useRef(0);

  const stop = useCallback(() => {
    playGenRef.current++;
    const el = audioRef.current;
    if (el) {
      el.onended = null;
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setPlayingId(null);
  }, []);

  useEffect(() => {
    return () => {
      stop();
      audioRef.current = null;
    };
  }, [stop]);

  const toggle = useCallback(async (id: VoiceId) => {
    if (playingId === id) {
      stop();
      return;
    }

    // Tear down the prior element and start fresh — reusing leaves an `ended`
    // state where Chrome occasionally swallows the next play().
    const prior = audioRef.current;
    if (prior) {
      prior.onended = null;
      prior.pause();
      prior.removeAttribute("src");
      prior.load();
    }

    setPlayingId(id);
    const gen = ++playGenRef.current;
    const el = new Audio();
    audioRef.current = el;
    el.volume = 1;

    const cfg = VOICES[id];
    if (!cfg) {
      setPlayingId(null);
      return;
    }

    try {
      let blobUrl = cacheRef.current.get(id);
      if (!blobUrl) {
        blobUrl = await fetchTtsBlobUrl(cfg.elevenlabsId, cfg.sampleText);
        cacheRef.current.set(id, blobUrl);
      }
      if (gen !== playGenRef.current) return;

      el.onended = () => {
        if (gen !== playGenRef.current) return;
        setPlayingId((p) => (p === id ? null : p));
      };
      el.src = blobUrl;
      el.currentTime = 0;
      await el.play();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (gen !== playGenRef.current) return;
      console.error("Voice preview failed", err);
      setPlayingId((p) => (p === id ? null : p));
    }
  }, [playingId, stop]);

  return { playingId, toggle, stop };
}

// ── Icons ────────────────────────────────────────────────────────────────────

export function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-muted-foreground shrink-0"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

export function SpeedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 18a8 8 0 1 1 14 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 14l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

export function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
