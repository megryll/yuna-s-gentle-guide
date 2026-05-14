import { createContext, useContext, useState, type ReactNode } from "react";
import { KeyboardSimulator } from "@/components/KeyboardSimulator";
import { MAIN_BG_META, isDarkBg, useThemePrefs } from "@/lib/theme-prefs";

const PhoneFrameContext = createContext<HTMLElement | null>(null);

export function usePhoneFrameContainer() {
  return useContext(PhoneFrameContext);
}

/**
 * Centered "phone" canvas. Provides a portal container so dialogs/drawers
 * render inside the phone box instead of the browser viewport.
 *
 * Pass `themed` for in-app screens that should follow the user's Background
 * preference (Forest → existing bg, Snowy → snowy bg + dark mode class).
 * Onboarding routes pass `backgroundImage` directly and stay light.
 */
export function PhoneFrame({
  children,
  backgroundImage,
  themed = false,
}: {
  children: ReactNode;
  backgroundImage?: string;
  themed?: boolean;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const { mainBg } = useThemePrefs();
  const themedBg = themed ? MAIN_BG_META[mainBg].image : undefined;
  const bg = themedBg ?? backgroundImage;
  const dark = themed && isDarkBg(mainBg);

  return (
    <div className="min-h-screen w-full bg-muted/40 flex items-center justify-center sm:p-6">
      <div
        ref={setContainer}
        className={
          "relative w-full max-w-[420px] min-h-screen sm:min-h-[820px] sm:h-[820px] sm:rounded-[2.25rem] sm:hairline overflow-hidden flex flex-col " +
          (bg ? "" : "bg-background") +
          (dark ? " dark theme-snowy" : "")
        }
        style={
          bg
            ? {
                // 8% black tint helps legibility on the dark forest photo; on
                // the pale snowy bg it just murks it up, so skip it there.
                backgroundImage: dark
                  ? `url(${bg})`
                  : `linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08)), url(${bg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <PhoneFrameContext.Provider value={container}>
          {children}
          <KeyboardSimulator container={container} />
        </PhoneFrameContext.Provider>
      </div>
    </div>
  );
}
