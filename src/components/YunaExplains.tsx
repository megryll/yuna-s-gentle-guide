import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import { useYunaIdentity } from "@/lib/yuna-session";
import { DEFAULT_VOICE } from "@/lib/voices";

/**
 * YunaExplains — the user's chosen Yuna voice avatar paired with a short line of
 * context Yuna offers about what they're looking at (a therapist match reason, a
 * reflection on a profile insight). A soft frosted row: chosen avatar + plain
 * Stara body copy. Same look everywhere, so Yuna's voice reads consistently
 * across screens.
 *
 * The avatar defaults to the user's chosen voice (`useYunaIdentity`), falling
 * back to the default voice; pass `avatar` to pin a specific one (e.g. a DS
 * demo). The frosted fill is keyed off `surface` directly (the `.theme-light`
 * shim doesn't remap `bg-white/*`) so it reads on either photo.
 *
 * children:  what Yuna says
 * avatar?:   override the chosen voice avatar
 * size?:     avatar px (default 32)
 * surface?:  "dark" | "light" (default "dark")
 */
export function YunaExplains({
  children,
  avatar,
  size = 32,
  surface = "dark",
  className,
}: {
  children: ReactNode;
  avatar?: AvatarVariant;
  size?: number;
  surface?: "dark" | "light";
  className?: string;
}) {
  const identity = useYunaIdentity();
  const variant = avatar ?? identity.avatar ?? DEFAULT_VOICE;
  const dark = surface === "dark";
  return (
    <div
      className={cn(
        "rounded-2xl p-4 flex gap-3 items-start",
        dark ? "bg-white/8" : "bg-foreground/5",
        className,
      )}
    >
      <YunaAvatar variant={variant} size={size} className="mt-0.5 shrink-0" />
      <p className={cn("text-sm leading-snug", dark ? "text-white/85" : "text-foreground/85")}>
        {children}
      </p>
    </div>
  );
}
YunaExplains.displayName = "YunaExplains";
