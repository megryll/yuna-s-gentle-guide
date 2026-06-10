import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/Badge";
import { DSPage, PropsBlock, Section, SurfaceMatrix } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/badge")({
  head: () => ({
    meta: [
      { title: "Design System — Badge" },
      {
        name: "description",
        content: "Solid secondary-green flag — a tracked-uppercase pill or an icon-only circle.",
      },
    ],
  }),
  component: DSBadge,
});

function DSBadge() {
  return (
    <DSPage title="Badge">
      <Section title="Variants">
        <SurfaceMatrix
          rows={[
            { label: "Label", render: () => <Badge>New</Badge> },
            { label: "Icon", render: () => <Badge icon label="Complete" /> },
          ]}
        />
      </Section>

      <Section title="Sizes">
        <SurfaceMatrix
          rows={[
            { label: "sm", render: () => <Badge icon size="sm" label="Complete" /> },
            { label: "md", render: () => <Badge icon size="md" label="Complete" /> },
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Badge
  icon?:      ReactNode    // icon-only circular badge; \`true\` renders the default
                           //   check glyph, or pass a custom node. Omit children.
  size?:      "sm" | "md"  // icon-only sizing (18 / 28px); default "md"
  label?:     string       // accessible name for an icon-only badge
  className?: string       // positioning / layout only — e.g. "absolute -top-3
                           //   left-4" for a corner flag, or "shrink-0" inline
>{label}</Badge>

// Two shapes, both solid secondary-green + white: a tracked-uppercase pill
// (pass text as children) or an icon-only circle (pass icon, omit children).
// Pill content is uppercased + letter-spaced by the component.`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
