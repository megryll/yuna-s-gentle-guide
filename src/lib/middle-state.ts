// Synthesizes "just finished your first session" surfaces for the post-
// wrap-up tooltips tour. The populated returning-user fixtures (multiple
// past sessions, dozens of insights) would misrepresent the actual state of
// a user who has only completed one conversation.

import { loadKeepsakes } from "@/lib/keepsakes";
import { PAST_SESSIONS, type PastSession } from "@/lib/sessions";
import type { Insight } from "@/lib/profile-data";

function capitalize(s: string): string {
  return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function formatDate(ts: number): string {
  return new Date(ts)
    .toLocaleString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

/**
 * A single past session reflecting the conversation the user just finished.
 * Title is derived from the latest keepsake's themes; falls back to a
 * canned title if nothing was persisted.
 */
export function getMiddleStateSession(): PastSession {
  const latest = loadKeepsakes()[0];
  const themes = latest?.themes ?? [];
  const themeTitle = themes[0]?.trim();
  const title = themeTitle
    ? capitalize(themeTitle)
    : "Your first conversation with Yuna";
  const base = PAST_SESSIONS[0];
  return {
    ...base,
    id: latest?.id ?? "middle-state",
    date: formatDate(latest?.createdAt ?? Date.now()),
    length: "8 min",
    title,
    tags: [],
  };
}

/**
 * A single insight that mirrors what Yuna might surface after one
 * conversation — drawn from the latest keepsake's themes and quote so the
 * tour background feels personal rather than fabricated.
 */
export function getMiddleStateInsight(): Insight {
  const latest = loadKeepsakes()[0];
  const themes = latest?.themes ?? [];
  const themeTitle = themes[0]?.trim();
  const title = themeTitle ? capitalize(themeTitle) : "Just getting started";
  const yunaQuote =
    latest?.quote?.trim() ||
    "I'm still getting to know you — what we surface here will grow with each conversation.";
  return {
    emoji: "🌱",
    title,
    desc: "An early signal from your first session — still forming.",
    meaning: [
      "Patterns take a few conversations to surface",
      "Anything here will get sharper as we talk more",
    ],
    yunaQuote,
  };
}
