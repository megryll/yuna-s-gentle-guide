import { useAppMode, type AppMode } from "@/lib/theme-prefs";

/**
 * Single source for emotion / sentiment pills used across the app —
 * past-session cards and wrap-up reflection highlights. A frosted pill
 * with a hairline border and a small colored dot indicating the emotion's
 * family. Display-only, single size — never interactive.
 */

export type SentimentTone = "positive" | "negative";

const TONE_COLOR_DARK: Record<SentimentTone, string> = {
  positive: "#9EFF94",
  negative: "#FFCB87",
};

const TONE_COLOR_LIGHT: Record<SentimentTone, string> = {
  positive: "#9EFF94",
  negative: "#FFBE86",
};

export function useSentimentToneColor(): (tone: SentimentTone) => string {
  const mode = useAppMode();
  const palette = mode === "light" ? TONE_COLOR_LIGHT : TONE_COLOR_DARK;
  return (tone) => palette[tone];
}

type SentimentTagProps = {
  label: string;
  /** Tone shortcut — sets dot to the tone palette. */
  tone?: SentimentTone;
  /** Explicit dot color — overrides tone. */
  dotColor?: string;
  surface?: AppMode;
};

export function SentimentTag({
  label,
  tone,
  dotColor,
  surface,
}: SentimentTagProps) {
  const appMode = useAppMode();
  const mode = surface ?? appMode;
  const isLight = mode === "light";
  const toneColor = isLight ? TONE_COLOR_LIGHT : TONE_COLOR_DARK;
  const resolvedDot = dotColor ?? (tone ? toneColor[tone] : "rgba(255,255,255,0.5)");

  const surfaceClass = isLight
    ? "bg-[rgba(20,20,22,0.05)] border border-[rgba(20,20,22,0.15)] text-foreground/85"
    : "bg-white/[0.08] border border-white/15 text-white/85";

  return (
    <span
      className={
        "inline-flex items-center justify-center whitespace-nowrap " +
        "h-8 rounded-full px-3 text-[12.5px] leading-none gap-1.5 " +
        surfaceClass
      }
    >
      <span
        aria-hidden
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: resolvedDot }}
      />
      <span className="leading-none">{label}</span>
    </span>
  );
}
