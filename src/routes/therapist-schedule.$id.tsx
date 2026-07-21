import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Calendar as CalendarIcon, Clock, Video, ExternalLink } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { Badge } from "@/components/Badge";
import { StepDots } from "@/components/StepDots";
import { PageHeader } from "@/components/PageHeader";
import { CalendarPicker } from "@/components/CalendarPicker";
import { frostedPanel, TherapistPhoto } from "@/components/TherapistCard";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useAppMode } from "@/lib/theme-prefs";
import { setUserType } from "@/lib/user-type";
import {
  getTherapist,
  matchedTherapists,
  SESSION_TYPES,
  timesForDate,
  formatLongDate,
  fromISODate,
  toISODate,
} from "@/lib/therapist-data";
import {
  addAppointment,
  cancelAppointment,
  getAppointment,
  getAppointments,
  updateAppointment,
  type Appointment,
} from "@/lib/therapist-prefs";

export const Route = createFileRoute("/therapist-schedule/$id")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    // Reschedule an existing appointment (hub "Reschedule") — confirm updates
    // it in place instead of booking a second one.
    appt?: string;
  } => ({
    appt: (s.appt as string | undefined) || undefined,
  }),
  head: () => ({ meta: [{ title: "Schedule a Session — Yuna" }] }),
  component: ScheduleRoute,
});

// The only offering: the standard 45-minute session.
const SESSION = SESSION_TYPES[0];

