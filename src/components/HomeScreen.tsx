import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { YunaMark } from "@/components/YunaMark";
import { YunaAvatar } from "@/components/YunaAvatar";
import { useYunaIdentity } from "@/lib/yuna-session";
import { VOICES } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";
import { FIRST_TIME_SUGGESTIONS } from "@/components/SuggestionChips";
import { PERSONALIZED_ACTIVITIES, PERSONALIZED_TOPICS } from "@/lib/activities";

const WELCOME_TOOLTIP_TEXT =
  "Welcome in. Take a look around — I'll be here when you're ready to chat.";

const firstTimeSuggestions = FIRST_TIME_SUGGESTIONS;

type FollowUp = {
  eyebrow?: string;
  title: string;
};

const followUps: FollowUp[] = [
  {
    title: "Chat Now",
  },
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
      <div className="flex-1 flex flex-col px-6 pb-12 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                Topics for you
              </p>
            </div>
            {/* Topic cards match the visual language of the top follow-up
                buttons (text-only, no icon tile, eyebrow + title + chevron)
                so the section reads as "more like those" — distinct from
                the more substantial activity cards above. */}
            <div className="-mx-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory [scroll-padding-left:1.5rem]">
              <div className="flex gap-4 pl-6 pr-6 pb-2">
                {PERSONALIZED_TOPICS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => open(t.title)}
                    className="snap-start shrink-0 w-[320px] text-left rounded-2xl hairline px-5 py-4 hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm leading-snug">
                        {t.title}
                      </span>
                    </span>
                    <Chevron />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {returning && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                Activities for you
              </p>
              <Button
                surface="light"
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/activities-returning" })}
                className="-mr-4"
              >
                View all
              </Button>
            </div>
            {/* Cards mirror the activities-returning row layout (icon left,
                content right) but live in a horizontal scroll rail. Width
                is sized so only a small sliver of the next card shows from
                the right edge — enough to cue scroll without distracting. */}
            <div className="-mx-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory [scroll-padding-left:1.5rem]">
              <div className="flex gap-4 pl-6 pr-6 pb-2">
                {PERSONALIZED_ACTIVITIES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => open(a.title)}
                    className="snap-start shrink-0 w-[320px] text-left rounded-2xl hairline bg-card p-4 hover:bg-accent transition-colors flex items-start gap-3"
                  >
                    <span className="h-12 w-12 shrink-0 rounded-xl hairline flex items-center justify-center bg-accent/30">
                      <YunaMark size={22} className="text-primary" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                          {a.kind}
                          {a.duration ? ` · ${a.duration}` : ""}
                        </p>
                        {a.isNew && (
                          <span className="font-sans-ui text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-full bg-green-600 text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[15px] leading-snug font-medium">
                        {a.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground italic">
                        {a.why}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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
  const { avatar, voice } = useYunaIdentity();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Auto-play the tooltip text in the user's chosen voice on first appearance.
  // Honors the mute toggle. Browsers may block autoplay without a prior gesture
  // — the user's tap that opened this tooltip counts on most platforms.
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
