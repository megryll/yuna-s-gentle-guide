import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Badge — a small tracked-uppercase pill flag for status / metadata.
 *
 * One fill: solid `secondary-green` with white text. The white text is held
 * against the `.theme-light` shim by `card-fixed-dark` (which would otherwise
 * invert it to ink in light mode); the green fill isn't a shim target, so the
 * pill reads identically on both photo surfaces and in both app modes — the
 * same trick the card "New" flag has always used.
 *
 * Position-agnostic: it's just the pill. When used as an overlay flag pinned to
 * a card corner, pass the positioning via `className` (e.g. `absolute -top-3
 * left-4`). When inline next to a title, pass `shrink-0` so it doesn't compress.
 */
export interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-secondary-green shadow card-fixed-dark",
        "text-uppercase font-semibold uppercase tracking-[0.2em] pl-3.5 pr-3 py-1.5",
        className,
      )}
    >
      <span className="text-white">{children}</span>
    </span>
  );
}
Badge.displayName = "Badge";
