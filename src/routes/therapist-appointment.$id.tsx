import { useMemo } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { frostedPanel, TherapistPhoto } from "@/components/TherapistCard";
import { useAppMode } from "@/lib/theme-prefs";
import { useStartChat } from "@/lib/chat-launch";
import { useAppointments, type Appointment } from "@/lib/therapist-prefs";
import {
  formatLongDate,
  fromISODate,
  getTherapist,
  matchedTherapists,
  GUIDED_DEBRIEF_TITLE,
  SESSION_TYPES,
  type Therapist,
} from "@/lib/therapist-data";

export const Route = createFileRoute("/therapist-appointment/$id")({
  head: () => ({ meta: [{ title: "Your Session — Yuna" }] }),
  component: AppointmentRoute,
});

function firstName(t: Therapist): string {
  return t.name.split(" ")[0];
}

// One session's own screen, reached from the past-sessions list. It's where a
// debrief gets added if it never happened, and where it's re-read (or added
// to) if it did.
function AppointmentRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const startChat = useStartChat();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const appointments = useAppointments();
  const appointment = useMemo(
    () => appointments.find((a) => a.id === id) ?? null,
    [appointments, id],
  );
  const movedTo = useMemo(
    () => appointments.find((a) => a.id === appointment?.rescheduledToId) ?? null,
    [appointments, appointment],
  );

  const back = () =>
    router.history.canGoBack()
      ? router.history.back()
      : navigate({ to: "/therapist-appointments" });

  if (!appointment) {
    return (
      <PhoneFrame themed>
        <div className="flex-1 flex flex-col min-h-0">
          <PageHeader surface={surface} onBack={back} />
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <h1 className="font-display text-3xl leading-tight tracking-tight text-white">
              We can't find that session
            </h1>
            <Button
              surface={surface}
              variant="secondary"
              fullWidth
              className="mt-8 max-w-xs"
              onClick={() => navigate({ to: "/therapist-appointments" })}
            >
              See past sessions
            </Button>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  const therapist = getTherapist(appointment.therapistId) ?? matchedTherapists()[0];
  const session =
    SESSION_TYPES.find((s) => s.id === appointment.sessionTypeId) ?? SESSION_TYPES[0];
  const name = firstName(therapist);
  const debrief = appointment.debrief ?? [];

  const openDebrief = () =>
    startChat({
      guided: GUIDED_DEBRIEF_TITLE,
      flow: "therapist-debrief",
      therapist: therapist.id,
      appt: appointment.id,
    });
  const rebook = () =>
    navigate({ to: "/therapist-schedule/$id", params: { id: therapist.id } });

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
        <PageHeader surface={surface} onBack={back} />

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-8 flex flex-col gap-6 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div>
            <h1 className="font-display text-3xl leading-tight tracking-tight text-white">
              {formatLongDate(fromISODate(appointment.dateISO))}
            </h1>
            <p className="mt-1 text-sm text-white/75">
              {appointment.time} · {session.duration} · Video call
            </p>
          </div>

          <div className={`rounded-3xl ${frostedPanel(surface)} p-5 flex items-center gap-3`}>
            <TherapistPhoto src={therapist.photo} size={44} />
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight tracking-tight text-white truncate">
                {therapist.name}
              </p>
              <p className="text-xs text-white/75 truncate">{therapist.credentials}</p>
            </div>
          </div>

          {appointment.status === "cancelled" && (
            <p className="text-sm leading-snug text-white/85">
              You canceled this appointment. Whenever you're ready, you can pick a new time.
            </p>
          )}

          {appointment.status === "rescheduled" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-snug text-white/85">
                You moved this session
                {movedTo ? ` to ${formatLongDate(fromISODate(movedTo.dateISO))}` : ""}.
              </p>
              {movedTo && (
                <Button
                  surface={surface}
                  variant="secondary"
                  fullWidth
                  onClick={() =>
                    movedTo.status === "booked"
                      ? navigate({ to: "/therapist-hub" })
                      : navigate({
                          to: "/therapist-appointment/$id",
                          params: { id: movedTo.id },
                        })
                  }
                >
                  See the session it moved to
                </Button>
              )}
            </div>
          )}

          {appointment.status === "completed" && (
            <section className="flex flex-col gap-4">
              <SectionLabel>{debrief.length > 0 ? "Your reflection" : "After your session"}</SectionLabel>
              {debrief.length === 0 ? (
                <>
                  <p className="text-sm leading-snug text-white/85">
                    You had your {session.label.toLowerCase()} with {name}. It's not too late to
                    talk it through, however long ago it was.
                  </p>
                  <Button surface={surface} variant="primary" fullWidth onClick={openDebrief}>
                    Debrief with Yuna
                  </Button>
                </>
              ) : (
                <>
                  <div className={`rounded-3xl ${frostedPanel(surface)} p-5 flex flex-col gap-5`}>
                    {debrief.map((entry, i) => (
                      <div key={`${entry.atISO}-${i}`}>
                        <p className="text-sm leading-snug text-white/75">{entry.question}</p>
                        <p className="mt-2 text-base leading-snug text-white">{entry.answer}</p>
                      </div>
                    ))}
                  </div>
                  <Button surface={surface} variant="secondary" fullWidth onClick={openDebrief}>
                    Add to this reflection
                  </Button>
                </>
              )}
            </section>
          )}

          {appointment.status !== "rescheduled" && (
            <section>
              <SectionLabel>Next step</SectionLabel>
              <Button surface={surface} variant="primary" fullWidth onClick={rebook}>
                Book another session with {name}
              </Button>
            </section>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75 mb-3">
      {children}
    </p>
  );
}
