import { createFileRoute } from "@tanstack/react-router";
import { YunaAvatar } from "@/components/YunaAvatar";
import { DSPage, PropsBlock, Row, Section, SurfaceMatrix, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/avatars")({
  head: () => ({
    meta: [
      { title: "Design System — Avatars" },
      { name: "description", content: "Yuna design system: avatars." },
    ],
  }),
  component: DSAvatars,
});

const SIZES = [20, 32, 48, 64] as const;

function DSAvatars() {
  return (
    <DSPage title="Avatars">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="Sizes">
        <SurfaceMatrix rows={SIZE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<YunaAvatar
  variant?:   AvatarVariant   // photo avatar; omit for the brand mark
  size?:      number          // px, square — default 32
  glow?:      boolean         // animated aura — default false
  className?: string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Photo", render: () => <YunaAvatar variant="iris" size={40} /> },
  { label: "Mark", render: () => <YunaAvatar size={40} /> },
  {
    label: "Glow",
    render: () => (
      <div className="h-40 flex items-center">
        <YunaAvatar glow variant="iris" size={40} />
      </div>
    ),
  },
];

const SIZE_ROWS: MatrixRow[] = [
  {
    label: "Scale",
    render: () => (
      <Row className="gap-4">
        {SIZES.map((s) => (
          <YunaAvatar key={s} variant="iris" size={s} />
        ))}
      </Row>
    ),
  },
];
