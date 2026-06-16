// Engineer-facing reference data. Two consumers:
//   1. EngineerSidebar (right panel) — per-screen asset downloads + the seed
//      text for the editable Notes list.
//   2. The /ds/animations screen — the grouped ANIMATION_REFERENCE.
//
// The audience is front-end iOS/Android engineers implementing these screens
// natively, so notes describe behaviour and intent. Everything is grounded in
// the real codebase: animation timings come from src/styles.css, asset paths
// from public/. Keep it that way — don't add notes you can't point at.

// A single beat in a screen's entrance choreography. Beats are authored in
// play order and read top-to-bottom like a screenplay.
export type Beat = {
  /** When the beat fires — a time marker ("0.00s", "1.92s") or an event
   *  trigger ("On access-code accepted"). */
  cue: string;
  /** The action, told as a beat ("Avatar rises in"). */
  event: string;
  /** What moves, and where to find it in the source. */
  element: string;
  /** The motion itself ("translateY(40px) → 0"). */
  motion?: string;
  /** Duration, verbatim from the source ("800ms"). */
  duration?: string;
  /** Easing / curve ("cubic-bezier(0.2, 0.8, 0.2, 1)"). */
  easing?: string;
  /** The CSS class or @keyframes name to grep for. */
  css?: string;
  note?: string;
};

// A continuous, no-discrete-start loop (glow, pulse, shimmer) — it runs the
// whole time the screen is visible, so it sits outside the timed sequence.
export type AmbientLoop = {
  name: string;
  element: string;
  css: string;
  /** Duration + iteration, verbatim ("2.4s ease-out infinite"). */
  timing: string;
  motion?: string;
  note?: string;
};

export type Screenplay = {
  label: string;
  /** Ordered entrance choreography — the beats that play on screen entry. */
  sequence: Beat[];
  /** Continuous loops with no discrete start. */
  ambient: AmbientLoop[];
};

export type AssetLink = {
  label: string;
  href: string;
  note?: string;
};

// A code-authored implementation note. The `id` is stable and permanent — it's
// what the editable Notes panel merges against, so revising a note's `text`
// here updates it live in the panel (an unedited note always reflects current
// code), and a user note folded in with its own id dedupes instead of
// duplicating. Never reuse or renumber an id.
export type Gotcha = { id: string; text: string };

export type EngineerNotes = {
  assets: AssetLink[];
  gotchas: Gotcha[];
};

// Applies to every screen. Notes are intentionally empty — each screen seeds
// only its own notes; cross-cutting rules live in CLAUDE.md, not here.
export const GLOBAL: EngineerNotes = {
  assets: [],
  gotchas: [],
};

// Themed in-app screens (Home, You, Chat, Meditation, Goals, Wrap-up) ignore
// any backgroundImage prop and render useModeImage() — the blurred dark photo
// in dark mode, the frosted light photo in light. (PhoneFrame.tsx: themedBg
// wins over backgroundImage.) Both ship on every themed screen.
const THEMED_BG: AssetLink[] = [
  { label: "Themed bg (dark)", href: "/dark4-blur.png", note: "Blurred dark forest photo — dark mode." },
  { label: "Themed bg (light)", href: "/light-blur-bg.png", note: "Frosted light photo — light mode." },
];

