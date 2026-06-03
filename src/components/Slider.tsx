import * as SliderPrimitive from "@radix-ui/react-slider";

/**
 * Slider — a thin streamlined rail with a small circular thumb, in two
 * variants that share the same visual language.
 *
 * variant="linear" (default): a left-to-right control over a small ordered
 *   set of steps (e.g. voice pace 0.5x → 1.5x). `value` is the 0-based step
 *   index; step labels render below the rail and a green fill grows from the
 *   left edge to the thumb.
 *
 * variant="bipolar": a center-out rating. The thumb rests at the midpoint and
 *   the fill grows from center — right/green when positive, left/orange when
 *   negative. `value` runs -1 → 1. `leftLabel`/`rightLabel` sit above the rail.
 *
 * surface: which background the slider sits on.
 *   - "dark"  — dark or photo backgrounds (white thumb, translucent rail)
 *   - "light" — light app chrome (ink thumb)
 */
export interface SliderProps {
  variant?: "linear" | "bipolar";
  value: number;
  onChange: (value: number) => void;
  surface?: "dark" | "light";
  /** Caps-tracked label above the rail (linear). */
  label?: string;
  /** linear: step labels below the rail; length defines the step count. */
  steps?: readonly string[];
  /** bipolar: negative-end label, above the rail. */
  leftLabel?: string;
  /** bipolar: positive-end label, above the rail. */
  rightLabel?: string;
  /** bipolar: emphasise the active end label once the user has moved it. */
  touched?: boolean;
}

const SURFACE = {
  dark: {
    track: "bg-white/15 border border-white/12",
    thumb: "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.4)]",
    ring: "focus-visible:ring-white/60",
    notch: "bg-white/35",
    eyebrow: "text-white/65",
    end: "text-white/75",
    endActive: "text-white/95",
    stepOn: "text-white",
    stepOff: "text-white/55",
  },
  light: {
    track: "bg-foreground/10 border border-foreground/10",
    thumb: "bg-foreground shadow-[0_2px_8px_rgba(0,0,0,0.18)]",
    ring: "focus-visible:ring-foreground/40",
    notch: "bg-foreground/30",
    eyebrow: "text-muted-foreground",
    end: "text-foreground/70",
    endActive: "text-foreground",
    stepOn: "text-foreground",
    stepOff: "text-muted-foreground",
  },
} as const;

export function Slider({
  variant = "linear",
  value,
  onChange,
  surface = "dark",
  label,
  steps,
  leftLabel,
  rightLabel,
  touched,
}: SliderProps) {
  const s = SURFACE[surface];

  const trackCls = "relative h-3 w-full grow rounded-full " + s.track;
  const thumbCls =
    "block h-6 w-6 rounded-full transition-colors focus-visible:outline-none " +
    "focus-visible:ring-2 " +
    s.thumb +
    " " +
    s.ring;
  const rootCls = "relative flex w-full touch-none select-none items-center h-7";

  if (variant === "bipolar") {
    const positive = value > 0;
    const negative = value < 0;
    // Fill spans from center (50%) outward by |value| * 50%. For negative
    // values we offset the left edge so the bar grows leftward visually.
    const fillStart = negative ? 50 + value * 50 : 50;
    const fillWidth = Math.abs(value) * 50;
    // Positive reuses the linear rail's green; negative matches the toast
    // alert orange — same tokens, so the language is consistent everywhere.
    const fillCls = positive ? "bg-yuna-green" : negative ? "bg-alert-orange" : "";

    return (
      <div className="flex flex-col gap-0.5">
        {(leftLabel || rightLabel) && (
          <div
            className={
              "flex items-center justify-between text-[13px] font-medium tracking-[0.04em] uppercase " +
              s.end
            }
          >
            <span className={negative && touched ? s.endActive : ""}>{leftLabel}</span>
            <span className={positive && touched ? s.endActive : ""}>{rightLabel}</span>
          </div>
        )}
        <SliderPrimitive.Root
          className={rootCls}
          min={-1}
          max={1}
          step={0.01}
          value={[value]}
          onValueChange={(v) => onChange(v[0] ?? 0)}
          aria-label={leftLabel && rightLabel ? `${leftLabel} to ${rightLabel}` : label}
        >
          <SliderPrimitive.Track className={trackCls}>
            <span
              aria-hidden
              className={
                "pointer-events-none absolute left-1/2 -translate-x-1/2 -top-1.5 h-[24px] w-px " +
                s.notch
              }
            />
            <span
              aria-hidden
              className={
                "pointer-events-none absolute top-0 h-full rounded-full transition-colors duration-150 " +
                fillCls
              }
              style={{ left: `${fillStart}%`, width: `${fillWidth}%` }}
            />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className={thumbCls} />
        </SliderPrimitive.Root>
      </div>
    );
  }

  // ── linear ──────────────────────────────────────────────────────────────
  const stepList = steps ?? [];
  const maxIdx = Math.max(stepList.length - 1, 0);

  return (
    <div className="flex flex-col">
      {label && (
        <p className={"text-[11px] tracking-[0.25em] uppercase mb-4 " + s.eyebrow}>{label}</p>
      )}
      <SliderPrimitive.Root
        className={rootCls}
        min={0}
        max={maxIdx}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 0)}
        aria-label={label}
      >
        <SliderPrimitive.Track className={trackCls}>
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-yuna-green" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className={thumbCls} />
      </SliderPrimitive.Root>
      {stepList.length > 0 && (
        <div
          className="grid mt-3"
          style={{ gridTemplateColumns: `repeat(${stepList.length}, minmax(0, 1fr))` }}
        >
          {stepList.map((stepLabel, i) => (
            <button
              key={stepLabel}
              type="button"
              onClick={() => onChange(i)}
              className={
                "text-xs text-center transition-colors " +
                (i === value ? s.stepOn + " font-medium" : s.stepOff)
              }
            >
              {stepLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
