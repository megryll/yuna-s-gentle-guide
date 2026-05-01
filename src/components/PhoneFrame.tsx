import { createContext, useContext, useState, type ReactNode } from "react";
import { KeyboardSimulator } from "@/components/KeyboardSimulator";

const PhoneFrameContext = createContext<HTMLElement | null>(null);

export function usePhoneFrameContainer() {
  return useContext(PhoneFrameContext);
}

/**
 * Centered "phone" canvas. Provides a portal container so dialogs/drawers
 * render inside the phone box instead of the browser viewport.
 */
export function PhoneFrame({
  children,
  backgroundImage,
}: {
  children: ReactNode;
  backgroundImage?: string;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <div className="min-h-screen w-full bg-muted/40 flex items-center justify-center sm:p-6">
      <div
        ref={setContainer}
        className={
          "relative w-full max-w-[420px] min-h-screen sm:min-h-[820px] sm:h-[820px] sm:rounded-[2.25rem] sm:hairline overflow-hidden flex flex-col " +
          (backgroundImage ? "" : "bg-background")
        }
        style={
          backgroundImage
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08)), url(${backgroundImage})`,
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
