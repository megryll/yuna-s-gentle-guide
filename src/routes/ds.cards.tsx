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
      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Card
  tone:       "dark" | "light"   // content tone (dark = white text)
  naturePath: string             // background photo (tinted per surface)
  isNew?:     boolean            // green "New" flag, top-left
  surface?:   "dark" | "light"   // tint cluster; default useAppMode()
>
  <CardHeader
    meta:     { label, emoji, tone }
    cadence?: "Daily"            // appends a "• Daily" tag
    eyebrow?: string             // overrides meta.label
    leading?: ReactNode          // overrides the emoji (e.g. an avatar)
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

// Content is authored white-on-dark and inverts for the light cluster via the
// global .theme-light shim; only the tint + ring follow surface. The save /
// share / More glyphs are <Button variant="plain"> (naked icon).`}</PropsBlock>
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

const STATE_ROWS: MatrixRow[] = [
  { label: "Default", render: (s) => withCluster(s, <DemoCard surface={s} />) },
  { label: "New", render: (s) => withCluster(s, <DemoCard surface={s} isNew />) },
];

function DemoCard({
  surface,
  isNew,
}: {
  surface: "dark" | "light";
  isNew?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="max-w-[300px]">
      <Card surface={surface} tone="dark" naturePath={NATURE} isNew={isNew}>
        <CardHeader meta={{ label: "Meditation", emoji: "🧘", tone: "dark" }} cadence="Daily" />
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
