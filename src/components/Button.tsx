import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Root Button.
 *
 * surface: which background the button sits on
 *   - "dark"  — dark or photo backgrounds
 *   - "light" — light backgrounds
 *
 * variant: fill style
 *   - "primary"   — strongest CTA (solid fill)
 *   - "secondary" — outlined, no fill
 *   - "plain"     — naked icon glyph: no border, no fill, no active-bg box
 *                   (presses via opacity only). For inline icon affordances
 *                   like a card's More / bookmark / share. Pair with an icon
 *                   size; pressed flips it to the filled primary look.
 *   - "card"      — full-width rounded-2xl bordered block with a title
 *                   (children, text-base semibold — kept to one line),
 *                   optional `subtitle`, and optional `trailing` element
 *                   (e.g. a chevron). The list-row "card-as-button".
 *                   Ignores `size` — it's always a full-width block.
 *   - "link"      — inline text link, no border/fill/padding. For footer
 *                   actions (Referral Code, Login, Forgot password).
 *
 * size: "md" (default) | "sm" | "xs" (h-[26px], inline chip)
 *   icon sizes also fix the glyph size (half the box) so callers never set it:
 *   "icon-sm" (h-8, 16px glyph) | "icon" (h-9, 18px glyph) | "icon-lg" (h-11, 22px glyph)
 *
 * pressed (toggle): when true, button visually flips to the primary variant
 *   for the current surface, regardless of the `variant` prop. aria-pressed
 *   is set automatically.
 *
 * label (icon sizes only): renders a small text caption below the icon circle.
 * subtitle (card variant only): secondary line under the title.
 * trailing (card variant only): node rendered at the row's trailing edge.
 * selected (card variant only): selected/checked state for a list-row choice —
 *   adds a filled highlight + an auto checkmark (unless `trailing` is set) and
 *   sets aria-pressed.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap select-none " +
    "transition-[opacity,background-color,transform] duration-100 ease-out " +
    "active:scale-[0.98] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 " +
    "disabled:opacity-50 disabled:pointer-events-none " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        md: "px-6 py-3.5 text-sm tracking-wide",
        sm: "px-4 py-2 text-xs tracking-wide",
        xs: "h-[26px] px-3 text-xs",
        icon: "h-9 w-9 p-0 [&_svg]:size-[18px]",
        "icon-sm": "h-8 w-8 p-0 [&_svg]:size-4",
        "icon-lg": "h-11 w-11 p-0 [&_svg]:size-[22px]",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      surface: { dark: "", light: "" },
      variant: { primary: "", secondary: "", plain: "", card: "", link: "" },
    },
    compoundVariants: [
      // ─── Dark surface ────────────────────────────────────────────────────
      {
        surface: "dark",
        variant: "primary",
        className:
          "bg-white text-neutral-900 active:opacity-80 focus-visible:ring-white/60",
      },
      {
        surface: "dark",
        variant: "secondary",
        className:
          "border border-white/40 text-white active:bg-white/15 focus-visible:ring-white/60",
      },
      {
        surface: "dark",
        variant: "plain",
        className: "text-white active:opacity-60 focus-visible:ring-white/60",
      },
      // ─── Light surface ───────────────────────────────────────────────────
      {
        surface: "light",
        variant: "primary",
        className:
          "bg-foreground text-background active:opacity-80 focus-visible:ring-foreground/40",
      },
      {
        surface: "light",
        variant: "secondary",
        className:
          "border border-border text-foreground active:bg-foreground/8 focus-visible:ring-foreground/30",
      },
      {
        surface: "light",
        variant: "plain",
        className: "text-foreground active:opacity-60 focus-visible:ring-foreground/30",
      },
    ],
    defaultVariants: {
      size: "md",
      fullWidth: false,
      surface: "light",
      variant: "primary",
    },
  },
);

type IconSize = "icon" | "icon-sm" | "icon-lg";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  pressed?: boolean;
  selected?: boolean;
  label?: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}

