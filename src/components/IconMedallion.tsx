import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * IconMedallion — a circular frosted plate that lifts a single glyph off a photo
 * background: a lucide icon (Schedule drawer), a `YunaAvatar` (session wrap-up
 * heroes, chat avatar chip), or a `User` fallback while no avatar is set. The
 * frosted fill + hairline ring do the separating, so it reads on both photo
 * surfaces.
 *
 * Authored in white-on-dark vocabulary (`bg-white/10 ring-1 ring-white/15`):
 * `.theme-light` lifts the fill to a brighter plate in light mode and
 * `.platform-android` lifts it again where backdrop blur is unavailable, so the
 * plate never relies on blur alone. There's no `surface` prop — drop it on the
 * photo and it adapts via the shims.
 *
 * Content goes in `children` — size the glyph yourself (a lucide icon ~26, or
 * `<YunaAvatar size={…} />` matching the plate size). Decorative by default
 * (aria-hidden); pass `label` to give it an accessible name when the medallion
 * carries meaning rather than echoing adjacent copy.
 *
 * size: "sm" (36px) | "md" (56px) | "lg" (64px, default) | "xl" (80px)
 */
export interface IconMedallionProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
  children: ReactNode;
}

const SIZES = {
  sm: "h-9 w-9",
  md: "h-14 w-14",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
} as const;

export function IconMedallion({
  size = "lg",
  label,
  className,
  children,
}: IconMedallionProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15",
        SIZES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
IconMedallion.displayName = "IconMedallion";
