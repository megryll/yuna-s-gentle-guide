import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { GRATITUDE_PROMPTS } from "@/lib/home-cards";
import { useAppMode } from "@/lib/theme-prefs";
import { useFrameSize } from "@/lib/frame-size";

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
  const router = useRouter();
  const mode = useAppMode();
  const surface = mode === "dark" ? "dark" : "light";
  const isSE = useFrameSize().id === "se";
  // Return to wherever the user came from (Tools, Home, …) rather than a fixed
  // screen; fall back to Home on a direct deep-link with no history.
  const close = () =>
    router.history.canGoBack() ? router.history.back() : router.navigate({ to: "/home" });

  const [today, setToday] = useState<string[]>(() => Array(TODAY_SLOTS).fill(""));

  return (
    <PhoneFrame themed>
      <div className="relative flex-1 flex flex-col text-white min-h-0">
        <header className="shrink-0 px-6 pt-14 flex items-center">
          <Button surface={surface} variant="secondary" size="icon" aria-label="Back" onClick={close}>
            <ChevronLeft strokeWidth={1.5} />
          </Button>
        </header>
        <h1
          className={`shrink-0 px-6 font-display text-3xl tracking-tight text-white text-center ${
            isSE ? "pt-4" : "pt-6 pb-2"
          }`}
        >
          Gratitude Journal
        </h1>

        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <h2 className="font-display text-xl italic leading-snug tracking-tight text-white text-center">
            I feel <span className="text-secondary-green">grateful</span> 🙏 because:
          </h2>

          <div className="mt-6">
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
        </div>
      </div>
    </PhoneFrame>
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
