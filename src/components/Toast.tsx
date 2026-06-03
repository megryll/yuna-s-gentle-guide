import * as React from "react";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toast alert.
 *
 * A brief notification shown at the top of a screen — the calmer replacement
 * for the old full-bleed OS banners. The whole pill carries the variant color
 * as a solid fill, with a bare glyph (no badge) and copy in a deep tonal ink —
 * a darkened shade of the fill itself — rather than white.
 *
 * variant: the semantic tone
 *   - "error"   — something needs fixing (warm orange, never red)
 *   - "neutral" — informational, no judgement (monochrome chip)
 *   - "success" — something went right (Yuna green)
 *
 * surface: which background the toast sits on. Only affects the neutral
 * variant, which inverts to stay legible (white pill on dark, ink on light).
 *   - "dark"  — dark or photo backgrounds
 *   - "light" — light backgrounds
 *
 * onDismiss: optional. When provided, a close (×) button is shown on the right.
 */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "error" | "neutral" | "success";
  surface?: "dark" | "light";
  title?: string;
  message: string;
  onDismiss?: () => void;
}

const ICON = { error: CircleAlert, success: Check, neutral: Info } as const;

// Solid fill per variant — text/glyph is a deep tonal ink (a darkened shade of
// the fill) rather than white. Neutral inverts against its surface so it never
// competes with the colored variants.
const FILL = {
  error: { box: "bg-alert-orange text-alert-orange-foreground", muted: "text-alert-orange-foreground/75" },
  success: { box: "bg-yuna-green text-yuna-green-foreground", muted: "text-yuna-green-foreground/75" },
} as const;
const FILL_NEUTRAL = {
  dark: "bg-white text-neutral-900",
  light: "bg-neutral-900 text-white",
} as const;

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    { variant = "neutral", surface = "dark", title, message, onDismiss, className, ...rest },
    ref,
  ) => {
    const Icon = ICON[variant];
    const isNeutral = variant === "neutral";
    const colored = isNeutral ? null : FILL[variant as "error" | "success"];
    const fill = colored ? colored.box : FILL_NEUTRAL[surface];

    // Secondary line: a softened version of the fill's own text color.
    const mutedCls = colored
      ? colored.muted
      : surface === "light"
        ? "text-white/80"
        : "text-neutral-900/65";

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          "relative flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.45)]",
          fill,
          className,
        )}
        {...rest}
      >
        <Icon size={18} strokeWidth={2.25} className="shrink-0" />
        <div className="relative min-w-0 flex-1">
          {title && (
            <p className="text-[14px] font-semibold leading-tight">{title}</p>
          )}
          <p className={cn("text-[13px] leading-snug", title && cn("mt-0.5", mutedCls))}>
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="relative -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-50 transition active:scale-90 active:opacity-90"
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        )}
      </div>
    );
  },
);
Toast.displayName = "Toast";
