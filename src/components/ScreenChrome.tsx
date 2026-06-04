import { useState, type ReactNode } from "react";
import { Menu, PhoneCall } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaHeaderTrigger } from "@/components/YunaHeaderTrigger";
import { AppMenuDrawer } from "@/components/AppMenuDrawer";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { FirstSessionDisclaimerGate } from "@/components/FirstSessionDisclaimers";
import { useStartChat } from "@/lib/chat-launch";
import { isLightMode, useAppMode } from "@/lib/theme-prefs";

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
  const startChat = useStartChat();
  const [menuOpen, setMenuOpen] = useState(false);

  const openCall = () => {
    startChat({ mode: "voice" });
  };

  const mode = useAppMode();
  // surface="dark" is the photo-bg cluster (Home/You/etc). In light mode the
  // photo flips to /light-blur-bg.png, so cards/buttons need surface="light"
  // to stay readable. Dark mode keeps the existing dark-photo styling.
  const effectiveSurface = surface === "dark" && isLightMode(mode) ? "light" : surface;
  const isDark = surface === "dark";

  return (
    <PhoneFrame backgroundImage={isDark ? "/background.png" : undefined} themed={isDark}>
      <div className="flex-1 flex flex-col min-h-0">
        {!hideHeader && (
          <header className="grid grid-cols-3 items-center px-5 pt-14 pb-2 shrink-0">
            <div className="justify-self-start">
              <Button
                surface={effectiveSurface}
                variant="plain"
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
                variant="plain"
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

        <AppBar surface={surface} />
      </div>

      <AppMenuDrawer open={menuOpen} onOpenChange={setMenuOpen} />
      <FirstSessionDisclaimerGate />
    </PhoneFrame>
  );
}

function MenuIcon() {
  return <Menu size={22} strokeWidth={1.6} aria-hidden="true" />;
}

function PhoneCallIcon() {
  return <PhoneCall size={22} strokeWidth={1.6} aria-hidden="true" />;
}
