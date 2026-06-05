import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardCTA, CardFooter, CardHeader } from "@/components/Card";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/cards")({
  head: () => ({
    meta: [
      { title: "Design System — Cards" },
      { name: "description", content: "Photo-tinted content tile with header, body, and footer." },
    ],
  }),
  component: DSCards,
});

function DSCards() {
  return (
    <DSPage title="Cards">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Card
  tone:       "dark" | "light"   // content tone (dark = white text)
  naturePath: string             // background photo (always dark-washed)
  solidFill?: string             // flat fill instead of photo
  isNew?:     boolean            // green "New" flag, top-left
>
  <CardHeader
    meta:     { label, tone }
    cadence?: "Daily"            // appends a "• Daily" tag
    eyebrow?: string             // overrides meta.label
    leading?: ReactNode          // leading glyph (e.g. an avatar)
  />
  …body (caller-owned, centered)…
  <CardFooter
    primary:       ReactNode      // the CTA (e.g. <CardCTA>)
    meta?:         string         // trailing meta text (e.g. a duration)
    isSaved?:      boolean
    onToggleSave?: () => void     // renders the bookmark toggle
    tone?:         "dark" | "light"
  />
</Card>

<CardCTA tone onClick>{label}</CardCTA>   // uppercase-tracked secondary button

// A card's look is FIXED across the app's light/dark toggle. Photo cards always
// use the dark cluster (black wash + white ink). Solid cards carry a fixed
// fill: pair a pale fill with tone "light" (dark ink) or a deep fill with tone
// "dark" (white ink). Any dark-toned card keeps its white ink against the
// .theme-light shim; the save / share / More glyphs are <Button variant="plain">.`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const NATURE = "/nature/Background-1.png";

// Light cluster content inverts via .theme-light (as on Home in light mode);
// the matrix panels don't add it, so wrap the light render to match.
function withCluster(surface: "dark" | "light", node: React.ReactNode) {
  return <div className={surface === "light" ? "theme-light" : ""}>{node}</div>;
}

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Photo", render: (s) => withCluster(s, <DemoCard />) },
  {
    label: "Solid (light)",
    render: (s) => withCluster(s, <DemoSolidCard tone="light" fill="#B4C6D6" />),
  },
  {
    label: "Solid (dark)",
    render: (s) => withCluster(s, <DemoSolidCard tone="dark" fill="#2C5C3D" />),
  },
];

const STATE_ROWS: MatrixRow[] = [
  { label: "Default", render: (s) => withCluster(s, <DemoCard />) },
  { label: "New", render: (s) => withCluster(s, <DemoCard isNew />) },
];

function DemoCard({ isNew }: { isNew?: boolean }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="max-w-[300px]">
      <Card tone="dark" naturePath={NATURE} isNew={isNew}>
        <CardHeader meta={{ label: "Meditation", tone: "dark" }} cadence="Daily" />
        <div className="flex-1 flex items-center justify-center px-6 pt-9">
          <h3 className="font-display text-[22px] leading-[1.75] tracking-tight text-white text-center">
            A Five-Minute Midday Reset
          </h3>
        </div>
        <CardFooter
          isSaved={saved}
          onToggleSave={() => setSaved((v) => !v)}
          primary={
            <CardCTA tone="dark" onClick={() => {}}>
              Try this
            </CardCTA>
          }
        />
      </Card>
    </div>
  );
}

function DemoSolidCard({
  tone,
  fill,
}: {
  tone: "dark" | "light";
  fill: string;
}) {
  const [saved, setSaved] = useState(false);
  const isDark = tone === "dark";
  return (
    <div className="max-w-[300px]">
      <Card tone={tone} solidFill={fill}>
        <CardHeader meta={{ label: "Recommended Skill", tone }} />
        <div className="flex-1 flex items-center justify-center px-6 pt-9">
          <h3
            className={
              "font-display text-[22px] leading-[1.75] tracking-tight text-center " +
              (isDark ? "text-white" : "text-foreground")
            }
          >
            The Non-Judgemental Skill
          </h3>
        </div>
        <CardFooter
          tone={tone}
          isSaved={saved}
          onToggleSave={() => setSaved((v) => !v)}
          primary={
            <CardCTA tone={tone} onClick={() => {}}>
              Learn this
            </CardCTA>
          }
        />
      </Card>
    </div>
  );
}
