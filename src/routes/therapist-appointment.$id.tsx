import { useEffect, useMemo } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronRight, MessageCircle, MessageCirclePlus } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { frostedPanel, TherapistPhoto } from "@/components/TherapistCard";
import { useAppMode } from "@/lib/theme-prefs";
import { useStartChat } from "@/lib/chat-launch";
import { useAppointments, type Appointment } from "@/lib/therapist-prefs";
import { upsertSession } from "@/lib/sessions";
import {
  appointmentConversations,
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

  const conversations = useMemo(() => {
    if (!appointment) return [];
    const t = getTherapist(appointment.therapistId) ?? matchedTherapists()[0];
    return appointmentConversations(appointment, firstName(t));
  }, [appointment]);
  useEffect(() => {
    for (const g of conversations) upsertSession(g.session);
  }, [conversations]);

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

  // A debrief that hasn't happened yet is still a guided session, just one that
  // starts rather than opens.
  const offerDebrief = appointment.status === "completed" && !appointment.debriefed;

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

          {/* Every guided conversation this appointment has: the ones already
              held, and the debrief still on offer. They're the same kind of
              thing, so they read as one list. */}
          {(conversations.length > 0 || offerDebrief) && (
            <section>
              <SectionLabel>Guided sessions</SectionLabel>
              <div className={`rounded-3xl ${frostedPanel(surface)} px-5 py-4 flex flex-col gap-3.5`}>
                {conversations.map((g) => (
                  <GuidedRow
                    key={g.session.id}
                    label={g.session.title}
                    meta={g.session.date}
                    onClick={() => navigate({ to: "/sessions/$id", params: { id: g.session.id } })}
                  />
                ))}
                {offerDebrief && (
                  <GuidedRow label="Debrief with Yuna" meta="Start" pending onClick={openDebrief} />
                )}
              </div>
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

/** A guided conversation in the list. One that already happened is dated and
 *  quiet; one still on offer carries the add glyph and reads as an action, so
 *  the two are told apart without a status line. */
function GuidedRow({
  label,
  meta,
  pending = false,
  onClick,
}: {
  label: string;
  meta: string;
  pending?: boolean;
  onClick: () => void;
}) {
  const Icon = pending ? MessageCirclePlus : MessageCircle;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 text-left active:opacity-70 transition-opacity"
    >
      <Icon
        size={16}
        strokeWidth={1.75}
        className={`shrink-0 ${pending ? "text-white" : "text-white/75"}`}
        aria-hidden
      />
      <span
        className={`min-w-0 flex-1 truncate text-sm ${pending ? "font-semibold text-white" : "text-white/85"}`}
      >
        {label}
      </span>
      <span className={`shrink-0 text-xs ${pending ? "text-white" : "text-white/75"}`}>{meta}</span>
      <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-white/75" aria-hidden />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75 mb-3">
      {children}
    </p>
  );
}
