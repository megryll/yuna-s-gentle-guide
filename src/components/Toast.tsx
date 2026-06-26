import * as React from "react";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toast alert.
 *
 * A brief notification shown at the top of a screen — the calmer replacement
 * for the old full-bleed OS banners. The whole pill carries the variant color
 * as a solid fill, with a bare glyph (no badge) and copy in neutral (the brand
 * near-black) rather than white.
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

// Solid fill per variant — text/glyph is neutral 100% (the brand near-black)
// rather than white. Neutral inverts against its surface so it never competes
// with the colored variants.
const FILL = {
  error: { box: "bg-alert-orange text-neutral", muted: "text-neutral/75" },
  success: { box: "bg-secondary-green text-neutral", muted: "text-neutral/75" },
} as const;
const FILL_NEUTRAL = {
  dark: "bg-white text-neutral",
  light: "bg-neutral text-white",
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
        : "text-neutral/65";

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
            <p className="text-sm font-semibold leading-tight">{title}</p>
          )}
          <p className={cn("text-sm leading-snug", title && cn("mt-0.5", mutedCls))}>
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="relative -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-50 transition hover:opacity-75 active:scale-90 active:opacity-90"
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        )}
      </div>
    );
  },
);
Toast.displayName = "Toast";

/**
 * Pins a Toast to one consistent spot: 28px (`pt-7`) from the top of the phone
 * frame — a touch above the 56px content gutter so it reads as a transient
 * overlay — identical across every device size. Render it as a direct child of the screen's
 * frame-filling body (the top-most `relative flex-1` container inside
 * PhoneFrame) so `top-0` resolves to the top of the phone.
 *
 * The viewport spans the full width but is click-through — only the toast
 * itself is interactive — so the empty gutter beside/above it never swallows
 * taps on the content beneath.
 */
export function ToastViewport({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-x-0 top-0 z-[60] px-5 pt-7", className)}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
}
