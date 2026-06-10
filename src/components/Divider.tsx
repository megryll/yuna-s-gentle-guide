import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Divider — a hairline rule, optionally with a centered label.
 *
 * surface: which background the rule sits on
 *   - "dark"  — dark or photo backgrounds
 *   - "light" — light backgrounds (default)
 *
 * label: optional centered caption (e.g. "or"). Rendered as a tracked-uppercase
 *   eyebrow flanked by two hairlines. Omit for a single full-width rule.
 *
 * Authored in white-on-dark vocabulary so `.theme-light` inverts the dark
 * surface for light mode automatically.
 */
export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: "dark" | "light";
  label?: string;
}

export function Divider({ surface = "light", label, className, ...props }: DividerProps) {
  const line = surface === "dark" ? "bg-white/25" : "bg-foreground/20";
  const text = surface === "dark" ? "text-white/60" : "text-foreground/60";

  if (!label) {
    return (
      <div role="separator" className={cn("h-px w-full", line, className)} {...props} />
    );
  }

  return (
    <div
      role="separator"
      className={cn(
        "flex items-center gap-3 text-[10px] leading-none tracking-[0.2em] uppercase",
        text,
        className,
      )}
      {...props}
    >
      <span aria-hidden className={cn("flex-1 h-px", line)} />
      {label}
      <span aria-hidden className={cn("flex-1 h-px", line)} />
    </div>
  );
}
Divider.displayName = "Divider";
