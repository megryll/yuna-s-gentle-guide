import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Tooltip, type TooltipArrowSide } from "@/components/Tooltip";
import { cn } from "@/lib/utils";
import { modeImage } from "@/lib/theme-prefs";
import { DSPage, Section, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/tooltip")({
  head: () => ({
    meta: [
      { title: "Design System — Tooltip" },
      {
        name: "description",
        content: "A small opaque popover anchored to a trigger, with a pointer toward it.",
      },
    ],
  }),
  component: DSTooltip,
});

// A photo cell big enough to contain a floating tooltip, on either surface.
// Light wraps in `.theme-light` so the white-on-dark panel inverts the way it
// does inside PhoneFrame.
function Cell({ surface, children }: { surface: "dark" | "light"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative h-[180px] rounded-2xl overflow-hidden border border-border bg-cover bg-center",
        surface === "light" && "theme-light",
      )}
      style={{ backgroundImage: `url(${modeImage(surface)})` }}
    >
      <p
        className={cn(
          "absolute left-4 top-3 text-[11px] tracking-[0.25em] uppercase",
          surface === "dark" ? "text-white/65" : "text-foreground/65",
        )}
      >
        {surface === "dark" ? "Dark" : "Light"}
      </p>
      {children}
    </div>
  );
}

// A faux trigger chip the tooltip points at.
function Trigger({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute rounded-full px-3 py-1.5 text-xs font-medium bg-white/15 border border-white/20 text-white",
        className,
      )}
    >
      Trigger
    </span>
  );
}

const SAMPLE = <p className="text-sm leading-snug text-white">Two lines of tooltip copy sit here.</p>;

// Each placement: where the trigger sits, where the panel sits, and which edge
// the pointer hugs (a panel below its trigger points "top").
const PLACEMENTS: {
  label: string;
  trigger: string;
  panel: string;
  arrow: { side: TooltipArrowSide; offset?: string };
}[] = [
  {
    label: "Below · pointer top-center",
    trigger: "top-12 left-1/2 -translate-x-1/2",
    panel: "top-[84px] left-1/2 -translate-x-1/2 w-[200px]",
    arrow: { side: "top" },
  },
  {
    label: "Below · pointer top-left",
    trigger: "top-12 left-5",
    panel: "top-[84px] left-4 w-[200px]",
    arrow: { side: "top", offset: "left-6" },
  },
  {
    label: "Below · pointer top-right",
    trigger: "top-12 right-5",
    panel: "top-[84px] right-4 w-[200px]",
    arrow: { side: "top", offset: "right-6" },
  },
  {
    label: "Above · pointer bottom-center",
    trigger: "bottom-12 left-1/2 -translate-x-1/2",
    panel: "bottom-[84px] left-1/2 -translate-x-1/2 w-[200px]",
    arrow: { side: "bottom" },
  },
  {
    label: "Right · pointer left-center",
    trigger: "top-1/2 -translate-y-1/2 left-4",
    panel: "top-1/2 -translate-y-1/2 left-[110px] w-[170px]",
    arrow: { side: "left" },
  },
  {
    label: "Left · pointer right-center",
    trigger: "top-1/2 -translate-y-1/2 right-4",
    panel: "top-1/2 -translate-y-1/2 right-[110px] w-[170px]",
    arrow: { side: "right" },
  },
];

function DSTooltip() {
  return (
    <DSPage title="Tooltip">
      <Section title="Variants">
        <div className="flex flex-col gap-8">
          {PLACEMENTS.map((p) => (
            <div key={p.label}>
              <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
                {p.label}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(["dark", "light"] as const).map((s) => (
                  <Cell key={s} surface={s}>
                    <Trigger className={p.trigger} />
                    <Tooltip open mode={s} arrow={p.arrow} className={p.panel}>
                      {SAMPLE}
                    </Tooltip>
                  </Cell>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Tooltip
  open:       boolean                       // whether the panel is shown
  onClose?:   () => void                    // tap-away backdrop; omit for none
  arrow?:     {                             // pointer toward the trigger; omit for none
    side:     "top" | "bottom" | "left" | "right"   // panel edge the pointer hugs
    offset?:  string                        // Tailwind position along that edge (default centered)
  }
  mode?:      "dark" | "light"              // opaque popover surface (default: live app mode)
  className?: string                        // absolute placement + width of the panel
  style?:     CSSProperties
  children:   ReactNode                     // panel content
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
