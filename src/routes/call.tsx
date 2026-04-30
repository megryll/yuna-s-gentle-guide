import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import { getAvatar } from "@/lib/yuna-session";
import { YunaSettingsDrawer } from "@/components/YunaSettingsDrawer";

export const Route = createFileRoute("/call")({
  validateSearch: (s: Record<string, unknown>) => ({
    voice: (s.voice as string) ?? "Aria",
    returnTo: (s.returnTo as string) ?? "home",
  }),
  head: () => ({
    meta: [
      { title: "Calling Yuna" },
      { name: "description", content: "A voice call with Yuna." },
    ],
  }),
  component: CallScreen,
});

function CallScreen() {
  const { voice, returnTo } = Route.useSearch();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<AvatarVariant | null>(null);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const startedRef = useRef<number>(Date.now());

  useEffect(() => {
    setAvatar(getAvatar());
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const endCall = () => {
    if (returnTo === "chat") {
      navigate({
        to: "/chat",
        search: {
          q: "",
          callEnded: String(Date.now()),
          callDuration: String(seconds),
        },
      });
    } else {
      navigate({ to: "/home" });
    }
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col items-center px-8 pt-16 pb-12 yuna-fade-in">
        {/* Status row */}
        <div className="w-full flex items-center justify-between font-sans-ui text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Yuna settings"
            className="h-8 w-8 rounded-full hairline flex items-center justify-center hover:bg-accent transition-colors text-foreground"
          >
            <SettingsIcon />
          </button>
          <span>{mm}:{ss}</span>
        </div>

        {/* Avatar */}
        <div className="mt-20 relative h-44 w-44 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full hairline yuna-pulse-ring" />
          <span className="absolute inset-3 rounded-full hairline yuna-pulse-ring" style={{ animationDelay: "600ms" }} />
          <div className="relative h-32 w-32 rounded-full hairline flex items-center justify-center bg-background">
            {avatar
              ? <YunaAvatar variant={avatar} size={84} className="text-foreground" />
              : <span className="h-3 w-3 rounded-full bg-foreground" />}
          </div>
        </div>

        <div className="mt-10 text-center">
          <h1 className="text-xl tracking-tight">Yuna</h1>
          <p className="mt-1 font-sans-ui text-xs tracking-[0.2em] uppercase text-muted-foreground">
            Listening…
          </p>
        </div>

        {/* Controls */}
        <div className="mt-auto w-full grid grid-cols-3 gap-4 px-2">
          <CallButton
            label={muted ? "Unmute" : "Mute"}
            active={muted}
            onClick={() => setMuted((m) => !m)}
            icon={muted ? <MicOffIcon /> : <MicIcon />}
          />
          <CallButton
            label="Speaker"
            active={speaker}
            onClick={() => setSpeaker((s) => !s)}
            icon={<SpeakerIcon />}
          />
          <CallButton
            label="End Call"
            destructive
            onClick={endCall}
            icon={<EndIcon />}
          />
        </div>
      </div>
      <YunaSettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
      {/* Voice/started silenced refs */}
      <span className="hidden">{voice}{startedRef.current}</span>
    </PhoneFrame>
  );
}

function CallButton({
  label,
  icon,
  onClick,
  active,
  destructive,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  destructive?: boolean;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <span
        className={
          "h-14 w-14 rounded-full flex items-center justify-center transition-colors " +
          (destructive
            ? "bg-foreground text-background"
            : active
              ? "bg-foreground text-background"
              : "hairline bg-background hover:bg-accent")
        }
      >
        {icon}
      </span>
      <span className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </span>
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function MicOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 9v3a3 3 0 0 0 4.7 2.5M15 12V6a3 3 0 0 0-5.7-1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 11a7 7 0 0 0 11.6 5.3M19 11a7 7 0 0 1-.5 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function SpeakerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 10v4h4l5 4V6L8 10H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 9c1.2 1 1.2 5 0 6M19 6c2.5 2 2.5 10 0 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function EndIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 14c5-5 13-5 18 0l-2 2-3-1v-2a10 10 0 0 0-8 0v2l-3 1-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" transform="rotate(135 12 12)" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 19.4 9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}