const ROUTE_NOTES: Record<string, Partial<EngineerNotes>> = {
  "/": {
    assets: [
      { label: "Welcome bg", href: "/dark4.png", note: "Lush un-blurred dark photo — Welcome only (useWelcomeImage)." },
      { label: "Yuna logo", href: "/yuna-logo.svg" },
      { label: "Avatar", href: "/avatar.png", note: "<YunaAvatar glow> in the hero." },
    ],
    gotchas: [
      { id: "welcome-frame-height", text: "Slight layout shift for small screens." },
      { id: "25b0161d-c94b-4498-9989-514a9737dd0d", text: "Android uses background image for bubbles and lower container" },
    ],
  },
  "/login": {
    assets: [
      { label: "Dark blur bg", href: "/dark4-blur.png" },
      { label: "Apple logo", href: "/logos/apple.svg" },
      { label: "Google logo", href: "/logos/google.svg" },
    ],
    gotchas: [
      { id: "afb880fa-c905-457f-8edc-8a0890b4f8b7", text: "New; Show forgot password link always" },
    ],
  },
  "/auth": {
    assets: [
      { label: "Dark blur bg", href: "/dark4-blur.png" },
      { label: "Apple logo", href: "/logos/apple.svg" },
      { label: "Google logo", href: "/logos/google.svg" },
    ],
    gotchas: [],
  },
  "/employer-access": {
    assets: [
      { label: "Dark blur bg", href: "/dark4-blur.png" },
      { label: "Yuna logo", href: "/yuna-logo.svg", note: "On the activated pass face." },
    ],
    gotchas: [
      { id: "employer-focus-shift", text: "Content should shift up when keyboard is triggered" },
    ],
  },
  "/intro": {
    assets: [
      { label: "Avatar", href: "/avatar.png" },
      { label: "Dark blur bg", href: "/dark4-blur.png" },
      { label: "Harvard logo", href: "/harvard.svg", note: "Credibility card in the 'tell me more' branch (paired with Cornell)." },
      { label: "Cornell logo", href: "/cornell.png", note: "Shares the credibility card with the Harvard wordmark." },
      { label: "App Store rating", href: "/app-store-rating.png", note: "Scaling image (icon + 5 stars) in the rating card, same branch." },
      { label: "Yuna mark", href: "/yuna-mark.svg", note: "White brand glyph in the demo push notification (sits on the secondary-green tile)." },
    ],
    gotchas: [
      { id: "intro-name-autofocus", text: "Name input auto-focuses ~200ms after the wait-input step begins" },
      { id: "78367743-a9ff-42f7-8baf-ad02ba207845", text: "Voice starts reading text out loud after user chooses a voice (also their avatar replaces the default one.)" },
      { id: "6927704f-374e-487f-8388-1dee68cd44c6", text: "Voice fades out after clicking 'Let's Start!' button" },
      { id: "d5147f63-4470-48a5-bf09-52df50a63f27", text: "Mute button top right mutes voice/sound effects" },
    ],
  },
  "/creating-your-space": {
    assets: [{ label: "Dark blur bg", href: "/dark4-blur.png" }],
    gotchas: [
      { id: "cys-leaf-spinner", text: "The loader is <LeafSpinner> (LeafSpinner.tsx): three Yuna leaves orbiting a center on a fast→slow→fast loop (@keyframes yuna-orbit-spin, 1080° in 2.4s), white on the dark photo. See the Animation specs link for the full screenplay. The same overlay also plays inside /intro during the post-onboarding transition." },
      { id: "cys-dark-lock", text: "Onboarding transition — locked to the dark photo (useDarkBlurImage) regardless of the Light/Dark toggle." },
    ],
  },
  "/chat": {
    assets: [
      ...THEMED_BG,
      { label: "Avatar", href: "/avatar.png" },
      { label: "Forest ambience", href: "/forest-background.m4a", note: "AMBIENCE_FILES[Forest] — the only mapped ambience bed." },
    ],
    gotchas: [
      { id: "chat-ambient-audio", text: "Chat owns its own ambient audio — it pauses the global forest bed on entry and restarts it on exit. Don't double-play." },
      { id: "chat-scroll-padding", text: "Conversational scroll padding is px-5 (denser light cluster), not the px-6 tab body." },
      { id: "chat-keyboard-padding", text: "On input focus the scroll area gets paddingBottom = keyboard height so the latest message lifts above the keyboard rather than being covered." },
      { id: "chat-voice-latch", text: "Press-and-hold (voice) latches the keyboard up across the brief focus loss during the gesture." },
    ],
  },
  "/meditation": {
    assets: [
      ...THEMED_BG,
      { label: "Avatar", href: "/avatar.png" },
      { label: "Forest ambience", href: "/forest-background.m4a", note: "AMBIENCE_FILES[Forest] — the chosen ambience bed." },
      { label: "Fallback bed", href: "/forest-daytime.mp3", note: "Played when the chosen ambience has no file." },
    ],
    gotchas: [
      { id: "meditation-step-machine", text: "Create → crafting → player → complete is a single-route step machine via ?step=." },
      { id: "meditation-mute-toggle", text: "Player audio respects the global prototype-mute admin toggle (Audio() is intercepted app-wide)." },
    ],
  },
  "/goals": {
    assets: [
      ...THEMED_BG,
      { label: "Goal card photos", href: "/nature/Background-3.png", note: "GOAL_BGS — cycled per goal card; also Background-8/12/5/16.png." },
      { label: "Goal card photo 2", href: "/nature/Background-8.png" },
      { label: "Goal card photo 3", href: "/nature/Background-12.png" },
      { label: "Goal card photo 4", href: "/nature/Background-5.png" },
      { label: "Goal card photo 5", href: "/nature/Background-16.png" },
    ],
    gotchas: [],
  },
  "/home": {
    assets: [
      ...THEMED_BG,
      { label: "Avatar", href: "/avatar.png" },
    ],
    gotchas: [
      { id: "home-greeting-rotation", text: "Header + subtext rotate from a preset list (RETURNING_GREETINGS in HomeScreen.tsx — 6 title/subtitle pairs, not AI-generated). \n\nOne pair is picked at random each time the app is loaded — new users get a fixed 'Welcome in.' greeting." },
      { id: "ece271ba-b5e0-4849-a7f7-ec5c6dcdc0e0", text: "3-dot menu > Stop seeing [card type] turns that item off in their Content Preferences (settings)" },
      { id: "3d547e86-8d99-4ffb-8003-cfec31ffbc16", text: "3-dot menu > Mark as Completed replaces any previous way to complete a task for Affirmations, Book Recos, Guided Sessions" },
    ],
  },
  "/you": {
    assets: [
      ...THEMED_BG,
      { label: "Avatar", href: "/avatar.png" },
      { label: "Growth illustration", href: "/assets/profile/emerging.png" },
      { label: "Empty-state leaf 1", href: "/assets/profile/empty-leaf-1.svg" },
      { label: "Empty-state leaf 2", href: "/assets/profile/empty-leaf-2.svg" },
    ],
    gotchas: [
      { id: "you-theme-toggle", text: "In-app screen — follows the Light/Dark toggle." },
      { id: "you-tab-padding", text: "Tab-screen body padding is px-6." },
    ],
  },
  "/wrap-up": {
    assets: [
      ...THEMED_BG,
      { label: "Avatar", href: "/avatar.png" },
      { label: "Hero card photo", href: "/nature/Background-13.png", note: "Tinted backdrop on the wrap-up hero card." },
    ],
    gotchas: [],
  },
  "/settings": {
    assets: [],
    gotchas: [
      { id: "a6e47c49-ad9d-4457-bac2-dc5cde223eca", text: "Background Sounds is new top item" },
      { id: "b136f341-ce38-4ace-81ee-040c3015cd97", text: "Content Preferences is new section" },
    ],
  },
  "/book": {
    assets: [],
    gotchas: [
      { id: "a72354f5-adc4-4ec4-8297-9fe2d297643e", text: "New buttons at the bottom" },
    ],
  },
  "/skill": {
    assets: [],
    gotchas: [
      { id: "2896418b-ce2f-4a37-943e-e3fc8b43dc8d", text: "New buttons at the bottom" },
    ],
  },
};

