// Demo data for the validated-assessment feature: the instruments Yuna has
// suggested so far, each with its real scale, severity bands, and the
// administrations recorded over time. Shared by the check-ins hub (trend cards)
// and the /assessment/$id detail view so the two never drift.

import { dimensionTrend, getDimension } from "@/lib/progress-data";

export type AssessmentEntry = {
  date: string; // short axis label
  longDate: string; // prose-friendly date
  score: number;
  // Provenance — what Yuna noticed that prompted this administration.
  note: string;
};

// A severity band on the instrument's scale. `from`/`to` are score-space edges
// (to is exclusive except the top band). Listed top-down, highest scores first.
export type Band = { label: string; from: number; to: number };

export type Assessment = {
  id: string; // route param, e.g. "gad-7"
  domain: string; // human title, e.g. "Anxiety"
  instrument: string; // validated tool, e.g. "GAD-7", or "Yuna check-in" for a custom dimension
  // Clinical-instrument metadata; omitted for synthesized custom-dimension details.
  questionCount?: number;
  durationLabel?: string; // "2 min"
  max: number;
  bands: Band[];
  // Whether a higher score is the concerning direction. Anxiety/depression:
  // true. Self-esteem: false (higher is healthier) — flips which band reads as
  // "most concern" for the chart's background geography.
  higherIsWorse: boolean;
  // One-liner shown under the assessment name on the hub card.
  description: string;
  // Yuna's reflection on the trend, shown on the detail view.
  reflection: string;
  // Cadence footnote on the detail view.
  cadenceNote: string;
  // Short next-recommended date, e.g. "June 25" — the editable footer line.
  nextOn: string;
  history: AssessmentEntry[];
};

export const ASSESSMENTS: Assessment[] = [
  {
    id: "gad-7",
    domain: "Anxiety",
    instrument: "GAD-7",
    questionCount: 7,
    durationLabel: "2 min",
    max: 21,
    higherIsWorse: true,
    bands: [
      { label: "Severe", from: 15, to: 21 },
      { label: "Moderate", from: 10, to: 15 },
      { label: "Mild", from: 5, to: 10 },
      { label: "Minimal", from: 0, to: 5 },
    ],
    description: "Monitor your anxiety levels to reflect, identify patterns, and steady yourself.",
    reflection:
      "Your anxiety score has moved from the moderate range into mild since March. You told me work started feeling calmer around the same time, and the numbers agree.",
    cadenceNote:
      "Yuna offers this check-in about once a month. Your next one is expected around June 14, or sooner if anxiety comes up in your sessions.",
    nextOn: "June 25",
    history: [
      {
        date: "Mar 12",
        longDate: "March 12",
        score: 12,
        note: "You had mentioned racing thoughts a few times that week, so Yuna suggested a first anxiety check-in to see it clearly.",
      },
      {
        date: "Apr 9",
        longDate: "April 9",
        score: 9,
        note: "A follow-up about a month later, after you told Yuna the new team was starting to feel calmer.",
      },
      {
        date: "May 14",
        longDate: "May 14",
        score: 6,
        note: "Sleep had been steadier for a few weeks, and Yuna checked in to see whether the calm was holding.",
      },
    ],
  },
  {
    id: "phq-9",
    domain: "Depression",
    instrument: "PHQ-9",
    questionCount: 9,
    durationLabel: "2 min",
    max: 27,
    higherIsWorse: true,
    bands: [
      { label: "Severe", from: 20, to: 27 },
      { label: "Moderate", from: 10, to: 20 },
      { label: "Mild", from: 5, to: 10 },
      { label: "Minimal", from: 0, to: 5 },
    ],
    description: "Track low mood over time so small shifts are easier to notice and name.",
    reflection:
      "Your mood scores have eased out of the moderate range since early spring. You mentioned getting outside more in the mornings, and that lines up with what the check-ins show.",
    cadenceNote:
      "Yuna offers this check-in every two weeks. Your next one is expected in late June, or sooner if low mood comes up in your sessions.",
    nextOn: "June 26",
    history: [
      {
        date: "Apr 14",
        longDate: "April 14",
        score: 12,
        note: "You had described a string of flat, heavy days, so Yuna suggested a first mood check-in to ground it in something concrete.",
      },
      {
        date: "Apr 28",
        longDate: "April 28",
        score: 9,
        note: "A follow-up after you started getting outside on your morning walks again.",
      },
      {
        date: "May 12",
        longDate: "May 12",
        score: 8,
        note: "Things had felt lighter for a couple of weeks, and Yuna checked whether the lift was holding.",
      },
      {
        date: "Jun 12",
        longDate: "June 12",
        score: 6,
        note: "The steadier stretch had held, and Yuna checked in to see it land firmly in the mild range.",
      },
    ],
  },
  {
    id: "self-esteem",
    domain: "Self-esteem",
    instrument: "Rosenberg scale",
    questionCount: 10,
    durationLabel: "3 min",
    max: 30,
    higherIsWorse: false,
    bands: [
      { label: "High", from: 20, to: 30 },
      { label: "Average", from: 10, to: 20 },
      { label: "Low", from: 0, to: 10 },
    ],
    description: "See how kindly you've been relating to yourself, and where that's heading.",
    reflection:
      "Your self-esteem has climbed steadily since March. You told me you'd been catching the harsh inner voice sooner, and answering it more gently. The trend reflects that work.",
    cadenceNote:
      "Yuna offers this check-in every month or so. Your next one is expected in early July, or sooner if it feels relevant in your sessions.",
    nextOn: "July 8",
    history: [
      {
        date: "Mar 15",
        longDate: "March 15",
        score: 14,
        note: "You'd been speaking harshly about yourself in a few sessions, so Yuna suggested a first self-esteem check-in.",
      },
      {
        date: "Apr 19",
        longDate: "April 19",
        score: 18,
        note: "A follow-up after you'd been practicing meeting setbacks with more self-compassion.",
      },
      {
        date: "May 24",
        longDate: "May 24",
        score: 22,
        note: "You'd noticed the kinder voice coming more naturally, and Yuna checked in to see it on the scale.",
      },
    ],
  },
];

