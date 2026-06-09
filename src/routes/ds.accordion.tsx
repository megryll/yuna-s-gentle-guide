import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Accordion } from "@/components/Accordion";
import { Surface } from "@/components/Surface";
import {
  DSPage,
  PropsBlock,
  Section,
  SurfaceMatrix,
  type MatrixRow,
} from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/accordion")({
  head: () => ({
    meta: [
      { title: "Design System — Accordion" },
      {
        name: "description",
        content: "Collapsible disclosure with an auto chevron and a smooth height animation.",
      },
    ],
  }),
  component: DSAccordion,
});

function DSAccordion() {
  return (
    <DSPage title="Accordion">
      <Section
        title="States"
        subtitle="A controlled disclosure: a trigger row with an auto chevron, and a body that eases open and closed via a grid-rows transition. Tap a row to toggle it."
      >
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Accordion
  open:          boolean
  onOpenChange:  (open: boolean) => void
  header:        ReactNode            // trigger content left of the chevron;
                                      // include a flex-1 element to fill the row
  surface?:      "dark" | "light"     // default "dark" — chevron + press tint
  triggerLabel?: string               // aria-label when header isn't plain text
  className?:    string
>{body}</Accordion>

// The body owns its own padding. Wrap the Accordion in your own card / Surface
// chrome — it renders only the trigger, chevron, and animated panel.
`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const STATE_ROWS: MatrixRow[] = [
  { label: "Collapsed", render: (s) => <AccordionDemo surface={s} startOpen={false} /> },
  { label: "Expanded", render: (s) => <AccordionDemo surface={s} startOpen /> },
];

function AccordionDemo({
  surface,
  startOpen = false,
}: {
  surface: "dark" | "light";
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const title = surface === "dark" ? "text-white/90" : "text-foreground/90";
  const body = surface === "dark" ? "text-white/75" : "text-foreground/75";
  return (
    <div className="w-full max-w-sm">
      <Surface surface={surface} radius="xl" className="overflow-hidden">
        <Accordion
          surface={surface}
          open={open}
          onOpenChange={setOpen}
          header={<span className={`flex-1 text-base ${title}`}>Trust</span>}
        >
          <p className={`px-4 pb-3.5 text-sm leading-relaxed ${body}`}>
            You leaned into this as you shared what's been weighing on you.
          </p>
        </Accordion>
      </Surface>
    </div>
  );
}
