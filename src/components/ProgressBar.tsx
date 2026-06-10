import { cn } from "@/lib/utils";

/**
 * ProgressBar — a horizontal track with a fill that grows left-to-right.
 *
 * For continuous, determinate progress (a survey's step position, an upload).
 * For a circular gauge use RadialProgress; for discrete numbered steps use
 * StepDots.
 *
 * Fill color is chosen by `surface` directly rather than via a remapped
 * utility: `.theme-light` only inverts `text-*` / `border-*`, not `bg-white/*`,
 * so a white fill would persist on the light photo. Pass the cluster's surface
 * and the bar picks white-on-dark or ink-on-light.
 *
 * value:      progress fraction 0–1 (clamped)
 * surface?:   "dark" | "light"   track + fill palette (default "dark")
 * aria-label? string             describes what's progressing
 */
export type ProgressBarProps = {
  value: number;
  surface?: "dark" | "light";
  className?: string;
  "aria-label"?: string;
};

export function ProgressBar({
  value,
  surface = "dark",
  className,
  "aria-label": ariaLabel,
}: ProgressBarProps) {
  const frac = Math.min(1, Math.max(0, value));
  const dark = surface === "dark";
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(frac * 100)}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full",
        dark ? "bg-white/20" : "bg-foreground/15",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          dark ? "bg-white" : "bg-foreground",
        )}
        style={{ width: `${frac * 100}%` }}
      />
    </div>
  );
}
ProgressBar.displayName = "ProgressBar";
