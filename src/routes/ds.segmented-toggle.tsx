import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, MessageCircle } from "lucide-react";
import { SegmentedToggle, type SegmentedToggleOption } from "@/components/SegmentedToggle";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/segmented-toggle")({
  head: () => ({
    meta: [
      { title: "Design System — Segmented Toggle" },
      { name: "description", content: "Two-segment pill toggle." },
    ],
  }),
  component: DSSegmentedToggle,
});

type V = "voice" | "text";
type Content = "text" | "icon" | "both";

// One option pair, rebuilt per content form so the same toggle can show text
// only, an icon only, or both — the component supports all three at either size.
function buildOptions(content: Content): ReadonlyArray<SegmentedToggleOption<V>> {
  return [
    {
      value: "voice",
      label: content === "icon" ? undefined : "Voice",
      icon: content === "text" ? undefined : <Mic size={14} strokeWidth={1.75} aria-hidden />,
      ariaLabel: "Voice",
    },
    {
      value: "text",
      label: content === "icon" ? undefined : "Text",
      icon: content === "text" ? undefined : <MessageCircle size={14} strokeWidth={1.75} aria-hidden />,
      ariaLabel: "Text",
    },
  ];
}

function Demo({
  surface,
  size,
  content,
}: {
  surface: "dark" | "light";
  size: "sm" | "md";
  content: Content;
}) {
  const [value, setValue] = useState<V>("voice");
  return (
    <SegmentedToggle
      size={size}
      surface={surface}
      ariaLabel="Conversation mode"
      value={value}
      onChange={setValue}
      options={buildOptions(content)}
    />
  );
}

const SIZE_ROWS: MatrixRow[] = [
  { label: "sm · text", render: (s) => <Demo surface={s} size="sm" content="text" /> },
  { label: "sm · icon", render: (s) => <Demo surface={s} size="sm" content="icon" /> },
  { label: "sm · text + icon", render: (s) => <Demo surface={s} size="sm" content="both" /> },
  { label: "md · text", render: (s) => <Demo surface={s} size="md" content="text" /> },
  { label: "md · icon", render: (s) => <Demo surface={s} size="md" content="icon" /> },
  { label: "md · text + icon", render: (s) => <Demo surface={s} size="md" content="both" /> },
];

function DSSegmentedToggle() {
  return (
    <DSPage title="Segmented toggle">
      <Section
        title="Sizes"
        subtitle="Two sizes that differ mainly by height — sm (h-8 rail) and md (h-9 rail). Either size takes segments with text only, an icon only, or both; labelled segments grow with their text while icon-only segments stay square."
      >
        <SurfaceMatrix rows={SIZE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<SegmentedToggle
  value:    V
  options:  ReadonlyArray<SegmentedToggleOption<V>>
  onChange: (v: V) => void
  surface:  "dark" | "light"
  ariaLabel: string
  size?:    "sm" | "md"        // default "md"; differ mainly by height
/>

type SegmentedToggleOption<V extends string> = {
  value:      V
  label?:     string           // omit for an icon-only segment
  icon?:      ReactNode         // omit for a text-only segment
  ariaLabel?: string           // required when label is omitted
}`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
