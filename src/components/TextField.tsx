import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Root TextField.
 *
 * A pill-shaped single-line input.
 *
 * surface: which background the field sits on
 *   - "dark"  — dark or photo backgrounds
 *   - "light" — light backgrounds
 *
 * size: "md" (default) | "sm" (compact) | "lg" (large)
 *
 * leading / trailing: optional elements rendered inside the pill on the
 *   left / right (e.g. a status indicator or a send button).
 *
 * error: when true, the pill border (and its focus border) shift to the
 *   warm orange alert tone. Pair with a message line below the field — see
 *   /ds/text-fields for the full pattern. Also sets aria-invalid.
 *
 * active: holds the border in its opaque (focused) state without focus — for
 *   runtime states that own the field while the cursor is elsewhere, e.g. the
 *   chat composer while recording a voice note. Ignored when `error` is set.
 *
 * Inline focus ring is the border going opaque on focus-within; we do not
 * paint a Tailwind ring because the pill itself is the focus indicator.
 */
export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  surface?: "dark" | "light";
  size?: "md" | "sm" | "lg";
  error?: boolean;
  active?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerClassName?: string;
}

const CONTAINER_BASE =
  "flex items-center gap-1 rounded-full border backdrop-blur-sm transition-colors";

// Dark-cluster fill: a slight dark tint reads better than a white wash on
// the dark photo bg. The `.theme-light` shim maps `bg-black/20` →
// ~45% white, so in light mode the field still appears as a frosted white
// pill matching SURFACE_LIGHT below.
const SURFACE_DARK = "border-white/30 bg-black/20 focus-within:border-white";

// Light surface kept on its own variant for screens that are intrinsically
// light (no themed photo bg). Border in ink so the pill has a hairline on
// pale grounds.
const SURFACE_LIGHT = "border-foreground/30 bg-white/40 focus-within:border-foreground";

// Active — same opaque border the field shows on focus, held on regardless of
// focus. Used while the field owns a runtime state (e.g. recording).
const SURFACE_DARK_ACTIVE = "border-white bg-black/20 focus-within:border-white";
const SURFACE_LIGHT_ACTIVE = "border-foreground bg-white/40 focus-within:border-foreground";

// Error border — warm orange, keeping each surface's own fill so only the
// edge reads as "invalid". Focus border stays orange rather than reverting.
const SURFACE_DARK_ERROR = "border-alert-orange bg-black/20 focus-within:border-alert-orange";
const SURFACE_LIGHT_ERROR = "border-alert-orange bg-white/40 focus-within:border-alert-orange";

// Full-size (default). Min-height keeps bare fields the same height as
// fields with an icon-sm trailing button (h-8), so the pill reads
// consistently whether or not a trailing control is present.
const SIZE_MD = "pl-5 py-1.5 min-h-11 text-sm";
// Compact — used inside cards (e.g. the gratitude journal rows).
const SIZE_SM = "pl-4 py-1.5 text-[13px]";
// Large — roomier pill for hero/standalone fields. Min-height pairs with an
// icon-lg trailing button (h-11) the way md pairs with icon-sm.
const SIZE_LG = "pl-6 py-2.5 min-h-14 text-base";

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      surface = "dark",
      size = "md",
      error = false,
      active = false,
      leading,
      trailing,
      containerClassName,
      className,
      ...inputProps
    },
    ref,
  ) => {
    const surfaceClass = error
      ? surface === "dark"
        ? SURFACE_DARK_ERROR
        : SURFACE_LIGHT_ERROR
      : active
        ? surface === "dark"
          ? SURFACE_DARK_ACTIVE
          : SURFACE_LIGHT_ACTIVE
        : surface === "dark"
          ? SURFACE_DARK
          : SURFACE_LIGHT;
    const sizeClass = size === "lg" ? SIZE_LG : size === "sm" ? SIZE_SM : SIZE_MD;
    // Inner trailing-aware right padding: small when a control is tucked
    // inside the pill, generous when the field is just text.
    const rightPad = trailing
      ? size === "lg"
        ? "pr-2"
        : size === "md"
          ? "pr-1.5"
          : "pr-1"
      : size === "lg"
        ? "pr-6"
        : size === "md"
          ? "pr-5"
          : "pr-4";

    const inputColor =
      surface === "dark"
        ? "text-white placeholder:text-white/50"
        : "text-foreground placeholder:text-foreground/45";

    return (
      <div className={cn(CONTAINER_BASE, surfaceClass, sizeClass, rightPad, containerClassName)}>
        {leading}
        <input
          ref={ref}
          aria-invalid={error || undefined}
          className={cn("flex-1 bg-transparent outline-none min-w-0", inputColor, className)}
          {...inputProps}
        />
        {trailing}
      </div>
    );
  },
);
TextField.displayName = "TextField";

/**
 * The message line that pairs with a TextField in its `error` state — a warm
 * orange alert glyph + copy, sitting just below the field. Wrap the field and
 * this in a `flex flex-col gap-2` so they read as one unit.
 */
export function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-1.5 pl-1 text-[13px] leading-snug text-alert-orange yuna-fade-in"
    >
      <CircleAlert size={14} strokeWidth={2} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}
