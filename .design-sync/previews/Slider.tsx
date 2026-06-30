import { darkPanel } from "./_bg";
import { useState } from "react";
import { Slider } from "yuna-design-system";

// Slider defaults to surface="dark" (photo cluster) with a translucent rail,
// so previews sit on a dark brand panel. These are wide controls.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-6 flex flex-col gap-4 w-full"
    >
      {children}
    </div>
  );
}

const PACE = ["0.5x", "0.75x", "1x", "1.25x", "1.5x"] as const;

export function LinearSteps() {
  const [value, setValue] = useState(2);
  return (
    <Dark>
      <Slider
        surface="dark"
        label="Yuna's pace"
        value={value}
        onChange={setValue}
        steps={PACE}
      />
    </Dark>
  );
}

export function LinearRange() {
  const [value, setValue] = useState(7);
  return (
    <Dark>
      <Slider
        surface="dark"
        label="How rested do you feel"
        value={value}
        onChange={setValue}
        stepCount={11}
        leftLabel="Drained"
        rightLabel="Rested"
        touched
      />
    </Dark>
  );
}

export function Bipolar() {
  const [value, setValue] = useState(0.4);
  return (
    <Dark>
      <Slider
        surface="dark"
        variant="bipolar"
        value={value}
        onChange={setValue}
        leftLabel="Tense"
        rightLabel="At ease"
        touched
      />
    </Dark>
  );
}

export function BipolarNeutral() {
  const [value, setValue] = useState(-0.3);
  return (
    <Dark>
      <Slider
        surface="dark"
        variant="bipolar"
        tone="neutral"
        value={value}
        onChange={setValue}
        leftLabel="Music"
        rightLabel="Voice"
        touched
      />
    </Dark>
  );
}
