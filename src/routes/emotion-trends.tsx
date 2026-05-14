import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/emotion-trends")({
  head: () => ({ meta: [{ title: "Emotions over time — Yuna" }] }),
  component: EmotionTrendsRoute,
});

type EmotionTrend = {
  label: string;
  // Weekly mentions across the last 8 weeks.
  values: number[];
  // Total mentions across the window.
  count: number;
  // One-line summary of the trend, written warmly.
  caption: string;
};

const TRENDS: EmotionTrend[] = [
  {
    label: "Hopeful",
    values: [1, 2, 2, 3, 4, 5, 6, 7],
    count: 30,
    caption: "Steadily growing — your evenings have been lighter lately.",
  },
  {
    label: "Calm",
    values: [2, 3, 3, 4, 5, 5, 6, 7],
    count: 35,
    caption: "Showing up more often, especially after walks and breath work.",
  },
  {
    label: "Grateful",
    values: [3, 4, 3, 4, 5, 4, 5, 5],
    count: 33,
    caption: "Steady — a quiet thread through your weeks.",
  },
  {
    label: "Anxious",
    values: [6, 5, 6, 4, 3, 3, 2, 2],
    count: 31,
    caption: "Easing — about half what it was a month ago.",
  },
  {
    label: "Overwhelmed",
    values: [4, 5, 3, 4, 2, 2, 1, 1],
    count: 22,
    caption: "Settling — fewer heavy moments week over week.",
  },
  {
    label: "Frustrated",
    values: [3, 2, 3, 2, 2, 1, 1, 1],
    count: 15,
    caption: "Cooling — sharper in late April, softer since.",
  },
];

function EmotionTrendsRoute() {
  const navigate = useNavigate();

  return (
    <ScreenChrome hideHeader surface="dark">
      <header className="grid grid-cols-3 items-center px-5 pb-2 shrink-0">
        <div className="justify-self-start">
          <Button
            surface="dark"
            variant="ghost"
            size="icon-lg"
            onClick={() => navigate({ to: "/progress" })}
            aria-label="Back to Progress"
          >
            <ChevronLeft size={22} strokeWidth={1.6} aria-hidden />
          </Button>
        </div>
        <div className="justify-self-center" />
        <div className="justify-self-end" />
      </header>

      <div className="flex-1 flex flex-col px-6 pb-6 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <h1 className="font-display text-[26px] leading-tight tracking-tight text-white">
          Emotions over time
        </h1>
        <p className="mt-2 text-sm text-white/75 leading-relaxed">
          How often each feeling has come up across your sessions in the last
          eight weeks.
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {TRENDS.map((t, i) => (
            <li key={t.label} style={{ animationDelay: `${i * 60}ms` }} className="yuna-rise">
              <TrendCard trend={t} />
            </li>
          ))}
        </ul>
      </div>
    </ScreenChrome>
  );
}

function TrendCard({ trend }: { trend: EmotionTrend }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-display text-[17px] leading-tight text-white">
          {trend.label}
        </p>
        <p className="mt-1 font-sans-ui text-[10px] tracking-[0.18em] uppercase text-white/65">
          {trend.count} this window
        </p>
        <p className="mt-2 text-[12px] leading-snug text-white/75 italic">
          {trend.caption}
        </p>
      </div>
      <Sparkline values={trend.values} />
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const lastVal = values[values.length - 1];
  const lastY = (1 - (lastVal - min) / range) * 92 + 4;
  const accent = "rgba(255,255,255,0.9)";

  return (
    <div
      className="relative shrink-0"
      style={{ width: 96, height: 56 }}
      aria-hidden
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <path
          d={values
            .map((v, i) => {
              const x = (i / (values.length - 1)) * 100;
              const y = (1 - (v - min) / range) * 92 + 4;
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ")}
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute rounded-full"
        style={{
          width: 6,
          height: 6,
          left: "100%",
          top: `${lastY}%`,
          transform: "translate(-100%, -50%)",
          backgroundColor: accent,
        }}
      />
    </div>
  );
}
