import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Calendar as CalendarIcon, Check, Clock, Video } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Divider } from "@/components/Divider";
import { Toast, ToastViewport } from "@/components/Toast";
import { YunaExplains } from "@/components/YunaExplains";
import { TherapistCard, TherapistPhoto, frostedPanel } from "@/components/TherapistCard";
import { useAppMode } from "@/lib/theme-prefs";
import { useTransientToast } from "@/lib/use-transient-toast";
import { useStartChat } from "@/lib/chat-launch";
import {
  cancelAppointment,
  toggleSaved,
  useAppointments,
  useSavedIds,
  type Appointment,
} from "@/lib/therapist-prefs";
import {
  getTherapist,
  matchedTherapists,
  formatLongDate,
  fromISODate,
  summaryPdfUrl,
  GUIDED_DEBRIEF_TITLE,
  SESSION_TYPES,
  type Therapist,
} from "@/lib/therapist-data";

export const Route = createFileRoute("/therapist-hub")({
  head: () => ({ meta: [{ title: "Your Therapist — Yuna" }] }),
  component: HubRoute,
});

function firstName(t: Therapist): string {
  return t.name.split(" ")[0];
}

function HubRoute() {
  const navigate = useNavigate();
  const startChat = useStartChat();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const appointments = useAppointments();
  const savedIds = useSavedIds();
  const { message: toast, show: flashToast, dismiss } = useTransientToast();

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => !a.completed)
        .slice()
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    [appointments],
  );
  const needsDebrief = useMemo(
    () => appointments.filter((a) => a.completed && !a.debriefed),
    [appointments],
  );
  // The share offer targets the next call; the common case is one appointment.
  const next = upcoming[0];
  const nextTherapist = next ? getTherapist(next.therapistId) : null;

  const savedList = useMemo(
    () => savedIds.map((id) => getTherapist(id)).filter(Boolean) as Therapist[],
    [savedIds],
  );

  const openDebrief = (a: Appointment) => {
    const t = getTherapist(a.therapistId) ?? matchedTherapists()[0];
    startChat({ guided: GUIDED_DEBRIEF_TITLE, flow: "therapist-debrief", therapist: t.id });
  };

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
        <PageHeader surface={surface} onBack={() => navigate({ to: "/tools" })} />

        {appointments.length === 0 ? (
          <EmptyState surface={surface} onFind={() => navigate({ to: "/therapist-recommendations" })} />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-8 flex flex-col gap-7 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <h1 className="font-display text-3xl tracking-tight text-white">Your therapist</h1>

            {needsDebrief.length > 0 && (
              <section>
                <SectionLabel>After your session</SectionLabel>
                <div className="flex flex-col gap-3">
                  {needsDebrief.map((a) => (
                    <DebriefCard key={a.id} surface={surface} appointment={a} onDebrief={() => openDebrief(a)} />
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <SectionLabel>Upcoming</SectionLabel>
                <div className="flex flex-col gap-3">
                  {upcoming.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      surface={surface}
                      appointment={a}
                      onJoin={() => flashToast("Your video link is in your confirmation email.")}
                      onReschedule={() =>
                        navigate({
                          to: "/therapist-schedule/$id",
                          params: { id: a.therapistId },
                          search: { appt: a.id },
                        })
                      }
                      onCancel={() => {
                        cancelAppointment(a.id);
                        flashToast("Your appointment has been canceled.");
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {next && nextTherapist && (
              <section>
                <SectionLabel>Before you meet</SectionLabel>
                <YunaExplains surface={surface}>
                  Want {firstName(nextTherapist)} to know where you're starting from? You can share
                  a short summary of our conversations. You choose exactly what they see.
                </YunaExplains>
                {next.summaryShared ? (
                  <div className="mt-3 flex flex-col gap-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-white/85">
                      <Check size={16} strokeWidth={2.25} className="text-secondary-green" aria-hidden />
                      Summary shared with {firstName(nextTherapist)}
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        surface={surface}
                        variant="secondary"
                        fullWidth
                        onClick={() =>
                          window.open(summaryPdfUrl(nextTherapist), "_blank", "noopener")
                        }
                      >
                        View PDF
                      </Button>
                      <Button
                        surface={surface}
                        variant="secondary"
                        fullWidth
                        onClick={() =>
                          flashToast("Summary refreshed with your latest conversations.")
                        }
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    surface={surface}
                    variant="secondary"
                    fullWidth
                    className="mt-3"
                    onClick={() =>
                      navigate({
                        to: "/therapist-share-summary/$id",
                        params: { id: next.therapistId },
                        search: { appt: next.id },
                      })
                    }
                  >
                    Share a summary with {firstName(nextTherapist)}
                  </Button>
                )}
              </section>
            )}

            <section>
              <Divider surface={surface} label="Keep exploring" />
              <p className="mt-4 text-sm leading-snug text-white/75">
                It's completely normal to talk with a few therapists before choosing one.
              </p>
              {savedList.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  {savedList.map((t) => (
                    <TherapistCard
                      key={t.id}
                      surface={surface}
                      variant="list"
                      name={t.name}
                      credentials={t.credentials}
                      photo={t.photo}
                      saved={savedIds.includes(t.id)}
                      onToggleSave={() => toggleSaved(t.id)}
                      onView={() => navigate({ to: "/therapist-profile/$id", params: { id: t.id } })}
                    />
                  ))}
                </div>
              )}
              <Button
                surface={surface}
                variant="secondary"
                fullWidth
                className="mt-4"
                onClick={() => navigate({ to: "/therapist-recommendations" })}
              >
                Browse more therapists
              </Button>
            </section>
          </div>
        )}

        {toast && (
          <ToastViewport>
            <Toast
              surface={surface}
              variant="neutral"
              message={toast}
              onDismiss={dismiss}
              className="yuna-fade-in"
            />
          </ToastViewport>
        )}
      </div>

    </PhoneFrame>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75 mb-3">{children}</p>
  );
}

function TherapistMini({ therapist }: { therapist: Therapist }) {
  return (
    <div className="flex items-center gap-3">
      <TherapistPhoto src={therapist.photo} size={44} />
      <div className="min-w-0">
        <p className="font-display text-lg leading-tight tracking-tight text-white truncate">
          {therapist.name}
        </p>
        <p className="text-xs text-white/75 truncate">{therapist.credentials}</p>
      </div>
    </div>
  );
}

function SummaryLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-secondary-green shrink-0">{icon}</span>
      <span className="text-sm text-white/90">{children}</span>
    </div>
  );
}

function AppointmentCard({
  surface,
  appointment,
  onJoin,
  onReschedule,
  onCancel,
}: {
  surface: "dark" | "light";
  appointment: Appointment;
  onJoin: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const therapist = getTherapist(appointment.therapistId) ?? matchedTherapists()[0];
  const session =
    SESSION_TYPES.find((s) => s.id === appointment.sessionTypeId) ?? SESSION_TYPES[0];
  return (
    <div className={`rounded-3xl ${frostedPanel(surface)} p-5 flex flex-col gap-4`}>
      <TherapistMini therapist={therapist} />
      <div className="flex flex-col gap-3">
        <SummaryLine icon={<CalendarIcon size={16} aria-hidden />}>
          {formatLongDate(fromISODate(appointment.dateISO))}
        </SummaryLine>
        <SummaryLine icon={<Clock size={16} aria-hidden />}>
          {appointment.time} · {session.duration}
        </SummaryLine>
        <SummaryLine icon={<Video size={16} aria-hidden />}>
          {session.label} · Video call
        </SummaryLine>
      </div>
      <div className="flex flex-col gap-2">
        <Button surface={surface} variant="primary" fullWidth onClick={onJoin}>
          Join video call
        </Button>
        <div className="flex items-center gap-3">
          <Button surface={surface} variant="secondary" fullWidth onClick={onReschedule}>
            Reschedule
          </Button>
          <Button surface={surface} variant="secondary" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function DebriefCard({
  surface,
  appointment,
  onDebrief,
}: {
  surface: "dark" | "light";
  appointment: Appointment;
  onDebrief: () => void;
}) {
  const therapist = getTherapist(appointment.therapistId) ?? matchedTherapists()[0];
  const session =
    SESSION_TYPES.find((s) => s.id === appointment.sessionTypeId) ?? SESSION_TYPES[0];
  return (
    <div className={`rounded-3xl ${frostedPanel(surface)} p-5 flex flex-col gap-4`}>
      <TherapistMini therapist={therapist} />
      <p className="text-sm leading-snug text-white/85">
        You had your {session.label.toLowerCase()} with {firstName(therapist)} on{" "}
        {formatLongDate(fromISODate(appointment.dateISO))}. How did it go?
      </p>
      <Button surface={surface} variant="primary" fullWidth onClick={onDebrief}>
        Debrief with Yuna
      </Button>
    </div>
  );
}

function EmptyState({ surface, onFind }: { surface: "dark" | "light"; onFind: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 yuna-fade-in">
      <span className={`flex h-16 w-16 items-center justify-center rounded-full ${frostedPanel(surface)}`}>
        <CalendarIcon size={26} className="text-white" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-3xl leading-tight tracking-tight text-white">
        No sessions booked yet
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/85 max-w-[17rem]">
        When you schedule a call with a therapist, it will live here.
      </p>
      <Button surface={surface} variant="primary" fullWidth onClick={onFind} className="mt-8 max-w-xs">
        Find a therapist
      </Button>
    </div>
  );
}
