import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/Badge";
import { DSPage, PropsBlock, Row, Section, SurfacePair } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/badge")({
  head: () => ({
    meta: [
      { title: "Design System — Badge" },
      {
        name: "description",
        content: "Tracked-uppercase pill flag — solid secondary-green fill.",
      },
    ],
  }),
  component: DSBadge,
});

function DSBadge() {
  return (
    <DSPage title="Badge">
      <Section
        title="Badge"
        subtitle="A small tracked-uppercase pill with a solid secondary-green fill and white text. Mode-stable — the green fill and white text hold on both photo surfaces, so it reads the same in light and dark."
      >
        <SurfacePair
          renderRow={() => (
            <Row>
              <Badge>New</Badge>
              <Badge>Nov 2025</Badge>
              <Badge>Beta</Badge>
            </Row>
          )}
        />
      </Section>

      <Section
        title="In context"
        subtitle="Pinned to a card corner via absolute positioning (the card's 'New' flag), or inline beside a title with shrink-0. The pill is identical either way — only the className changes."
      >
        <SurfacePair
          align="start"
          renderRow={(surface) => {
            const tile =
              surface === "dark"
                ? "bg-white/10 border-white/15"
                : "bg-black/[0.05] border-black/10";
            const glyph = surface === "dark" ? "bg-white/10" : "bg-black/[0.05]";
            const ink = surface === "dark" ? "text-white" : "text-foreground";
            return (
              <div className="flex flex-col gap-8">
                {/* On a card — corner flag */}
                <div className="relative w-[200px]">
                  <Badge className="absolute z-10 -top-3 left-4">New</Badge>
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
  className?: string   // positioning / layout only — e.g. "absolute -top-3 left-4"
                       // for a card-corner flag, or "shrink-0" inline next to a title
>{label}</Badge>

// Content is uppercased + letter-spaced by the component; pass natural casing.
`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
