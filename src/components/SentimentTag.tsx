import type { ReactNode } from "react";
import { useAppMode } from "@/lib/theme-prefs";

/**
 * Single source for sentiment-tagged pills used across the app —
 * past-session cards (display only) and the wrap-up reflection toggles
 * (interactive). One component so a future visual change updates every
 * surface at once.
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
  tone: SentimentTone;
  emoji: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  size?: "md" | "sm";
};

export function SentimentTag({
  tone,
  emoji,
  label,
  active = false,
  onClick,
  size = "md",
}: SentimentTagProps) {
  const toneColor = useSentimentToneColor();
  const tint = toneColor(tone);
  const interactive = typeof onClick === "function";

  const sizeClass =
    size === "sm"
      ? "h-8 rounded-full px-3 text-[12.5px] leading-none gap-1.5 "
      : "h-8 rounded-full px-2.5 text-[13px] leading-none gap-1.5 ";
  const emojiClass =
    size === "sm"
      ? "text-[11.5px] leading-none translate-y-[-0.5px]"
      : "text-[14px] leading-none translate-y-[-0.5px]";
  const baseClass =
    sizeClass +
    "inline-flex items-center justify-center text-center whitespace-nowrap transition-colors duration-150 " +
    (interactive ? "active:scale-[0.97] " : "");

  // Active = solid white pill with ink text in both modes. Uses arbitrary
  // hex values so neither the `.theme-light` shim (which flips `bg-white`
  // → ink) nor `.overlay-on-dark` token-swap can clobber the active state.
  const activeClass =
    "bg-[#ffffff] text-[#1D1F25] border border-transparent shadow-[0_4px_14px_rgba(255,255,255,0.22)] tag-pop";
  const inactiveClass = "border text-white/90";

  const inner = (
    <>
      <span aria-hidden className={emojiClass}>
        {emoji}
      </span>
      <span className="leading-none">{label}</span>
    </>
  );

  // Semitransparent fill uses the same hex as the border so the pill reads
  // as a softly tinted chip in both light + dark. Border kept softer than
  // the original full-opacity hex so the chip feels less stamped on; fill
  // alpha kept low so text stays the dominant signal.
  const inactiveStyle = {
    borderColor: `${tint}B3`, // ~70% opacity
    backgroundColor: `${tint}26`, // ~15% opacity
  };

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        style={active ? undefined : inactiveStyle}
        className={baseClass + (active ? activeClass : inactiveClass)}
      >
        {inner}
      </button>
    );
  }

  return (
    <span
      style={inactiveStyle}
      className={baseClass + inactiveClass}
    >
      {inner}
    </span>
  );
}
