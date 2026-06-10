// One-shot toast handoff for the Sessions list. Deleting a conversation from
// its detail screen navigates back to /sessions and wants a confirming toast
// there. Held in memory only and consumed once on arrival, so a plain visit to
// the list never shows it. (Mirrors the schedule-prompt one-shot pattern.)
let pending: string | null = null;

export function requestSessionToast(message: string) {
  pending = message;
}

export function consumeSessionToast(): string | null {
  const message = pending;
  pending = null;
  return message;
}
