import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { TextField } from "@/components/TextField";
import { YunaAvatar } from "@/components/YunaAvatar";
import { Card, CardHeader, CardFooter, CardCTA } from "@/components/Card";
import {
  SegmentedToggle,
  type SegmentedToggleOption,
} from "@/components/SegmentedToggle";
import { Confetti } from "@/components/Confetti";
import { NativeDatePicker } from "@/components/NativeDatePicker";
import { useAppMode } from "@/lib/theme-prefs";
import { useYunaIdentity } from "@/lib/yuna-session";
import { useUserType } from "@/lib/user-type";

type Step = "list" | "name" | "timeframe" | "success";
type StepSearch = { step?: Exclude<Step, "list"> };

export const Route = createFileRoute("/goals")({
  // The admin sidebar deep-links each sub-screen via ?step=…; an unknown or
  // missing value falls back to the list.
  validateSearch: (search: Record<string, unknown>): StepSearch => {
    const s = search.step;
    return s === "name" || s === "timeframe" || s === "success" ? { step: s } : {};
  },
  head: () => ({ meta: [{ title: "Goal Setting — Yuna" }] }),
  component: GoalsRoute,
});

// ─── Model ──────────────────────────────────────────────────────────────────

type Filter = "active" | "completed";

type Goal = {
  id: string;
  /** The goal phrase, e.g. "I will learn how to do a cartwheel". */
  text: string;
  /** Trailing deadline clause, e.g. "till Tue, May 28". */
  deadlineLabel: string;
  /** Photo background for the goal's content card. */
  naturePath: string;
  completed: boolean;
  /** Set when completed, e.g. "Done Tue, May 28". */
  doneLabel?: string;
};

// Cycled through as goals are created so each card gets its own photo.
const GOAL_BGS = [
  "/nature/Background-3.png",
  "/nature/Background-8.png",
  "/nature/Background-12.png",
  "/nature/Background-5.png",
  "/nature/Background-16.png",
];

const SEED_GOALS: Goal[] = [
  { id: "g1", text: "I will learn how to do a cartwheel", deadlineLabel: "till Tue, May 28", naturePath: GOAL_BGS[0], completed: false },
  { id: "g2", text: "I will prepare a daily agenda every morning", deadlineLabel: "till Fri, Jun 6", naturePath: GOAL_BGS[1], completed: false },
  { id: "g3", text: "I will read one book this month", deadlineLabel: "till Sun, Jun 1", naturePath: GOAL_BGS[2], completed: true, doneLabel: "Done Tue, May 20" },
];

// Shown on the success screen when it's deep-linked without a freshly-created
// goal (e.g. from the admin sidebar).
const DEMO_GOAL: Goal = {
  id: "demo",
  text: "I will prepare a daily agenda every morning this week",
  deadlineLabel: "",
  naturePath: GOAL_BGS[1],
  completed: false,
};

const TIMEFRAMES = [
  { id: "1day", label: "1 day", emoji: "☀️", days: 1 },
  { id: "1week", label: "1 week", emoji: "🗓️", days: 7 },
  { id: "2weeks", label: "2 weeks", emoji: "✌️", days: 14 },
  { id: "1month", label: "1 month", emoji: "🌙", days: 30 },
] as const;

const FILTER_OPTIONS: ReadonlyArray<SegmentedToggleOption<Filter>> = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Old app turned "I want to …" into "I will …"; mirror that small nicety so the
// card reads as a commitment. Trailing punctuation is trimmed so the deadline
// clause appends cleanly.
function goalSentence(text: string): string {
  const t = text.trim().replace(/[.\s]+$/, "");
  return /^i want to /i.test(t) ? "I will " + t.slice("i want to ".length) : t;
}

// ─── Route ────────────────────────────────────────────────────────────────────