function dedupeByLabel(items: AssetLink[]): AssetLink[] {
  const seen = new Set<string>();
  const out: AssetLink[] = [];
  for (const item of items) {
    if (seen.has(item.label)) continue;
    seen.add(item.label);
    out.push(item);
  }
  return out;
}

/**
 * Merge GLOBAL notes with the route's own. Match the longest route prefix so
 * /focus-area/2 inherits a /focus-area entry, etc.
 */
export function getEngineerNotes(pathname: string): EngineerNotes {
  const exact = ROUTE_NOTES[pathname];
  const prefixKey = !exact
    ? Object.keys(ROUTE_NOTES)
        .filter((k) => k !== "/" && pathname.startsWith(k))
        .sort((a, b) => b.length - a.length)[0]
    : undefined;
  const route = exact ?? (prefixKey ? ROUTE_NOTES[prefixKey] : undefined);

  return {
    assets: dedupeByLabel([...(route?.assets ?? []), ...GLOBAL.assets]),
    gotchas: [...(route?.gotchas ?? []), ...GLOBAL.gotchas],
  };
}

// ─── Per-screen animation screenplays (rendered via /animation-specs) ────────
//
// Each screen reads as an ordered sequence of beats — when it fires, what
// moves, and the motion's properties — plus its continuous ambient loops. The
// audience is front-end iOS/Android engineers (and AI tools) reimplementing
// these natively. Everything is grounded in the real code: timings come from
// src/styles.css and each screen's own timing logic. Don't add beats you can't
// point at.

