import { useSyncExternalStore } from "react";

// One-shot "schedule a follow-up" prompt. When a user finishes a session and
// lands back on Home, we surface a drawer inviting them to commit to a
// follow-up on the topic they just worked through. Held in memory only (like
// the disclaimer flag) — it fires once per wrap-up → home transition and is
// cleared as soon as the user schedules or dismisses, so a plain Home visit
// never shows it.
let pendingTopic: string | undefined;
let active = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function requestSchedulePrompt(topic?: string) {
  pendingTopic = topic?.trim() || undefined;
  active = true;
  emit();
}

export function getScheduleTopic(): string | undefined {
  return pendingTopic;
}

export function clearSchedulePrompt() {
  pendingTopic = undefined;
  active = false;
  emit();
}

export function useSchedulePromptActive(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => active,
    () => false,
  );
}
