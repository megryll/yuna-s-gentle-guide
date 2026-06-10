import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/Badge";
import { DSPage, PropsBlock, Section, SurfaceMatrix, SurfacePair } from "@/ds-docs/surface";

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

      <Section
        title="Placement"
        subtitle="The pill is position-agnostic — only the className changes. Pin it to a card corner with absolute positioning (top-left, as the card 'New' flag, or top-right, as the Save 65% plan flag), or set it inline beside a title with shrink-0."
      >
        <SurfacePair
          align="start"
          renderRow={(surface) => {
            const tile =
              surface === "dark" ? "bg-white/10 border-white/15" : "bg-black/[0.05] border-black/10";
            const glyph = surface === "dark" ? "bg-white/10" : "bg-black/[0.05]";
            const ink = surface === "dark" ? "text-white" : "text-foreground";
            return (
              <div className="flex flex-col gap-8">
                {/* On a card — corner flag, top-left (the card 'New' flag) */}
                <div className="relative w-[200px]">
                  <Badge className="absolute z-10 -top-3 left-4">New</Badge>
                  <div className={"rounded-2xl border h-24 " + tile} />
                </div>
                {/* On a card — corner flag, top-right (the plan card uses) */}
                <div className="relative w-[200px]">
                  <Badge className="absolute z-10 -top-3 right-4">Save 65%</Badge>
                  <div className={"rounded-2xl border h-24 " + tile} />
                </div>
                {/* Inline — beside a title */}
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={"h-9 w-9 rounded-lg shrink-0 flex items-center justify-center " + glyph}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>🌱</span>
                  </span>
                  <span className={"text-sm " + ink}>A gentle breakthrough</span>
                  <Badge className="shrink-0">Nov 2025</Badge>
                </div>
              </div>
            );
          }}
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
