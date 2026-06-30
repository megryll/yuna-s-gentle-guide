import { darkPanel } from "./_bg";
import { useState } from "react";
import { MultipleChoice, Badge } from "yuna-design-system";

// MultipleChoice defaults to surface="dark" (photo cluster) with full-width
// rows, so previews sit on a dark brand panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-6 w-full"
    >
      {children}
    </div>
  );
}

export function Single() {
  const [value, setValue] = useState<string | null>("calm");
  return (
    <Dark>
      <MultipleChoice
        surface="dark"
        ariaLabel="What brings you here today?"
        value={value}
        onChange={setValue}
        options={[
          { value: "stress", label: "Stress", emoji: "😰" },
          { value: "sleep", label: "Sleep & Energy", emoji: "😴" },
          { value: "calm", label: "Finding Calm", emoji: "🌿" },
        ]}
      />
    </Dark>
  );
}

export function Multiple() {
  const [value, setValue] = useState<string[]>(["online", "either"]);
  return (
    <Dark>
      <MultipleChoice
        surface="dark"
        multiple
        ariaLabel="Session preferences"
        value={value}
        onChange={setValue}
        options={[
          { value: "person", label: "In Person", emoji: "🛋️" },
          { value: "online", label: "Online", emoji: "💻" },
          { value: "either", label: "Either", emoji: "✨" },
        ]}
      />
    </Dark>
  );
}

export function WithDetail() {
  const [value, setValue] = useState<string | null>("intro");
  return (
    <Dark>
      <MultipleChoice
        surface="dark"
        ariaLabel="Choose a session"
        value={value}
        onChange={setValue}
        options={[
          {
            value: "intro",
            label: "Free intro call",
            subtitle: "A quick conversation to see if you're a fit.",
            trailing: <Badge>15 min</Badge>,
          },
          {
            value: "session",
            label: "First full session",
            subtitle: "A full intake session to begin working together.",
            trailing: <Badge>50 min</Badge>,
          },
        ]}
      />
    </Dark>
  );
}

export function States() {
  const [value, setValue] = useState<string | null>("a");
  return (
    <Dark>
      <MultipleChoice
        surface="dark"
        ariaLabel="Option states"
        value={value}
        onChange={setValue}
        options={[
          { value: "a", label: "Available option" },
          { value: "b", label: "Unavailable option", disabled: true },
        ]}
      />
    </Dark>
  );
}
