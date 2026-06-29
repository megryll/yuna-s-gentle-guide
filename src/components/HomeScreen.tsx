import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Ban, Bookmark, ChevronRight, LayoutGrid, List, Menu } from "lucide-react";
import { useYunaIdentity } from "@/lib/yuna-session";
import { useAppMode } from "@/lib/theme-prefs";
import { DEFAULT_VOICE, VOICES } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { IconMedallion } from "@/components/IconMedallion";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  setSessionIllinois,
  useSessionIllinois,
  useSessionScheduleSession,
} from "@/lib/session-dev";
import { SuggestionChip } from "@/components/SuggestionChip";
import { YunaAvatar } from "@/components/YunaAvatar";
import { SegmentedToggle, type SegmentedToggleOption } from "@/components/SegmentedToggle";
import { RatingScale } from "@/components/RatingScale";
import { HomeCardItem, HomeCardRow } from "@/components/HomeCards";
import { HOME_CARDS, KIND_PLURAL, type HomeCard } from "@/lib/home-cards";
import { CardActionsDrawer } from "@/components/CardActionsDrawer";
import { Toast, ToastViewport } from "@/components/Toast";
import { Confetti } from "@/components/Confetti";
import { Divider } from "@/components/Divider";
import { setContentPref, useContentPrefs } from "@/lib/content-prefs";
import { getCompletedQuestionnaireIds } from "@/lib/questionnaire-state";
import { startAmbient } from "@/lib/ambient-audio";
import { useStartChat } from "@/lib/chat-launch";
import { FirstSessionDisclaimerGate } from "@/components/FirstSessionDisclaimers";
import { SchedulePrioritizeGate } from "@/components/SchedulePrioritizeDrawer";
import { ScheduleSessionDrawer } from "@/components/ScheduleSessionDrawer";

const WELCOME_AUDIO_TEXT =
  "Welcome in. Take a look around. I'll be here when you're ready to chat.";

const PRIMARY_SUGGESTION = { label: "Chat Now", primary: true } as const;

// Rotating home greeting — a fresh title/subtitle each page load. Picked on
// mount (see useState/useEffect below) so it varies on every reload without a
// server/client hydration mismatch.
const RETURNING_GREETINGS: { title: (name: string | null) => string; sub: string }[] = [
  { title: (n) => (n ? `Welcome back, ${n}.` : "Welcome back."), sub: "What should we dig into?" },
  { title: (n) => (n ? `Good to see you, ${n}.` : "Good to see you."), sub: "Where should we start today?" },
  { title: () => "Let's pick up where we left off.", sub: "What's on your mind right now?" },
  { title: (n) => (n ? `Hi ${n}.` : "Hi there."), sub: "Take a breath. I'm here when you're ready." },
  { title: () => "Glad you're here.", sub: "What would feel good to talk through today?" },
  { title: () => "However today is going,", sub: "we can take it one step at a time." },
];

// Headlines drop a trailing period (they read as a greeting, not a sentence),
// but keep a comma, exclamation, question mark, or ellipsis. Applied at render
// so the underlying copy stays intact for TTS pacing.
const stripHeadlinePeriod = (s: string) =>
  s.endsWith(".") && !s.endsWith("...") ? s.slice(0, -1) : s;

// Source feed for both user types. New users see the full authored list; the
// returning-user view (see `cards` below) drops the onboarding starting-point
// card and floats New items to the top.
const POST_INTRO_CARDS = HOME_CARDS;

// Returning users land with a few tasks already behind them — these drop under
// the "Completed Today" divider so the feed reflects an in-progress day rather
// than a blank slate. (New users' day is genuinely empty.)
const RETURNING_COMPLETED = ["please-technique", "strength-overcome", "feeling-check"];

