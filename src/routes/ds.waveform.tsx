import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Waveform } from "@/components/Waveform";
import { DSPage, Section, SurfaceMatrix, PropsBlock } from "@/ds-docs/surface";

// Doc-only stand-in for a live mic AnalyserNode. Produces speech-like,
// time-varying time-domain data so the real Waveform animates on the DS page
// without microphone access. Exercises the component's actual RAF render path.
function useSimulatedAnalyser() {
  return useMemo(() => {
    const fftSize = 1024;
    return {
      fftSize,
      getByteTimeDomainData(buf: Uint8Array) {
        const t = performance.now() / 1000;
        // Slow swell-and-pause envelope, like natural speech cadence.
        const env = (Math.sin(t * 2.3) * 0.5 + 0.5) * (Math.sin(t * 0.7) * 0.3 + 0.6);
        for (let i = 0; i < buf.length; i++) {
          const pos = i / buf.length;
          // Spatial term varies amplitude across the bar row so it reads as a
          // shape, not a flat block; the time term keeps every bar moving.
          const spatial = 0.6 + 0.4 * Math.sin(pos * Math.PI * 5 + t * 1.5);
          const sample =
            (Math.sin(pos * Math.PI * 16 + t * 12) +
              Math.sin(pos * Math.PI * 46 + t * 5) * 0.4) *
            env *
            spatial;
          buf[i] = Math.round(128 + Math.max(-1, Math.min(1, sample)) * 115);
        }
      },
    } as unknown as AnalyserNode;
  }, []);
}

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
  const analyser = useSimulatedAnalyser();
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
            {
              label: "Active",
              render: (s) => (
                <div className="w-48">
                  <Waveform
                    analyser={analyser}
                    barClassName={s === "light" ? "bg-foreground" : "bg-white"}
                  />
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
