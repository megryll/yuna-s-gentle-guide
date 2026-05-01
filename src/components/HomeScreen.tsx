import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { YunaMark } from "@/components/YunaMark";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import { getAvatar } from "@/lib/yuna-session";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";
import { FIRST_TIME_SUGGESTIONS } from "@/components/SuggestionChips";

const firstTimeSuggestions = FIRST_TIME_SUGGESTIONS;

type FollowUp = {
  eyebrow?: string;
  title: string;
};

const followUps: FollowUp[] = [
  {
    eyebrow: "a topic for you",
    title: "Your Experience of Grief",
  },
  {
    eyebrow: "continue our conversation",
    title: "Staying Present in the Evenings",
  },
  {
    title: "Talk about something else",
  },
];

const activities = [
  { title: "Guided breath", note: "3 min · Meditation" },
  { title: "Set a small goal", note: "Goals" },
  { title: "Learn: name the feeling", note: "Skill · 4 min" },
];

export function HomeScreen({
  variant,
  showWelcome = false,
}: {
  variant: "new" | "returning";
  showWelcome?: boolean;
}) {
  const navigate = useNavigate();
  const [welcomeOpen, setWelcomeOpen] = useState(showWelcome);
  const [welcomeMuted, setWelcomeMuted] = useState(false);

  useEffect(() => {
    if (showWelcome) setWelcomeOpen(true);
  }, [showWelcome]);

  const returning = variant === "returning";

  const open = (initial: string) => {
    if (!initial.trim()) return;
    navigate({ to: "/chat", search: { q: initial } });
  };

  return (
    <ScreenChrome>
      <div className="flex-1 flex flex-col px-6 pb-4 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mt-6 yuna-rise">
          <h1 className="text-2xl leading-snug tracking-tight">
            {returning ? "Welcome back." : "Where shall we begin?"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-[18rem]">
            {returning ? "What should we dig into?" : "Pick a thread, or start one of your own."}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {returning
            ? followUps.map((f, i) => (
                <button
                  key={f.title}
                  onClick={() => open(f.title)}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="yuna-rise text-left rounded-2xl hairline px-5 py-4 hover:bg-accent transition-colors flex items-center gap-3"
                >
                  <span className="flex-1 min-w-0">
                    {f.eyebrow && (
                      <span className="block font-sans-ui text-[11px] text-muted-foreground mb-0.5">
                        {f.eyebrow}
                      </span>
                    )}
                    <span className="block text-sm leading-snug">{f.title}</span>
                  </span>
                  <Chevron />
                </button>
              ))
            : firstTimeSuggestions.map((s, i) => (
                <button
                  key={s}
                  onClick={() => open(s)}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="yuna-rise text-left rounded-2xl hairline px-5 py-4 hover:bg-accent transition-colors flex items-center gap-3"
                >
                  <span className="flex-1 text-sm leading-snug">{s}</span>
                  <Chevron />
                </button>
              ))}
        </div>

        {returning && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                Try an activity
              </p>
              <Button
                surface="light"
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/activities" })}
              >
                View all
              </Button>
            </div>
            <div className="-mx-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-3 px-6 pb-1">
                {activities.map((a) => (
                  <button
                    key={a.title}
                    onClick={() => open(a.title)}
                    className="shrink-0 w-44 text-left rounded-2xl hairline p-4 hover:bg-accent transition-colors"
                  >
                    <div className="h-16 rounded-lg hairline mb-3 flex items-center justify-center">
                      <YunaMark size={22} className="text-primary" />
                    </div>
                    <p className="text-sm leading-snug">{a.title}</p>
                    <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">
                      {a.note}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <Button
              surface="light"
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/progress" })}
              className="mt-3 self-start"
            >
              <span className="font-sans-ui">
                <span className="tabular-nums font-medium">8</span> completed today
              </span>
              <Chevron />
            </Button>
          </div>
        )}
      </div>
      {welcomeOpen && (
        <WelcomeTooltip
          muted={welcomeMuted}
          onToggleMute={() => setWelcomeMuted((m) => !m)}
          onDismiss={() => setWelcomeOpen(false)}
        />
      )}
    </ScreenChrome>
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
  const [avatar, setAvatar] = useState<AvatarVariant | null>(null);
  useEffect(() => {
    setAvatar(getAvatar());
  }, []);

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col justify-end items-end px-5 pb-24 yuna-fade-in"
      style={{ background: "rgba(0,0,0,0.32)" }}
      role="dialog"
      aria-label="Welcome"
      onClick={onDismiss}
    >
      <div
        className="yuna-rise relative rounded-3xl bg-background p-5 shadow-xl w-full max-w-[20rem]"
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

function SpeakerOnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 9v6h4l5 4V5L9 9H5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M17 8c1.5 1.5 1.5 6.5 0 8M19.5 5c3 3 3 11 0 14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 9v6h4l5 4V5L9 9H5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="text-muted-foreground shrink-0"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
