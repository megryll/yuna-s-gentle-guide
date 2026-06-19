// "Your starting point" questionnaire content — transcribed verbatim from
// BASELINE-QUESTIONNAIRE.md (the extracted source of truth). Instrument text is
// validated; don't reword it. Warmth lives in the screen chrome around it.

export type FocusArea = { id: string; emoji?: string; label: string };

// Step 1 — "What would you like support with right now?" Pick up to 3,
// selection order = priority. The top priority drives steps 2–5.
export const FOCUS_AREAS: FocusArea[] = [
  { id: "stress", emoji: "😰", label: "Stress" },
  { id: "burnout", emoji: "🔥", label: "Burnout" },
  { id: "mood", emoji: "🌊", label: "Mood & Emotions" },
  { id: "sleep", emoji: "😴", label: "Sleep & Energy" },
  { id: "relationships", emoji: "❤️", label: "Relationships" },
  { id: "lifeChanges", emoji: "🔄", label: "Life Changes" },
  { id: "confidence", emoji: "💪", label: "Confidence & Self-Worth" },
  { id: "career", emoji: "💼", label: "Career & Performance" },
  { id: "grief", emoji: "🕊️", label: "Grief & Loss" },
  { id: "substance", emoji: "🍷", label: "Substance Use (alcohol, smoking)" },
  { id: "habits", emoji: "🌱", label: "Building Better Habits" },
  { id: "purpose", emoji: "🧭", label: "Finding Purpose & Direction" },
  { id: "other", label: "Something Else" },
];

// `distress` marks which end of an item signals the user is struggling
// ("high" = top of the range, "low" = bottom) — the survey colors its slider
// fill against it: green on the positive side, orange once the answer crosses
// into the struggling half.
export type LikertItem = {
  kind: "likert";
  id: string;
  prompt: string;
  options: { value: string; label: string }[];
  distress?: "high" | "low";
};
export type ScaleItem = {
  kind: "scale";
  id: string;
  prompt: string;
  points: number; // discrete points on the rail (11 for 0–10)
  minLabel: string;
  maxLabel: string;
  midLabel?: string; // when present, a live descriptor accompanies the value
  // Per-value descriptor (length === points). When present it names every step,
  // so the chosen label shows below the number for any choice — preferred over
  // midLabel's coarse three-band fallback.
  levels?: readonly string[];
  distress?: "high" | "low";
};
export type BankItem = LikertItem | ScaleItem;

// Step 2 — framed against the top priority (shown as a chip above it).
export const IMPACT_ITEM: ScaleItem = {
  kind: "scale",
  id: "workImpact",
  prompt: "How much has this been affecting your ability to work?",
  points: 9, // 0–8
  minLabel: "Not at all impaired",
  midLabel: "Moderately impaired",
  maxLabel: "Very severely impaired",
  distress: "high",
};

const likert = (
  id: string,
  prompt: string,
  labels: string[],
  distress?: "high" | "low",
  firstValue = 1,
): LikertItem => ({
  kind: "likert",
  id,
  prompt,
  options: labels.map((label, i) => ({ value: String(firstValue + i), label })),
  distress,
});

