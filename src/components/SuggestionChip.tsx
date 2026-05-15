import * as React from "react";
import { ArrowUp as ArrowUpIcon } from "lucide-react";
import { useAppMode } from "@/lib/theme-prefs";

type Variant = "filled" | "outline" | "primary";
type Size = "md" | "sm" | "lg";
type Action = "send" | "reply";

type Props = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  action?: Action;
  fullWidth?: boolean;
};

const FILLED_BG_DARK = "rgba(253, 252, 250, 0.2)";
const FILLED_BG_LIGHT = "rgba(255, 255, 255, 0.5)";
const PRIMARY_BG = "#FFFFFF";

export function SuggestionChip({
  children,
  onClick,
  disabled,
  variant = "filled",
  size = "md",
  action = "send",
  fullWidth = true,
}: Props) {
  const mode = useAppMode();
  const isLight = mode === "light";

  const sizeClasses =
    size === "sm"
      ? "gap-3 pl-3 pr-1.5 py-1.5 text-[14px] leading-tight"
      : size === "lg"
        ? "gap-3 pl-5 pr-3 py-3 text-[16px] leading-snug"
        : "gap-3 pl-4 pr-2 py-2 text-[14px] leading-snug";

  // Borders are pinned via inline style so `.theme-light` can't invert them
  // to dark — the chips must keep a white hairline + white fill on the pale
  // photo bg too.
  const variantClass =
    variant === "outline"
      ? "text-white"
      : variant === "primary"
        ? "text-neutral-900"
        : "text-white";

  const inlineStyle =
    variant === "primary"
      ? { backgroundColor: PRIMARY_BG }
      : variant === "outline"
        ? { border: "1px solid rgba(255,255,255,0.2)" }
        : {
            backgroundColor: isLight ? FILLED_BG_LIGHT : FILLED_BG_DARK,
            borderTop: `1px solid rgba(255,255,255,${isLight ? 0.7 : 0.1})`,
          };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        (fullWidth ? "w-full " : "") +
        "inline-flex items-center rounded-full text-left transition-opacity active:opacity-80 disabled:opacity-50 disabled:pointer-events-none " +
        sizeClasses +
        " " +
        variantClass
      }
      style={inlineStyle}
    >
      <span className={(fullWidth ? "flex-1 " : "") + "min-w-0"}>
        {children}
      </span>
      <ActionAffordance action={action} size={size} variant={variant} />
    </button>
  );
}

function ActionAffordance({
  action,
  size,
  variant,
}: {
  action: Action;
  size: Size;
  variant: Variant;
}) {
  if (action === "reply") {
    const padding =
      size === "lg" ? "pl-4 pr-3.5 py-2.5" : size === "sm" ? "pl-3 pr-2.5 py-1" : "pl-3.5 pr-3 py-1.5";
    const labelSize =
      size === "lg" ? "text-[12px]" : "text-[11px]";
    const arrowPx = size === "lg" ? 14 : 12;
    return (
      <span
        aria-hidden
        className={
          "shrink-0 inline-flex items-center gap-2 rounded-full bg-white text-neutral-900 " +
          padding
        }
      >
        <span className={labelSize + " tracking-[0.16em] font-semibold"}>
          REPLY
        </span>
        <ArrowUp px={arrowPx} />
      </span>
    );
  }

  const circleSize =
    size === "lg" ? "h-9 w-9" : size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const iconPx = size === "lg" ? 14 : size === "sm" ? 10 : 12;
  const surfaceClass =
    variant === "outline"
      ? "border border-white/60 text-white"
      : "bg-white text-neutral-900";
  return (
    <span
      aria-hidden
      className={
        "shrink-0 grid place-items-center rounded-full " +
        surfaceClass +
        " " +
        circleSize
      }
    >
      <ArrowUp px={iconPx} />
    </span>
  );
}

function ArrowUp({ px }: { px: number }) {
  return <ArrowUpIcon size={px} strokeWidth={2.5} />;
}
