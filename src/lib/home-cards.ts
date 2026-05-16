export type HomeCard =
  | {
      type: "guided-session";
      id: string;
      title: string;
      subtitle?: string;
      naturePath?: string;
      isNew?: boolean;
      isSaved?: boolean;
    }
  | {
      type: "meditation";
      id: string;
      title: string;
      cadence: "Daily";
      naturePath?: string;
      isNew?: boolean;
      isSaved?: boolean;
    }
  | {
      type: "gratitude";
      id: string;
      prompt: string;
      cadence: "Daily";
      naturePath?: string;
      isNew?: boolean;
      isSaved?: boolean;
    }
  | {
      type: "self-discovery";
      id: string;
      title: string;
      description: string;
      duration: string;
      naturePath?: string;
      isNew?: boolean;
      isSaved?: boolean;
    }
  | {
      type: "affirmation";
      id: string;
      quote: string;
      cadence: "Daily";
      naturePath?: string;
      isNew?: boolean;
      isSaved?: boolean;
    }
  | {
      type: "learn-skill";
      id: string;
      title: string;
      eyebrow: string;
      naturePath?: string;
      isNew?: boolean;
      isSaved?: boolean;
    }
  | {
      type: "accountability";
      id: string;
      goal: string;
      eyebrow: string;
      naturePath?: string;
      isNew?: boolean;
      isSaved?: boolean;
    }
  | {
      type: "book";
      id: string;
      title: string;
      author: string;
      rating: number;
      cover?: string;
      naturePath?: string;
      isNew?: boolean;
      isSaved?: boolean;
    };

export type CardKind = HomeCard["type"];

export type CardKindMeta = {
  label: string;
  emoji: string;
  accent: string;
  // dark = white text on accent-tinted dark gradient
  // light = dark text on pale warm bg
  tone: "dark" | "light";
  action: "play" | "arrow" | "check";
  ctaLabel: string;
  // Fallback photo when an individual card doesn't override `naturePath`.
  naturePath: string;
};

export const KIND_META: Record<CardKind, CardKindMeta> = {
  "guided-session": {
    label: "Guided Session",
    emoji: "🛏️",
    accent: "#5E8B6D",
    tone: "dark",
    action: "play",
    ctaLabel: "Begin session",
    naturePath: "/nature/Background-2.png",
  },
  meditation: {
    label: "Personalised Meditation",
    emoji: "🧘",
    accent: "#6FA88B",
    tone: "dark",
    action: "play",
    ctaLabel: "Try this meditation",
    naturePath: "/nature/Background-1.png",
  },
  gratitude: {
    label: "Gratitude List",
    emoji: "🙏",
    accent: "#C7916A",
    tone: "dark",
    action: "arrow",
    ctaLabel: "My gratitude journal",
    naturePath: "/nature/Background-17.png",
  },
  "self-discovery": {
    label: "Self-Discovery",
    emoji: "🌿",
    accent: "#5E9389",
    tone: "dark",
    action: "arrow",
    ctaLabel: "Try it now",
    naturePath: "/nature/Background-9.png",
  },
  affirmation: {
    label: "Affirmation",
    emoji: "⭐",
    accent: "#B58547",
    tone: "dark",
    action: "play",
    ctaLabel: "Play affirmation",
    naturePath: "/nature/Background-13.png",
  },
  "learn-skill": {
    label: "Recommended Skill",
    emoji: "📒",
    accent: "#7BB068",
    tone: "dark",
    action: "arrow",
    ctaLabel: "Learn this skill",
    naturePath: "/nature/Background-6.png",
  },
  accountability: {
    label: "Accountability Partner",
    emoji: "🤝",
    accent: "#7E84CC",
    tone: "dark",
    action: "check",
    ctaLabel: "Mark as done",
    naturePath: "/nature/Background-5.png",
  },
  book: {
    label: "Book Recommendation",
    emoji: "📗",
    accent: "#8FB46A",
    tone: "dark",
    action: "check",
    ctaLabel: "I read this",
    naturePath: "/nature/Background-3.png",
  },
};

