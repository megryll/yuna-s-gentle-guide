import { cn } from "@/lib/utils";

/**
 * StepDots — a row of dots marking position through a short, discrete sequence.
 * The current step is an elongated pill; completed steps stay filled; upcoming
 * steps are muted. For a multi-step wizard's progress, or a "n of m" position
 * indicator on a card deck.
 *
 * For continuous progress use ProgressBar instead.
 *
 * Dot colors are chosen by `surface` directly (the `.theme-light` shim doesn't
 * remap `bg-white/*`), so pass the cluster's surface.
 *
 * count:    total number of steps
 * current:  active step index (0-based); steps below it read as completed
 * surface?: "dark" | "light"   palette (default "dark")
 */
export type StepDotsProps = {
  count: number;
  current: number;
  surface?: "dark" | "light";
  className?: string;
  "aria-label"?: string;
};

export function StepDots({
  count,
  current,
  surface = "dark",
  className,
  "aria-label": ariaLabel,
}: StepDotsProps) {
  const dark = surface === "dark";
  const on = dark ? "bg-white" : "bg-foreground";
  const off = dark ? "bg-white/30" : "bg-foreground/20";
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={current + 1}
      className={cn("flex items-center gap-1.5", className)}
    >
      {Array.from({ length: count }, (_, i) => {
        const reached = i <= current;
        const isCurrent = i === current;
        return (
          <span
            key={i}
            aria-hidden
            className={cn(
              "h-1.5 rounded-full transition-all duration-200 ease-out",
              isCurrent ? "w-5" : "w-1.5",
              reached ? on : off,
            )}
          />
        );
      })}
    </div>
  );
}
StepDots.displayName = "StepDots";
