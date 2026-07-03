import { useRef, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RankList — a drag-to-reorder list. The order *is* the answer: drag a row by
 * any part of it to rank a set of values from most to least (what matters most,
 * preferred order, …). Each row shows its current rank numeral, a label with
 * optional subtitle, and a grip affordance. Reordering is pointer-based (works
 * with mouse and touch) and commits live as you drag.
 *
 * Controlled: pass `order` (the value ids in current order) and handle
 * `onReorder` with the next order.
 *
 * items:      [{ value, label, subtitle?, emoji? }]
 * order:      value ids in current order (controlled)
 * onReorder:  next order
 * surface?:   "dark" | "light" (default "dark")
 * onDragTick? fired once per row crossing, for a tick sound
 * animateIn?: cascade the rows in on mount, one after another (default false)
 * ariaLabel:  names the list
 */
const CASCADE_STEP_MS = 55;
export type RankListItem = {
  value: string;
  label: string;
  subtitle?: string;
  emoji?: string;
};

type Drag = { value: string; startIndex: number; startY: number; dy: number; rowH: number };

export function RankList({
  items,
  order,
  onReorder,
  surface = "dark",
  onDragTick,
  animateIn = false,
  ariaLabel,
  className,
}: {
  items: RankListItem[];
  order: string[];
  onReorder: (next: string[]) => void;
  surface?: "dark" | "light";
  onDragTick?: () => void;
  animateIn?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  const dark = surface === "dark";
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const lastTarget = useRef<number | null>(null);

  const byValue = (v: string) => items.find((it) => it.value === v)!;

  // Stride between rows (height + gap), measured from the first two rows so the
  // gap is included exactly; falls back to a row's own height for a single row.
  const measureStride = (startIndex: number) => {
    const a = rowRefs.current[order[0]];
    const b = rowRefs.current[order[1]];
    if (a && b) return Math.abs(b.offsetTop - a.offsetTop);
    const self = rowRefs.current[order[startIndex]];
    return self ? self.offsetHeight + 10 : 56;
  };

  const targetIndex = (d: Drag) =>
    Math.max(0, Math.min(order.length - 1, d.startIndex + Math.round(d.dy / d.rowH)));

  const onPointerDown = (e: React.PointerEvent, value: string, index: number) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    lastTarget.current = index;
    setDrag({ value, startIndex: index, startY: e.clientY, dy: 0, rowH: measureStride(index) });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const y = e.clientY;
    setDrag((d) => {
      if (!d) return d;
      const next = { ...d, dy: y - d.startY };
      const t = targetIndex(next);
      if (t !== lastTarget.current) {
        lastTarget.current = t;
        onDragTick?.();
      }
      return next;
    });
  };

  const commit = () => {
    setDrag((d) => {
      if (d) {
        const t = targetIndex(d);
        if (t !== d.startIndex) {
          const next = order.filter((v) => v !== d.value);
          next.splice(t, 0, d.value);
          onReorder(next);
        }
      }
      lastTarget.current = null;
      return null;
    });
  };

  return (
    <ul
      role="list"
      aria-label={ariaLabel}
      className={cn("flex flex-col gap-2.5 touch-none select-none", className)}
    >
      {order.map((value, index) => {
        const it = byValue(value);
        const dragging = drag?.value === value;
        const target = drag ? targetIndex(drag) : null;

        // Non-dragged rows shift by one stride to open a gap for the dragged row.
        let shift = 0;
        if (drag && !dragging && target !== null) {
          const from = drag.startIndex;
          if (from < target && index > from && index <= target) shift = -drag.rowH;
          else if (from > target && index >= target && index < from) shift = drag.rowH;
        }

        // Rank numeral reflects the live target slot so the numbers update as
        // you drag, even before the reorder commits.
        let liveRank = index;
        if (drag && target !== null) {
          const from = drag.startIndex;
          if (dragging) liveRank = target;
          else if (from < target && index > from && index <= target) liveRank = index - 1;
          else if (from > target && index >= target && index < from) liveRank = index + 1;
        }

        return (
          <li
            key={value}
            ref={(el) => {
              rowRefs.current[value] = el;
            }}
            style={{
              transform: dragging ? `translateY(${drag!.dy}px)` : `translateY(${shift}px)`,
              transition: dragging ? "none" : "transform 180ms cubic-bezier(0.2,0.8,0.2,1)",
            }}
            className={cn(dragging && "rank-dragging")}
          >
            <div
              onPointerDown={(e) => onPointerDown(e, value, index)}
              onPointerMove={onPointerMove}
              onPointerUp={commit}
              onPointerCancel={commit}
              style={animateIn ? { animationDelay: `${index * CASCADE_STEP_MS}ms` } : undefined}
              className={cn(
                "w-full rounded-2xl border px-3.5 py-3 flex items-center gap-3 cursor-grab",
                animateIn && "survey-cascade-item",
                dragging && "cursor-grabbing",
                dark
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-border bg-background/70 text-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "shrink-0 h-6 w-6 rounded-full inline-flex items-center justify-center text-xs font-bold tabular-nums",
                  dark ? "bg-white/15 text-white" : "bg-foreground/8 text-foreground",
                )}
              >
                {liveRank + 1}
              </span>
              {it.emoji && (
                <span className="text-lg leading-none" aria-hidden>
                  {it.emoji}
                </span>
              )}
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold leading-tight">{it.label}</span>
                {it.subtitle && (
                  <span
                    className={cn(
                      "block text-xs mt-0.5 leading-snug",
                      dark ? "text-white/70" : "text-muted-foreground",
                    )}
                  >
                    {it.subtitle}
                  </span>
                )}
              </span>
              <GripVertical
                size={18}
                strokeWidth={1.75}
                aria-hidden
                className={cn("shrink-0", dark ? "text-white/55" : "text-foreground/45")}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
RankList.displayName = "RankList";