export const HOME_CARDS: HomeCard[] = [
  {
    type: "guided-session",
    id: "intro-session",
    title: "An introductory session",
    subtitle: "A gentle place to start — share a little, and I'll listen for what matters to you.",
    naturePath: "/nature/Background-2.png",
    isNew: true,
  },
  {
    type: "meditation",
    id: "calm-heartbreak",
    title: "Meditation For You: Finding Calm After Heartbreak",
    cadence: "Daily",
    naturePath: "/nature/Background-14.png",
    isNew: true,
    isSaved: true,
  },
  {
    type: "gratitude",
    id: "gratitude-today",
    prompt: "I feel grateful today, because:",
    cadence: "Daily",
    naturePath: "/nature/Background-7.png",
  },
  {
    type: "self-discovery",
    id: "feeling-check",
    title: "How Have You Been Feeling Lately?",
    description:
      "A 9-question check-in that helps measure your mood and emotional wellbeing over the past two weeks.",
    duration: "5–10 minutes",
    naturePath: "/nature/Background-11.png",
  },
  {
    type: "affirmation",
    id: "strength-overcome",
    quote:
      "I have the strength to overcome obstacles—each step forward is progress. Embrace challenges and keep moving confidently.",
    cadence: "Daily",
    naturePath: "/nature/Background-19.png",
    isSaved: true,
  },
  {
    type: "learn-skill",
    id: "please-technique",
    title: "A skill that could benefit you is 'PLEASE' Technique",
    eyebrow: "Recommended Skill",
    naturePath: "/nature/Background-4.png",
  },
  {
    type: "accountability",
    id: "daily-agenda",
    goal: "I will prepare a daily agenda every morning this week",
    eyebrow: "Your Goal",
    naturePath: "/nature/Background-20.png",
  },
  {
    type: "book",
    id: "self-compassion-neff",
    title: "Self-Compassion: The Proven Power of Being Kind to Yourself",
    author: "Kristin Neff",
    rating: 4.6,
    cover: "/books/self-compassion.jpg",
    naturePath: "/nature/Background-3.png",
  },
  {
    type: "guided-session",
    id: "perfectionism-work",
    title: "Untangle perfectionism at work, one thread at a time",
    subtitle: "You've used the word 'should' a lot this week — let's dig in.",
    naturePath: "/nature/Background-15.png",
  },
  {
    type: "meditation",
    id: "midday-reset",
    title: "Meditation For You: A Five-Minute Midday Reset",
    cadence: "Daily",
    naturePath: "/nature/Background-8.png",
  },
  {
    type: "gratitude",
    id: "gratitude-surprise",
    prompt: "Three small things today that didn't have to go right—but did:",
    cadence: "Daily",
    naturePath: "/nature/Background-16.png",
  },
  {
    type: "self-discovery",
    id: "energy-audit",
    title: "Where Is Your Energy Actually Going?",
    description:
      "A short audit of where your week is spent versus where you wish it were—surfaces the invisible trade-offs.",
    duration: "6–8 minutes",
    naturePath: "/nature/Background-12.png",
  },
  {
    type: "affirmation",
    id: "rest-is-not-reward",
    quote:
      "Rest isn't a reward I earn—it's how I stay rooted enough to keep showing up. Softness today is strength tomorrow.",
    cadence: "Daily",
    naturePath: "/nature/Background-18.png",
  },
  {
    type: "learn-skill",
    id: "stop-technique",
    title: "A skill that could quiet rumination is the 'STOP' Method",
    eyebrow: "Recommended Skill",
    naturePath: "/nature/Background-10.png",
  },
  {
    type: "accountability",
    id: "morning-walk",
    goal: "I will take a ten-minute walk before breakfast every weekday",
    eyebrow: "Your Goal",
    naturePath: "/nature/Background-5.png",
  },
  {
    type: "guided-session",
    id: "people-pleasing",
    title: "Notice where you're saying yes when you mean no",
    subtitle: "Two of your stories this week ended with you overextending — let's unpack.",
    naturePath: "/nature/Background-6.png",
  },
  {
    type: "meditation",
    id: "body-scan-bedtime",
    title: "Bedtime Body Scan: Releasing the Day's Tension",
    cadence: "Daily",
    naturePath: "/nature/Background-1.png",
    isNew: true,
  },
  {
    type: "book",
    id: "when-things-fall-apart",
    title: "When Things Fall Apart: Heart Advice for Difficult Times",
    author: "Pema Chödrön",
    rating: 4.7,
    cover: "/books/when-things-fall-apart.jpg",
    naturePath: "/nature/Background-9.png",
  },
];
