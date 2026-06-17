import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * TileChoice — a 2-up grid of selectable tiles, each carrying a visual
 * (illustration, icon, or short glyph) above a title and optional description.
 * Single-select. Reach for it when the choices benefit from a picture rather
 * than a row of text — comfort levels, themes, a "which of these is most you"
 * pick. For plain text answers use `MultipleChoice`; for a compact emoji/number
 * scale use `RatingScale`.
 *
 * The selected tile borrows the DS's neutral selection idiom (filled
 * ink/white highlight + a settle pulse), the same vocabulary as MultipleChoice
 * and Button's card state, so selection reads consistently across the system.
 *
 * options:    [{ value, label, visual?, description?, disabled? }]
 * value:      selected value (or null)
 * onChange:   next value
 * surface?:   "dark" | "light" (default "dark")
 * animateIn?: cascade the tiles in on mount, one after another (default false)
 * ariaLabel:  names the group (radiogroup)
 */
export type TileChoiceOption = {
  value: string;
  label: string;
  /** Illustration, icon, or short glyph shown above the label. */
  visual?: ReactNode;
  description?: string;
  disabled?: boolean;
};

const CASCADE_STEP_MS = 55;

export function TileChoice({
  options,
  value,
  onChange,
  surface = "dark",
  animateIn = false,
  ariaLabel,
  className,
}: {
  options: TileChoiceOption[];
  value: string | null;
  onChange: (value: string) => void;
  surface?: "dark" | "light";
  animateIn?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  const dark = surface === "dark";
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("grid grid-cols-2 gap-3", className)}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            style={animateIn ? { animationDelay: `${i * CASCADE_STEP_MS}ms` } : undefined}
            className={cn(
              "flex flex-col items-center text-center rounded-2xl border px-4 py-5 gap-2",
              "transition-[transform,background-color,border-color] duration-100 ease-out active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
              "disabled:opacity-50 disabled:pointer-events-none",
              animateIn && "survey-pop-item",
              selected && "yuna-settle",
              dark
                ? selected
                  ? "border-white bg-white/10 text-white focus-visible:ring-white/60"
                  : "border-white/40 text-white active:bg-white/10 focus-visible:ring-white/60"
                : selected
                  ? "border-foreground/40 bg-foreground/5 text-foreground focus-visible:ring-foreground/30"
                  : "border-border text-foreground active:bg-foreground/8 focus-visible:ring-foreground/30",
            )}
          >
            {opt.visual && (
              <span
                aria-hidden
                className="h-14 flex items-center justify-center text-4xl leading-none"
              >
                {opt.visual}
              </span>
            )}
            <span className="block text-sm font-semibold leading-tight">{opt.label}</span>
            {opt.description && (
              <span
                className={cn(
                  "block text-xs leading-snug",
                  dark ? "text-white/70" : "text-muted-foreground",
                )}
              >
                {opt.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
TileChoice.displayName = "TileChoice";
