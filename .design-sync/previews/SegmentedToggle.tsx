import { useState } from "react";
import { SegmentedToggle } from "yuna-design-system";
import { MessageCircle, Mic, LayoutGrid, List } from "lucide-react";

// SegmentedToggle defaults to surface="dark" (photo cluster), so previews
// sit on a dark brand panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6 flex flex-col items-start gap-4"
    >
      {children}
    </div>
  );
}

export function TextLabels() {
  const [value, setValue] = useState<"active" | "completed">("active");
  return (
    <Dark>
      <SegmentedToggle
        surface="dark"
        ariaLabel="Goals filter"
        value={value}
        onChange={setValue}
        options={[
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
        ]}
      />
    </Dark>
  );
}

export function WithIcons() {
  const [value, setValue] = useState<"text" | "voice">("voice");
  return (
    <Dark>
      <SegmentedToggle
        surface="dark"
        ariaLabel="Conversation mode"
        value={value}
        onChange={setValue}
        options={[
          { value: "text", label: "Text", icon: <MessageCircle size={16} /> },
          { value: "voice", label: "Voice", icon: <Mic size={16} /> },
        ]}
      />
    </Dark>
  );
}

export function IconOnly() {
  const [value, setValue] = useState<"cards" | "list">("cards");
  return (
    <Dark>
      <SegmentedToggle
        surface="dark"
        ariaLabel="Layout"
        value={value}
        onChange={setValue}
        options={[
          { value: "cards", icon: <LayoutGrid size={16} />, ariaLabel: "Cards" },
          { value: "list", icon: <List size={16} />, ariaLabel: "List" },
        ]}
      />
    </Dark>
  );
}

export function Small() {
  const [value, setValue] = useState<"dark" | "light">("dark");
  return (
    <Dark>
      <SegmentedToggle
        surface="dark"
        size="sm"
        ariaLabel="Appearance"
        value={value}
        onChange={setValue}
        options={[
          { value: "dark", label: "Dark" },
          { value: "light", label: "Light" },
        ]}
      />
    </Dark>
  );
}
