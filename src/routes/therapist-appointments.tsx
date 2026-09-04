import { useMemo } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { frostedPanel, TherapistPhoto } from "@/components/TherapistCard";
import { useAppMode } from "@/lib/theme-prefs";
import { sortedPast, useAppointments, type Appointment } from "@/lib/therapist-prefs";
import {
  formatLongDate,
  fromISODate,
  getTherapist,
  matchedTherapists,
  SESSION_TYPES,
} from "@/lib/therapist-data";

export const Route = createFileRoute("/therapist-appointments")({
  head: () => ({ meta: [{ title: "Past Sessions — Yuna" }] }),
  component: AppointmentsRoute,
});

// The hub stays one appointment deep — whatever is next. Everything that has
// already happened (sessions had, moved, and called off) lives here, and each
// row opens that session's own screen to add to or re-read its debrief.
function AppointmentsRoute() {
  const navigate = useNavigate();
  const router = useRouter();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const appointments = useAppointments();
  const past = useMemo(() => sortedPast(appointments), [appointments]);

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
        <PageHeader
          surface={surface}
          onBack={() =>
            router.history.canGoBack() ? router.history.back() : navigate({ to: "/therapist-hub" })
          }
        />

        {past.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 yuna-fade-in">
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full ${frostedPanel(surface)}`}
            >
              <CalendarIcon size={26} className="text-white" aria-hidden />
            </span>
            <h1 className="mt-5 font-display text-3xl leading-tight tracking-tight text-white">
              Nothing here yet
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/85 max-w-[17rem]">
              Once a session has happened, it will live here with whatever you reflected on
              afterwards.
            </p>
            <Button
              surface={surface}
              variant="secondary"
              fullWidth
              onClick={() => navigate({ to: "/therapist-hub" })}
              className="mt-8 max-w-xs"
            >
              Back to your therapist
            </Button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-8 flex flex-col gap-5 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <h1 className="font-display text-3xl tracking-tight text-white">Past sessions</h1>
            <div className="flex flex-col gap-3">
              {past.map((a) => (
                <PastRow
                  key={a.id}
                  surface={surface}
                  appointment={a}
                  onOpen={() =>
                    navigate({ to: "/therapist-appointment/$id", params: { id: a.id } })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

function PastRow({
  surface,
  appointment,
  onOpen,
}: {
  surface: "dark" | "light";
  appointment: Appointment;
  onOpen: () => void;
}) {
  const therapist = getTherapist(appointment.therapistId) ?? matchedTherapists()[0];
  const session =
    SESSION_TYPES.find((s) => s.id === appointment.sessionTypeId) ?? SESSION_TYPES[0];
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full text-left rounded-3xl ${frostedPanel(surface)} p-5 flex flex-col gap-3 active:scale-[0.99] transition-transform`}
    >
      <div className="flex items-center gap-3">
        <TherapistPhoto src={therapist.photo} size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-tight tracking-tight text-white truncate">
            {therapist.name}
          </p>
          <p className="text-xs text-white/75 truncate">{therapist.credentials}</p>
        </div>
        <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-white/75" aria-hidden />
      </div>
      <p className="text-sm text-white/75">
        {session.label} · {formatLongDate(fromISODate(appointment.dateISO))} · {appointment.time}
      </p>
      <StatusLine appointment={appointment} />
    </button>
  );
}

/** What happened to this appointment, in one line. A session that was never
 *  talked through says nothing — the row is a record, not a chore list; the
 *  debrief is still offered inside. */
function StatusLine({ appointment: a }: { appointment: Appointment }) {
  if (a.status === "cancelled")
    return <p className="text-sm text-white/75">You canceled this appointment.</p>;
  if (a.status === "rescheduled")
    return <p className="text-sm text-white/75">You moved this session to a new time.</p>;
  if (a.debriefed)
    return <p className="text-sm text-white/75">You reflected on this one with Yuna.</p>;
  return null;
}
