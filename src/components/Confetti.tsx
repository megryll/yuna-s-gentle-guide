/**
 * Confetti — a one-shot celebration burst, used by the Goals flow when a goal
 * is created or marked done. Not an interactive primitive: it's a decorative
 * overlay that fills its nearest positioned ancestor and flings colored pieces
 * out from the center, then fades. The CSS (`.goal-confetti-piece` +
 * `goal-confetti-burst`) lives in styles.css and respects reduced-motion.
 *
 * Pieces are precomputed deterministically (no random) so server and client
 * render the same markup. To replay the burst, change the element's React
 * `key` so it remounts.
 */

import type { CSSProperties } from "react";

const COLORS = ["#FF5C7A", "#4F8DFF", "#FFD24C", "#39D6A8", "#B985FF", "#FF9F4C"];

const PIECES = Array.from({ length: 18 }, (_, i) => {
  // Radial spread with a small per-piece stagger so it doesn't read as a ring.
  const angle = (i / 18) * Math.PI * 2 + (i % 2 ? 0.32 : 0);
  const dist = 58 + (i % 4) * 18;
  return {
    cx: Math.cos(angle) * dist,
    // Bias the landing point downward so the pieces drift down as they settle.
    cy: Math.sin(angle) * dist + 26,
    cr: (i % 2 ? 1 : -1) * (180 + (i % 5) * 60),
    color: COLORS[i % COLORS.length],
    delay: (i % 6) * 30,
    w: i % 3 === 0 ? 5 : 4,
    h: i % 4 === 0 ? 9 : 12,
  };
});

export function Confetti({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={"pointer-events-none absolute inset-0 overflow-visible " + (className ?? "")}
    >
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="goal-confetti-piece"
          style={
            {
              "--cx": `${p.cx}px`,
              "--cy": `${p.cy}px`,
              "--cr": `${p.cr}deg`,
              backgroundColor: p.color,
              width: p.w,
              height: p.h,
              animationDelay: `${p.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