export function HomeScreen({
  variant,
  showWelcome = false,
}: {
  variant: "new" | "returning";
  showWelcome?: boolean;
}) {
  const navigate = useNavigate();
  const startChat = useStartChat();
  const { name, voice, avatar } = useYunaIdentity();
  const [greetIdx, setGreetIdx] = useState(0);
  useEffect(() => {
    setGreetIdx(Math.floor(Math.random() * RETURNING_GREETINGS.length));
  }, []);
  const greeting = RETURNING_GREETINGS[greetIdx];
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [savedOnly, setSavedOnly] = useState(false);
  const cards = useMemo(() => {
    // A brand-new user's feed is new in its entirety, so per-card "New" flags
    // carry no signal — strip them. Pin the starting-point questionnaire to the
    // very top (their natural first step), and drop the other questionnaire
    // (Sleep, Stress & Burnout) so onboarding has a single, unambiguous baseline.
    if (variant !== "returning") {
      const stripped = POST_INTRO_CARDS.filter((c) => c.id !== "sleep-stress-burnout").map((c) => ({
        ...c,
        isNew: false,
      }));
      return [
        ...stripped.filter((c) => c.id === "your-starting-point"),
        ...stripped.filter((c) => c.id !== "your-starting-point"),
      ];
    }
    // Returning users have already set their starting point, so drop that card,
    // and float anything flagged New to the top (stable within each group).
    const kept = POST_INTRO_CARDS.filter((c) => c.id !== "your-starting-point");
    return [...kept.filter((c) => c.isNew), ...kept.filter((c) => !c.isNew)];
  }, [variant]);
  const initialSavedIds = useMemo(
    () => new Set(cards.filter((c) => c.isSaved).map((c) => c.id)),
    [cards],
  );
  const [savedIds, setSavedIds] = useState<Set<string>>(initialSavedIds);
  const toggleSave = (id: string) =>
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Completed cards drop under the "Completed Today" divider (faded + a check
  // badge); dismissed cards leave the feed. All of it is session-local, like
  // saves; finished questionnaires live in the shared in-memory store and are
  // merged in after mount so the server and first client render agree.
  const [completedIds, setCompletedIds] = useState<Set<string>>(() =>
    variant === "returning" ? new Set(RETURNING_COMPLETED) : new Set(),
  );
  useEffect(() => {
    const done = getCompletedQuestionnaireIds();
    if (done.length) setCompletedIds((prev) => new Set([...prev, ...done]));
  }, []);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [menuCard, setMenuCard] = useState<HomeCard | null>(null);

  // Dev state (EngineerSidebar "States"): the Illinois service-limitation
  // takeover, with a secondary "verify your location" step layered over it.
  const illinois = useSessionIllinois();
  const [verifyLocationOpen, setVerifyLocationOpen] = useState(false);
  // Each fresh open starts on the takeover; leave the flag alone while closing.
  useEffect(() => {
    if (illinois) setVerifyLocationOpen(false);
  }, [illinois]);

  // "Schedule a session" dev state: relabels the top Upgrade pill and opens a
  // scheduling drawer. The drawer auto-opens when the state turns on; dismissing
  // it leaves the relabeled pill, which reopens it.
  const scheduleSessionState = useSessionScheduleSession();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  useEffect(() => {
    if (scheduleSessionState) setScheduleOpen(true);
  }, [scheduleSessionState]);

  // Top-pinned confirmation toast — a neutral "stop seeing" confirmation, or a
  // success congratulation when a goal is marked done.
  const surface = useAppMode() === "light" ? "light" : "dark";
  const [toast, setToast] = useState<{
    message: string;
    variant: "neutral" | "success";
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string, variant: "neutral" | "success" = "neutral") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, variant });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };
  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  // Bumped on each goal completion to replay the confetti cascade.
  const [burstKey, setBurstKey] = useState(0);
  const completeGoal = (card: HomeCard) => {
    // Already under "Completed Today" — re-tapping shouldn't re-celebrate.
    if (completedIds.has(card.id)) return;
    setCompletedIds((prev) => new Set(prev).add(card.id));
    setBurstKey((k) => k + 1);
    showToast("Goal complete. Way to follow through.", "success");
  };

  const toggleComplete = () => {
    if (!menuCard) return;
    const id = menuCard.id;
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMenuCard(null);
  };
  const dismissCard = () => {
    if (!menuCard) return;
    setDismissedIds((prev) => new Set(prev).add(menuCard.id));
    setMenuCard(null);
  };
  const stopSeeing = () => {
    if (!menuCard) return;
    setContentPref(menuCard.type, false);
    showToast(`You'll stop seeing ${KIND_PLURAL[menuCard.type]}.`);
    setMenuCard(null);
  };
  const managePreferences = () => {
    setMenuCard(null);
    navigate({ to: "/settings/content-preferences" });
  };

  useWelcomeAudio(showWelcome, voice);

  // Catch the case where the user arrives from /chat — chat pauses the
  // singleton in favor of its own per-mount bed. The root controller only
  // reacts to pref changes, so kick the bed back on here. No-op when it's
  // already playing or the pref is off (startAmbient checks both).
  useEffect(() => {
    startAmbient();
  }, []);

  const returning = variant === "returning";

  const open = (initial: string) => {
    if (!initial.trim()) return;
    // Chat Now is the first-session entry — it routes straight into voice mode
    // (matching the AppBar chat icon). Other openers (card prompts) still drop
    // into text mode so the user can see Yuna's reply before committing to a call.
    const search =
      initial.trim().toLowerCase() === "chat now"
        ? { q: initial, mode: "voice" as const }
        : { q: initial };
    startChat(search);
  };

  return (
    <PhoneFrame backgroundImage="/background.png" themed>
      <div className="relative flex-1 flex flex-col text-white min-h-0">
        {toast && (
          <ToastViewport>
            <Toast
              variant={toast.variant}
              surface={surface}
              message={toast.message}
              onDismiss={() => setToast(null)}
            />
          </ToastViewport>
        )}
        {burstKey > 0 && (
          <div className="pointer-events-none absolute inset-0 z-[55] overflow-hidden">
            <Confetti key={burstKey} />
          </div>
        )}
        <div className="flex-1 flex flex-col px-6 pt-14 pb-6 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center justify-between -mx-1">
            <div className="flex items-center gap-2">
              <Button
                surface="dark"
                variant="secondary"
                size="xs"
                onClick={() =>
                  scheduleSessionState
                    ? setScheduleOpen(true)
                    : navigate({ to: "/design-your-trial" })
                }
              >
                {scheduleSessionState ? "Schedule a session" : "Upgrade"}
              </Button>
            </div>
            <Button
              surface="dark"
              variant="plain"
              size="icon-lg"
              onClick={() => navigate({ to: "/settings" })}
              aria-label="Open settings"
            >
              <MenuIcon />
            </Button>
          </div>

          <div className="mt-10 yuna-rise text-center">
            <h1 className="text-2xl leading-snug tracking-tight text-white">
              {stripHeadlinePeriod(returning ? greeting.title(name) : "Welcome in.")}
            </h1>
            <p className="mt-2 text-sm text-white/80 max-w-[18rem] mx-auto">
              {returning ? greeting.sub : "I'll be here when you're ready to chat."}
            </p>
          </div>

          <div className="mt-4 flex justify-center yuna-rise">
            <SuggestionChip
              onClick={() => open(PRIMARY_SUGGESTION.label)}
              leading={
                <span className="block shrink-0 -my-2 -ml-3">
                  <YunaAvatar variant={avatar ?? DEFAULT_VOICE} size={52} className="block" />
                </span>
              }
            >
              {PRIMARY_SUGGESTION.label}
            </SuggestionChip>
          </div>

          <CreatedForYou
            cards={cards}
            viewMode={viewMode}
            setViewMode={setViewMode}
            savedOnly={savedOnly}
            setSavedOnly={setSavedOnly}
            savedIds={savedIds}
            completedIds={completedIds}
            dismissedIds={dismissedIds}
            onToggleSave={toggleSave}
            onOpen={(c) => {
              // A goal card's only action is finishing it — "Mark as done"
              // completes the goal (toast + confetti), it doesn't open a
              // session. Book recos, skill articles, and gratitude prompts
              // open their own screens; every other card drops into chat
              // seeded with the card's prompt.
              if (c.type === "accountability") {
                completeGoal(c);
                return;
              }
              if (c.type === "book") {
                navigate({ to: "/book/$id", params: { id: c.id } });
                return;
              }
              if (c.type === "learn-skill") {
                navigate({ to: "/skill/$id", params: { id: c.id } });
                return;
              }
              if (c.type === "gratitude") {
                navigate({ to: "/gratitude" });
                return;
              }
              if (c.type === "self-discovery" && c.id === "your-starting-point") {
                navigate({ to: "/questionnaire/$id", params: { id: c.id } });
                return;
              }
              if (c.type === "guided-session") {
                // Carry the title into chat so the guided-session header
                // banner can remind the user which session they're in.
                startChat({ q: c.title, guided: c.title });
                return;
              }
              open(openPrompt(c));
            }}
            onOpenMenu={setMenuCard}
            showFeedback
            onViewAllCompleted={() => navigate({ to: "/completed-tasks" })}
          />
        </div>

        <AppBar surface={surface} />
      </div>
      <FirstSessionDisclaimerGate />
      <SchedulePrioritizeGate />
      <ScheduleSessionDrawer
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onSchedule={() => {
          setScheduleOpen(false);
          showToast("You scheduled a session.", "success");
        }}
      />
      <CardActionsDrawer
        card={menuCard}
        completed={!!menuCard && completedIds.has(menuCard.id)}
        onOpenChange={(o) => {
          if (!o) setMenuCard(null);
        }}
        onToggleComplete={toggleComplete}
        onDismiss={dismissCard}
        onStopSeeing={stopSeeing}
        onManagePreferences={managePreferences}
      />

      {/* Illinois service-limitation takeover (EngineerSidebar "Illinois
          Limitations" dev state): a full-height drawer explaining Yuna is
          unavailable in Illinois, with a secondary "verify your location" step
          layered over it. Authored white-on-dark; the drawer paints the mode
          photo and the shims invert it for light mode. */}
      <Drawer
        open={illinois}
        onOpenChange={(open) => {
          if (!open) setSessionIllinois(false);
        }}
      >
        <DrawerContent className="min-h-[92%]">
          <div className="flex flex-1 flex-col min-h-0 px-8 pt-8 pb-10">
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center text-center gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <IconMedallion size="xl">
                <Ban size={30} strokeWidth={1.8} className="text-alert-orange" aria-hidden />
              </IconMedallion>
              <DrawerTitle className="text-center text-balance">
                Yuna is unavailable in Illinois
              </DrawerTitle>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-white/85">
                <p>
                  Because of new legislation in Illinois banning AI mental health
                  support, we've been forced to end service and close off your
                  access to sessions with Yuna here.
                </p>
                <p>
                  Although sessions in any form are no longer available, you can
                  still explore and use other parts of the product, such as our
                  guided meditations and mindfulness resources.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-3 pt-6">
              <Button
                surface={surface}
                variant="primary"
                fullWidth
                onClick={() => setSessionIllinois(false)}
              >
                Go to wellness feed
              </Button>
              <Button
                surface={surface}
                variant="link"
                className="self-center text-center"
                onClick={() => setVerifyLocationOpen(true)}
              >
                Not in Illinois? Verify my location
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Verify-location step — a compact drawer layered over the takeover. */}
      <Drawer
        open={verifyLocationOpen}
        onOpenChange={(open) => {
          if (!open) setVerifyLocationOpen(false);
        }}
      >
        <DrawerContent>
          <div className="px-8 pt-6 flex flex-col items-center text-center gap-3">
            <DrawerTitle className="text-center text-balance">
              Verify your{" "}
              <span className={surface === "light" ? "text-primary-green" : "text-secondary-green"}>
                location
              </span>
            </DrawerTitle>
            <p className="text-base text-white/80">
              Use your device location services to verify your current location.
              We will not store your location data.
            </p>
          </div>
          <DrawerFooter className="px-8 pb-8 pt-6">
            <Button
              surface={surface}
              variant="primary"
              fullWidth
              onClick={() => {
                setVerifyLocationOpen(false);
                setSessionIllinois(false);
              }}
            >
              Verify my location
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PhoneFrame>
  );
}

