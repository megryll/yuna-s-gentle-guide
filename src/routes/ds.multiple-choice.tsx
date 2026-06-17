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

const PRIORITIES = ["Sleep", "Stress", "Focus"];

function NoneDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState<string[]>(["Sleep"]);
  return (
    <MultipleChoice
      surface={surface}
      multiple
      indicator="none"
      ariaLabel="Priorities in order"
      options={PRIORITIES.map((o) => {
        const rank = value.indexOf(o);
        return {
          value: o,
          label: o,
          trailing:
            rank >= 0 ? (
              <Badge
                size="sm"
                icon={<span className="text-[11px] font-bold leading-none">{rank + 1}</span>}
                label={`Priority ${rank + 1}`}
              />
            ) : undefined,
        };
      })}
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

function OtherDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState<string[]>(["custom"]);
  const [other, setOther] = useState("");
  return (
    <MultipleChoice
      surface={surface}
      multiple
      ariaLabel="What would you like support with?"
      otherValue={other}
      onOtherChange={setOther}
      options={[
        { value: "stress", label: "Stress", emoji: "😰" },
        { value: "sleep", label: "Sleep & Energy", emoji: "😴" },
        { value: "custom", label: "Something Else", other: true },
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
  options:    { value, label, emoji?, icon?, subtitle?, trailing?, disabled?, other? }[]
  value:      string | null        // single
  onChange:   (value: string) => void
  // — or, with multiple —
  multiple:   true
  value:      string[]
  onChange:   (value: string[]) => void

  indicator?: "check" | "none"     // default "check"; "none" = caller owns the
                                   // cue via trailing (e.g. priority numerals)
  otherValue?:       string        // open-ended option's text (option.other)
  onOtherChange?:    (v: string) => void
  otherPlaceholder?: string        // idle hint for the open-ended field
  surface?:   "dark" | "light"     // default "dark"
  ariaLabel:  string               // names the group
  className?: string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Single", render: (s) => <SingleDemo surface={s} /> },
  { label: "Multiple", render: (s) => <MultiDemo surface={s} /> },
  { label: "Indicator: none", render: (s) => <NoneDemo surface={s} /> },
  { label: "With detail", render: (s) => <DetailDemo surface={s} /> },
  { label: "Other (open-ended)", render: (s) => <OtherDemo surface={s} /> },
];

const STATE_ROWS: MatrixRow[] = [
  { label: "Disabled option", render: (s) => <DisabledDemo surface={s} /> },
];
