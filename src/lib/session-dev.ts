import { useSyncExternalStore } from "react";
import type { YunaState } from "@/components/YunaStatus";
import type { EscalationTier } from "@/components/CardSuggestion";
import type { CardKind } from "@/lib/home-cards";

// Dev-only session overrides driven by the right-hand EngineerSidebar's "Yuna
// states" panel. Selecting a chip pushes the live session screen into that
// state (a conversational status, or a surfaced card recommendation) so it can
// be reviewed without scripting a real conversation. In-memory only — resets on
// reload; never ships in a real build path.

// Sample card content for each reco chip, so the dev trigger renders a real
// suggestion. CardSuggestion itself is generic (kind + title + photo); this is
// just the demo payload shared by the text and voice session screens. Solid
// kinds (questionnaire) carry their fixed fill + watermark, so no naturePath.
export const RECO_SAMPLES: Partial<
  Record<
    CardKind,
    { title: string; naturePath?: string; description?: string; duration?: string }
  >
> = {
  meditation: {
    title: "Meditation For You: A Five-Minute Midday Reset",
    naturePath: "/nature/Background-13.png",
  },
  "self-discovery": {
    title: "Your starting point",
    description:
      "Choose what you'd like support with, then answer a short set of research-backed questions to mark where you're starting from.",
    duration: "3 min",
  },
};

// Sample guided-session title for the "Guided Session" dev chip, so toggling
// it from the EngineerSidebar shows the distinctive header banner with real
// copy (matching a guided-session Home card). Tapping into a guided session
// from a Home card passes its own title via the /chat `guided` search param.
export const GUIDED_SAMPLE_TITLE =
  "Untangle perfectionism at work, one thread at a time";

// Wrap-up A/B variants — which reflection treatment the wrap-up screen renders.
// "current" is the shipped screen; every other value hides the hero keepsake
// card and promotes the stress/mood reflection to the top of the scroll, so the
// variants differ only in how the two answers are captured.
export type WrapUpVariant =
  | "current"
  | "focus"
  | "sliders"
  | "choice6"
  | "choice4"
  | "trend"
  | "tally"
  | "binary"
  | "stepped";

export const WRAPUP_VARIANTS: { value: WrapUpVariant; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "focus", label: "Reflection first" },
  { value: "sliders", label: "Sliders" },
  { value: "choice6", label: "6 options" },
  { value: "choice4", label: "4 options" },
  // Reward the answer: the same 4-option input, then a payoff built from the
  // user's run of past check-ins.
  { value: "trend", label: "Trend reward" },
  { value: "tally", label: "Tally reward" },
  // Make answering as cheap as possible: one tap per question.
  { value: "binary", label: "Two taps" },
  { value: "stepped", label: "One at a time" },
];

type Listener = () => void;
const listeners = new Set<Listener>();

let statusState: YunaState | null = null;
let recoKind: CardKind | null = null;
let escalationTier: EscalationTier | null = null;
let suicidalityOn = false;
let illinoisOn = false;
let scheduleSessionOn = false;
let upcomingApptOn = false;
let guidedTitle: string | null = null;
let guidedComplete = false;
let wrapUpVariant: WrapUpVariant = "current";
// One-shot counter rather than a boolean: the hub's booking celebration is a
// moment, not a mode, so each press has to re-fire it even after the last one
// was dismissed.
let bookingCelebration = 0;

function emit() {
  for (const l of listeners) l();
}
function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function setSessionStatus(next: YunaState | null) {
  statusState = next;
  emit();
}
export function setSessionReco(next: CardKind | null) {
  recoKind = next;
  emit();
}
export function setSessionEscalation(next: EscalationTier | null) {
  escalationTier = next;
  emit();
}
export function setSessionSuicidality(next: boolean) {
  suicidalityOn = next;
  emit();
}
export function setSessionIllinois(next: boolean) {
  illinoisOn = next;
  emit();
}
export function setSessionScheduleSession(next: boolean) {
  scheduleSessionOn = next;
  emit();
}
export function setSessionUpcomingAppointment(next: boolean) {
  upcomingApptOn = next;
  emit();
}
export function setSessionGuided(next: string | null) {
  guidedTitle = next;
  // No guided session, no completion to track.
  if (next === null) guidedComplete = false;
  emit();
}
export function setSessionGuidedComplete(next: boolean) {
  guidedComplete = next;
  // Completion implies an active guided session, so the header + tracker render.
  if (next && guidedTitle === null) guidedTitle = GUIDED_SAMPLE_TITLE;
  emit();
}

export function setWrapUpVariant(next: WrapUpVariant) {
  wrapUpVariant = next;
  emit();
}

/** Replay the therapist hub's "appointment confirmed" celebration. Armed here,
 *  played by whichever hub is mounted — so pressing the chip from /tools still
 *  lands once you get to the hub. */
export function triggerBookingCelebration() {
  bookingCelebration += 1;
  emit();
}

/** Played once and cleared, so navigating back to the hub doesn't replay it. */
export function consumeBookingCelebration() {
  if (!bookingCelebration) return;
  bookingCelebration = 0;
  emit();
}

export function useSessionStatus(): YunaState | null {
  return useSyncExternalStore(
    subscribe,
    () => statusState,
    () => statusState,
  );
}
export function useSessionReco(): CardKind | null {
  return useSyncExternalStore(
    subscribe,
    () => recoKind,
    () => recoKind,
  );
}
export function useSessionEscalation(): EscalationTier | null {
  return useSyncExternalStore(
    subscribe,
    () => escalationTier,
    () => escalationTier,
  );
}
export function useSessionSuicidality(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => suicidalityOn,
    () => suicidalityOn,
  );
}
export function useSessionIllinois(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => illinoisOn,
    () => illinoisOn,
  );
}
export function useSessionScheduleSession(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => scheduleSessionOn,
    () => scheduleSessionOn,
  );
}
export function useSessionUpcomingAppointment(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => upcomingApptOn,
    () => upcomingApptOn,
  );
}
export function useBookingCelebration(): number {
  return useSyncExternalStore(
    subscribe,
    () => bookingCelebration,
    () => bookingCelebration,
  );
}
export function useSessionGuided(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => guidedTitle,
    () => guidedTitle,
  );
}
export function useSessionGuidedComplete(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => guidedComplete,
    () => guidedComplete,
  );
}
export function useWrapUpVariant(): WrapUpVariant {
  return useSyncExternalStore(
    subscribe,
    () => wrapUpVariant,
    () => wrapUpVariant,
  );
}
