import { useEffect, useRef, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

// ── Shared data ──────────────────────────────────────────────────────────────

export type Choice = { id: string; label: string; description: string };

export type Voice = {
  id: string;
  note: string;
  description: string;
};

export const VOICE_OPTIONS: Voice[] = [
  {
    id: "Aria",
    note: "Warm, unhurried",
    description:
      "A calm, low-tempo voice that lingers on the words. Gentle pauses, soft consonants — best for slow, reflective conversations.",
  },
  {
    id: "Sol",
    note: "Bright, attentive",
    description:
      "Awake and curious, with a lift at the end of phrases. Best when you want energy without pressure.",
  },
  {
    id: "Wren",
    note: "Soft, low",
    description:
      "Quiet and grounded, almost a whisper. Good for late nights or when you need to feel held without a lot of words.",
  },
  {
    id: "Kit",
    note: "Plain, even",
    description:
      "Neutral and steady. No theatrics — just clear delivery, the same temperature throughout.",
  },
];

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
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
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
      <span className="font-sans-ui text-xs text-muted-foreground">{value}</span>
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

// ── Voice carousel ───────────────────────────────────────────────────────────

export function VoiceCarousel({
  voice,
  onVoiceChange,
}: {
  voice: string;
  onVoiceChange: (id: string) => void;
}) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    const startIdx = Math.max(
      0,
      VOICE_OPTIONS.findIndex((v) => v.id === voice),
    );
    api.scrollTo(startIdx, true);
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      const next = VOICE_OPTIONS[idx];
      if (next) onVoiceChange(next.id);
      setPlayingId(null);
    };
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, voice, onVoiceChange]);

  const togglePlay = (id: string) => {
    setPlayingId((cur) => (cur === id ? null : id));
  };

  return (
    <div className="flex flex-col">
      <Carousel
        setApi={setApi}
        opts={{ align: "center", loop: true, containScroll: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 px-3">
          {VOICE_OPTIONS.map((v) => (
            <CarouselItem key={v.id} className="pl-3 basis-[78%]">
              <VoiceCard
                voice={v}
                selected={v.id === voice}
                playing={playingId === v.id}
                onTogglePlay={() => togglePlay(v.id)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <Dots count={VOICE_OPTIONS.length} activeId={voice} ids={VOICE_OPTIONS.map((v) => v.id)} />
    </div>
  );
}

function VoiceCard({
  voice,
  selected,
  playing,
  onTogglePlay,
}: {
  voice: Voice;
  selected: boolean;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  return (
    <div
      className={
        "h-full rounded-3xl hairline px-6 py-7 flex flex-col gap-4 transition-all duration-300 " +
        (selected ? "bg-foreground text-background" : "bg-background")
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={
              "font-sans-ui text-[10px] tracking-[0.25em] uppercase " +
              (selected ? "text-background/70" : "text-muted-foreground")
            }
          >
            {voice.note}
          </p>
          <h3 className="font-serif text-3xl tracking-tight mt-1">{voice.id}</h3>
        </div>
        <span
          className={
            "h-2.5 w-2.5 rounded-full mt-2 shrink-0 " + (selected ? "bg-background" : "bg-border")
          }
          aria-hidden="true"
        />
      </div>

      <p
        className={
          "text-sm leading-relaxed " + (selected ? "text-background/85" : "text-muted-foreground")
        }
      >
        {voice.description}
      </p>

      <div className="mt-auto flex items-center gap-3 pt-2">
        <button
          onClick={onTogglePlay}
          aria-label={playing ? `Pause ${voice.id} preview` : `Play ${voice.id} preview`}
          className={
            "h-12 w-12 rounded-full flex items-center justify-center transition-colors shrink-0 " +
            (selected ? "bg-background text-foreground" : "bg-foreground text-background")
          }
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <Waveform active={playing} muted={!selected} />
      </div>
    </div>
  );
}

function Waveform({ active, muted }: { active: boolean; muted: boolean }) {
  const bars = 14;
  return (
    <div className="flex-1 flex items-center gap-[3px] h-7" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => {
        const base = 6 + ((i * 7) % 14);
        return (
          <span
            key={i}
            className={
              "w-[3px] rounded-full transition-all " +
              (muted ? "bg-current opacity-30" : "bg-current opacity-80")
            }
            style={{
              height: active ? `${base + (i % 3) * 4}px` : `${base}px`,
              animation: active
                ? `voice-wave 900ms ease-in-out ${i * 60}ms infinite alternate`
                : "none",
            }}
          />
        );
      })}
      <style>{`
        @keyframes voice-wave {
          0% { transform: scaleY(0.55); }
          100% { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}

function Dots({ count, activeId, ids }: { count: number; activeId: string; ids: string[] }) {
  const activeIdx = ids.indexOf(activeId);
  return (
    <div className="flex items-center justify-center gap-1.5 mt-5">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={
            "h-1.5 rounded-full transition-all " +
            (i === activeIdx ? "w-5 bg-foreground" : "w-1.5 bg-border")
          }
        />
      ))}
    </div>
  );
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

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 7 5.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
      <rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
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
