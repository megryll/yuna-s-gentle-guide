import type { ReactNode } from "react";

/**
 * RatingScale — a single-choice row of rating options. Each option can hold an
 * emoji, a number, a word, or an icon; pick the count that fits the question
 * (2 for a thumbs up/down, 5 for a mood face scale, etc.). The chosen option
 * scales up and gains a circular border + surface fill, and once any choice is
 * made the rest shrink back, so the selection reads at a glance for emoji and
 * glyphs alike.
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
  // The selected circle/pill: a hairline ring + a faint surface fill, matching
  // the neutral selection idiom used across the system.
  const activeFill =
    surface === "dark" ? "border-white/40 bg-white/15" : "border-foreground/30 bg-foreground/[0.06]";

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex items-center justify-center gap-4">
      {options.map((opt) => {
        const active = opt.value === value;
        // Scale the whole option (ring + fill + content) as one unit so the fill
        // always wraps the content — including word options.
        const scale = active ? "scale-125" : hasPick ? "scale-90" : "scale-100";
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            onClick={() => onChange(opt.value)}
            className={
              "h-11 min-w-11 px-2 inline-flex items-center justify-center leading-none rounded-full " +
              "border border-transparent " +
              "transition-[transform,background-color,border-color] duration-200 ease-out " +
              "active:opacity-70 focus-visible:outline-none " +
              (active ? activeFill + " " : "") +
              scale +
              " " +
              ink +
              " " +
              textSize
            }
          >
            <span aria-hidden className="inline-flex items-center justify-center">
              {opt.content}
            </span>
          </button>
        );
      })}
    </div>
  );
}
