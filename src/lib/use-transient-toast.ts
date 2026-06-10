import { useCallback, useEffect, useState } from "react";

/** One shared auto-dismiss duration for transient confirmation toasts. */
export const TOAST_DURATION_MS = 3500;

/**
 * Transient confirmation-toast state. `show(message)` flashes a toast that
 * auto-dismisses after the shared duration; `dismiss()` clears it early (wire
 * it to the toast's × button). Render `message` into a <Toast/> inside a
 * <ToastViewport/>. To surface a one-shot handed off from another screen, call
 * `show()` with the consumed message from a mount effect.
 */
export function useTransientToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [message]);

  const show = useCallback((next: string) => setMessage(next), []);
  const dismiss = useCallback(() => setMessage(null), []);

  return { message, show, dismiss };
}
