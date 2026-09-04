import { useEffect, useMemo } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Calendar as CalendarIcon, ChevronRight, MessageCircle } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { frostedPanel, TherapistPhoto } from "@/components/TherapistCard";
import { useAppMode } from "@/lib/theme-prefs";
import { sortedPast, useAppointments, type Appointment } from "@/lib/therapist-prefs";
import { upsertSession } from "@/lib/sessions";
import {
  appointmentConversations,
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

  // An appointment carries its own guided conversations (they persist with it);
  // the session list doesn't survive a reload, so put them back before a row
  // can be tapped through to the session detail screen.
  useEffect(() => {
    for (const a of past)
      for (const g of appointmentConversations(a, therapistName(a))) upsertSession(g.session);
  }, [past]);

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
                  onOpenSession={(id) => navigate({ to: "/sessions/$id", params: { id } })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

function therapistName(a: Appointment): string {
  return (getTherapist(a.therapistId) ?? matchedTherapists()[0]).name.split(" ")[0];
}

function PastRow({
  surface,
  appointment,
  onOpen,
  onOpenSession,
}: {
  surface: "dark" | "light";
  appointment: Appointment;
  onOpen: () => void;
  onOpenSession: (sessionId: string) => void;
}) {
  const therapist = getTherapist(appointment.therapistId) ?? matchedTherapists()[0];
  const session =
    SESSION_TYPES.find((s) => s.id === appointment.sessionTypeId) ?? SESSION_TYPES[0];
  const guided = appointmentConversations(appointment, therapist.name.split(" ")[0]);
  return (
    <div className={`rounded-3xl ${frostedPanel(surface)} p-5 flex flex-col gap-3`}>
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left flex flex-col gap-3 active:opacity-80 transition-opacity"
      >
        <span className="flex items-center gap-3">
          <TherapistPhoto src={therapist.photo} size={44} />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg leading-tight tracking-tight text-white truncate">
              {therapist.name}
            </span>
            <span className="block text-xs text-white/75 truncate">{therapist.credentials}</span>
          </span>
          <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-white/75" aria-hidden />
        </span>
        <span className="block text-sm text-white/75">
          {session.label} · {formatLongDate(fromISODate(appointment.dateISO))} · {appointment.time}
        </span>
        {/* Only a cancellation changes what the row means; a session talked
            through or moved reads from the detail screen. */}
        {appointment.status === "cancelled" && (
          <span className="block text-sm font-semibold text-alert-orange">Cancelled</span>
        )}
      </button>

      {/* The guided conversations held around this appointment. Their own
          buttons, so they open the session rather than the appointment. */}
      {guided.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-white/15 pt-3">
          {guided.map((g) => (
            <button
              key={g.session.id}
              type="button"
              onClick={() => onOpenSession(g.session.id)}
              className="flex items-center gap-2.5 text-left active:opacity-70 transition-opacity"
            >
              <MessageCircle
                size={16}
                strokeWidth={1.75}
                className="shrink-0 text-white/75"
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm text-white/85">
                {g.session.title}
              </span>
              <ChevronRight
                size={16}
                strokeWidth={2}
                className="shrink-0 text-white/75"
                aria-hidden
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
