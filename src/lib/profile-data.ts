import type { HomeCard } from "@/lib/home-cards";
import type { UserType } from "@/lib/user-type";

export type Insight = {
  emoji: string;
  title: string;
  desc: string;
  meaning: string[];
  yunaQuote: string;
  date?: string;
};

export type FocusAreaMeta = {
  eyebrow: string;
  title: string;
  body: string;
};

export type ProfileData = {
  conversations: number;
  messages: number;
  insights: number;
  /** 0..1 — drives the hero ring */
  progress: number;
  /** Centred icon inside the hero ring */
  ringIcon: string;

  focusArea1: FocusAreaMeta;
  focusArea2: FocusAreaMeta;
  /** Tasks shown on the Focus Area screen as HomeCardRow items. */
  tasks1: HomeCard[];
  tasks2: HomeCard[];
  /** "Coming Up Next" — rendered dimmed under each Focus Area. */
  upcoming1: HomeCard[];
  upcoming2: HomeCard[];

  breakthroughs: Insight[] | null;
  beliefs: Insight[] | null;
  beliefsMore: number;
  basics: Insight[];
  basicsMore: number;
};

const priya: ProfileData = {
  conversations: 4,
  messages: 12,
  insights: 4,
  progress: 0.14,
  ringIcon: "/assets/profile/emerging.png",

  focusArea1: {
    eyebrow: "Focus Area #1",
    title: "Anxiety Awareness",
    body: "Begin noticing when anxiety shows up and what it feels like in your body — building the foundation for everything that follows.",
  },
  focusArea2: {
    eyebrow: "Focus Area #2",
    title: "Daily Grounding",
    body: "Establish one small daily practice that helps you feel more settled — even for a few minutes.",
  },

  tasks1: [
    { type: "meditation", id: "p1-t1", title: "A Moment To Breathe", cadence: "Daily" },
    { type: "guided-session", id: "p1-t2", title: "Getting To Know You" },
    { type: "affirmation", id: "p1-t3", quote: "I am allowed to take things one step at a time.", cadence: "Daily" },
  ],
  tasks2: [
    { type: "meditation", id: "p2-t1", title: "Easing Into The Evening", cadence: "Daily" },
    { type: "guided-session", id: "p2-t2", title: "What does calm look like?" },
    { type: "affirmation", id: "p2-t3", quote: "I trust myself to figure this out.", cadence: "Daily" },
  ],
  upcoming1: [
    { type: "guided-session", id: "p1-u1", title: "Mapping Your Anxiety Triggers" },
    { type: "self-discovery", id: "p1-u2", title: "Where Do You Feel Anxiety In Your Body?", description: "A body-scan reflection.", duration: "5–10 min" },
    { type: "learn-skill", id: "p1-u3", title: "The 5-4-3-2-1 Grounding Technique", eyebrow: "Skill" },
  ],
  upcoming2: [
    { type: "meditation", id: "p2-u1", title: "Two-Minute Morning Reset", cadence: "Daily" },
    { type: "guided-session", id: "p2-u2", title: "Finding Your Anchor Practice" },
    { type: "self-discovery", id: "p2-u3", title: "What Does Feeling Settled Look Like For You?", description: "A short reflection on your settled state.", duration: "5–10 min" },
  ],

  breakthroughs: null,
  beliefs: null,
  beliefsMore: 0,
  basics: [
    {
      emoji: "🎓",
      title: "Recent graduate",
      desc: "You finished your degree recently and are navigating what comes next.",
      meaning: [
        "Transitions create uncertainty, even positive ones",
        "Comparing your pace to others is a natural but unhelpful habit",
        "The gap between expectation and reality can feel disorienting",
      ],
      yunaQuote: "I'll keep this context in mind as we explore what matters to you.",
    },
  ],
  basicsMore: 0,
};

