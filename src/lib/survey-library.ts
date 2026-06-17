// The unified survey library that powers the "You" tab. One flat list — no
// shelves. What distinguishes a casual discovery quiz from a clinical measure
// is the cadence tag, never a section header (discovery = "One-time", clinical
// repeats). Clinical entries are framed plainly ("Measure your anxiety") and
// borrow their scale + history from `assessment-data.ts` so the two never drift.

import { ASSESSMENTS } from "@/lib/assessment-data";

export type LibraryCadence = "One-time" | "Every 2 weeks" | "Monthly";

export type LibrarySurvey = {
  id: string;
  // Plain, casual title — no clinical instrument names in the UI.
  title: string;
  description: string;
  duration: string;
  questionCount?: number;
  cadence: LibraryCadence;
  // Surfaced under "Suggested for you" and flagged with a Badge.
  suggested?: boolean;
  // Where "take it" goes. params is spread into the route.
  to: string;
  params?: Record<string, string>;
  // When set, the survey is backed by a clinical assessment: taken-state shows
  // its trend and links to /assessment/$id for history.
  assessmentId?: string;
};

// Plain-language titles for the clinical instruments (no GAD-7 / PHQ-9 in UI).
const CLINICAL_TITLE: Record<string, string> = {
  "gad-7": "Measure your anxiety",
  "phq-9": "Measure your mood",
  "self-esteem": "Measure your self-esteem",
};

const DISCOVERY: LibrarySurvey[] = [
  {
    id: "your-starting-point",
    title: "Your starting point",
    description:
      "Choose what you'd like support with, then answer a short set of questions to mark where you're starting from.",
    duration: "3 min",
    cadence: "One-time",
    suggested: true,
    to: "/questionnaire/$id",
    params: { id: "your-starting-point" },
  },
];

// Clinical measures, derived from the validated assessments. Not-taken → the
// baseline flow; taken-state routing is decided at the call site.
const CLINICAL: LibrarySurvey[] = ASSESSMENTS.map((a) => ({
  id: a.id,
  title: CLINICAL_TITLE[a.id] ?? `Measure your ${a.domain.toLowerCase()}`,
  description: a.description,
  duration: a.durationLabel,
  questionCount: a.questionCount,
  cadence: "Every 2 weeks",
  suggested: a.id === "gad-7",
  to: "/questionnaire/$id",
  params: { id: "your-starting-point" },
  assessmentId: a.id,
}));

export const SURVEY_LIBRARY: LibrarySurvey[] = [...DISCOVERY, ...CLINICAL];
