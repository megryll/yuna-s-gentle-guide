import { BookHeart, Headphones, HeartHandshake, Target, type LucideIcon } from "lucide-react";

// Single source of truth for the wellness tools — consumed by the Tools page
// (image tiles) and the desktop WebShell rail (icon + label links). Keep route
// + title here so the two stay in sync; `Icon` is the rail glyph, `image` /
// `emoji` are the tile's.
export type Tool = {
  id: string;
  title: string;
  caption: string;
  image: string;
  emoji: string;
  /** Rail glyph (desktop web nav). */
  Icon: LucideIcon;
  isNew?: boolean;
  /** Destination route when the tool is wired up; omit for inert tiles. */
  to?: string;
};

export const TOOLS: Tool[] = [
  {
    id: "therapist",
    title: "Therapist Recommendation",
    caption: "Discover licensed therapists",
    image: "/tools/therapist.jpg",
    emoji: "💬",
    Icon: HeartHandshake,
    to: "/therapist-recommendations",
  },
  {
    id: "guided-audio",
    title: "Guided Audio",
    caption: "Personalized meditations and breathing exercises",
    image: "/tools/guided-audio.jpg",
    emoji: "🎧",
    Icon: Headphones,
    to: "/meditation",
  },
  {
    id: "gratitude",
    title: "Gratitude Journal",
    caption: "Reflect daily on the best things in your life",
    image: "/tools/gratitude.jpg",
    emoji: "💗",
    Icon: BookHeart,
    to: "/gratitude",
  },
  {
    id: "goal-setting",
    title: "Goal Setting",
    caption: "A partner to help you reach your goals",
    image: "/tools/goal-setting.jpg",
    emoji: "🚀",
    Icon: Target,
    to: "/goals",
  },
];
