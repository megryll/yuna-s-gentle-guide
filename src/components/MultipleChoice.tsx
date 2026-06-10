import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconMedallion } from "@/components/IconMedallion";

/**
 * MultipleChoice — a group of selectable option rows that manages single- or
 * multi-select state. Each row is a full-width rounded card: an optional
 * leading glyph (emoji medallion or icon), a title with optional subtitle, and
 * a selection indicator (a left radio or a trailing check).
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
 * selected state, so selection reads consistently across the system.
 *
 * options:    [{ value, label, emoji?, icon?, subtitle?, trailing?, disabled? }]
 * value:      selected value (single) or values (multiple)
 * onChange:   next value (single) or next array (multiple)
 * multiple?:  allow more than one selection (default false)
 * indicator?: "radio" (leading) | "check" (trailing). Default "radio" for
 *             single, "check" for multiple.
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
};

type BaseProps = {
  options: MultipleChoiceOption[];
  indicator?: "radio" | "check";
  surface?: "dark" | "light";
  ariaLabel: string;
  className?: string;
};

export type MultipleChoiceProps =
  | (BaseProps & { multiple?: false; value: string | null; onChange: (value: string) => void })
  | (BaseProps & { multiple: true; value: string[]; onChange: (value: string[]) => void });

export function MultipleChoice(props: MultipleChoiceProps) {
  const { options, surface = "dark", ariaLabel, className } = props;
  const multiple = props.multiple ?? false;
  const indicator = props.indicator ?? (multiple ? "check" : "radio");
  const dark = surface === "dark";

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
            {indicator === "radio" && (
              <Radio selected={selected} dark={dark} />
            )}
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

function Radio({ selected, dark }: { selected: boolean; dark: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative shrink-0 h-5 w-5 rounded-full border-2 transition-colors",
        selected
          ? dark
            ? "border-white"
            : "border-foreground"
          : dark
            ? "border-white/40"
            : "border-foreground/30",
      )}
    >
      {selected && (
        <span
          className={cn(
            "absolute inset-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full",
            dark ? "bg-white" : "bg-foreground",
          )}
        />
      )}
    </span>
  );
}
