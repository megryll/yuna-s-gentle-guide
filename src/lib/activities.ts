export type Activity = {
  id: string;
  title: string;
  kind: "Meditation" | "Affirmation" | "Skill" | "Reflection";
  duration?: string;
  why: string;
  isNew?: boolean;
};

// Personalized activities Yuna has "placed" based on past sessions.
// Provenance lines are written in Yuna's voice — they're the whole point
// of this list, not decoration.
export const PERSONALIZED_ACTIVITIES: Activity[] = [
  {
    id: "breath-grief",
    title: "Breath for grief waves",
    kind: "Meditation",
    duration: "4 min",
    why: "After what you shared about your dad on Tuesday.",
    isNew: true,
  },
  {
    id: "evening-anchor",
    title: "Evening anchor",
    kind: "Affirmation",
    why: "Because staying present in the evenings keeps coming up.",
    isNew: true,
  },
  {
    id: "naming-underneath",
    title: "Naming what's underneath",
    kind: "Skill",
    duration: "5 min",
    why: "From your reflection on the heaviness this week.",
  },
  {
    id: "small-moment",
    title: "A small moment to keep",
    kind: "Reflection",
    duration: "2 min",
    why: "Carrying forward from our last conversation.",
  },
  {
    id: "soften-before-bed",
    title: "Soften before bed",
    kind: "Meditation",
    duration: "6 min",
    why: "For the wind-down hour you mentioned.",
  },
];

export type Topic = {
  id: string;
  title: string;
  why: string;
};

// Topics Yuna has flagged based on what's surfaced across past sessions.
// Distinct from the single "a topic for you" item at the top of home — these
// are the longer-tail threads worth coming back to.
export const PERSONALIZED_TOPICS: Topic[] = [
  {
    id: "perfectionism",
    title: "Pressure and Perfectionism",
    why: "A pattern showing up across our conversations.",
  },
  {
    id: "boundaries",
    title: "Boundaries at Work",
    why: "You hinted at this last week but we moved on.",
  },
  {
    id: "uncertainty",
    title: "Sitting with Uncertainty",
    why: "Came up around the family decision.",
  },
  {
    id: "self-compassion",
    title: "Being Kinder to Yourself",
    why: "Worth slowing down on next time.",
  },
  {
    id: "joy",
    title: "Reconnecting with Joy",
    why: "You mentioned things feeling muted lately.",
  },
];

// The themes Yuna is tracking with the user across sessions. Surfaced on
// the activities screen as cards so the user can see what Yuna believes is
// being worked on — the personalization payoff made tangible.
export const RETURNING_THEMES = ["Grief", "Evenings", "Perfectionism"];
