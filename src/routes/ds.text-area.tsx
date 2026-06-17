import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TextArea } from "@/components/TextArea";
import { DictationTextArea } from "@/components/DictationTextArea";
import { FieldError } from "@/components/TextField";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/text-area")({
  head: () => ({
    meta: [
      { title: "Design System — Text Area" },
      { name: "description", content: "A multiline text input; the block-shaped sibling to Text Field." },
    ],
  }),
  component: DSTextArea,
});

function FieldDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState(
    "Hi Dr. Kerstin,\n\nI was matched with you through Yuna and your approach resonated with me.",
  );
  return (
    <TextArea
      surface={surface}
      rows={4}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Write a message"
    />
  );
}

function ErrorDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <TextArea
        surface={surface}
        error
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tell us a little more"
      />
      <FieldError>Please add a few words before sending.</FieldError>
    </div>
  );
}

function DisabledDemo({ surface }: { surface: "dark" | "light" }) {
  return (
    <TextArea
      surface={surface}
      rows={3}
      disabled
      value="This note can't be edited right now."
      readOnly
    />
  );
}

function IdleDictationDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState("");
  return <DictationTextArea surface={surface} value={value} onChange={setValue} />;
}

function FilledDictationDemo({ surface }: { surface: "dark" | "light" }) {
  const [value, setValue] = useState(
    "it kind of depends on the day. sometimes I'll just sit on the couch and scroll for a bit because my brain feels too tired to do anything else.",
  );
  return <DictationTextArea surface={surface} value={value} onChange={setValue} />;
}

function DSTextArea() {
  return (
    <DSPage title="Text Area">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section
        title="Dictation"
        subtitle="DictationTextArea is the type-or-record sibling: an empty field shows a Mic, tap to record (a live waveform replaces the text), tap Stop to keep the transcript. With text the trailing button becomes an X to clear, and the field auto-grows with the answer."
      >
        <SurfaceMatrix rows={DICTATION_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<TextArea
  surface?: "dark" | "light"      // default "dark"
  variant?: "field" | "display"   // default "field"
  error?:   boolean               // field only — alert-orange border + aria-invalid
  ...textarea attributes          // rows, value, onChange, placeholder, disabled, …
/>

<DictationTextArea
  value:        string                 // controlled text
  onChange:     (v: string) => void    // typing or live transcript
  onClear?:     () => void             // overrides the X (default clears to "")
  surface?:     "dark" | "light"       // default "dark"
  placeholder?: string                 // default "Type or record your answer"
  autoFocus?:   boolean
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Field", render: (s) => <FieldDemo surface={s} /> },
];

const STATE_ROWS: MatrixRow[] = [
  { label: "Error", render: (s) => <ErrorDemo surface={s} /> },
  { label: "Disabled", render: (s) => <DisabledDemo surface={s} /> },
];

const DICTATION_ROWS: MatrixRow[] = [
  { label: "Empty", render: (s) => <IdleDictationDemo surface={s} /> },
  { label: "With text", render: (s) => <FilledDictationDemo surface={s} /> },
];
