import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { MessageCircle, Pause, Play, X } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Confetti } from "@/components/Confetti";
import { MultipleChoice } from "@/components/MultipleChoice";
import { ProgressBar } from "@/components/ProgressBar";
import { Slider } from "@/components/Slider";
import { QuestionCard, CardLead } from "@/components/SurveyCard";
import { Tag } from "@/components/Tag";
import { useAppMode } from "@/lib/theme-prefs";
import { usePrototypeMute } from "@/lib/prototype-mute";
import { playCompleteSwell, playSelectPop, playSliderTick } from "@/lib/survey-sound";
import {
  FOCUS_AREAS,
  IMPACT_ITEM,
  branchItemsFor,
  focusAreaById,
  type BankItem,
  type LikertItem,
  type ScaleItem,
} from "@/lib/questionnaire-data";
import { setQuestionnaireResult } from "@/lib/questionnaire-state";

// ─── The "Your starting point" questionnaire flow ────────────────────────────
// Shares the survey runner's shell (/survey/$id): audio·label·close header, a
// persistent screen title, a top progress bar with a "Question N of M" counter,
// each question on a frosted QuestionCard that tilts off as the next tilts in,
// and Previous/Next navigation. The flow is bespoke (a focus picker drives a
// branch) but the chrome and interaction grammar match the generic survey.
//
// Steps: 0 focus picker · 1 work impact · 2–4 branch items (driven by the top
// priority, per BASELINE-QUESTIONNAIRE.md) · 5 completion.

const TOTAL_STEPS = 5;
const COMPLETION_STEP = 5;
const MAX_PRIORITIES = 3;

type StepSearch = { step?: number };

export const Route = createFileRoute("/questionnaire/$id")({
  validateSearch: (search: Record<string, unknown>): StepSearch => {
    const raw = search.step;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (Number.isNaN(n)) return {};
    return { step: Math.max(0, Math.min(COMPLETION_STEP, Math.floor(n))) };
  },
  head: () => ({ meta: [{ title: "Your Starting Point — Yuna" }] }),
  component: QuestionnaireRoute,
});

type Answers = Record<string, string | number>;

