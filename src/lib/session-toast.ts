import { createOneShot } from "./one-shot";

// One-shot toast handoff for the Sessions list. Deleting a conversation from
// its detail screen navigates back to /sessions and wants a confirming toast
// there — consumed once on arrival, so a plain visit never shows it.
const sessionToast = createOneShot();
export const requestSessionToast = sessionToast.request;
export const consumeSessionToast = sessionToast.consume;