function ScheduleRoute() {
  const { id } = Route.useParams();
  const { appt } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const surface = useAppMode() === "light" ? "light" : "dark";

  const therapist = getTherapist(id) ?? matchedTherapists()[0];
  const firstName = therapist.name.replace(/^Dr\.\s+/, "").split(" ")[0];

  // The appointment this screen owns: seeded by the `appt` param (reschedule),
  // or set on first confirm so the confirmation's actions edit in place.
  const [bookedId, setBookedId] = useState<string | null>(() => (getAppointment(appt) ? appt! : null));

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  // One therapist at a time: booking while another appointment is upcoming
  // asks the user to confirm swapping it out before anything is written.
  const [conflict, setConflict] = useState<Appointment | null>(null);

  const book = () => {
    if (!date || !time) return;
    const record = {
      therapistId: therapist.id,
      sessionTypeId: SESSION.id,
      dateISO: toISODate(date),
      time,
      // A new or moved timeslot always needs securing on the booking platform.
      confirmed: false,
    };
    if (bookedId) updateAppointment(bookedId, record);
    else setBookedId(addAppointment(record));
    // Someone with a booked therapist is no longer a brand-new user — flip the
    // admin toggle so it reflects (and keeps rendering) the returning state.
    setUserType("returning");
    setRequested(true);
  };

  const confirmBooking = () => {
    if (!date || !time) return;
    const existing = getAppointments().find((a) => !a.completed && a.id !== bookedId);
    if (existing) {
      setConflict(existing);
      return;
    }
    book();
  };

  const times = date ? timesForDate(date) : [];
  const step = !date ? 0 : !time ? 1 : 2;

  // Picking a date reveals the times section below the fold — bring it into
  // view once it has rendered so the user sees the next step.
  const timesRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (date) timesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [date]);

  const conflictTherapist = conflict ? getTherapist(conflict.therapistId) : null;

  const TherapistMini = (
    <div className={`flex items-center gap-3 rounded-2xl ${frostedPanel(surface)} p-3`}>
      <TherapistPhoto src={therapist.photo} size={44} />
      <div className="min-w-0">
        <p className="font-display text-lg leading-tight tracking-tight text-white truncate">{therapist.name}</p>
        <p className="text-xs text-white/75 truncate">{therapist.credentials}</p>
      </div>
    </div>
  );

  if (requested) {
    // Booking replaces this screen in history so "back" from the hub returns
    // to wherever the user was before scheduling, not a stale scheduling flow.
    const toHub = () => navigate({ to: "/therapist-hub", replace: true });
    return (
      <PhoneFrame themed>
        <div className="flex-1 flex flex-col min-h-0">
          <PageHeader surface={surface} onBack={toHub} />
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 text-white flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className={`mt-4 rounded-3xl ${frostedPanel(surface)} p-6 flex flex-col gap-5 yuna-fade-in`}>
            <div className="flex items-center gap-3">
              <Badge icon label="Reserved" />
              <h1 className="font-display text-2xl leading-tight tracking-tight text-white">
                Timeslot reserved for 24 hours
              </h1>
            </div>

            <p className="text-base leading-relaxed text-white/85">
              To secure your appointment, confirm it on {firstName}'s booking
              platform before this time tomorrow.
            </p>

            <div className="flex items-center gap-3">
              <TherapistPhoto src={therapist.photo} size={44} />
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight tracking-tight text-white truncate">{therapist.name}</p>
                <p className="text-xs text-white/75 truncate">{therapist.credentials}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <SummaryLine icon={<CalendarIcon size={16} aria-hidden />}>{date && formatLongDate(date)}</SummaryLine>
              <SummaryLine icon={<Clock size={16} aria-hidden />}>{time} · {SESSION.duration}</SummaryLine>
              <SummaryLine icon={<Video size={16} aria-hidden />}>{SESSION.label} · Video call</SummaryLine>
            </div>

            <Button surface={surface} variant="primary" fullWidth onClick={toHub}>
              Confirm on booking platform
              <ExternalLink size={16} strokeWidth={2} aria-hidden />
            </Button>
          </div>

          <Button surface={surface} variant="link" className="mx-auto mt-4" onClick={toHub}>
            I'll confirm my appointment later
          </Button>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  const confirmLabel = !date ? "Pick a date" : !time ? "Pick a time" : `Reserve timeslot · ${time}`;

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
        <PageHeader
          surface={surface}
          onBack={() =>
            router.history.canGoBack()
              ? router.history.back()
              : navigate(
                  appt
                    ? { to: "/therapist-hub" }
                    : { to: "/therapist-profile/$id", params: { id: therapist.id } },
                )
          }
          center={<StepDots surface={surface} count={3} current={step} aria-label={`Step ${step + 1} of 3`} />}
        />

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-4 flex flex-col gap-6 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="text-center">
            <h1 className="font-display text-3xl tracking-tight text-white">Schedule a session</h1>
            <p className="mt-1.5 text-sm text-white/85">
              Sessions are {SESSION.duration.replace(" min", " minutes")} over video. Pick a time that works.
            </p>
          </div>

          {TherapistMini}

          <section>
            <Label>Pick a date</Label>
            <div className={`rounded-3xl ${frostedPanel(surface)} p-4`}>
              <CalendarPicker
                surface={surface}
                value={date}
                onChange={(d) => {
                  setDate(d);
                  setTime(null);
                }}
                isAvailable={(d) => timesForDate(d).length > 0}
              />
            </div>
          </section>

          {date && (
            <section ref={timesRef}>
              <Label>Times for {formatLongDate(date)}</Label>
              {times.length === 0 ? (
                <p className="text-sm text-white/75">No times available. Try another day.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {times.map((t) => (
                    <Tag key={t} surface={surface} selected={time === t} onClick={() => setTime(t)}>
                      {t}
                    </Tag>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="shrink-0 px-6 pb-10 pt-3">
          <Button surface={surface} variant="primary" fullWidth disabled={!date || !time} onClick={confirmBooking}>
            {confirmLabel}
          </Button>
        </footer>
      </div>

      {/* One therapist at a time: swapping requires an explicit confirm. */}
      <Drawer open={!!conflict} onOpenChange={(v) => !v && setConflict(null)}>
        <DrawerContent>
          <DrawerHeader className="px-6 pt-3 pb-2 text-left">
            <DrawerTitle>Book with {firstName} instead?</DrawerTitle>
            <DrawerDescription className="mt-1">
              You can work with one therapist at a time. Booking this session will
              cancel your appointment with {conflictTherapist?.name ?? "your other therapist"}
              {conflict ? ` on ${formatLongDate(fromISODate(conflict.dateISO))}` : ""}.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="px-6 pb-8 gap-2">
            <Button
              surface={surface}
              variant="primary"
              fullWidth
              onClick={() => {
                if (conflict) cancelAppointment(conflict.id);
                setConflict(null);
                book();
              }}
            >
              Cancel it and book with {firstName}
            </Button>
            <Button surface={surface} variant="link" className="mx-auto" onClick={() => setConflict(null)}>
              Keep my current appointment
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PhoneFrame>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-uppercase font-semibold uppercase tracking-[0.12em] text-white/75 mb-3">{children}</p>;
}

function SummaryLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-secondary-green shrink-0">{icon}</span>
      <span className="text-sm text-white/90">{children}</span>
    </div>
  );
}