export const QUESTION_BANK: Record<string, BankItem> = {
  globalMentalHealth: likert(
    "globalMentalHealth",
    "In general, how would you rate your mental health, including your mood and your ability to think?",
    ["Poor", "Fair", "Good", "Very good", "Excellent"],
    "low",
  ),
  anxiety: likert(
    "anxiety",
    "Over the last two weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
    ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    "high",
    0,
  ),
  stressLevel: {
    kind: "scale",
    id: "stressLevel",
    prompt: "On a scale of 0–10, how would you rate your stress level in the past week?",
    points: 11,
    minLabel: "No stress",
    maxLabel: "Worst possible",
    distress: "high",
  },
  loneliness: {
    kind: "scale",
    id: "loneliness",
    prompt: "How lonely have you been feeling?",
    points: 11,
    minLabel: "No loneliness",
    maxLabel: "Extremely lonely",
    levels: [
      "No loneliness",
      "Barely lonely",
      "Slightly lonely",
      "A little lonely",
      "Somewhat lonely",
      "Moderately lonely",
      "Fairly lonely",
      "Quite lonely",
      "Very lonely",
      "Severely lonely",
      "Extremely lonely",
    ],
    distress: "high",
  },
  perceivedControl: likert(
    "perceivedControl",
    "Regardless of what happens to me, I believe I can control my reaction to it.",
    [
      "Does not describe me at all",
      "Does not describe me",
      "Neutral",
      "Describes me",
      "Describes me very well",
    ],
    "low",
  ),
  selfEsteem: likert(
    "selfEsteem",
    "I have high self-esteem.",
    [
      "Not very true of me",
      "Mostly not true of me",
      "Somewhat true of me",
      "Mostly true of me",
      "Very true of me",
    ],
    "low",
  ),
  burnoutSingleItem: likert(
    "burnoutSingleItem",
    "Which best describes how you feel about your work right now?",
    [
      "I enjoy my work. I have no symptoms of burnout.",
      "Occasionally I am under stress, and I don't always have as much energy as I once did, but I don't feel burned out.",
      "I am definitely burning out and have one or more symptoms of burnout, such as physical and emotional exhaustion.",
      "The symptoms of burnout that I'm experiencing won't go away. I think about frustration at work a lot.",
      "I feel completely burned out and often wonder if I can go on. I am at the point where I may need some changes or may need to seek some sort of help.",
    ],
    "high",
  ),
  fatigue: {
    kind: "scale",
    id: "fatigue",
    prompt: "In the past 7 days, how would you rate your fatigue on average?",
    points: 11,
    minLabel: "No fatigue",
    maxLabel: "Worst possible",
    levels: [
      "No fatigue",
      "Barely tired",
      "Slightly tired",
      "A little tired",
      "Somewhat tired",
      "Moderately tired",
      "Fairly tired",
      "Quite tired",
      "Very tired",
      "Severely fatigued",
      "Worst possible",
    ],
    distress: "high",
  },
  emotionallyDrained: likert(
    "emotionallyDrained",
    "How often do you feel emotionally drained by your work?",
    ["Never or almost never", "Seldom", "Sometimes", "Often", "Always"],
    "high",
  ),
  positiveSpirits: likert(
    "positiveSpirits",
    "In the past week, I felt positive and in good spirits.",
    ["Never", "Rarely", "Sometimes", "Often", "Always"],
    "low",
  ),
  sleepQuality: likert(
    "sleepQuality",
    "My sleep quality was…",
    ["Very poor", "Poor", "Fair", "Good", "Very good"],
    "low",
  ),
  relationshipSatisfaction: likert(
    "relationshipSatisfaction",
    "How satisfied are you with your personal relationships?",
    [
      "Very dissatisfied",
      "Dissatisfied",
      "Neither satisfied nor dissatisfied",
      "Satisfied",
      "Very satisfied",
    ],
    "low",
  ),
  workLifeBalance: {
    kind: "scale",
    id: "workLifeBalance",
    prompt: "How satisfied are you with the balance between your work and personal life?",
    points: 11,
    minLabel: "Very dissatisfied",
    maxLabel: "Very satisfied",
    distress: "low",
  },
  griefInterference: likert(
    "griefInterference",
    "My grief has interfered with my ability to function in daily life.",
    ["Not at all", "A little", "Somewhat", "Quite a bit", "Extremely"],
    "high",
    0,
  ),
  substanceConfidence: {
    kind: "scale",
    id: "substanceConfidence",
    prompt:
      "How confident are you that you could resist the urge to use substances when you feel stressed?",
    points: 11,
    minLabel: "Not at all confident",
    maxLabel: "Completely confident",
    distress: "low",
  },
  lifeMeaning: likert(
    "lifeMeaning",
    "My life has meaning.",
    ["Never", "Rarely", "Sometimes", "Often", "Always"],
    "low",
  ),
  cantrilLadder: {
    kind: "scale",
    id: "cantrilLadder",
    prompt:
      "Imagine a ladder with steps numbered 0 at the bottom to 10 at the top. The top represents the best possible life for you; the bottom, the worst. On which step do you feel you stand at this time?",
    points: 11,
    minLabel: "Worst possible life",
    maxLabel: "Best possible life",
    distress: "low",
  },
};

// Steps 3–5: three items drawn from the bank per top priority.
export const BRANCH_MAP: Record<string, [string, string, string]> = {
  stress: ["stressLevel", "anxiety", "globalMentalHealth"],
  burnout: ["burnoutSingleItem", "emotionallyDrained", "globalMentalHealth"],
  mood: ["globalMentalHealth", "anxiety", "positiveSpirits"],
  sleep: ["sleepQuality", "fatigue", "globalMentalHealth"],
  relationships: ["relationshipSatisfaction", "loneliness", "stressLevel"],
  lifeChanges: ["perceivedControl", "anxiety", "stressLevel"],
  confidence: ["selfEsteem", "globalMentalHealth", "loneliness"],
  career: ["workLifeBalance", "selfEsteem", "burnoutSingleItem"],
  grief: ["griefInterference", "globalMentalHealth", "perceivedControl"],
  substance: ["substanceConfidence", "globalMentalHealth", "stressLevel"],
  habits: ["globalMentalHealth", "stressLevel", "perceivedControl"],
  purpose: ["lifeMeaning", "fatigue", "cantrilLadder"],
  other: ["globalMentalHealth", "anxiety", "perceivedControl"],
};

export function branchItemsFor(topPriority: string): BankItem[] {
  const ids = BRANCH_MAP[topPriority] ?? BRANCH_MAP.other;
  return ids.map((id) => QUESTION_BANK[id]);
}

export function focusAreaById(id: string): FocusArea | undefined {
  return FOCUS_AREAS.find((a) => a.id === id);
}
