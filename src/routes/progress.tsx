import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { ScreenChrome } from "@/components/ScreenChrome";
import { PAST_SESSIONS, type PastSession } from "@/lib/sessions";
import { useUserType } from "@/lib/user-type";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — Yuna" }] }),
  component: ProgressRoute,
});

type Assessment = {
  id: string;
  title: string;
  // Levels listed top-to-bottom as they appear on the chart's Y-axis.
  levels: string[];
  // 0..1 where 1 = top of chart (first level), 0 = bottom (last level).
  data: number[];
  accent: string;
  copy: string;
  emptyCopy: string;
};

const ASSESSMENTS: Assessment[] = [
  {
    id: "self-esteem",
    title: "Self-esteem",
    levels: ["High", "Average", "Low"],
    data: [0.1, 0.3, 0.5, 0.4, 0.7, 0.85, 0.95],
    accent: "#9BC97B",
    copy: "Trending up over the past month — steadiest after your morning sessions.",
    emptyCopy: "Capture how you feel today so Yuna can track how it shifts.",
  },
  {
    id: "anxiety",
    title: "Anxiety",
    levels: ["Severe", "Moderate", "Mild", "None"],
    data: [0.85, 0.9, 0.7, 0.55, 0.4, 0.35, 0.25],
    accent: "#C5B0E5",
    copy: "Easing gently — moved from severe into the mild range this past month.",
    emptyCopy: "Capture a baseline so Yuna can notice when things lift or weigh on you.",
  },
  {
    id: "depression",
    title: "Depression",
    levels: ["Severe", "Major", "Moderate", "Mild", "None"],
    data: [0.55, 0.7, 0.4, 0.55, 0.85, 0.6, 0.4],
    accent: "#8FBCE0",
    copy: "Holding mostly in the mild range, with one heavier stretch around May 4.",
    emptyCopy: "Capture a baseline so Yuna can notice when low moods come and go.",
  },
];

const EMOTIONS: { label: string; level: 1 | 2 | 3 }[] = [
  { label: "Hopeful", level: 3 },
  { label: "Anxious", level: 2 },
  { label: "Calm", level: 3 },
  { label: "Overwhelmed", level: 1 },
  { label: "Grateful", level: 2 },
];

function ProgressRoute() {
  const userType = useUserType();
  return userType === "returning" ? <ProgressReturning /> : <ProgressNew />;
}

function ProgressReturning() {
  const navigate = useNavigate();
  const preview = PAST_SESSIONS.slice(0, 2);

  const onContinue = (s: PastSession) => {
    navigate({ to: "/chat", search: { q: s.title } });
  };

  const onAssess = (a: Assessment) => {
    navigate({ to: "/chat", search: { q: `Take my ${a.title.toLowerCase()} check-in` } });
  };

  return (
    <ScreenChrome surface="dark">
      <div className="flex-1 flex flex-col px-6 pb-6 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SectionLabel
          className="mt-4"
          action={<SectionAction to="/sessions">View all</SectionAction>}
        >
          Past sessions
        </SectionLabel>

        <ul className="mt-3 flex flex-col gap-2">
          {preview.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onContinue(s)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="yuna-rise w-full text-left rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 active:bg-white/15 transition-colors flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-white/70">
                    {s.date} · {s.length}
                  </p>
                  <p className="mt-1 text-[14px] leading-snug font-medium text-white truncate">
                    {s.title}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={1.6}
                  className="text-white/60 shrink-0"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>

        <SectionLabel
          className="mt-8"
          action={
            <SectionAction to="/emotion-trends">View trends</SectionAction>
          }
        >
          Emotions noticed lately
        </SectionLabel>
        <div className="mt-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 yuna-rise">
          <p className="text-xs leading-relaxed text-white/75">
            What Yuna has been picking up across your recent conversations.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <span
                key={e.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 h-7 text-[12px] text-white"
              >
                {e.label}
                <FrequencyDots level={e.level} />
              </span>
            ))}
          </div>
        </div>

        <SectionLabel className="mt-8">Emotional check-up</SectionLabel>
        <ul className="mt-3 flex flex-col gap-3">
          {ASSESSMENTS.map((a, i) => (
            <li key={a.id} style={{ animationDelay: `${i * 80}ms` }} className="yuna-rise">
              <AssessmentCard
                assessment={a}
                isEmpty={false}
                onAssess={() => onAssess(a)}
              />
            </li>
          ))}
        </ul>
      </div>
    </ScreenChrome>
  );
}

