import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WebShell, WebContent } from "@/components/WebShell";
import { TextField } from "@/components/TextField";
import { GRATITUDE_PROMPTS } from "@/lib/home-cards";
import { useAppMode } from "@/lib/theme-prefs";

export const Route = createFileRoute("/gratitude")({
  head: () => ({ meta: [{ title: "Gratitude List — Yuna" }] }),
  component: GratitudeRoute,
});

// Demo journal — past days are read-only, the current day is editable. Lives
// here because nothing else reads it; promote to a lib file if a second call
// site appears.
const TODAY_DATE = "06.10";
const TODAY_SLOTS = 3;

const PAST_DAYS: { date: string; entries: string[] }[] = [
  {
    date: "06.09",
    entries: [
      "The printer worked on the first try.",
      "It was a good day.",
      "Dwight not initiating a surprise fire drill today.",
    ],
  },
  {
    date: "06.07",
    entries: ["The sun came out just when I needed it."],
  },
  {
    date: "06.05",
    entries: [
      "Had a moment of quiet before the day started.",
      "Finished something I'd been putting off.",
      "Got a message from someone I haven't heard from in a while.",
      "Everything just... worked today.",
      "The printer worked on the first try.",
    ],
  },
];

function GratitudeRoute() {
  const mode = useAppMode();
  const surface = mode === "dark" ? "dark" : "light";

  const [today, setToday] = useState<string[]>(() => Array(TODAY_SLOTS).fill(""));

  return (
    <WebShell>
      <WebContent className="text-white">
        <h1 className="pb-2 font-display text-3xl lg:text-4xl leading-tight tracking-tight text-white text-center">
          Gratitude Journal
        </h1>

        <h2 className="mt-2 font-display text-xl italic leading-snug tracking-tight text-white text-center">
          I feel <span className="text-secondary-green">grateful</span> 🙏 because:
        </h2>

        <div className="mt-6 mx-auto max-w-3xl">
          {/* Today — editable */}
          <DayHeader date={TODAY_DATE} label="Today" />
          {today.map((value, i) => (
            <EntryRow key={i} num={i + 1}>
              <TextField
                surface={surface}
                value={value}
                onChange={(e) =>
                  setToday((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  })
                }
                placeholder={GRATITUDE_PROMPTS[i] ?? "Enter your answer"}
                aria-label={`Today, gratitude ${i + 1}`}
              />
            </EntryRow>
          ))}

          {/* Past days — read-only */}
          {PAST_DAYS.map((day) => (
            <div key={day.date}>
              <DayHeader date={day.date} />
              {day.entries.map((entry, i) => (
                <EntryRow key={i} num={i + 1}>
                  <p className="font-display text-base italic leading-snug text-white/85">
                    {entry}
                  </p>
                </EntryRow>
              ))}
            </div>
          ))}
        </div>
      </WebContent>
    </WebShell>
  );
}

// A day's heading band: the date in the left rail, an optional label ("Today")
// in the content column. The green rule continues through it so the column
// reads as one continuous line down the journal.
function DayHeader({ date, label }: { date: string; label?: string }) {
  return (
    <div className="flex pt-6">
      <span className="w-12 shrink-0 pr-3 text-right text-sm tracking-wide text-white/75 tabular-nums">
        {date}
      </span>
      <span className="flex-1 border-l border-secondary-green pl-4 pb-2 text-sm font-medium text-white">
        {label}
      </span>
    </div>
  );
}

function EntryRow({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex items-stretch border-b border-white/15">
      <span className="w-12 shrink-0 pr-3 pt-3.5 text-right text-sm text-white/75 tabular-nums">
        {num}.
      </span>
      <div className="flex-1 border-l border-secondary-green py-2.5 pl-4">{children}</div>
    </div>
  );
}
