import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TileChoice } from "@/components/TileChoice";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/tile-choice")({
  head: () => ({
    meta: [
      { title: "Design System — Tile Choice" },
      {
        name: "description",
        content: "A 2-up grid of selectable tiles, each with a visual, title, and optional description.",
      },
    ],
  }),
  component: DSTileChoice,
});

const COMFORT = [
  { value: "arithmetic", label: "Arithmetic", visual: "➗", description: "Start from the basics." },
  { value: "algebra", label: "Algebra", visual: "📐", description: "Variables and equations." },
  { value: "graphs", label: "Graphs", visual: "📈", description: "Read and interpret graphs." },
  { value: "calculus", label: "Calculus", visual: "♾️", description: "Derivatives and integrals." },
];

const PLACES = [
  { value: "ocean", label: "Ocean", visual: "🌊" },
  { value: "forest", label: "Forest", visual: "🌲" },
  { value: "mountains", label: "Mountains", visual: "⛰️" },
  { value: "desert", label: "Desert", visual: "🏜️" },
];

function WithDescriptionDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState<string | null>("algebra");
  return (
    <TileChoice
      surface={surface}
      ariaLabel="Math comfort level"
      options={COMFORT}
      value={value}
      onChange={setValue}
    />
  );
}

function LabelOnlyDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState<string | null>("forest");
  return (
    <TileChoice
      surface={surface}
      ariaLabel="A place that draws you"
      options={PLACES}
      value={value}
      onChange={setValue}
    />
  );
}

function DisabledDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState<string | null>("ocean");
  return (
    <TileChoice
      surface={surface}
      ariaLabel="Disabled example"
      options={[
        { value: "ocean", label: "Available", visual: "🌊" },
        { value: "forest", label: "Unavailable", visual: "🌲", disabled: true },
      ]}
      value={value}
      onChange={setValue}
    />
  );
}

function DSTileChoice() {
  return (
    <DSPage title="Tile Choice">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<TileChoice
  options:    { value, label, visual?, description?, disabled? }[]
  value:      string | null
  onChange:   (value: string) => void
  surface?:   "dark" | "light"     // default "dark"
  animateIn?: boolean              // cascade tiles in on mount; default false
  ariaLabel:  string               // names the group
  className?: string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  { label: "With description", render: (s) => <WithDescriptionDemo surface={s} /> },
  { label: "Label only", render: (s) => <LabelOnlyDemo surface={s} /> },
];

const STATE_ROWS: MatrixRow[] = [
  { label: "Disabled tile", render: (s) => <DisabledDemo surface={s} /> },
];
