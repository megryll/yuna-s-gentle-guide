import * as React from "react";
import { ArrowUp as ArrowUpIcon } from "lucide-react";
import { useAppMode } from "@/lib/theme-prefs";

type Props = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Optional element rendered at the chip's leading edge (e.g. an avatar). */
  leading?: React.ReactNode;
};

const BG_DARK = "#FFFFFF";
const BG_LIGHT = "#1D1F25";
const INK = "#1D1F25";
const WHITE = "#FFFFFF";

/**
 * SuggestionChip — the Home hero CTA: a solid, pill-shaped button with a
 * leading avatar and a trailing up-arrow affordance. Body + text colors are
 * driven by the live app mode (not Tailwind tokens) so the solid chip renders
 * identically whether or not it sits inside `.theme-light`. The affordance
 * circle inverts the chip body so the arrow stays readable in both modes.
 */
export function SuggestionChip({ children, onClick, disabled, leading }: Props) {
  const isLight = useAppMode() === "light";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center rounded-full text-left gap-3 pl-5 pr-3 py-3 text-base leading-snug transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:pointer-events-none"
      style={{
        backgroundColor: isLight ? BG_LIGHT : BG_DARK,
        color: isLight ? WHITE : INK,
      }}
    >
      {leading && (
        <span className="shrink-0 -ml-1 flex items-center" aria-hidden>
          {leading}
        </span>
      )}
      <span className="min-w-0">{children}</span>
      <span
        aria-hidden
        className="shrink-0 grid place-items-center rounded-full h-9 w-9"
        style={
          isLight
            ? { backgroundColor: WHITE, color: INK }
            : { backgroundColor: INK, color: WHITE }
        }
      >
        <ArrowUpIcon size={14} strokeWidth={2.5} />
      </span>
    </button>
  );
}