function QuestionnaireRoute() {
  const { id } = Route.useParams();
  const { step = 0 } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const muted = usePrototypeMute();
  const surface = useAppMode() === "light" ? "light" : "dark";

  // Focus-area ids in tap order = priority order; the top one drives the rest.
  const [focus, setFocus] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  // Prototype audio-readout toggle — swaps the icon, doesn't drive real TTS.
  const [audioOn, setAudioOn] = useState(true);

  // A direct deep link (admin sidebar) lands mid-flow with no picks; fall back
  // to the stress branch so every step renders.
  const topPriority = focus[0] ?? "stress";
  const topArea = focusAreaById(topPriority);
  const branch = branchItemsFor(topPriority);

  // Card transition: the leaving card stays mounted with its exit animation
  // while the new one enters; direction derives from the step delta. `leaving`
  // is set before paint so the incoming card animates in from the first frame.
  const prevStep = useRef(step);
  const [leaving, setLeaving] = useState<{ step: number; dir: "fwd" | "back" } | null>(null);
  useLayoutEffect(() => {
    if (step === prevStep.current) return;
    setLeaving({ step: prevStep.current, dir: step > prevStep.current ? "fwd" : "back" });
    prevStep.current = step;
  }, [step]);
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(null), 380);
    return () => clearTimeout(t);
  }, [leaving]);

  // In-flow steps replace history so the flow occupies one entry; exiting
  // returns to wherever the user came from (Home card or You) in one hop.
  const goto = (next: number) =>
    navigate({ to: "/questionnaire/$id", params: { id }, search: { step: next }, replace: true });

  const exitFlow = () =>
    router.history.canGoBack() ? router.history.back() : router.navigate({ to: "/home" });

  // Discrete picks record with a soft pop; the user advances with Next.
  const onPick = (q: LikertItem, v: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: v }));
    playSelectPop({ muted });
  };

  const onMoveScale = (q: ScaleItem, v: number) => {
    setAnswers((prev) => ({ ...prev, [q.id]: v }));
    playSliderTick({ muted });
  };

  const onToggleFocus = (next: string[]) => {
    if (next.length > MAX_PRIORITIES) return;
    if (next.length > focus.length) playSelectPop({ muted });
    setFocus(next);
  };

  // The question behind a given step index (null for picker + completion).
  const itemFor = (s: number): BankItem | null =>
    s === 1 ? IMPACT_ITEM : s >= 2 && s < COMPLETION_STEP ? branch[s - 2] : null;

  // Enough of an answer to advance: the picker needs ≥1 priority, everything
  // else needs a recorded value.
  const isStepAnswered = (s: number): boolean => {
    if (s === 0) return focus.length > 0;
    const q = itemFor(s);
    return q ? answers[q.id] !== undefined : true;
  };

  const onBack = () => {
    if (step > 0) goto(step - 1);
  };
  const onNext = () => {
    playSelectPop({ muted });
    goto(step + 1);
  };

  // Completion: record + celebrate, once, and only for a real run (a deep link
  // straight to this step has no answers — the gallery iframes every screen,
  // and previewing must not mark the questionnaire complete).
  const celebrated = useRef(false);
  const completedForReal = step === COMPLETION_STEP && Object.keys(answers).length > 0;
  useEffect(() => {
    if (!completedForReal || celebrated.current) return;
    celebrated.current = true;
    setQuestionnaireResult(id, {
      completedAt: new Date().toISOString(),
      priorities: focus,
      answers,
    });
    playCompleteSwell({ muted });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedForReal]);

  // The inner contents of a question card for a given step (null for the
  // completion step, which renders as its own pane outside the card stage).
  const renderPaneContent = (paneStep: number): ReactNode => {
    if (paneStep === 0)
      return <FocusPane surface={surface} value={focus} onToggle={onToggleFocus} />;
    const q = itemFor(paneStep);
    if (!q) return null;
    return (
      <>
        {topArea && (
          <div className="mb-3">
            <Tag
              variant="informational"
              surface={surface}
              icon={topArea.emoji && <span aria-hidden>{topArea.emoji}</span>}
            >
              {topArea.label}
            </Tag>
          </div>
        )}
        <CardLead>{q.prompt}</CardLead>
        {q.kind === "likert" ? (
          <div className="mt-5">
            <MultipleChoice
              surface={surface}
              ariaLabel={q.prompt}
              options={q.options}
              value={(answers[q.id] as string) ?? null}
              onChange={(v) => onPick(q, v)}
            />
          </div>
        ) : (
          <ScaleBody
            q={q}
            value={(answers[q.id] as number) ?? null}
            onMove={(v) => onMoveScale(q, v)}
            surface={surface}
          />
        )}
      </>
    );
  };

  const onCompletion = step === COMPLETION_STEP;
  const nextDisabled = !isStepAnswered(step);

  // The completion payoff is its own moment — no header, progress, or card.
  if (onCompletion) {
    return (
      <PhoneFrame themed>
        <div className="flex-1 flex flex-col min-h-0 text-white">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-16 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <CompletionPane />
          </div>
          <footer className="shrink-0 px-6 pb-10 pt-3">
            <Button
              surface={surface}
              variant="primary"
              fullWidth
              onClick={() => navigate({ to: "/you" })}
            >
              See your progress
            </Button>
          </footer>
          {completedForReal && <Confetti />}
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0 text-white">
        {/* Header: audio toggle · label · close. */}
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-6 pt-14 pb-1">
          <div className="justify-self-start">
            <Button
              surface={surface}
              variant="secondary"
              size="icon"
              aria-label={audioOn ? "Pause question audio" : "Play question audio"}
              onClick={() => {
                setAudioOn((v) => !v);
                playSelectPop({ muted });
              }}
            >
              {audioOn ? <Pause strokeWidth={1.5} /> : <Play strokeWidth={1.5} />}
            </Button>
          </div>
          <span className="justify-self-center inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            <MessageCircle size={15} strokeWidth={2} aria-hidden />
            Questionnaire
          </span>
          <div className="justify-self-end">
            <Button surface={surface} variant="secondary" size="icon" aria-label="Close" onClick={exitFlow}>
              <X strokeWidth={1.5} />
            </Button>
          </div>
        </header>

        {/* Persistent screen title. */}
        <div className="px-6 pt-2 text-center">
          <h1 className="font-display text-2xl leading-snug tracking-tight text-white">
            Your starting point
          </h1>
        </div>

        {/* Partial progress bar + question counter, centered as a group. */}
        <div className="flex items-center justify-center gap-3 px-6 pt-4">
          <div className="w-[42%]">
            <ProgressBar
              surface={surface}
              value={(step + 1) / TOTAL_STEPS}
              aria-label="Your starting point progress"
            />
          </div>
          <span className="text-sm text-white/75">
            Question {step + 1} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Card stage — the current card sits top-aligned; the leaving card
            overlays it during the tilt-and-slide transition. */}
        <div className="relative flex-1 min-h-0">
          <div key={step} className="absolute inset-0 flex items-start px-6 pt-5 pb-2">
            <QuestionCard
              surface={surface}
              className={leaving ? (leaving.dir === "fwd" ? "survey-card-in-fwd" : "survey-card-in-back") : ""}
            >
              {renderPaneContent(step)}
            </QuestionCard>
          </div>
          {leaving && (
            <div
              key={`leaving-${leaving.step}`}
              aria-hidden
              className="absolute inset-0 flex items-start px-6 pt-5 pb-2 pointer-events-none"
            >
              <QuestionCard
                surface={surface}
                className={leaving.dir === "fwd" ? "survey-card-out-fwd" : "survey-card-out-back"}
              >
                {renderPaneContent(leaving.step)}
              </QuestionCard>
            </div>
          )}
        </div>

        {/* Previous / Next. */}
        <footer className="flex items-center justify-between px-6 pb-10 pt-3">
          <Button surface={surface} variant="secondary" disabled={step === 0} onClick={onBack}>
            Previous
          </Button>
          <Button surface={surface} variant="primary" disabled={nextDisabled} onClick={onNext}>
            Next
          </Button>
        </footer>
      </div>
    </PhoneFrame>
  );
}

