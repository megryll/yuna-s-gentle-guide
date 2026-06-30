import { darkPanel } from "./_bg";
import { useState } from "react";
import { RatingScale } from "yuna-design-system";
import { ThumbsUp, ThumbsDown } from "lucide-react";

// RatingScale defaults to surface="dark" (photo cluster), so previews sit on
// a dark brand panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-6 flex flex-col gap-3 w-full"
    >
      {children}
    </div>
  );
}

export function Emoji() {
  const [value, setValue] = useState<string | null>("good");
  return (
    <Dark>
      <p className="text-white/85 text-sm">How are you feeling today?</p>
      <RatingScale
        surface="dark"
        ariaLabel="Mood"
        value={value}
        onChange={setValue}
        options={[
          { value: "angry", content: "😠", label: "Tough" },
          { value: "sad", content: "😞", label: "Low" },
          { value: "neutral", content: "😐", label: "Okay" },
          { value: "good", content: "🙂", label: "Good" },
          { value: "great", content: "😊", label: "Great" },
        ]}
      />
    </Dark>
  );
}

export function Icons() {
  const [value, setValue] = useState<string | null>("up");
  return (
    <Dark>
      <p className="text-white/85 text-sm">Was this reflection helpful?</p>
      <RatingScale
        surface="dark"
        ariaLabel="Helpfulness"
        value={value}
        onChange={setValue}
        options={[
          { value: "down", content: <ThumbsDown size={24} strokeWidth={1.75} />, label: "Not helpful" },
          { value: "up", content: <ThumbsUp size={24} strokeWidth={1.75} />, label: "Helpful" },
        ]}
      />
    </Dark>
  );
}

export function Numbers() {
  const [value, setValue] = useState<string | null>("4");
  return (
    <Dark>
      <p className="text-white/85 text-sm">How calm do you feel, 1 to 5?</p>
      <RatingScale
        surface="dark"
        size="md"
        ariaLabel="Calm rating"
        value={value}
        onChange={setValue}
        options={[1, 2, 3, 4, 5].map((n) => ({
          value: String(n),
          content: String(n),
          label: String(n),
        }))}
      />
    </Dark>
  );
}
