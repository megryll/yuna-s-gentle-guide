import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X, Search, MapPin, Check, MessageCircle, Pause, Play } from "lucide-react";
import { WebShell } from "@/components/WebShell";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { TextField } from "@/components/TextField";
import { ProgressBar } from "@/components/ProgressBar";
import { QuestionCard } from "@/components/SurveyCard";
import { MultipleChoice } from "@/components/MultipleChoice";
import { LeafSpinner } from "@/components/LeafSpinner";
import { IconMedallion } from "@/components/IconMedallion";
import { useAppMode } from "@/lib/theme-prefs";
import { usePrototypeMute } from "@/lib/prototype-mute";
import { playSelectPop } from "@/lib/survey-sound";
import { setPreferencesApplied } from "@/lib/therapist-prefs";
import { SURVEY_QUESTIONS, LOCATIONS, type SurveyQuestion } from "@/lib/therapist-data";

type StepSearch = { step?: number };

export const Route = createFileRoute("/therapist-preferences")({
  validateSearch: (search: Record<string, unknown>): StepSearch => {
    const raw = search.step;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (Number.isNaN(n)) return {};
    return { step: Math.max(0, Math.min(SURVEY_QUESTIONS.length - 1, Math.floor(n))) };
  },
  head: () => ({ meta: [{ title: "Therapist Preferences — Yuna" }] }),
  component: PreferencesRoute,
});

type Answers = Record<string, string | string[] | null>;

