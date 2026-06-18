import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { MessageCircle, Pause, Play, X } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Confetti } from "@/components/Confetti";
import { MultipleChoice } from "@/components/MultipleChoice";
import { ProgressRecap } from "@/components/DimensionTrends";
import { ProgressBar } from "@/components/ProgressBar";
import { RankList } from "@/components/RankList";
import { RatingScale } from "@/components/RatingScale";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { Slider } from "@/components/Slider";
import { TileChoice } from "@/components/TileChoice";
import { YunaAvatar } from "@/components/YunaAvatar";
import { IconMedallion } from "@/components/IconMedallion";
import { QuestionCard, CardLead } from "@/components/SurveyCard";
import { useYunaIdentity } from "@/lib/yuna-session";
import { DEFAULT_VOICE } from "@/lib/voices";
import { useAppMode } from "@/lib/theme-prefs";
import { usePrototypeMute } from "@/lib/prototype-mute";
import { playCompleteSwell, playSelectPop, playSliderTick } from "@/lib/survey-sound";
import { surveyById, type DemoQuestion, type ScaleQuestion } from "@/lib/demo-survey";

// ─── Generic survey runner ────────────────────────────────────────────────
// Renders a flat list of typed questions (demo-survey.ts) as a card flow: a
// persistent screen title up top, a partial progress bar with a "Question N of
// M" counter, then the current question on a white card (each type mapped to
// its DS primitive, all on the light surface the card provides). Previous/Next
// drive navigation — the whole card tilts off to the left as the next tilts in
// from the right. The completion pane is the payoff: Yuna reflects the new info
// back and surfaces fresh activities.
//
// The card is a frosted surface panel that follows the photo cluster (the same
// `bg-white/8` ↔ `bg-foreground/5` fill as YunaExplains), and its contents use
// the cluster `surface` too — so it reads white-on-dark in dark mode and
// inverts with the rest of the screen in light mode, rather than being a solid
// white tile.

type Answers = Record<string, string | string[]>;
type StepSearch = { step?: number };

// A question is "answered" enough to advance: multi-select needs ≥1, the pill
// group needs every sub-answer, rank always has an order; everything else just
// needs a value.
function isAnswered(q: DemoQuestion, answers: Answers): boolean {
  switch (q.kind) {
    case "single":
      return q.multi
        ? ((answers[q.id] as string[] | undefined)?.length ?? 0) > 0
        : answers[q.id] !== undefined;
    case "pillGroup":
      return q.items.every((it) => answers[it.id] !== undefined);
    case "rank":
      return true;
    default:
      return answers[q.id] !== undefined;
  }
}

export const Route = createFileRoute("/survey/$id")({
  validateSearch: (search: Record<string, unknown>): StepSearch => {
    const raw = search.step;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (Number.isNaN(n)) return {};
    return { step: Math.max(0, Math.floor(n)) };
  },
  head: () => ({ meta: [{ title: "Survey — Yuna" }] }),
  component: SurveyRoute,
});

