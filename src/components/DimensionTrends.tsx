import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Minus, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Surface } from "@/components/Surface";
import { Button } from "@/components/Button";
import { Divider } from "@/components/Divider";
import { Accordion } from "@/components/Accordion";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { getQuestionnaireResult } from "@/lib/questionnaire-state";
import {
  TRACKABLE_IDS,
  dimensionTrend,
  getDimension,
  latestMeasurement,
  wellbeingIndex,
  type Dimension,
  type Measurement,
} from "@/lib/progress-data";

// ─── Dimension trends ───────────────────────────────────────────────────────
// The "ALL TRENDS" block shared by the Track-your-progress dashboard and the You
// tab: the life dimensions the user is tracking, each an expandable trend row,
// plus an "add another" affordance. Owns the tracked-dimension state so the
// optional wellbeing index stays in sync as dimensions are added.

type Cluster = "dark" | "light";
type Nav = ReturnType<typeof useNavigate>;

// Stand-in for a real per-measure flow: every "add" / "take it" routes into the
// working questionnaire. A production build would deep-link the right instrument.
export const startMeasure = (navigate: Nav) =>
  navigate({ to: "/questionnaire/$id", params: { id: "your-starting-point" } });

// Fisher–Yates pick of n distinct items — used to seed a fresh set of dimensions
// when a returning user arrives without having completed the starting point.
function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function DimensionTrends({
  surface,
  navigate,
  showIndex = false,
  label,
}: {
  surface: Cluster;
  navigate: Nav;
  /** Render the wellbeing-index summary card above the trend list. */
  showIndex?: boolean;
  /** Optional divider label above the list (omit when a section heading sits above). */
  label?: string;
}) {
  // Which life dimensions to show. SSR-safe deterministic seed (first three);
  // after mount we swap in the three the user actually chose in "Your starting
  // point" this session, or — if they jumped here from the admin toggles — a
  // random three. (Session results are client-only, so this must run post-mount
  // to keep the server and first client render in agreement.)
  const [tracked, setTracked] = useState<string[]>(() => TRACKABLE_IDS.slice(0, 3));
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  // Dimensions added this session start with no baseline — they show an empty
  // trend card until the user takes a first measurement, and don't yet count
  // toward the wellbeing index.
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const chosen = (getQuestionnaireResult("your-starting-point")?.priorities ?? []).filter((id) =>
      TRACKABLE_IDS.includes(id),
    );
    setTracked(chosen.length ? chosen.slice(0, 3) : pickRandom(TRACKABLE_IDS, 3));
  }, []);

  const dims = tracked.map(getDimension).filter(Boolean) as Dimension[];
  const index = wellbeingIndex(dims.filter((d) => !freshIds.has(d.id)));
  const available = TRACKABLE_IDS.filter((id) => !tracked.includes(id));

  const addDimension = (id: string) => {
    setTracked((t) => [...t, id]);
    setFreshIds((f) => new Set(f).add(id));
    setAddOpen(false);
    setOpenId(id);
  };

  return (
    <>
      {showIndex && (
        <Surface className="px-5 py-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                Wellbeing index
              </p>
              <p className="mt-1 text-sm text-white/75">{index.tracked} dimensions tracked</p>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="flex items-baseline gap-1">
                <span className="font-display text-5xl leading-none tabular-nums text-white">
                  {index.score}
                </span>
                <span className="font-display text-lg leading-none text-white/45">/100</span>
              </span>
              <IndexDelta delta={index.delta} />
            </div>
          </div>
        </Surface>
      )}

      <section className="flex flex-col gap-4">
        {label && <Divider surface={surface} label={label} />}
        <ul className="flex flex-col gap-3">
          {dims.map((d) => (
            <li key={d.id}>
              <DimensionRow
                d={d}
                surface={surface}
                navigate={navigate}
                fresh={freshIds.has(d.id)}
                open={openId === d.id}
                onOpenChange={(o) => setOpenId(o ? d.id : null)}
              />
            </li>
          ))}
        </ul>
        {available.length > 0 && (
          <Button surface={surface} variant="secondary" fullWidth onClick={() => setAddOpen(true)}>
            <Plus strokeWidth={2} aria-hidden />
            Add another dimension
          </Button>
        )}
      </section>

      <AddDimensionDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        surface={surface}
        available={available}
        onAdd={addDimension}
      />
    </>
  );
}

