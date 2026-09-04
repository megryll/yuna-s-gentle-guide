// Generic, linear survey definitions consumed by the /survey/$id runner. This
// is the playground for question-type variety: unlike the bespoke
// "your starting point" flow (focus picker + dynamic branching), a survey here
// is a flat list of typed questions, each rendered by its matching DS
// primitive. The demo survey strings every supported type together so it
// doubles as a living showcase.

export type EmojiQuestion = {
  kind: "emoji";
  id: string;
  // Shown as a chat bubble — the "does this sound like you?" framing.
  statement: string;
  options: { value: string; emoji: string; label: string }[];
  minLabel: string;
  maxLabel: string;
};

export type SingleQuestion = {
  kind: "single";
  id: string;
  prompt: string;
  options: { value: string; label: string; emoji?: string }[];
  // When set, the user can pick several options; the pane shows a Continue
  // button instead of auto-advancing on a single tap.
  multi?: boolean;
};

export type TilesQuestion = {
  kind: "tiles";
  id: string;
  prompt: string;
  options: { value: string; label: string; visual: string; description?: string }[];
};

// A screen of several simple questions, each answered with a 2–3 option pill
// toggle — the quick-fire pattern where individual answers don't each deserve
// their own pane.
export type PillGroupQuestion = {
  kind: "pillGroup";
  id: string;
  prompt: string;
  items: { id: string; label: string; options: { value: string; label: string }[] }[];
};

// `distress` marks which end signals the user is struggling, so the slider fill
// turns from green to orange once the answer crosses into that half.
export type ScaleQuestion = {
  kind: "scale";
  id: string;
  prompt: string;
  points: number;
  minLabel: string;
  maxLabel: string;
  midLabel?: string;
  distress?: "high" | "low";
};

// A discrete numeric rating (e.g. 1–5) answered by tapping a number.
export type NumericQuestion = {
  kind: "numeric";
  id: string;
  prompt: string;
  count: number;
  minLabel: string;
  maxLabel: string;
};

export type RankQuestion = {
  kind: "rank";
  id: string;
  prompt: string;
  items: { value: string; label: string; emoji?: string }[];
};

export type DemoQuestion =
  | EmojiQuestion
  | SingleQuestion
  | TilesQuestion
  | PillGroupQuestion
  | ScaleQuestion
  | NumericQuestion
  | RankQuestion;

export type SurveyDef = {
  id: string;
  // Label shown centered in the header bar (next to the speech-bubble icon).
  eyebrow: string;
  // The persistent screen title shown above the progress bar — the umbrella the
  // per-question card sits under.
  title: string;
  questions: DemoQuestion[];
  // The completion moment: Yuna reflects the new info back against what the
  // user is working on. Lines render in sequence under the avatar.
  conclusion: {
    title: string;
    reflection: string[];
  };
};

// Agree↔disagree emoji ramp reused by every "does this sound like you?" item.
const AGREE_OPTIONS = [
  { value: "1", emoji: "👎", label: "Strongly disagree" },
  { value: "2", emoji: "🙁", label: "Disagree" },
  { value: "3", emoji: "😐", label: "Neutral" },
  { value: "4", emoji: "🙂", label: "Agree" },
  { value: "5", emoji: "👍", label: "Strongly agree" },
];

