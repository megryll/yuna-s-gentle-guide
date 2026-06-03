import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CheckBadge — a filled green circle with a white check. Marks a completed or
 * confirmed item: an accepted term, a verified step, a checklist row.
 *
 * The green (`bg-yuna-green`) and white check read on both photo surfaces, so
 * there's no `surface` prop.
 *
 * size: "sm" (18px) | "md" (28px, default)
 *
 * Decorative by default (aria-hidden). Pass `label` to give it an accessible
 * name when the check itself carries meaning rather than echoing adjacent text.
 */
export interface CheckBadgeProps {
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

const SIZES = {
  sm: { box: "h-[18px] w-[18px]", icon: 11, stroke: 3 },
  md: { box: "h-7 w-7", icon: 15, stroke: 2.5 },
} as const;

export function CheckBadge({ size = "md", label, className }: CheckBadgeProps) {
  const s = SIZES[size];
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-flex items-center justify-center rounded-full shrink-0 bg-yuna-green text-white",
        s.box,
        className,
      )}
    >
      <Check size={s.icon} strokeWidth={s.stroke} />
    </span>
  );
}
CheckBadge.displayName = "CheckBadge";