// Shared opening beats. Most screens enter with one or both of these utility
// animations before anything screen-specific happens — reuse them so a beat
// reads identically wherever it appears.
const FADE_IN: Beat = {
  cue: "0.00s",
  event: "Screen fades in",
  element: "Screen wrapper — .yuna-fade-in",
  motion: "opacity 0 → 1",
  duration: "600ms",
  easing: "ease",
  css: ".yuna-fade-in",
};
const SECTIONS_RISE: Beat = {
  cue: "0.00s",
  event: "Sections rise in (staggered)",
  element: "Headlines, cards, list items — .yuna-rise, staggered via inline animationDelay",
  motion: "opacity 0 → 1 · translateY(12px) → 0",
  duration: "500ms",
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  css: ".yuna-rise",
};

// The avatar glow aura travels with <YunaAvatar glow> wherever it renders.
const GLOW: AmbientLoop = {
  name: "Avatar glow aura",
  element: "<YunaAvatar glow> — three aria-hidden <span> layers in YunaAvatar.tsx (inline per layer)",
  css: "glow-breathe / glow-drift / glow-spin",
  timing: "7.5s / 11s / 9s — all infinite",
  motion: "Stacked gradients: breathe (scale-pulse), drift, and a spinning conic ring",
};

// The brand loading spinner. Travels with <LeafSpinner> on any full-screen
// wait (Creating Your Space, and the post-onboarding transition in /intro).
const LEAF_SPINNER: AmbientLoop = {
  name: "Leaf loading spinner",
  element:
    '<LeafSpinner size={64} surface="dark"> — three Yuna leaves orbiting a shared center (LeafSpinner.tsx); each leaf is the brand mark drawn in Leaf.tsx',
  css: "@keyframes yuna-orbit-spin",
  timing: "2.4s linear infinite",
  motion:
    "Whole cluster rotates 0° → 432° (ease-out) → 1080° (ease-in) — a fast→slow→fast orbit. Leaves are white on the dark photo.",
  note: "Brand loader for full-screen waits; replaces the old border spinner.",
};

const SCREEN_LABELS: Record<string, string> = {
  "/": "Welcome",
  "/creating-your-space": "Creating Your Space",
  "/login": "Log in",
  "/auth": "Create account",
  "/employer-access": "Employer access",
  "/intro": "Intro",
  "/chat": "Session",
  "/meditation": "Meditation",
  "/goals": "Goal setting",
  "/wrap-up": "Wrap-up",
  "/home": "Home",
  "/you": "Profile",
};

// The full choreography per screen: an ordered `sequence` of entrance beats
// plus the `ambient` loops that run continuously.
const ROUTE_SCREENPLAY: Record<
  string,
  { sequence: Beat[]; ambient: AmbientLoop[] }
