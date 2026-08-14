import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/Slider";
import { usePrototypeMute } from "@/lib/prototype-mute";
import { playSelectPop, playSliderTick } from "@/lib/survey-sound";
import type { WrapUpVariant } from "@/lib/session-dev";
import { cn } from "@/lib/utils";

// ─── Wrap-up reflection A/B variants ─────────────────────────────────────────
// Four alternative treatments of the wrap-up's "how did this session land?"
// question, driven by the EngineerSidebar's States chips. Every variant reads
// and writes the same two bipolar values (-1 → 1) the shipped screen persists,
// so switching treatments never changes what a keepsake stores.
//
// These are deliberately experimental: the Sliders and choice variants reach
// past the DS Slider for bigger targets, spring motion, and pressed-state
// feedback.
// Nothing here is a DS primitive — if a variant wins, it graduates into one.

export type ReflectionValues = {
  stress: number;
  stressTouched: boolean;
  onStressChange: (v: number) => void;
  mood: number;
  moodTouched: boolean;
  onMoodChange: (v: number) => void;
};

// Zone labels + faces, ordered negative → positive. One list per variant: the
// 6- and 4-option button scales, and the 5-zone readout the big rail snaps to.
type Zone = { face: string; label: string };

const STRESS_6: Zone[] = [
  { face: "😖", label: "A lot more stress" },
  { face: "😟", label: "More stress" },
  { face: "😕", label: "A little more stress" },
  { face: "🙂", label: "A little less stress" },
  { face: "😌", label: "Less stress" },
  { face: "🧘", label: "A lot less stress" },
];

const MOOD_6: Zone[] = [
  { face: "😞", label: "A lot worse" },
  { face: "😕", label: "Worse" },
  { face: "😐", label: "A little worse" },
  { face: "🙂", label: "A little better" },
  { face: "😄", label: "Better" },
  { face: "🤩", label: "A lot better" },
];

// Four options, deliberately even: there's no midpoint to land on, so every
// answer commits to a direction.
const STRESS_4: Zone[] = [
  { face: "😖", label: "A lot more" },
  { face: "😕", label: "A bit more" },
  { face: "😌", label: "A bit less" },
  { face: "🧘", label: "A lot less" },
];

const MOOD_4: Zone[] = [
  { face: "😞", label: "A lot worse" },
  { face: "😕", label: "A bit worse" },
  { face: "🙂", label: "A bit better" },
  { face: "🤩", label: "A lot better" },
];

// Odd-length scales include a true midpoint; even-length ones (6) skip it, so
// "about the same" is only offered where the scale can express it.
const SLIDER_STRESS: Zone[] = [
  { face: "😖", label: "A lot more stress" },
  { face: "😕", label: "A little more stress" },
  { face: "😐", label: "About the same" },
  { face: "😌", label: "A little less stress" },
  { face: "🧘", label: "A lot less stress" },
];

const SLIDER_MOOD: Zone[] = [
  { face: "😞", label: "A lot worse" },
  { face: "😕", label: "A little worse" },
  { face: "😐", label: "About the same" },
  { face: "🙂", label: "A little better" },
  { face: "🤩", label: "A lot better" },
];

/** Index → bipolar value, spreading n options evenly across -1 → 1. */
function valueForIndex(i: number, n: number) {
  return n <= 1 ? 0 : -1 + (2 * i) / (n - 1);
}

/** Which zone a -1 → 1 value currently sits in. */
function zoneForValue(v: number, n: number) {
  const idx = Math.round(((v + 1) / 2) * (n - 1));
  return Math.min(Math.max(idx, 0), n - 1);
}