function FocusPane({
  surface,
  value,
  onToggle,
}: {
  surface: "dark" | "light";
  value: string[];
  onToggle: (next: string[]) => void;
}) {
  const atLimit = value.length >= MAX_PRIORITIES;
  return (
    <>
      <CardLead>What would you like support with right now?</CardLead>
      <p className="mt-1.5 text-sm leading-snug text-white/75">
        Pick up to 3, starting with what matters most to you.
      </p>
      <div className="mt-5">
        <MultipleChoice
          surface={surface}
          multiple
          indicator="none"
          ariaLabel="What would you like support with right now?"
          options={FOCUS_AREAS.map((a) => {
            const rank = value.indexOf(a.id);
            return {
              value: a.id,
              label: a.label,
              emoji: a.emoji,
              disabled: atLimit && rank === -1,
              trailing:
                rank >= 0 ? (
                  <Badge
                    size="sm"
                    icon={
                      <span className="text-[11px] font-bold leading-none">{rank + 1}</span>
                    }
                    label={`Priority ${rank + 1}`}
                  />
                ) : undefined,
            };
          })}
          value={value}
          onChange={onToggle}
        />
      </div>
    </>
  );
}

function ScaleBody({
  q,
  value,
  onMove,
  surface,
}: {
  q: ScaleItem;
  value: number | null;
  onMove: (v: number) => void;
  surface: "dark" | "light";
}) {
  const touched = value !== null;
  const display = value ?? Math.floor((q.points - 1) / 2);
  const frac = display / (q.points - 1);
  // The fill borrows bipolar's sentiment colors: green while the answer sits
  // on the item's positive side, orange once it crosses into the struggling
  // half (`distress` marks which end that is — direction varies per item).
  const fill: "green" | "orange" =
    touched && q.distress && (q.distress === "high" ? frac > 0.5 : frac < 0.5)
      ? "orange"
      : "green";
  // With a midLabel the live descriptor accompanies the value; otherwise the
  // hint just fades once touched.
  const descriptor = q.midLabel
    ? frac < 1 / 3
      ? q.minLabel
      : frac < 2 / 3
        ? q.midLabel
        : q.maxLabel
    : null;
  return (
    <>
      <div className="mt-8 flex flex-col items-center">
        <span
          key={display}
          className={
            "survey-numeral-pop font-display text-7xl tabular-nums " +
            (touched ? "text-white" : "text-white/60")
          }
        >
          {display}
        </span>
        <p
          className={
            "mt-2 text-sm transition-opacity duration-200 " +
            (touched
              ? descriptor
                ? "text-white/85"
                : "opacity-0"
              : "text-white/60")
          }
        >
          {touched && descriptor ? descriptor : "Slide to answer"}
        </p>
      </div>
      <div className="mt-8">
        <Slider
          variant="linear"
          surface={surface}
          stepCount={q.points}
          value={display}
          onChange={onMove}
          leftLabel={q.minLabel}
          rightLabel={q.maxLabel}
          touched={touched}
          fill={fill}
        />
      </div>
    </>
  );
}

