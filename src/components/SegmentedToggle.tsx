import type { ReactNode } from "react";

/**
 * Two-segment pill toggle used across the app — chat's Text/Voice switch,
 * the settings appearance toggle, Home's card/list switcher, and the Goals
 * Active/Completed filter. One component so future visual tweaks affect
 * every surface.
 *
 * Pass `surface="dark"` when the toggle sits on the dark photo cluster,
 * `surface="light"` for the pale light photo. Defaults to `"dark"` (the
 * photo-cluster house default). The active segment uses
 * arbitrary color values so it stays high-contrast even when a parent
 * applies `.overlay-on-dark` token swaps (e.g. settings dark mode).
 *
 * Two sizes, differing mainly by height:
 *   `size="md"` (default) — h-9 rail, h-8 segments.
 *   `size="sm"`           — compact h-8 rail, h-7 segments.
 * Either size takes segments with text only, an icon only, or both — set
 * `label` and/or `icon` per option (icon-only segments need `ariaLabel`).
 * Labelled segments grow with their text; icon-only segments stay square.
 */

export type SegmentedToggleOption<V extends string> = {
  value: V;
  /** Text label; omit for an icon-only segment (then `ariaLabel` is required). */
  label?: string;
  /** Leading glyph; omit for a text-only segment. */
  icon?: ReactNode;
  ariaLabel?: string;
};

export function SegmentedToggle<V extends string>({
  value,
  options,
  onChange,
  surface = "dark",
  ariaLabel,
  size = "md",
}: {
  value: V;
  options: ReadonlyArray<SegmentedToggleOption<V>>;
  onChange: (v: V) => void;
  surface?: "dark" | "light";
  ariaLabel: string;
  size?: "sm" | "md";
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
        "inline-flex items-center rounded-full backdrop-blur-sm p-0.5 " +
        (size === "sm" ? "h-8 " : "h-9 ") +
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
            size={size}
            hasLabel={!!opt.label}
            onClick={active ? undefined : () => onChange(opt.value)}
            ariaLabel={opt.ariaLabel ?? opt.label ?? ariaLabel}
          >
            {opt.icon}
            {opt.label ? (
              <span className="text-uppercase tracking-[0.16em] uppercase">
                {opt.label}
              </span>
            ) : null}
          </Segment>
        );
      })}
    </div>
  );
}

function Segment({
  active,
  isDark,
  size,
  hasLabel,
  children,
  onClick,
  ariaLabel,
}: {
  active: boolean;
  isDark: boolean;
  size: "sm" | "md";
  hasLabel: boolean;
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
    ? "text-white hover:bg-white/[0.06] active:bg-white/10"
    : "text-foreground/75 hover:bg-foreground/[0.04] active:bg-foreground/10";
  // Labeled segments grow with their text (px + gap); icon-only segments are
  // square. sm shaves a row off both so the compact rail reads h-8 / h-7.
  const sizeClass = hasLabel
    ? size === "sm"
      ? "gap-1.5 h-7 px-3"
      : "gap-1.5 h-8 px-3"
    : size === "sm"
      ? "h-7 w-7"
      : "h-8 w-8";
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={
        "inline-flex items-center justify-center rounded-full transition-colors " +
        sizeClass +
        " " +
        (active ? activeClass : inactiveClass)
      }
    >
      {children}
    </button>
  );
}
