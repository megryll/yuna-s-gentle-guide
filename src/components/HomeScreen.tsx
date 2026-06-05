import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, LayoutGrid, List, Menu } from "lucide-react";
import { useYunaIdentity } from "@/lib/yuna-session";
import { useAppMode } from "@/lib/theme-prefs";
import { DEFAULT_VOICE, VOICES } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { SuggestionChip } from "@/components/SuggestionChip";
import { YunaAvatar } from "@/components/YunaAvatar";
import { SegmentedToggle, type SegmentedToggleOption } from "@/components/SegmentedToggle";
import { HomeCardItem, HomeCardRow } from "@/components/HomeCards";
import { HOME_CARDS, type HomeCard } from "@/lib/home-cards";
import { startAmbient } from "@/lib/ambient-audio";
import { useStartChat } from "@/lib/chat-launch";
import { FirstSessionDisclaimerGate } from "@/components/FirstSessionDisclaimers";
import { SchedulePrioritizeGate } from "@/components/SchedulePrioritizeDrawer";

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

// The home feed is the same for new and returning users — only the greeting
// and the welcome audio differ by user type. HOME_CARDS[0] is the first
// check-in card, kept out of the feed (slice(1)) so it doesn't sit beneath the
// richer, personalized content.
const POST_INTRO_CARDS = HOME_CARDS.slice(1);

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
  const cards = POST_INTRO_CARDS;
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
      <div className="flex-1 flex flex-col text-white min-h-0">
        <div className="flex-1 flex flex-col px-6 pt-14 pb-6 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center justify-between -mx-1">
            <Button surface="dark" variant="secondary" size="xs" onClick={() => undefined}>
              Upgrade
            </Button>
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
              {returning ? greeting.title(name) : "Welcome in."}
            </h1>
            <p className="mt-2 text-sm text-white/80 max-w-[18rem] mx-auto">
              {returning ? greeting.sub : "I'll be here when you're ready to chat."}
            </p>
          </div>

          <div className="mt-4 flex justify-center yuna-rise">
            <SuggestionChip
              variant="primary"
              size="lg"
              fullWidth={false}
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
            onToggleSave={toggleSave}
            onOpen={(c) => open(openPrompt(c))}
            showFeedback={returning}
          />
        </div>

        <AppBar surface="dark" />
      </div>
      <FirstSessionDisclaimerGate />
      <SchedulePrioritizeGate />
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
  onToggleSave,
  onOpen,
  showFeedback,
}: {
  cards: HomeCard[];
  viewMode: "card" | "list";
  setViewMode: (m: "card" | "list") => void;
  savedOnly: boolean;
  setSavedOnly: (v: boolean) => void;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onOpen: (c: HomeCard) => void;
  showFeedback: boolean;
}) {
  const items = savedOnly ? cards.filter((c) => savedIds.has(c.id)) : cards;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] tracking-[0.25em] uppercase text-white/70">Created For You</p>
        <div className="flex items-center gap-2">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <SavedToggle on={savedOnly} onClick={() => setSavedOnly(!savedOnly)} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/25 bg-white/[0.04] px-4 py-6 text-center yuna-rise">
          <p className="text-sm text-white/80">No saved items yet</p>
          <p className="mt-1 text-xs text-white/60 leading-relaxed">
            Bookmark anything Yuna shares to keep it close.
          </p>
        </div>
      ) : (
        <ul className={"flex flex-col " + (viewMode === "card" ? "gap-5" : "gap-4")}>
          {items.map((c, i) => (
            <li key={c.id} className="yuna-rise" style={{ animationDelay: `${i * 60}ms` }}>
              {viewMode === "card" ? (
                <HomeCardItem
                  card={c}
                  isSaved={savedIds.has(c.id)}
                  onClick={() => {}}
                  onToggleSave={() => onToggleSave(c.id)}
                />
              ) : (
                <HomeCardRow card={c} onClick={() => {}} />
              )}
            </li>
          ))}
        </ul>
      )}

      {showFeedback && <ExperienceFeedback />}
    </div>
  );
}

function ExperienceFeedback() {
  const [picked, setPicked] = useState<number | null>(null);
  const faces = ["😠", "😞", "😐", "🙂", "😊"] as const;
  const labels = ["Angry", "Sad", "Neutral", "Good", "Great"] as const;

  const hasPick = picked !== null;
  return (
    <div className="mt-8 yuna-rise px-1 py-4 text-center text-white">
      <p className="font-display text-[20px] leading-snug tracking-tight max-w-[18rem] mx-auto">
        {hasPick ? "Thank you for sharing." : "What was your Yuna experience like today?"}
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-white/75">
        {hasPick ? "Your feedback helps us improve!" : "Our team reads every submission"}
      </p>
      <div className="mt-5 flex items-center justify-between gap-2 max-w-[18rem] mx-auto">
        {faces.map((emoji, i) => {
          const active = picked === i;
          const scaleClass = active ? "scale-150" : hasPick ? "scale-90" : "scale-100";
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => setPicked(i)}
              aria-label={labels[i]}
              aria-pressed={active}
              className="h-11 w-11 text-[26px] leading-none inline-flex items-center justify-center"
            >
              <span
                aria-hidden
                className={`inline-block transition-transform duration-200 ease-out ${scaleClass}`}
              >
                {emoji}
              </span>
            </button>
          );
        })}
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
