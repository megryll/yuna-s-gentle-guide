import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/Button";
import { YunaAvatar } from "@/components/YunaAvatar";
import { YunaMark } from "@/components/YunaMark";
import { useYunaIdentity } from "@/lib/yuna-session";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { VOICES } from "@/lib/voices";
import { useAppMode } from "@/lib/theme-prefs";

export type TooltipStep = "you" | "tools" | "sessions";

type StepConfig = {
  title: string;
  text: string;
  // Arrow horizontal position as a % from the left of the card. AppBar
  // tabs sit at roughly 10/30/50/70/90% of the phone frame; card spans
  // 5%-95% so frame % maps approximately 1:1 onto card %.
  pointerLeft: string;
  // Steps anchor to the bottom (arrow points down into the AppBar tab).
  anchor: "top" | "bottom";
  next:
    | { kind: "advance"; to: "/tools" | "/sessions"; label: string }
    | { kind: "finish"; label: string };
};

const STEP_CONFIG: Record<TooltipStep, StepConfig> = {
  you: {
    title: "What I know about you.",
    text: "What I've learned about you — and how it shapes the way I show up — lives here.",
    pointerLeft: "30%",
    anchor: "bottom",
    next: { kind: "advance", to: "/tools", label: "Next" },
  },
  tools: {
    title: "Tools for any moment.",
    text: "Guided audio, journaling, goal-setting — extras to reach for between chats.",
    pointerLeft: "70%",
    anchor: "bottom",
    next: { kind: "advance", to: "/sessions", label: "Next" },
  },
  sessions: {
    title: "Every session, saved.",
    text: "Come back to anything we've talked about — past sessions stay here for you.",
    pointerLeft: "90%",
    anchor: "bottom",
    next: { kind: "finish", label: "All set" },
  },
};

export function TooltipsCoach({ step }: { step: TooltipStep }) {
  const navigate = useNavigate();
  const config = STEP_CONFIG[step];
  const { avatar, voice } = useYunaIdentity();
  const tooltipMode = useAppMode();
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Best-effort TTS — if the API or autoplay fails, the tooltip still works
  // silently. Re-runs when the step text changes or mute state flips.
  useEffect(() => {
    if (muted) {
      audioRef.current?.pause();
      return;
    }
    let cancelled = false;
    if (!voice) return;
    const cfg = VOICES[voice];
    (async () => {
      try {
        const url = await fetchTtsBlobUrl(cfg.elevenlabsId, config.text);
        if (cancelled) return;
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = url;
        const el = audioRef.current ?? new Audio();
        audioRef.current = el;
        el.src = url;
        el.currentTime = 0;
        await el.play();
      } catch {
        // Prototype: silent fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.text, voice, muted]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const onNext = () => {
    if (config.next.kind === "advance") {
      navigate({ to: config.next.to, search: { tooltips: "1" } as never });
    } else {
      navigate({ to: "/home" });
    }
  };

  // bottom anchor sits ≈100px above the frame bottom — clears the AppBar
  // (~80px tall) with a small gap so the arrow tip lands cleanly into the
  // pointed-at tab. top anchor sits high enough that the "Created For You"
  // label below the tooltip remains visible above the first card.
  const wrapperStyle =
    config.anchor === "bottom" ? { bottom: 100 } : { top: 60 };

  const isDark = tooltipMode === "dark";
  // Frosted-glass bubble. Bubble owns the backdrop-blur directly. The
  // entrance animation is opacity-only (yuna-fade-in) — any transform on the
  // bubble or its ancestors blocks the bubble's own backdrop-filter from
  // seeing through to the page in some browsers. Tint is solid enough to
  // obscure underlying text even if backdrop-filter is suppressed. No box
  // shadow — its 1px edge line was reading as a seam where the arrow joins.
  const bubbleBg = isDark ? "bg-white/40" : "bg-white/75";

  return (
    <div
      className="absolute inset-0 z-40 yuna-fade-in"
      role="dialog"
      aria-label="Yuna tour"
    >
      <div className="absolute inset-0" onClick={onNext} />

      <div
        className="absolute left-5 right-5"
        style={wrapperStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            "relative rounded-3xl text-popover-foreground p-5 backdrop-blur-2xl yuna-rise " +
            bubbleBg +
            " " +
            (isDark ? "overlay-on-dark" : "")
          }
        >
          <div className="flex items-start gap-3">
            <span className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {avatar ? (
                <YunaAvatar variant={avatar} size={40} />
              ) : (
                <span className="h-10 w-10 rounded-full hairline flex items-center justify-center">
                  <YunaMark size={20} className="text-foreground" />
                </span>
              )}
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[15px] font-semibold leading-snug">
                {config.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {config.text}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute Yuna" : "Mute Yuna"}
              aria-pressed={muted}
              className="h-8 w-8 rounded-full border border-foreground/40 bg-background/60 backdrop-blur-sm flex items-center justify-center text-foreground active:bg-background/80 transition-colors"
            >
              {muted ? (
                <VolumeX size={16} strokeWidth={1.6} aria-hidden />
              ) : (
                <Volume2 size={16} strokeWidth={1.6} aria-hidden />
              )}
            </button>

            <Button
              surface="light"
              variant="primary"
              size="sm"
              onClick={onNext}
            >
              {config.next.label}
            </Button>
          </div>
        </div>

        <div
          aria-hidden
          className={
            "absolute pointer-events-none backdrop-blur-2xl " + bubbleBg
          }
          style={{
            top: "100%",
            left: config.pointerLeft,
            width: 24,
            height: 14,
            marginTop: -3,
            transform: "translateX(-50%)",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          }}
        />
      </div>
    </div>
  );
}
