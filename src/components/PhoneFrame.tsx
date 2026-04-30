import type { ReactNode } from "react";

/**
 * Centered "phone" canvas — wireframe vibe with a hairline border on desktop,
 * full-bleed on mobile.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-muted/40 flex items-center justify-center sm:p-6">
      <div className="relative w-full max-w-[420px] min-h-screen sm:min-h-[820px] sm:h-[820px] bg-background sm:rounded-[2.25rem] sm:hairline overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}