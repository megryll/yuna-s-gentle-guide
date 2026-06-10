/**
 * A module-scoped one-shot message handoff. A screen calls `request(message)`
 * then navigates away; the destination screen calls `consume()` once on mount
 * to read-and-clear it. Held in memory (not localStorage) so it fires exactly
 * once per handoff and a plain visit never shows a stale message.
 *
 * Pass a `defaultMessage` for handoffs that almost always carry the same copy
 * (e.g. "Your changes have been saved.") so callers can `request()` with no
 * argument.
 */
export function createOneShot(defaultMessage?: string) {
  let pending: string | null = null;
  return {
    request(message: string = defaultMessage ?? "") {
      pending = message;
    },
    consume(): string | null {
      const message = pending;
      pending = null;
      return message;
    },
  };
}
