import { darkPanel } from "./_bg";
import { useState } from "react";
import { Checkbox } from "yuna-design-system";

// Checkbox defaults to surface="dark", so previews sit on a dark brand panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-6 flex flex-col items-start gap-4"
    >
      {children}
    </div>
  );
}

export function Default() {
  const [checked, setChecked] = useState(true);
  return (
    <Dark>
      <Checkbox
        surface="dark"
        checked={checked}
        onChange={setChecked}
        label="Remind me to check in each evening"
      />
    </Dark>
  );
}

export function States() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(true);
  return (
    <Dark>
      <Checkbox surface="dark" checked={a} onChange={setA} label="Unchecked" />
      <Checkbox surface="dark" checked={b} onChange={setB} label="Checked" />
    </Dark>
  );
}

export function Disabled() {
  return (
    <Dark>
      <Checkbox
        surface="dark"
        checked
        onChange={() => {}}
        disabled
        label="I agree to the terms (locked)"
      />
    </Dark>
  );
}

export function OnLight() {
  const [checked, setChecked] = useState(true);
  return (
    <Checkbox
      surface="light"
      checked={checked}
      onChange={setChecked}
      label="Keep my reflections private"
    />
  );
}
