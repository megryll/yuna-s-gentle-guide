import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Leaf } from "@/components/Leaf";

export type YunaState =
  | "listening"
  | "thinking"
  | "speaking"
  | "reconnecting"
  | "slow"
  | "offline";

// Per-state copy + treatment. The "working" states (thinking, reconnecting,
// slow) carry the flipping leaf; listening/speaking are a label only — in voice
// mode the avatar's rings already carry those two. `slow` reads as a gentle
// alert, so its leaf + label take the warm orange tone. `offline` is the one
// connection state: a static (non-flipping) wifi-off glyph plus a "Retry"
// action — Yuna isn't working, the network is down.
const STATE_CONFIG: Record<
  YunaState,
  {
    label: string;
    icon: "leaf" | "wifi-off" | "none";
    tone: "default" | "alert";
    retry?: boolean;
  }
> = {
  listening: { label: "I'm listening", icon: "none", tone: "default" },
  thinking: { label: "I'm thinking", icon: "leaf", tone: "default" },
  speaking: { label: "Yuna is speaking", icon: "none", tone: "default" },
  reconnecting: { label: "Reconnecting", icon: "leaf", tone: "default" },
  slow: {
    label: "Sorry, this is taking longer than usual",
    icon: "leaf",
    tone: "alert",
  },
  offline: {
    label: "You are offline.",
    icon: "wifi-off",
    tone: "default",
    retry: true,
  },
};

/**
 * Yuna's conversational state indicator: a short label preceded by a status
 * glyph. The "working" states carry a single leaf that flips coin-style (1.9s);
 * the `offline` state swaps in a static wifi-off glyph + a "Retry" action.
 * Shows what's happening during a session — thinking, reconnecting, a slow
 * response, or a dropped connection — and labels the listening/speaking turns.
 *
 * state:   which status to show.
 * surface: which photo cluster it sits on. `dark` → white leaf + light text
 *          (the default); `light` → near-black leaf + ink text. The `slow`
 *          alert tone is the same warm orange on both; the offline glyph is a
 *          muted gray on both.
 * label:   optional copy override (e.g. to match a screen's own phrasing).
 * onRetry: handler for the offline state's "Retry" link. Ignored by every
 *          other state (none of them render an action).
 */
export function YunaStatus({
  state,
  surface = "dark",
  label,
  onRetry,
  className,
}: {
  state: YunaState;
  surface?: "dark" | "light";
  label?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const config = STATE_CONFIG[state];
  const text = label ?? config.label;

  const iconColor =
    config.tone === "alert"
      ? "text-alert-orange"
      : config.icon === "wifi-off"
        ? "text-white/60"
        : surface === "dark"
          ? "text-white"
          : "text-neutral";

  const labelColor =
    config.tone === "alert" ? "text-alert-orange" : "text-white/85";

  // Brand green that stays legible on whichever cluster: the brighter
  // secondary green reads on the dark photo, the deep primary green on the
  // pale one.
  const retryColor =
    surface === "dark" ? "text-secondary-green" : "text-primary-green";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2", className)}
    >
      {config.icon === "leaf" && (
        <span
          aria-hidden="true"
          className={cn("inline-block shrink-0", iconColor)}
          style={{
            animation: "yuna-leaf-flip 1.9s ease-in-out infinite",
            willChange: "transform",
          }}
        >
          <Leaf size={16} />
        </span>
      )}
      {config.icon === "wifi-off" && (
        <WifiOff
          size={16}
          strokeWidth={1.75}
          aria-hidden="true"
          className={cn("shrink-0", iconColor)}
        />
      )}
      <span className={cn("text-sm font-medium leading-snug", labelColor)}>
        {text}
      </span>
      {config.retry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "text-sm font-semibold underline underline-offset-2 active:opacity-80",
            retryColor,
          )}
        >
          Retry
        </button>
      )}
    </div>
  );
}
