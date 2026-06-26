import { type CSSProperties, type ReactNode } from "react";
import { usePlatform } from "@/lib/platform";
import { useDarkBlurImage } from "@/lib/theme-prefs";
import { cn } from "@/lib/utils";

/**
 * Full-bleed onboarding canvas — the desktop counterpart to PhoneFrame for the
 * pre-tab funnel (Welcome, Auth, Login, Accept terms, Intro, …).
 *
 * These routes are mode-locked to the dark photo (no Light/Dark toggle) and
 * have no nav rail, so unlike WebShell this is just the dark photo painted
 * across the whole viewport with a centered content column that scales to any
 * size instead of a fixed phone box. `.platform-android` is applied so frosted
 * surfaces stay defined when blur is killed.
 *
 * The column replicates PhoneFrame's contract — a full-height `flex flex-col` —
 * so a screen's existing content (with its own `flex-1` / `mt-auto` / padding)
 * drops in unchanged; conversion is mostly swapping the wrapper. Pass
 * `backgroundImage` to override the default dark blur (Welcome uses the lush
 * photo); pass `width` to widen the column (default `max-w-md`).
 */
export function OnboardingFrame({
  children,
  backgroundImage,
  width = "max-w-md",
  className,
}: {
  children: ReactNode;
  backgroundImage?: string;
  width?: string;
  className?: string;
}) {
  const platform = usePlatform();
  const darkBg = useDarkBlurImage();
  const bg = backgroundImage ?? darkBg;

  return (
    <div
      className={cn(
        "min-h-[100svh] w-full bg-cover bg-center bg-fixed text-white flex flex-col items-center",
        platform === "android" && "platform-android",
      )}
      style={
        {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url(${bg})`,
        } as CSSProperties
      }
    >
      {/* Centered column. `relative` so absolutely-positioned toasts / overlays
          anchor to it, the way they did inside the phone box. */}
      <div className={cn("relative flex flex-1 flex-col w-full", width, className)}>
        {children}
      </div>
    </div>
  );
}
