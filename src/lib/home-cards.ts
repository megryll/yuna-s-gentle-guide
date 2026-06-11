// A learn-skill article shown on the skill detail screen (/skill/$id):
// a text-based explainer with an acronym breakdown and nested section images.
export type SkillArticle = {
  // Headline name of the skill, e.g. "The PLEASE Skill".
  name: string;
  // The acronym itself, shown large in the hero (e.g. "PLEASE").
  acronym: string;
  // One-line description under the acronym.
  summary: string;
  readingTime: string;
  // Lead paragraph below the hero.
  intro: string;
  // What each letter (or letter-group) of the acronym stands for.
  breakdown: { letter: string; term: string; detail: string }[];
  sections: {
    heading: string;
    paragraphs: string[];
    image?: { src: string; caption: string };
  }[];
};

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
      // Full article shown on the skill detail screen (/skill/$id).
      article: SkillArticle;
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
      // Yuna's "why this might be a good book for you" note, shown on the
      // book detail screen (/book/$id).
      blurb: string;
      naturePath?: string;
      isNew?: boolean;
      isSaved?: boolean;
    };

export type CardKind = HomeCard["type"];

export type CardKindMeta = {
  label: string;
  // dark = white text on a tinted-photo gradient
  // light = dark text on pale warm bg
  tone: "dark" | "light";
  action: "play" | "arrow" | "check";
  ctaLabel: string;
  // Fallback photo when an individual card doesn't override `naturePath`.
  naturePath: string;
  // When set, the card renders on this solid fill instead of a tinted photo
  // (fixed in both light/dark app modes — see Card `solidFill`). Pair a pale
  // fill with tone "light" (dark ink) and a deep fill with tone "dark" (white).
  solidBg?: string;
  // Decorative brand-mark watermark rendered faintly behind the card content
  // (tile + list row) — see Card/CardRow `watermark`.
  watermark?: string;
};

export const KIND_META: Record<CardKind, CardKindMeta> = {
  "guided-session": {
    label: "Guided Session",
    tone: "dark",
    action: "play",
    ctaLabel: "Begin session",
    naturePath: "/nature/Background-2.png",
  },
  meditation: {
    label: "Personalised Meditation",
    tone: "dark",
    action: "play",
    ctaLabel: "Try this meditation",
    naturePath: "/nature/Background-13.png",
  },
  gratitude: {
    label: "Gratitude List",
    tone: "light",
    action: "arrow",
    ctaLabel: "My gratitude journal",
    naturePath: "/nature/Background-17.png",
    solidBg: "#D4E3F4",
  },
  "self-discovery": {
    label: "Questionnaire",
    tone: "dark",
    action: "arrow",
    ctaLabel: "Try it now",
    naturePath: "/nature/Background-9.png",
    solidBg: "#115430",
    watermark: "/yuna-mark.svg",
  },
  affirmation: {
    label: "Affirmation",
    tone: "dark",
    action: "play",
    ctaLabel: "Play affirmation",
    naturePath: "/nature/Background-1.png",
  },
  "learn-skill": {
    label: "Recommended Skill",
    tone: "dark",
    action: "arrow",
    ctaLabel: "Learn this skill",
    naturePath: "/nature/Background-6.png",
    solidBg: "#6E5A6B",
  },
  accountability: {
    label: "Accountability Partner",
    tone: "dark",
    action: "check",
    ctaLabel: "Mark as done",
    naturePath: "/nature/Background-5.png",
  },
  book: {
    label: "Book Recommendation",
    tone: "light",
    action: "arrow",
    ctaLabel: "Read more",
    naturePath: "/nature/Background-3.png",
    solidBg: "#FFFFFF",
  },
};

// Plural, human-facing name for a card kind. Used by the 3-dot menu's
// "Stop seeing …" action and by the Content Preferences settings screen.
export const KIND_PLURAL: Record<CardKind, string> = {
  "guided-session": "Guided Sessions",
  meditation: "Personalised Meditations",
  gratitude: "Gratitude Journal Prompts",
  "self-discovery": "Questionnaires",
  affirmation: "Affirmations",
  "learn-skill": "Recommended Skills",
  accountability: "Goals",
  book: "Book Recommendations",
};

