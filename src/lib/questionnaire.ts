// Intro questionnaire schema.
//
// Two universal questions (priority + WSAS work functioning) followed by a
// branch of three sub-questions chosen by the user's top priority. Sourced
// from Fit Minded's Ongoing Assessments doc (Jennifer Huberty PhD).

export const PRIORITY_KEYS = [
  "stress",
  "burnout",
  "mood",
  "sleep",
  "relationships",
  "life-changes",
  "confidence",
  "career",
  "grief",
  "substance",
  "habits",
  "purpose",
  "something-else",
] as const;
export type PriorityKey = (typeof PRIORITY_KEYS)[number];

export type PriorityOption = { key: PriorityKey; label: string };
export const PRIORITY_OPTIONS: PriorityOption[] = [
  { key: "stress", label: "Stress" },
  { key: "burnout", label: "Burnout" },
  { key: "mood", label: "Mood & Emotions" },
  { key: "sleep", label: "Sleep & Energy" },
  { key: "relationships", label: "Relationships" },
  { key: "life-changes", label: "Life Changes" },
  { key: "confidence", label: "Confidence & Self-Worth" },
  { key: "career", label: "Career & Performance" },
  { key: "grief", label: "Grief & Loss" },
  { key: "substance", label: "Substance Use (alcohol, smoking)" },
  { key: "habits", label: "Building Better Habits" },
  { key: "purpose", label: "Finding Purpose & Direction" },
  { key: "something-else", label: "Something Else" },
];

// ─── Question kinds ────────────────────────────────────────────────────────

type Common = {
  id: string;
  prompt: string;
  helper?: string;
  // Short caps-tracked label rendered above the prompt — used for meta hints
  // like "Select up to 3" that pair with a separate main question.
  subheader?: string;
};

// Chips: one-tap select from labeled options. Used for ordinal scales whose
// stops have named meanings (e.g. "Very poor … Very good") and for Likert
// frequencies (Never … Always).
export type ChipsQuestion = Common & {
  kind: "chips";
  options: string[];
};

