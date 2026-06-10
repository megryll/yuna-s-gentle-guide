import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarPicker } from "@/components/CalendarPicker";
import { DSPage, Section, SurfacePair, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/calendar")({
  head: () => ({
    meta: [
      { title: "Design System — Calendar" },
      { name: "description", content: "A month-grid date picker with availability dots and a strong selected day." },
    ],
  }),
  component: DSCalendar,
});

function OpenDemo({ surface }: { surface: "dark" | "light" }) {
  const [date, setDate] = useState<Date | null>(null);
  return <CalendarPicker surface={surface} value={date} onChange={setDate} />;
}

function LimitedDemo({ surface }: { surface: "dark" | "light" }) {
  const [date, setDate] = useState<Date | null>(null);
  // Weekends unavailable — dims the days and hides their dots.
  return (
    <CalendarPicker
      surface={surface}
      value={date}
      onChange={setDate}
      isAvailable={(d) => d.getDay() !== 0 && d.getDay() !== 6}
    />
  );
}

function DSCalendar() {
  return (
    <DSPage title="Calendar">
      <Section title="Variants" subtitle="Pass isAvailable to gate selectable days and show the availability dot.">
        <div className="flex flex-col gap-10">
          <SurfacePair align="start" innerLabel="Open availability" renderRow={(s) => <OpenDemo surface={s} />} />
          <SurfacePair align="start" innerLabel="Limited availability" renderRow={(s) => <LimitedDemo surface={s} />} />
        </div>
      </Section>

      <Section title="Props">
        <PropsBlock>{`<CalendarPicker
  value:        Date | null
  onChange:     (date: Date) => void
  isAvailable?: (date: Date) => boolean   // gate days + show dot (default: all)
  minDate?:     Date                      // earliest selectable (default: today)
  surface?:     "dark" | "light"          // default "dark"
  className?:   string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
