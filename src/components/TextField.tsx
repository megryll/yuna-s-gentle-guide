import * as React from "react";
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
 * size: "md" (default) | "sm" (compact)
 *
 * leading / trailing: optional elements rendered inside the pill on the
 *   left / right (e.g. a status indicator or a send button).
 *
 * Inline focus ring is the border going opaque on focus-within; we do not
 * paint a Tailwind ring because the pill itself is the focus indicator.
 */
export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  surface?: "dark" | "light";
  size?: "md" | "sm";
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
const SURFACE_DARK =
  "border-white/30 bg-black/20 focus-within:border-white";

// Light surface kept on its own variant for screens that are intrinsically
// light (no themed photo bg). Border in ink so the pill has a hairline on
// pale grounds.
const SURFACE_LIGHT =
  "border-foreground/30 bg-white/40 focus-within:border-foreground";

const SIZE_MD = "pl-5 py-2 text-sm";
const SIZE_SM = "pl-4 py-1.5 text-[13px]";

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      surface = "dark",
      size = "md",
      leading,
      trailing,
      containerClassName,
      className,
      ...inputProps
    },
    ref,
  ) => {
    const surfaceClass = surface === "dark" ? SURFACE_DARK : SURFACE_LIGHT;
    const sizeClass = size === "md" ? SIZE_MD : SIZE_SM;
    // Inner trailing-aware right padding: small when a control is tucked
    // inside the pill, generous when the field is just text.
    const rightPad = trailing
      ? size === "md"
        ? "pr-1.5"
        : "pr-1"
      : size === "md"
        ? "pr-5"
        : "pr-4";

    const inputColor =
      surface === "dark"
        ? "text-white placeholder:text-white/50"
        : "text-foreground placeholder:text-foreground/45";

    return (
      <div
        className={cn(
          CONTAINER_BASE,
          surfaceClass,
          sizeClass,
          rightPad,
          containerClassName,
        )}
      >
        {leading}
        <input
          ref={ref}
          className={cn(
            "flex-1 bg-transparent outline-none min-w-0",
            inputColor,
            className,
          )}
          {...inputProps}
        />
        {trailing}
      </div>
    );
  },
);
TextField.displayName = "TextField";
