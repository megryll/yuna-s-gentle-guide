import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, Mic, PhoneCall } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaHeaderTrigger } from "@/components/YunaHeaderTrigger";
import { AppMenuDrawer } from "@/components/AppMenuDrawer";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { isDarkBg, useThemePrefs } from "@/lib/theme-prefs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * Shared chrome for primary app screens (Home, You, Activities, History, Progress).
 * Provides the header (menu / Yuna pill / call), the call dialog, the menu drawer,
 * and the bottom AppBar. Children render in the flex-1 body.
 *
 * Pass `hideHeader` for screens that own their own top section
 * (Activities, History, Progress).
 */
export function ScreenChrome({
  children,
  hideHeader = false,
  surface = "light",
}: {
  children: ReactNode;
  hideHeader?: boolean;
  surface?: "light" | "dark";
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [micState, setMicState] = useState<"idle" | "asking" | "granted" | "denied">("idle");

  const openCall = () => {
    setMicState("idle");
    setMicOpen(true);
  };

  const requestMic = async () => {
    setMicState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState("granted");
      setMicOpen(false);
      navigate({ to: "/chat", search: { mode: "voice" } });
    } catch {
      setMicState("denied");
    }
  };

  const { mainBg } = useThemePrefs();
  // surface="dark" is the photo-bg cluster (Home/You/etc). When the user picks
  // Snowy, the photo turns light, so cards/buttons need surface="light" to
  // stay readable. Forest keeps the existing dark-photo styling.
  const effectiveSurface =
    surface === "dark" && isDarkBg(mainBg) ? "light" : surface;
  const isDark = surface === "dark";

  return (
    <PhoneFrame backgroundImage={isDark ? "/background.png" : undefined} themed={isDark}>
      <div className="flex-1 flex flex-col min-h-0">
        {!hideHeader && (
          <header className="grid grid-cols-3 items-center px-5 pt-14 pb-2 shrink-0">
            <div className="justify-self-start">
              <Button
                surface={effectiveSurface}
                variant="ghost"
                size="icon-lg"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
              >
                <MenuIcon />
              </Button>
            </div>
            <div className="justify-self-center">
              <YunaHeaderTrigger surface={effectiveSurface} />
            </div>
            <div className="justify-self-end">
              <Button
                surface={effectiveSurface}
                variant="ghost"
                size="icon-lg"
                onClick={openCall}
                aria-label="Call Yuna"
              >
                <PhoneCallIcon />
              </Button>
            </div>
          </header>
        )}

        <div className={"flex-1 flex flex-col min-h-0 " + (hideHeader ? "pt-14" : "")}>
          {children}
        </div>

        <AppBar surface={effectiveSurface} />
      </div>

      <AppMenuDrawer open={menuOpen} onOpenChange={setMenuOpen} />

      <Dialog open={micOpen} onOpenChange={setMicOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-tight">
              Allow microphone access
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Yuna needs to hear you to hold a conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="h-20 w-20 rounded-full hairline flex items-center justify-center">
              <MicLargeIcon />
            </div>
          </div>
          {micState === "denied" && (
            <p className="text-xs text-destructive text-center">
              Microphone blocked. Update your browser settings and try again.
            </p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              surface="light"
              variant="primary"
              fullWidth
              onClick={requestMic}
              disabled={micState === "asking"}
            >
              {micState === "asking" ? "Requesting…" : "Allow microphone"}
            </Button>
            <Button
              surface="light"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => setMicOpen(false)}
            >
              Not now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </PhoneFrame>
  );
}

function MenuIcon() {
  return <Menu size={22} strokeWidth={1.6} aria-hidden="true" />;
}

function PhoneCallIcon() {
  return (
    <PhoneCall
      size={22}
      strokeWidth={1.6}
      aria-hidden="true"
    />
  );
}

function MicLargeIcon() {
  return <Mic size={32} strokeWidth={1.5} />;
}
