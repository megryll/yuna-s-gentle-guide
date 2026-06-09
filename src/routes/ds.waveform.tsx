import { createFileRoute } from "@tanstack/react-router";
import { Waveform } from "@/components/Waveform";
import { DSPage, Section, SurfaceMatrix, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/waveform")({
  head: () => ({
    meta: [
      { title: "Design System — Waveform" },
      { name: "description", content: "Live audio amplitude bars for voice capture." },
    ],
  }),
  component: DSWaveform,
});

function DSWaveform() {
  return (
    <DSPage title="Waveform">
      <p className="mb-12 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        A row of bars driven by a Web Audio <code>AnalyserNode</code> — the live
        mic amplitude while the user speaks. With no analyser the bars rest at
        their baseline. The fill comes from <code>barClassName</code>, so the
        same component reads on either photo surface.
      </p>

      <Section title="States">
        <SurfaceMatrix
          rows={[
            {
              label: "Resting",
              render: (s) => (
                <div className="w-48">
                  <Waveform barClassName={s === "light" ? "bg-foreground" : "bg-white"} />
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Waveform
  analyser?:     AnalyserNode | null   // live audio source; omit for the resting baseline
  className?:    string                // wrapper layout (default: flex-1 h-6)
  barClassName?: string                // bar fill (default: bg-white)
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
