import { useState } from "react";
import { Accordion, Surface } from "yuna-design-system";

// Accordion's chevron + press tint are authored white-on-dark, so the previews
// sit on the dark brand-green cluster. The component renders only the
// disclosure mechanics, so each cell wraps it in a frosted Surface for chrome.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6"
    >
      {children}
    </div>
  );
}

function Disclosure({ startOpen }: { startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <Surface surface="dark" radius="xl" className="overflow-hidden">
      <Accordion
        surface="dark"
        open={open}
        onOpenChange={setOpen}
        header={<span className="flex-1 text-base text-white/90">What grew this week</span>}
      >
        <p className="px-4 pb-3.5 text-sm leading-relaxed text-white/75">
          You leaned into trust as you shared what's been weighing on you. That
          takes real courage.
        </p>
      </Accordion>
    </Surface>
  );
}

export function Collapsed() {
  return (
    <Dark>
      <Disclosure startOpen={false} />
    </Dark>
  );
}

export function Expanded() {
  return (
    <Dark>
      <Disclosure startOpen />
    </Dark>
  );
}
