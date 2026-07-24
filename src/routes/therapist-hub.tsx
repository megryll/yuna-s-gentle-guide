import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Calendar as CalendarIcon, ExternalLink, FileText } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { HomeCardItem } from "@/components/HomeCards";
import { PageHeader } from "@/components/PageHeader";
import { Divider } from "@/components/Divider";
import { Toast, ToastViewport } from "@/components/Toast";
import { Confetti } from "@/components/Confetti";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { TherapistCard, TherapistPhoto, frostedPanel } from "@/components/TherapistCard";
import { useAppMode } from "@/lib/theme-prefs";
import { useTransientToast } from "@/lib/use-transient-toast";
import { useStartChat } from "@/lib/chat-launch";
import { consumeBookingCelebration, useBookingCelebration } from "@/lib/session-dev";
import {
  cancelAppointment,
  toggleSaved,
  updateAppointment,
  useAppointments,
  useSavedIds,
  type Appointment,
} from "@/lib/therapist-prefs";
import {
  getTherapist,
  matchedTherapists,
  formatLongDate,
  fromISODate,
  GUIDED_DEBRIEF_TITLE,
  GUIDED_PREP_TITLE,
  prepHomeCard,
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

// Simulated wait while the therapist's booking platform loads.
const HANDOFF_MS = 2000;

function HubRoute() {
  const navigate = useNavigate();
  const router = useRouter();
  const startChat = useStartChat();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const appointments = useAppointments();
  const savedIds = useSavedIds();
  const { message: toast, show: flashToast, dismiss } = useTransientToast();
  // Securing the appointment is the milestone of this whole flow, so it gets a
  // moment rather than a toast: confetti over the frame plus a drawer that
  // names what they just did. `burstKey` remounts the cascade each time.
  const [celebrated, setCelebrated] = useState<Appointment | null>(null);
  const [burstKey, setBurstKey] = useState(0);

  const celebrate = (a: Appointment) => {
    setCelebrated(a);
    setBurstKey((k) => k + 1);
  };

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
  // Once the debrief is done, a completed appointment settles into the past
  // record rather than vanishing from the hub.
  const past = useMemo(
    () =>
      appointments
        .filter((a) => a.completed && a.debriefed)
        .slice()
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [appointments],
  );
  // With nothing on the calendar, the hub pivots to rebooking: the most recent
  // completed session names the therapist the next-session tile books with.
  const lastCompleted = useMemo(
    () =>
      appointments
        .filter((a) => a.completed)
        .slice()
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0] ?? null,
    [appointments],
  );
  const rebookTherapist =
    upcoming.length === 0 && lastCompleted ? getTherapist(lastCompleted.therapistId) : null;
  const celebratedTherapist = celebrated
    ? getTherapist(celebrated.therapistId) ?? matchedTherapists()[0]
    : null;

  // The share offer targets the next call; the common case is one appointment.
  const next = upcoming[0];
  const nextTherapist = next ? getTherapist(next.therapistId) : null;

  // EngineerSidebar "Booking confirmed" chip: replay the celebration for the
  // next appointment without waiting out the booking-platform handoff.
  const celebrationSignal = useBookingCelebration();
  useEffect(() => {
    if (!celebrationSignal) return;
    consumeBookingCelebration();
    if (next) celebrate(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrationSignal]);

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
        <PageHeader
          surface={surface}
          onBack={() =>
            router.history.canGoBack() ? router.history.back() : navigate({ to: "/tools" })
          }
        />

        {appointments.length === 0 ? (
          <EmptyState surface={surface} onFind={() => navigate({ to: "/therapist-recommendations" })} />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-8 flex flex-col gap-7 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Once nothing is on the calendar the page is a record + next step,
                not a schedule — the title follows. */}
            <h1 className="font-display text-3xl tracking-tight text-white">
              {upcoming.length > 0 ? "Upcoming Appointments" : "Your Therapist"}
            </h1>

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
                <div className="flex flex-col gap-3">
                  {upcoming.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      surface={surface}
                      appointment={a}
                      onJoin={() => flashToast("Your video link is in your confirmation email.")}
                      onConfirm={() => {
                        updateAppointment(a.id, { confirmed: true });
                        celebrate(a);
                      }}
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

            {rebookTherapist && lastCompleted && (
              <section>
                <SectionLabel>Next step</SectionLabel>
                <PrepareCard
                  surface={surface}
                  icon={<CalendarIcon size={20} strokeWidth={1.75} className="text-white" aria-hidden />}
                  title={`Book your next session with ${firstName(rebookTherapist)}`}
                  body={`One session is a great start. If ${firstName(rebookTherapist)} felt like a good fit, you can grab another time whenever you're ready.`}
                  cta="See available times"
                  onAction={() =>
                    navigate({
                      to: "/therapist-schedule/$id",
                      params: { id: rebookTherapist.id },
                    })
                  }
                />
              </section>
            )}

            {next && nextTherapist && (
              <section>
                <SectionLabel>Prepare for your session</SectionLabel>
                <div className="flex flex-col gap-3">
                  <HomeCardItem
                    card={prepHomeCard(next)}
                    onClick={() =>
                      startChat({
                        guided: GUIDED_PREP_TITLE,
                        flow: "therapist-prep",
                        therapist: next.therapistId,
                      })
                    }
                  />
                  <PrepareCard
                    surface={surface}
                    icon={<FileText size={20} strokeWidth={1.75} className="text-white" aria-hidden />}
                    title={`Share your Yuna data summary with ${firstName(nextTherapist)}`}
                    body={`Give ${firstName(nextTherapist)} a head start by sharing a high-level summary of what we've discussed, and any assessments you've taken.`}
                    cta="Preview summary"
                    onAction={() =>
                      navigate({
                        to: "/therapist-share-summary/$id",
                        params: { id: next.therapistId },
                        search: { appt: next.id },
                      })
                    }
                  />
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <SectionLabel>Past sessions</SectionLabel>
                <div className="flex flex-col gap-3">
                  {past.map((a) => (
                    <PastAppointmentCard key={a.id} surface={surface} appointment={a} />
                  ))}
                </div>
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

      <Drawer open={!!celebrated} onOpenChange={(v) => !v && setCelebrated(null)}>
        <DrawerContent>
          <DrawerHeader className="px-6 pt-3 pb-2 text-left">
            <DrawerTitle>That's a big step</DrawerTitle>
            <DrawerDescription className="mt-2">
              {celebrated && celebratedTherapist && (
                <>
                  Your session with {firstName(celebratedTherapist)} is confirmed for{" "}
                  {formatLongDate(fromISODate(celebrated.dateISO))} at {celebrated.time}. Making
                  space for therapy takes real effort, and you did that today.
                </>
              )}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="px-6 pb-8">
            <Button
              surface={surface}
              variant="primary"
              fullWidth
              onClick={() => setCelebrated(null)}
            >
              Done
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Anchored to the frame so the cascade spans the whole screen and falls
          over the drawer, not behind it. */}
      {burstKey > 0 && (
        <div className="pointer-events-none absolute inset-0 z-[60] overflow-hidden">
          <Confetti key={burstKey} />
        </div>
      )}
    </PhoneFrame>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75 mb-3">{children}</p>
  );
}

function PrepareCard({
  surface,
  icon,
  title,
  body,
  cta,
  onAction,
}: {
  surface: "dark" | "light";
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  onAction: () => void;
}) {
  return (
    <div className={`rounded-3xl ${frostedPanel(surface)} p-5 flex flex-col gap-4`}>
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
            {icon}
          </span>
          <h2 className="font-display text-xl leading-tight tracking-tight text-white">{title}</h2>
        </div>
        <p className="mt-3 text-sm leading-snug text-white/85">{body}</p>
      </div>
      <Button surface={surface} variant="secondary" fullWidth onClick={onAction}>
        {cta}
      </Button>
    </div>
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

function AppointmentCard({
  surface,
  appointment,
  onJoin,
  onConfirm,
  onReschedule,
  onCancel,
}: {
  surface: "dark" | "light";
  appointment: Appointment;
  onJoin: () => void;
  /** The prototype's stand-in for confirming on the therapist's booking platform. */
  onConfirm: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const therapist = getTherapist(appointment.therapistId) ?? matchedTherapists()[0];
  const session =
    SESSION_TYPES.find((s) => s.id === appointment.sessionTypeId) ?? SESSION_TYPES[0];
  const unconfirmed = !appointment.confirmed;
  // The booking platform takes a beat to load — hold the CTA in its loading
  // state before the handoff resolves.
  const [handingOff, setHandingOff] = useState(false);
  const confirm = () => {
    setHandingOff(true);
    setTimeout(() => {
      setHandingOff(false);
      onConfirm();
    }, HANDOFF_MS);
  };
  return (
    <div className={`rounded-3xl ${frostedPanel(surface)} p-5 flex flex-col gap-4`}>
      {/* The when leads; who you're meeting supports it. */}
      <div>
        <p className="font-display text-2xl leading-tight tracking-tight text-white">
          {formatLongDate(fromISODate(appointment.dateISO))}
        </p>
        <p className="mt-1 text-sm text-white/75">
          {appointment.time} · {session.duration} · Video call
        </p>
      </div>
      <div className="flex items-center gap-3">
        <TherapistPhoto src={therapist.photo} size={40} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{therapist.name}</p>
          <p className="text-xs text-white/75 truncate">{therapist.credentials}</p>
        </div>
      </div>
      {unconfirmed && (
        // Action-needed block: status, hold window, and the confirm CTA grouped
        // behind the alert tone + dashed border so the incomplete step reads as
        // one urgent unit.
        <div className="rounded-2xl border-2 border-dashed border-alert-orange/70 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-alert-orange">
            Action Required: Confirm Appointment
          </p>
          <p className="text-sm leading-snug text-white/85">
            Your timeslot is held for 24 hours. Confirm on {firstName(therapist)}'s
            booking platform to secure your appointment.
          </p>
          <Button surface={surface} variant="primary" fullWidth loading={handingOff} onClick={confirm}>
            Confirm on booking platform
            <ExternalLink size={16} strokeWidth={2} aria-hidden />
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {!unconfirmed && (
          <Button surface={surface} variant="primary" fullWidth onClick={onJoin}>
            Join video call
            <ExternalLink size={16} strokeWidth={2} aria-hidden />
          </Button>
        )}
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

// Quiet record of a completed, debriefed session — who and when, no actions.
// Rebooking lives in the "Next step" tile, not here.
function PastAppointmentCard({
  surface,
  appointment,
}: {
  surface: "dark" | "light";
  appointment: Appointment;
}) {
  const therapist = getTherapist(appointment.therapistId) ?? matchedTherapists()[0];
  const session =
    SESSION_TYPES.find((s) => s.id === appointment.sessionTypeId) ?? SESSION_TYPES[0];
  return (
    <div className={`rounded-3xl ${frostedPanel(surface)} p-5 flex flex-col gap-3`}>
      <TherapistMini therapist={therapist} />
      <p className="text-sm text-white/75">
        {session.label} · {formatLongDate(fromISODate(appointment.dateISO))} · {appointment.time}
      </p>
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
        When you schedule a session with a therapist, it will live here.
      </p>
      <Button surface={surface} variant="primary" fullWidth onClick={onFind} className="mt-8 max-w-xs">
        Find a therapist
      </Button>
    </div>
  );
}
