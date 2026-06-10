import { createFileRoute } from "@tanstack/react-router";
import { StepDots } from "@/components/StepDots";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/step-dots")({
  head: () => ({
    meta: [
      { title: "Design System — Step Dots" },
      { name: "description", content: "A row of dots marking position through a short, discrete sequence." },
    ],
  }),
  component: DSStepDots,
});

function DSStepDots() {
  return (
    <DSPage title="Step Dots">
      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<StepDots
  count:        number              // total number of steps
  current:      number              // active step index (0-based)
  surface?:     "dark" | "light"    // default "dark"
  aria-label?:  string
  className?:   string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const STATE_ROWS: MatrixRow[] = [
  { label: "First step", render: (s) => <StepDots surface={s} count={4} current={0} aria-label="Step 1 of 4" /> },
  { label: "Midway", render: (s) => <StepDots surface={s} count={4} current={2} aria-label="Step 3 of 4" /> },
  { label: "Last step", render: (s) => <StepDots surface={s} count={4} current={3} aria-label="Step 4 of 4" /> },
];
