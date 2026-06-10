import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Check, Calendar as CalendarIcon, Clock, Video } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { Badge } from "@/components/Badge";
import { StepDots } from "@/components/StepDots";
import { MultipleChoice } from "@/components/MultipleChoice";
import { CalendarPicker } from "@/components/CalendarPicker";
import { frostedPanel, TherapistPhoto } from "@/components/TherapistCard";
import { useAppMode } from "@/lib/theme-prefs";
import {
  getTherapist,
  matchedTherapists,
  SESSION_TYPES,
  timesForDate,
  formatLongDate,
} from "@/lib/therapist-data";

export const Route = createFileRoute("/therapist-schedule/$id")({
  head: () => ({ meta: [{ title: "Schedule a Call — Yuna" }] }),
  component: ScheduleRoute,
});

function ScheduleRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const surface = useAppMode() === "light" ? "light" : "dark";

  const therapist = getTherapist(id) ?? matchedTherapists()[0];

  const [sessionId, setSessionId] = useState<string>("intro");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const session = useMemo(() => SESSION_TYPES.find((s) => s.id === sessionId) ?? SESSION_TYPES[0], [sessionId]);
  const times = date ? timesForDate(date) : [];
  const step = !date ? 0 : !time ? 1 : 2;

  const TherapistMini = (
    <div className={`flex items-center gap-3 rounded-2xl ${frostedPanel(surface)} p-3`}>
      <TherapistPhoto src={therapist.photo} size={44} />
      <div className="min-w-0">
        <p className="font-display text-lg leading-tight tracking-tight text-white truncate">{therapist.name}</p>
        <p className="text-xs text-white/75 truncate">{therapist.credentials}</p>
      </div>
    </div>
  );

  if (confirmed) {
    return (
      <PhoneFrame themed>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-14 pb-10 text-white flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Button surface={surface} variant="secondary" size="icon" aria-label="Back" onClick={() => navigate({ to: "/tools" })}>
            <ChevronLeft strokeWidth={1.5} />
          </Button>

          <div className="flex flex-col items-center text-center mt-8 yuna-fade-in">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-secondary-green">
              <Check size={34} strokeWidth={2.5} className="text-white" aria-hidden />
            </span>
            <h1 className="mt-5 font-display text-3xl tracking-tight text-white">You're scheduled</h1>
            <p className="mt-2 text-sm leading-snug text-white/85 max-w-[18rem]">
              We've sent a confirmation to your email with a video link for your session.
            </p>
          </div>

          <div className={`mt-8 rounded-3xl ${frostedPanel(surface)} p-5 flex flex-col gap-4`}>
            {TherapistMini}
            <div className="flex flex-col gap-3">
              <SummaryLine icon={<CalendarIcon size={16} aria-hidden />}>{date && formatLongDate(date)}</SummaryLine>
              <SummaryLine icon={<Clock size={16} aria-hidden />}>{time} · {session.duration}</SummaryLine>
              <SummaryLine icon={<Video size={16} aria-hidden />}>{session.label} · Video call</SummaryLine>
            </div>
          </div>

          <div className="mt-auto pt-8 flex flex-col gap-2">
            <Button surface={surface} variant="primary" fullWidth onClick={() => navigate({ to: "/tools" })}>
              Done
            </Button>
            <Button
              surface={surface}
              variant="link"
              className="mx-auto"
              onClick={() => {
                setConfirmed(false);
                setDate(null);
                setTime(null);
              }}
            >
              Reschedule
            </Button>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  const confirmLabel = !date ? "Pick a date" : !time ? "Pick a time" : `Confirm · ${time}`;

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
        <header className="shrink-0 px-6 pt-14 grid grid-cols-3 items-center">
          <div className="justify-self-start">
            <Button surface={surface} variant="secondary" size="icon" aria-label="Back" onClick={() => navigate({ to: "/therapist-profile/$id", params: { id: therapist.id } })}>
              <ChevronLeft strokeWidth={1.5} />
            </Button>
          </div>
          <div className="justify-self-center">
            <StepDots surface={surface} count={3} current={step} aria-label={`Step ${step + 1} of 3`} />
          </div>
          <div />
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-4 flex flex-col gap-6 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="text-center">
            <h1 className="font-display text-3xl tracking-tight text-white">Schedule a call</h1>
            <p className="mt-1.5 text-sm text-white/85">Pick a time that works. We'll handle the rest.</p>
          </div>

          {TherapistMini}

          <section>
            <Label>Session type</Label>
            <MultipleChoice
              surface={surface}
              ariaLabel="Session type"
              value={sessionId}
              onChange={setSessionId}
              options={SESSION_TYPES.map((s) => ({
                value: s.id,
                label: s.label,
                subtitle: s.body,
                trailing: <Badge>{s.duration}</Badge>,
              }))}
            />
          </section>

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
            <section>
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
          <Button surface={surface} variant="primary" fullWidth disabled={!date || !time} onClick={() => setConfirmed(true)}>
            {confirmLabel}
          </Button>
        </footer>
      </div>
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
