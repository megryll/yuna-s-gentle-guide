import { useState } from "react";
import { CalendarPicker } from "yuna-design-system";

// CalendarPicker defaults to surface="dark" (white-on-dark grid), so previews
// sit on a dark brand-green panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6"
    >
      {children}
    </div>
  );
}

// A fixed reference month so the static card always shows a populated grid with
// a clear selection, regardless of when it renders.
const REF = new Date(2026, 6, 1); // July 2026
const SELECTED = new Date(2026, 6, 16);

export function Default() {
  const [value, setValue] = useState<Date | null>(SELECTED);
  return (
    <Dark>
      <CalendarPicker
        surface="dark"
        value={value}
        onChange={setValue}
        minDate={REF}
      />
    </Dark>
  );
}

export function WithAvailability() {
  const [value, setValue] = useState<Date | null>(new Date(2026, 6, 9));
  // Only weekdays are bookable — unavailable days dim and drop their dot.
  const isAvailable = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;
  return (
    <Dark>
      <CalendarPicker
        surface="dark"
        value={value}
        onChange={setValue}
        minDate={REF}
        isAvailable={isAvailable}
      />
    </Dark>
  );
}

export function OnLight() {
  const [value, setValue] = useState<Date | null>(SELECTED);
  return (
    <div className="rounded-2xl p-6 bg-white">
      <CalendarPicker
        surface="light"
        value={value}
        onChange={setValue}
        minDate={REF}
      />
    </div>
  );
}
