import { useEffect, useState } from "react";
import { loadKeepsakes } from "@/lib/keepsakes";

// Cumulative check-in history for the wrap-up's reward variants.
//
// Every completed wrap-up already saves a Keepsake carrying that session's
// stress + mood (bipolar -1 → 1, or null when skipped), but nothing has ever
// read them back. These helpers turn that store into the "here's your run of
// check-ins" payoff the reward variants show once the user answers.
//
// Both axes are authored so POSITIVE = better (stress decreased, mood
// improved), which is what lets one number stand for a whole check-in.

export type CheckIn = {
  /** Short display date, e.g. "Aug 12". "Today" for the live answer. */
  label: string;
  stress: number | null;
  mood: number | null;
  /** True for the demo entries below, so a fresh browser still has a run. */
  seeded?: boolean;
};

// Prototype demo history, oldest first. Dates are fixed strings rather than
// computed offsets so the chart is identical on the server and the client, and
// stable across review sessions. Values sit on the 4-option scale's steps
// (±1, ±1/3) so seeded points line up with what the live answer can produce.
const SEEDED: CheckIn[] = [
  { label: "Jul 24", stress: 1 / 3, mood: -1 / 3, seeded: true },
  { label: "Jul 31", stress: -1 / 3, mood: 1 / 3, seeded: true },
  { label: "Aug 6", stress: 1 / 3, mood: 1 / 3, seeded: true },
  { label: "Aug 12", stress: 1, mood: 1 / 3, seeded: true },
  { label: "Aug 18", stress: 1 / 3, mood: 1, seeded: true },
];

/**
 * How a check-in landed. Both axes moving the right way is a different day
 * from one up and one down, and averaging them into a single "improved yes/no"
 * threw that away: a session that lifted your mood but left the stress read the
 * same as one where nothing moved.
 */
export type CheckInTone = "lighter" | "mixed" | "heavier";

/** null when neither axis was answered, so unanswered never counts as a day. */
export function tone(c: CheckIn): CheckInTone | null {
  const vals = [c.stress, c.mood].filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  const up = vals.filter((v) => v > 0).length;
  const down = vals.filter((v) => v < 0).length;
  if (up > 0 && down > 0) return "mixed";
  if (up > 0) return "lighter";
  if (down > 0) return "heavier";
  // Both answered dead centre (only reachable on the slider variants).
  return "mixed";
}

/**
 * How many check-ins a chart or tile row shows at once. The run itself isn't
 * capped: the tallies count everything, so a browser that's completed a pile of
 * wrap-ups still reports real figures.
 */
export const CHECKIN_WINDOW = 7;

/** Seeded demo run plus any real saved keepsakes, oldest first. */
export function loadCheckIns(): CheckIn[] {
  const real = loadKeepsakes()
    // Keepsakes are stored newest-first; charts read oldest-first.
    .slice()
    .reverse()
    .filter((k) => k.mood !== null || k.stress !== null)
    .map((k) => ({
      label: new Date(k.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      stress: k.stress,
      mood: k.mood,
    }));
  // Seeded entries always lead, never trimmed: without them a browser with a
  // few skipped-answer wrap-ups reports a run of zeroes.
  return [...SEEDED, ...real];
}

/**
 * Loads after mount rather than during render: the real entries are formatted
 * from localStorage timestamps, which the server can't see.
 */
export function useCheckIns(): CheckIn[] {
  const [list, setList] = useState<CheckIn[]>([]);
  useEffect(() => {
    setList(loadCheckIns());
  }, []);
  return list;
}

/**
 * The run broken down by tone. The three counts sum to `total`, so the tally
 * reads as a full account of every logged day rather than a highlight reel.
 */
export type CheckInStats = {
  /** Check-ins logged, including the live one. */
  total: number;
  /** Both answers moved the right way. */
  lighter: number;
  /** One up, one down. */
  mixed: number;
  /** Both answers moved the wrong way. */
  heavier: number;
};

export function checkInStats(list: CheckIn[]): CheckInStats {
  const tones = list.map(tone).filter((t): t is CheckInTone => t !== null);
  return {
    total: tones.length,
    lighter: tones.filter((t) => t === "lighter").length,
    mixed: tones.filter((t) => t === "mixed").length,
    heavier: tones.filter((t) => t === "heavier").length,
  };
}
