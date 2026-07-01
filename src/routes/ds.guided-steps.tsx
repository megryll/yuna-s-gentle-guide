import { createFileRoute } from "@tanstack/react-router";
import { GuidedSteps } from "@/components/GuidedSteps";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/guided-steps")({
  head: () => ({
    meta: [
      { title: "Design System — Guided Steps" },
      {
        name: "description",
        content: "A read-only vertical checklist marking progress through a short, ordered sequence.",
      },
    ],
  }),
  component: DSGuidedSteps,
});

const STEPS = [
  "Learn the target skill",
  "Make a plan for practice",
  "Guided session complete",
];

function DSGuidedSteps() {
  return (
    <DSPage title="Guided Steps">
      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<GuidedSteps
  steps:      string[]            // step labels, top to bottom
  completed:  number              // how many leading steps are done (0..steps.length)
  surface?:   "dark" | "light"    // default "dark"
  className?: string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const STATE_ROWS: MatrixRow[] = [
  { label: "None complete", render: (s) => <GuidedSteps surface={s} steps={STEPS} completed={0} /> },
  { label: "In progress", render: (s) => <GuidedSteps surface={s} steps={STEPS} completed={1} /> },
  { label: "All complete", render: (s) => <GuidedSteps surface={s} steps={STEPS} completed={3} /> },
];