// The showcase survey: one question of every supported type, in an order that
// keeps the rhythm varied (bubble → long list → tiles → quick-fire → slider →
// numeric → rank).
const DISCOVER: SurveyDef = {
  id: "discover-your-style",
  eyebrow: "Quiz",
  title: "Getting to know you",
  questions: [
    {
      kind: "emoji",
      id: "rechargeAlone",
      statement: "I recharge best with time to myself, not a crowd.",
      options: AGREE_OPTIONS,
      minLabel: "Strongly disagree",
      maxLabel: "Strongly agree",
    },
    {
      // A long list of parallel text options — the case a vertical stack is for.
      // Multi-select so the user can pick everything that helps them.
      kind: "single",
      multi: true,
      id: "overwhelmHelp",
      prompt: "When things get overwhelming, what helps you most?",
      options: [
        { value: "talk", label: "Talking it through", emoji: "💬" },
        { value: "move", label: "Moving my body", emoji: "🏃" },
        { value: "quiet", label: "Quiet and stillness", emoji: "🤍" },
        { value: "plan", label: "Making a plan", emoji: "🗒️" },
        { value: "nature", label: "Time in nature", emoji: "🌳" },
        { value: "music", label: "Putting on music", emoji: "🎧" },
        { value: "sleep", label: "Sleeping on it", emoji: "😴" },
        { value: "reach", label: "Reaching out to someone", emoji: "🤝" },
        { value: "other", label: "Something else", emoji: "✨" },
      ],
    },
    {
      // A few rich, parallel visual choices — the case a tile grid is for.
      kind: "tiles",
      id: "restPlace",
      prompt: "Where do you feel most like yourself?",
      options: [
        { value: "ocean", label: "By the water", visual: "🌊", description: "Open and calm" },
        { value: "forest", label: "In the trees", visual: "🌲", description: "Quiet and grounded" },
        { value: "city", label: "In the city", visual: "🏙️", description: "Busy and alive" },
        { value: "home", label: "At home", visual: "🏡", description: "Safe and cozy" },
      ],
    },
    {
      kind: "pillGroup",
      id: "quickfire",
      prompt: "A few quick ones.",
      items: [
        {
          id: "qf_clock",
          label: "Are you more of an…",
          options: [
            { value: "early", label: "Early bird" },
            { value: "night", label: "Night owl" },
          ],
        },
        {
          id: "qf_recharge",
          label: "You recharge…",
          options: [
            { value: "alone", label: "Alone" },
            { value: "others", label: "With others" },
          ],
        },
        {
          id: "qf_energy",
          label: "Energy for today?",
          options: [
            { value: "low", label: "Low" },
            { value: "med", label: "Medium" },
            { value: "high", label: "High" },
          ],
        },
        {
          id: "qf_pace",
          label: "You'd rather have…",
          options: [
            { value: "plan", label: "A plan" },
            { value: "flow", label: "Room to flow" },
          ],
        },
        {
          id: "qf_setting",
          label: "On a free afternoon…",
          options: [
            { value: "in", label: "Indoors" },
            { value: "out", label: "Outdoors" },
          ],
        },
      ],
    },
    {
      kind: "scale",
      id: "energyToday",
      prompt: "How much energy do you have today?",
      points: 11,
      minLabel: "Running on empty",
      midLabel: "Getting by",
      maxLabel: "Full of it",
      distress: "low",
    },
    {
      kind: "numeric",
      id: "sleepRating",
      prompt: "How rested do you feel after last night's sleep?",
      count: 5,
      minLabel: "Not at all",
      maxLabel: "Fully rested",
    },
    {
      kind: "rank",
      id: "valuesRank",
      prompt: "Drag these in order of what matters most to you right now.",
      items: [
        { value: "connection", label: "Connection", emoji: "🤝" },
        { value: "growth", label: "Growth", emoji: "🌱" },
        { value: "peace", label: "Peace of mind", emoji: "🕊️" },
        { value: "health", label: "Health", emoji: "💪" },
        { value: "freedom", label: "Freedom", emoji: "🧭" },
      ],
    },
  ],
  conclusion: {
    title: "Thank you for sharing",
    reflection: [
      "I'm getting a clearer sense of how you recharge and what steadies you.",
      "I'll keep this in mind as we work on what's been weighing on you, and I'll suggest things that fit the way you actually move through your days.",
    ],
  },
};

export const SURVEYS: Record<string, SurveyDef> = {
  [DISCOVER.id]: DISCOVER,
};

export function surveyById(id: string): SurveyDef | undefined {
  return SURVEYS[id];
}
