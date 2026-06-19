// The wellbeing dimensions Yuna tracks on the "Track your progress" screen, plus
// the library of validated check-ins behind them.
//
// Dimensions ARE the life areas from "Your starting point" question 1
// (`FOCUS_AREAS`): a returning user tracks the ones they chose there, and can
// add any other from the same set. Each is normalized to a 0–100 *wellness*
// score where higher always means healthier, so very different areas sit on one
// comparable axis — that shared scale is what lets the screen state a single
// "+12% since April", draw every sparkline the same way, and roll the tracked
// ones up into one wellbeing index.
//
// Self-contained demo data: the numbers are tuned for the prototype and don't
// read from `assessment-data.ts`. The areas that map to a validated instrument
// with a detail page (Mood → PHQ-9, Confidence → self-esteem) still link out
// via `assessmentId`.

import { FOCUS_AREAS, focusAreaById } from "@/lib/questionnaire-data";

export type Measurement = {
  longDate: string; // prose-friendly axis point, e.g. "April 14"
  score: number; // 0–100 wellness (higher = healthier)
};

export type Dimension = {
  id: string; // focus-area id
  label: string;
  emoji: string;
  instrument?: string; // validated tool behind it, e.g. "PHQ-9"
  assessmentId?: string; // set when a /assessment/$id detail page exists
  lastMeasured: string; // relative recency, e.g. "5 days ago"
  history: Measurement[]; // chronological; [] = never measured
};

const h = (pairs: [string, number][]): Measurement[] =>
  pairs.map(([longDate, score]) => ({ longDate, score }));

type DimData = Omit<Dimension, "id" | "label" | "emoji">;

// Demo trend data per focus-area id. Covers every trackable area so any chosen
// or random three render. `instrument` omitted = a custom Yuna check-in.
const DIM_DATA: Record<string, DimData> = {
  stress: {
    instrument: "PSS-10",
    lastMeasured: "6 days ago",
    history: h([["March 28", 61], ["April 25", 63], ["May 23", 65], ["June 11", 66]]),
  },
  burnout: {
    instrument: "OLBI",
    lastMeasured: "2 weeks ago",
    history: h([["March 22", 54], ["April 19", 53], ["May 17", 53], ["June 3", 52]]),
  },
  mood: {
    instrument: "PHQ-9",
    assessmentId: "phq-9",
    lastMeasured: "5 days ago",
    history: h([["April 14", 66], ["April 28", 69], ["May 12", 71], ["June 12", 74]]),
  },
  sleep: {
    instrument: "ISI",
    lastMeasured: "Today",
    history: h([["April 1", 65], ["April 22", 64], ["May 20", 63], ["June 17", 61]]),
  },
  relationships: {
    // A single baseline on record — demonstrates the "taken once, no recheck
    // yet" trend-row state (no second administration, so no trend to show).
    lastMeasured: "9 days ago",
    history: h([["June 8", 67]]),
  },
  lifeChanges: {
    lastMeasured: "1 week ago",
    history: h([["March 30", 50], ["April 27", 54], ["May 18", 57], ["June 10", 60]]),
  },
  confidence: {
    instrument: "RSES",
    assessmentId: "self-esteem",
    lastMeasured: "3 weeks ago",
    history: h([["March 15", 58], ["April 12", 60], ["May 10", 63], ["May 28", 66]]),
  },
  career: {
    lastMeasured: "4 days ago",
    history: h([["April 2", 62], ["April 30", 61], ["May 21", 60], ["June 13", 59]]),
  },
  grief: {
    lastMeasured: "2 weeks ago",
    history: h([["March 18", 45], ["April 15", 48], ["May 13", 52], ["June 4", 55]]),
  },
  substance: {
    lastMeasured: "1 week ago",
    history: h([["March 25", 70], ["April 22", 72], ["May 20", 74], ["June 10", 76]]),
  },
  habits: {
    lastMeasured: "3 days ago",
    history: h([["April 8", 55], ["April 29", 59], ["May 27", 62], ["June 14", 67]]),
  },
  purpose: {
    instrument: "WHO-5",
    lastMeasured: "2 weeks ago",
    history: h([["March 21", 60], ["April 18", 63], ["May 16", 66], ["June 5", 68]]),
  },
};