function PreferencesRoute() {
  const { step = 0 } = Route.useSearch();
  const navigate = useNavigate();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const muted = usePrototypeMute();

  const [answers, setAnswers] = useState<Answers>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  // Prototype audio-readout toggle — swaps the icon, doesn't drive real TTS.
  const [audioOn, setAudioOn] = useState(true);

  const total = SURVEY_QUESTIONS.length;
  const isLast = step === total - 1;

  // Card transition: the leaving card stays mounted with its exit animation
  // while the new one enters; direction derives from the step delta (mirrors
  // the questionnaire route's tilt-and-slide grammar).
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

  const goto = (next: number) => {
    setSearch("");
    navigate({ to: "/therapist-preferences", search: { step: next } });
  };

  const onNext = () => {
    playSelectPop({ muted });
    if (isLast) {
      setLoading(true);
      setTimeout(() => {
        setPreferencesApplied(true);
        navigate({ to: "/therapist-recommendations" });
      }, 1600);
      return;
    }
    goto(step + 1);
  };

  const onBack = () => {
    if (step === 0) return;
    goto(step - 1);
  };

  // A question's content (title + prompt + body) for a given step, rendered
  // inside the QuestionCard. The questions themselves are unchanged — only the
  // chrome around them is new.
  const renderQuestion = (qIndex: number): ReactNode => {
    const q = SURVEY_QUESTIONS[qIndex];
    if (!q) return null;
    return (
      <>
        <h2 className="font-display text-2xl md:text-[28px] leading-tight tracking-tight text-white">{q.title}</h2>
        <p className="mt-2 text-sm md:text-base leading-snug text-white/85">{q.prompt}</p>
        <div className="mt-6">
          <QuestionBody
            question={q}
            surface={surface}
            search={search}
            setSearch={setSearch}
            answers={answers}
            setAnswers={setAnswers}
          />
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <WebShell>
        <div className="flex flex-col items-center justify-center min-h-[100svh] md:min-h-screen text-center px-8 gap-6 text-white">
          <LeafSpinner size={88} surface={surface} />
          <div>
            <h1 className="font-display text-3xl tracking-tight">Finding your matches</h1>
            <p className="mt-2 text-sm leading-snug text-white/85 max-w-[18rem] mx-auto">
              Yuna is surfacing therapists who fit your needs, location, and budget.
            </p>
          </div>
        </div>
      </WebShell>
    );
  }

  return (
    <WebShell>
      {/* Responsive survey flow: a full-height column with the header pinned to
          the top, the question centered in a readable measure, and the nav
          pinned to the bottom — the standard web wizard shape. The column caps
          at a comfortable desktop width (wider than the old phone card) and
          centers, so the chrome aligns to the content edges instead of floating
          in a tiny box. The card stage is still a definite-height flex child,
          which the absolutely-positioned transition needs. */}
      <div className="mx-auto flex min-h-[100svh] md:min-h-screen w-full max-w-md md:max-w-2xl flex-col px-6 md:px-8 text-white">
        {/* Header: audio toggle · label · close, spanning the column width. */}
        <header className="shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-14 md:pt-10 pb-1">
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
            Preferences
          </span>
          <div className="justify-self-end">
            <Button
              surface={surface}
              variant="secondary"
              size="icon"
              aria-label="Close"
              onClick={() => navigate({ to: "/therapist-recommendations" })}
            >
              <X strokeWidth={1.5} />
            </Button>
          </div>
        </header>

        {/* Persistent screen title + progress, centered as a group. */}
        <div className="shrink-0 pt-2 md:pt-6 text-center">
          <h1 className="font-display text-2xl md:text-4xl leading-snug tracking-tight text-white">
            Find your therapist
          </h1>
          <div className="mt-4 md:mt-5 flex items-center justify-center gap-3">
            <div className="w-[42%] md:w-52">
              <ProgressBar
                surface={surface}
                value={(step + 1) / total}
                aria-label={`Question ${step + 1} of ${total}`}
              />
            </div>
            <span className="text-sm text-white/75">
              Question {step + 1} of {total}
            </span>
          </div>
        </div>

        {/* Card stage — the current card is vertically centered in the stage;
            the leaving card overlays it during the tilt-and-slide transition. */}
        <main className="relative flex-1 min-h-0">
          <div key={step} className="absolute inset-0 flex items-center pt-6 pb-2">
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
              className="absolute inset-0 flex items-center pt-6 pb-2 pointer-events-none"
            >
              <QuestionCard
                surface={surface}
                className={leaving.dir === "fwd" ? "survey-card-out-fwd" : "survey-card-out-back"}
              >
                {renderQuestion(leaving.step)}
              </QuestionCard>
            </div>
          )}
        </main>

        {/* Previous / Next pinned to the bottom of the flow. */}
        <footer className="shrink-0 flex items-center justify-between pb-10 md:pb-10 pt-3">
          <Button surface={surface} variant="secondary" disabled={step === 0} onClick={onBack}>
            Previous
          </Button>
          <Button surface={surface} variant="primary" onClick={onNext}>
            {isLast ? "See matches" : "Next"}
          </Button>
        </footer>
      </div>
    </WebShell>
  );
}

