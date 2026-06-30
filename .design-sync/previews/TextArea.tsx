import { darkPanel } from "./_bg";
import { useState } from "react";
import { TextArea } from "yuna-design-system";

// TextArea defaults to surface="dark" (frosted box on the photo cluster),
// so previews sit on a dark brand panel.
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

export function Field() {
  const [value, setValue] = useState(
    "Today felt lighter than yesterday. I made time for a slow walk before the rush.",
  );
  return (
    <Dark>
      <TextArea
        surface="dark"
        rows={4}
        placeholder="Write whatever wants to come out."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Dark>
  );
}

export function Empty() {
  const [value, setValue] = useState("");
  return (
    <Dark>
      <TextArea
        surface="dark"
        rows={4}
        placeholder="What would feel kind to yourself right now?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Dark>
  );
}

export function Display() {
  const [value, setValue] = useState("Evening wind-down");
  return (
    <Dark>
      <TextArea
        surface="dark"
        variant="display"
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Dark>
  );
}

export function ErrorState() {
  const [value, setValue] = useState("");
  return (
    <Dark>
      <TextArea
        surface="dark"
        error
        rows={3}
        placeholder="A note is needed before you continue."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Dark>
  );
}
