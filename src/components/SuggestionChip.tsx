import * as React from "react";
import { ArrowUp as ArrowUpIcon } from "lucide-react";
import { useAppMode, type AppMode } from "@/lib/theme-prefs";

type Variant = "filled" | "primary";
type Size = "md" | "sm" | "lg";

type Props = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  surface?: AppMode;
  /** Optional element rendered at the chip's leading edge (e.g. an avatar). */
  leading?: React.ReactNode;
};

const FILLED_BG_DARK = "rgba(253, 252, 250, 0.2)";
const FILLED_BG_LIGHT = "rgba(255, 255, 255, 0.5)";
const PRIMARY_BG_DARK = "#FFFFFF";
const PRIMARY_BG_LIGHT = "#1D1F25";
const INK = "#1D1F25";
const WHITE = "#FFFFFF";

export function SuggestionChip({
  children,
  onClick,
  disabled,
  variant = "filled",
  size = "md",
  fullWidth = true,
  surface,
  leading,
}: Props) {
  const appMode = useAppMode();
  const mode = surface ?? appMode;
  const isLight = mode === "light";

  const sizeClasses =
    size === "sm"
      ? "gap-3 pl-3 pr-1.5 py-1.5 text-[14px] leading-tight"
      : size === "lg"
        ? "gap-3 pl-5 pr-3 py-3 text-[16px] leading-snug"
        : "gap-3 pl-4 pr-2 py-2 text-[14px] leading-snug";

  // Chip body + text are driven entirely by `surface` so the chip renders
  // identically inside `.theme-light` (Home in light mode) and outside it
  // (DS page) — no Tailwind classes that the `.theme-light` shim would flip.
  const textColor =
    variant === "primary"
      ? isLight ? WHITE : INK   // primary: text inverts the solid chip body
      : isLight ? INK : WHITE;  // filled: text matches the surface tone

  const inlineStyle =
    variant === "primary"
      ? {
          backgroundColor: isLight ? PRIMARY_BG_LIGHT : PRIMARY_BG_DARK,
          color: textColor,
        }
      : {
          backgroundColor: isLight ? FILLED_BG_LIGHT : FILLED_BG_DARK,
          borderTop: `1px solid rgba(255,255,255,${isLight ? 0.7 : 0.1})`,
          color: textColor,
        };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        (fullWidth ? "w-full " : "") +
        "inline-flex items-center rounded-full text-left transition-opacity active:opacity-80 disabled:opacity-50 disabled:pointer-events-none " +
        sizeClasses
      }
      style={inlineStyle}
    >
      {leading && (
        <span className="shrink-0 -ml-1 flex items-center" aria-hidden>
          {leading}
        </span>
      )}
      <span className={(fullWidth ? "flex-1 " : "") + "min-w-0"}>
        {children}
      </span>
      <ActionAffordance size={size} variant={variant} isLight={isLight} />
    </button>
  );
}

function ActionAffordance({
  size,
  variant,
  isLight,
}: {
  size: Size;
  variant: Variant;
  isLight: boolean;
}) {
  const circleSize =
    size === "lg" ? "h-9 w-9" : size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const iconPx = size === "lg" ? 14 : size === "sm" ? 10 : 12;
  // The affordance always inverts the chip body's tone so the arrow stays
  // readable:
  //   filled+dark   (frosted-translucent chip) → white circle, ink arrow
  //   filled+light  (frosted-white chip)       → ink   circle, white arrow
  //   primary+dark  (solid white chip)         → ink   circle, white arrow
  //   primary+light (solid ink chip)           → white circle, ink arrow
  const affordanceStyle =
    variant === "primary"
      ? isLight
        ? { backgroundColor: WHITE, color: INK }
        : { backgroundColor: INK, color: WHITE }
      : isLight
        ? { backgroundColor: INK, color: WHITE }
        : { backgroundColor: WHITE, color: INK };
  return (
    <span
      aria-hidden
      className={"shrink-0 grid place-items-center rounded-full " + circleSize}
      style={affordanceStyle}
    >
      <ArrowUpIcon size={iconPx} strokeWidth={2.5} />
    </span>
  );
}
