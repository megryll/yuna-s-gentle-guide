import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAppMode, type AppMode } from "@/lib/theme-prefs";

export type TooltipArrowSide = "top" | "bottom" | "left" | "right";

/**
 * Tooltip — a small opaque popover anchored to a trigger, shown on tap. It
 * floats above the surrounding content instead of reflowing it, with an
 * optional pointer toward the trigger.
 *
 * The consumer owns placement: wrap the trigger in a `relative` element and
 * pass absolute positioning (`top-full right-4 mt-2`, a width, …) via
 * `className`. The pointer's `side` is the panel edge it sits on (so a panel
 * BELOW its trigger points "top"); `offset` slides it along that edge (a
 * Tailwind position class, default centered).
 *
 * Surface: an OPAQUE brand-color fill, constructed the same way in both modes —
 * `primary-beige` (warm off-white) in light, `primary-green` in dark. The `.dark`
 * class supplies the dark-mode text (`popover-foreground` → white) and the
 * `white/10` hairline (`border`); light uses the default `:root` values of the
 * same classes. An opaque fill is deliberate: it lets the pointer read as a
 * seamless point. The pointer is a
 * rotated square straddling the edge with a hairline on only its two outward
 * edges; because it shares the panel's opaque fill, it hides the panel's border
 * segment beneath it and continues the hairline to a point — no detached diamond,
 * in either mode. `mode` defaults to the live app mode; the DS page forces it.
 *
 * open:      whether the panel is shown
 * onClose?:  called when the tap-away backdrop is pressed; omit for no backdrop
 * arrow?:    { side, offset? } — pointer edge + position along it; omit for none
 * mode?:     app mode driving the surface (default: live app mode)
 * className? absolute placement + width of the panel
 * children:  panel content
 */
export interface TooltipProps {
  open: boolean;
  onClose?: () => void;
  arrow?: { side: TooltipArrowSide; offset?: string };
  mode?: AppMode;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

// The pointer is a rotated square centred *on* the panel edge (half tucked
// under, half poking out) with a hairline on only its two outward-facing edges.
// Its opaque fill hides the panel's border segment beneath it, so it reads as
// the panel body stepping out to a point.
const ARROW_SIDE: Record<TooltipArrowSide, string> = {
  top: "top-0 -translate-y-1/2 border-t border-l",
  bottom: "bottom-0 translate-y-1/2 border-b border-r",
  left: "left-0 -translate-x-1/2 border-b border-l",
  right: "right-0 translate-x-1/2 border-t border-r",
};
// Default position along that edge: centered.
const ARROW_CENTER: Record<TooltipArrowSide, string> = {
  top: "left-1/2 -translate-x-1/2",
  bottom: "left-1/2 -translate-x-1/2",
  left: "top-1/2 -translate-y-1/2",
  right: "top-1/2 -translate-y-1/2",
};

export function Tooltip({
  open,
  onClose,
  arrow,
  mode: modeProp,
  className,
  style,
  children,
}: TooltipProps) {
  const appMode = useAppMode();
  const mode = modeProp ?? appMode;
  if (!open) return null;
  const dark = mode === "dark";
  return (
    <>
      {onClose && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}
      <div
        role="dialog"
        style={style}
        className={cn(
          "absolute z-50 rounded-2xl border border-border p-4 text-popover-foreground shadow-xl",
          dark ? "dark bg-primary-green" : "bg-primary-beige",
          className,
        )}
      >
        {arrow && (
          <span
            aria-hidden
            className={cn(
              "absolute h-2.5 w-2.5 rotate-45 rounded-[2px] border-border",
              dark ? "bg-primary-green" : "bg-primary-beige",
              ARROW_SIDE[arrow.side],
              arrow.offset ?? ARROW_CENTER[arrow.side],
            )}
          />
        )}
        {children}
      </div>
    </>
  );
}
Tooltip.displayName = "Tooltip";