> = {
  "/": {
    sequence: [
      {
        cue: "0.00s",
        event: "Hold on the forest photo",
        element:
          "PhoneFrame background — /dark4.png (useWelcomeImage). Hero content is gated behind a 1.8s timeout (index.tsx `loaded`).",
        duration: "1800ms hold",
        note: "Nothing animates yet — the lush, un-blurred photo holds while the screen settles. Every beat below is offset from the end of this hold.",
      },
      {
        cue: "1.80s",
        event: "Logo fades in",
        element: "Yuna wordmark (index.tsx)",
        motion: "opacity 0 → 1",
        duration: "600ms",
        easing: "ease",
        css: ".yuna-fade-in",
      },
      {
        cue: "1.80s",
        event: "Avatar rises in",
        element: "YunaAvatar glow wrapper (index.tsx)",
        motion: "translateY(40px) → 0",
        duration: "700ms",
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        css: "@keyframes welcome-rise",
      },
      {
        cue: "1.92s",
        event: "First bubble rises in",
        element:
          "ChatBubble — “Hi, I'm Yuna. Here to listen, reflect, and grow with you.”",
        motion: "translateY(40px) → 0",
        duration: "800ms",
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        css: "@keyframes welcome-rise",
        note: "Starts 120ms after the avatar.",
      },
      {
        cue: "2.02s",
        event: "Second bubble rises in",
        element: "ChatBubble — “How would you like to get started?”",
        motion: "translateY(40px) → 0",
        duration: "800ms",
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        css: "@keyframes welcome-rise",
        note: "Starts 100ms after the first bubble (220ms after the avatar).",
      },
      {
        cue: "3.57s",
        event: "Sign-up sheet rises in",
        element:
          "Bottom CTA sheet — frosted card with the two sign-up options + Referral / Login (index.tsx)",
        motion: "translateY(40px) → 0",
        duration: "900ms",
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        css: "@keyframes welcome-rise",
        note: "A deliberate 1770ms beat after the cluster — the bubbles land and read before the choices appear (~1.55s after the second bubble begins).",
      },
    ],
    ambient: [GLOW],
  },

  "/login": { sequence: [FADE_IN, SECTIONS_RISE], ambient: [] },
  "/auth": { sequence: [FADE_IN, SECTIONS_RISE], ambient: [] },

  "/employer-access": {
    sequence: [
      FADE_IN,
      SECTIONS_RISE,
      {
        cue: "On access-code accepted",
        event: "Pass flips to its activated face",
        element:
          "preserve-3d flip container in PassCard (employer-access.tsx) — two PassFace sides, backface-visibility:hidden, back pre-rotated 180°, on a perspective:1400 parent",
        motion: "rotateY 0° → 180°",
        duration: "900ms",
        easing: "cubic-bezier(0.7, 0, 0.3, 1)",
        css: "transition: transform (not a keyframe)",
        note: "Driven by the `unlocked` state.",
      },
      {
        cue: "On unlock + 450ms",
        event: "Halo fans glow in",
        element:
          "Soft outer glow above/below the card — rendered outside the flip container so they don't rotate (employer-access.tsx)",
        motion: "opacity 0 → 1",
        duration: "700ms",
        easing: "ease",
        note: "450ms delay after the flip begins.",
      },
    ],
    ambient: [
      {
        name: "Keepsake shimmer",
        element:
          "Pass-card sheen overlay — pointer-events-none absolute inset-0 over the unlocked face (employer-access.tsx)",
        css: ".keepsake-shimmer",
        timing: "3.2s ease-in-out infinite",
        note: "Sweeping highlight on the activated pass.",
      },
    ],
  },

  "/intro": {
    sequence: [
      FADE_IN,
      {
        cue: "0.00s",
        event: "Avatar rises in from below",
        element: "Avatar wrapper (intro.tsx) — inline animation",
        motion: "translateY(140px) → 0",
        duration: "700ms",
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        css: "@keyframes intro-avatar-rise",
        note: "Yuna enters from below as the conversation opens.",
      },
      {
        cue: "Per scripted reveal",
        event: "Bubbles, name form, and voice picker reveal in turn",
        element:
          "Each chat bubble / the name form / the inline voice picker — .yuna-rise as the script reveals them (intro.tsx)",
        motion: "opacity 0 → 1 · translateY(12px) → 0",
        duration: "500ms",
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        css: ".yuna-rise",
        note: "Cadence (intro.tsx constants): a typing indicator shows ~1.1s (the first long line ~1.8s), then the bubble pops; ~700ms between bubbles within a step, and ~500ms before Yuna replies to the user.",
      },
      {
        cue: "On finish (Let's Start)",
        event: "Creating Your Space overlay fades in with the leaf loader",
        element:
          "Full-screen overlay (intro.tsx, `transitioning`) — <LeafSpinner> over the dark photo. Same loader as the /creating-your-space screen.",
        motion: "Overlay opacity 0 → 1; leaf cluster orbits",
        duration: "600ms fade",
        easing: "ease",
        css: ".yuna-fade-in / @keyframes yuna-orbit-spin",
      },
    ],
    ambient: [GLOW, LEAF_SPINNER],
  },

  "/chat": {
    sequence: [
      FADE_IN,
      {
        cue: "Per message",
        event: "Messages enter as they arrive",
        element: "Each chat bubble — .yuna-rise (chat.tsx)",
        motion: "opacity 0 → 1 · translateY(12px) → 0",
        duration: "500ms",
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        css: ".yuna-rise",
      },
    ],
    ambient: [
      GLOW,
      {
        name: "Listening pulse ring",
        element:
          "Two ring <span>s around the avatar in VoiceSession.tsx (inset-0 / inset-3, rounded-full border)",
        css: ".yuna-pulse-ring",
        timing: "2.4s ease-out infinite",
        motion: "scale 0.92 → 1.4, fades out",
        note: "Only while Yuna is in the listening state.",
      },
    ],
  },

  "/creating-your-space": {
    sequence: [
      {
        ...FADE_IN,
        event: "Loading overlay fades in",
        element: "Full-screen overlay over the dark photo (creating-your-space.tsx)",
      },
    ],
    ambient: [LEAF_SPINNER],
  },

  "/meditation": { sequence: [FADE_IN], ambient: [GLOW] },

  "/goals": {
    sequence: [
      FADE_IN,
      {
        cue: "On goal created",
        event: "Confetti bursts",
        element:
          "Each piece — <span className=\"goal-confetti-piece\"> rendered by Confetti.tsx on the success step",
        motion: "Burst outward + fall",
        duration: "1100ms",
        easing: "cubic-bezier(0.2, 0.7, 0.3, 1) forwards",
        css: ".goal-confetti-piece / @keyframes goal-confetti-burst",
        note: "Honors prefers-reduced-motion (pieces hidden).",
      },
    ],
    ambient: [GLOW],
  },

  "/wrap-up": { sequence: [SECTIONS_RISE], ambient: [GLOW] },
  "/home": { sequence: [SECTIONS_RISE], ambient: [] },

  "/you": {
    sequence: [FADE_IN],
    ambient: [
      {
        name: "Avatar glow (breathe)",
        element: "Profile avatar aura in you.tsx — inline on the glow layer",
        css: "@keyframes glow-breathe",
        timing: "7.5s ease-in-out infinite",
        motion: "scale 0.92 ↔ 1.06 pulse",
      },
    ],
  },
};

// Longest matching route key for a pathname (so /focus-area/2 can inherit a
// /focus-area entry), or undefined if none match.
function matchKey(map: Record<string, unknown>, pathname: string): string | undefined {
  return Object.keys(map)
    .filter((k) => k === pathname || (k !== "/" && pathname.startsWith(k)))
    .sort((a, b) => b.length - a.length)[0];
}

/** The animation screenplay for a single screen — its entrance sequence plus ambient loops. */
export function getScreenplay(pathname: string): Screenplay {
  const playKey = matchKey(ROUTE_SCREENPLAY, pathname);
  const labelKey = matchKey(SCREEN_LABELS, pathname);
  const play = playKey ? ROUTE_SCREENPLAY[playKey] : undefined;
  return {
    label: labelKey ? SCREEN_LABELS[labelKey] : pathname,
    sequence: play?.sequence ?? [],
    ambient: play?.ambient ?? [],
  };
}
