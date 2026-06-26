import * as React from "react";
import { useAppMode, type AppMode } from "@/lib/theme-prefs";

/**
 * Tag — a small keyword pill with an optional leading icon. Two variants:
 *
 *   `tappable` (default) — a tappable choice. Selection is conveyed by the fill,
 *   mirroring the DS Button: unselected reads as an outlined/frosted pill (like
 *   `secondary`); selected flips to the solid inverted fill (like `primary`) —
 *   white-on-dark / ink-on-light. Renders a <button>.
 *
 *   `informational` — a static label (e.g. a profile's specialties). The edge
 *   carries the affordance: `informational` drops the border for a quiet,
 *   borderless soft fill so it reads as a label, not a control. Renders a <span>
 *   with no pressed/focus behaviour; `selected`, `onClick`, and `disabled` are
 *   ignored.
 *
 * Props:
 *   children:  ReactNode                    — the label
 *   variant?:  "tappable" | "informational" — interactive choice vs static label (default "tappable")
 *   selected?: boolean                       — selected state, `tappable` only (default false)
 *   onClick?:  () => void                    — `tappable` only
 *   icon?:     ReactNode                     — optional leading glyph (sized to 14px)
 *   surface?:  "dark" | "light"              — which background it sits on; default useAppMode()
 *   disabled?: boolean                       — `tappable` only
 */

type TagProps = {
  children: React.ReactNode;
  variant?: "tappable" | "informational";
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  surface?: AppMode;
  disabled?: boolean;
  /** Accessible name — needed for icon-only tappable tags (e.g. a "+" add tag). */
  "aria-label"?: string;
};

const BASE =
  "inline-flex items-center gap-1.5 rounded-full h-8 px-3.5 text-sm leading-none whitespace-nowrap " +
  "[&_svg]:shrink-0 [&_svg]:size-3.5";

const INTERACTIVE =
  "transition-[opacity,background-color,transform] duration-100 ease-out active:scale-[0.98] " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0";

// `tappable` token vocabulary mirrors Button's primary (selected) / secondary
// (unselected) compound variants so a Tag reads as the same family on either
// surface. `informational` is borderless — the missing edge is what separates a
// static label from a tappable control. The dark-branch classes only ever
// render in dark mode (no `.theme-light`), so white/neutral-900 are never
// flipped by the shim; `informational` stays in white-on-dark / ink-on-light
// vocabulary so the shim inverts it correctly in light mode.
const SURFACE: Record<AppMode, { on: string; off: string; informational: string }> = {
  dark: {
    off: "border border-white/30 bg-white/10 text-white/90 hover:bg-white/15 active:bg-white/20 focus-visible:ring-white/60",
    on: "bg-white text-neutral-900 border border-white hover:opacity-90 active:opacity-80 focus-visible:ring-white/60",
    informational: "bg-white/12 text-white/85",
  },
  light: {
    off: "border border-border bg-foreground/5 text-foreground/90 hover:bg-foreground/[0.07] active:bg-foreground/10 focus-visible:ring-foreground/30",
    on: "bg-foreground text-background border border-foreground hover:opacity-90 active:opacity-80 focus-visible:ring-foreground/40",
    informational: "bg-foreground/8 text-foreground/85",
  },
};

export function Tag({
  children,
  variant = "tappable",
  selected = false,
  onClick,
  icon,
  surface,
  disabled,
  "aria-label": ariaLabel,
}: TagProps) {
  const mode = surface ?? useAppMode();
  const tone = SURFACE[mode];

  const inner = (
    <>
      {icon && (
        <span className="flex items-center" aria-hidden>
          {icon}
        </span>
      )}
      <span>{children}</span>
    </>
  );

  if (variant === "informational") {
    return <span className={BASE + " " + tone.informational}>{inner}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={BASE + " " + INTERACTIVE + " " + (selected ? tone.on : tone.off)}
    >
      {inner}
    </button>
  );
}
