import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Bookmark, MoreHorizontal, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { StepDots } from "@/components/StepDots";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/page-header")({
  head: () => ({
    meta: [
      { title: "Design System — Page Header" },
      { name: "description", content: "Back button + centered slot + trailing actions." },
    ],
  }),
  component: DSPageHeader,
});

const noop = () => undefined;

// The built-in pt-14/pb-2 is sized for the top of a real screen; trim it here
// so each row reads as a compact bar inside the doc panel.
const DEMO_PAD = "pt-1 pb-1 px-1";

function IconButton({
  surface,
  label,
  children,
}: {
  surface: "dark" | "light";
  label: string;
  children: ReactNode;
}) {
  return (
    <Button surface={surface} variant="secondary" size="icon" aria-label={label} onClick={noop}>
      {children}
    </Button>
  );
}

const VARIANTS: MatrixRow[] = [
  {
    label: "Title",
    render: (s) => <PageHeader surface={s} onBack={noop} title="Meditation" className={DEMO_PAD} />,
  },
  {
    label: "Inline title",
    render: (s) => (
      <PageHeader surface={s} onBack={noop} title="Subscription" layout="inline" className={DEMO_PAD} />
    ),
  },
  {
    label: "Title + trailing",
    render: (s) => (
      <PageHeader
        surface={s}
        onBack={noop}
        title="Profile"
        className={DEMO_PAD}
        trailing={
          <IconButton surface={s} label="Save">
            <Bookmark strokeWidth={1.75} />
          </IconButton>
        }
      />
    ),
  },
  {
    label: "Trailing only",
    render: (s) => (
      <PageHeader
        surface={s}
        onBack={noop}
        className={DEMO_PAD}
        trailing={
          <IconButton surface={s} label="Options">
            <MoreHorizontal strokeWidth={1.8} />
          </IconButton>
        }
      />
    ),
  },
  {
    label: "Center override",
    render: (s) => (
      <PageHeader
        surface={s}
        onBack={noop}
        className={DEMO_PAD}
        center={<StepDots surface={s} count={3} current={1} aria-label="Step 2 of 3" />}
        trailing={
          <IconButton surface={s} label="Close">
            <X strokeWidth={1.5} />
          </IconButton>
        }
      />
    ),
  },
  {
    // onBack omitted: leading slot renders empty. For screens with a persistent
    // nav (the web rail) where an in-app back is redundant.
    label: "No back",
    render: (s) => (
      <PageHeader
        surface={s}
        title="Recommendations"
        className={DEMO_PAD}
        trailing={
          <IconButton surface={s} label="Save">
            <Bookmark strokeWidth={1.75} />
          </IconButton>
        }
      />
    ),
  },
];

const STATES: MatrixRow[] = [
  {
    label: "Back disabled",
    render: (s) => (
      <PageHeader surface={s} onBack={noop} backDisabled title="Step one" className={DEMO_PAD} />
    ),
  },
];

function DSPageHeader() {
  return (
    <DSPage title="Page Header">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANTS} />
      </Section>

      <Section title="States">
        <SurfaceMatrix rows={STATES} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<PageHeader
  title?:        string              // centered title (Fraunces, text-3xl), stacked below the row
  center?:       ReactNode           // on-row centered slot (step dots, eyebrow…)
  trailing?:     ReactNode           // action(s) pinned to the trailing edge
  onBack?:       () => void          // omit where a persistent nav makes back redundant
  backDisabled?: boolean             // default false
  surface?:      "dark" | "light"    // back-button surface + title ink; default "light"
  tone?:         "photo" | "ink"     // title ink — "photo" derives from surface (default),
                                     //   "ink" = text-foreground (settings cluster)
  layout?:       "stacked" | "inline" // title below the row (default) vs. on the row (settings)
  className?:    string              // e.g. px-8 to match a px-8 body, or zero the
                                     //   built-in padding when nested in a padded scroller
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
