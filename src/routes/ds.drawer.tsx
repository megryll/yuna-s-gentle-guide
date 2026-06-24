import { createFileRoute } from "@tanstack/react-router";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { DSPage, Section, DevicePair, Bar, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/drawer")({
  head: () => ({
    meta: [
      { title: "Design System — Drawer" },
      { name: "description", content: "Bottom-sheet overlay on a photo background." },
    ],
  }),
  component: DSDrawer,
});

function DSDrawer() {
  return (
    <DSPage title="Drawer">
      {/* Real drawers, open inside simulated device frames so the slide-from-
          bottom position and dimmed scrim read in context on both modes. */}
      <Section
        title="Display"
        subtitle="Bottom sheet anchored to the screen's bottom edge (it slides up over a dimmed scrim in use). mode picks the photo + ink; the title is the one drawer-title size (text-3xl, Fraunces). Inside a device frame it stays edge-to-edge as shown; on a body-mounted responsive web screen it caps to ~28rem and centers as a floating card at md+."
      >
        <DevicePair
          renderRow={(surface) => (
            <Drawer open dismissible={false} modal={false}>
              <DrawerContent mode={surface}>
                <DrawerHeader className="text-left px-6 pt-3 pb-4">
                  {/* sr-only label keeps the a11y title without visible text */}
                  <DrawerTitle className="sr-only">Example drawer</DrawerTitle>
                  <Bar surface={surface} className="h-7 w-2/3" />
                </DrawerHeader>
                <div className="px-6 pb-2 flex flex-col gap-2.5">
                  <Bar surface={surface} className="h-3.5 w-full" />
                  <Bar surface={surface} className="h-3.5 w-4/5" />
                </div>
                <DrawerFooter className="px-6 pb-8">
                  <Bar surface={surface} className="h-12 w-full" />
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
        />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Drawer open onOpenChange>                 // root (vaul) — controls open state
  <DrawerContent mode?: "dark" | "light">  // sheet; mode → photo bg + ink (default: useAppMode())
    <DrawerHeader>                          // padded title block
      <DrawerTitle>…</DrawerTitle>          // the one drawer-title size — text-3xl, Fraunces, white-on-dark
      <DrawerDescription>…</DrawerDescription>   // optional, text-sm muted
    </DrawerHeader>
    …body…
    <DrawerFooter>…</DrawerFooter>          // optional, mt-auto action stack
  </DrawerContent>
</Drawer>

// Portals into the PhoneFrame container automatically; adds .overlay-on-dark in
// dark mode so bg tokens repoint to white-alpha. DrawerTrigger / DrawerClose are
// available for uncontrolled use.
//
// Responsive: in-frame → edge-to-edge bottom sheet. Body-mounted (web) → at md+
// it caps to max-w-md and centers as a floating card (mx-auto, bottom-4, fully
// rounded). Centered via auto margins, not translate-x, so vaul's drag/open
// transform isn't clobbered.`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
