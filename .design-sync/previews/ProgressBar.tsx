import { darkPanel } from "./_bg";
import { ProgressBar } from "yuna-design-system";

// ProgressBar defaults to surface="dark" (white fill), so previews sit on a
// dark photo panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-6 flex flex-col gap-5"
    >
      {children}
    </div>
  );
}

export function Default() {
  return (
    <Dark>
      <ProgressBar value={0.45} surface="dark" aria-label="Survey progress" />
    </Dark>
  );
}

export function Steps() {
  return (
    <Dark>
      <ProgressBar value={0.15} surface="dark" aria-label="Just getting started" />
      <ProgressBar value={0.55} surface="dark" aria-label="Halfway there" />
      <ProgressBar value={1} surface="dark" aria-label="All done" />
    </Dark>
  );
}

export function OnLight() {
  return (
    <div className="rounded-2xl p-6 bg-white flex flex-col gap-5">
      <ProgressBar value={0.7} surface="light" aria-label="Reflection progress" />
    </div>
  );
}
