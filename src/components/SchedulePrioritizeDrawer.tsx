import { CalendarClock, CalendarDays, Clock, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/Button";
import {
  clearSchedulePrompt,
  getScheduleTopic,
  useSchedulePromptActive,
} from "@/lib/schedule-prompt";

// Default follow-up topic when the wrap-up didn't surface a session theme —
// kept on-theme with the prototype's stress-and-planning sessions.
const DEFAULT_TOPIC = "Managing stress and overwhelm";

// Prototype scheduling is illustrative — the date/time are fixed display
// values, not live pickers. The point of the screen is the commitment to a
// follow-up, which the Schedule CTA confirms.
const FOLLOW_UP_DATE = "Tue, May 28";
const FOLLOW_UP_TIME = "08:00 PM";

export function SchedulePrioritizeDrawer({
  open,
  topic,
  onSchedule,
  onDismiss,
}: {
  open: boolean;
  topic?: string;
  onSchedule: () => void;
  onDismiss: () => void;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) onDismiss();
      }}
    >
      <DrawerContent mode="dark" className="rounded-t-[1.5rem]">
        <div className="relative px-8 pt-12 pb-12 text-center">
          <div className="absolute right-4 top-4">
            <Button
              surface="dark"
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              aria-label="Close"
            >
              <X size={18} strokeWidth={1.6} aria-hidden />
            </Button>
          </div>

          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
            <CalendarClock size={26} strokeWidth={1.6} className="text-white" aria-hidden />
          </span>

          <DrawerTitle className="mt-6 font-display font-normal text-3xl leading-[1.12] tracking-tight text-white">
            Schedule To Prioritize Yourself
          </DrawerTitle>

          <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-5 text-left">
            <p className="font-display italic text-[15px] text-white/75">Commit to a follow-up:</p>
            <p className="mt-2 text-[18px] font-semibold leading-snug text-white">
              {topic || DEFAULT_TOPIC}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <span className="text-[15px] font-semibold text-white">Date</span>
              <div className="flex flex-1 justify-end gap-2">
                <Chip icon={<CalendarDays size={14} strokeWidth={1.8} aria-hidden />}>
                  {FOLLOW_UP_DATE}
                </Chip>
                <Chip icon={<Clock size={14} strokeWidth={1.8} aria-hidden />}>
                  {FOLLOW_UP_TIME}
                </Chip>
              </div>
            </div>
          </div>

          <Button
            surface="light"
            variant="primary"
            fullWidth
            className="mt-10"
            onClick={onSchedule}
          >
            Schedule
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[13px] text-white/85">
      <span className="text-white/70">{icon}</span>
      {children}
    </span>
  );
}

// Mounted inside Home's PhoneFrame. Fires once when the user lands back on
// Home from a session wrap-up (see requestSchedulePrompt), then clears on
// either action so a normal Home visit never re-shows it.
export function SchedulePrioritizeGate() {
  const active = useSchedulePromptActive();
  return (
    <SchedulePrioritizeDrawer
      open={active}
      topic={getScheduleTopic()}
      onSchedule={clearSchedulePrompt}
      onDismiss={clearSchedulePrompt}
    />
  );
}
