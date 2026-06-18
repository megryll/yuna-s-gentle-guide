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

type Listener = () => void;
const listeners = new Set<Listener>();

let statusState: YunaState | null = null;
let recoKind: CardKind | null = null;
let escalationTier: EscalationTier | null = null;
let guidedTitle: string | null = null;

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
export function setSessionGuided(next: string | null) {
  guidedTitle = next;
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
export function useSessionGuided(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => guidedTitle,
    () => guidedTitle,
  );
}