// Fires the welcome TTS when the home page mounts with showWelcome AND
// the intro flow set the `yuna.welcome-pending` sessionStorage flag right
// before navigating here. The flag is consumed (deleted) on first read so
// intra-session re-navigations to /home don't replay the line, while every
// fresh intro completion gets its own greeting.

function useWelcomeAudio(enabled: boolean, voice: string | null) {
  useEffect(() => {
    if (!enabled || !voice) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("yuna.welcome-pending") !== "1") return;
    // Consume the flag synchronously so a strict-mode / dep-change re-run of
    // this effect bails here instead of kicking off a second fetch. The flag
    // is the only dedupe mechanism — we deliberately do NOT cancel the
    // in-flight play on cleanup, because the cleanup fires on the same
    // double-invoke and would race the fetch resolution out of ever playing.
    window.sessionStorage.removeItem("yuna.welcome-pending");
    const cfg = VOICES[voice as keyof typeof VOICES];
    if (!cfg) return;
    (async () => {
      try {
        const url = await fetchTtsBlobUrl(cfg.elevenlabsId, WELCOME_AUDIO_TEXT);
        const el = new Audio(url);
        await el.play();
      } catch {
        // Prototype: silent fallback if TTS or autoplay fails.
      }
    })();
  }, [enabled, voice]);
}

