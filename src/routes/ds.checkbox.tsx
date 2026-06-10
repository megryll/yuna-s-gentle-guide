import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Checkbox } from "@/components/Checkbox";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/checkbox")({
  head: () => ({
    meta: [
      { title: "Design System — Checkbox" },
      { name: "description", content: "A single boolean toggle — a circular check control with an optional label." },
    ],
  }),
  component: DSCheckbox,
});

function LabeledDemo({ surface }: { surface: "dark" | "light" }) {
  const [checked, setChecked] = useState(true);
  return (
    <Checkbox
      surface={surface}
      checked={checked}
      onChange={setChecked}
      label="I understand this action can not be undone"
    />
  );
}

function BareDemo({ surface }: { surface: "dark" | "light" }) {
  const [checked, setChecked] = useState(false);
  return (
    <Checkbox surface={surface} checked={checked} onChange={setChecked} aria-label="Opt in" />
  );
}

function UncheckedDemo({ surface }: { surface: "dark" | "light" }) {
  const [checked, setChecked] = useState(false);
  return <Checkbox surface={surface} checked={checked} onChange={setChecked} label="Email me product updates" />;
}

function CheckedDemo({ surface }: { surface: "dark" | "light" }) {
  const [checked, setChecked] = useState(true);
  return <Checkbox surface={surface} checked={checked} onChange={setChecked} label="Email me product updates" />;
}

function DisabledDemo({ surface }: { surface: "dark" | "light" }) {
  return (
    <Checkbox surface={surface} checked disabled onChange={() => undefined} label="Locked preference" />
  );
}

function DSCheckbox() {
  return (
    <DSPage title="Checkbox">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Checkbox
  checked:   boolean
  onChange:  (checked: boolean) => void
  label?:    ReactNode            // inline copy; omit + pass aria-label for a bare box
  surface?:  "dark" | "light"     // default "dark"
  disabled?: boolean
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Labeled", render: (s) => <LabeledDemo surface={s} /> },
  { label: "Bare", render: (s) => <BareDemo surface={s} /> },
];

const STATE_ROWS: MatrixRow[] = [
  { label: "Unchecked", render: (s) => <UncheckedDemo surface={s} /> },
  { label: "Checked", render: (s) => <CheckedDemo surface={s} /> },
  { label: "Disabled", render: (s) => <DisabledDemo surface={s} /> },
];
