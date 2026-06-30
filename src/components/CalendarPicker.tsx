import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { buildMonthGrid, formatMonth, sameDay, startOfDay } from "@/lib/therapist-data";

/**
 * CalendarPicker — a month-grid date picker. Renders one month at a time with
 * prev/next navigation, a weekday header, and a 6×7 day grid. Each day can show
 * an availability dot; unavailable and past days are dimmed and unselectable.
 *
 * The selected day uses the DS's strong selection fill (ink-on-light /
 * white-on-dark, the primary-button idiom) so it reads as the committed choice;
 * today is marked with a ring. Colors are picked by `surface` directly — the
 * `.theme-light` shim doesn't remap fills — so pass the cluster's surface.
 *
 * value:        selected date, or null
 * onChange:     called with the chosen Date
 * isAvailable?: (date) => boolean — gate selectable days + show the dot
 *               (default: all current/future days available)
 * minDate?:     earliest selectable day (default: today). Prev nav stops here.
 * surface?:     "dark" | "light" (default "dark")
 */
export type CalendarPickerProps = {
  value: Date | null;
  onChange: (date: Date) => void;
  isAvailable?: (date: Date) => boolean;
  minDate?: Date;
  surface?: "dark" | "light";
  className?: string;
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarPicker({
  value,
  onChange,
  isAvailable,
  minDate,
  surface = "dark",
  className,
}: CalendarPickerProps) {
  const dark = surface === "dark";
  const today = startOfDay(new Date());
  const floor = startOfDay(minDate ?? today);

  const [view, setView] = useState<Date>(() => {
    const base = value ?? floor;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const cells = buildMonthGrid(view.getFullYear(), view.getMonth());
  const canGoPrev = new Date(view.getFullYear(), view.getMonth(), 1) > new Date(floor.getFullYear(), floor.getMonth(), 1);

  const available = (d: Date) => {
    if (startOfDay(d) < floor) return false;
    return isAvailable ? isAvailable(d) : true;
  };

  const shiftMonth = (delta: number) =>
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-3">
        <Button
          surface={surface}
          variant="secondary"
          size="icon-sm"
          onClick={() => canGoPrev && shiftMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          <ChevronLeft />
        </Button>
        <span className={cn("font-display text-lg tracking-tight", dark ? "text-white" : "text-foreground")}>{formatMonth(view)}</span>
        <Button
          surface={surface}
          variant="secondary"
          size="icon-sm"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((d, i) => (
          <div
            key={i}
            className={cn(
              "text-center text-xs font-semibold py-1",
              dark ? "text-white/75" : "text-foreground/75",
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map(({ date, inMonth }, i) => {
          if (!inMonth) return <div key={i} aria-hidden className="aspect-square" />;
          const selectable = available(date);
          const selected = sameDay(date, value);
          const isToday = sameDay(date, today);
          return (
            <button
              key={i}
              type="button"
              disabled={!selectable}
              aria-pressed={selected}
              aria-label={date.toDateString()}
              onClick={() => selectable && onChange(date)}
              className={cn(
                "relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5",
                "text-sm transition-[background-color,transform] duration-100 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                selected
                  ? dark
                    ? "bg-white text-neutral-900 font-semibold active:scale-95 focus-visible:ring-white/60"
                    : "bg-foreground text-background font-semibold active:scale-95 focus-visible:ring-foreground/30"
                  : selectable
                    ? dark
                      ? "text-white active:bg-white/10 focus-visible:ring-white/60"
                      : "text-foreground active:bg-foreground/8 focus-visible:ring-foreground/30"
                    : dark
                      ? "text-white/30"
                      : "text-foreground/25",
                isToday && !selected && (dark ? "ring-1 ring-white/70" : "ring-1 ring-foreground/50"),
              )}
            >
              <span className="leading-none">{date.getDate()}</span>
              <span
                aria-hidden
                className={cn(
                  "h-1 w-1 rounded-full",
                  selectable && !selected
                    ? "bg-secondary-green"
                    : selected
                      ? dark
                        ? "bg-neutral-900/40"
                        : "bg-background/60"
                      : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
CalendarPicker.displayName = "CalendarPicker";
