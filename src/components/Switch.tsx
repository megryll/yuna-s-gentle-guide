import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Switch — iOS-style toggle.
 *
 * On-state uses the `--secondary-green` token. Thumb is a small white circle
 * that slides between ends. Pass `disabled` to dim the control and block
 * toggling.
 *
 * surface: which background the off-state track sits on.
 *   - "light" (default) — ink-alpha track (`bg-foreground/20`), reads on light.
 *   - "dark" — white-alpha track (`bg-white/25`); the ink track is invisible on
 *     a dark photo, so dark-cluster screens must pass this.
 */
export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  surface?: "dark" | "light";
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, label, surface = "light", disabled, className, ...props }, ref) => {
    const offTrack = surface === "dark" ? "bg-white/25" : "bg-foreground/20";
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
          "disabled:cursor-not-allowed disabled:opacity-40",
          checked ? "bg-secondary-green" : offTrack,
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className="absolute top-[2px] left-0 h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15),0_3px_8px_rgba(0,0,0,0.15)] transition-transform"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
        />
      </button>
    );
  },
);
Switch.displayName = "Switch";