// Which optional 3-dot menu actions apply per card kind. "Why am I seeing
// this?" is always offered, so it isn't tracked here. `complete` cards can be
// marked done (and moved under the Completed Today divider); `dismiss` cards
// can be removed from the feed; `stopSeeing` cards offer the per-kind
// "Stop seeing …" toggle (Goals are managed only from Content Preferences).
export type CardMenuActions = {
  complete: boolean;
  dismiss: boolean;
  stopSeeing: boolean;
};

export const KIND_MENU: Record<CardKind, CardMenuActions> = {
  "guided-session": { complete: true, dismiss: true, stopSeeing: true },
  meditation: { complete: false, dismiss: true, stopSeeing: true },
  gratitude: { complete: false, dismiss: false, stopSeeing: true },
  "self-discovery": { complete: false, dismiss: true, stopSeeing: true },
  affirmation: { complete: true, dismiss: true, stopSeeing: true },
  "learn-skill": { complete: true, dismiss: true, stopSeeing: true },
  accountability: { complete: true, dismiss: true, stopSeeing: false },
  book: { complete: true, dismiss: true, stopSeeing: true },
};

// Placeholder ideas for the three gratitude entry fields — nudges that help
// people land on something concrete. Shared by the Home gratitude card and
// the Gratitude Journal screen so the two never drift.
export const GRATITUDE_PROMPTS = [
  "A small thing that went right",
  "Someone I appreciated",
  "A moment that made me smile",
] as const;