function QuestionBody({
  question,
  surface,
  search,
  setSearch,
  answers,
  setAnswers,
}: {
  question: SurveyQuestion;
  surface: "dark" | "light";
  search: string;
  setSearch: (v: string) => void;
  answers: Answers;
  setAnswers: (fn: (prev: Answers) => Answers) => void;
}) {
  const setAnswer = (value: string | string[] | null) =>
    setAnswers((prev) => ({ ...prev, [question.id]: value }));

  if (question.type === "location") {
    return (
      <LocationQuestion
        surface={surface}
        search={search}
        setSearch={setSearch}
        value={(answers[question.id] as string) ?? null}
        onSelect={(v) => setAnswer(v)}
      />
    );
  }

  if (question.type === "single") {
    return (
      <MultipleChoice
        surface={surface}
        ariaLabel={question.title}
        options={question.options}
        value={(answers[question.id] as string) ?? null}
        onChange={(v) => setAnswer(v)}
      />
    );
  }

  if (question.type === "multi") {
    return (
      <MultipleChoice
        surface={surface}
        multiple
        ariaLabel={question.title}
        options={question.options}
        value={(answers[question.id] as string[]) ?? []}
        onChange={(v) => setAnswer(v)}
      />
    );
  }

  // chips
  const selected = (answers[question.id] as string[]) ?? [];
  const toggle = (tag: string) =>
    setAnswer(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);

  const query = search.trim().toLowerCase();
  const matches = query
    ? question.suggestions.filter((s) => s.toLowerCase().includes(query))
    : question.suggestions;
  // Keep already-selected tags pinned at the front, even if they don't match.
  const ordered = [
    ...selected.filter((s) => !matches.includes(s)),
    ...matches,
  ];

  return (
    <div className="flex flex-col gap-4">
      <TextField
        surface={surface}
        placeholder={question.placeholder}
        leading={<Search size={16} className={surface === "dark" ? "text-white/60" : "text-foreground/50"} aria-hidden />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <p className="text-uppercase font-semibold uppercase tracking-[0.12em] text-white/75">
        {query ? `${matches.length} result${matches.length === 1 ? "" : "s"}` : "Suggested for you"}
      </p>
      <div className="flex flex-wrap gap-2">
        {ordered.map((tag) => (
          <Tag key={tag} surface={surface} selected={selected.includes(tag)} onClick={() => toggle(tag)}>
            {tag}
          </Tag>
        ))}
      </div>
    </div>
  );
}

function LocationQuestion({
  surface,
  search,
  setSearch,
  value,
  onSelect,
}: {
  surface: "dark" | "light";
  search: string;
  setSearch: (v: string) => void;
  value: string | null;
  onSelect: (v: string | null) => void;
}) {
  const dark = surface === "dark";
  const query = search.trim().toLowerCase();
  const matches = query
    ? LOCATIONS.filter(
        (l) =>
          l.city.toLowerCase().includes(query) ||
          l.state.toLowerCase().includes(query) ||
          l.zip.includes(query),
      )
    : [];

  if (value) {
    return (
      <div
        className={
          "flex items-center gap-3 rounded-2xl border-2 p-3 " +
          (dark ? "border-white bg-white/10 text-white" : "border-foreground/40 bg-foreground/5 text-foreground")
        }
      >
        <IconMedallion size="sm">
          <MapPin size={16} className={dark ? "text-white" : "text-foreground"} aria-hidden />
        </IconMedallion>
        <span className="flex-1 min-w-0 truncate text-sm font-semibold">{value}</span>
        <Check size={20} strokeWidth={2.25} className={dark ? "text-white" : "text-foreground"} aria-hidden />
        <Button
          surface={surface}
          variant="plain"
          size="icon-sm"
          aria-label="Clear location"
          onClick={() => {
            onSelect(null);
            setSearch("");
          }}
        >
          <X strokeWidth={2} aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <TextField
        surface={surface}
        placeholder="e.g. Portland, OR or 98101"
        leading={<Search size={16} className={dark ? "text-white/60" : "text-foreground/50"} aria-hidden />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {query.length > 0 && (
        <ul
          className={
            "mt-2 overflow-hidden rounded-2xl border " +
            (dark ? "border-white/20 bg-white/10 backdrop-blur-md" : "border-foreground/15 bg-white/70 backdrop-blur-md")
          }
        >
          {matches.length === 0 ? (
            <li className={"px-4 py-3 text-sm " + (dark ? "text-white/70" : "text-foreground/70")}>
              No matches. Try a city, state, or ZIP.
            </li>
          ) : (
            matches.map((l) => (
              <li key={l.zip}>
                <button
                  type="button"
                  onClick={() => onSelect(`${l.city}, ${l.state}`)}
                  className={
                    "w-full flex items-center gap-2 px-4 py-3 text-left text-sm transition-colors " +
                    (dark ? "text-white hover:bg-white/[0.06] active:bg-white/10" : "text-foreground hover:bg-foreground/[0.03] active:bg-foreground/5")
                  }
                >
                  <MapPin size={15} className={dark ? "text-white/60" : "text-foreground/50"} aria-hidden />
                  <span className="font-semibold">{l.city}</span>
                  <span className={dark ? "text-white/70" : "text-foreground/70"}>
                    {l.state} · {l.zip}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
