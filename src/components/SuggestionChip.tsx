import * as React from "react";

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

const FILLED_BG = "rgba(253, 252, 250, 0.2)";
const PRIMARY_BG = "#115430";

export function SuggestionChip({
  children,
  onClick,
  disabled,
  variant = "filled",
  size = "md",
  action = "send",
  fullWidth = true,
}: Props) {
  const sizeClasses =
    size === "sm"
      ? "gap-3 pl-3 pr-1.5 py-1.5 text-[14px] leading-tight"
      : size === "lg"
        ? "gap-3 pl-5 pr-3 py-3 text-[16px] leading-snug"
        : "gap-3 pl-4 pr-2 py-2 text-[14px] leading-snug";

  const variantClass =
    variant === "outline"
      ? "border border-white/20 text-white"
      : variant === "primary"
        ? "text-white"
        : "border-t border-white/10 text-white";

  const inlineStyle =
    variant === "primary"
      ? { backgroundColor: PRIMARY_BG }
      : variant === "outline"
        ? undefined
        : { backgroundColor: FILLED_BG };

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
  return (
    <svg width={px} height={px} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 19V5M5 12l7-7 7 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