export function WrapUpReflection({
  variant,
  values,
}: {
  variant: WrapUpVariant;
  values: ReflectionValues;
}) {
  // Every non-current variant leads the screen, so it carries the larger
  // display heading; "current" keeps the original mid-scroll section size.
  const lead = variant !== "current";

  return (
    <section className="flex flex-col gap-8 yuna-rise">
      <h2
        className={cn(
          "font-display leading-tight text-white text-center",
          lead ? "text-3xl" : "text-xl",
        )}
      >
        How did this session land?
      </h2>

      {variant === "sliders" ? (
        <div className="flex flex-col gap-10">
          <BigSlider
            zones={SLIDER_STRESS}
            value={values.stress}
            touched={values.stressTouched}
            onChange={values.onStressChange}
            ariaLabel="How your stress shifted"
            leftAnchor="More stress"
            rightAnchor="Less stress"
          />
          <BigSlider
            zones={SLIDER_MOOD}
            value={values.mood}
            touched={values.moodTouched}
            onChange={values.onMoodChange}
            ariaLabel="How your mood shifted"
            leftAnchor="Worse mood"
            rightAnchor="Better mood"
          />
        </div>
      ) : variant === "choice6" ? (
        <div className="flex flex-col gap-8">
          <ChoiceGroup
            title="Your stress"
            zones={STRESS_6}
            value={values.stressTouched ? values.stress : null}
            onChange={values.onStressChange}
            leftAnchor="More"
            rightAnchor="Less"
          />
          <ChoiceGroup
            title="Your mood"
            zones={MOOD_6}
            value={values.moodTouched ? values.mood : null}
            onChange={values.onMoodChange}
            leftAnchor="Worse"
            rightAnchor="Better"
          />
        </div>
      ) : variant === "choice4" ? (
        <div className="flex flex-col gap-8">
          <ChoiceGroup
            title="Your stress"
            zones={STRESS_4}
            value={values.stressTouched ? values.stress : null}
            onChange={values.onStressChange}
            showLabels
          />
          <ChoiceGroup
            title="Your mood"
            zones={MOOD_4}
            value={values.moodTouched ? values.mood : null}
            onChange={values.onMoodChange}
            showLabels
          />
        </div>
      ) : (
        <div className="flex flex-col gap-9">
          <Slider
            variant="bipolar"
            surface="dark"
            leftLabel="Increased stress"
            rightLabel="Decreased stress"
            value={values.stress}
            touched={values.stressTouched}
            onChange={values.onStressChange}
          />
          <Slider
            variant="bipolar"
            surface="dark"
            leftLabel="Worsened mood"
            rightLabel="Improved mood"
            value={values.mood}
            touched={values.moodTouched}
            onChange={values.onMoodChange}
          />
        </div>
      )}
    </section>
  );
}

// ─── Sliders variant ────────────────────────────────────────────────────────────
// A deliberately oversized bipolar rail: a face that swaps and pops as you
// cross a zone, a 56px thumb that swells and glows under the finger, a fill
// that grows from center with a matching glow, and a release ring. Ticks on
// every zone crossing, pops on release. Pointer-driven rather than Radix so the
// thumb can own its pressed state and the whole rail is one big drag target.

const THUMB = 56;

function BigSlider({
  zones,
  value,
  touched,
  onChange,
  ariaLabel,
  leftAnchor,
  rightAnchor,
}: {
  zones: Zone[];
  value: number;
  touched: boolean;
  onChange: (v: number) => void;
  ariaLabel: string;
  leftAnchor: string;
  rightAnchor: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState(false);
  // Bumped on release so the halo ring remounts and replays each time.
  const [ringKey, setRingKey] = useState(0);
  const muted = usePrototypeMute();
  const zone = zoneForValue(value, zones.length);
  const lastZone = useRef(zone);

  // Sound follows the zone, not the raw pixel — a drag across the rail ticks
  // five times, not sixty.
  useEffect(() => {
    if (zone !== lastZone.current) {
      lastZone.current = zone;
      playSliderTick({ muted });
    }
  }, [zone, muted]);

  const setFromClientX = (clientX: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    // Map against the thumb's travel, not the raw rail, so the ends are
    // reachable without dragging past the visible thumb.
    const travel = Math.max(r.width - THUMB, 1);
    const frac = Math.min(Math.max((clientX - r.left - THUMB / 2) / travel, 0), 1);
    // Snap to zones so the readout, the fill, and the answer always agree.
    onChange(valueForIndex(Math.round(frac * (zones.length - 1)), zones.length));
  };

  const positive = value > 0.001;
  const negative = value < -0.001;
  const fillCls = positive
    ? "bg-secondary-green shadow-[0_0_24px_var(--secondary-green)]"
    : negative
      ? "bg-alert-orange shadow-[0_0_24px_var(--alert-orange)]"
      : "";

  // The 56px thumb travels inset by its own radius so it never hangs off the
  // rail ends; the fill and the notches ride the same inset so everything on
  // the rail lines up with the thumb's center.
  const thumbPct = ((value + 1) / 2) * 100;
  const inset = (pct: number) => (0.5 - pct / 100) * THUMB;
  const at = (pct: number) => `calc(${pct}% + ${inset(pct)}px)`;
  const fillStyle = positive
    ? { left: "50%", width: `calc(${thumbPct - 50}% + ${inset(thumbPct)}px)` }
    : negative
      ? { left: at(thumbPct), width: `calc(${50 - thumbPct}% - ${inset(thumbPct)}px)` }
      : { left: "50%", width: "0%" };

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      {/* Readout — face + label swap together, keyed so each zone change pops. */}
      <div className="flex flex-col items-center gap-1.5 h-[74px]">
        <span
          key={`face-${zone}-${touched}`}
          aria-hidden
          className={cn(
            "text-[40px] leading-none",
            touched ? "survey-pop-item" : "opacity-45 grayscale",
          )}
        >
          {zones[zone].face}
        </span>
        <span
          key={`label-${zone}`}
          className={cn(
            "survey-numeral-pop text-base font-medium",
            touched ? "text-white" : "text-white/60",
          )}
        >
          {touched ? zones[zone].label : "Drag to answer"}
        </span>
      </div>

      {/* Rail — the whole 64px-tall strip is the drag target. */}
      <div
        ref={railRef}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={zones.length - 1}
        aria-valuenow={zone}
        aria-valuetext={zones[zone].label}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setPressed(true);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (pressed) setFromClientX(e.clientX);
        }}
        onPointerUp={() => {
          setPressed(false);
          setRingKey((k) => k + 1);
          playSelectPop({ muted });
        }}
        onPointerCancel={() => setPressed(false)}
        onKeyDown={(e) => {
          const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!step) return;
          e.preventDefault();
          const next = Math.min(Math.max(zone + step, 0), zones.length - 1);
          onChange(valueForIndex(next, zones.length));
        }}
        className="relative h-16 w-full touch-none cursor-grab active:cursor-grabbing focus-visible:outline-none"
      >
        {/* Track */}
        <div className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 rounded-full bg-white/10 border border-white/15" />

        {/* Zone notches — the coarse steps read as a physical detent. */}
        {zones.map((z, i) => (
          <span
            key={z.label}
            aria-hidden
            className={cn(
              "absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-200",
              i === zone ? "opacity-0" : "bg-white/40",
            )}
            style={{ left: at((i / (zones.length - 1)) * 100) }}
          />
        ))}

        {/* Fill from center, glowing in the sentiment color. */}
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 h-5 -translate-y-1/2 rounded-full transition-all duration-200 ease-out",
            fillCls,
          )}
          style={fillStyle}
        />

        {/* Thumb — swells under the finger, drops a halo ring on release. */}
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white",
            "transition-[transform,box-shadow,left] duration-200 ease-out",
            pressed
              ? "scale-110 shadow-[0_10px_32px_rgba(0,0,0,0.5)]"
              : "shadow-[0_4px_16px_rgba(0,0,0,0.38)]",
          )}
          style={{ left: at(thumbPct) }}
        >
          {/* A sentiment dot rather than a second copy of the face — the big
              readout above owns the expression, and it stays legible under a
              finger where a 24px emoji wouldn't. */}
          <span
            className={cn(
              "h-3.5 w-3.5 rounded-full transition-colors duration-200",
              positive
                ? "bg-secondary-green"
                : negative
                  ? "bg-alert-orange"
                  : "bg-foreground/20",
            )}
          />
          {ringKey > 0 && (
            <span
              key={ringKey}
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-white slider-release-ring"
            />
          )}
        </span>
      </div>

      <div className="flex w-full items-center justify-between text-sm font-medium text-white/75">
        <span className={cn(negative && touched && "text-white")}>{leftAnchor}</span>
        <span className={cn(positive && touched && "text-white")}>{rightAnchor}</span>
      </div>
    </div>
  );
}

