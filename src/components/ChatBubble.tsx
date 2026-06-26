import type { CSSProperties, ReactNode } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatform } from "@/lib/platform";
import { usePhoneFrameContainer } from "@/components/PhoneFrame";
import { modeImage, useAppMode } from "@/lib/theme-prefs";

export type ChatBubbleMenuAction = {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
};

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
 * menuActions: when provided (and from="yuna"), renders a 3-dot trigger in the
 *   bubble's top-right corner that opens a contextual menu (e.g. Bad Response,
 *   Copy). Each action is a { label, icon, onSelect } row. Omit it during
 *   onboarding / intro flows where the bubble is read-only.
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
  menuActions,
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
  menuActions?: ChatBubbleMenuAction[];
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const isUser = from === "user";
  const platform = usePlatform();
  const androidFrost = !isUser && !!frostedImage && platform === "android";
  const showMenu = !isUser && !typing && !!menuActions && menuActions.length > 0;
  return (
    <div
      className={cn(
        "rounded-2xl",
        showMenu && "relative",
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
            ? "px-5 py-4 text-xl leading-[1.4]"
            : "px-4 py-2.5 text-sm leading-relaxed",
        )}
      >
        {typing ? <TypingDots /> : children}
      </div>
      {attachment}
      {showMenu && <BubbleMenu actions={menuActions} />}
    </div>
  );
}

function BubbleMenu({ actions }: { actions: ChatBubbleMenuAction[] }) {
  const container = usePhoneFrameContainer();
  const appMode = useAppMode();
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Message options"
          className="absolute right-1 top-1 z-10 grid place-items-center rounded-full p-1.5 text-white/60 outline-none transition-colors hover:bg-white/[0.06] active:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <MoreVertical size={16} strokeWidth={2} aria-hidden />
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal container={container ?? undefined}>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={6}
          className={cn(
            "z-50 outline-none origin-(--radix-dropdown-menu-content-transform-origin)",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          )}
        >
          {/* Opaque surface painted with the mode photo, exactly like the
              drawer — overlay-on-dark tints child fills/text for dark mode. */}
          <div
            style={{
              backgroundImage: `url(${modeImage(appMode)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            className={cn(
              "min-w-[224px] overflow-hidden rounded-2xl border border-border text-popover-foreground shadow-lg",
              appMode === "dark" && "overlay-on-dark",
            )}
          >
            {actions.map((action, i) => (
              <DropdownMenuPrimitive.Item
                key={action.label}
                onSelect={action.onSelect}
                className={cn(
                  "flex cursor-default select-none items-center justify-between gap-6 px-4 py-3.5 text-base outline-none transition-colors hover:bg-foreground/[0.04] active:bg-foreground/8 focus-visible:bg-foreground/8",
                  i > 0 && "border-t border-border",
                )}
              >
                <span>{action.label}</span>
                <span className="text-muted-foreground">{action.icon}</span>
              </DropdownMenuPrimitive.Item>
            ))}
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
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