// The composite delta next to the index number: arrow + signed points, green up,
// amber down, neutral when flat. Arrow carries direction, not color alone.
function IndexDelta({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-sm font-medium text-white/55">no change</span>;
  const up = delta > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={
        "inline-flex items-center gap-1 text-base font-semibold tabular-nums " +
        (up ? "text-secondary-green" : "text-alert-orange")
      }
    >
      <Icon size={16} strokeWidth={2.25} aria-hidden />
      {up ? "+" : "−"}
      {Math.abs(delta)}
    </span>
  );
}

// A dimension's expandable trend row. Collapsed: emoji + label, recency, the
// latest score out of 100, and a trend chip. Expanded: the full trend line, a
// one-line summary, and add / history actions. A freshly-added dimension has no
// baseline yet, so it shows an empty card prompting a first measurement.
function DimensionRow({
  d,
  surface,
  navigate,
  fresh,
  open,
  onOpenChange,
}: {
  d: Dimension;
  surface: Cluster;
  navigate: Nav;
  fresh: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const trend = fresh ? null : dimensionTrend(d);
  const last = fresh ? null : latestMeasurement(d);

  return (
    <Surface className="overflow-hidden p-0">
      <Accordion
        surface={surface}
        open={open}
        onOpenChange={onOpenChange}
        triggerLabel={
          fresh
            ? `${d.label}, no baseline yet — tap to expand`
            : `${d.label}, ${trendDescription(trend)} — tap to expand`
        }
        header={
          <span className="flex-1 min-w-0 flex items-center gap-3">
            <span className="text-2xl leading-none shrink-0" aria-hidden>
              {d.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg leading-tight text-white">{d.label}</span>
              <span className="block text-xs text-white/55 truncate">
                {fresh ? "No baseline yet" : d.lastMeasured}
              </span>
            </span>
            <span className="shrink-0">
              <CompactTrend trend={trend} />
            </span>
          </span>
        }
      >
        {fresh ? (
          <div className="px-4 pb-4 pt-1">
            <p className="text-sm leading-snug text-white/75">
              No measurements yet. Take a short baseline to start tracking this trend.
            </p>
            <Button
              surface={surface}
              variant="primary"
              fullWidth
              size="sm"
              className="mt-4"
              onClick={() => startMeasure(navigate)}
            >
              Set baseline
            </Button>
          </div>
        ) : (
          <div className="px-4 pb-4 pt-1">
            <Sparkline history={d.history} dir={trend?.dir ?? "flat"} className="h-24" />
            <p className="mt-3 flex flex-wrap items-center gap-x-1 text-sm text-white/75">
              <CompactTrend trend={trend} inline />
              {last && <span className="text-white/55">· last measured {d.lastMeasured}</span>}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Button
                surface={surface}
                variant="primary"
                fullWidth
                size="sm"
                // Intentionally inert in the prototype — kept visible but does
                // nothing (no per-measure capture flow yet).
                onClick={() => {}}
              >
                Add measurement
              </Button>
              <Button
                surface={surface}
                variant="secondary"
                size="sm"
                onClick={() =>
                  navigate({ to: "/assessment/$id", params: { id: d.assessmentId ?? d.id } })
                }
              >
                History
              </Button>
            </div>
          </div>
        )}
      </Accordion>
    </Surface>
  );
}

// Screen-reader phrasing for a row's trend, since the visible chip is the only
// indicator now that the raw score is gone.
function trendDescription(trend: ReturnType<typeof dimensionTrend>): string {
  if (!trend) return "new, no trend yet";
  if (trend.dir === "flat") return "holding steady";
  return `trending ${trend.dir} ${trend.pct} percent`;
}

// A signed-percent trend chip. `inline` form drops the leading icon for use in a
// sentence; the standalone form is the compact right-aligned chip on the row.
function CompactTrend({
  trend,
  inline = false,
}: {
  trend: ReturnType<typeof dimensionTrend>;
  inline?: boolean;
}) {
  // The standalone chip carries the row on its own now that the raw score is
  // gone, so it sits a step larger than the inline (in-sentence) form.
  const textSize = inline ? "text-sm" : "text-base";
  const iconSize = inline ? 15 : 18;
  if (!trend) return <span className={`${textSize} text-white/55`}>New</span>;
  if (trend.dir === "flat")
    return (
      <span className={`inline-flex items-center gap-1 ${textSize} font-medium text-white/70`}>
        {!inline && <Minus size={iconSize} strokeWidth={2.25} aria-hidden />}
        Steady
        {inline && <span className="font-normal text-white/55"> since {trend.sinceLong}</span>}
      </span>
    );
  const up = trend.dir === "up";
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={
        "inline-flex items-center gap-1 font-semibold tabular-nums " +
        textSize +
        " " +
        (up ? "text-secondary-green" : "text-alert-orange")
      }
    >
      <Icon size={iconSize} strokeWidth={2.25} aria-hidden />
      {up ? "+" : "−"}
      {trend.pct}%
      {inline && <span className="font-normal text-white/55"> since {trend.sinceLong}</span>}
    </span>
  );
}

// Per-dimension trend line on the shared 0–100 wellness axis. preserveAspect
// "none" lets it fill any width; non-scaling-stroke keeps the line crisp under
// the stretch. Color is the sentiment token, applied via `color` so the line +
// area fill both inherit it.
function Sparkline({
  history,
  dir,
  className,
}: {
  history: Measurement[];
  dir: "up" | "down" | "flat";
  className?: string;
}) {
  const W = 100;
  const H = 40;
  const pad = 5;
  const n = history.length;
  const x = (i: number) => (n <= 1 ? W / 2 : pad + (i * (W - pad * 2)) / (n - 1));
  const y = (s: number) => pad + (1 - s / 100) * (H - pad * 2);
  const pts = history.map((p, i) => [x(i), y(p.score)] as const);
  const line = "M " + pts.map(([px, py]) => `${px},${py}`).join(" L ");
  const area =
    `M ${x(0)},${H - pad} ` + pts.map(([px, py]) => `L ${px},${py}`).join(" ") + ` L ${x(n - 1)},${H - pad} Z`;
  const color =
    dir === "down" ? "var(--alert-orange)" : dir === "up" ? "var(--secondary-green)" : "var(--neutral)";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={"w-full " + (className ?? "h-10")}
      style={{ color }}
      aria-hidden
    >
      <path d={area} fill="currentColor" fillOpacity={0.13} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function AddDimensionDrawer({
  open,
  onOpenChange,
  surface,
  available,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surface: Cluster;
  available: string[];
  onAdd: (id: string) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="px-6 pt-8 pb-8">
          <DrawerTitle>Add a dimension</DrawerTitle>
          <p className="mt-2 text-sm leading-snug text-white/70">
            Choose something else to start tracking. Each one begins with a short baseline.
          </p>
          <ul className="mt-6 flex flex-col gap-2.5 max-h-[46vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {available.map((id) => {
              const d = getDimension(id);
              if (!d) return null;
              return (
                <li key={id}>
                  <Button surface={surface} variant="card" fullWidth onClick={() => onAdd(id)}>
                    <span className="inline-flex items-center gap-2.5">
                      <span className="text-xl leading-none" aria-hidden>
                        {d.emoji}
                      </span>
                      {d.label}
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
