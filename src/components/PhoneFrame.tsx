import { createContext, useContext, useState, type ReactNode } from "react";
import { KeyboardSimulator } from "@/components/KeyboardSimulator";
import { APP_MODE_META, isLightMode, useAppMode } from "@/lib/theme-prefs";

const PhoneFrameContext = createContext<HTMLElement | null>(null);

export function usePhoneFrameContainer() {
  return useContext(PhoneFrameContext);
}

/**
 * Centered "phone" canvas. Provides a portal container so dialogs/drawers
 * render inside the phone box instead of the browser viewport.
 *
 * Pass `themed` for in-app screens that should follow the user's Light/Dark
 * mode preference (Dark → /background.png, Light → /light-blur-bg.png with
 * white-utility inversion via `.theme-light`). Onboarding routes pass
 * `backgroundImage` directly and stay locked to the dark photo.
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
  const mode = useAppMode();
  const themedBg = themed ? APP_MODE_META[mode].image : undefined;
  const bg = themedBg ?? backgroundImage;
  const light = themed && isLightMode(mode);

  return (
    <div className="min-h-screen w-full bg-muted/40 flex items-center justify-center sm:p-6">
      <div
        ref={setContainer}
        className={
          "relative w-full max-w-[420px] min-h-screen sm:min-h-[820px] sm:h-[820px] sm:rounded-[2.25rem] sm:hairline overflow-hidden flex flex-col " +
          (bg ? "" : "bg-background") +
          (light ? " theme-light" : "")
        }
        style={
          bg
            ? {
                // 8% black tint helps legibility on the dark forest photo; on
                // the pale light bg it just murks it up, so skip it there.
                backgroundImage: light
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
