import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaHeaderTrigger } from "@/components/YunaHeaderTrigger";
import { AppMenuDrawer } from "@/components/AppMenuDrawer";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
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
}: {
  children: ReactNode;
  hideHeader?: boolean;
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
      navigate({ to: "/call", search: {} });
    } catch {
      setMicState("denied");
    }
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col min-h-0">
        {!hideHeader && (
          <header className="grid grid-cols-3 items-center px-5 pt-14 pb-2 shrink-0">
            <div className="justify-self-start">
              <Button
                surface="light"
                variant="ghost"
                size="icon-lg"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
              >
                <MenuIcon />
              </Button>
            </div>
            <div className="justify-self-center">
              <YunaHeaderTrigger />
            </div>
            <div className="justify-self-end">
              <Button
                surface="light"
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

        <AppBar />
      </div>

      <AppMenuDrawer open={menuOpen} onOpenChange={setMenuOpen} />

      <Dialog open={micOpen} onOpenChange={setMicOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl tracking-tight">
              Allow microphone access
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
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
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneCallIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
        fill="currentColor"
      />
      <path
        d="M16.2 5.2c1 1 1.6 2.4 1.6 3.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M19 3c1.9 1.9 3 4.4 3 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function MicLargeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