export const HOME_CARDS: HomeCard[] = [
  {
    type: "self-discovery",
    id: "first-check-in",
    title: "Let's get to know each other",
    description: "Tell me what's going on, and we'll find a place to start.",
    duration: "1 minute",
    naturePath: "/nature/Background-2.png",
  },
  {
    type: "meditation",
    id: "midday-reset",
    title: "Meditation For You: A Five-Minute Midday Reset",
    cadence: "Daily",
    naturePath: "/nature/Background-13.png",
    isNew: true,
  },
  {
    type: "gratitude",
    id: "gratitude-today",
    prompt: "I feel grateful today, because:",
    cadence: "Daily",
    naturePath: "/nature/Background-7.png",
    isNew: true,
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
      "I have the strength to overcome obstacles. Each step forward is progress. Embrace challenges and keep moving confidently.",
    cadence: "Daily",
    naturePath: "/nature/Background-14.png",
    isSaved: true,
  },
  {
    type: "learn-skill",
    id: "please-technique",
    title: "A skill that could benefit you is 'PLEASE' Technique",
    eyebrow: "Recommended Skill",
    naturePath: "/nature/Background-4.png",
    article: {
      name: "The PLEASE Skill",
      acronym: "PLEASE",
      summary: "Care for your body so big emotions have less room to take over.",
      readingTime: "4 min read",
      intro:
        "When you're running low on sleep, food, or movement, your feelings get louder and harder to steer. In Dialectical Behavior Therapy this is called being vulnerable to Emotion Mind. PLEASE is a simple checklist for the basics that keep you steady, so the harder moments feel a little more manageable.",
      breakdown: [
        {
          letter: "PL",
          term: "Treat PhysicaL illness",
          detail:
            "Look after your body. Take medication as prescribed, and see a doctor when something feels off. Pain and illness quietly wear down your resilience.",
        },
        {
          letter: "E",
          term: "Balance Eating",
          detail:
            "Eat regularly, and in a way that feels good to you. Too little or too much can tip your mood without you noticing.",
        },
        {
          letter: "A",
          term: "Avoid mood-altering substances",
          detail:
            "Steer clear of non-prescribed drugs, and keep alcohol light. They tend to borrow calm from tomorrow.",
        },
        {
          letter: "S",
          term: "Balance Sleep",
          detail:
            "Aim for the amount of rest that helps you feel like yourself, often seven to nine hours. Keeping a roughly consistent bedtime helps too.",
        },
        {
          letter: "E",
          term: "Get Exercise",
          detail:
            "Move your body most days. Even a short walk counts. Build toward about twenty minutes of something you actually enjoy.",
        },
      ],
      sections: [
        {
          heading: "Why the basics matter",
          paragraphs: [
            "Emotions don't happen in a vacuum. A skipped lunch, a short night, a week without movement, each one lowers the threshold at which stress tips into overwhelm. Tending to your physical needs won't erase hard feelings, but it widens the gap between a trigger and your reaction.",
            "Think of it as maintenance, not a cure. The goal isn't to feel good all the time. It's to give yourself a steadier baseline to work from.",
          ],
          image: {
            src: "/nature/Background-13.png",
            caption: "Small, regular care adds up to a steadier baseline.",
          },
        },
        {
          heading: "How to start",
          paragraphs: [
            "Pick one letter, not all five. Trying to overhaul everything at once usually backfires. Choose the area that feels most off right now, and make it a little easier for a week.",
            "If sleep is the weak link, set a wind-down time. If it's food, keep a simple snack within reach. Notice how your mood responds, and let that guide what you tend to next.",
          ],
          image: {
            src: "/nature/Background-7.png",
            caption: "One change at a time is enough.",
          },
        },
        {
          heading: "When to reach for it",
          paragraphs: [
            "PLEASE works best as a daily habit rather than an emergency tool. It's the groundwork you lay on ordinary days so the harder ones have less to grab onto.",
            "If you've noticed yourself more reactive, more tearful, or quicker to spiral lately, it's worth running through the checklist. Often one of the basics has slipped without you noticing.",
          ],
        },
      ],
    },
  },
  {
    type: "accountability",
    id: "daily-agenda",
    goal: "I will prepare a daily agenda every morning this week",
    eyebrow: "Your Goal",
    naturePath: "/nature/Background-17.png",
  },
  {
    type: "book",
    id: "self-compassion-neff",
    title: "Self-Compassion: The Proven Power of Being Kind to Yourself",
    author: "Kristin Neff",
    rating: 4.6,
    cover: "/books/self-compassion.jpg",
    blurb:
      "This book could meet you where you are on the days the voice in your head turns harsh. Kristin Neff draws on her research to show how treating yourself with the same kindness you'd offer a close friend can steady you through stress and setbacks. It's full of gentle, practical exercises for easing self-judgment, which might help when you're carrying a lot.",
    naturePath: "/nature/Background-19.png",
  },
  {
    type: "self-discovery",
    id: "stress-signals",
    title: "How Does Stress Show Up for You?",
    description:
      "A short check-in to help you notice the early signs of stress in your body, mood, and sleep.",
    duration: "3–5 minutes",
    naturePath: "/nature/Background-3.png",
  },
  {
    type: "meditation",
    id: "calm-heartbreak",
    title: "Meditation For You: Finding Calm After Heartbreak",
    cadence: "Daily",
    naturePath: "/nature/Background-18.png",
    isSaved: true,
  },
  {
    type: "guided-session",
    id: "perfectionism-work",
    title: "Untangle perfectionism at work, one thread at a time",
    subtitle: "You've used the word 'should' a lot this week. Let's dig in.",
    naturePath: "/nature/Background-15.png",
  },
  {
    type: "gratitude",
    id: "gratitude-surprise",
    prompt: "Three small things today that didn't have to go right, but did:",
    cadence: "Daily",
    naturePath: "/nature/Background-16.png",
  },
  {
    type: "self-discovery",
    id: "energy-audit",
    title: "Where Is Your Energy Actually Going?",
    description:
      "A short audit of where your week is spent versus where you wish it were. Surfaces the invisible trade-offs.",
    duration: "6–8 minutes",
    naturePath: "/nature/Background-12.png",
  },
  {
    type: "affirmation",
    id: "rest-is-not-reward",
    quote:
      "Rest isn't a reward I earn. It's how I stay rooted enough to keep showing up. Softness today is strength tomorrow.",
    cadence: "Daily",
    naturePath: "/nature/Background-8.png",
  },
  {
    type: "learn-skill",
    id: "stop-technique",
    title: "A skill that could quiet rumination is the 'STOP' Method",
    eyebrow: "Recommended Skill",
    naturePath: "/nature/Background-10.png",
    article: {
      name: "The STOP Skill",
      acronym: "STOP",
      summary: "Put a pause between a strong urge and what you do next.",
      readingTime: "3 min read",
      intro:
        "When emotion runs high, it pushes you to act fast, and fast often means regret. STOP is a distress tolerance skill from Dialectical Behavior Therapy. It buys you a few seconds to step out of the heat and choose your next move on purpose, which is also what makes it useful for breaking a rumination loop.",
      breakdown: [
        {
          letter: "S",
          term: "Stop",
          detail:
            "Freeze. Don't react to the urge right away. You can't undo what you haven't done yet, so give yourself a moment first.",
        },
        {
          letter: "T",
          term: "Take a step back",
          detail:
            "Create some distance, physically or mentally. Take a breath, drop your shoulders, leave the room if you can.",
        },
        {
          letter: "O",
          term: "Observe",
          detail:
            "Notice what's actually happening, inside and around you. What are the facts? What are you feeling, and what is the situation really asking of you?",
        },
        {
          letter: "P",
          term: "Proceed mindfully",
          detail:
            "Act with your goal in mind. Ask what would make this better rather than worse, and choose from there.",
        },
      ],
      sections: [
        {
          heading: "The pause is the skill",
          paragraphs: [
            "Strong emotions come with a built-in urge to do something immediately: send the text, say the thing, give up, walk out. STOP doesn't ask you to suppress the feeling. It just slows the gap between feeling and acting long enough for your thinking mind to catch up.",
            "That pause is small, but it's where your choices live. Almost everything you'd later regret happens inside the first few seconds.",
          ],
          image: {
            src: "/nature/Background-15.png",
            caption: "A few seconds of stillness changes what happens next.",
          },
        },
        {
          heading: "Using it on rumination",
          paragraphs: [
            "Rumination is its own kind of urge, the pull to keep replaying or rehearsing a worry. The same four steps interrupt it. When you catch the loop starting, Stop, Take a step back from the thought, Observe that you're ruminating rather than problem-solving, and Proceed toward something grounding.",
            "Naming the loop, even just a quiet 'I'm spiraling,' is often enough to loosen its grip.",
          ],
          image: {
            src: "/nature/Background-16.png",
            caption: "Noticing the loop is the first step out of it.",
          },
        },
        {
          heading: "Practice before you need it",
          paragraphs: [
            "Skills are hardest to remember in the exact moment you need them most. Run through STOP on small frustrations, a slow line, a curt email, so the steps feel familiar when something bigger lands.",
            "It won't feel natural at first, and that's normal. Like anything, it gets easier with repetition until the pause becomes something you reach for without thinking.",
          ],
        },
      ],
    },
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
    subtitle: "Two of your stories this week ended with you overextending. Let's unpack.",
    naturePath: "/nature/Background-6.png",
  },
  {
    type: "meditation",
    id: "body-scan-bedtime",
    title: "Bedtime Body Scan: Releasing the Day's Tension",
    cadence: "Daily",
    naturePath: "/nature/Background-1.png",
  },
  {
    type: "book",
    id: "when-things-fall-apart",
    title: "When Things Fall Apart: Heart Advice for Difficult Times",
    author: "Pema Chödrön",
    rating: 4.7,
    cover: "/books/when-things-fall-apart.jpg",
    blurb:
      "This book could be a steadying companion during a hard stretch. Pema Chödrön, a Buddhist teacher, writes about staying present with discomfort instead of running from it, and finding ground when things feel uncertain. Its short, honest chapters are easy to return to, and they might offer some comfort when you're sitting with something difficult.",
    naturePath: "/nature/Background-9.png",
  },
];