function SurveyRoute() {
  const { id } = Route.useParams();
  const { step = 0 } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const muted = usePrototypeMute();
  const surface = useAppMode() === "light" ? "light" : "dark";

  const survey = surveyById(id);
  const questions = survey?.questions ?? [];
  const completionStep = questions.length;

  const [answers, setAnswers] = useState<Answers>({});
  // The audio-readout toggle is a prototype affordance — it swaps the icon but
  // doesn't drive real TTS. Starts "playing" to match the resting design.
  const [audioOn, setAudioOn] = useState(true);

  // Card transition: the leaving card stays mounted with its exit animation
  // while the new one enters; direction derives from the step delta. `leaving`
  // is set in a layout effect (before paint) so the incoming card paints with
  // its enter animation from the first frame — no instant-then-slide flash on
  // the way in. Once it clears, the entering card carries no animation class
  // (not a fresh fade), so there's no replay flash on the way out either.
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

  const goto = (next: number) =>
    navigate({ to: "/survey/$id", params: { id }, search: { step: next }, replace: true });

  const exitFlow = () =>
    router.history.canGoBack() ? router.history.back() : router.navigate({ to: "/home" });

  // A discrete pick records the answer with a soft pop; the user advances
  // themselves with Next.
  const pick = (qid: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
    playSelectPop({ muted });
  };
  const setAnswer = (qid: string, v: string | string[]) =>
    setAnswers((prev) => ({ ...prev, [qid]: v }));

  const onBack = () => {
    if (step > 0) goto(step - 1);
  };
  const onNext = () => {
    playSelectPop({ muted });
    goto(step + 1);
  };

  // Completion celebration — once, and only for a real run (a deep-link preview
  // straight to the completion step has no answers).
  const celebrated = useRef(false);
  const completedForReal = step === completionStep && Object.keys(answers).length > 0;
  useEffect(() => {
    if (!completedForReal || celebrated.current) return;
    celebrated.current = true;
    playCompleteSwell({ muted });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedForReal]);

  if (!survey) {
    return (
      <PhoneFrame themed>
        <div className="flex-1 flex items-center justify-center px-8 text-center text-white">
          <p className="text-white/85">This survey isn't available.</p>
        </div>
      </PhoneFrame>
    );
  }

  const q = questions[step] as DemoQuestion | undefined;
  const onCompletion = step === completionStep;
  const nextDisabled = !!q && !isAnswered(q, answers);

  const renderQuestion = (paneStep: number): ReactNode => {
    const question = questions[paneStep];
    if (!question) return null;
    return (
      <QuestionPane
        question={question}
        surface={surface}
        answers={answers}
        muted={muted}
        onPick={pick}
        onSetAnswer={setAnswer}
      />
    );
  };

  // The completion payoff is its own moment — same structure as the "Your
  // starting point" finish: eyebrow + close, Yuna's avatar reflecting back
  // inside a frosted card, the activities placed for them, then the exits.
  if (onCompletion) {
    return (
      <PhoneFrame themed>
        <div className="flex-1 flex flex-col min-h-0 text-white">
          <div className="flex-1 flex flex-col gap-10 overflow-y-auto overflow-x-hidden px-8 pb-6 yuna-fade-in min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="pt-14">
              <div className="relative flex items-center justify-center">
                <p className="text-uppercase tracking-[0.32em] uppercase text-white/75">
                  Survey complete
                </p>
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <Button
                    surface={surface}
                    variant="plain"
                    size="icon"
                    onClick={() => navigate({ to: "/home" })}
                    aria-label="Close"
                  >
                    <X strokeWidth={1.6} aria-hidden />
                  </Button>
                </div>
              </div>
            </div>

            <CompletionPane survey={survey} />

            <ProgressRecap priorities={[]} surface={surface} />

            <div className="pt-2 flex flex-col gap-3">
              <Button surface={surface} variant="primary" fullWidth onClick={() => navigate({ to: "/home" })}>
                Continue
              </Button>
            </div>
          </div>
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
            {survey.eyebrow}
          </span>
          <div className="justify-self-end">
            <Button surface={surface} variant="secondary" size="icon" aria-label="Close" onClick={exitFlow}>
              <X strokeWidth={1.5} />
            </Button>
          </div>
        </header>

        {/* Persistent screen title. */}
        <div className="px-6 pt-2 text-center">
          <h1 className="font-display text-2xl leading-snug tracking-tight text-white">{survey.title}</h1>
        </div>

        {/* Partial progress bar + question counter, centered as a group. */}
        <div className="flex items-center justify-center gap-3 px-6 pt-4">
          <div className="w-[42%]">
            <ProgressBar surface={surface} value={(step + 1) / questions.length} aria-label="Survey progress" />
          </div>
          <span className="text-sm text-white/75">
            Question {step + 1} of {questions.length}
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
              {renderQuestion(step)}
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
                {renderQuestion(leaving.step)}
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

function QuestionPane({
  question,
  surface,
  answers,
  muted,
  onPick,
  onSetAnswer,
}: {
  question: DemoQuestion;
  surface: "dark" | "light";
  answers: Answers;
  muted: boolean;
  onPick: (qid: string, v: string) => void;
  onSetAnswer: (qid: string, v: string | string[]) => void;
}) {
  switch (question.kind) {
    case "emoji":
      return (
        <>
          <CardLead>{question.statement}</CardLead>
          <div className="mt-6 flex flex-col items-center">
            <div className="inline-flex flex-col">
              <RatingScale
                surface={surface}
                size="lg"
                ariaLabel={question.statement}
                options={question.options.map((o) => ({
                  value: o.value,
                  label: o.label,
                  content: (
                    <span aria-hidden className="inline-block translate-y-[1.5px]">
                      {o.emoji}
                    </span>
                  ),
                }))}
                value={(answers[question.id] as string) ?? null}
                onChange={(v) => onPick(question.id, v)}
              />
              <div className="mt-3 flex justify-between text-sm font-medium text-white/75">
                <span>{question.minLabel}</span>
                <span>{question.maxLabel}</span>
              </div>
            </div>
          </div>
        </>
      );

    case "single":
      return (
        <>
          <CardLead>{question.prompt}</CardLead>
          {question.multi && <p className="mt-1 text-[13px] text-white/60">Choose all that apply.</p>}
          <div className="mt-5">
            {question.multi ? (
              <MultipleChoice
                surface={surface}
                multiple
                ariaLabel={question.prompt}
                options={question.options}
                value={(answers[question.id] as string[]) ?? []}
                onChange={(v) => {
                  onSetAnswer(question.id, v);
                  playSelectPop({ muted });
                }}
              />
            ) : (
              <MultipleChoice
                surface={surface}
                ariaLabel={question.prompt}
                options={question.options}
                value={(answers[question.id] as string) ?? null}
                onChange={(v) => onPick(question.id, v)}
              />
            )}
          </div>
        </>
      );

    case "tiles":
      return (
        <>
          <CardLead>{question.prompt}</CardLead>
          <div className="mt-5">
            <TileChoice
              surface={surface}
              ariaLabel={question.prompt}
              options={question.options}
              value={(answers[question.id] as string) ?? null}
              onChange={(v) => onPick(question.id, v)}
            />
          </div>
        </>
      );

    case "pillGroup":
      return (
        <>
          <CardLead>{question.prompt}</CardLead>
          <div className="mt-5 flex flex-col gap-5">
            {question.items.map((it) => (
              <div key={it.id} className="flex flex-col items-start gap-2.5">
                <p className="text-sm font-medium text-white/85">{it.label}</p>
                <SegmentedToggle
                  surface={surface}
                  size="md"
                  labelCase="normal"
                  ariaLabel={it.label}
                  value={(answers[it.id] as string) ?? ""}
                  options={it.options.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  onChange={(v) => {
                    onSetAnswer(it.id, v);
                    playSelectPop({ muted });
                  }}
                />
              </div>
            ))}
          </div>
        </>
      );

    case "scale":
      return (
        <>
          <CardLead>{question.prompt}</CardLead>
          <ScaleBody
            q={question}
            surface={surface}
            value={answers[question.id] !== undefined ? Number(answers[question.id]) : null}
            onMove={(v) => {
              onSetAnswer(question.id, String(v));
              playSliderTick({ muted });
            }}
          />
        </>
      );

    case "numeric":
      return (
        <>
          <CardLead>{question.prompt}</CardLead>
          <div className="mt-8 flex flex-col items-center">
            <div className="inline-flex flex-col">
              <RatingScale
                surface={surface}
                size="lg"
                ariaLabel={question.prompt}
                options={Array.from({ length: question.count }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                  content: <span className="tabular-nums">{i + 1}</span>,
                }))}
                value={(answers[question.id] as string) ?? null}
                onChange={(v) => onPick(question.id, v)}
              />
              <div className="mt-3 flex justify-between text-sm font-medium text-white/75">
                <span>{question.minLabel}</span>
                <span>{question.maxLabel}</span>
              </div>
            </div>
          </div>
        </>
      );

    case "rank": {
      const order = (answers[question.id] as string[]) ?? question.items.map((it) => it.value);
      return (
        <>
          <CardLead>{question.prompt}</CardLead>
          <div className="mt-5">
            <RankList
              surface={surface}
              ariaLabel={question.prompt}
              items={question.items}
              order={order}
              onReorder={(next) => onSetAnswer(question.id, next)}
              onDragTick={() => playSliderTick({ muted })}
            />
          </div>
        </>
      );
    }
  }
}

function ScaleBody({
  q,
  surface,
  value,
  onMove,
}: {
  q: ScaleQuestion;
  surface: "dark" | "light";
  value: number | null;
  onMove: (v: number) => void;
}) {
  const touched = value !== null;
  const display = value ?? Math.floor((q.points - 1) / 2);
  const frac = display / (q.points - 1);
  // Fill turns orange once the answer crosses into the struggling half (which
  // end that is depends on the item's `distress`).
  const fill: "green" | "orange" =
    touched && q.distress && (q.distress === "high" ? frac > 0.5 : frac < 0.5)
      ? "orange"
      : "green";
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
            (touched ? (descriptor ? "text-white/85" : "opacity-0") : "text-white/60")
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

// The payoff: Yuna's avatar, a reflection that ties the new answers back to
// what the user is working on, and fresh activities placed for them.
function CompletionPane({
  survey,
}: {
  survey: NonNullable<ReturnType<typeof surveyById>>;
}) {
  const { avatar } = useYunaIdentity();
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <IconMedallion size="lg" label="Yuna">
        <YunaAvatar variant={avatar ?? DEFAULT_VOICE} size={64} />
      </IconMedallion>
      {survey.conclusion.title && (
        <h1 className="font-display text-2xl leading-tight tracking-tight text-white">
          {survey.conclusion.title}
        </h1>
      )}
      <div className="flex flex-col gap-3">
        {survey.conclusion.reflection.map((line, i) => (
          <p key={i} className="text-base leading-relaxed text-white/90">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
