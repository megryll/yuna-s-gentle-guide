import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MultipleChoice } from "@/components/MultipleChoice";
import { Badge } from "@/components/Badge";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/multiple-choice")({
  head: () => ({
    meta: [
      { title: "Design System — Multiple Choice" },
      { name: "description", content: "A group of selectable option rows with single- or multi-select semantics." },
    ],
  }),
  component: DSMultipleChoice,
});

const FORMAT = [
  { value: "In Person", label: "In Person", emoji: "🛋️" },
  { value: "Online", label: "Online", emoji: "💻" },
  { value: "Either", label: "Either", emoji: "✨" },
];

const IDENTITY = [
  { value: "LGBTQ+ affirming", label: "LGBTQ+ affirming", emoji: "🏳️‍🌈" },
  { value: "Culturally sensitive", label: "Culturally sensitive", emoji: "🌍" },
  { value: "Faith-informed", label: "Faith-informed", emoji: "🙏" },
];

function SingleDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState<string | null>("Online");
  return (
    <MultipleChoice
      surface={surface}
      ariaLabel="Session format"
      options={FORMAT}
      value={value}
      onChange={setValue}
    />
  );
}

function SingleCheckDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState<string | null>("Online");
  return (
    <MultipleChoice
      surface={surface}
      ariaLabel="Session format"
      indicator="check"
      options={FORMAT}
      value={value}
      onChange={setValue}
    />
  );
}

function MultiDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState<string[]>(["LGBTQ+ affirming"]);
  return (
    <MultipleChoice
      surface={surface}
      multiple
      ariaLabel="Identity and background"
      options={IDENTITY}
      value={value}
      onChange={setValue}
    />
  );
}

function DetailDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState<string | null>("intro");
  return (
    <MultipleChoice
      surface={surface}
      ariaLabel="Session type"
      options={[
        { value: "intro", label: "Free intro call", subtitle: "A quick conversation to see if you're a fit.", trailing: <Badge>15 min</Badge> },
        { value: "session", label: "First full session", subtitle: "A full intake session to begin working together.", trailing: <Badge>50 min</Badge> },
      ]}
      value={value}
      onChange={setValue}
    />
  );
}

function DisabledDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState<string | null>("a");
  return (
    <MultipleChoice
      surface={surface}
      ariaLabel="Disabled example"
      options={[
        { value: "a", label: "Available option" },
        { value: "b", label: "Unavailable option", disabled: true },
      ]}
      value={value}
      onChange={setValue}
    />
  );
}

function DSMultipleChoice() {
  return (
    <DSPage title="Multiple Choice">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<MultipleChoice
  options:    { value, label, emoji?, icon?, subtitle?, trailing?, disabled? }[]
  value:      string | null        // single
  onChange:   (value: string) => void
  // — or, with multiple —
  multiple:   true
  value:      string[]
  onChange:   (value: string[]) => void

  indicator?: "radio" | "check"    // default radio (single) / check (multiple)
  surface?:   "dark" | "light"     // default "dark"
  ariaLabel:  string               // names the group
  className?: string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Single, radio", render: (s) => <SingleDemo surface={s} /> },
  { label: "Single, check", render: (s) => <SingleCheckDemo surface={s} /> },
  { label: "Multiple", render: (s) => <MultiDemo surface={s} /> },
  { label: "With detail", render: (s) => <DetailDemo surface={s} /> },
];

const STATE_ROWS: MatrixRow[] = [
  { label: "Disabled option", render: (s) => <DisabledDemo surface={s} /> },
];
