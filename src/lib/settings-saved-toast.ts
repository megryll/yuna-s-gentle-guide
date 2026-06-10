// One-shot "your changes have been saved" signal for the Settings screen.
//
// A Settings sub-page (Account, Subscription, Language, Voice) flags a save
// here, then navigates back to /settings. The Settings route consumes the flag
// on mount and flashes a success toast — confirming the change "upon return"
// without threading state through the router. Module-level (not localStorage):
// it's a transient one-shot, not a persisted preference.

let pending: string | null = null;

export function flagSettingsSaved(message = "Your changes have been saved.") {
  pending = message;
}

/** Returns the pending message (clearing it) or null if nothing is queued. */
export function consumeSettingsSaved(): string | null {
  const message = pending;
  pending = null;
  return message;
}
