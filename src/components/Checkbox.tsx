import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Checkbox — a single boolean toggle: a circular check control with an optional
 * inline label. For a standalone confirmation ("I understand…") or a lone
 * opt-in.
 *
 * This is the LONE checkbox. To choose among a set of options use
 * MultipleChoice (it owns group radio/checkbox semantics); for an on/off
 * setting use Switch.
 *
 * checked / onChange: controlled boolean state.
 * label?:   inline copy to the right of the box. Omit for a bare control and
 *           pass `aria-label` instead.
 * surface?: "dark" | "light" (default "dark").
 * disabled?
 */
export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  surface?: "dark" | "light";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  surface = "dark",
  disabled,
  className,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  const dark = surface === "dark";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-3 text-left transition-opacity active:opacity-80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        dark ? "focus-visible:ring-white/60" : "focus-visible:ring-foreground/30",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "shrink-0 grid place-content-center h-5 w-5 rounded-full border-2 transition-colors",
          checked
            ? dark
              ? "border-white bg-white text-neutral-900"
              : "border-foreground bg-foreground text-background"
            : dark
              ? "border-white/40"
              : "border-foreground/40",
        )}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      {label && (
        <span className={cn("text-sm leading-snug", dark ? "text-white/85" : "text-foreground/85")}>
          {label}
        </span>
      )}
    </button>
  );
}
Checkbox.displayName = "Checkbox";
