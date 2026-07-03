import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RankList } from "@/components/RankList";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/rank-list")({
  head: () => ({
    meta: [
      { title: "Design System — Rank List" },
      { name: "description", content: "A drag-to-reorder list where the order is the answer." },
    ],
  }),
  component: DSRankList,
});

const VALUES = [
  { value: "family", label: "Family", emoji: "🏡" },
  { value: "growth", label: "Growth", emoji: "🌱" },
  { value: "freedom", label: "Freedom", emoji: "🕊️" },
  { value: "health", label: "Health", emoji: "💪" },
];

const VALUES_SUB = [
  { value: "family", label: "Family", subtitle: "The people closest to me", emoji: "🏡" },
  { value: "growth", label: "Growth", subtitle: "Learning and becoming", emoji: "🌱" },
  { value: "freedom", label: "Freedom", subtitle: "Space to choose my path", emoji: "🕊️" },
];

function PlainDemo({ surface }: { surface: "dark" | "light" }) {
  const [order, setOrder] = useState(VALUES.map((v) => v.value));
  return (
    <RankList
      surface={surface}
      ariaLabel="Rank your values"
      items={VALUES}
      order={order}
      onReorder={setOrder}
    />
  );
}

function SubtitleDemo({ surface }: { surface: "dark" | "light" }) {
  const [order, setOrder] = useState(VALUES_SUB.map((v) => v.value));
  return (
    <RankList
      surface={surface}
      ariaLabel="Rank your values, with detail"
      items={VALUES_SUB}
      order={order}
      onReorder={setOrder}
    />
  );
}

function DSRankList() {
  return (
    <DSPage title="Rank List">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<RankList
  items:       { value, label, subtitle?, emoji? }[]
  order:       string[]             // value ids in current order (controlled)
  onReorder:   (next: string[]) => void
  surface?:    "dark" | "light"     // default "dark"
  onDragTick?: () => void           // fired once per row crossing (tick sound)
  animateIn?:  boolean              // cascade rows in on mount; default false
  ariaLabel:   string               // names the list
  className?:  string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Plain", render: (s) => <PlainDemo surface={s} /> },
  { label: "With subtitle", render: (s) => <SubtitleDemo surface={s} /> },
];
