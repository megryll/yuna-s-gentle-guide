import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";
import { usePhoneFrameContainer } from "@/components/PhoneFrame";
import { modeImage, useAppMode, type AppMode } from "@/lib/theme-prefs";

const Drawer = ({
  shouldScaleBackground = false,
  container,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => {
  // Tell vaul the drawer lives inside the phone frame, not <body>. Without this
  // the Root reports `data-vaul-custom-container=false` and vaul paints a 200%-
  // tall ::after below the sheet (its overscroll bleed for body-mounted, fixed
  // sheets) — which, since our DrawerContent carries a background image, renders
  // as a slab of photo filling the frame under a short sheet. The Portal already
  // mounts here; the Root has to agree so the bleed is suppressed.
  const phoneContainer = usePhoneFrameContainer();
  return (
    <DrawerPrimitive.Root
      shouldScaleBackground={shouldScaleBackground}
      container={container ?? phoneContainer ?? undefined}
      {...props}
    />
  );
};
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = ({
  container,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) => {
  const phoneContainer = usePhoneFrameContainer();
  return (
    <DrawerPrimitive.Portal container={container ?? phoneContainer ?? undefined} {...props} />
  );
};

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const inFrame = !!usePhoneFrameContainer();
  return (
    <DrawerPrimitive.Overlay
      ref={ref}
      className={cn(
        (inFrame ? "absolute" : "fixed") + " inset-0 z-50 bg-foreground/40",
        className,
      )}
      {...props}
    />
  );
});
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    mode?: AppMode;
  }
>(({ className, children, mode: modeProp, style, ...props }, ref) => {
  const inFrame = !!usePhoneFrameContainer();
  const pos = inFrame ? "absolute" : "fixed";
  const appMode = useAppMode();
  const mode = modeProp ?? appMode;
  // Body-mounted (responsive web) drawers: at md+ a full-width bottom band
  // reads as an awkward slab, so cap the width and center it into a floating
  // card lifted off the bottom edge. Keeps `left/right:0` and centers via auto
  // margins — NOT translate-x — because vaul drives the open/drag animation
  // through an inline `transform`, which would clobber a translate-based
  // centering. Phone-frame drawers (DS page, un-migrated screens) keep the
  // edge-to-edge sheet untouched.
  // `md:[&::after]:hidden` kills vaul's overscroll bleed — the ::after it paints
  // below the sheet (the slab the in-frame `container` prop otherwise
  // suppresses). With the lifted `bottom-4` float, its top sliver would
  // otherwise peek through the gap as a thin bar under the card.
  const desktopCard = inFrame
    ? ""
    : "md:mx-auto md:max-w-md md:bottom-4 md:rounded-b-[1.5rem] md:[&::after]:hidden";
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        style={{
          backgroundImage: `url(${modeImage(mode)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          // Callers may pass layout style (e.g. a keyboard-driven offset); merge
          // it in rather than letting the spread clobber the background above.
          ...style,
        }}
        className={cn(
          pos +
            " inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[1.5rem] border text-popover-foreground",
          desktopCard,
          mode === "dark" && "overlay-on-dark",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

// Drawer titles are the one drawer-title size in the DS scale: text-3xl (30px),
// Fraunces, authored white-on-dark so `.theme-light` inverts for light mode
// (CLAUDE.md rule 6). Don't re-specify size / family / weight / color at call
// sites — pass only layout extras (e.g. mt-6) through `className`.
const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("font-display font-normal text-3xl tracking-tight text-white", className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
