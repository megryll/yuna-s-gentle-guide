import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accordion — a single collapsible disclosure: a full-width trigger row
 * (caller-supplied `header` content + an auto chevron that rotates when open)
 * and a body that animates open/closed via a `grid-template-rows` 0fr → 1fr
 * transition, so it eases smoothly to the body's natural height with no
 * magic max-height.
 *
 * Controlled — the caller owns `open` / `onOpenChange`. The component renders
 * only the disclosure mechanics (trigger, chevron, animated panel); wrap it in
 * whatever chrome the call site needs (a frosted Surface, a bordered card with
 * a left accent, …). `header` is laid out as the flex children of the trigger
 * before the chevron, so it should include its own `flex-1` element to fill the
 * row. The body (`children`) owns its own padding.
 *
 * surface picks the chevron tint + active-press tint for the photo it sits on.
 * Author dark-cluster call sites with `surface="dark"`; `.theme-light` inverts
 * the white-alpha chevron for app light mode automatically.
 */
export interface AccordionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Trigger-row content, left of the chevron. Include a `flex-1` element. */
  header: ReactNode;
  /** Collapsible body — animates to its natural height. */
  children: ReactNode;
  surface?: "dark" | "light";
  /** aria-label for the trigger when `header` isn't self-describing as text. */
  triggerLabel?: string;
  className?: string;
}

const SURFACE = {
  dark: { press: "active:bg-white/[0.04]", chevron: "text-white/60" },
  light: { press: "active:bg-foreground/[0.04]", chevron: "text-foreground/55" },
} as const;

export function Accordion({
  open,
  onOpenChange,
  header,
  children,
  surface = "dark",
  triggerLabel,
  className,
}: AccordionProps) {
  const s = SURFACE[surface];
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-label={triggerLabel}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
          s.press,
        )}
      >
        {header}
        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden
          className={cn(
            "shrink-0 transition-transform duration-300 ease-out",
            s.chevron,
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div
          className={cn(
            "overflow-hidden transition-opacity duration-300 ease-out",
            open ? "opacity-100" : "opacity-0",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
Accordion.displayName = "Accordion";
