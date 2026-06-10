import { createFileRoute } from "@tanstack/react-router";
import { RadialProgress } from "@/components/RadialProgress";
import { DSPage, Section, SurfaceMatrix, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/radial-progress")({
  head: () => ({
    meta: [
      { title: "Design System — Radial Progress" },
      { name: "description", content: "Circular progress ring with optional centered content." },
    ],
  }),
  component: DSRadialProgress,
});

function DSRadialProgress() {
  return (
    <DSPage title="Radial Progress">
      <p className="mb-12 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        A circular track with a progress arc that sweeps clockwise from twelve
        o'clock. Stroke color is picked by <code>surface</code> — white on the
        dark photo, ink on the light one — because the light-mode shim only
        remaps text and border utilities, not SVG strokes. Whatever you pass as
        children renders centered in the ring.
      </p>

      <Section title="States">
        <SurfaceMatrix
          rows={[
            { label: "0%", render: (s) => <Demo surface={s} value={0} /> },
            { label: "40%", render: (s) => <Demo surface={s} value={0.4} /> },
            { label: "100%", render: (s) => <Demo surface={s} value={1} /> },
          ]}
        />
      </Section>

      <Section title="Sizes">
        <SurfaceMatrix
          rows={[
            {
              label: "96",
              render: (s) => <RadialProgress surface={s} value={0.6} size={96} />,
            },
            {
              label: "160",
              render: (s) => <RadialProgress surface={s} value={0.6} size={160} />,
            },
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<RadialProgress
  value:        number              // progress fraction 0–1 (clamped)
  size?:        number              // px diameter (default 220)
  strokeWidth?: number              // ring thickness in px (default 4)
  surface?:     "dark" | "light"    // stroke palette (default "dark")
  className?:   string              // extra classes on the wrapper
  aria-label?:  string              // describes what's progressing
  children?:    ReactNode           // centered content (e.g. a % label)
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

// SurfaceMatrix panels don't carry `.theme-light`, so the centered label picks
// its ink/white directly by surface rather than relying on the shim.
function Demo({ surface, value }: { surface: "dark" | "light"; value: number }) {
  return (
    <RadialProgress
      surface={surface}
      value={value}
      size={96}
      aria-label={`${Math.round(value * 100)} percent`}
    >
      <span
        className={
          "font-display text-xl leading-none " +
          (surface === "dark" ? "text-white" : "text-foreground")
        }
      >
        {Math.round(value * 100)}%
      </span>
    </RadialProgress>
  );
}
