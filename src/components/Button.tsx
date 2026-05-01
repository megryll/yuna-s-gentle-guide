import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Yuna root Button.
 *
 * surface: which background the button sits on
 *   - "dark"  — photo / dark gradient screens (Welcome, Auth, Intro)
 *   - "light" — wireframe / light surface screens (Home, You, Activities)
 *
 * variant: fill style
 *   - "primary"   — strongest CTA (solid fill)
 *   - "secondary" — outlined, no fill
 *   - "ghost"     — no border or fill
 *
 * size: "md" (default CTA) | "sm" | "icon" (h-9) | "icon-sm" (h-8) | "icon-lg" (h-11)
 *
 * pressed (toggle): when true, button visually flips to the primary variant
 *   for the current surface, regardless of the `variant` prop. aria-pressed is
 *   set automatically. Use for mute/speaker/voice toggles.
 *
 * label (icon sizes only): renders a small text label below the icon circle.
 *   Use for stacked icon-stacks like the call-screen action bar.
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
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-11 w-11 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      surface: { dark: "", light: "" },
      variant: { primary: "", secondary: "", ghost: "" },
    },
    compoundVariants: [
      // ─── Dark surface (over photo / dark backgrounds) ────────────────────
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
        variant: "ghost",
        className:
          "text-white active:bg-white/15 focus-visible:ring-white/60",
      },
      // ─── Light surface (over wireframe / light backgrounds) ──────────────
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
          "border border-border text-foreground active:bg-accent focus-visible:ring-foreground/30",
      },
      {
        surface: "light",
        variant: "ghost",
        className:
          "text-foreground active:bg-accent focus-visible:ring-foreground/30",
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
  label?: string;
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
      label,
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
          <span className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
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
