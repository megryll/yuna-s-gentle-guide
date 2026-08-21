import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Confetti } from "@/components/Confetti";
import { Slider } from "@/components/Slider";
import {
  checkInStats,
  improved,
  lift,
  useCheckIns,
  type CheckIn,
} from "@/lib/checkin-history";
import { usePrototypeMute } from "@/lib/prototype-mute";
import { playCompleteSwell, playSelectPop, playSliderTick } from "@/lib/survey-sound";
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

// The two "as easy as possible" variants ask their own short question per
// metric ("Mood?", "Stress?"), so the shared section heading would just be
// noise above them.
const SELF_TITLED: WrapUpVariant[] = ["binary", "stepped"];

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
      {!SELF_TITLED.includes(variant) && (
        <h2
          className={cn(
            "font-display leading-tight text-white text-center",
            lead ? "text-3xl" : "text-xl",
          )}
        >
          How did this session land?
        </h2>
      )}

      <ReflectionBody variant={variant} values={values} />
    </section>
  );
}

function ReflectionBody({
  variant,
  values,
}: {
  variant: WrapUpVariant;
  values: ReflectionValues;
}) {
  switch (variant) {
    case "sliders":
      return (
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
      );

    case "choice6":
      return (
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
      );

    case "choice4":
      return <FourOptions values={values} />;

    // Reward variants share the 4-option input; the payoff around it is the
    // only thing that differs between them.
    case "trend":
      return <TrendVariant values={values} />;

    case "trendFirst":
      return <TrendVariant values={values} firstTime />;

    case "tally":
      return (
        <div className="flex flex-col gap-9">
          <FourOptions values={values} />
          <TallyVariant values={values} />
        </div>
      );

    case "binary":
      return <TwoTaps values={values} />;

    case "stepped":
      return <OneAtATime values={values} />;

    default:
      return (
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
      );
  }
}

function FourOptions({ values }: { values: ReflectionValues }) {
  return (
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

// ─── Reward variants ─────────────────────────────────────────────────────────
// The payoff for answering: the user's run of check-ins, either as a trend
// over time or as a tally. Reads the same keepsake store the wrap-up already
// writes to, padded with seeded demo entries so the run reads as a run in a
// fresh browser (see checkin-history.ts).

/** Plays the completion swell once, and returns a key that replays confetti. */
function useCheckInCelebration(answered: boolean) {
  const muted = usePrototypeMute();
  const [burstKey, setBurstKey] = useState(0);
  const fired = useRef(false);
  useEffect(() => {
    if (!answered || fired.current) return;
    fired.current = true;
    playCompleteSwell({ muted });
    setBurstKey((k) => k + 1);
  }, [answered, muted]);
  return burstKey;
}

function TallyVariant({ values }: { values: ReflectionValues }) {
  const history = useCheckIns();
  const answered = values.stressTouched && values.moodTouched;
  const burstKey = useCheckInCelebration(answered);

  if (!answered) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-5 py-6 text-center">
        <p className="text-base text-white/75">
          Answer both to see how this session compares.
        </p>
      </div>
    );
  }

  const points = [...history, { label: "Today", stress: values.stress, mood: values.mood }];
  return <TallyReward points={points} stats={checkInStats(points)} burstKey={burstKey} />;
}

function ordinal(n: number) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

// ─── Trend reward ────────────────────────────────────────────────────────────
// Today's answer lands as the newest point on a bipolar trend of past
// check-ins. Center line is "no change"; above it the session helped. Two
// series (mood, stress) in secondary-palette hues rather than the sentiment
// green/orange, which on a line would read as "this line is good/bad" instead
// of naming which metric it is.

const SERIES = [
  { key: "mood", label: "Mood", color: "var(--blue)", get: (c: CheckIn) => c.mood },
  { key: "stress", label: "Stress", color: "var(--peach)", get: (c: CheckIn) => c.stress },
] as const;

/**
 * The chart leads, the questions follow. Before answering it sits above the
 * options as a blurred ghost of the user's existing run, so the payoff is
 * visible as a reason to answer rather than a surprise afterwards. Answering
 * sharpens it and lands today's point. `firstTime` drops the history entirely
 * to show the first-run state.
 */
