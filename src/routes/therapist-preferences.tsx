import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X, Search, MapPin, Check } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { TextField } from "@/components/TextField";
import { ProgressBar } from "@/components/ProgressBar";
import { PageHeader } from "@/components/PageHeader";
import { MultipleChoice } from "@/components/MultipleChoice";
import { LeafSpinner } from "@/components/LeafSpinner";
import { IconMedallion } from "@/components/IconMedallion";
import { useAppMode } from "@/lib/theme-prefs";
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

  const [answers, setAnswers] = useState<Answers>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const total = SURVEY_QUESTIONS.length;
  const question = SURVEY_QUESTIONS[step];
  const isLast = step === total - 1;

  const goto = (next: number) => {
    setSearch("");
    navigate({ to: "/therapist-preferences", search: { step: next } });
  };

  const onNext = () => {
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

  if (loading) {
    return (
      <PhoneFrame themed>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-6 text-white">
          <LeafSpinner size={88} surface={surface} />
          <div>
            <h1 className="font-display text-3xl tracking-tight">Finding your matches</h1>
            <p className="mt-2 text-sm leading-snug text-white/85 max-w-[18rem] mx-auto">
              Yuna is surfacing therapists who fit your needs, location, and budget.
            </p>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
        <PageHeader
          surface={surface}
          onBack={onBack}
          backDisabled={step === 0}
          trailing={
            <Button
              surface={surface}
              variant="secondary"
              size="icon"
              aria-label="Close"
              onClick={() => navigate({ to: "/therapist-recommendations" })}
            >
              <X strokeWidth={1.5} />
            </Button>
          }
        />
        <div className="shrink-0 px-6 mt-4 flex items-center gap-3">
          <ProgressBar
            surface={surface}
            value={(step + 1) / total}
            aria-label={`Question ${step + 1} of ${total}`}
          />
          <span className="shrink-0 text-xs tabular-nums text-white/75">
            {step + 1} of {total}
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 pt-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden yuna-fade-in">
          <h1 className="font-display text-3xl leading-tight tracking-tight text-white">{question.title}</h1>
          <p className="mt-2 text-sm leading-snug text-white/85">{question.prompt}</p>

          <div className="mt-6">
            <QuestionBody
              question={question}
              surface={surface}
              search={search}
              setSearch={setSearch}
              answers={answers}
              setAnswers={setAnswers}
            />
          </div>
        </div>

        <footer className="shrink-0 flex items-center gap-3 px-6 pb-10 pt-3">
          <Button surface={surface} variant="secondary" fullWidth disabled={step === 0} onClick={onBack}>
            Previous
          </Button>
          <Button surface={surface} variant="primary" fullWidth onClick={onNext}>
            {isLast ? "See matches" : "Next"}
          </Button>
        </footer>
      </div>
    </PhoneFrame>
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
                    (dark ? "text-white active:bg-white/10" : "text-foreground active:bg-foreground/5")
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
