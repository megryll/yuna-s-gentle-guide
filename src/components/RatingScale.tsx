import type { ReactNode } from "react";

/**
 * RatingScale — a single-choice row of rating options. Each option can hold an
 * emoji, a number, a word, or an icon; pick the count that fits the question
 * (2 for a thumbs up/down, 5 for a mood face scale, etc.). The chosen option
 * scales up; once any choice is made the rest shrink back so the selection
 * reads at a glance. Selection is conveyed by scale, not a fill, so it works
 * for emoji and glyphs alike.
 *
 * surface: which background the scale sits on — sets the glyph/text ink.
 *   Defaults to "dark" (the photo-cluster house default).
 *   - "dark"  — dark or photo backgrounds (white ink)
 *   - "light" — light backgrounds (foreground ink)
 *
 * size: "lg" (default) sizes emoji/number/word content at 26px; "md" at the
 *   base text size for denser rows. Icon content carries its own size.
 */
export type RatingScaleOption<V extends string> = {
  value: V;
  /** Emoji, number, word, or icon shown in the option. */
  content: ReactNode;
  /** Accessible name for the option (e.g. "Great", "Helpful"). */
  label: string;
};

export function RatingScale<V extends string>({
  value,
  options,
  onChange,
  surface = "dark",
  ariaLabel,
  size = "lg",
}: {
  value: V | null;
  options: ReadonlyArray<RatingScaleOption<V>>;
  onChange: (v: V) => void;
  surface?: "dark" | "light";
  ariaLabel: string;
  size?: "md" | "lg";
}) {
  const hasPick = value != null;
  const ink = surface === "dark" ? "text-white" : "text-foreground";
  const textSize = size === "lg" ? "text-[26px]" : "text-base";

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex items-center justify-center gap-4">
      {options.map((opt) => {
        const active = opt.value === value;
        const scale = active ? "scale-150" : hasPick ? "scale-90" : "scale-100";
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            onClick={() => onChange(opt.value)}
            className={
              "h-11 min-w-11 inline-flex items-center justify-center leading-none " +
              "transition-opacity active:opacity-70 focus-visible:outline-none " +
              ink +
              " " +
              textSize
            }
          >
            <span
              aria-hidden
              className={
                "inline-flex items-center justify-center transition-transform duration-200 ease-out " +
                scale
              }
            >
              {opt.content}
            </span>
          </button>
        );
      })}
    </div>
  );
}
