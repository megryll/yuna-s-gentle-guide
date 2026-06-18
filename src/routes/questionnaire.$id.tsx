import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { MessageCircle, Pause, Play, X } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Confetti } from "@/components/Confetti";
import { IconMedallion } from "@/components/IconMedallion";
import { MultipleChoice } from "@/components/MultipleChoice";
import { PlacedForYou } from "@/components/SessionReflection";
import { ProgressBar } from "@/components/ProgressBar";
import { Slider } from "@/components/Slider";
import { Surface } from "@/components/Surface";
import { QuestionCard, CardLead } from "@/components/SurveyCard";
import { Tag } from "@/components/Tag";
import { YunaAvatar } from "@/components/YunaAvatar";
import { HOME_CARDS, type HomeCard } from "@/lib/home-cards";
import { useYunaIdentity } from "@/lib/yuna-session";
import { DEFAULT_VOICE } from "@/lib/voices";
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

// A small starting set Yuna "places" on completion — a daily practice, a skill,
// and a goal — surfaced as the New activities payoff (same section the session
// wrap-up uses). Curated by id so the screen reads as a deliberate first step.
const COMPLETION_ACTIVITIES: HomeCard[] = ["midday-reset", "please-technique", "daily-agenda"]
  .map((id) => HOME_CARDS.find((c) => c.id === id))
  .filter((c): c is HomeCard => !!c);

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
  const { avatar } = useYunaIdentity();

  // Focus-area ids in tap order = priority order; the top one drives the rest.
  const [focus, setFocus] = useState<string[]>([]);
  // Free text for the "Something Else" focus area (its inline text/record field).
  const [otherFocus, setOtherFocus] = useState("");
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
      return (
        <FocusPane
          surface={surface}
          value={focus}
          onToggle={onToggleFocus}
          otherValue={otherFocus}
          onOtherChange={setOtherFocus}
        />
      );
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
  // Mirrors the meditation complete screen: a frosted celebration badge, a
  // congratulatory headline, then Yuna reflecting back the priorities they
  // chose (in place of the meditation's rating), and a single Close button.
  if (onCompletion) {
    const focusLabels = focus
      .map((fid) => (fid === "other" ? otherFocus.trim() : focusAreaById(fid)?.label.toLowerCase()))
      .filter((l): l is string => !!l);
    const top = focusLabels[0];
    const list =
      focusLabels.length <= 1
        ? focusLabels.join("")
        : `${focusLabels.slice(0, -1).join(", ")} and ${focusLabels[focusLabels.length - 1]}`;
    const bridge = "I've added a few activities to your home to begin with.";
    const reflection = !top
      ? `Thank you for sharing this with me. You told me stress and sleep & energy are weighing on you most right now, and that stress comes first. We'll start there, one small step at a time. ${bridge}`
      : focusLabels.length === 1
        ? `Thank you for sharing this with me. You told me ${top} is where you'd like support right now. We'll take it gently, one small step at a time. ${bridge}`
        : `Thank you for sharing this with me. You told me ${list} matter to you, and that ${top} comes first. We'll start there, one small step at a time. ${bridge}`;

    return (
      <PhoneFrame themed>
        <div className="flex-1 flex flex-col min-h-0 text-white">
          <div className="flex-1 flex flex-col gap-10 overflow-y-auto overflow-x-hidden px-8 pb-6 yuna-fade-in min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Header: eyebrow + close. No title or completion mark — Yuna's
                centered avatar and reflection below are the moment. */}
            <div className="pt-14">
              <div className="relative flex items-center justify-center">
                <p className="text-uppercase tracking-[0.32em] uppercase text-white/75">
                  Questionnaire complete
                </p>
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <Button
                    surface={surface}
                    variant="plain"
                    size="icon"
                    onClick={exitFlow}
                    aria-label="Close"
                  >
                    <X strokeWidth={1.6} aria-hidden />
                  </Button>
                </div>
              </div>
            </div>

            {/* Yuna reflects back the priorities — avatar centered above the
                text, like the wrap-up keepsake card but without the photo. */}
            <Surface className="px-6 pt-7 pb-7 flex flex-col items-center text-center gap-4">
              <IconMedallion size="lg" label="Yuna">
                <YunaAvatar variant={avatar ?? DEFAULT_VOICE} size={64} />
              </IconMedallion>
              <p className="text-base leading-relaxed text-white/90">{reflection}</p>
            </Surface>

            <PlacedForYou items={COMPLETION_ACTIVITIES} />

            <div className="pt-2 flex flex-col gap-3">
              <Button surface={surface} variant="primary" fullWidth onClick={() => navigate({ to: "/home" })}>
                Return home
              </Button>
              <Button
                surface={surface}
                variant="secondary"
                fullWidth
                onClick={() => navigate({ to: "/you" })}
              >
                See your progress
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
  otherValue,
  onOtherChange,
}: {
  surface: "dark" | "light";
  value: string[];
  onToggle: (next: string[]) => void;
  otherValue: string;
  onOtherChange: (v: string) => void;
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
          otherValue={otherValue}
          onOtherChange={onOtherChange}
          otherPlaceholder="Type or record your answer"
          options={FOCUS_AREAS.map((a) => {
            const rank = value.indexOf(a.id);
            return {
              value: a.id,
              label: a.label,
              emoji: a.emoji,
              other: a.id === "other",
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
