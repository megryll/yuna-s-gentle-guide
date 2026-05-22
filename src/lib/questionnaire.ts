export type IntroQuestion = {
  id: string;
  prompt: string;
  options: string[];
  allowOther?: boolean;
};

export const OTHER_OPTION = "Other";

export const INTRO_QUESTIONS: IntroQuestion[] = [
  {
    id: "bring-you-here",
    prompt: "What brings you to Yuna today?",
    options: [
      "I'm carrying stress",
      "Something specific happened",
      "I want to grow and reflect",
      "Just curious",
    ],
  },
  {
    id: "overall-feel",
    prompt: "How have you been feeling overall this week?",
    options: ["On edge or anxious", "Low or flat", "Pretty steady", "Hopeful or light"],
  },
  {
    id: "heaviest-area",
    prompt: "Where in your life feels heaviest right now?",
    options: ["Work or career", "Relationships", "Self-worth or identity", "Health or body"],
    allowOther: true,
  },
  {
    id: "support-style",
    prompt: "How do you prefer to be supported?",
    options: [
      "Hold space and just listen",
      "Reflect what you're noticing",
      "Suggest tools or techniques",
      "Gently challenge me",
    ],
  },
];
