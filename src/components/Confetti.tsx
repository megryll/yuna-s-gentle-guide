/**
 * Confetti — a one-shot celebration, used by the Goals flow and the Home feed
 * when a goal is created or marked done. Not an interactive primitive: it's a
 * decorative overlay that fills its nearest positioned ancestor and rains
 * colored pieces down from the full width of the top edge, drifting and
 * spinning as they fall, then fading. The CSS (`.goal-confetti-piece` +
 * `goal-confetti-fall`) lives in styles.css and respects reduced-motion.
 *
 * Pieces are precomputed deterministically (no random) so server and client
 * render the same markup. To replay the cascade, change the element's React
 * `key` so it remounts.
 */

import type { CSSProperties } from "react";

const COLORS = ["#FF5C7A", "#4F8DFF", "#FFD24C", "#39D6A8", "#B985FF", "#FF9F4C"];

const COUNT = 30;

const PIECES = Array.from({ length: COUNT }, (_, i) => {
  // Spread the start points across the full width at the top edge, with a
  // deterministic jitter so the columns don't read as an even comb.
  const basePct = (i / COUNT) * 100;
  const jitter = ((i * 37) % 11) - 5; // -5…+5
  const leftPct = Math.min(98, Math.max(2, basePct + jitter));
  return {
    leftPct,
    // Sideways drift + spin as the piece falls; alternating sign fans them out.
    dx: (i % 2 ? 1 : -1) * (14 + (i % 4) * 12),
    fall: 820 + (i % 5) * 60,
    cr: (i % 2 ? 1 : -1) * (240 + (i % 5) * 90),
    color: COLORS[i % COLORS.length],
    // Staggered start so it cascades top-to-bottom rather than dropping as one
    // sheet; varied duration so pieces don't land in lockstep.
    delay: (i % 10) * 55,
    dur: 1500 + (i % 4) * 200,
    w: i % 3 === 0 ? 6 : 5,
    h: i % 4 === 0 ? 10 : 14,
  };
});

export function Confetti({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={"pointer-events-none absolute inset-0 overflow-hidden " + (className ?? "")}
    >
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="goal-confetti-piece"
          style={
            {
              left: `${p.leftPct}%`,
              "--dx": `${p.dx}px`,
              "--fall": `${p.fall}px`,
              "--cr": `${p.cr}deg`,
              backgroundColor: p.color,
              width: p.w,
              height: p.h,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.dur}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
