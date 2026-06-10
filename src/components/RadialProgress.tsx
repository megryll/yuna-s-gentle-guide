import type { ReactNode } from "react";

/**
 * RadialProgress — a circular track with a progress arc that sweeps clockwise
 * from twelve o'clock, with optional centered content (a % label, a glyph).
 *
 * Stroke color is chosen by `surface` directly, not via a class the shim
 * remaps: `.theme-light` only inverts `text-*` / `border-*` utilities, never
 * SVG `stroke-*`, so a white arc would vanish on the light photo. Pass the
 * cluster's surface and the ring picks white-on-dark or ink-on-light.
 *
 * Props:
 *   value         number             progress fraction 0–1 (clamped)
 *   size?         number             px diameter (default 220)
 *   strokeWidth?  number             ring thickness in px (default 4)
 *   surface?      "dark" | "light"   stroke palette (default "dark")
 *   className?    string             extra classes on the wrapper
 *   aria-label?   string             describes what's progressing
 *   children?     ReactNode          centered content (e.g. a % label)
 */
export type RadialProgressProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  surface?: "dark" | "light";
  className?: string;
  "aria-label"?: string;
  children?: ReactNode;
};

export function RadialProgress({
  value,
  size = 220,
  strokeWidth = 4,
  surface = "dark",
  className,
  children,
  "aria-label": ariaLabel,
}: RadialProgressProps) {
  const frac = Math.min(1, Math.max(0, value));
  const r = size / 2 - strokeWidth;
  const c = size / 2;
  const circ = 2 * Math.PI * r;

  const dark = surface === "dark";
  const trackCls = dark ? "stroke-white/15" : "stroke-foreground/15";
  const progCls = dark ? "stroke-white" : "stroke-foreground";

  return (
    <div
      className={"relative" + (className ? ` ${className}` : "")}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(frac * 100)}
      >
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth={strokeWidth} className={trackCls} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={progCls + " transition-[stroke-dashoffset] duration-300 ease-out"}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}
