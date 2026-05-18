import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Switch } from "@/components/Switch";
import { DSPage, Section, SurfacePair, PropsBlock } from "@/components/ds-surface";

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
    <DSPage
      title="Switches"
      intro={
        <>
          iOS-style on/off toggle for binary settings. On-state uses{" "}
          <code className="text-xs">--success-green</code>;
          off-state uses <code className="text-xs">foreground/20</code>{" "}
          so it adapts to either surface. The thumb is always a white circle
          with a soft shadow.
        </>
      }
    >
      <Section
        title="States"
        subtitle="Off and on, in both modes. Tap any switch to toggle."
      >
        <SurfacePair
          renderRow={(surface) => <SwitchStates surface={surface} />}
        />
      </Section>

      <Section
        title="With label"
        subtitle="Pair with a label using a flex row. The label is the click target via Switch's `aria-label`; visible text uses a sibling span."
      >
        <SurfacePair
          renderRow={(surface) => <SwitchWithLabel surface={surface} />}
        />
      </Section>

      <Section
        title="Inside a settings row"
        subtitle="The dominant call site — settings drawers. Row is hairline-bordered, label left, switch right."
      >
        <SurfacePair
          renderRow={(surface) => <SwitchRow surface={surface} />}
        />
      </Section>

      <Section title="Props" subtitle="Type signature.">
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

function SwitchStates({ surface }: { surface: "dark" | "light" }) {
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  const labelClass =
    surface === "dark" ? "text-white/75" : "text-foreground/70";
  return (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Switch checked={on} onChange={setOn} label="On example" />
        <span className={`text-[10px] tracking-[0.2em] uppercase ${labelClass}`}>
          On
        </span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Switch checked={off} onChange={setOff} label="Off example" />
        <span className={`text-[10px] tracking-[0.2em] uppercase ${labelClass}`}>
          Off
        </span>
      </div>
    </div>
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
          <span className={`text-[12px] mt-0.5 ${subClass}`}>9:00 AM</span>
        </div>
        <Switch checked={a} onChange={setA} label="Daily reminders" />
      </div>
      <div className="flex items-center justify-between py-3">
        <div className="flex flex-col">
          <span className={`text-[15px] ${labelClass}`}>Voice replies</span>
          <span className={`text-[12px] mt-0.5 ${subClass}`}>Yuna speaks back</span>
        </div>
        <Switch checked={b} onChange={setB} label="Voice replies" />
      </div>
    </div>
  );
}
