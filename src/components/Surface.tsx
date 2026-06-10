import { type ElementType, type ReactNode } from "react";
import { useAppMode, type AppMode } from "@/lib/theme-prefs";
import { cn } from "@/lib/utils";

const RADIUS = {
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
} as const;

type SurfaceProps = {
  /** Element tag to render. Defaults to "div". */
  as?: ElementType;
  /** Photo cluster the panel sits on. Defaults to the app's current mode, so a
   *  themed screen can omit it and the panel follows the Light/Dark toggle.
   *  Pass explicitly (e.g. on a DS page) to force one surface. */
  surface?: AppMode;
  /** Corner radius. Defaults to "2xl". */
  radius?: keyof typeof RADIUS;
  /** Hairline border. Defaults to true — keeps the panel defined on Android,
   *  where backdrop blur is dropped. */
  border?: boolean;
  /** Empty-state treatment: dashed border + fainter fill, for placeholder
   *  panels that hold space before content exists (e.g. "nothing saved yet").
   *  Implies a border, so `border` is ignored when set. Defaults to false. */
  dashed?: boolean;
  /** Frosted backdrop blur. Defaults to true. */
  blur?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * Frosted glass panel — the translucent, hairline-bordered surface used for
 * hero keepsakes, stat tiles, reflection cards, and collapsible rows on the
 * photo cluster. Fill + border are chosen per `surface` (white-alpha on the
 * dark photo, ink-alpha on the light photo) so it reads in both app modes
 * without relying on the `.theme-light` shim, which doesn't remap arbitrary
 * alphas. Layout (padding, flex, gap) comes from the caller via `className` —
 * Surface owns only the shell.
 */
export function Surface({
  as: Tag = "div",
  surface,
  radius = "2xl",
  border = true,
  dashed = false,
  blur = true,
  className,
  children,
}: SurfaceProps) {
  const appMode = useAppMode();
  const isLight = (surface ?? appMode) === "light";

  const shell = isLight
    ? [
        dashed ? "bg-[rgba(20,20,22,0.03)]" : "bg-[rgba(20,20,22,0.05)]",
        dashed
          ? "border border-dashed border-[rgba(20,20,22,0.18)]"
          : border && "border border-[rgba(20,20,22,0.15)]",
      ]
    : [
        dashed ? "bg-white/[0.04]" : "bg-white/[0.08]",
        dashed ? "border border-dashed border-white/25" : border && "border border-white/15",
      ];

  return (
    <Tag className={cn(RADIUS[radius], shell, blur && "backdrop-blur-md", className)}>
      {children}
    </Tag>
  );
}
