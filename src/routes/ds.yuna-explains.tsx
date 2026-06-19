import { createFileRoute } from "@tanstack/react-router";
import { YunaExplains } from "@/components/YunaExplains";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/yuna-explains")({
  head: () => ({
    meta: [
      { title: "Design System — Yuna Explains" },
      { name: "description", content: "The chosen Yuna voice avatar paired with a short line of context." },
    ],
  }),
  component: DSYunaExplains,
});

const NOTE = "Mira could be a great fit because she works with anxiety and perfectionism using ACT and mindfulness.";

function DSYunaExplains() {
  return (
    <DSPage title="Yuna Explains">
      <Section title="Sizes">
        <SurfaceMatrix rows={SIZE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<YunaExplains>
  children:   ReactNode             // what Yuna says
  avatar?:    AvatarVariant         // override the chosen voice avatar
  size?:      number                // avatar px (default 32)
  surface?:   "dark" | "light"      // default "dark"
  className?: string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const SIZE_ROWS: MatrixRow[] = [
  {
    label: "Default (32)",
    render: (s) => (
      <YunaExplains surface={s} avatar="maya">
        {NOTE}
      </YunaExplains>
    ),
  },
  {
    label: "Large (40)",
    render: (s) => (
      <YunaExplains surface={s} avatar="maya" size={40}>
        {NOTE}
      </YunaExplains>
    ),
  },
];
