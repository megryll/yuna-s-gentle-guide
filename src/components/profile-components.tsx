import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/Button";
import { Accordion } from "@/components/Accordion";
import { Badge } from "@/components/Badge";
import type { Insight } from "@/lib/profile-data";
import { useAppMode } from "@/lib/theme-prefs";
import { YunaAvatar } from "@/components/YunaAvatar";
import { DEFAULT_VOICE } from "@/lib/voices";
import { useYunaIdentity } from "@/lib/yuna-session";

// Brand greens, both tokenised: GREEN = --primary-green, GREEN_ACCENT =
// --secondary-green. Alpha tints go through greenMix() rather than a hex-alpha
// suffix, since a var() can't be concatenated with one. RING_MINT is the brand
// green lightened toward white for legibility on the dark photo (dark-mode
// progress ring + empty-state heading; light mode uses the green directly) —
// a tint of --secondary-green, not a separate color.
const GREEN = "var(--primary-green)";
const GREEN_ACCENT = "var(--secondary-green)";
const RING_MINT = "color-mix(in srgb, var(--secondary-green) 32%, white)";
const greenMix = (pct: number) =>
  `color-mix(in srgb, var(--secondary-green) ${pct}%, transparent)`;

// ─── Progress ring ─────────────────────────────────────────────────────────

export function ProgressRing({
  progress,
  icon,
}: {
  progress: number;
  icon: string;
}) {
  const r = 43;
  const cx = 46;
  const cy = 46;
  const circumference = 2 * Math.PI * r;
  const target = circumference * (1 - progress);

  const [offset, setOffset] = useState(circumference);
  useEffect(() => {
    const id = window.setTimeout(() => setOffset(target), 80);
    return () => window.clearTimeout(id);
  }, [target]);

  // Light mode swaps the pale mint stroke for the forest green used on the
  // insight left-accent — keeps the ring legible on the light photo bg and
  // visually ties it to the same accent family. The background track also
  // shifts to fully opaque white so the unfilled portion reads as a clean
  // ring rather than barely-visible-on-light tinted glass.
  const mode = useAppMode();
  const isLight = mode === "light";
  const ringStroke = isLight ? GREEN_ACCENT : RING_MINT;
  const trackStroke = isLight ? "#ffffff" : "rgba(255,255,255,0.18)";

  return (
    <div className="relative" style={{ width: 89, height: 89 }}>
      <svg viewBox="0 0 92 92" width={89} height={89} className="absolute inset-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackStroke} strokeWidth={3} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={ringStroke}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: `stroke-dashoffset ${progress >= 1 ? 1.5 : 0.8}s ease-out` }}
        />
      </svg>
      <img
        src={icon}
        alt=""
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain"
        style={{ width: 52, height: 52 }}
      />
    </div>
  );
}

// ─── Focus Area bento card ────────────────────────────────────────────────