function GoalsRoute() {
  const navigate = useNavigate();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const { avatar } = useYunaIdentity();
  const photo = avatar ?? "iris";
  const userType = useUserType();
  const { step: searchStep } = Route.useSearch();

  // The step is URL-driven so the admin sidebar's sub-screen links and the
  // in-flow navigation stay in sync — ?step is the single source of truth.
  const step: Step = searchStep ?? "list";
  const go = (s: Step) =>
    navigate({ to: "/goals", search: s === "list" ? {} : { step: s } });

  // A "new" user starts on the empty state; a returning one has goals.
  const [goals, setGoals] = useState<Goal[]>(() =>
    userType === "returning" ? SEED_GOALS : [],
  );
  const [filter, setFilter] = useState<Filter>("active");
  const [draft, setDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newGoalId, setNewGoalId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  // Bumped on every mark-done to replay the confetti burst.
  const [burstKey, setBurstKey] = useState(0);

  const idRef = useRef(100);

  // Flipping the admin user-type toggle resets the scenario: a new user sees
  // the empty state, a returning user sees the seeded goals. (Step is left to
  // the URL so a deep-linked sub-screen isn't clobbered on the initial
  // hydration transition.)
  const prevUserType = useRef(userType);
  useEffect(() => {
    if (prevUserType.current === userType) return;
    prevUserType.current = userType;
    setGoals(userType === "returning" ? SEED_GOALS : []);
  }, [userType]);

  const createGoal = (deadlineLabel: string) => {
    const id = `g${idRef.current}`;
    const naturePath = GOAL_BGS[idRef.current % GOAL_BGS.length];
    idRef.current += 1;
    setGoals((prev) => [
      { id, text: goalSentence(draft), deadlineLabel, naturePath, completed: false },
      ...prev,
    ]);
    setNewGoalId(id);
    go("success");
  };

  const markDone = (id: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, completed: true, doneLabel: `Done ${formatDate(new Date())}` } : g,
      ),
    );
    setBurstKey((k) => k + 1);
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startFlow = () => {
    setDraft("");
    go("name");
  };

  const closeToList = () => {
    setDraft("");
    setNewGoalId(null);
    go("list");
  };

  const newGoal = goals.find((g) => g.id === newGoalId) ?? null;
  const successGoal = newGoal ?? goals.find((g) => !g.completed) ?? DEMO_GOAL;

  return (
    <PhoneFrame themed>
      <div className="relative flex-1 flex flex-col text-white min-h-0">
        {step === "list" && (
          <ListView
            surface={surface}
            photo={photo}
            goals={goals}
            filter={filter}
            onFilter={setFilter}
            savedIds={savedIds}
            onToggleSave={toggleSave}
            burstKey={burstKey}
            onBack={() => navigate({ to: "/tools" })}
            onNew={startFlow}
            onMarkDone={markDone}
          />
        )}

        {step === "name" && (
          <NameView
            surface={surface}
            photo={photo}
            draft={draft}
            onDraft={setDraft}
            onBack={() => go("list")}
            onNext={() => go("timeframe")}
          />
        )}

        {step === "timeframe" && (
          <TimeframeView
            surface={surface}
            photo={photo}
            pickDate={pickerOpen}
            onPickDate={() => setPickerOpen(true)}
            onPreset={(days) => {
              const d = new Date();
              d.setDate(d.getDate() + days);
              createGoal(`till ${formatDate(d)}`);
            }}
            onBack={() => {
              setPickerOpen(false);
              go("name");
            }}
          />
        )}

        {step === "success" && (
          <SuccessView
            photo={photo}
            goal={successGoal}
            burstKey={burstKey}
            saved={savedIds.has(successGoal.id)}
            onToggleSave={() => toggleSave(successGoal.id)}
            onMarkDone={() => markDone(successGoal.id)}
            onClose={closeToList}
            surface={surface}
          />
        )}

        <NativeDatePicker
          open={pickerOpen && step === "timeframe"}
          initial={new Date()}
          onCancel={() => setPickerOpen(false)}
          onConfirm={(d) => {
            setPickerOpen(false);
            createGoal(`till ${formatDate(d)}`);
          }}
        />
      </div>
    </PhoneFrame>
  );
}

