import { useState } from "react";
import { DictationField } from "yuna-design-system";

// DictationField is the single-line chat composer: type, or press-and-hold the
// mic to dictate. These cards render statically (no mic / audio), so they show
// the two resting visual states — empty (hold-to-talk mic) and with text (send
// arrow). It defaults to surface="dark" over a frosted input, so previews sit
// on a dark brand-green panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6 flex flex-col gap-4"
    >
      {children}
    </div>
  );
}

export function Empty() {
  const [value, setValue] = useState("");
  return (
    <Dark>
      <DictationField
        surface="dark"
        value={value}
        onChange={setValue}
        onSubmit={() => {}}
        placeholder="Tell me what's on your mind"
      />
    </Dark>
  );
}

export function WithText() {
  const [value, setValue] = useState("I've been feeling stretched thin lately.");
  return (
    <Dark>
      <DictationField
        surface="dark"
        value={value}
        onChange={setValue}
        onSubmit={() => {}}
        placeholder="Tell me what's on your mind"
      />
    </Dark>
  );
}

export function OnLight() {
  const [value, setValue] = useState("");
  return (
    <div className="rounded-2xl p-6 bg-white">
      <DictationField
        surface="light"
        value={value}
        onChange={setValue}
        onSubmit={() => {}}
        placeholder="Tell me what's on your mind"
      />
    </div>
  );
}
