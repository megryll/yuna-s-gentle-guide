import { useState } from "react";
import { CalendarDays, Clock, Sunrise } from "lucide-react";
import { Drawer, DrawerContent, DrawerFooter, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/Button";
import { IconMedallion } from "@/components/IconMedallion";
import { useAppMode } from "@/lib/theme-prefs";

// Prototype scheduling is illustrative — the times are fixed display values,
// not live pickers. The point is the commitment to a session; the CTA confirms
// the chosen slot.
const OPTIONS = [
  {
    id: "today",
    title: "Today at 6:00 PM",
    subtitle: "Perfect for an evening wind-down",
    icon: <Clock size={18} strokeWidth={1.8} className="text-white" aria-hidden />,
  },
  {
    id: "tomorrow",
    title: "Tomorrow morning at 8:00 AM",
    subtitle: "Start your day with clarity",
    icon: <Sunrise size={18} strokeWidth={1.8} className="text-white" aria-hidden />,
  },
  {
    id: "custom",
    title: "Choose a custom time",
    subtitle: "Pick what works best for you",
    icon: <CalendarDays size={18} strokeWidth={1.8} className="text-white" aria-hidden />,
  },
] as const;

export function ScheduleSessionDrawer({
  open,
  onOpenChange,
  onSchedule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: () => void;
}) {
  // The drawer paints the mode photo as its background, so its controls follow
  // the app's Light/Dark toggle (white-on-dark copy inverts via .theme-light).
  const surface = useAppMode();
  const [selected, setSelected] = useState<(typeof OPTIONS)[number]["id"]>("today");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="px-6 pt-8 pb-2 text-center">
          <DrawerTitle className="text-balance">Schedule a session</DrawerTitle>
          <p className="mt-3 text-sm leading-relaxed text-white/80 max-w-[18rem] mx-auto">
            Take a moment to find a quiet space where you can reflect and share openly.
          </p>
        </div>

        <div className="px-6 pt-6 flex flex-col gap-3">
          {OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              surface={surface}
              variant="card"
              selected={selected === opt.id}
              subtitle={opt.subtitle}
              leading={<IconMedallion size="sm">{opt.icon}</IconMedallion>}
              onClick={() => setSelected(opt.id)}
            >
              {opt.title}
            </Button>
          ))}
        </div>

        <DrawerFooter className="px-6 pb-8 pt-8">
          <Button surface={surface} variant="primary" fullWidth onClick={onSchedule}>
            Schedule session
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