// ─── List + empty state ───────────────────────────────────────────────────────

function ListView({
  surface,
  photo,
  goals,
  filter,
  onFilter,
  savedIds,
  onToggleSave,
  burstKey,
  onBack,
  onNew,
  onMarkDone,
}: {
  surface: "dark" | "light";
  photo: Parameters<typeof YunaAvatar>[0]["variant"];
  goals: Goal[];
  filter: Filter;
  onFilter: (f: Filter) => void;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  burstKey: number;
  onBack: () => void;
  onNew: () => void;
  onMarkDone: (id: string) => void;
}) {
  const hasGoals = goals.length > 0;
  const shown = goals.filter((g) => (filter === "active" ? !g.completed : g.completed));

  return (
    <div className="flex-1 flex flex-col px-6 pb-10 yuna-fade-in min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <header className="shrink-0 pt-14">
        <Button surface={surface} variant="secondary" size="icon" aria-label="Back" onClick={onBack}>
          <ChevronLeft strokeWidth={1.5} />
        </Button>
      </header>

      <div
        className={
          "flex flex-col items-center text-center " +
          (hasGoals ? "mt-4" : "flex-1 justify-center")
        }
      >
        <YunaAvatar variant={photo} size={64} />
        <h1 className="mt-5 font-display text-3xl tracking-tight text-white">Set your next goal!</h1>
        <p className="mt-2 max-w-[17rem] text-sm leading-snug text-white/80">
          Reaching goals helps build self-confidence and improves how we see ourselves.
        </p>
        <div className="mt-6">
          <Button surface={surface} variant="primary" onClick={onNew}>
            Set new goal
          </Button>
        </div>
      </div>

      {hasGoals && (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl tracking-tight text-white">Your Goals</h2>
            <SegmentedToggle
              size="sm"
              surface={surface}
              ariaLabel="Filter goals"
              value={filter}
              onChange={onFilter}
              options={FILTER_OPTIONS}
            />
          </div>

          {shown.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-4">
              {shown.map((g) => (
                <li key={g.id}>
                  <GoalCard
                    goal={g}
                    isSaved={savedIds.has(g.id)}
                    onToggleSave={() => onToggleSave(g.id)}
                    onMarkDone={() => onMarkDone(g.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-center text-sm text-white/60">
              {filter === "active" ? "No active goals yet." : "No completed goals yet."}
            </p>
          )}
        </section>
      )}

      {burstKey > 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Confetti key={burstKey} />
        </div>
      )}
    </div>
  );
}

// ─── Goal card ─────────────────────────────────────────────────────────────────
// The DS content Card (photo tile): "Your goal" eyebrow + 3-dot, centered italic
// quote body, and a footer with save/share + the Mark-as-done CTA.

function GoalCard({
  goal,
  isSaved,
  onToggleSave,
  onMarkDone,
}: {
  goal: Goal;
  isSaved: boolean;
  onToggleSave: () => void;
  onMarkDone: () => void;
}) {
  return (
    <Card tone="dark" naturePath={goal.naturePath} completed={goal.completed}>
      <CardHeader meta={{ label: "Your goal", tone: "dark" }} onMore={() => {}} />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        <p className="font-display text-2xl italic leading-snug tracking-tight text-white max-w-[16rem]">
          {[goalSentence(goal.text), goal.deadlineLabel].filter(Boolean).join(" ")}
        </p>
      </div>
      <CardFooter
        isSaved={isSaved}
        onToggleSave={onToggleSave}
        primary={
          goal.completed ? (
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-white/80">
              {goal.doneLabel}
            </span>
          ) : (
            <CardCTA tone="dark" onClick={onMarkDone}>
              Mark as done
            </CardCTA>
          )
        }
      />
    </Card>
  );
}

// ─── Shared flow shell (hero padding + back arrow) ──────────────────────────────

function FlowShell({
  surface,
  onBack,
  children,
}: {
  surface: "dark" | "light";
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col px-8 pt-14 pb-10 yuna-fade-in min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {onBack && (
        <header className="shrink-0">
          <Button surface={surface} variant="secondary" size="icon" aria-label="Back" onClick={onBack}>
            <ChevronLeft strokeWidth={1.5} />
          </Button>
        </header>
      )}
      {children}
    </div>
  );
}

// ─── Step: name the goal ────────────────────────────────────────────────────────

function NameView({
  surface,
  photo,
  draft,
  onDraft,
  onBack,
  onNext,
}: {
  surface: "dark" | "light";
  photo: Parameters<typeof YunaAvatar>[0]["variant"];
  draft: string;
  onDraft: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <FlowShell surface={surface} onBack={onBack}>
      <div className="flex-1 flex flex-col items-center text-center pt-2">
        <YunaAvatar variant={photo} size={96} />
        <h1 className="mt-8 font-display text-3xl tracking-tight text-white">What is your goal?</h1>
        <div className="mt-8 w-full">
          <TextField
            surface={surface}
            size="lg"
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            placeholder="Example: I want to read a book"
            aria-label="Your goal"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) onNext();
            }}
          />
        </div>
        <div className="mt-8 w-full">
          <Button
            surface={surface}
            variant="primary"
            fullWidth
            disabled={!draft.trim()}
            onClick={onNext}
          >
            Next step
          </Button>
        </div>
      </div>
    </FlowShell>
  );
}