export const getAssessment = (id: string): Assessment | undefined =>
  ASSESSMENTS.find((a) => a.id === id);

// Generic wellness geography for custom dimensions: a 0–100 axis where higher is
// healthier (so the darkest band is the bottom). Reused by every synthesized
// dimension detail so they read as one system.
const WELLNESS_BANDS: Band[] = [
  { label: "Thriving", from: 75, to: 100 },
  { label: "Steady", from: 50, to: 75 },
  { label: "Finding footing", from: 25, to: 50 },
  { label: "Struggling", from: 0, to: 25 },
];

const MONTHS: Record<string, string> = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr", May: "May", June: "Jun",
  July: "Jul", August: "Aug", September: "Sep", October: "Oct", November: "Nov", December: "Dec",
};
const shortDate = (longDate: string): string =>
  longDate.replace(/^(\w+)/, (m) => MONTHS[m] ?? m);

// Custom dimensions carry no authored instrument cadence, so Yuna recommends the
// next check-in on a regular rhythm — a couple of weeks out from today.
function nextCheckInDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// A custom dimension (no validated instrument) rendered through the same detail
// view: its real 0–100 wellness history, generic wellness bands, and a short
// reflection drawn from the trend so the screen needs no per-dimension copy.
function synthFromDimension(id: string): Assessment | undefined {
  const d = getDimension(id);
  if (!d || d.history.length === 0) return undefined;
  const trend = dimensionTrend(d);
  const area = d.label.toLowerCase();
  const reflection = !trend
    ? `This is your baseline for ${area}. Each check-in from here gives it a line to move along.`
    : trend.dir === "up"
      ? `Your sense of ${area} has been trending up since ${trend.sinceLong}. Whatever you have been leaning on lately, it is showing here.`
      : trend.dir === "down"
        ? `Your sense of ${area} has eased down since ${trend.sinceLong}. It might be worth noticing what has felt heavier in that stretch.`
        : `Your sense of ${area} has held fairly steady since ${trend.sinceLong}.`;
  return {
    id: d.id,
    domain: d.label,
    instrument: d.instrument ?? "Yuna check-in",
    max: 100,
    higherIsWorse: false,
    bands: WELLNESS_BANDS,
    description: "",
    reflection,
    cadenceNote: "",
    nextOn: nextCheckInDate(),
    history: d.history.map((m) => ({
      date: shortDate(m.longDate),
      longDate: m.longDate,
      score: m.score,
      note: "",
    })),
  };
}

// The detail view's resolver: a validated instrument when one exists, otherwise a
// custom dimension synthesized from its wellness trend. Lets every tracked
// dimension reach a real detail screen instead of bouncing to the baseline quiz.
export const getAssessmentOrDimension = (id: string): Assessment | undefined =>
  getAssessment(id) ?? synthFromDimension(id);

// Classify a score into its band (to is exclusive except the top band).
export const bandFor = (a: Assessment, score: number): Band =>
  a.bands.find((b) => score >= b.from && (score < b.to || b.to === a.max))!;

// Concern rank for a band, 0 = most concerning (darkest geography). Flips with
// the instrument's valence: high-bad scales darken the top band, high-good
// scales darken the bottom band.
export const bandConcernRank = (a: Assessment, bandIndex: number): number =>
  a.higherIsWorse ? bandIndex : a.bands.length - 1 - bandIndex;

// Plain-language change since the previous administration. Direction is stated
// neutrally (up/down), so it reads correctly whichever valence the scale has.
export function assessmentDelta(history: AssessmentEntry[], i: number): string {
  if (i === 0) return "your first check-in";
  const prev = history[i - 1];
  const diff = history[i].score - prev.score;
  if (diff === 0) return `unchanged since ${prev.longDate}`;
  return `${diff < 0 ? "down" : "up"} ${Math.abs(diff)} since ${prev.longDate}`;
}

// Compact delta for a trend row (no date): "down 3", "up 2", "steady".
export function compactDelta(history: AssessmentEntry[]): string {
  if (history.length < 2) return "first check-in";
  const diff = history[history.length - 1].score - history[history.length - 2].score;
  if (diff === 0) return "steady";
  return `${diff < 0 ? "down" : "up"} ${Math.abs(diff)}`;
}
