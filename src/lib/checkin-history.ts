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

/** How far a single check-in moved overall, or null if nothing was answered. */
export function lift(c: CheckIn): number | null {
  const vals = [c.stress, c.mood].filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** A check-in the user left better than they arrived. */
export function improved(c: CheckIn): boolean {
  const l = lift(c);
  return l !== null && l > 0;
}

const MAX_POINTS = 6;

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
  return [...SEEDED, ...real].slice(-MAX_POINTS);
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

export type CheckInStats = {
  /** Check-ins logged, including the live one. */
  total: number;
  /** How many the user left lighter than they arrived. */
  improved: number;
  /** Consecutive improved check-ins ending at the most recent. */
  streak: number;
};

export function checkInStats(list: CheckIn[]): CheckInStats {
  let streak = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    if (!improved(list[i])) break;
    streak++;
  }
  return {
    total: list.length,
    improved: list.filter(improved).length,
    streak,
  };
}
