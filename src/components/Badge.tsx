import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Badge — a small status / metadata flag in one of two shapes, both a solid
 * `secondary-green` fill with white content:
 *   • Label (default): a tracked-uppercase pill. Pass text as `children`.
 *   • Icon-only: a filled circle holding a single glyph (e.g. a check to mark
 *     something complete / verified). Pass `icon` and omit `children`.
 *
 * White content is held against the `.theme-light` shim by `card-fixed-dark`
 * (which would otherwise invert it to ink in light mode); the green fill isn't
 * a shim target, so a badge reads identically on both photo surfaces and in
 * both app modes — the same trick the card "New" flag has always used.
 *
 * Position-agnostic: it's just the badge. As a corner overlay flag, pass the
 * positioning via `className` (e.g. `absolute -top-3 left-4`); inline next to a
 * title, pass `shrink-0` so it doesn't compress.
 *
 * size: icon-only sizing — "sm" (18px) | "md" (28px, default). Ignored by the
 *   label pill, which sizes to its text.
 */
export interface BadgeProps {
  children?: ReactNode;
  // Icon-only badge. Pass `true` for the default check glyph, or a custom node.
  // Omit `children` when using this.
  icon?: ReactNode;
  size?: "sm" | "md";
  // Accessible name for an icon-only badge; omit to keep it decorative.
  label?: string;
  className?: string;
}

const ICON_SIZES = {
  sm: { box: "h-[18px] w-[18px]", glyph: 11, stroke: 3 },
  md: { box: "h-7 w-7", glyph: 15, stroke: 2.5 },
} as const;

export function Badge({ children, icon, size = "md", label, className }: BadgeProps) {
  if (icon !== undefined && children === undefined) {
    const s = ICON_SIZES[size];
    return (
      <span
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={cn(
          "inline-flex items-center justify-center rounded-full shrink-0 bg-secondary-green text-white shadow card-fixed-dark",
          s.box,
          className,
        )}
      >
        {icon === true ? <Check size={s.glyph} strokeWidth={s.stroke} /> : icon}
      </span>
    );
  }

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
