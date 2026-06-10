import { createFileRoute } from "@tanstack/react-router";
import { ProgressBar } from "@/components/ProgressBar";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/progress-bar")({
  head: () => ({
    meta: [
      { title: "Design System — Progress Bar" },
      { name: "description", content: "A horizontal track with a left-to-right fill for determinate progress." },
    ],
  }),
  component: DSProgressBar,
});

function DSProgressBar() {
  return (
    <DSPage title="Progress Bar">
      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<ProgressBar
  value:        number              // progress fraction 0–1 (clamped)
  surface?:     "dark" | "light"    // default "dark"
  aria-label?:  string              // describes what's progressing
  className?:   string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const STATE_ROWS: MatrixRow[] = [
  { label: "Start", render: (s) => <ProgressBar surface={s} value={0.12} aria-label="12 percent" /> },
  { label: "Midway", render: (s) => <ProgressBar surface={s} value={0.5} aria-label="50 percent" /> },
  { label: "Complete", render: (s) => <ProgressBar surface={s} value={1} aria-label="Complete" /> },
];
