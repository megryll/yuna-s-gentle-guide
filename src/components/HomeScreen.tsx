import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Menu, Volume2, VolumeX } from "lucide-react";
import { YunaMark } from "@/components/YunaMark";
import { YunaAvatar } from "@/components/YunaAvatar";
import { useYunaIdentity } from "@/lib/yuna-session";
import { VOICES } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppBar } from "@/components/AppBar";
import { AppMenuDrawer } from "@/components/AppMenuDrawer";
import { YunaHeaderTrigger } from "@/components/YunaHeaderTrigger";
import { Button } from "@/components/Button";
import { SuggestionChip } from "@/components/SuggestionChip";
import { PERSONALIZED_ACTIVITIES, PERSONALIZED_TOPICS } from "@/lib/activities";

const WELCOME_TOOLTIP_TEXT =
  "Welcome in. Take a look around — I'll be here when you're ready to chat.";

const NEW_USER_SUGGESTIONS = [
  "I have something specific to talk about",
  "Talk about pressure and perfectionism",
  "Learn how to come back to your breath",
] as const;

const RETURNING_SUGGESTIONS = [
  { label: "Start A New Chat", primary: true },
  { label: "Talk about pressure and perfectionism", primary: false },
  { label: "Learn how to come back to your breath", primary: false },
] as const;

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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (showWelcome) setWelcomeOpen(true);
  }, [showWelcome]);

  const returning = variant === "returning";

  const open = (initial: string) => {
    if (!initial.trim()) return;
    navigate({ to: "/chat", search: { q: initial } });
  };

  return (
    <PhoneFrame backgroundImage="/background.png">
      <div className="flex-1 flex flex-col text-white min-h-0">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 pt-14 pb-2 shrink-0">
          <div />
          <div className="justify-self-center">
            <YunaHeaderTrigger surface="dark" />
          </div>
          <div className="justify-self-end">
            <Button
              surface="dark"
              variant="ghost"
              size="icon-lg"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon />
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col px-6 pb-6 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mt-6 yuna-rise">
            <h1 className="text-2xl leading-snug tracking-tight text-white">
              {returning ? "Welcome back." : "Where shall we begin?"}
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
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/70">
                  Topics for you
                </p>
              </div>
              <div className="-mx-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory [scroll-padding-left:1.5rem]">
                <div className="flex gap-4 pl-6 pr-6 pb-2">
                  {PERSONALIZED_TOPICS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => open(t.title)}
                      className="snap-start shrink-0 w-[320px] text-left rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-4 active:bg-white/15 transition-colors flex items-center gap-3"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm leading-snug text-white">
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
                <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/70">
                  Activities for you
                </p>
                <Button
                  surface="dark"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/activities-returning" })}
                  className="-mr-4"
                >
                  View all
                </Button>
              </div>
              <div className="-mx-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory [scroll-padding-left:1.5rem]">
                <div className="flex gap-4 pl-6 pr-6 pb-2">
                  {PERSONALIZED_ACTIVITIES.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => open(a.title)}
                      className="snap-start shrink-0 w-[320px] text-left rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 active:bg-white/15 transition-colors flex items-start gap-3"
                    >
                      <span className="h-12 w-12 shrink-0 rounded-xl border border-white/25 flex items-center justify-center bg-white/15">
                        <YunaMark size={22} className="text-white" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-white/70">
                            {a.kind}
                            {a.duration ? ` · ${a.duration}` : ""}
                          </p>
                          {a.isNew && (
                            <span
                              className="font-sans-ui text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: "#66BA24" }}
                            >
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[15px] leading-snug font-medium text-white">
                          {a.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-white/75 italic">
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

        <AppBar surface="dark" />
      </div>

      <AppMenuDrawer open={menuOpen} onOpenChange={setMenuOpen} />

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

function MenuIcon() {
  return <Menu size={22} strokeWidth={1.6} aria-hidden="true" />;
}

function SpeakerOnIcon() {
  return <Volume2 size={16} strokeWidth={1.6} aria-hidden="true" />;
}

function SpeakerOffIcon() {
  return <VolumeX size={16} strokeWidth={1.6} aria-hidden="true" />;
}

function Chevron() {
  return (
    <ChevronRight
      size={14}
      strokeWidth={1.5}
      className="text-white/70 shrink-0"
    />
  );
}
