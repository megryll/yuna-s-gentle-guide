import { darkPanel } from "./_bg";
import { Surface } from "yuna-design-system";

// Surface is a frosted glass panel authored in white-alpha (dark cluster). On
// the dark photo it reads as a translucent plate; we stand in a photo
// panel behind it. The light variant uses ink-alpha and needs no wrapper.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-6 flex flex-col gap-4"
    >
      {children}
    </div>
  );
}

export function OnDark() {
  return (
    <Dark>
      <Surface surface="dark" className="px-5 py-4">
        <p className="text-sm font-medium text-white/90">This week</p>
        <p className="mt-1 text-sm text-white/75">
          Three quiet check-ins. You kept showing up for yourself.
        </p>
      </Surface>
      <Surface surface="dark" border={false} className="px-5 py-4">
        <p className="text-sm text-white/85">Borderless, for a softer edge.</p>
      </Surface>
    </Dark>
  );
}

export function OnLight() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Surface surface="light" className="px-5 py-4">
        <p className="text-sm font-medium text-foreground/90">This week</p>
        <p className="mt-1 text-sm text-foreground/75">
          Three quiet check-ins. You kept showing up for yourself.
        </p>
      </Surface>
      <Surface surface="light" radius="xl" className="px-5 py-3">
        <p className="text-sm text-foreground/85">A tighter corner for compact rows.</p>
      </Surface>
    </div>
  );
}

export function Empty() {
  return (
    <Dark>
      <Surface surface="dark" dashed className="h-20 grid place-items-center">
        <p className="text-sm text-white/60">Nothing saved yet</p>
      </Surface>
    </Dark>
  );
}