// The focus-area ids that can be tracked as dimensions (everything in the Q1
// set except "Something Else"), in the survey's own order.
export const TRACKABLE_IDS: string[] = FOCUS_AREAS.filter(
  (a) => a.id !== "other" && DIM_DATA[a.id],
).map((a) => a.id);

// Hydrate a dimension from its focus-area label/emoji + its demo trend data.
export function getDimension(id: string): Dimension | null {
  const area = focusAreaById(id);
  const data = DIM_DATA[id];
  if (!area || !data) return null;
  return { id, label: area.label, emoji: area.emoji ?? "•", ...data };
}

export const latestMeasurement = (d: Dimension): Measurement | null =>
  d.history[d.history.length - 1] ?? null;

export type DimensionTrend = {
  dir: "up" | "down" | "flat";
  pct: number; // absolute percent change, baseline → latest
  sinceLong: string; // baseline date, prose
};

// Percent change from the first recorded measurement to the latest, on the
// wellness axis (so "up" always reads as improvement). Null until there are at
// least two points to compare.
export function dimensionTrend(d: Dimension): DimensionTrend | null {
  if (d.history.length < 2) return null;
  const first = d.history[0];
  const last = d.history[d.history.length - 1];
  const pct = Math.round(((last.score - first.score) / first.score) * 100);
  return {
    dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
    pct: Math.abs(pct),
    sinceLong: first.longDate,
  };
}

// The single composite Yuna shows at the top of the returning dashboard: the
// mean of every tracked dimension's latest wellness score, and how far that mean
// has moved from each dimension's baseline. One number for "how are things
// overall", on the same 0–100 axis.
export type WellbeingIndex = { score: number; delta: number; tracked: number };

export function wellbeingIndex(dims: Dimension[]): WellbeingIndex {
  const tracked = dims.filter((d) => d.history.length > 0);
  if (tracked.length === 0) return { score: 0, delta: 0, tracked: 0 };
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const latest = mean(tracked.map((d) => latestMeasurement(d)!.score));
  const baseline = mean(tracked.map((d) => d.history[0].score));
  return {
    score: Math.round(latest),
    delta: Math.round(latest - baseline),
    tracked: tracked.length,
  };
}

// ─── Assessment library ─────────────────────────────────────────────────────
// The validated check-ins Yuna recommends, shown on the returning dashboard as
// compact questionnaire cards. `taken` drives the "have I done this?" indicator:
//   0  → "Not started"
//   1  → "Baseline set"   (one administration on record)
//   2+ → "Taken N×"
// `assessmentId` links a taken instrument to its history detail page.

export type LibraryMeasure = {
  id: string;
  instrument: string; // e.g. "PHQ-9"
  domain: string; // what it measures, e.g. "Depression & mood"
  cadence: "Weekly" | "Every 2 weeks" | "Monthly";
  taken: number;
  assessmentId?: string;
};

export const LIBRARY: LibraryMeasure[] = [
  { id: "phq-9", instrument: "PHQ-9", domain: "Depression & mood", cadence: "Every 2 weeks", taken: 4, assessmentId: "phq-9" },
  { id: "gad-7", instrument: "GAD-7", domain: "Anxiety", cadence: "Every 2 weeks", taken: 4, assessmentId: "gad-7" },
  { id: "pss-10", instrument: "PSS-10", domain: "Perceived stress", cadence: "Monthly", taken: 3 },
  { id: "who-5", instrument: "WHO-5", domain: "Overall wellbeing", cadence: "Monthly", taken: 1 },
  { id: "isi", instrument: "ISI", domain: "Sleep & insomnia", cadence: "Weekly", taken: 6 },
  { id: "olbi", instrument: "OLBI", domain: "Burnout", cadence: "Monthly", taken: 2 },
  { id: "ucla-3", instrument: "UCLA-3", domain: "Connection & loneliness", cadence: "Monthly", taken: 0 },
];

// The taken-state token for a measure, or "Not started" when never taken.
export function takenLabel(taken: number): string {
  if (taken <= 0) return "Not started";
  if (taken === 1) return "Baseline set";
  return `Taken ${taken}×`;
}