const ICON_SIZES: ReadonlySet<IconSize> = new Set(["icon", "icon-sm", "icon-lg"]);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      surface,
      variant,
      size,
      fullWidth,
      pressed,
      selected,
      label,
      subtitle,
      trailing,
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const effectiveVariant = pressed ? "primary" : variant;
    const ariaPressed =
      pressed !== undefined ? pressed : props["aria-pressed"];
    const isIcon = ICON_SIZES.has(size as IconSize);

    // Card — full-width list-row "card-as-button": title + optional subtitle +
    // optional trailing element. Authored in white-on-dark vocabulary so
    // `.theme-light` inverts it for light mode automatically.
    if (variant === "card") {
      const isSelected = !!selected;
      const showCheck = isSelected && !trailing;
      return (
        <Comp
          className={cn(
            "w-full rounded-2xl border px-5 py-4 flex items-center gap-3 text-left",
            "transition-[transform,background-color,border-color] duration-100 ease-out active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
            "disabled:opacity-50 disabled:pointer-events-none",
            surface === "dark"
              ? isSelected
                ? "border-white bg-white/10 text-white active:bg-white/10 focus-visible:ring-white/60"
                : "border-white/40 text-white active:bg-white/10 focus-visible:ring-white/60"
              : isSelected
                ? "border-foreground/40 bg-foreground/5 text-foreground active:bg-foreground/8 focus-visible:ring-foreground/30"
                : "border-border text-foreground active:bg-foreground/8 focus-visible:ring-foreground/30",
            className,
          )}
          ref={ref}
          aria-pressed={selected !== undefined ? isSelected : ariaPressed}
          {...props}
        >
          <span className="flex-1 min-w-0">
            <span className="block text-base font-semibold leading-tight">{children}</span>
            {subtitle && (
              <span
                className={cn(
                  "block text-sm mt-1",
                  surface === "dark" ? "text-white/70" : "text-muted-foreground",
                )}
              >
                {subtitle}
              </span>
            )}
          </span>
          {(trailing || showCheck) && (
            <span
              className={cn(
                "shrink-0",
                showCheck
                  ? surface === "dark"
                    ? "text-white"
                    : "text-foreground"
                  : surface === "dark"
                    ? "text-white/60"
                    : "text-foreground/55",
              )}
            >
              {trailing ?? <Check size={20} strokeWidth={2} aria-hidden />}
            </span>
          )}
        </Comp>
      );
    }

    // Link — inline text action, no border/fill/padding.
    if (variant === "link") {
      return (
        <Comp
          className={cn(
            "inline-flex items-center gap-1 select-none bg-transparent p-0 text-sm",
            "transition-opacity duration-100 ease-out active:opacity-70",
            "focus-visible:outline-none focus-visible:underline underline-offset-4",
            "disabled:opacity-50 disabled:pointer-events-none",
            surface === "dark" ? "text-white/85" : "text-foreground/85",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    if (label && isIcon) {
      return (
        <Comp
          className={cn(
            "inline-flex flex-col items-center gap-2 select-none",
            "transition-transform duration-100 ease-out active:scale-[0.97]",
            "disabled:opacity-50 disabled:pointer-events-none",
            "focus-visible:outline-none",
            className,
          )}
          ref={ref}
          aria-pressed={ariaPressed}
          {...props}
        >
          <span
            className={cn(
              buttonVariants({ surface, variant: effectiveVariant, size, fullWidth: false }),
              // Reset transitions/scale on the inner span — outer drives press feedback.
              "active:scale-100",
            )}
          >
            {children}
          </span>
          <span
            className={cn(
              "text-uppercase tracking-[0.2em] uppercase",
              surface === "dark" ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(
          buttonVariants({ surface, variant: effectiveVariant, size, fullWidth }),
          className,
        )}
        ref={ref}
        aria-pressed={ariaPressed}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
