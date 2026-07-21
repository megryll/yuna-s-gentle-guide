import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";
import { FirstSessionDisclaimerGate } from "@/components/FirstSessionDisclaimers";
import { KeyboardSimulator } from "@/components/KeyboardSimulator";
import { useFrameSize } from "@/lib/frame-size";
import { usePlatform } from "@/lib/platform";
import { isLightMode, useAppMode, useModeImage } from "@/lib/theme-prefs";

// Exported so the DS-docs DeviceFrame can provide its own container, letting a
// real Drawer/dialog portal into a simulated device frame on a /ds/* page.
export const PhoneFrameContext = createContext<HTMLElement | null>(null);
// Container that lives OUTSIDE the inner phone's overflow-hidden clip — used
// to render visuals (haptic edge-pulse, etc.) that need to extend beyond the
// phone bounds into the surrounding browser area. Positioned behind the
// phone in paint order so anything drawn over the phone surface itself is
// hidden, leaving only the portion that emerges past the edge visible.
const PhoneFrameOuterContext = createContext<HTMLElement | null>(null);

export function usePhoneFrameContainer() {
  return useContext(PhoneFrameContext);
}

export function usePhoneFrameOuter() {
  return useContext(PhoneFrameOuterContext);
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
  const [outerContainer, setOuterContainer] = useState<HTMLElement | null>(null);
  const mode = useAppMode();
  const modeImage = useModeImage();
  const themedBg = themed ? modeImage : undefined;
  const bg = themedBg ?? backgroundImage;
  const light = themed && isLightMode(mode);
  const platform = usePlatform();
  const frame = useFrameSize();

  return (
    <div
      className="min-h-screen w-full bg-muted/40 flex items-center justify-center sm:p-6"
      style={
        { "--frame-w": `${frame.w}px`, "--frame-h": `${frame.h}px` } as CSSProperties
      }
    >
      <div className="relative w-full max-w-[var(--frame-w)]">
        {/* Outer overlay: sits BEHIND the inner phone (earlier in DOM = lower
            paint order). Children rendered here via the outer context get
            clipped naturally by the phone surface — only what scales past the
            phone edge into the surrounding browser area is visible. */}
        <div
          ref={setOuterContainer}
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />
        <div
          ref={setContainer}
          data-phone-frame=""
          className={
            "relative w-full min-h-screen sm:min-h-[var(--frame-h)] sm:h-[var(--frame-h)] sm:rounded-[2.25rem] sm:hairline overflow-hidden flex flex-col " +
            (bg ? "" : "bg-background") +
            (light ? " theme-light" : "") +
            (platform === "android" ? " platform-android" : "")
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
            <PhoneFrameOuterContext.Provider value={outerContainer}>
              {children}
              <KeyboardSimulator container={container} />
              <FirstSessionDisclaimerGate />
            </PhoneFrameOuterContext.Provider>
          </PhoneFrameContext.Provider>
        </div>
      </div>
    </div>
  );
}
