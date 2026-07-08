import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageCircle, Pause, Play, X, Search, MapPin, Check } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { TextField } from "@/components/TextField";
import { ProgressBar } from "@/components/ProgressBar";
import { MultipleChoice } from "@/components/MultipleChoice";
import { DictationField } from "@/components/DictationField";
import { Divider } from "@/components/Divider";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { LeafSpinner } from "@/components/LeafSpinner";
import { IconMedallion } from "@/components/IconMedallion";
import { QuestionCard, CardLead } from "@/components/SurveyCard";
import { KEYBOARD_HEIGHT } from "@/components/KeyboardSimulator";
import { useAppMode } from "@/lib/theme-prefs";
import { usePrototypeMute } from "@/lib/prototype-mute";
import { playCompleteSwell, playSelectPop } from "@/lib/survey-sound";
import { setPreferencesApplied } from "@/lib/therapist-prefs";
import { SURVEY_QUESTIONS, LOCATIONS, DETECTED_LOCATION, type SurveyQuestion } from "@/lib/therapist-data";

// ─── Therapist preferences survey ────────────────────────────────────────────
// The preferences questionnaire, opened from the recommendations teaser. The
// survey shell: audio·label·close header, "Question N of M" progress, each
// question on a frosted QuestionCard that tilts off as the next tilts in, and
// Previous/Next navigation. The first two questions are open-ended (typed or
// dictated); everything is optional, so Next is never gated. The payoff isn't
// a celebration pane — it's the "Finding your matches" hand-off into the
// recommendations deck.

type StepSearch = { step?: number };

export const Route = createFileRoute("/therapist-preferences")({
  validateSearch: (search: Record<string, unknown>): StepSearch => {
    const raw = search.step;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (Number.isNaN(n)) return { step: 0 };
    return { step: Math.max(0, Math.min(SURVEY_QUESTIONS.length - 1, Math.floor(n))) };
  },
  head: () => ({ meta: [{ title: "Therapist Preferences — Yuna" }] }),
  component: PreferencesRoute,
});

type Answers = Record<string, string | string[] | null>;