const james: ProfileData = {
  conversations: 42,
  messages: 128,
  insights: 52,
  progress: 1.0,
  ringIcon: "/assets/profile/rooted.png",

  focusArea1: {
    eyebrow: "Focus Area #1",
    title: "Emotional Openness",
    body: "Continue building the ability to name and share what you feel — with Linda, with your children, and with yourself.",
  },
  focusArea2: {
    eyebrow: "Focus Area #2",
    title: "Identity & Purpose",
    body: "Explore who you are beyond the station — finding meaning in the quiet, the relationships, and the life you're building now.",
  },

  tasks1: [
    { type: "meditation", id: "j1-t1", title: "Stillness Without Judgment", cadence: "Daily" },
    { type: "guided-session", id: "j1-t2", title: "What Does Retirement Mean?" },
    { type: "affirmation", id: "j1-t3", quote: "I am more than what I did. I am who I am becoming.", cadence: "Daily" },
  ],
  tasks2: [
    { type: "meditation", id: "j2-t1", title: "Letting The Day Go", cadence: "Daily" },
    { type: "guided-session", id: "j2-t2", title: "Opening up to Linda" },
    { type: "affirmation", id: "j2-t3", quote: "It is safe to be seen. It is safe to be still.", cadence: "Daily" },
  ],
  upcoming1: [
    { type: "guided-session", id: "j1-u1", title: "Saying What You Feel Without Minimising It" },
    { type: "self-discovery", id: "j1-u2", title: "What Would Change If Linda Knew Everything?", description: "A reflection on the cost of guarded honesty.", duration: "5–10 min" },
    { type: "learn-skill", id: "j1-u3", title: "Emotional Vocabulary Building", eyebrow: "Skill" },
  ],
  upcoming2: [
    { type: "guided-session", id: "j2-u1", title: "What Gives Your Life Meaning Now?" },
    { type: "self-discovery", id: "j2-u2", title: "Retiring The Uniform But Not The Man", description: "Who you are when service is no longer the answer.", duration: "5–10 min" },
    { type: "meditation", id: "j2-u3", title: "Finding Stillness After A Lifetime Of Service", cadence: "Daily" },
  ],

  breakthroughs: [
    {
      emoji: "✨",
      title: "Told Linda how you really felt",
      date: "Nov 2025",
      desc: "You sat down with Linda and told her you feel lost since retiring. First time in decades.",
      meaning: [
        "This was a direct challenge to the belief that men handle things alone",
        "Linda responded with relief, not judgment",
        "It opened a door that had been closed for years",
      ],
      yunaQuote: "This moment changed the trajectory of your relationship. Linda was waiting for this.",
    },
    {
      emoji: "✨",
      title: "Cried during a session",
      date: "Jan 2026",
      desc: "You allowed yourself to feel the full weight of losing the station — and you survived it.",
      meaning: [
        "This proved the flood did not come — you felt, and then you were okay",
        "It built evidence against the belief that feeling means falling apart",
        "The relief afterward was real and lasting",
      ],
      yunaQuote: "You proved to yourself that you can feel without breaking. That changes everything.",
    },
    {
      emoji: "✨",
      title: "Invited Ryan to the workshop",
      date: "Mar 2026",
      desc: "You asked Ryan to help with a woodworking project — a quiet act of connection.",
      meaning: [
        "This was not about the project — it was about creating shared space",
        "Ryan said yes, which is evidence he wants connection too",
        "Side-by-side activity is your language of closeness — and it works",
      ],
      yunaQuote: "You found your way in with Ryan. Not through words — through wood and quiet. That is enough.",
    },
  ],
  beliefs: [
    {
      emoji: "🤐",
      title: "Men handle things alone",
      desc: "Three decades of crisis response trained you to absorb and suppress.",
      meaning: [
        "This belief kept you functional under pressure — but it has a shelf life",
        "Emotional isolation becomes more costly as the stakes shift from physical to relational",
        "Asking for help is not failure — it is a different kind of strength",
      ],
      yunaQuote: "I work with this belief, not against it — reframing vulnerability as tactical, not weak.",
    },
    {
      emoji: "⏳",
      title: "My best years are behind me",
      desc: "Retirement feels like the beginning of decline — not a new chapter.",
      meaning: [
        "When identity was defined by action, stillness feels like stagnation",
        "The belief blocks you from investing in what is ahead",
        "Your children and Linda are evidence that what matters most is still unfolding",
      ],
      yunaQuote: "I challenge this belief with evidence from your own life — the growth is happening now.",
    },
    {
      emoji: "🛡️",
      title: "Staying strong means staying quiet",
      desc: "Showing emotion risks being perceived as weak or unstable.",
      meaning: [
        "This was reinforced by fire service culture for three decades",
        "It prevents the people closest to you from truly knowing you",
        "Megan and Linda are actively asking for more — they see strength in openness",
      ],
      yunaQuote: "I help you test this assumption in safe, low-stakes ways — building evidence that it is outdated.",
    },
  ],
  beliefsMore: 2,
  basics: [
    {
      emoji: "🚒",
      title: "Retired fire captain (30 years)",
      desc: "Three decades of service defined who you are — and who you thought you would always be.",
      meaning: [
        "Service was identity, purpose, and community all in one",
        "Retirement meant losing all three simultaneously",
        "The camaraderie is what you miss most — the brotherhood",
      ],
      yunaQuote: "I hold this loss with the seriousness it deserves — it is a grief, even if no one died.",
    },
    {
      emoji: "💑",
      title: "Married to Linda (28 years)",
      desc: "A strong marriage tested by decades of shift work and emotional distance.",
      meaning: [
        "Linda has been patient — but patience is not the same as fulfillment",
        "She wants to reconnect now that you are home",
        "The intimacy gap built over decades cannot close overnight",
      ],
      yunaQuote: "I help you find small steps toward the closeness Linda is asking for.",
    },
    {
      emoji: "🎣",
      title: "Fly fishing and woodworking",
      desc: "These are where you find flow — and the closest thing to therapy you had before Yuna.",
      meaning: [
        "Solitary focus activities regulate your nervous system",
        "They are genuine sources of joy and calm",
        "They could be bridges to social connection if shared",
      ],
      yunaQuote: "I see these not as hobbies but as core parts of your emotional toolkit.",
    },
  ],
  basicsMore: 12,
};

export function getProfileData(userType: UserType): ProfileData {
  return userType === "returning" ? james : priya;
}

export function getFocusAreaData(userType: UserType, num: "1" | "2") {
  const profile = getProfileData(userType);
  const meta = num === "1" ? profile.focusArea1 : profile.focusArea2;
  const tasks = num === "1" ? profile.tasks1 : profile.tasks2;
  const upcoming = num === "1" ? profile.upcoming1 : profile.upcoming2;
  return { meta, tasks, upcoming };
}
