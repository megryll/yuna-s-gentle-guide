import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, LayoutGrid, List, Menu } from "lucide-react";
import { useYunaIdentity } from "@/lib/yuna-session";
import { useAppMode } from "@/lib/theme-prefs";
import { VOICES } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { SuggestionChip } from "@/components/SuggestionChip";
import { HomeCardItem, HomeCardRow } from "@/components/HomeCards";
import { HOME_CARDS, type HomeCard } from "@/lib/home-cards";

const WELCOME_AUDIO_TEXT =
  "Welcome in. Take a look around — I'll be here when you're ready to chat.";

const PRIMARY_SUGGESTION = { label: "Chat Now", primary: true } as const;

// First card is the "An introductory session" guided-session — the only card
// a brand-new user sees, and intentionally skipped in the returning feed so
// it doesn't sit beneath richer, personalized content.
const INTRO_CARD = HOME_CARDS[0];
const POST_INTRO_CARDS = HOME_CARDS.slice(1);

export function HomeScreen({
  variant,
  showWelcome = false,
}: {
  variant: "new" | "returning";
  showWelcome?: boolean;
}) {
  const navigate = useNavigate();
  const { name, voice } = useYunaIdentity();
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [savedOnly, setSavedOnly] = useState(false);
  const cards = variant === "new" ? [INTRO_CARD] : POST_INTRO_CARDS;
  const initialSavedIds = useMemo(
    () =>
      new Set(cards.filter((c) => c.isSaved).map((c) => c.id)),
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
    navigate({ to: "/chat", search });
  };

  return (
    <PhoneFrame backgroundImage="/background.png" themed>
      <div className="flex-1 flex flex-col text-white min-h-0">
        <div className="flex-1 flex flex-col px-6 pt-14 pb-6 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex justify-end -mr-1">
            <Button
              surface="dark"
              variant="ghost"
              size="icon-lg"
              onClick={() => navigate({ to: "/settings" })}
              aria-label="Open settings"
            >
              <MenuIcon />
            </Button>
          </div>

          <div className="mt-2 yuna-rise">
            <h1 className="text-2xl leading-snug tracking-tight text-white">
              {returning
                ? name
                  ? `Welcome back, ${name}.`
                  : "Welcome back."
                : "Welcome in."}
            </h1>
            <p className="mt-2 text-sm text-white/80 max-w-[18rem]">
              {returning
                ? "What should we dig into?"
                : "I'll be here when you're ready to chat."}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <div className="yuna-rise">
              <SuggestionChip
                variant="primary"
                onClick={() => open(PRIMARY_SUGGESTION.label)}
              >
                {PRIMARY_SUGGESTION.label}
              </SuggestionChip>
            </div>
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
    </PhoneFrame>
  );
}

// Fires the welcome TTS once when the home page mounts with showWelcome.
// The visual popup that previously paired with this audio is gone; the
// greeting now lives in the home header copy itself.
function useWelcomeAudio(enabled: boolean, voice: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !voice) return;
    let cancelled = false;
    const cfg = VOICES[voice as keyof typeof VOICES];
    if (!cfg) return;
    (async () => {
      try {
        const url = await fetchTtsBlobUrl(cfg.elevenlabsId, WELCOME_AUDIO_TEXT);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        blobUrlRef.current = url;
        const el = new Audio(url);
        audioRef.current = el;
        await el.play();
      } catch {
        // Prototype: silent fallback if TTS or autoplay fails.
      }
    })();
    return () => {
      cancelled = true;
      audioRef.current?.pause();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
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
    <div className="mt-10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[10px] tracking-[0.25em] uppercase text-white/70">
          Created For You
        </p>
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
            <li
              key={c.id}
              className="yuna-rise"
              style={{ animationDelay: `${i * 60}ms` }}
            >
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

  return (
    <div className="mt-8 yuna-rise px-1 py-4 text-center text-white">
      <p className="font-display text-[20px] leading-snug tracking-tight max-w-[18rem] mx-auto">
        What was your Yuna experience like today?
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-white/75">
        Our team reads every submission
      </p>
      <div className="mt-5 flex items-center justify-between gap-2 max-w-[18rem] mx-auto">
        {faces.map((emoji, i) => {
          const active = picked === i;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => setPicked(i)}
              aria-label={labels[i]}
              aria-pressed={active}
              className={
                "h-11 w-11 text-[26px] leading-none inline-flex items-center justify-center transition-opacity " +
                (active ? "opacity-100" : "opacity-80 active:opacity-100")
              }
            >
              <span aria-hidden>{emoji}</span>
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
      return `${c.title} — ${c.author}`;
  }
}

function ViewToggle({
  mode,
  onChange,
}: {
  mode: "card" | "list";
  onChange: (m: "card" | "list") => void;
}) {
  // Rail + active-pill styling mirrors `SegmentedToggle` (Settings light/dark,
  // Chat text/voice) so the three toggles read as one family. Surface flips
  // with appMode just like SegmentedToggle does in chat.
  const appMode = useAppMode();
  const isDark = appMode === "dark";
  const railClass = isDark
    ? "bg-black/15"
    : "border border-foreground/20 bg-background/60";
  const railStyle = isDark
    ? { border: "1px solid rgba(255,255,255,0.25)" }
    : undefined;
  return (
    <div
      role="group"
      aria-label="View mode"
      style={railStyle}
      className={
        "inline-flex items-center rounded-full backdrop-blur-sm h-8 p-0.5 " +
        railClass
      }
    >
      <ToggleSegmentButton
        active={mode === "card"}
        isDark={isDark}
        onClick={() => onChange("card")}
        aria-label="Card view"
      >
        <LayoutGrid size={13} strokeWidth={1.75} aria-hidden />
      </ToggleSegmentButton>
      <ToggleSegmentButton
        active={mode === "list"}
        isDark={isDark}
        onClick={() => onChange("list")}
        aria-label="List view"
      >
        <List size={13} strokeWidth={1.75} aria-hidden />
      </ToggleSegmentButton>
    </div>
  );
}

function ToggleSegmentButton({
  active,
  isDark,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
  isDark: boolean;
}) {
  // Arbitrary hex values match SegmentedToggle's segments so the active pill
  // is fully opaque ink in light mode and fully opaque white in dark mode.
  const activeClass = isDark
    ? "bg-[#ffffff] text-[#1D1F25]"
    : "bg-[#1D1F25] text-[#ffffff]";
  const inactiveClass = isDark
    ? "text-white active:bg-white/10"
    : "text-foreground/75 active:bg-foreground/10";
  return (
    <button
      type="button"
      aria-pressed={active}
      className={
        "inline-flex items-center justify-center h-7 w-7 rounded-full transition-colors " +
        (active ? activeClass : inactiveClass)
      }
      {...rest}
    >
      {children}
    </button>
  );
}

function SavedToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={on ? "Show all activities" : "Show saved only"}
      className={
        "inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors " +
        (on
          ? "bg-white text-neutral-900"
          : "border border-white/25 text-white/75 active:bg-white/10")
      }
    >
      <Bookmark
        size={14}
        strokeWidth={1.75}
        fill={on ? "currentColor" : "none"}
        aria-hidden
      />
    </button>
  );
}

function MenuIcon() {
  return <Menu size={22} strokeWidth={1.6} aria-hidden="true" />;
}