function PreferencesRoute() {
  const { step } = Route.useSearch();
  const qStep = step ?? 0;
  const navigate = useNavigate();
  const muted = usePrototypeMute();
  const surface = useAppMode() === "light" ? "light" : "dark";

  const [answers, setAnswers] = useState<Answers>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  // Prototype audio-readout toggle — swaps the icon, doesn't drive real TTS.
  const [audioOn, setAudioOn] = useState(true);
  // Simulated-keyboard handling: while a text field is focused the screen gains
  // KEYBOARD_HEIGHT of bottom padding and the footer collapses, so the keyboard
  // covers where the buttons were (instead of lifting them over the results)
  // and the scrollable card stage ends exactly at the keyboard's top edge.
  const [kbOpen, setKbOpen] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);

  // A focused field halfway down the card doesn't move when the footer lifts —
  // once the padding transition settles, nudge it clear of the keyboard, with
  // some room below for results to appear.
  useEffect(() => {
    if (!kbOpen) return;
    const t = setTimeout(() => {
      const pane = paneRef.current;
      const el = document.activeElement as HTMLElement | null;
      if (!pane || !el || !pane.contains(el)) return;
      // Keep the field plus ~a row of results (or the no-match note) below it
      // clear of the keyboard; re-runs as the query changes.
      const overlap = el.getBoundingClientRect().bottom + 96 - pane.getBoundingClientRect().bottom;
      if (overlap > 0) pane.scrollTo({ top: pane.scrollTop + overlap, behavior: "smooth" });
    }, 230);
    return () => clearTimeout(t);
  }, [kbOpen, search]);

  const isTextField = (el: EventTarget | null): boolean =>
    el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");

  // A focused field can unmount without ever firing blur (the chat composer
  // leaves after the wrap-up; the location field is replaced by its selected
  // row), which would strand the lift. While it's active, keep verifying that
  // focus really is on a field.
  useEffect(() => {
    if (!kbOpen) return;
    const id = setInterval(() => {
      if (!isTextField(document.activeElement)) setKbOpen(false);
    }, 250);
    return () => clearInterval(id);
  }, [kbOpen]);

  const total = SURVEY_QUESTIONS.length;
  const isLast = qStep === total - 1;

  // Card transition: the leaving card stays mounted with its exit animation
  // while the new one enters; direction derives from the step delta. `leaving`
  // is set before paint so the incoming card animates in from the first frame.
  // Phase switches (chat ↔ question 0) map to the same qStep, so they don't tilt.
  const prevStep = useRef(qStep);
  const [leaving, setLeaving] = useState<{ step: number; dir: "fwd" | "back" } | null>(null);
  useLayoutEffect(() => {
    if (qStep === prevStep.current) return;
    setLeaving({ step: prevStep.current, dir: qStep > prevStep.current ? "fwd" : "back" });
    prevStep.current = qStep;
  }, [qStep]);
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
    if (isLast) {
      playCompleteSwell({ muted });
      setLoading(true);
      setTimeout(() => {
        setPreferencesApplied(true);
        navigate({ to: "/therapist-recommendations" });
      }, 1600);
      return;
    }
    playSelectPop({ muted });
    goto(qStep + 1);
  };

  const onBack = () => {
    if (qStep === 0) return;
    goto(qStep - 1);
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

  // The question card for a given step: the question title as the card lead,
  // its prompt as a subline, then the typed body. `animClass` carries the
  // tilt-and-slide transition classes.
  const renderCard = (paneStep: number, animClass: string): ReactNode => {
    const question = SURVEY_QUESTIONS[paneStep];
    if (!question) return null;
    return (
      <QuestionCard surface={surface} className={animClass}>
        <CardLead>{question.title}</CardLead>
        <p className="mt-1.5 text-sm leading-snug text-white/75">{question.prompt}</p>
        <div className="mt-5">
          <QuestionBody
            question={question}
            surface={surface}
            muted={muted}
            search={search}
            setSearch={setSearch}
            answers={answers}
            setAnswers={setAnswers}
            onAdvance={onNext}
          />
        </div>
      </QuestionCard>
    );
  };

  return (
    <PhoneFrame themed>
      <div
        className="flex-1 flex flex-col min-h-0 text-white transition-[padding-bottom] duration-200 ease-out"
        style={kbOpen ? { paddingBottom: KEYBOARD_HEIGHT } : undefined}
        onFocus={(e) => {
          if (isTextField(e.target)) setKbOpen(true);
        }}
        onBlur={(e) => {
          if (isTextField(e.target)) setKbOpen(false);
        }}
      >
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

        {/* Persistent screen title. */}
        <div className="px-6 pt-2 text-center">
          <h1 className="font-display text-2xl leading-snug tracking-tight text-white">
            Find your match
          </h1>
        </div>

        {/* Partial progress bar + question counter, centered as a group. */}
        <div className="flex items-center justify-center gap-3 px-6 pt-4">
          <div className="w-[42%]">
            <ProgressBar
              surface={surface}
              value={(qStep + 1) / total}
              aria-label={`Question ${qStep + 1} of ${total}`}
            />
          </div>
          <span className="text-sm text-white/75">
            Question {qStep + 1} of {total}
          </span>
        </div>

        {/* Card stage — the current card sits top-aligned; the leaving card
            overlays it during the tilt-and-slide transition. */}
        <div className="relative flex-1 min-h-0">
          <div
            key={qStep}
            ref={paneRef}
            className={
              "absolute inset-0 flex items-start px-6 pt-5 pb-2" +
              (kbOpen ? " overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "")
            }
          >
            {renderCard(
              qStep,
              leaving ? (leaving.dir === "fwd" ? "survey-card-in-fwd" : "survey-card-in-back") : "",
            )}
          </div>
          {leaving && (
            <div
              key={`leaving-${leaving.step}`}
              aria-hidden
              className="absolute inset-0 flex items-start px-6 pt-5 pb-2 pointer-events-none"
            >
              {renderCard(
                leaving.step,
                leaving.dir === "fwd" ? "survey-card-out-fwd" : "survey-card-out-back",
              )}
            </div>
          )}
        </div>

        {/* Previous / Next. Collapses while the keyboard is up (in step with
            the screen's padding-bottom transition) so the keyboard covers the
            buttons rather than pushing them up over the card's results. */}
        <footer
          className={
            "flex items-center justify-between px-6 transition-all duration-200 ease-out " +
            (kbOpen ? "h-0 pt-0 pb-0 overflow-hidden opacity-0 pointer-events-none" : "pt-3 pb-10")
          }
        >
          <Button surface={surface} variant="secondary" disabled={qStep === 0} onClick={onBack}>
            Previous
          </Button>
          <Button surface={surface} variant="primary" onClick={onNext}>
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
  muted,
  search,
  setSearch,
  answers,
  setAnswers,
  onAdvance,
}: {
  question: SurveyQuestion;
  surface: "dark" | "light";
  muted: boolean;
  search: string;
  setSearch: (v: string) => void;
  answers: Answers;
  setAnswers: (fn: (prev: Answers) => Answers) => void;
  /** Free-text submit (send / mic release) advances to the next question. */
  onAdvance: () => void;
}) {
  const setAnswer = (value: string | string[] | null) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    playSelectPop({ muted });
  };

  if (question.type === "freeText") {
    // Open-ended answer via the chat composer's hold-to-talk field: hold the
    // mic to dictate (release sends), or type and hit send. Sending commits
    // the answer and advances, like sending a chat message; the answer stays
    // editable via Previous, and Next still skips past an empty field.
    return (
      <DictationField
        surface={surface}
        placeholder={question.placeholder}
        value={(answers[question.id] as string) ?? ""}
        onChange={(v) => setAnswers((prev) => ({ ...prev, [question.id]: v }))}
        onSubmit={(text) => {
          setAnswers((prev) => ({ ...prev, [question.id]: text }));
          onAdvance();
        }}
      />
    );
  }

  if (question.type === "pillGroup") {
    // Quick-fire rows: label above the pick, one answer per item id. Same
    // pattern as the demo survey runner's pillGroup pane. Single-pick rows are
    // a segmented rail; multi rows are wrapping tag chips.
    return (
      <div className="flex flex-col gap-5">
        {question.items.map((it) => (
          <div key={it.id} className="flex flex-col items-start gap-2.5">
            <p className="text-sm font-medium text-white/85">{it.label}</p>
            {it.multi ? (
              <div className="flex flex-wrap gap-2">
                {it.options.map((opt) => {
                  const selected = (answers[it.id] as string[]) ?? [];
                  const active = selected.includes(opt.value);
                  return (
                    <Tag
                      key={opt.value}
                      surface={surface}
                      selected={active}
                      onClick={() => {
                        setAnswers((prev) => ({
                          ...prev,
                          [it.id]: active
                            ? selected.filter((v) => v !== opt.value)
                            : [...selected, opt.value],
                        }));
                        playSelectPop({ muted });
                      }}
                    >
                      {opt.label}
                    </Tag>
                  );
                })}
              </div>
            ) : (
              <SegmentedToggle
                surface={surface}
                size="md"
                labelCase="normal"
                ariaLabel={it.label}
                value={(answers[it.id] as string) ?? ""}
                options={it.options}
                onChange={(v) => {
                  setAnswers((prev) => ({ ...prev, [it.id]: v }));
                  playSelectPop({ muted });
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (question.type === "insurance") {
    // Two ways to answer: the exclusive "no coverage" row, or provider chips
    // surfaced by the search — results only appear once a letter is typed.
    const selected = (answers[question.id] as string[]) ?? [];
    const noneActive = selected.includes(question.none.value);
    const providers = selected.filter((v) => v !== question.none.value);
    const query = search.trim().toLowerCase();
    const matches = query
      ? question.suggestions.filter((s) => s.toLowerCase().includes(query))
      : [];
    // Chosen providers stay pinned ahead of the live results.
    const shown = [...providers.filter((s) => !matches.includes(s)), ...matches];
    const budgetValue = (answers[question.budget.id] as string) ?? null;
    const clearBudget = (prev: Answers) => {
      const next = { ...prev };
      delete next[question.budget.id];
      return next;
    };
    const toggleProvider = (tag: string) => {
      // Picking a provider leaves the out-of-pocket path, so its budget
      // follow-up no longer applies.
      if (noneActive) setAnswers(clearBudget);
      setAnswer(
        providers.includes(tag) ? providers.filter((t) => t !== tag) : [...providers, tag],
      );
    };
    return (
      <div className="flex flex-col gap-4">
        <MultipleChoice
          surface={surface}
          multiple
          ariaLabel={question.title}
          options={[
            {
              value: question.none.value,
              label: question.none.label,
              subtitle: question.none.subtitle,
            },
          ]}
          value={noneActive ? [question.none.value] : []}
          onChange={(v) => {
            const checked = v.includes(question.none.value);
            if (!checked) setAnswers(clearBudget);
            setAnswer(checked ? [question.none.value] : []);
            setSearch("");
          }}
        />
        {noneActive && (
          <div className="flex flex-col items-start gap-2.5 pl-1">
            <p className="text-sm font-medium text-white/85">{question.budget.label}</p>
            <div className="flex flex-wrap gap-2">
              {question.budget.options.map((range) => (
                <Tag
                  key={range}
                  surface={surface}
                  selected={budgetValue === range}
                  onClick={() => {
                    setAnswers((prev) =>
                      budgetValue === range
                        ? clearBudget(prev)
                        : { ...prev, [question.budget.id]: range },
                    );
                    playSelectPop({ muted });
                  }}
                >
                  {range}
                </Tag>
              ))}
            </div>
          </div>
        )}
        <Divider surface={surface} label="or" />
        <TextField
          surface={surface}
          placeholder={question.placeholder}
          leading={<Search size={16} className={surface === "dark" ? "text-white/60" : "text-foreground/50"} aria-hidden />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {query.length > 0 &&
          (matches.length > 0 ? (
            <p className="text-uppercase font-semibold uppercase tracking-[0.12em] text-white/75">
              {matches.length} result{matches.length === 1 ? "" : "s"}
            </p>
          ) : (
            <p className="text-sm leading-snug text-white/75">
              That provider isn't in our network yet. It's okay to continue without
              one for now, and you can add coverage details later.
            </p>
          ))}
        {shown.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {shown.map((tag) => (
              <Tag
                key={tag}
                surface={surface}
                selected={providers.includes(tag)}
                onClick={() => toggleProvider(tag)}
              >
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </div>
    );
  }

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

  const detected = `${DETECTED_LOCATION.city}, ${DETECTED_LOCATION.state}`;

  return (
    <div className="flex flex-col gap-4">
      {/* The detected location as a one-tap pick, with search as the fallback. */}
      <MultipleChoice
        surface={surface}
        ariaLabel="Use your detected location"
        options={[
          {
            value: detected,
            label: detected,
            subtitle: "Detected from your device",
            icon: <MapPin size={16} aria-hidden />,
          },
        ]}
        value={null}
        onChange={(v) => onSelect(v)}
      />
      <Divider surface={surface} label="or" />
      <div className="relative">
        <TextField
          surface={surface}
          placeholder="Search another city, state, or ZIP"
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
    </div>
  );
}
