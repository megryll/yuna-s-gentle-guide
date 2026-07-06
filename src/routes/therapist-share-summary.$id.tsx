import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, FileText } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Switch } from "@/components/Switch";
import { IconMedallion } from "@/components/IconMedallion";
import { frostedPanel, TherapistPhoto } from "@/components/TherapistCard";
import { useAppMode } from "@/lib/theme-prefs";
import { getAppointment, updateAppointment } from "@/lib/therapist-prefs";
import {
  getTherapist,
  matchedTherapists,
  summaryPdfUrl,
  SHARE_SUMMARY_SECTIONS,
} from "@/lib/therapist-data";

export const Route = createFileRoute("/therapist-share-summary/$id")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    // The appointment this share belongs to, so the hub can show "shared".
    appt?: string;
  } => ({
    appt: (s.appt as string | undefined) || undefined,
  }),
  head: () => ({ meta: [{ title: "Share a Summary — Yuna" }] }),
  component: ShareSummaryRoute,
});

function ShareSummaryRoute() {
  const { id } = Route.useParams();
  const { appt } = Route.useSearch();
  const navigate = useNavigate();
  const surface = useAppMode() === "light" ? "light" : "dark";

  const therapist = getTherapist(id) ?? matchedTherapists()[0];
  const name = therapist.name.split(" ")[0];

  // Everything starts included; the user prunes, then explicitly sends.
  const [included, setIncluded] = useState<Set<string>>(
    () => new Set(SHARE_SUMMARY_SECTIONS.map((s) => s.id)),
  );
  const [shared, setShared] = useState(false);

  const toggle = (sectionId: string) =>
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });

  const share = () => {
    if (getAppointment(appt)) updateAppointment(appt!, { summaryShared: true });
    setShared(true);
  };

  if (shared) {
    return (
      <PhoneFrame themed>
        <div className="flex-1 flex flex-col min-h-0">
          <PageHeader surface={surface} onBack={() => navigate({ to: "/therapist-hub" })} />
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 text-white flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-col items-center text-center mt-8 yuna-fade-in">
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-secondary-green">
                <Check size={34} strokeWidth={2.5} className="text-white" aria-hidden />
              </span>
              <h1 className="mt-5 font-display text-3xl tracking-tight text-white">
                Summary shared
              </h1>
              <p className="mt-2 text-sm leading-snug text-white/85 max-w-[18rem]">
                {name} will be able to read it before your session, so you can start where you
                are instead of starting over.
              </p>
            </div>

            {/* The concrete artifact: what was generated, where it went, and
                the download affordance, together in one row. */}
            <div className={`mt-8 rounded-2xl ${frostedPanel(surface)} p-4 flex items-center gap-3`}>
              <IconMedallion size="sm">
                <FileText size={16} className="text-white" aria-hidden />
              </IconMedallion>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  Conversation summary.pdf
                </p>
                <p className="mt-0.5 text-xs text-white/75 truncate">Emailed to megan@yuna.io</p>
              </div>
              <Button
                surface={surface}
                variant="secondary"
                size="sm"
                className="shrink-0"
                onClick={() => window.open(summaryPdfUrl(therapist), "_blank", "noopener")}
              >
                Download
              </Button>
            </div>
            <div className="mt-auto pt-8">
              <Button
                surface={surface}
                variant="primary"
                fullWidth
                onClick={() => navigate({ to: "/therapist-hub" })}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
        <PageHeader surface={surface} onBack={() => navigate({ to: "/therapist-hub" })} />

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-4 flex flex-col gap-5 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Header: the therapist is the header, not a separate card — avatar,
              "Share with <full name>", credentials, then the one-line why. */}
          <div className="flex flex-col items-center text-center">
            <TherapistPhoto src={therapist.photo} size={64} />
            <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight text-white">
              Share with {therapist.name}
            </h1>
            <p className="mt-1 text-sm text-white/75">{therapist.credentials}</p>
            <p className="mt-3 text-sm leading-snug text-white/85 max-w-[19rem]">
              A short summary of your time with Yuna, so {name} can start where you are instead
              of you retelling everything. Nothing is shared until you tap share.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {SHARE_SUMMARY_SECTIONS.map((s) => {
              const on = included.has(s.id);
              return (
                <div
                  key={s.id}
                  className={`rounded-2xl ${frostedPanel(surface)} p-4 flex items-start gap-3 transition-opacity ${
                    on ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                    <p className="mt-1 text-sm leading-snug text-white/75">{s.body}</p>
                  </div>
                  <Switch
                    surface={surface}
                    checked={on}
                    onChange={() => toggle(s.id)}
                    label={`Include ${s.title}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <footer className="shrink-0 px-6 pb-10 pt-3 flex flex-col gap-2">
          <Button
            surface={surface}
            variant="primary"
            fullWidth
            disabled={included.size === 0}
            onClick={share}
          >
            Share with {name}
          </Button>
          <p className="text-center text-sm text-white/60">
            Only the sections you keep on are shared.
          </p>
        </footer>
      </div>
    </PhoneFrame>
  );
}
