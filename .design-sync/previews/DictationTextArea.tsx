import { useState } from "react";
import { DictationTextArea } from "yuna-design-system";

// DictationTextArea is the multiline, tap-to-toggle answer field. These cards
// render statically (no mic / audio), so they show the two resting visual
// states — empty (Mic to start) and with text (X to clear). It defaults to
// surface="dark", so previews sit on a dark brand-green panel.
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
      <DictationTextArea
        surface="dark"
        value={value}
        onChange={setValue}
        placeholder="Type or record your answer"
      />
    </Dark>
  );
}

export function WithText() {
  const [value, setValue] = useState(
    "Some mornings I wake up already bracing for the day. I'd like to feel a little softer toward myself when that happens.",
  );
  return (
    <Dark>
      <DictationTextArea surface="dark" value={value} onChange={setValue} />
    </Dark>
  );
}

export function OnLight() {
  const [value, setValue] = useState("");
  return (
    <div className="rounded-2xl p-6 bg-white">
      <DictationTextArea
        surface="light"
        value={value}
        onChange={setValue}
        placeholder="Type or record your answer"
      />
    </div>
  );
}
