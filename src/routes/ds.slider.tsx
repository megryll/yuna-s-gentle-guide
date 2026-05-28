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
          "Stepped slider — Yuna-green rail wraps a white circular dial.",
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
      intro={
        <>
          Stepped slider for ordered choices over a small finite set (voice
          pace, intensity, volume). The rail uses{" "}
          <code className="text-xs">--yuna-green</code> — sampled from the
          Yuna avatar mark — and wraps a white circular dial that bulges a few
          pixels above and below the rail edge.
        </>
      }
    >
      <Section title="Default" subtitle="Card-wrapped with a caps-tracked label.">
        <SurfacePair renderRow={() => <Demo />} align="start" />
      </Section>

      <Section title="Props" subtitle="Type signature.">
        <PropsBlock>{`<Slider
  steps:    readonly string[]        // step labels; length = step count
  value:    number                   // 0-based index of selected step
  onChange: (idx: number) => void
  label?:   string                   // caps-tracked label above the rail
  bare?:    boolean                  // drop the surrounding card frame
/>

// Keyboard: ArrowLeft/Down decrements, ArrowRight/Up increments.
// Tap or drag anywhere on the rail snaps to the nearest step.
`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

function Demo() {
  const [idx, setIdx] = useState(2);
  return (
    <div className="w-full max-w-sm">
      <Slider
        steps={PACE_STEPS}
        value={idx}
        onChange={setIdx}
        label="Voice pace"
      />
    </div>
  );
}
