import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * TextArea — a multiline text input; the block-shaped sibling to TextField.
 *
 * surface: which background it sits on
 *   - "dark"  — dark or photo backgrounds
 *   - "light" — light backgrounds
 *
 * variant:
 *   - "field" (default) — a rounded-2xl bordered box with body text, matching
 *     TextField's fill/border treatment. For message bodies, notes, replies.
 *   - "display" — borderless, transparent, large Fraunces display text. For
 *     editing a title/heading in place (e.g. renaming a conversation).
 *
 * error (field only): border shifts to the warm alert-orange tone and
 *   aria-invalid is set. Pair with a `FieldError` line below (see TextField).
 *
 * The dark fill (`bg-black/20`) is the same one TextField uses, so the
 * `.theme-light` shim remaps it to a frosted white pill in light mode — author
 * once in dark vocabulary.
 */
export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  surface?: "dark" | "light";
  variant?: "field" | "display";
  error?: boolean;
}

const FIELD_BASE =
  "w-full resize-none rounded-2xl border px-4 py-3 text-sm leading-relaxed outline-none backdrop-blur-sm transition-colors";
const FIELD_DARK =
  "border-white/30 bg-black/20 text-white placeholder:text-white/50 focus:border-white";
const FIELD_LIGHT =
  "border-foreground/30 bg-white/40 text-foreground placeholder:text-foreground/45 focus:border-foreground";
const FIELD_DARK_ERROR =
  "border-alert-orange bg-black/20 text-white placeholder:text-white/50 focus:border-alert-orange";
const FIELD_LIGHT_ERROR =
  "border-alert-orange bg-white/40 text-foreground placeholder:text-foreground/45 focus:border-alert-orange";

const DISPLAY_BASE =
  "w-full resize-none bg-transparent font-display text-3xl leading-tight tracking-tight outline-none";
const DISPLAY_DARK = "text-white placeholder:text-white/40";
const DISPLAY_LIGHT = "text-foreground placeholder:text-foreground/40";

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ surface = "dark", variant = "field", error = false, className, ...props }, ref) => {
    const dark = surface === "dark";
    const cls =
      variant === "display"
        ? cn(DISPLAY_BASE, dark ? DISPLAY_DARK : DISPLAY_LIGHT)
        : cn(
            FIELD_BASE,
            error
              ? dark
                ? FIELD_DARK_ERROR
                : FIELD_LIGHT_ERROR
              : dark
                ? FIELD_DARK
                : FIELD_LIGHT,
          );
    return (
      <textarea
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(cls, className)}
        {...props}
      />
    );
  },
);
TextArea.displayName = "TextArea";
