import { Waveform } from "yuna-design-system";

// Waveform is audio-driven: with a live AnalyserNode each of its 36 bars
// animates to the mic signal. These cards render statically with no audio, so
// they show the component's genuine resting state — the quiet, even bars it
// holds when nothing is being recorded. Bars default to white, so previews sit
// on a dark brand-green panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6 flex flex-col gap-5"
    >
      {children}
    </div>
  );
}

export function Resting() {
  return (
    <Dark>
      <div className="flex items-center h-8">
        <Waveform />
      </div>
    </Dark>
  );
}

export function InAComposer() {
  return (
    <Dark>
      <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-3">
        <Waveform className="flex-1 h-6" />
      </div>
    </Dark>
  );
}

export function OnLight() {
  return (
    <div className="rounded-2xl p-6 bg-white">
      <div className="flex items-center h-8">
        <Waveform barClassName="bg-foreground" />
      </div>
    </div>
  );
}
