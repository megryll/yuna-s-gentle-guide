import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconMedallion } from "@/components/IconMedallion";
import { DictationTextArea } from "@/components/DictationTextArea";

/**
 * MultipleChoice — a group of selectable option rows that manages single- or
 * multi-select state. Each row is a full-width rounded card: an optional
 * leading glyph (emoji medallion or icon), a title with optional subtitle, and
 * a selection indicator (a trailing check).
 *
 * This is NOT `<Button variant="card">`. Button's card variant is a single
 * navigational list-row (tap to go somewhere). MultipleChoice owns *group
 * selection semantics* — radio/checkbox behaviour across a set of options —
 * which a lone Button can't express. Reach for it for survey answers, a
 * session-type picker, a filter list. Use a tappable `<Tag>` grid instead when
 * the choices are compact keyword pills rather than full rows.
 *
 * The selected row borrows the DS's neutral selection idiom (filled ink/white
 * highlight + a foreground check), the same vocabulary as Button's card
 * selected state, so selection reads consistently across the system. A row
 * that becomes selected gives a brief settle pulse (`yuna-settle`) — the
 * simulated-haptic register beat used across the prototype.
 *
 * An option flagged `other` is the open-ended escape hatch ("Something Else"):
 * while selected it swaps its row for an inline DictationTextArea so the user
 * can type or record a custom answer. Thread `otherValue` / `onOtherChange` for
 * its text; clearing the field when it's already empty deselects the option.
 *
 * options:    [{ value, label, emoji?, icon?, subtitle?, trailing?, disabled?, other? }]
 * value:      selected value (single) or values (multiple)
 * onChange:   next value (single) or next array (multiple)
 * multiple?:  allow more than one selection (default false)
 * indicator?: "check" (trailing) | "none". Default "check". Use "none" when the
 *             caller owns the selection cue via `trailing` (e.g. priority-order
 *             numerals on an ordered multi-select, or a detail badge).
 * otherValue / onOtherChange / otherPlaceholder: the open-ended field's text,
 *             setter, and idle hint — required once any option sets `other`.
 * surface?:   "dark" | "light" (default "dark")
 * ariaLabel:  names the group (radiogroup / group)
 */
export type MultipleChoiceOption = {
  value: string;
  label: string;
  emoji?: string;
  icon?: ReactNode;
  subtitle?: string;
  trailing?: ReactNode;
  disabled?: boolean;
  /** Open-ended option: while selected, the row becomes a text/record field. */
  other?: boolean;
};

type BaseProps = {
  options: MultipleChoiceOption[];
  indicator?: "check" | "none";
  surface?: "dark" | "light";
  ariaLabel: string;
  className?: string;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  otherPlaceholder?: string;
};

export type MultipleChoiceProps =
  | (BaseProps & { multiple?: false; value: string | null; onChange: (value: string) => void })
  | (BaseProps & { multiple: true; value: string[]; onChange: (value: string[]) => void });

export function MultipleChoice(props: MultipleChoiceProps) {
  const { options, surface = "dark", ariaLabel, className } = props;
  const multiple = props.multiple ?? false;
  const indicator = props.indicator ?? "check";
  const dark = surface === "dark";
  const otherValue = props.otherValue ?? "";

  const isSelected = (v: string) =>
    multiple ? (props.value as string[]).includes(v) : props.value === v;

  const handle = (v: string) => {
    if (props.multiple) {
      const arr = props.value;
      props.onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      props.onChange(v);
    }
  };

  return (
    <div
      role={multiple ? "group" : "radiogroup"}
      aria-label={ariaLabel}
      className={cn("flex flex-col gap-2", className)}
    >
      {options.map((opt) => {
        const selected = isSelected(opt.value);
        // A selected open-ended option becomes the inline text/record field.
        // Clearing it when already empty toggles the option back off.
        if (opt.other && selected) {
          return (
            <DictationTextArea
              key={opt.value}
              surface={surface}
              value={otherValue}
              onChange={(v) => props.onOtherChange?.(v)}
              onClear={() =>
                otherValue.trim() ? props.onOtherChange?.("") : handle(opt.value)
              }
              placeholder={props.otherPlaceholder}
            />
          );
        }
        return (
          <button
            key={opt.value}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={selected}
            disabled={opt.disabled}
            onClick={() => handle(opt.value)}
            className={cn(
              "w-full rounded-2xl border px-4 py-3 flex items-center gap-3 text-left",
              "transition-[transform,background-color,border-color] duration-100 ease-out active:scale-[0.99]",
              selected && "yuna-settle",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
              "disabled:opacity-50 disabled:pointer-events-none",
              dark
                ? selected
                  ? "border-white bg-white/10 text-white focus-visible:ring-white/60"
                  : "border-white/40 text-white active:bg-white/10 focus-visible:ring-white/60"
                : selected
                  ? "border-foreground/40 bg-foreground/5 text-foreground focus-visible:ring-foreground/30"
                  : "border-border text-foreground active:bg-foreground/8 focus-visible:ring-foreground/30",
            )}
          >
            {(opt.emoji || opt.icon) && (
              <IconMedallion size="sm">
                {opt.emoji ? (
                  <span className="text-lg leading-none" aria-hidden>
                    {opt.emoji}
                  </span>
                ) : (
                  opt.icon
                )}
              </IconMedallion>
            )}
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold leading-tight">{opt.label}</span>
              {opt.subtitle && (
                <span
                  className={cn(
                    "block text-xs mt-0.5 leading-snug",
                    dark ? "text-white/70" : "text-muted-foreground",
                  )}
                >
                  {opt.subtitle}
                </span>
              )}
            </span>
            {opt.trailing && <span className="shrink-0">{opt.trailing}</span>}
            {indicator === "check" && selected && (
              <Check
                size={20}
                strokeWidth={2.25}
                aria-hidden
                className={cn("shrink-0", dark ? "text-white" : "text-foreground")}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
MultipleChoice.displayName = "MultipleChoice";
