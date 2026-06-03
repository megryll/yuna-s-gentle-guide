import { createFileRoute } from "@tanstack/react-router";
import { CheckBadge } from "@/components/CheckBadge";
import { DSPage, Section, SurfaceMatrix, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/check-badge")({
  head: () => ({
    meta: [
      { title: "Design System — Check Badge" },
      { name: "description", content: "Filled green circle with a white check." },
    ],
  }),
  component: DSCheckBadge,
});

function DSCheckBadge() {
  return (
    <DSPage title="Check badge">
      <Section title="Sizes">
        <SurfaceMatrix
          rows={[
            { label: "sm", render: () => <CheckBadge size="sm" /> },
            { label: "md", render: () => <CheckBadge size="md" /> },
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<CheckBadge
  size?:  "sm" | "md"   // 18px | 28px, default "md"
  label?: string        // accessible name; omit to keep it decorative (aria-hidden)
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
