import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePlatform } from "@/lib/platform";

/**
 * Simulated native OS date picker — the device's own picker, not an app
 * component. Like KeyboardSimulator, it's deliberately hardcoded to the OS
 * look (system font via `font-sans-ui`, platform colors inline) and presented
 * inside the phone frame: an iOS wheel sheet sliding up from the bottom, or an
 * Android (Material) calendar dialog. Reserved for this OS-chrome role only.
 *
 * Mounts when `open`; `onConfirm` returns the chosen Date, `onCancel` dismisses.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const IOS_BLUE = "#007AFF";
const MATERIAL_PRIMARY = "#6750A4";

function daysInMonth(monthIndex: number, year: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

type Parts = { m: number; d: number; y: number };

export function NativeDatePicker({
  open,
  initial,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  initial: Date;
  onCancel: () => void;
  onConfirm: (d: Date) => void;
}) {
  const platform = usePlatform();
  const [parts, setParts] = useState<Parts>(() => ({
    m: initial.getMonth(),
    d: initial.getDate(),
    y: initial.getFullYear(),
  }));

  // Re-seed from the incoming value each time the picker is opened.
  useEffect(() => {
    if (open) setParts({ m: initial.getMonth(), d: initial.getDate(), y: initial.getFullYear() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const confirm = () =>
    onConfirm(new Date(parts.y, parts.m, Math.min(parts.d, daysInMonth(parts.m, parts.y))));

  return platform === "android" ? (
    <AndroidCalendar parts={parts} onParts={setParts} onCancel={onCancel} onConfirm={confirm} />
  ) : (
    <IosWheel parts={parts} onParts={setParts} onCancel={onCancel} onConfirm={confirm} />
  );
}

// ─── iOS — wheel sheet ──────────────────────────────────────────────────────

function IosWheel({
  parts,
  onParts,
  onCancel,
  onConfirm,
}: {
  parts: Parts;
  onParts: (p: Parts) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dayCount = daysInMonth(parts.m, parts.y);
  const days = Array.from({ length: dayCount }, (_, i) => String(i + 1));
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => String(thisYear + i));

  return (
    <div className="absolute inset-0 z-40 font-sans-ui" aria-modal>
      <div className="absolute inset-0 bg-black/30 yuna-fade-in" onClick={onCancel} aria-hidden />
      <div
        className="absolute inset-x-0 bottom-0 yuna-slide-up"
        style={{ background: "#FFFFFF" }}
      >
        <div
          className="flex items-center justify-between px-4"
          style={{ height: 44, borderBottom: "1px solid rgba(0,0,0,0.1)" }}
        >
          <button type="button" onClick={onCancel} style={{ color: IOS_BLUE, fontSize: 17 }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ color: IOS_BLUE, fontSize: 17, fontWeight: 600 }}
          >
            Done
          </button>
        </div>
        <div className="relative flex px-2" style={{ paddingTop: 6, paddingBottom: 18 }}>
          {/* Selection band */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2"
            style={{ height: 34, borderRadius: 8, background: "rgba(120,120,128,0.12)" }}
          />
          <IosColumn
            items={MONTHS}
            index={parts.m}
            onIndex={(i) => onParts({ ...parts, m: i, d: Math.min(parts.d, daysInMonth(i, parts.y)) })}
            align="left"
          />
          <IosColumn
            items={days}
            index={parts.d - 1}
            onIndex={(i) => onParts({ ...parts, d: i + 1 })}
            width={64}
          />
          <IosColumn
            items={years}
            index={Math.max(0, years.indexOf(String(parts.y)))}
            onIndex={(i) => onParts({ ...parts, y: Number(years[i]), d: Math.min(parts.d, daysInMonth(parts.m, Number(years[i]))) })}
            width={80}
          />
        </div>
      </div>
    </div>
  );
}

const IOS_ITEM = 34;

