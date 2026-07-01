import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GuidedSteps — a read-only vertical checklist marking progress through a short,
 * ordered sequence (e.g. the stages of a guided session). Steps complete from
 * the top: a completed step gets a filled check circle and full-strength label;
 * a pending step gets an empty ring and a dimmed label.
 *
 * Display only — it reports progress, it doesn't accept input. For a single
 * interactive opt-in use Checkbox; for a continuous bar use ProgressBar; for a
 * compact "n of m" position dot row use StepDots.
 *
 * The filled circle is driven by `surface` directly (the `.theme-light` shim
 * doesn't remap `bg-white/*`), so pass the cluster's surface — same rule as
 * Checkbox and StepDots. The labels are authored white-on-dark and invert via
 * the shim.
 *
 * steps:     the step labels, top to bottom
 * completed: how many leading steps are done (0..steps.length)
 * surface?:  "dark" | "light"   palette (default "dark")
 */
export interface GuidedStepsProps {
  steps: string[];
  completed: number;
  surface?: "dark" | "light";
  className?: string;
}

export function GuidedSteps({
  steps,
  completed,
  surface = "dark",
  className,
}: GuidedStepsProps) {
  const dark = surface === "dark";
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {steps.map((step, i) => {
        const done = i < completed;
        return (
          <li key={i} className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                "shrink-0 grid place-content-center h-5 w-5 rounded-full border-2 transition-colors",
                done
                  ? dark
                    ? "border-white bg-white text-neutral-900"
                    : "border-foreground bg-foreground text-background"
                  : dark
                    ? "border-white/40"
                    : "border-foreground/40",
              )}
            >
              {done && <Check size={12} strokeWidth={3} />}
            </span>
            <span
              className={cn(
                "text-sm leading-snug transition-colors",
                done
                  ? dark
                    ? "text-white"
                    : "text-foreground"
                  : dark
                    ? "text-white/70"
                    : "text-foreground/70",
              )}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
GuidedSteps.displayName = "GuidedSteps";
