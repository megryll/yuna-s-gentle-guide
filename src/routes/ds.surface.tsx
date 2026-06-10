import { createFileRoute } from "@tanstack/react-router";
import { Surface } from "@/components/Surface";
import { DSPage, Section, SurfaceMatrix, PropsBlock, Bar } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/surface")({
  head: () => ({
    meta: [
      { title: "Design System — Surface" },
      { name: "description", content: "Frosted glass panel for the photo cluster." },
    ],
  }),
  component: DSSurface,
});

function DSSurface() {
  return (
    <DSPage title="Surface">
      <Section title="Variants">
        <SurfaceMatrix
          rows={[
            {
              label: "Default",
              render: (surface) => (
                <Surface surface={surface} className="px-5 py-4 flex flex-col gap-2">
                  <Bar surface={surface} className="h-3 w-2/3" />
                  <Bar surface={surface} className="h-3 w-1/3" />
                </Surface>
              ),
            },
            {
              label: "Borderless",
              render: (surface) => (
                <Surface surface={surface} border={false} className="px-5 py-4 flex flex-col gap-2">
                  <Bar surface={surface} className="h-3 w-2/3" />
                  <Bar surface={surface} className="h-3 w-1/3" />
                </Surface>
              ),
            },
            {
              label: "Empty",
              render: (surface) => <Surface surface={surface} dashed className="h-16" />,
            },
          ]}
        />
      </Section>

      <Section
        title="Sizes"
        subtitle="Match the radius to the panel's size, not the screen. Use 2xl for standalone content cards with generous padding — hero keepsakes, reflection tiles, anything roomy. Drop to xl for compact, stacked rows (e.g. a list of collapsible items) where the tighter corner keeps the curve proportional to the shorter height; 2xl on a short row reads as an over-rounded pill."
      >
        <SurfaceMatrix
          rows={[
            {
              label: "xl · 12px",
              render: (surface) => <Surface surface={surface} radius="xl" className="h-14 w-20" />,
            },
            {
              label: "2xl · 16px",
              render: (surface) => <Surface surface={surface} radius="2xl" className="h-14 w-20" />,
            },
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Surface
  as?:      ElementType            // rendered tag, default: "div"
  surface?: "dark" | "light"       // default: current app mode
  radius?:  "xl" | "2xl"           // default: "2xl"
  border?:  boolean                // hairline border, default: true
  dashed?:  boolean                // empty-state: dashed border + fainter fill, default: false
  blur?:    boolean                // frosted backdrop blur, default: true
  className?: string               // caller owns padding / flex / gap
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
