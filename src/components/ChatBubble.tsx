import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePlatform } from "@/lib/platform";

/**
 * Chat bubble.
 *
 * from:
 *   - "yuna" (default) — frosted white-on-dark bubble, tail on the lower-left.
 *   - "user"           — solid white bubble with ink text, tail on the lower-right.
 *
 * size:
 *   - "md" (default) — conversational density.
 *   - "lg"           — hero density.
 *
 * typing: renders the animated three-dot "Yuna is typing" indicator in place
 *   of children, keeping the yuna bubble chrome. For the pending state before
 *   a reply lands; pair with from="yuna".
 *
 * tail: rounds three corners and squares the speaker's bottom corner. Set
 *   false for the non-final bubbles in a same-speaker group.
 *
 * frostedImage: the Yuna bubble's frost uses backdrop-blur, which Android
 *   can't render. Pass the screen's background photo and it's painted behind
 *   the bubble on Android so the frosted look survives.
 *
 * attachment: a full-bleed footer node rendered below the text (e.g. a stat
 *   card, an OS push preview, a chart). The caller styles its own top divider
 *   / fill / padding; the bubble just clips it to the rounded shape
 *   (overflow-hidden) and drops the text region's bottom rounding into it.
 *
 * Authored in white-on-dark vocabulary; `.theme-light` inverts it for light
 * mode automatically, so no `surface` prop is needed. Layout (alignment,
 * max-width) belongs to the caller. Put any entrance animation in `style` on
 * THIS element — an ancestor transform would disable the backdrop-filter.
 */
export function ChatBubble({
  from = "yuna",
  size = "md",
  typing = false,
  tail = true,
  frostedImage,
  attachment,
  className,
  style,
  children,
}: {
  from?: "yuna" | "user";
  size?: "md" | "lg";
  typing?: boolean;
  tail?: boolean;
  frostedImage?: string;
  attachment?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const isUser = from === "user";
  const platform = usePlatform();
  const androidFrost = !isUser && !!frostedImage && platform === "android";
  return (
    <div
      className={cn(
        "rounded-2xl",
        attachment && "overflow-hidden",
        isUser
          ? "bg-white text-neutral-900"
          : "border border-white/25 bg-white/10 backdrop-blur-md text-white",
        tail && (isUser ? "rounded-br-sm" : "rounded-bl-sm"),
        className,
      )}
      style={
        androidFrost
          ? {
              background: `linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.12)), url(${frostedImage}) center/cover fixed no-repeat`,
              ...style,
            }
          : style
      }
    >
      <div
        className={cn(
          "whitespace-pre-line",
          size === "lg"
            ? "px-5 py-4 text-[20px] leading-[1.4]"
            : "px-4 py-2.5 text-sm leading-relaxed",
        )}
      >
        {typing ? <TypingDots /> : children}
      </div>
      {attachment}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1" role="status" aria-label="Yuna is typing">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-1.5 w-1.5 rounded-full bg-white"
          style={{
            animation: "yuna-fade 900ms ease-in-out infinite alternate",
            animationDelay: `${d}ms`,
          }}
        />
      ))}
    </span>
  );
}
