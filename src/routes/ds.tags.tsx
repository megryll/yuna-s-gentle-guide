import { createFileRoute } from "@tanstack/react-router";
import { Sun, Music, Plus } from "lucide-react";
import { Tag } from "@/components/Tag";
import {
  DSPage,
  Section,
  SurfaceMatrix,
  PropsBlock,
  type MatrixRow,
} from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/tags")({
  head: () => ({
    meta: [
      { title: "Design System — Tags" },
      { name: "description", content: "Keyword pills — tappable choices or static labels — with an optional icon." },
    ],
  }),
  component: DSTags,
});

function DSTags() {
  return (
    <DSPage title="Tags">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="States" subtitle="For the tappable variant only.">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Tag
  variant?:     "tappable" | "informational"   // default "tappable"
  onClick?:     () => void                      // tappable only
  selected?:    boolean                         // tappable only, default false
  icon?:        ReactNode                       // optional leading glyph (sized to 14px)
  surface?:     "dark" | "light"                // default useAppMode()
  disabled?:    boolean                         // tappable only
  aria-label?:  string                          // accessible name for icon-only tags
>
  {label}
</Tag>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  {
    label: "Tappable",
    render: (s) => (
      <div className="flex flex-wrap gap-2">
        <Tag surface={s} onClick={() => {}}>
          Sunshine
        </Tag>
        <Tag surface={s} selected onClick={() => {}}>
          Music
        </Tag>
      </div>
    ),
  },
  {
    label: "Informational",
    render: (s) => (
      <div className="flex flex-wrap gap-2">
        <Tag surface={s} variant="informational">
          Anxiety
        </Tag>
        <Tag surface={s} variant="informational">
          CBT
        </Tag>
        <Tag surface={s} variant="informational">
          Trauma-informed
        </Tag>
      </div>
    ),
  },
  {
    label: "With icon",
    render: (s) => (
      <div className="flex flex-wrap gap-2">
        <Tag surface={s} icon={<Sun />} onClick={() => {}}>
          Sunshine
        </Tag>
        <Tag surface={s} variant="informational" icon={<Music />}>
          Sound therapy
        </Tag>
        <Tag surface={s} aria-label="Add" onClick={() => {}}>
          <Plus />
        </Tag>
      </div>
    ),
  },
];

const STATE_ROWS: MatrixRow[] = [
  {
    label: "Unselected",
    render: (s) => (
      <Tag surface={s} onClick={() => {}}>
        Sunshine
      </Tag>
    ),
  },
  {
    label: "Selected",
    render: (s) => (
      <Tag surface={s} selected onClick={() => {}}>
        Sunshine
      </Tag>
    ),
  },
  {
    label: "Disabled",
    render: (s) => (
      <Tag surface={s} disabled onClick={() => {}}>
        Sunshine
      </Tag>
    ),
  },
];

