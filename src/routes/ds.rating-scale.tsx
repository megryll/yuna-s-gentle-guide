import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { RatingScale, type RatingScaleOption } from "@/components/RatingScale";
import { DSPage, Section, SurfaceMatrix, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/rating-scale")({
  head: () => ({
    meta: [
      { title: "Design System — Rating Scale" },
      { name: "description", content: "A single-choice row of rating options." },
    ],
  }),
  component: DSRatingScale,
});

function Demo<V extends string>({
  surface,
  options,
  size,
  initial = null,
}: {
  surface: "dark" | "light";
  options: ReadonlyArray<RatingScaleOption<V>>;
  size?: "md" | "lg";
  initial?: V | null;
}) {
  const [value, setValue] = useState<V | null>(initial);
  return (
    <RatingScale
      surface={surface}
      ariaLabel="Rating"
      value={value}
      onChange={setValue}
      options={options}
      size={size}
    />
  );
}

const FACES: ReadonlyArray<RatingScaleOption<string>> = [
  { value: "angry", content: "😠", label: "Angry" },
  { value: "sad", content: "😞", label: "Sad" },
  { value: "neutral", content: "😐", label: "Neutral" },
  { value: "good", content: "🙂", label: "Good" },
  { value: "great", content: "😊", label: "Great" },
];

const THUMBS: ReadonlyArray<RatingScaleOption<string>> = [
  { value: "down", content: <ThumbsDown size={24} strokeWidth={1.75} />, label: "Not helpful" },
  { value: "up", content: <ThumbsUp size={24} strokeWidth={1.75} />, label: "Helpful" },
];

const NUMBERS: ReadonlyArray<RatingScaleOption<string>> = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  content: String(n),
  label: String(n),
}));

const WORDS: ReadonlyArray<RatingScaleOption<string>> = [
  { value: "no", content: "No", label: "No" },
  { value: "maybe", content: "Maybe", label: "Maybe" },
  { value: "yes", content: "Yes", label: "Yes" },
];

function DSRatingScale() {
  return (
    <DSPage title="Rating Scale">
      <p className="mb-12 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        A single-choice row. The chosen option scales up and gains a circular
        ring + surface fill while the rest shrink back, so the pick reads at a
        glance. Options can hold an emoji, a number, a word, or an icon — choose
        the count that fits the question.
      </p>

      <Section title="Variants">
        <SurfaceMatrix
          rows={[
            { label: "Emoji", render: (s) => <Demo surface={s} options={FACES} /> },
            { label: "Icon", render: (s) => <Demo surface={s} options={THUMBS} /> },
            { label: "Number", render: (s) => <Demo surface={s} options={NUMBERS} size="md" /> },
            { label: "Word", render: (s) => <Demo surface={s} options={WORDS} size="md" /> },
          ]}
        />
      </Section>

      <Section title="States">
        <SurfaceMatrix
          rows={[
            { label: "Default", render: (s) => <Demo surface={s} options={FACES} /> },
            {
              label: "Selected",
              render: (s) => <Demo surface={s} options={FACES} initial="good" />,
            },
          ]}
        />
      </Section>

      <Section title="Sizes">
        <SurfaceMatrix
          rows={[
            { label: "lg", render: (s) => <Demo surface={s} options={FACES} size="lg" /> },
            { label: "md", render: (s) => <Demo surface={s} options={FACES} size="md" /> },
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<RatingScale
  value:      V | null                 // selected option value, or null
  options:    RatingScaleOption<V>[]   // { value, content, label } each
  onChange:   (v: V) => void
  surface?:   "dark" | "light"         // glyph/text ink; default "dark"
  ariaLabel:  string                   // names the radiogroup
  size?:      "md" | "lg"              // emoji/number/word size — default "lg"
/>

RatingScaleOption<V> = {
  value:    V          // unique key returned by onChange
  content:  ReactNode  // emoji, number, word, or icon
  label:    string     // accessible name for the option
}`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
