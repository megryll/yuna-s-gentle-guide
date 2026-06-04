import { createFileRoute } from "@tanstack/react-router";
import { SuggestionChip } from "@/components/SuggestionChip";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/suggestion-chip")({
  head: () => ({
    meta: [
      { title: "Design System — Suggestion Chip" },
      { name: "description", content: "Pill prompt with a trailing action affordance." },
    ],
  }),
  component: DSSuggestionChip,
});

function DSSuggestionChip() {
  return (
    <DSPage title="Suggestion chip">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="Sizes">
        <SurfaceMatrix rows={SIZE_ROWS} />
      </Section>

      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<SuggestionChip
  onClick:    () => void
  variant?:   "filled" | "primary"   // default "filled"
  size?:      "sm" | "md" | "lg"      // default "md"
  fullWidth?: boolean                 // default true
  surface?:   "dark" | "light"        // default useAppMode()
  disabled?:  boolean
>
  {label}
</SuggestionChip>

// Trailing affordance: a circular up-arrow that always inverts the chip body's
// tone so it stays legible. filled = frosted translucent body; primary = solid
// (white on dark / ink on light).`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  {
    label: "Filled",
    render: (s) => (
      <SuggestionChip variant="filled" surface={s} fullWidth={false} onClick={() => {}}>
        Tell me more
      </SuggestionChip>
    ),
  },
  {
    label: "Primary",
    render: (s) => (
      <SuggestionChip variant="primary" surface={s} fullWidth={false} onClick={() => {}}>
        Chat Now
      </SuggestionChip>
    ),
  },
];

const SIZE_ROWS: MatrixRow[] = [
  {
    label: "sm",
    render: (s) => (
      <SuggestionChip size="sm" surface={s} fullWidth={false} onClick={() => {}}>
        Smaller prompt
      </SuggestionChip>
    ),
  },
  {
    label: "md",
    render: (s) => (
      <SuggestionChip size="md" surface={s} fullWidth={false} onClick={() => {}}>
        Default prompt
      </SuggestionChip>
    ),
  },
  {
    label: "lg",
    render: (s) => (
      <SuggestionChip size="lg" surface={s} fullWidth={false} onClick={() => {}}>
        Larger prompt
      </SuggestionChip>
    ),
  },
];

const STATE_ROWS: MatrixRow[] = [
  {
    label: "Disabled",
    render: (s) => (
      <SuggestionChip surface={s} fullWidth={false} disabled onClick={() => {}}>
        Unavailable
      </SuggestionChip>
    ),
  },
];
