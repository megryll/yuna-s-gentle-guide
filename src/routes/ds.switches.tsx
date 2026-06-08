import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Switch } from "@/components/Switch";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/switches")({
  head: () => ({
    meta: [
      { title: "Design System — Switches" },
      { name: "description", content: "iOS-style on/off toggle." },
    ],
  }),
  component: DSSwitches,
});

function DSSwitches() {
  return (
    <DSPage title="Switches">
      <Section
        title="Variants"
        subtitle="On its own, paired with a label, or inside a settings row. The label is optional — when present, wrap the control in a <label> so the text is part of the tap target."
      >
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Switch
  checked:  boolean
  onChange: (next: boolean) => void
  label?:   string                // sets aria-label
  disabled?: boolean
  ...native button props (Switch renders <button role="switch" />)
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

// ─── Interactive demos ──────────────────────────────────────────────────────

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Standalone", render: () => <StateSwitch initial label="Daily reminders" /> },
  { label: "With label", render: (s) => <SwitchWithLabel surface={s} /> },
  { label: "Settings row", render: (s) => <SwitchRow surface={s} /> },
];

const STATE_ROWS: MatrixRow[] = [
  { label: "On", render: () => <StateSwitch initial label="On example" /> },
  { label: "Off", render: () => <StateSwitch initial={false} label="Off example" /> },
  { label: "Disabled", render: () => <StateSwitch initial disabled label="Disabled example" /> },
];

function StateSwitch({
  initial,
  disabled,
  label,
}: {
  initial: boolean;
  disabled?: boolean;
  label: string;
}) {
  const [on, setOn] = useState(initial);
  return (
    <Switch
      checked={disabled ? initial : on}
      onChange={disabled ? () => {} : setOn}
      disabled={disabled}
      label={label}
    />
  );
}

function SwitchWithLabel({ surface }: { surface: "dark" | "light" }) {
  const [on, setOn] = useState(true);
  const labelClass =
    surface === "dark" ? "text-white" : "text-foreground";
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <Switch checked={on} onChange={setOn} label="Daily reminders" />
      <span className={`text-[15px] ${labelClass}`}>Daily reminders</span>
    </label>
  );
}

function SwitchRow({ surface }: { surface: "dark" | "light" }) {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const labelClass =
    surface === "dark" ? "text-white" : "text-foreground";
  const subClass =
    surface === "dark" ? "text-white/65" : "text-foreground/65";
  const rowBorder =
    surface === "dark" ? "border-white/12" : "border-foreground/10";
  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className={`flex items-center justify-between py-3 border-b ${rowBorder}`}>
        <div className="flex flex-col">
          <span className={`text-[15px] ${labelClass}`}>Daily reminders</span>
          <span className={`text-xs mt-0.5 ${subClass}`}>9:00 AM</span>
        </div>
        <Switch checked={a} onChange={setA} label="Daily reminders" />
      </div>
      <div className="flex items-center justify-between py-3">
        <div className="flex flex-col">
          <span className={`text-[15px] ${labelClass}`}>Voice replies</span>
          <span className={`text-xs mt-0.5 ${subClass}`}>Yuna speaks back</span>
        </div>
        <Switch checked={b} onChange={setB} label="Voice replies" />
      </div>
    </div>
  );
}