function CreatedForYou({
  cards,
  viewMode,
  setViewMode,
  savedOnly,
  setSavedOnly,
  savedIds,
  completedIds,
  dismissedIds,
  onToggleSave,
  onOpen,
  onOpenMenu,
  showFeedback,
  onViewAllCompleted,
}: {
  cards: HomeCard[];
  viewMode: "card" | "list";
  setViewMode: (m: "card" | "list") => void;
  savedOnly: boolean;
  setSavedOnly: (v: boolean) => void;
  savedIds: Set<string>;
  completedIds: Set<string>;
  dismissedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onOpen: (c: HomeCard) => void;
  onOpenMenu: (c: HomeCard) => void;
  showFeedback: boolean;
  onViewAllCompleted: () => void;
}) {
  const surface = useAppMode() === "light" ? "light" : "dark";
  const prefs = useContentPrefs();
  // Drop dismissed cards and any kind the user has turned off in Content
  // Preferences (or via the card menu's "Stop seeing …").
  const base = cards.filter((c) => !dismissedIds.has(c.id) && prefs[c.type] !== false);
  const visible = savedOnly ? base.filter((c) => savedIds.has(c.id)) : base;
  const incomplete = visible.filter((c) => !completedIds.has(c.id));
  const done = visible.filter((c) => completedIds.has(c.id));

  const renderFeed = (list: HomeCard[]) => (
    <ul className={"flex flex-col " + (viewMode === "card" ? "gap-5" : "gap-4")}>
      {list.map((c, i) => (
        <li key={c.id} className="yuna-rise" style={{ animationDelay: `${i * 60}ms` }}>
          {viewMode === "card" ? (
            <HomeCardItem
              card={c}
              isSaved={savedIds.has(c.id)}
              completed={completedIds.has(c.id)}
              onClick={() => onOpen(c)}
              onMenu={() => onOpenMenu(c)}
              onToggleSave={() => onToggleSave(c.id)}
            />
          ) : (
            <HomeCardRow
              card={c}
              completed={completedIds.has(c.id)}
              onClick={() => onOpen(c)}
              onMenu={() => onOpenMenu(c)}
            />
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-uppercase tracking-[0.25em] uppercase text-white/70">Created For You</p>
        <div className="flex items-center gap-2">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <SavedToggle on={savedOnly} onClick={() => setSavedOnly(!savedOnly)} />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/25 bg-white/[0.04] px-4 py-6 text-center yuna-rise">
          <p className="text-sm text-white/80">No saved items yet</p>
          <p className="mt-1 text-xs text-white/60 leading-relaxed">
            Bookmark anything Yuna shares to keep it close.
          </p>
        </div>
      ) : (
        <>
          {renderFeed(incomplete)}
          {done.length > 0 && (
            <>
              <Divider surface={surface} label="Completed Today" className="mt-8 mb-3" />
              {renderFeed(done)}
              <div className="mt-4 flex justify-center">
                <Button
                  surface={surface}
                  variant="link"
                  onClick={onViewAllCompleted}
                  className="inline-flex items-center gap-1.5"
                >
                  All completed tasks
                  <ChevronRight size={16} strokeWidth={2} aria-hidden />
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {showFeedback && <ExperienceFeedback />}
    </div>
  );
}

// Emoji nudge down a hair so they read as vertically centered in the pill.
const Emoji = ({ children }: { children: string }) => (
  <span aria-hidden className="inline-block translate-y-[1.5px]">
    {children}
  </span>
);
const EXPERIENCE_FACES = [
  { value: "angry", content: <Emoji>😠</Emoji>, label: "Angry" },
  { value: "sad", content: <Emoji>😞</Emoji>, label: "Sad" },
  { value: "neutral", content: <Emoji>😐</Emoji>, label: "Neutral" },
  { value: "good", content: <Emoji>🙂</Emoji>, label: "Good" },
  { value: "great", content: <Emoji>😊</Emoji>, label: "Great" },
] as const;

function ExperienceFeedback() {
  const [picked, setPicked] = useState<(typeof EXPERIENCE_FACES)[number]["value"] | null>(null);
  const surface = useAppMode() === "light" ? "light" : "dark";
  const hasPick = picked !== null;
  return (
    <div className="mt-8 yuna-rise px-1 py-4 text-center text-white">
      <p className="font-display text-xl leading-snug tracking-tight max-w-[18rem] mx-auto">
        {hasPick ? "Thank you for sharing." : "What was your Yuna experience like today?"}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white/75">
        {hasPick ? "Your feedback helps us improve!" : "Our team reads every submission"}
      </p>
      <div className="mt-5 flex justify-center">
        <RatingScale
          surface={surface}
          size="lg"
          ariaLabel="What was your Yuna experience like today?"
          value={picked}
          onChange={setPicked}
          options={EXPERIENCE_FACES}
        />
      </div>
    </div>
  );
}

function openPrompt(c: HomeCard): string {
  switch (c.type) {
    case "guided-session":
    case "meditation":
    case "self-discovery":
    case "learn-skill":
      return c.title;
    case "gratitude":
      return c.prompt;
    case "affirmation":
      return c.quote;
    case "accountability":
      return c.goal;
    case "book":
      return `${c.title} by ${c.author}`;
  }
}

const VIEW_TOGGLE_OPTIONS: ReadonlyArray<SegmentedToggleOption<"card" | "list">> = [
  { value: "card", icon: <LayoutGrid size={13} strokeWidth={1.75} aria-hidden />, ariaLabel: "Card view" },
  { value: "list", icon: <List size={13} strokeWidth={1.75} aria-hidden />, ariaLabel: "List view" },
];

function ViewToggle({
  mode,
  onChange,
}: {
  mode: "card" | "list";
  onChange: (m: "card" | "list") => void;
}) {
  // Compact DS segmented toggle — surface flips with appMode so it reads as
  // one family with Chat's text/voice and Settings' light/dark toggles.
  const appMode = useAppMode();
  return (
    <SegmentedToggle
      size="sm"
      value={mode}
      onChange={onChange}
      surface={appMode === "dark" ? "dark" : "light"}
      ariaLabel="View mode"
      options={VIEW_TOGGLE_OPTIONS}
    />
  );
}

function SavedToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  // Enclosed round icon button: bordered (secondary) when off, flipping to the
  // filled primary circle when on. Surface follows appMode so it reads as one
  // family with ViewToggle.
  const appMode = useAppMode();
  return (
    <Button
      surface={appMode === "dark" ? "dark" : "light"}
      variant="secondary"
      size="icon-sm"
      pressed={on}
      onClick={onClick}
      aria-label={on ? "Show all activities" : "Show saved only"}
    >
      <Bookmark strokeWidth={1.75} fill={on ? "currentColor" : "none"} aria-hidden />
    </Button>
  );
}

function MenuIcon() {
  return <Menu size={22} strokeWidth={1.6} aria-hidden="true" />;
}