function TrendVariant({
  values,
  firstTime = false,
}: {
  values: ReflectionValues;
  firstTime?: boolean;
}) {
  const loaded = useCheckIns();
  const history = firstTime ? [] : loaded;
  const answered = values.stressTouched && values.moodTouched;
  useCheckInCelebration(answered);

  const live: CheckIn = { label: "Today", stress: values.stress, mood: values.mood };
  const points = answered ? [...history, live] : history;
  const stats = checkInStats(points);

  const liveLift = answered ? lift(live) : null;
  const prevLift = history.length > 0 ? lift(history[history.length - 1]) : null;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3.5">
        {/* Three states, not one chart with holes in it: nothing logged yet is
            an intro card rather than an empty plot (an empty frame advertises
            the absence), a run you haven't added to is a compact ghost strip,
            and answering grows it into the full chart. Keyed so the reveal
            replays as it resolves. */}
        {!answered && history.length === 0 ? (
          <FirstCheckInCard />
        ) : (
          <TrendChart key={answered ? "live" : "ghost"} points={points} ghost={!answered} />
        )}

        {answered && (
          <div className="flex flex-col gap-1 text-center">
            <p className="font-display text-2xl leading-tight text-white">
              {history.length === 0
                ? "Your first check-in"
                : `That's your ${ordinal(stats.total)} check-in`}
            </p>
            <p className="text-base text-white/85">
              {history.length === 0
                ? "The next one gets measured against this."
                : liveLift !== null && prevLift !== null && liveLift > prevLift
                  ? "A bigger shift than last session."
                  : stats.streak > 1
                    ? `${stats.streak} in a row you've left lighter.`
                    : "Logged alongside the rest of your run."}
            </p>
          </div>
        )}
      </div>

      <FourOptions values={values} />
    </div>
  );
}

/**
 * First-ever check-in: no plot, because there's nothing to plot. Names what
 * answering starts instead of framing an empty chart.
 */
function FirstCheckInCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 px-5 py-5">
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10"
      >
        <TrendingUp size={20} strokeWidth={2} className="text-white/85" />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-base font-medium text-white">Your first check-in</p>
        <p className="text-sm text-white/85">
          Answer below and this becomes your starting point.
        </p>
      </div>
    </div>
  );
}

