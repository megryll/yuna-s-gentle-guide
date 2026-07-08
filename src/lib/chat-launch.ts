import { useSyncExternalStore } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getSeenDisclaimers } from "@/lib/yuna-session";

export type ChatLaunchSearch = {
  q?: string;
  mode?: "text" | "voice";
  revisit?: string;
  // Guided-session title shown in the chat header band, and the flow marker that
  // selects a scripted opener (the post-appointment debrief / pre-session prep).
  // Both must be carried through the first-session disclaimer gate, so they
  // live here.
  guided?: string;
  flow?: "therapist-debrief" | "therapist-prep";
  // The therapist a scripted flow is about (the debrief names them and its
  // hand-off card books with them).
  therapist?: string;
};

// Pending first-session chat launch. The very first time a user starts a
// conversation we don't navigate straight to /chat — we stash the intended
// search params here and flip `active` so the disclaimer gate (mounted inside
// HomeScreen / ScreenChrome, i.e. the screen they came from) can play the
// three acknowledgements ON THAT SCREEN first. On completion the gate consumes
// these params and navigates to /chat.
let pendingSearch: ChatLaunchSearch | undefined;
let active = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestChatLaunch(search?: ChatLaunchSearch) {
  pendingSearch = search;
  active = true;
  emit();
}

export function getPendingChatSearch(): ChatLaunchSearch {
  return pendingSearch ?? {};
}

export function clearChatLaunch() {
  pendingSearch = undefined;
  active = false;
  emit();
}

export function useChatLaunchActive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => active,
    () => false,
  );
}

// Entry-point helper. First conversation → show disclaimers on the current
// screen, then continue to /chat. Every later conversation → navigate straight
// through (the in-memory `seenDisclaimers` flag survives in-app navigation).
// The scripted therapist flows (debrief, session prep) skip the gate entirely —
// by user decision those conversations open without the three first-session
// disclaimer screens. The seen flag is left untouched, so a later ordinary
// first conversation still gets them.
export function useStartChat() {
  const navigate = useNavigate();
  return (search?: ChatLaunchSearch) => {
    if (search?.flow || getSeenDisclaimers()) {
      navigate({ to: "/chat", search: search ?? {} });
    } else {
      requestChatLaunch(search);
    }
  };
}
