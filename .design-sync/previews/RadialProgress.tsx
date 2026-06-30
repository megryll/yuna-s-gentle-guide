import { RadialProgress } from "yuna-design-system";

// RadialProgress defaults to surface="dark" (white arc), so previews sit on a
// dark brand-green panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-8 grid place-items-center"
    >
      {children}
    </div>
  );
}

export function WithLabel() {
  return (
    <Dark>
      <RadialProgress surface="dark" value={0.6} size={140} aria-label="60 percent of your week complete">
        <span className="font-display text-2xl leading-none text-white">60%</span>
      </RadialProgress>
    </Dark>
  );
}

export function Progression() {
  return (
    <Dark>
      <div className="flex items-center gap-6">
        <RadialProgress surface="dark" value={0} size={88} aria-label="Not started">
          <span className="font-display text-lg leading-none text-white">0%</span>
        </RadialProgress>
        <RadialProgress surface="dark" value={0.4} size={88} aria-label="40 percent">
          <span className="font-display text-lg leading-none text-white">40%</span>
        </RadialProgress>
        <RadialProgress surface="dark" value={1} size={88} aria-label="Complete">
          <span className="font-display text-lg leading-none text-white">100%</span>
        </RadialProgress>
      </div>
    </Dark>
  );
}

export function OnLight() {
  return (
    <div className="rounded-2xl p-8 bg-white grid place-items-center">
      <RadialProgress surface="light" value={0.75} size={140} aria-label="75 percent">
        <span className="font-display text-2xl leading-none text-foreground">75%</span>
      </RadialProgress>
    </div>
  );
}