// ─── Choice buttons ──────────────────────────────────────────────────────────
// The slider replaced by a single row of tappable options. Six options render
// face-only with end anchors (the labels don't fit); four render face + label.
// Selection scales up and fills; the rest recede, so the answer reads at a
// glance the way RatingScale does.

function ChoiceGroup({
  title,
  zones,
  value,
  onChange,
  leftAnchor,
  rightAnchor,
  showLabels = false,
}: {
  title: string;
  zones: Zone[];
  value: number | null;
  onChange: (v: number) => void;
  leftAnchor?: string;
  rightAnchor?: string;
  showLabels?: boolean;
}) {
  const muted = usePrototypeMute();
  const selected = value === null ? null : zoneForValue(value, zones.length);

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-uppercase tracking-[0.25em] uppercase text-white/65 text-center">
        {title}
      </p>

      {/* Columns come from the option count, so the row always fills the width. */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${zones.length}, minmax(0, 1fr))` }}
      >
        {zones.map((z, i) => {
          const active = selected === i;
          return (
            <button
              key={z.label}
              type="button"
              aria-pressed={active}
              aria-label={z.label}
              onClick={() => {
                onChange(valueForIndex(i, zones.length));
                playSelectPop({ muted });
              }}
              className={cn(
                // justify-start keeps every tile's face on the same baseline
                // when one label wraps to two lines.
                "flex flex-col items-center justify-start gap-1.5 rounded-2xl border",
                "transition-[transform,background-color,border-color,opacity] duration-200 ease-out",
                "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                showLabels ? "px-1.5 py-4" : "px-0 py-3.5",
                active
                  ? "border-white/40 bg-white/20 scale-105 yuna-settle"
                  : selected !== null
                    ? "border-white/12 bg-white/5 opacity-70"
                    : "border-white/15 bg-white/10",
              )}
            >
              <span aria-hidden className={showLabels ? "text-[26px] leading-none" : "text-[22px] leading-none"}>
                {z.face}
              </span>
              {showLabels && (
                <span
                  className={cn(
                    "text-sm leading-tight text-center",
                    active ? "text-white font-medium" : "text-white/85",
                  )}
                >
                  {z.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!showLabels && (leftAnchor || rightAnchor) && (
        <div className="flex items-center justify-between text-sm font-medium text-white/75">
          <span>{leftAnchor}</span>
          <span>{rightAnchor}</span>
        </div>
      )}
    </div>
  );
}
