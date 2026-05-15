import { useSentimentToneColor } from "@/components/SentimentTag";

export type SessionTag = { label: string; emoji: string; tone: "positive" | "negative" };

export type TranscriptTurn = { from: "you" | "yuna"; text: string };

export type SessionHighlight = { quote: string; emotions: string[] };

export type PastSession = {
  id: string;
  date: string;
  length: string;
  title: string;
  tags: SessionTag[];
  note?: string;
  transcript: TranscriptTurn[];
  highlights: SessionHighlight[];
};

// Emotion → readable hue. Mirrors the wrap-up palette so detail pages and
// the wrap-up screen feel like the same surface. Green + orange-family
// emotions reuse the SentimentTag palette so they match positive/negative
// tags across the app.
export function useSessionEmotionColors(): Record<string, string> {
  const toneColor = useSentimentToneColor();
  return {
    Overwhelm: "#F7A7A7",
    Relief: toneColor("positive"),
    Resolve: toneColor("negative"),
    Hopefulness: "#A7C7E7",
    "Self-compassion": "#C5B6E0",
    Gratitude: toneColor("negative"),
    Tenderness: "#F2B4D3",
    Curiosity: "#B5DEDB",
    Clarity: "#A7C7E7",
    Pride: toneColor("negative"),
  };
}

export const PAST_SESSIONS: PastSession[] = [
  {
    id: "s-04",
    date: "May 12",
    length: "18 min",
    title: "Untangling pressure at work and what to drop first",
    tags: [
      { label: "Gained clarity", emoji: "💎", tone: "positive" },
      { label: "Felt heard", emoji: "🫶", tone: "positive" },
    ],
    note: "Helped me see I'm not behind — I'm holding too much.",
    transcript: [
      {
        from: "you",
        text: "Work has been crushing me lately. I have three big deadlines this week and I keep losing track of what matters.",
      },
      {
        from: "yuna",
        text: "That sounds heavy. When you say losing track — do you mean forgetting things, or more that nothing feels urgent enough to start?",
      },
      {
        from: "you",
        text: "Both, honestly. I start one thing, remember another, and end up doing neither well.",
      },
      {
        from: "yuna",
        text: "If you had to pick the one deadline whose outcome you'll still care about in two weeks, which would it be?",
      },
      {
        from: "you",
        text: "Probably the client review. The other two are internal and we can push them.",
      },
      {
        from: "yuna",
        text: "So most of this load is self-imposed urgency, not real urgency. What if we treated the other two as next week's problem?",
      },
      {
        from: "you",
        text: "That actually feels doable. I think I've been afraid to admit I can't do it all at once.",
      },
    ],
    highlights: [
      {
        quote: "I start one thing, remember another, and end up doing neither well.",
        emotions: ["Overwhelm"],
      },
      {
        quote: "I think I've been afraid to admit I can't do it all at once.",
        emotions: ["Self-compassion", "Clarity"],
      },
    ],
  },
  {
    id: "s-03",
    date: "May 8",
    length: "9 min",
    title: "A quick check-in after the rough morning",
    tags: [
      { label: "Felt heard", emoji: "🫶", tone: "positive" },
      { label: "Too generic", emoji: "📋", tone: "negative" },
    ],
    transcript: [
      {
        from: "you",
        text: "I just need five minutes. The morning was a mess and I can't shake it.",
      },
      {
        from: "yuna",
        text: "I'm here. Want to name the one moment that's still sitting with you?",
      },
      {
        from: "you",
        text: "I snapped at my partner about something stupid before they left for work.",
      },
      {
        from: "yuna",
        text: "What do you wish you'd said instead, now that there's space?",
      },
      {
        from: "you",
        text: "That I'm just tired, and it wasn't really about the dishes.",
      },
    ],
    highlights: [
      {
        quote: "I snapped at my partner about something stupid before they left for work.",
        emotions: ["Overwhelm", "Tenderness"],
      },
    ],
  },
  {
    id: "s-02",
    date: "May 4",
    length: "24 min",
    title: "Coming back to your breath when the day feels loud",
    tags: [
      { label: "Felt energized", emoji: "⚡", tone: "positive" },
      { label: "Learned something", emoji: "💡", tone: "positive" },
      { label: "Felt connected", emoji: "🤝", tone: "positive" },
    ],
    note: "The 4-7-8 breath actually worked. Going to try it before bed.",
    transcript: [
      {
        from: "you",
        text: "Everything's been loud lately. My head, my phone, the apartment — I can't find a quiet minute.",
      },
      {
        from: "yuna",
        text: "Can we try something? A simple breath count — four in, seven hold, eight out. I'll go slowly.",
      },
      {
        from: "you",
        text: "Okay, I'll try.",
      },
      {
        from: "yuna",
        text: "Beautiful. Three rounds is enough. Notice anything shift?",
      },
      {
        from: "you",
        text: "My shoulders dropped a little. I didn't realize how tight they were.",
      },
      {
        from: "yuna",
        text: "That's the body telling the truth before the mind catches up. You can come back to this anytime.",
      },
      {
        from: "you",
        text: "I want to do this every night this week and see what changes.",
      },
    ],
    highlights: [
      {
        quote: "My shoulders dropped a little. I didn't realize how tight they were.",
        emotions: ["Relief"],
      },
      {
        quote: "I want to do this every night this week and see what changes.",
        emotions: ["Resolve", "Hopefulness"],
      },
    ],
  },
  {
    id: "s-01",
    date: "Apr 30",
    length: "31 min",
    title: "First session — getting to know each other",
    tags: [
      { label: "Felt inspired", emoji: "✨", tone: "positive" },
      { label: "Felt connected", emoji: "🤝", tone: "positive" },
    ],
    note: "Was nervous to start but glad I did.",
    transcript: [
      {
        from: "yuna",
        text: "Hi. I'm Yuna. Before we start, what would feel like a good outcome for this first conversation?",
      },
      {
        from: "you",
        text: "Honestly? I just want to see if this works. I've been skeptical about apps like this.",
      },
      {
        from: "yuna",
        text: "Fair. Skepticism is a kind of self-protection. What would make you trust this even a little?",
      },
      {
        from: "you",
        text: "If you didn't talk to me like a textbook. The last thing I want is reframing exercises right now.",
      },
      {
        from: "yuna",
        text: "Got it. No frameworks unless you ask. What's actually on your mind today?",
      },
      {
        from: "you",
        text: "I think I'm lonelier than I've admitted to anyone in a while.",
      },
    ],
    highlights: [
      {
        quote: "I think I'm lonelier than I've admitted to anyone in a while.",
        emotions: ["Tenderness", "Curiosity"],
      },
    ],
  },
];
