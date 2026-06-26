import { type CSSProperties, type ReactNode } from "react";
import { usePlatform } from "@/lib/platform";
import { darkBlurImage, darkWelcomeImage, useDarkBlurImage } from "@/lib/theme-prefs";
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
 *
 * On desktop (`lg+`) the canvas splits two ways: the lush nature photo fills a
 * fixed left third, and the content column sits a fixed distance from it (left-
 * aligned, not centered) over a continuous dark photo in the right two-thirds —
 * instead of one column adrift in a wide empty void. Below `lg` it stays a
 * single full-bleed photo with a centered column.
 */
export function OnboardingFrame({
  children,
  backgroundImage,
  width = "max-w-md",
  className,
  fillViewport = false,
}: {
  children: ReactNode;
  backgroundImage?: string;
  width?: string;
  className?: string;
  /**
   * Lock the canvas to the viewport height (`h-[100svh]` + `overflow-hidden`)
   * and thread `min-h-0` down the flex chain, so a screen whose own body owns
   * an inner `overflow-y-auto` (the Intro chat) scrolls *inside* that container
   * instead of growing the page and letting the window scroll. Short screens
   * leave this off and keep the default `min-h-[100svh]` window-scroll layout.
   */
  fillViewport?: boolean;
}) {
  const platform = usePlatform();
  const darkBg = useDarkBlurImage();
  const bg = backgroundImage ?? darkBg;

  return (
    <div
      className={cn(
        "w-full bg-cover bg-center bg-fixed text-white flex flex-col items-center lg:flex-row lg:items-stretch",
        fillViewport ? "h-[100svh] overflow-hidden" : "min-h-[100svh]",
        platform === "android" && "platform-android",
      )}
      style={
        {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url(${bg})`,
        } as CSSProperties
      }
    >
      {/* Left pane — lush nature photo, desktop split only. Sticky + viewport
          height so it stays pinned while the right column scrolls. */}
      <div
        aria-hidden
        className="hidden lg:block lg:w-1/3 lg:shrink-0 lg:sticky lg:top-0 lg:self-start lg:h-[100svh] bg-cover bg-center"
        style={{ backgroundImage: `url(${darkWelcomeImage()})` }}
      />
      {/* Right pane — centers the column in the remaining space. Its own dark
          backdrop (desktop only) keeps the pane dark even on Welcome, whose
          outer photo is the lush one; that photo lives in the left pane here. */}
      <div
        className={cn(
          "relative isolate flex flex-1 flex-col items-center w-full lg:items-start lg:pl-24",
          fillViewport ? "min-h-0 lg:h-[100svh]" : "lg:min-h-[100svh]",
        )}
      >
        <div
          aria-hidden
          className="hidden lg:block absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url(${darkBlurImage()})`,
          }}
        />
        {/* Centered column. `relative` so absolutely-positioned toasts / overlays
            anchor to it, the way they did inside the phone box. */}
        <div
          className={cn(
            "relative flex flex-1 flex-col w-full",
            fillViewport && "min-h-0",
            width,
            className,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
