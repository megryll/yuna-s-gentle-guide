// First-session intake question schema.
//
// The chat conversation is mostly open. Two structured questions surface at
// predetermined beats inside the natural exchange: a wellbeing scale (mid
// flow) and a usefulness multiple choice (later). Anything else Yuna asks is
// model-driven free text.

type Common = {
  id: string;
  prompt: string;
};

// Chips: one-tap select from labeled options.
export type ChipsQuestion = Common & {
  kind: "chips";
  options: string[];
};

// Numeric slider with anchor labels at min, midpoints, and max. Value is the
// integer step the user landed on.
export type ScaleQuestion = Common & {
  kind: "scale";
  min: number;
  max: number;
  // Sparse anchor labels keyed by integer step. Steps without an entry render
  // just the number under the rail.
  anchors: Record<number, string>;
};

export type IntroQuestion = ChipsQuestion | ScaleQuestion;

// Surfaces after a few open turns. Reads as Yuna pausing to ground the
// conversation, not as a clinical assessment.
export const WELLBEING_SCALE_QUESTION: ScaleQuestion = {
  kind: "scale",
  id: "wellbeing-scale",
  prompt:
    "One small thing before we keep going. Over the last couple of weeks, where would you say you've been overall, on a scale of 1 to 10?",
  min: 1,
  max: 10,
  anchors: {
    1: "Really struggling",
    5: "Some hard days, some okay",
    10: "Genuinely doing well",
  },
};

// Surfaces near the end of the first session. Orients how future
// conversations will feel — vent space vs. focused work vs. habit-building.
export const USEFULNESS_QUESTION: ChipsQuestion = {
  kind: "chips",
  id: "usefulness",
  prompt:
    "Before we let our first conversation breathe, can I ask what would feel most useful to you when you imagine us talking again?",
  options: [
    "Just somewhere to vent",
    "Working through something specific",
    "Building habits that help me cope",
    "Honestly, not sure yet. Just seeing what this is.",
  ],
};
