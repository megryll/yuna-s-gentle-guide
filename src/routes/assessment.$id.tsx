import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { YunaExplains } from "@/components/YunaExplains";
import { useAppMode } from "@/lib/theme-prefs";
import { usePrototypeMute } from "@/lib/prototype-mute";
import { playSelectPop } from "@/lib/survey-sound";
import {
  type Assessment,
  assessmentDelta,
  bandConcernRank,
  bandFor,
  getAssessmentOrDimension,
} from "@/lib/assessment-data";
import { cn } from "@/lib/utils";

// ─── Assessment history detail (validated instruments) ───────────────────────
// The completed-survey view: one validated instrument, every administration on
// its real scale, severity bands as the background geography. Scores are only
// comparable within an instrument, so it's always one instrument per view. The
// chart reveals itself on entry — bands settle, the area grows, the guide line
// draws, dots pop along it — then a dot can be tapped to inspect it. Demo data
// is static (see lib/assessment-data.ts).

export const Route = createFileRoute("/assessment/$id")({
  head: () => ({ meta: [{ title: "Check-in — Yuna" }] }),
  component: AssessmentDetailRoute,
});

// Deeper geography for the more concerning bands; transparent floor. Keyed per
// surface — arbitrary alphas (Surface's own approach) since `.theme-light`
// doesn't remap background classes. Indexed by concern rank (0 = darkest).
const BAND_FILLS = {
  dark: [
    "bg-white/[0.12]",
    "bg-white/[0.08]",
    "bg-white/[0.05]",
    "bg-white/[0.025]",
    "bg-transparent",
  ],
  light: [
    "bg-[rgba(20,20,22,0.10)]",
    "bg-[rgba(20,20,22,0.065)]",
    "bg-[rgba(20,20,22,0.04)]",
    "bg-[rgba(20,20,22,0.02)]",
    "bg-transparent",
  ],
};

