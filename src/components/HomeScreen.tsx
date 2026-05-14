import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  LayoutGrid,
  List,
  Menu,
  Volume2,
  VolumeX,
} from "lucide-react";
import { YunaMark } from "@/components/YunaMark";
import { YunaAvatar } from "@/components/YunaAvatar";
import { useYunaIdentity } from "@/lib/yuna-session";
import { VOICES } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { SuggestionChip } from "@/components/SuggestionChip";
import { HomeCardItem, HomeCardRow } from "@/components/HomeCards";
import { HOME_CARDS, type HomeCard } from "@/lib/home-cards";

const WELCOME_TOOLTIP_TEXT =
  "Welcome in. Take a look around — I'll be here when you're ready to chat.";

const NEW_USER_SUGGESTIONS = [
  "I want to talk about something specific.",
  "I want you to guide our first conversation.",
  "Tell me more about how Yuna works.",
] as const;

const RETURNING_SUGGESTIONS = [
  { label: "Start A New Chat", primary: true },
] as const;

export function HomeScreen({
  variant,
  showWelcome = false,
}: {
  variant: "new" | "returning";
  showWelcome?: boolean;
}) {
  const navigate = useNavigate();
  const { name } = useYunaIdentity();
  const [welcomeOpen, setWelcomeOpen] = useState(showWelcome);
  const [welcomeMuted, setWelcomeMuted] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [savedOnly, setSavedOnly] = useState(false);
  const initialSavedIds = useMemo(
    () =>
      new Set(HOME_CARDS.filter((c) => c.isSaved).map((c) => c.id)),
    [],
  );
  const [savedIds, setSavedIds] = useState<Set<string>>(initialSavedIds);
  const toggleSave = (id: string) =>
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    setWelcomeOpen(showWelcome);
  }, [showWelcome]);

  const returning = variant === "returning";

  const open = (initial: string) => {
    if (!initial.trim()) return;
    navigate({ to: "/chat", search: { q: initial } });
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
                : "Where shall we begin?"}
            </h1>
            <p className="mt-2 text-sm text-white/80 max-w-[18rem]">
              {returning
                ? "What should we dig into?"
                : "Pick a thread, or start one of your own."}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            {returning
              ? RETURNING_SUGGESTIONS.map((s, i) => (
                  <div
                    key={s.label}
                    className="yuna-rise"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <SuggestionChip
                      variant={s.primary ? "primary" : "filled"}
                      onClick={() => open(s.label)}
                    >
                      {s.label}
                    </SuggestionChip>
                  </div>
                ))
              : NEW_USER_SUGGESTIONS.map((s, i) => (
                  <div
                    key={s}
                    className="yuna-rise"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <SuggestionChip onClick={() => open(s)}>{s}</SuggestionChip>
                  </div>
                ))}
          </div>

          {returning && (
            <CreatedForYou
              viewMode={viewMode}
              setViewMode={setViewMode}
              savedOnly={savedOnly}
              setSavedOnly={setSavedOnly}
              savedIds={savedIds}
              onToggleSave={toggleSave}
              onOpen={(c) => open(openPrompt(c))}
            />
          )}
        </div>

        <AppBar surface="dark" />
      </div>

      {welcomeOpen && (
        <WelcomeTooltip
          muted={welcomeMuted}
          onToggleMute={() => setWelcomeMuted((m) => !m)}
          onDismiss={() => setWelcomeOpen(false)}
        />
      )}
    </PhoneFrame>
  );
}

function WelcomeTooltip({
  muted,
  onToggleMute,
  onDismiss,
}: {
  muted: boolean;
  onToggleMute: () => void;
  onDismiss: () => void;
}) {
  const { avatar, voice } = useYunaIdentity();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (muted) {
      audioRef.current?.pause();
      return;
    }
    let cancelled = false;
    if (!voice) return;
    const cfg = VOICES[voice];
    (async () => {
      try {
        if (!blobUrlRef.current) {
          blobUrlRef.current = await fetchTtsBlobUrl(
            cfg.elevenlabsId,
            WELCOME_TOOLTIP_TEXT,
          );
        }
        if (cancelled) return;
        const el = audioRef.current ?? new Audio();
        audioRef.current = el;
        el.src = blobUrlRef.current;
        el.currentTime = 0;
        await el.play();
      } catch (err) {
        console.error("Welcome TTS failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [muted, voice]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center px-5 yuna-fade-in"
      style={{ background: "rgba(0,0,0,0.32)" }}
      role="dialog"
      aria-label="Welcome"
      onClick={onDismiss}
    >
      <div
        className="yuna-rise relative rounded-3xl bg-popover text-popover-foreground p-5 shadow-xl w-full max-w-[20rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {avatar ? (
              <YunaAvatar variant={avatar} size={40} />
            ) : (
              <span className="h-10 w-10 rounded-full hairline flex items-center justify-center">
                <YunaMark size={20} className="text-foreground" />
              </span>
            )}
          </span>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[15px] font-semibold leading-snug">
              Welcome in.
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Take a look around, I'll be here when you're ready to chat.
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "Unmute Yuna" : "Mute Yuna"}
            aria-pressed={muted}
            className="h-8 w-8 rounded-full hairline flex items-center justify-center text-muted-foreground active:bg-accent transition-colors"
          >
            {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
          </button>
          <Button
            surface="light"
            variant="primary"
            size="sm"
            onClick={onDismiss}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreatedForYou({
  viewMode,
  setViewMode,
  savedOnly,
  setSavedOnly,
  savedIds,
  onToggleSave,
  onOpen,
}: {
  viewMode: "card" | "list";
  setViewMode: (m: "card" | "list") => void;
  savedOnly: boolean;
  setSavedOnly: (v: boolean) => void;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onOpen: (c: HomeCard) => void;
}) {
  const items = savedOnly
    ? HOME_CARDS.filter((c) => savedIds.has(c.id))
    : HOME_CARDS;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/70">
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
                  onClick={() => onOpen(c)}
                  onToggleSave={() => onToggleSave(c.id)}
                />
              ) : (
                <HomeCardRow card={c} onClick={() => onOpen(c)} />
              )}
            </li>
          ))}
        </ul>
      )}

      <ExperienceFeedback />
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
  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex items-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm h-8 p-0.5"
    >
      <ToggleSegmentButton
        active={mode === "card"}
        onClick={() => onChange("card")}
        aria-label="Card view"
      >
        <LayoutGrid size={13} strokeWidth={1.75} aria-hidden />
      </ToggleSegmentButton>
      <ToggleSegmentButton
        active={mode === "list"}
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
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={
        "inline-flex items-center justify-center h-7 w-7 rounded-full transition-colors " +
        (active
          ? "bg-white text-neutral-900"
          : "text-white/75 active:bg-white/10")
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
          : "border border-white/25 bg-white/10 backdrop-blur-sm text-white/75 active:bg-white/15")
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

function SpeakerOnIcon() {
  return <Volume2 size={16} strokeWidth={1.6} aria-hidden="true" />;
}

function SpeakerOffIcon() {
  return <VolumeX size={16} strokeWidth={1.6} aria-hidden="true" />;
}

