import { createFileRoute } from "@tanstack/react-router";
import { Divider } from "@/components/Divider";
import { DSPage, Section, SurfaceMatrix, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/divider")({
  head: () => ({
    meta: [
      { title: "Design System — Divider" },
      { name: "description", content: "Hairline rule, optionally with a centered label." },
    ],
  }),
  component: DSDivider,
});

function DSDivider() {
  return (
    <DSPage title="Divider">
      <Section title="Variants">
        <SurfaceMatrix
          rows={[
            { label: "Plain", render: (surface) => <Divider surface={surface} /> },
            { label: "Labeled", render: (surface) => <Divider surface={surface} label="or" /> },
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Divider
  surface?: "dark" | "light"   // default: "light"
  label?:   string             // centered caption, e.g. "or"; omit for a plain rule
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