function AssessmentDetailRoute() {
  const { id } = Route.useParams();
  const assessment = getAssessmentOrDimension(id);
  const router = useRouter();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const muted = usePrototypeMute();
  const onBack = () =>
    router.history.canGoBack() ? router.history.back() : router.navigate({ to: "/you" });

  if (!assessment) {
    return (
      <PhoneFrame themed>
        <div className="flex-1 flex flex-col min-h-0 text-white">
          <PageHeader surface={surface} onBack={onBack} title="Check-in" />
          <p className="px-6 mt-6 text-sm text-white/75">That check-in isn't available.</p>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <AssessmentDetail assessment={assessment} surface={surface} muted={muted} onBack={onBack} />
  );
}

function AssessmentDetail({
  assessment: a,
  surface,
  muted,
  onBack,
}: {
  assessment: Assessment;
  surface: "dark" | "light";
  muted: boolean;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState(a.history.length - 1);
  const entry = a.history[selected];

  // Custom dimensions ride a synthesized 0–100 wellness scale whose raw number
  // is meaningless, so they lead with the band + trend rather than a score.
  // Validated instruments (PHQ-9, GAD-7, …) keep their real, interpretable score.
  const isDimension = !a.questionCount;

  // Next recommended check-in date (read-only display).
  const nextOn = a.nextOn;

  // Chart geometry, in percentages of the plot area. Y runs top-down from the
  // max score; X spreads administrations evenly with edge padding.
  const yPct = (score: number) => (1 - score / a.max) * 100;
  const xPct = (i: number) =>
    a.history.length === 1 ? 50 : 15 + (i * 70) / (a.history.length - 1);

  const linePoints = a.history.map((h, i) => `${xPct(i)},${yPct(h.score)}`).join(" ");
  // Area polygon: the line, then down the right edge to the baseline and back.
  const areaPoints = `${linePoints} ${xPct(a.history.length - 1)},100 ${xPct(0)},100`;

  // Dots pop in left-to-right after the chart fades in, so the eye tracks along
  // the trend.
  const dotDelay = (i: number) =>
    a.history.length === 1 ? 320 : 320 + (i * 760) / (a.history.length - 1);

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0 text-white">
        <PageHeader surface={surface} onBack={onBack} title={`${a.domain} check-in`} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-2 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="text-center text-xs font-semibold tracking-[0.12em] uppercase text-white/75">
            {a.instrument}
            {a.questionCount ? ` · ${a.questionCount} questions · ${a.durationLabel}` : ""}
          </p>

          {/* The selected administration's score, on the instrument's real
              scale, with the range it landed in and the change since last time. */}
          <section className="mt-6 flex flex-col items-center text-center">
            {isDimension ? (
              <>
                <span
                  key={selected}
                  className="survey-numeral-pop font-display text-4xl leading-tight text-white"
                >
                  {bandFor(a, entry.score).label}
                </span>
                <p className="mt-2 text-sm text-white/85">{assessmentDelta(a.history, selected)}</p>
              </>
            ) : (
              <>
                <span
                  key={selected}
                  className="survey-numeral-pop font-display text-6xl tabular-nums text-white"
                >
                  {entry.score}
                </span>
                <span className="mt-1 text-xs text-white/60">out of {a.max}</span>
                <p className="mt-2 text-sm text-white/85">
                  {bandFor(a, entry.score).label} range · {assessmentDelta(a.history, selected)}
                </p>
              </>
            )}
          </section>

          {/* Full-bleed: the chart breaks out of the px-6 gutter to span the
              screen, sitting directly on the photo rather than in a panel. */}
          <div className="-mx-6 mt-6 overflow-hidden pb-3">
            <div className="relative h-44">
              {/* Severity bands: the background geography that gives a score
                  its meaning. Crossing a border is the headline event. */}
              {a.bands.map((b, i) => (
                <div
                  key={b.label}
                  className={cn(
                    "survey-band-in absolute inset-x-0 border-t border-white/10",
                    i === 0 && "border-t-0",
                    BAND_FILLS[surface][
                      Math.min(bandConcernRank(a, i), BAND_FILLS[surface].length - 1)
                    ],
                  )}
                  style={{
                    top: `${yPct(b.to)}%`,
                    height: `${yPct(b.from) - yPct(b.to)}%`,
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  <span className="absolute right-2 top-1 text-[10px] font-medium tracking-[0.12em] uppercase text-white/60">
                    {b.label}
                  </span>
                </div>
              ))}

              {/* Soft area fill + guide line, faded in together. Dots are the
                  data; the line is a guide for the eye. non-scaling-stroke keeps
                  it hairline under the non-uniform viewBox stretch. */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="survey-chart-in absolute inset-0 h-full w-full"
              >
                <defs>
                  <linearGradient id={`area-${a.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--secondary-green)" stopOpacity="0.34" />
                    <stop offset="100%" stopColor="var(--secondary-green)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={areaPoints} fill={`url(#area-${a.id})`} />
                <polyline
                  className="text-secondary-green"
                  points={linePoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* One dot per administration; tap to inspect it. Dots ride a div
                  overlay (percentage coords) so the stretched svg can't squash
                  them. */}
              {a.history.map((h, i) => {
                const isSelected = i === selected;
                return (
                  <button
                    key={h.date}
                    type="button"
                    aria-label={`${h.longDate}: scored ${h.score}, ${bandFor(a, h.score).label.toLowerCase()} range`}
                    aria-pressed={isSelected}
                    onClick={() => {
                      if (i !== selected) playSelectPop({ muted });
                      setSelected(i);
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 p-3"
                    style={{ left: `${xPct(i)}%`, top: `${yPct(h.score)}%` }}
                  >
                    {!isDimension && (
                      <span
                        className={cn(
                          "absolute -translate-x-1/2 -translate-y-1/2 text-xs tabular-nums",
                          isSelected ? "font-semibold text-white" : "text-white/60",
                        )}
                        style={{ left: "50%", top: "-10px" }}
                      >
                        {h.score}
                      </span>
                    )}
                    <span
                      className="survey-dot-pop relative block"
                      style={{ animationDelay: `${dotDelay(i)}ms` }}
                    >
                      {isSelected && (
                        <span className="absolute -inset-1.5 rounded-full bg-secondary-green/25" />
                      )}
                      <span
                        className={cn(
                          "relative block rounded-full bg-secondary-green transition-all",
                          isSelected ? "h-3 w-3" : "h-2 w-2",
                        )}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative mt-1 h-4">
              {a.history.map((h, i) => (
                <span
                  key={h.date}
                  className={cn(
                    "absolute -translate-x-1/2 text-xs",
                    i === selected ? "font-medium text-white/85" : "text-white/60",
                  )}
                  style={{ left: `${xPct(i)}%` }}
                >
                  {h.date}
                </span>
              ))}
            </div>
          </div>

          {/* The selected dot's date sits as the eyebrow over Yuna's read of
              the trend — one combined block, no separate provenance card. */}
          <p className="mt-6 text-xs font-semibold tracking-[0.12em] uppercase text-white/75">
            {entry.longDate} · {bandFor(a, entry.score).label} range
          </p>
          <YunaExplains surface={surface} className="mt-3">
            {a.reflection}
          </YunaExplains>

          {/* The next recommended check-in. Validated instruments carry an
              authored date; custom dimensions get Yuna's regular check-in rhythm. */}
          {nextOn && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/75">
              <CalendarClock size={15} strokeWidth={1.75} className="text-white/60" aria-hidden />
              <span>Recommended again on {nextOn}</span>
            </div>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