function IosColumn({
  items,
  index,
  onIndex,
  width,
  align = "center",
}: {
  items: string[];
  index: number;
  onIndex: (i: number) => void;
  width?: number;
  align?: "center" | "left";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = index * IOS_ITEM;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    if (frame.current != null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const el = ref.current;
      if (!el) return;
      const i = Math.round(el.scrollTop / IOS_ITEM);
      if (i !== index && i >= 0 && i < items.length) onIndex(i);
    });
  };

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ height: 170, flex: width ? "none" : 1, width }}
    >
      <div style={{ height: 68 }} aria-hidden />
      {items.map((it, i) => (
        <div
          key={it}
          className="snap-center flex items-center"
          style={{
            height: IOS_ITEM,
            justifyContent: align === "left" ? "flex-start" : "center",
            paddingLeft: align === "left" ? 16 : 0,
            fontSize: 21,
            color: i === index ? "#000" : "rgba(60,60,67,0.45)",
          }}
        >
          {it}
        </div>
      ))}
      <div style={{ height: 68 }} aria-hidden />
    </div>
  );
}

// ─── Android — Material calendar dialog ─────────────────────────────────────

function AndroidCalendar({
  parts,
  onParts,
  onCancel,
  onConfirm,
}: {
  parts: Parts;
  onParts: (p: Parts) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // The grid view month can differ from the selected date as you page around.
  const [view, setView] = useState({ m: parts.m, y: parts.y });
  const total = daysInMonth(view.m, view.y);
  const leadBlanks = new Date(view.y, view.m, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: leadBlanks }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  const shiftMonth = (delta: number) => {
    const next = new Date(view.y, view.m + delta, 1);
    setView({ m: next.getMonth(), y: next.getFullYear() });
  };

  const selectedHeader = new Date(parts.y, parts.m, parts.d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-5 font-sans-ui" aria-modal>
      <div className="absolute inset-0 bg-black/40 yuna-fade-in" onClick={onCancel} aria-hidden />
      <div
        className="relative w-full max-w-[320px] yuna-fade-in"
        style={{ background: "#FFFFFF", borderRadius: 28, overflow: "hidden", color: "#1C1B1F" }}
      >
        <div style={{ padding: "16px 24px 12px" }}>
          <p style={{ fontSize: 12, letterSpacing: 0.4, color: "rgba(28,27,31,0.6)" }}>Select date</p>
          <p style={{ fontSize: 28, fontWeight: 400, marginTop: 6 }}>{selectedHeader}</p>
        </div>
        <div style={{ height: 1, background: "rgba(0,0,0,0.08)" }} aria-hidden />

        <div className="flex items-center justify-between" style={{ padding: "8px 12px 0 24px" }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {MONTHS[view.m]} {view.y}
          </span>
          <div className="flex">
            <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} style={{ padding: 8, color: "#49454F" }}>
              <ChevronLeft size={20} />
            </button>
            <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} style={{ padding: 8, color: "#49454F" }}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: "4px 12px 8px" }}>
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((w, i) => (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{ height: 36, fontSize: 12, color: "rgba(28,27,31,0.6)" }}
              >
                {w}
              </div>
            ))}
            {cells.map((d, i) => {
              const selected = d != null && d === parts.d && view.m === parts.m && view.y === parts.y;
              return (
                <div key={i} className="flex items-center justify-center" style={{ height: 40 }}>
                  {d != null && (
                    <button
                      type="button"
                      onClick={() => onParts({ ...parts, d, m: view.m, y: view.y })}
                      className="flex items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        fontSize: 14,
                        background: selected ? MATERIAL_PRIMARY : "transparent",
                        color: selected ? "#FFFFFF" : "#1C1B1F",
                      }}
                    >
                      {d}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end" style={{ gap: 8, padding: "8px 24px 20px" }}>
          <button type="button" onClick={onCancel} style={{ color: MATERIAL_PRIMARY, fontSize: 14, fontWeight: 500, letterSpacing: 0.6, padding: "8px 12px" }}>
            CANCEL
          </button>
          <button type="button" onClick={onConfirm} style={{ color: MATERIAL_PRIMARY, fontSize: 14, fontWeight: 500, letterSpacing: 0.6, padding: "8px 12px" }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