// The completion moment: today's answers become the first point on a chart
// that future check-ins will draw — the payoff that converts completion into
// anticipation. Deep-link previews (no answers) show the same pane without
// the celebration side effects (those live in the route).
function CompletionPane() {
  return (
    <div className="flex h-full flex-col justify-center">
      <p className="text-xs font-semibold tracking-[0.12em] uppercase text-white/75 yuna-rise">
        Your starting point
      </p>
      <h1
        className="mt-3 font-display text-3xl leading-tight tracking-tight text-white yuna-rise"
        style={{ animationDelay: "80ms" }}
      >
        This is day one
      </h1>
      <p
        className="mt-3 text-sm leading-snug text-white/85 yuna-rise"
        style={{ animationDelay: "160ms" }}
      >
        Your baseline is in. Every check-in from here adds a point to your chart,
        and gives Yuna a deeper understanding of how to support you.
      </p>

      <div
        className="mt-8 rounded-2xl bg-white/8 p-4 yuna-rise"
        style={{ animationDelay: "260ms" }}
      >
        <BaselineChart />
        <div className="mt-2 flex items-center justify-between text-[10px] tracking-wide text-white/60">
          <span className="font-semibold text-white/85">Today</span>
          <span>Next check-in</span>
          <span aria-hidden />
        </div>
      </div>
    </div>
  );
}

function BaselineChart() {
  return (
    <svg viewBox="0 0 288 96" className="w-full" role="img" aria-label="Your baseline chart, starting today">
      {/* baseline rule */}
      <line x1="4" y1="88" x2="284" y2="88" className="stroke-white/15" strokeWidth="1" />
      {/* the trend future check-ins will draw — a dotted hint, fading in late */}
      <path
        d="M16 72 C 60 68, 96 52, 140 46 S 240 24, 272 18"
        fill="none"
        strokeWidth="2"
        strokeDasharray="1 7"
        strokeLinecap="round"
        className="stroke-white/45 yuna-fade-in"
        style={{ animationDelay: "700ms" }}
      />
      {/* faint future points */}
      {[
        { cx: 140, cy: 46, delay: "950ms" },
        { cx: 272, cy: 18, delay: "1100ms" },
      ].map((p) => (
        <circle
          key={p.cx}
          cx={p.cx}
          cy={p.cy}
          r="3.5"
          className="fill-white/30 yuna-fade-in"
          style={{ animationDelay: p.delay }}
        />
      ))}
      {/* today's dot lands with a spring */}
      <g
        className="survey-dot-pop"
        style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: "450ms" }}
      >
        <circle cx="16" cy="72" r="6" className="fill-secondary-green" />
        <circle cx="16" cy="72" r="10" className="fill-secondary-green/25" />
      </g>
    </svg>
  );
}