export function FocusAreaBentoCard({
  num,
  title,
  taskCount,
}: {
  num: 1 | 2;
  title: string;
  taskCount: number;
}) {
  const mode = useAppMode();
  const isLight = mode === "light";
  const cardBg = isLight ? "bg-white/[0.55]" : "bg-white/[0.06]";
  return (
    <Link
      to="/focus-area/$num"
      params={{ num: String(num) }}
      className={`relative flex-1 min-w-0 rounded-2xl overflow-hidden flex flex-col text-left border border-white/15 ${cardBg} backdrop-blur-md active:opacity-90 transition-opacity`}
      style={{ minHeight: 168 }}
    >
      <span
        aria-hidden
        className="absolute font-display font-semibold select-none pointer-events-none"
        style={{
          top: -14,
          right: -6,
          fontSize: 96,
          lineHeight: 1,
          color: isLight
            ? "color-mix(in srgb, var(--primary-green) 8%, transparent)"
            : "rgba(255,255,255,0.07)",
          fontVariationSettings: "'SOFT' 0, 'WONK' 0",
        }}
      >
        0{num}
      </span>
      <div className="relative flex-1 flex flex-col justify-between p-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.2em] uppercase text-white/75">
            Focus Area {num}
          </span>
          <span
            className="font-display font-semibold text-white"
            style={{ fontSize: 16, lineHeight: "24px", fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}
          >
            {title}
          </span>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs leading-[18px] text-white/75">{taskCount} tasks</span>
          <ArrowRight size={14} strokeWidth={1.5} className="text-white/60" aria-hidden />
        </div>
      </div>
    </Link>
  );
}

// ─── Insight card (expandable) ─────────────────────────────────────────────

export function InsightCard({
  insight,
  accentLeft = false,
}: {
  insight: Insight;
  accentLeft?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { emoji, title, desc, meaning, yunaQuote, date } = insight;
  const mode = useAppMode();
  const isLight = mode === "light";
  const cardBg = isLight ? "bg-white/[0.55]" : "bg-white/[0.06]";
  const { avatar } = useYunaIdentity();

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-white/15 ${cardBg} backdrop-blur-md`}
      style={accentLeft ? { borderLeft: `3px solid ${GREEN_ACCENT}` } : undefined}
    >
      <Accordion
        open={expanded}
        onOpenChange={setExpanded}
        triggerLabel={title}
        header={
          <>
            <span
              className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center bg-white/10"
              aria-hidden
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{emoji}</span>
            </span>
            <span className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-sm font-medium leading-[22px] text-white truncate">{title}</span>
              {date && <Badge className="shrink-0">{date}</Badge>}
            </span>
          </>
        }
      >
        <div className="flex flex-col gap-4 px-4 pb-6">
          <span aria-hidden className="h-px bg-white/12" />
          <p className="text-sm leading-[22px] text-white/85">{desc}</p>

          {meaning.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-uppercase font-semibold tracking-[0.08em] uppercase text-white/75">
                What this might mean
              </p>
              <ul className="flex flex-col gap-2">
                {meaning.map((item, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span
                      aria-hidden
                      className="mt-2 h-1 w-1 rounded-full shrink-0"
                      style={{ backgroundColor: GREEN_ACCENT }}
                    />
                    <span className="text-sm leading-[22px] text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {yunaQuote && (
            <div
              className="rounded-2xl flex gap-2.5 items-start"
              style={{
                background: greenMix(10),
                borderLeft: `3px solid ${GREEN_ACCENT}`,
                padding: "16px 16px 16px 19px",
              }}
            >
              <span
                aria-hidden
                className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-white/10 shrink-0"
              >
                <YunaAvatar variant={avatar ?? DEFAULT_VOICE} size={40} />
              </span>
              <p
                className="font-display italic m-0 text-white/95"
                style={{ fontSize: 14, lineHeight: "22px", fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}
              >
                {yunaQuote}
              </p>
            </div>
          )}
        </div>
      </Accordion>
    </div>
  );
}

// ─── More button ──────────────────────────────────────────────────────────

export function MoreButton({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <Button
      surface="dark"
      variant="secondary"
      fullWidth
      type="button"
      onClick={onClick}
      className="gap-2.5 px-5 py-2.5"
    >
      <span className="text-uppercase font-bold tracking-[0.08em] uppercase text-white/75">
        +{count} more
      </span>
      <ArrowRight size={14} strokeWidth={1.5} className="text-white/60" aria-hidden />
    </Button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

export function EmptyStateCard({
  heading,
  body,
  leafSrc,
}: {
  heading: string;
  body: string;
  leafSrc: string;
}) {
  const mode = useAppMode();
  const isLight = mode === "light";
  return (
    <div
      className="relative rounded-2xl overflow-hidden backdrop-blur-md flex flex-col items-center gap-2 p-4"
      style={{ backgroundColor: greenMix(8) }}
    >
      <p
        className="text-uppercase font-bold tracking-[0.06em] uppercase text-center"
        style={{ color: isLight ? GREEN : RING_MINT }}
      >
        {heading}
      </p>
      <p className="text-xs leading-[18px] text-white/80 text-center max-w-[16rem]">{body}</p>
      <img
        src={leafSrc}
        alt=""
        className="absolute pointer-events-none"
        style={{ bottom: -18, left: -14, width: 120, height: 120, opacity: 0.5 }}
      />
    </div>
  );
}
