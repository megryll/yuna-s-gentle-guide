import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Switch — iOS-style toggle.
 *
 * On-state uses the `--success-green` token. Off-state uses a translucent
 * foreground fill so it adapts to light/dark surfaces. Thumb is a small
 * white circle that slides between ends.
 */
export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, label, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
          checked ? "bg-success-green" : "bg-foreground/20",
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
