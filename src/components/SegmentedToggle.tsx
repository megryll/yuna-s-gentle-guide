import type { ReactNode } from "react";

/**
 * Two-segment pill toggle used across the app — chat's Text/Voice switch
 * and the settings appearance toggle. One component so future visual
 * tweaks affect every surface.
 *
 * Pass `surface="dark"` when the toggle sits on the dark photo cluster,
 * `surface="light"` for the pale light photo. The active segment uses
 * arbitrary color values so it stays high-contrast even when a parent
 * applies `.overlay-on-dark` token swaps (e.g. settings dark mode).
 */

export type SegmentedToggleOption<V extends string> = {
  value: V;
  label: string;
  icon: ReactNode;
  ariaLabel?: string;
};

export function SegmentedToggle<V extends string>({
  value,
  options,
  onChange,
  surface,
  ariaLabel,
}: {
  value: V;
  options: ReadonlyArray<SegmentedToggleOption<V>>;
  onChange: (v: V) => void;
  surface: "dark" | "light";
  ariaLabel: string;
}) {
  const isDark = surface === "dark";
  // Dark surface: a slight dark wash sits on the whole rail so the inactive
  // label keeps contrast on bright spots of the photo bg; the active pill's
  // solid white covers its half. Light surface keeps a subtle fill so the
  // rail reads against the pale photo. The dark-surface border is pinned via
  // inline style so the `.overlay-on-dark *` shim (settings page) can't
  // override the rail outline down to 0.15.
  const railClass = isDark
    ? "bg-black/15"
    : "border border-foreground/20 bg-background/60";
  const railStyle = isDark
    ? { border: "1px solid rgba(255,255,255,0.25)" }
    : undefined;
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={railStyle}
      className={
        "inline-flex items-center rounded-full backdrop-blur-sm h-9 p-0.5 " +
        railClass
      }
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Segment
            key={opt.value}
            active={active}
            isDark={isDark}
            onClick={active ? undefined : () => onChange(opt.value)}
            ariaLabel={opt.ariaLabel ?? opt.label}
          >
            {opt.icon}
            <span className="font-sans-ui text-[11px] tracking-[0.16em] uppercase">
              {opt.label}
            </span>
          </Segment>
        );
      })}
    </div>
  );
}

function Segment({
  active,
  isDark,
  children,
  onClick,
  ariaLabel,
}: {
  active: boolean;
  isDark: boolean;
  children: ReactNode;
  onClick: (() => void) | undefined;
  ariaLabel: string;
}) {
  // Arbitrary color values so neither `.overlay-on-dark` (settings dark)
  // nor `.theme-light` (chat light) can swap the active pill to low
  // contrast. Plain `text-white` would get clobbered to dark gray inside
  // `.theme-light`, which is why the previous version washed out in chat
  // light mode. Hex matches `--foreground` in light mode so the active pill
  // is the same filled tone as bg-foreground (CTAs, chat bubbles).
  const activeClass = isDark
    ? "bg-[#ffffff] text-[#1D1F25]"
    : "bg-[#1D1F25] text-[#ffffff]";
  const inactiveClass = isDark
    ? "text-white active:bg-white/10"
    : "text-foreground/75 active:bg-foreground/10";
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={
        "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-full transition-colors " +
        (active ? activeClass : inactiveClass)
      }
    >
      {children}
    </button>
  );
}