function TrendChart({ points, ghost }: { points: CheckIn[]; ghost: boolean }) {
  const n = points.length;
  // Percent geometry, like the assessment chart: the SVG stretches to the box,
  // so dots ride a separate overlay to stay round.
  // Inset the ends so the newest point's halo clears the card edge.
  const x = (i: number) => (n <= 1 ? 50 : 10 + (i * 80) / (n - 1));
  const y = (v: number) => (1 - (v + 1) / 2) * 100;

  const lastLabel = points[n - 1]?.label;

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 px-4 pt-3 pb-3">
      {/* Titled, with the legend as chart chrome rather than a stranded row
          under the card. Names itself, so no explanatory sentence is needed. */}
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="text-uppercase uppercase tracking-[0.2em] text-white/75">
          Your check-ins
        </span>
        <span className="flex items-center gap-3">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-sm text-white/85">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              {s.label}
            </span>
          ))}
        </span>
      </div>

      {/* The un-answered strip stays short so the questions keep the screen,
          then grows into the full chart as the reward. A lone point stays short
          too: there's no trend in it, so the height would just be dead space. */}
      <div
        className={cn(
          "relative w-full transition-[height]",
          ghost || n < 2 ? "h-24" : "h-40",
        )}
      >
        {/* No-change baseline. Everything above it is a session that helped.
            Stays sharp in the ghost state: it's the frame, not the data. */}
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/25" />

        {/* The run itself. Blurred while unanswered so the payoff is legible as
            a shape without giving away the read. */}
        <div
          className={cn(
            "absolute inset-0 transition-[filter,opacity] duration-500",
            ghost && "blur-[3px] opacity-70",
          )}
          aria-hidden={ghost || undefined}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="survey-chart-in absolute inset-0 h-full w-full"
            aria-hidden
          >
            {SERIES.map((s) => {
              const pts = points
                .map((c, i) => ({ i, v: s.get(c) }))
                .filter((p): p is { i: number; v: number } => p.v !== null);
              if (pts.length < 2) return null;
              return (
                <polyline
                  key={s.key}
                  points={pts.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {/* Dots, newest popping in last. */}
          <div className="absolute inset-0" aria-hidden>
            {SERIES.map((s) =>
              points.map((c, i) => {
                const v = s.get(c);
                if (v === null) return null;
                // Only the live answer gets the landing treatment, and only
                // once the ghost has resolved.
                const newest = !ghost && i === n - 1;
                return (
                  <span
                    key={`${s.key}-${i}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x(i)}%`, top: `${y(v)}%` }}
                  >
                    <span
                      className={cn("relative block", newest && "survey-dot-pop")}
                      style={newest ? { animationDelay: "260ms" } : undefined}
                    >
                      {newest && (
                        <span
                          className="absolute -inset-2 rounded-full"
                          style={{ background: s.color, opacity: 0.25 }}
                        />
                      )}
                      <span
                        className={cn(
                          "relative block rounded-full",
                          newest ? "h-3 w-3" : "h-2 w-2",
                        )}
                        style={{ background: s.color }}
                      />
                    </span>
                  </span>
                );
              }),
            )}
          </div>
        </div>

        {/* Says outright what the blur means, so the ghost reads as locked
            rather than as a rendering fault. Sits above the blurred layer. */}
        {ghost && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-medium text-white">
              Answer to add today
            </span>
          </div>
        )}
      </div>

      {/* One label, centered, until there's a span of time to bracket: a lone
          point sits mid-chart, so a left/right pair would read the same twice.
          The right end names the newest point, which is only "Today" once the
          live answer has actually landed. */}
      <div className="mt-2 flex items-center justify-between text-sm font-medium text-white/75">
        {n <= 1 ? (
          <span className={cn("mx-auto", !ghost && "text-white")}>{lastLabel}</span>
        ) : (
          <>
            <span>{points[0].label}</span>
            <span className={cn(lastLabel === "Today" && "text-white")}>{lastLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tally reward ────────────────────────────────────────────────────────────
// The collectible read on the same data: every past check-in is a tile, and
// today's lands last with a check and a confetti burst. Three figures below
// give the run a score without turning it into a chart.

function TallyReward({
  points,
  stats,
  burstKey,
}: {
  points: CheckIn[];
  stats: ReturnType<typeof checkInStats>;
  burstKey: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-5 py-6">
      {burstKey > 0 && <Confetti key={burstKey} />}

      <div className="relative flex flex-col gap-5">
        <p className="text-center font-display text-2xl leading-tight text-white">
          {stats.streak > 1
            ? `${stats.streak} sessions in a row you've left lighter`
            : "Another one logged"}
        </p>

        <div className="flex items-end justify-center gap-2">
          {points.map((c, i) => {
            const newest = i === points.length - 1;
            const good = improved(c);
            return (
              <span
                key={`${c.label}-${i}`}
                className={cn(
                  "relative flex h-12 w-8 items-end justify-center rounded-xl border",
                  newest && "survey-pop-item h-14",
                  // Tints carry enough alpha to stay distinct on the light
                  // photo, where a 25% fill over near-white washes out.
                  good
                    ? "border-secondary-green/60 bg-secondary-green/40"
                    : "border-alert-orange/60 bg-alert-orange/35",
                )}
                style={newest ? { animationDelay: "180ms" } : undefined}
                title={c.label}
              >
                {newest && (
                  <Badge icon size="sm" className="absolute -top-2 -right-2" label="Logged today" />
                )}
              </span>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { figure: stats.total, label: "Check-ins" },
            { figure: stats.improved, label: "Lighter" },
            { figure: stats.streak, label: "Streak" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5">
              <span className="survey-numeral-pop font-display text-3xl tabular-nums text-white">
                {s.figure}
              </span>
              <span className="text-uppercase tracking-[0.2em] uppercase text-white/75">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Binary questions ────────────────────────────────────────────────────────
// The cheapest possible input: one tap per metric. Arrow direction shows which
// way the metric moved (stress up = more), and the sentiment color says whether
// that reads as better or worse, so the tile is legible without reading.

type BinaryQuestion = {
  key: "mood" | "stress";
  question: string;
  /** Negative option: the direction that reads as worse. */
  neg: { label: string; dir: "up" | "down" };
  pos: { label: string; dir: "up" | "down" };
};

const BINARY: BinaryQuestion[] = [
  {
    key: "mood",
    question: "Mood?",
    neg: { label: "Worse", dir: "down" },
    pos: { label: "Better", dir: "up" },
  },
  {
    key: "stress",
    question: "Stress?",
    neg: { label: "More", dir: "up" },
    pos: { label: "Less", dir: "down" },
  },
];

function TwoTaps({ values }: { values: ReflectionValues }) {
  return (
    <div className="flex flex-col gap-8">
      {BINARY.map((q) => (
        <BinaryRow
          key={q.key}
          q={q}
          value={
            q.key === "mood"
              ? values.moodTouched
                ? values.mood
                : null
              : values.stressTouched
                ? values.stress
                : null
          }
          onChange={q.key === "mood" ? values.onMoodChange : values.onStressChange}
        />
      ))}
    </div>
  );
}

function BinaryRow({
  q,
  value,
  onChange,
}: {
  q: BinaryQuestion;
  value: number | null;
  onChange: (v: number) => void;
}) {
  const muted = usePrototypeMute();
  const picked = value === null ? null : value > 0 ? "pos" : "neg";

  const opts = [
    { side: "neg" as const, ...q.neg, value: -1 },
    { side: "pos" as const, ...q.pos, value: 1 },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <h3 className="font-display text-3xl leading-tight text-white">{q.question}</h3>

      <div className="grid grid-cols-2 gap-3">
        {opts.map((o) => {
          const active = picked === o.side;
          const Icon = o.dir === "up" ? ArrowUp : ArrowDown;
          return (
            <button
              key={o.side}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onChange(o.value);
                playSelectPop({ muted });
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border py-6",
                "transition-[transform,background-color,border-color,opacity] duration-200 ease-out",
                "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                active
                  ? "border-white/40 bg-white/20 tag-pop"
                  : picked !== null
                    ? "border-white/12 bg-white/5 opacity-70"
                    : "border-white/15 bg-white/10",
              )}
            >
              <Icon
                size={26}
                strokeWidth={2.25}
                aria-hidden
                className={o.side === "pos" ? "text-secondary-green" : "text-alert-orange"}
              />
              <span className={cn("text-base", active ? "text-white font-medium" : "text-white/85")}>
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── One at a time ───────────────────────────────────────────────────────────
// The same binary input, but only one question is ever on screen: answering
// mood cascades straight to stress, and the pair collapses to a confirmed
// summary. Two taps, no scanning, nothing to scroll past.

function OneAtATime({ values }: { values: ReflectionValues }) {
  const muted = usePrototypeMute();
  const step = !values.moodTouched ? 0 : !values.stressTouched ? 1 : 2;

  const celebrated = useRef(false);
  useEffect(() => {
    if (step < 2 || celebrated.current) return;
    celebrated.current = true;
    playCompleteSwell({ muted });
  }, [step, muted]);

  if (step === 2) {
    return (
      <div className="flex flex-col items-center gap-3 yuna-rise">
        <Badge icon size="md" label="Check-in saved" />
        <p className="font-display text-2xl leading-tight text-white text-center">
          {values.mood > 0 ? "Mood better" : "Mood worse"},{" "}
          {values.stress > 0 ? "stress lighter" : "stress heavier"}
        </p>
        <p className="text-base text-white/75">Saved to your check-ins.</p>
      </div>
    );
  }

  const q = BINARY[step];
  return (
    <div className="flex flex-col gap-4">
      {/* Keyed on the step so each question cascades in as the last one leaves. */}
      <div key={q.key} className="survey-cascade-item">
        <BinaryRow
          q={q}
          value={null}
          onChange={q.key === "mood" ? values.onMoodChange : values.onStressChange}
        />
      </div>
      <p className="text-center text-sm font-medium text-white/75">{step + 1} of 2</p>
    </div>
  );
}
