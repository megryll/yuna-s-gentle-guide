import { darkPanel } from "./_bg";
import { StepDots } from "yuna-design-system";

// StepDots defaults to surface="dark" (photo cluster). Dot colors are chosen
// by surface directly, so dark previews sit on a dark brand panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-6 flex flex-col gap-4 items-start"
    >
      {children}
    </div>
  );
}

export function Progress() {
  return (
    <Dark>
      <StepDots surface="dark" count={5} current={0} aria-label="Step 1 of 5" />
      <StepDots surface="dark" count={5} current={2} aria-label="Step 3 of 5" />
      <StepDots surface="dark" count={5} current={4} aria-label="Step 5 of 5" />
    </Dark>
  );
}

export function OnLight() {
  return (
    <div className="flex flex-col gap-4 items-start p-2">
      <StepDots surface="light" count={4} current={1} aria-label="Step 2 of 4" />
      <StepDots surface="light" count={4} current={3} aria-label="Step 4 of 4" />
    </div>
  );
}
