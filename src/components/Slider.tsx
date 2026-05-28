import { useRef } from "react";

/**
 * Stepped slider used for choices over a small ordered set (e.g. voice pace
 * 0.5x → 1.5x). The rail is a Yuna-green pill that fully encompasses a white
 * circular dial — the dial is smaller than the rail on every side, so the
 * rail's green is always visible around it (top, bottom, and at both ends).
 */

const TRACK_H = 56;
const THUMB = 46;
// Padding between dial and rail edge at the extremes. Vertical padding is
// implicit (THUMB centered in TRACK_H gives 5px above + below); horizontal
// padding is enforced via the thumb-position math below so the rail's green
// end-cap stays visible behind the dial even at ratio = 0 or 1.
const EDGE_PAD = 5;

export interface SliderProps {
  /** Step labels rendered below the rail. Length defines the step count. */
  steps: readonly string[];
  /** Index of the currently-selected step. */
  value: number;
  onChange: (idx: number) => void;
  /** Optional caps-tracked label above the rail. */
  label?: string;
  /** When true, render without the surrounding card frame. */
  bare?: boolean;
}

export function Slider({ steps, value, onChange, label, bare }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const stepFromPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el || steps.length <= 1) return value;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (steps.length - 1));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    onChange(stepFromPointer(e.clientX));
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    onChange(stepFromPointer(e.clientX));
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const ratio = steps.length > 1 ? value / (steps.length - 1) : 0;
  // Dial center expressed as a CSS calc — clamped so the dial stays fully
  // inside the rail with `EDGE_PAD` of green visible at both ends.
  const dialOffset = EDGE_PAD + THUMB / 2;
  const dialCenter = `calc(${dialOffset}px + (100% - ${dialOffset * 2}px) * ${ratio})`;
  // Fill width extends past the dial on the right by (THUMB / 2 + EDGE_PAD)
  // so the green rail always wraps the dial — at ratio = 1 the fill reaches
  // the rail's right edge exactly.
  const fillWidth = `calc(${dialCenter} + ${THUMB / 2 + EDGE_PAD}px)`;

  const inner = (
    <>
      {label && (
        <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-4">
          {label}
        </p>
      )}

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative rounded-full bg-muted touch-none cursor-pointer select-none"
        style={{ height: TRACK_H }}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={steps.length - 1}
        aria-valuenow={value}
        aria-valuetext={steps[value]}
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Math.min(steps.length - 1, value + 1));
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.max(0, value - 1));
          }
        }}
      >
        {/* Filled portion — Yuna green, extends past the dial on the right so
            the rail wraps the dial on every side. */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150 ease-out"
          style={{
            width: fillWidth,
            backgroundColor: "var(--yuna-green)",
          }}
        />

        {/* Tick lines per step — sit at the positions the dial would occupy. */}
        {steps.map((_, i) => {
          const tickRatio = steps.length > 1 ? i / (steps.length - 1) : 0;
          const beforeHandle = i <= value;
          return (
            <span
              key={i}
              aria-hidden="true"
              className={
                "absolute top-1/2 -translate-y-1/2 w-px h-3 " +
                (beforeHandle ? "bg-white/55" : "bg-foreground/25")
              }
              style={{
                left: `calc(${dialOffset}px + (100% - ${dialOffset * 2}px) * ${tickRatio})`,
              }}
            />
          );
        })}

        {/* Dial — smaller than the rail; green is visible around it on every side. */}
        <span
          aria-hidden="true"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white transition-[left] duration-150 ease-out"
          style={{
            left: dialCenter,
            height: THUMB,
            width: THUMB,
            boxShadow: "0 1px 2px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.10)",
          }}
        />
      </div>

      <div
        className="grid mt-3 px-0"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(i)}
            className={
              "text-xs text-center transition-colors " +
              (i === value
                ? "text-foreground font-medium"
                : "text-muted-foreground")
            }
          >
            {s}
          </button>
        ))}
      </div>
    </>
  );

  if (bare) return <div>{inner}</div>;
  return <div className="rounded-2xl hairline bg-background p-5">{inner}</div>;
}
