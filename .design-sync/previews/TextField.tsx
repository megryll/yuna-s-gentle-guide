import { useState } from "react";
import { TextField, FieldError } from "yuna-design-system";

// TextField defaults to surface="dark" (frosted pill on the photo cluster),
// so previews sit on a dark brand panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6 flex flex-col gap-4 w-full"
    >
      {children}
    </div>
  );
}

export function Default() {
  const [value, setValue] = useState("");
  return (
    <Dark>
      <TextField
        surface="dark"
        placeholder="What's on your mind?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Dark>
  );
}

export function Sizes() {
  const [a, setA] = useState("Maya");
  const [b, setB] = useState("");
  return (
    <Dark>
      <TextField
        surface="dark"
        size="md"
        value={a}
        onChange={(e) => setA(e.target.value)}
      />
      <TextField
        surface="dark"
        size="lg"
        placeholder="Your name"
        value={b}
        onChange={(e) => setB(e.target.value)}
      />
    </Dark>
  );
}

export function ErrorState() {
  const [value, setValue] = useState("maya@");
  return (
    <Dark>
      <div className="flex flex-col gap-2">
        <TextField
          surface="dark"
          error
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <FieldError>That doesn't look like a complete email yet.</FieldError>
      </div>
    </Dark>
  );
}

export function OnLight() {
  const [value, setValue] = useState("");
  return (
    <TextField
      surface="light"
      placeholder="Search your reflections"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