// ─── Step: choose timeframe ─────────────────────────────────────────────────────

function TimeframeView({
  surface,
  photo,
  pickDate,
  onPickDate,
  onPreset,
  onBack,
}: {
  surface: "dark" | "light";
  photo: Parameters<typeof YunaAvatar>[0]["variant"];
  pickDate: boolean;
  onPickDate: () => void;
  onPreset: (days: number) => void;
  onBack: () => void;
}) {
  return (
    <FlowShell surface={surface} onBack={onBack}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <YunaAvatar variant={photo} size={96} />
        <h1 className="mt-8 font-display text-2xl tracking-tight text-white">How long to reach it?</h1>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {TIMEFRAMES.map((tf) => (
            <Tag key={tf.id} surface={surface} onClick={() => onPreset(tf.days)}>
              {tf.label} <span aria-hidden>{tf.emoji}</span>
            </Tag>
          ))}
          <Tag surface={surface} selected={pickDate} onClick={onPickDate}>
            Pick date <span aria-hidden>⏰</span>
          </Tag>
        </div>
      </div>
    </FlowShell>
  );
}

// ─── Step: success ──────────────────────────────────────────────────────────────

function SuccessView({
  surface,
  photo,
  goal,
  burstKey,
  saved,
  onToggleSave,
  onMarkDone,
  onClose,
}: {
  surface: "dark" | "light";
  photo: Parameters<typeof YunaAvatar>[0]["variant"];
  goal: Goal;
  burstKey: number;
  saved: boolean;
  onToggleSave: () => void;
  onMarkDone: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col px-8 pt-14 pb-10 yuna-fade-in min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex-1 flex flex-col items-center text-center">
        <div className="relative inline-flex items-center justify-center">
          <Confetti key={burstKey} />
          <YunaAvatar variant={photo} size={96} />
        </div>
        <h1 className="mt-6 font-display text-3xl leading-tight tracking-tight text-white max-w-[16rem]">
          Great! Your new goal has been created!
        </h1>
        <div className="mt-7 w-full">
          <GoalCard
            goal={goal}
            isSaved={saved}
            onToggleSave={onToggleSave}
            onMarkDone={onMarkDone}
          />
        </div>
      </div>

      <div className="shrink-0 pt-8">
        <Button surface={surface} variant="primary" fullWidth onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