function ProgressNew() {
  const navigate = useNavigate();

  const onBaseline = (a: Assessment) => {
    navigate({ to: "/chat", search: { q: `Start my ${a.title.toLowerCase()} baseline` } });
  };

  const onStartChat = () => {
    navigate({ to: "/chat", search: {} });
  };

  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pt-2 pb-10 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center pt-4 text-center">
          <span
            className="h-20 w-20 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm"
            aria-hidden="true"
          />
          <h1 className="mt-5 font-display text-2xl tracking-tight text-white">
            Your progress lives here
          </h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-[20rem]">
            Past sessions, emotions Yuna notices, and your check-ins will all
            fill in here over time.
          </p>
        </div>

        <SectionLabel className="mt-8">Past sessions</SectionLabel>
        <button
          type="button"
          onClick={onStartChat}
          className="mt-3 yuna-rise w-full text-left rounded-2xl border border-dashed border-white/25 bg-white/[0.04] px-4 py-3 active:bg-white/[0.08] transition-colors flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-white/55">
              No sessions yet
            </p>
            <p className="mt-1 text-[14px] leading-snug text-white/80">
              Your first conversation will appear here.
            </p>
          </div>
          <ChevronRight
            size={16}
            strokeWidth={1.6}
            className="text-white/45 shrink-0"
            aria-hidden
          />
        </button>

        <SectionLabel className="mt-8">Emotions noticed lately</SectionLabel>
        <div className="mt-3 rounded-2xl border border-dashed border-white/25 bg-white/[0.04] p-4 yuna-rise">
          <p className="text-xs leading-relaxed text-white/65">
            As you talk with Yuna, the emotions she picks up will gather here.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <span
                key={e.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 h-7 text-[12px] text-white/45"
              >
                {e.label}
                <FrequencyDots level={0} />
              </span>
            ))}
          </div>
        </div>

        <SectionLabel className="mt-8">Emotional check-up</SectionLabel>
        <ul className="mt-3 flex flex-col gap-3">
          {ASSESSMENTS.map((a, i) => (
            <li key={a.id} style={{ animationDelay: `${i * 80}ms` }} className="yuna-rise">
              <AssessmentCard
                assessment={a}
                isEmpty
                onAssess={() => onBaseline(a)}
              />
            </li>
          ))}
        </ul>
      </div>
    </ScreenChrome>
  );
}

function AssessmentCard({
  assessment,
  isEmpty,
  onAssess,
}: {
  assessment: Assessment;
  isEmpty: boolean;
  onAssess: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4">
      <p className="font-display text-[18px] leading-tight text-white">
        {assessment.title}
      </p>

      <div className="mt-3 flex gap-3">
        <div
          className="flex flex-col justify-between font-sans-ui text-[9px] tracking-[0.12em] uppercase text-white/65 py-0.5"
          style={{ height: 96 }}
        >
          {assessment.levels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <Chart
            levels={assessment.levels.length}
            data={isEmpty ? null : assessment.data}
            accent={assessment.accent}
          />
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/75 italic">
        {isEmpty ? assessment.emptyCopy : assessment.copy}
      </p>

      <button
        type="button"
        onClick={onAssess}
        className="mt-4 w-full rounded-full px-6 h-10 text-[13px] font-medium text-neutral-900 active:opacity-80 transition-opacity"
        style={{ backgroundColor: assessment.accent }}
      >
        {isEmpty ? "Set baseline" : "Take assessment"}
      </button>
    </div>
  );
}

function Chart({
  levels,
  data,
  accent,
}: {
  levels: number;
  data: number[] | null;
  accent: string;
}) {
  const rows = Array.from({ length: levels });
  // Inset the chart slightly so dots/lines don't kiss the edges.
  const pad = 4;
  const span = 100 - pad * 2;
  const valueToTop = (v: number) => pad + (1 - v) * span;

  return (
    <div className="relative w-full" style={{ height: 96 }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        {rows.map((_, i) => {
          const y = pad + (i / (levels - 1)) * span;
          return (
            <line
              key={i}
              x1={pad}
              x2={100 - pad}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="0.4"
              strokeDasharray="1.6 2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {data && data.length > 1 && (
          <path
            d={data
              .map((v, i) => {
                const x = pad + (i / (data.length - 1)) * span;
                const y = valueToTop(v);
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ")}
            fill="none"
            stroke={accent}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {data &&
        data.map((v, i) => {
          const left = pad + (i / (data.length - 1)) * span;
          const top = valueToTop(v);
          return (
            <span
              key={i}
              aria-hidden
              className="absolute rounded-full"
              style={{
                width: 7,
                height: 7,
                left: `${left}%`,
                top: `${top}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: accent,
              }}
            />
          );
        })}
    </div>
  );
}

function FrequencyDots({ level }: { level: 0 | 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className="h-1 w-1 rounded-full"
          style={{
            backgroundColor: i <= level ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
          }}
        />
      ))}
    </span>
  );
}

function SectionLabel({
  children,
  action,
  className = "",
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const labelText = (
    <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/65">
      {children}
    </p>
  );
  if (!action) {
    return (
      <p
        className={
          "font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/65 " +
          className
        }
      >
        {children}
      </p>
    );
  }
  return (
    <div className={"flex items-center justify-between gap-3 " + className}>
      {labelText}
      {action}
    </div>
  );
}

function SectionAction({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-0.5 text-[11px] text-white/70 active:text-white"
    >
      {children}
      <ChevronRight size={12} strokeWidth={1.75} aria-hidden />
    </Link>
  );
}
