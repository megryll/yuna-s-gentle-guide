import { darkPanel } from "./_bg";
import { IconMedallion } from "yuna-design-system";
import { CalendarClock, Wind, Sparkles, Moon } from "lucide-react";

// A frosted plate authored in white-on-dark (bg-white/10 ring-white/15), so the
// previews sit on the dark photo cluster it's designed for.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-8 flex items-center justify-center gap-5"
    >
      {children}
    </div>
  );
}

export function Sizes() {
  return (
    <Dark>
      <IconMedallion size="sm">
        <Sparkles size={18} strokeWidth={1.7} className="text-white" aria-hidden />
      </IconMedallion>
      <IconMedallion size="md">
        <Wind size={24} strokeWidth={1.6} className="text-white" aria-hidden />
      </IconMedallion>
      <IconMedallion size="lg">
        <CalendarClock size={26} strokeWidth={1.6} className="text-white" aria-hidden />
      </IconMedallion>
      <IconMedallion size="xl">
        <Moon size={32} strokeWidth={1.5} className="text-white" aria-hidden />
      </IconMedallion>
    </Dark>
  );
}

export function Labelled() {
  return (
    <Dark>
      <IconMedallion size="lg" label="Scheduled session">
        <CalendarClock size={26} strokeWidth={1.6} className="text-white" aria-hidden />
      </IconMedallion>
    </Dark>
  );
}
