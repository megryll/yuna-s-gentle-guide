import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Slider } from "@/components/Slider";
import {
  DSPage,
  PropsBlock,
  Section,
  SurfaceMatrix,
  type MatrixRow,
} from "@/ds-docs/surface";

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
    <DSPage title="Slider">
      <Section
        title="Variants"
        subtitle="Linear is stepped left-to-right for an ordered set like voice pace; for ranges too wide to label every step (a 0–10 scale), pass stepCount with leftLabel/rightLabel end labels instead. Bipolar rests at center and runs -1 → 1, turning green toward the positive end and orange toward the negative — or set tone='neutral' for a monochrome ink fill on balance controls with no good/bad end."
      >
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Slider
  variant?:    "linear" | "bipolar"   // default "linear"
  value:       number                  // linear: step index · bipolar: -1..1
  onChange:    (value: number) => void
  surface?:    "dark" | "light"        // default "dark"

  // linear
  steps?:      readonly string[]       // labels below the rail; length = step count
  stepCount?:  number                  // discrete steps when unlabeled (e.g. 11 for 0–10)
  fill?:       "green" | "orange"      // fill color (default green); pass a
                                       // value-dependent choice for sentiment
  label?:      string                  // caps-tracked label above the rail

  // shared end labels
  leftLabel?:  string                  // bipolar: negative end, above · linear: min end, below
  rightLabel?: string                  // bipolar: positive end, above · linear: max end, below
  touched?:    boolean                 // emphasise the active end once moved

  // bipolar
  tone?:       "sentiment" | "neutral" // green/orange (default) vs ink fill
/>

// Keyboard: arrow keys step the thumb. Tap or drag anywhere on the rail.
`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Linear", render: (s) => <LinearDemo surface={s} /> },
  { label: "Linear · end labels", render: (s) => <RangeDemo surface={s} /> },
  { label: "Linear · sentiment fill", render: (s) => <SentimentFillDemo surface={s} /> },
  { label: "Bipolar", render: (s) => <BipolarDemo surface={s} /> },
  { label: "Bipolar · neutral", render: (s) => <NeutralDemo surface={s} /> },
];

function RangeDemo({ surface }: { surface: "dark" | "light" }) {
  const [idx, setIdx] = useState(4);
  const [touched, setTouched] = useState(false);
  return (
    <div className="w-full max-w-sm">
      <Slider
        variant="linear"
        surface={surface}
        stepCount={11}
        value={idx}
        onChange={(v) => {
          setIdx(v);
          setTouched(true);
        }}
        leftLabel="No stress"
        rightLabel="Worst possible"
        touched={touched}
      />
    </div>
  );
}

function SentimentFillDemo({ surface }: { surface: "dark" | "light" }) {
  const [idx, setIdx] = useState(2);
  const [touched, setTouched] = useState(false);
  return (
    <div className="w-full max-w-sm">
      <Slider
        variant="linear"
        surface={surface}
        stepCount={11}
        value={idx}
        onChange={(v) => {
          setIdx(v);
          setTouched(true);
        }}
        leftLabel="None"
        rightLabel="Severe"
        touched={touched}
        fill={idx > 5 ? "orange" : "green"}
      />
    </div>
  );
}

function NeutralDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState(0);
  return (
    <div className="w-full max-w-sm flex items-center gap-3">
      <span className="text-uppercase tracking-[0.04em] uppercase text-muted-foreground shrink-0">
        Music
      </span>
      <div className="flex-1">
        <Slider variant="bipolar" tone="neutral" surface={surface} value={value} onChange={setValue} />
      </div>
      <span className="text-uppercase tracking-[0.04em] uppercase text-muted-foreground shrink-0">
        Voice
      </span>
    </div>
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