// Multi-priority: tap to add to a ranked list; tap again to remove. Order =
// tap order, with the first tap as the user's top priority. Capped at 3.
export type MultiPriorityQuestion = Common & {
  kind: "multi-priority";
  options: PriorityOption[];
  maxSelect: number;
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

export type IntroQuestion = ChipsQuestion | MultiPriorityQuestion | ScaleQuestion;

// Token used inside Q2's prompt — replaced with the user's top priority
// label at render time so the WSAS question reads naturally.
export const TOP_PRIORITY_TOKEN = "[selected top priority]";

// ─── Universal questions ───────────────────────────────────────────────────

export const PRIORITY_QUESTION: MultiPriorityQuestion = {
  kind: "multi-priority",
  id: "priorities",
  subheader: "Select up to 3",
  prompt: "What would you like support with?",
  options: PRIORITY_OPTIONS,
  maxSelect: 3,
};

export const WSAS_QUESTION: ScaleQuestion = {
  kind: "scale",
  id: "wsas-work",
  prompt: `How much has your ${TOP_PRIORITY_TOKEN} been affecting your ability to work?`,
  min: 0,
  max: 8,
  anchors: {
    0: "Not at all impaired",
    4: "Moderately impaired",
    8: "Very severely impaired",
  },
};

export const UNIVERSAL_QUESTIONS: IntroQuestion[] = [PRIORITY_QUESTION, WSAS_QUESTION];

// ─── Reusable sub-questions (used across multiple branches) ────────────────

const stressPastWeek: ScaleQuestion = {
  kind: "scale",
  id: "stress-past-week",
  prompt: "On a scale of 0–10, how would you rate your stress level in the past week?",
  min: 0,
  max: 10,
  anchors: { 0: "No stress", 10: "Worst possible" },
};

const anxiousOnEdge: ChipsQuestion = {
  kind: "chips",
  id: "anxious-on-edge",
  prompt:
    "Over the last two weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
  options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
};

const mentalHealthGeneral: ChipsQuestion = {
  kind: "chips",
  id: "mental-health-general",
  prompt:
    "In general, how would you rate your mental health, including your mood and your ability to think?",
  options: ["Poor", "Fair", "Good", "Very good", "Excellent"],
};

const fatigueAvg: ScaleQuestion = {
  kind: "scale",
  id: "fatigue-avg",
  prompt: "In the past 7 days, how would you rate your fatigue on average?",
  min: 0,
  max: 10,
  anchors: { 0: "No fatigue", 10: "Worst possible" },
};

const lonely: ScaleQuestion = {
  kind: "scale",
  id: "lonely",
  prompt: "How lonely have you been feeling?",
  min: 0,
  max: 10,
  anchors: { 0: "None", 10: "Extremely" },
};

const controlReaction: ChipsQuestion = {
  kind: "chips",
  id: "control-reaction",
  prompt:
    "How much do you feel you can control your reactions, no matter what happens to you?",
  options: [
    "Not at all like me",
    "Not really like me",
    "Neutral",
    "Pretty much like me",
    "Very much like me",
  ],
};

const burnoutSelf: ChipsQuestion = {
  kind: "chips",
  id: "burnout-self",
  prompt: "Which best describes how you feel about your work right now?",
  options: [
    "I enjoy my work. I have no symptoms of burnout.",
    "Occasionally I am under stress, and I don't always have as much energy as I once did, but I don't feel burned out.",
    "I am definitely burning out and have one or more symptoms of burnout, such as physical and emotional exhaustion.",
    "The symptoms of burnout I'm experiencing won't go away. I think about frustration at work a lot.",
    "I feel completely burned out and often wonder if I can go on. I may need some changes or to seek some sort of help.",
  ],
};

const highSelfEsteem: ChipsQuestion = {
  kind: "chips",
  id: "self-esteem",
  prompt: "How true is it for you that you have high self-esteem?",
  options: [
    "Not very true of me",
    "Mostly not true of me",
    "Somewhat true of me",
    "Mostly true of me",
    "Very true of me",
  ],
};

// ─── Branch-specific sub-questions ─────────────────────────────────────────

const emotionallyDrained: ChipsQuestion = {
  kind: "chips",
  id: "emotionally-drained",
  prompt: "How often do you feel emotionally drained by your work?",
  options: ["Never/almost never", "Seldom", "Sometimes", "Often", "Always"],
};

const positiveSpirits: ChipsQuestion = {
  kind: "chips",
  id: "positive-spirits",
  prompt: "In the past week, how often have you felt positive and in good spirits?",
  options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
};

const sleepQuality: ChipsQuestion = {
  kind: "chips",
  id: "sleep-quality",
  prompt: "In the past 7 days, how would you rate your sleep quality?",
  options: ["Very poor", "Poor", "Fair", "Good", "Very good"],
};

const relationshipsSatisfaction: ChipsQuestion = {
  kind: "chips",
  id: "relationships-satisfaction",
  prompt: "How satisfied are you with your personal relationships?",
  options: ["Very dissatisfied", "Dissatisfied", "Neither", "Satisfied", "Very satisfied"],
};

const workLifeBalance: ScaleQuestion = {
  kind: "scale",
  id: "work-life-balance",
  prompt: "How satisfied are you with the balance between your work and personal life?",
  min: 0,
  max: 10,
  anchors: { 0: "Very dissatisfied", 10: "Very satisfied" },
};

const griefInterfered: ChipsQuestion = {
  kind: "chips",
  id: "grief-interfered",
  prompt:
    "How much has grief been interfering with your ability to function in daily life?",
  options: ["Not at all", "A little", "Somewhat", "Quite a bit", "Extremely"],
};

const resistUrge: ScaleQuestion = {
  kind: "scale",
  id: "resist-urge",
  prompt:
    "How confident are you that you could resist the urge to use substances when you feel stressed?",
  min: 0,
  max: 10,
  anchors: { 0: "Not at all confident", 10: "Completely confident" },
};

const lifeMeaning: ChipsQuestion = {
  kind: "chips",
  id: "life-meaning",
  prompt: "How often do you feel your life has meaning?",
  options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
};

const ladder: ScaleQuestion = {
  kind: "scale",
  id: "ladder",
  prompt: "Overall, how would you rate where your life stands right now?",
  min: 0,
  max: 10,
  anchors: { 0: "Worst possible life", 10: "Best possible life" },
};

// ─── Branches (3 sub-questions per priority) ───────────────────────────────

export const BRANCH_QUESTIONS: Record<PriorityKey, IntroQuestion[]> = {
  stress: [stressPastWeek, anxiousOnEdge, mentalHealthGeneral],
  burnout: [burnoutSelf, emotionallyDrained, mentalHealthGeneral],
  mood: [mentalHealthGeneral, anxiousOnEdge, positiveSpirits],
  sleep: [sleepQuality, fatigueAvg, mentalHealthGeneral],
  relationships: [relationshipsSatisfaction, lonely, stressPastWeek],
  "life-changes": [controlReaction, anxiousOnEdge, stressPastWeek],
  confidence: [highSelfEsteem, mentalHealthGeneral, lonely],
  career: [workLifeBalance, highSelfEsteem, burnoutSelf],
  grief: [griefInterfered, mentalHealthGeneral, controlReaction],
  substance: [resistUrge, mentalHealthGeneral, stressPastWeek],
  habits: [mentalHealthGeneral, stressPastWeek, controlReaction],
  purpose: [lifeMeaning, fatigueAvg, ladder],
  "something-else": [mentalHealthGeneral, anxiousOnEdge, controlReaction],
};

// Sub-question IDs that overlap with WSAS / priority data. None of the branch
// questions duplicate Q1 or Q2's content today, but keep the helper here so
// future edits can dedupe automatically.
export function branchFor(top: PriorityKey): IntroQuestion[] {
  return BRANCH_QUESTIONS[top] ?? BRANCH_QUESTIONS["something-else"];
}

// Resolve the priority label for a given key (used to interpolate WSAS).
export function priorityLabel(key: PriorityKey): string {
  return PRIORITY_OPTIONS.find((p) => p.key === key)?.label ?? "what you chose";
}
