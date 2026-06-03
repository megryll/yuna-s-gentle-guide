import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Slider } from "@/components/Slider";
import {
  DSPage,
  PropsBlock,
  Section,
  SurfacePair,
} from "@/components/ds-surface";

export const Route = createFileRoute("/ds/slider")({
  head: () => ({
    meta: [
      { title: "Design System — Slider" },
      {
        name: "description",
        content:
          "Thin slider — linear (stepped) and bipolar (center-out) variants.",
      },
    ],
  }),
  component: DSSlider,
});

const PACE_STEPS = ["0.5x", "0.75x", "1.0x", "1.25x", "1.5x"] as const;

function DSSlider() {
  return (
    <DSPage
      title="Slider"
      intro="A thin rail with a small thumb. Linear runs left-to-right across a set of steps; bipolar rests at the center and grows out into positive or negative."
    >
      <Section
        title="Linear"
        subtitle="Stepped, left-to-right — for an ordered set like voice pace. value is the 0-based step index; the green fill grows from the left to the thumb."
      >
        <SurfacePair align="start" renderRow={(surface) => <LinearDemo surface={surface} />} />
      </Section>

      <Section
        title="Bipolar"
        subtitle="Center-out rating — the thumb starts at the midpoint. value runs -1 → 1; the fill turns green toward the positive end, orange toward the negative."
      >
        <SurfacePair align="start" renderRow={(surface) => <BipolarDemo surface={surface} />} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Slider
  variant?:    "linear" | "bipolar"   // default "linear"
  value:       number                  // linear: step index · bipolar: -1..1
  onChange:    (value: number) => void
  surface?:    "dark" | "light"        // default "dark"

  // linear
  steps?:      readonly string[]       // labels below the rail; length = step count
  label?:      string                  // caps-tracked label above the rail

  // bipolar
  leftLabel?:  string                  // negative-end label, above the rail
  rightLabel?: string                  // positive-end label, above the rail
  touched?:    boolean                 // emphasise the active end once moved
/>

// Keyboard: arrow keys step the thumb. Tap or drag anywhere on the rail.
`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

function LinearDemo({ surface }: { surface: "dark" | "light" }) {
  const [idx, setIdx] = useState(2);
  return (
    <div className="w-full max-w-sm">
      <Slider
        variant="linear"
        surface={surface}
        steps={PACE_STEPS}
        value={idx}
        onChange={setIdx}
        label="Voice pace"
      />
    </div>
  );
}

function BipolarDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState(0);
  const [touched, setTouched] = useState(false);
  return (
    <div className="w-full max-w-sm">
      <Slider
        variant="bipolar"
        surface={surface}
        value={value}
        onChange={(v) => {
          setValue(v);
          setTouched(true);
        }}
        leftLabel="Increased stress"
        rightLabel="Decreased stress"
        touched={touched}
      />
    </div>
  );
}
