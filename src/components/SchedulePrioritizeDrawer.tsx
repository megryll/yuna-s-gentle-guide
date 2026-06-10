import { useEffect, useState } from "react";
import { CalendarClock, CalendarDays, ChevronDown, Clock } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/Button";
import { IconMedallion } from "@/components/IconMedallion";
import { Toast } from "@/components/Toast";
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
      <DrawerContent>
        <div className="px-6 pt-12 pb-10 text-center">
          <IconMedallion className="mx-auto">
            <CalendarClock size={26} strokeWidth={1.6} className="text-white" aria-hidden />
          </IconMedallion>

          <DrawerTitle className="mt-6">
            Schedule To Prioritize Yourself
          </DrawerTitle>

          <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-5 text-center">
            <p className="text-sm text-white/75">Commit to a follow-up:</p>
            <p className="mt-2 text-lg font-semibold leading-snug text-white">
              {topic || DEFAULT_TOPIC}
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <MetaPill icon={<CalendarDays size={14} strokeWidth={1.8} aria-hidden />}>
                {FOLLOW_UP_DATE}
              </MetaPill>
              <MetaPill icon={<Clock size={14} strokeWidth={1.8} aria-hidden />}>
                {FOLLOW_UP_TIME}
              </MetaPill>
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

// Date / time pill — mirrors the Intro voice/pace control pills: a small
// secondary Button with a leading icon + value + downward chevron. The picker
// is illustrative (fixed display values, not live), so there's no onClick; the
// chevron signals the affordance and keeps the style consistent with Intro.
function MetaPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Button surface="dark" variant="secondary" size="xs" type="button" className="gap-1.5">
      <span className="text-white/70">{icon}</span>
      {children}
      <ChevronDown size={9} strokeWidth={1.5} aria-hidden className="text-white/70" />
    </Button>
  );
}

// Mounted inside Home's PhoneFrame. Fires once when the user lands back on
// Home from a session wrap-up (see requestSchedulePrompt), then clears on
// either action so a normal Home visit never re-shows it. Tapping Schedule
// closes the drawer and surfaces a confirmation toast at the top of Home.
export function SchedulePrioritizeGate() {
  const active = useSchedulePromptActive();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!confirmed) return;
    const t = window.setTimeout(() => setConfirmed(false), 3200);
    return () => window.clearTimeout(t);
  }, [confirmed]);

  return (
    <>
      <SchedulePrioritizeDrawer
        open={active}
        topic={getScheduleTopic()}
        onSchedule={() => {
          clearSchedulePrompt();
          setConfirmed(true);
        }}
        onDismiss={clearSchedulePrompt}
      />
      <ScheduleConfirmToast open={confirmed} />
    </>
  );
}

// Positioned, animated wrapper around the DS Toast — slides/fades in from the
// top edge of the phone frame. success variant is a fixed green fill (legible
// on both photos), so it needs no surface flip with app mode.
function ScheduleConfirmToast({ open }: { open: boolean }) {
  return (
    <div
      className={
        "pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-xs " +
        "transition-all duration-300 ease-out " +
        (open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2")
      }
    >
      <Toast variant="success" message="You scheduled a session." />
    </div>
  );
}
