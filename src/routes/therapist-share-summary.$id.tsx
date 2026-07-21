import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Share } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Toast, ToastViewport } from "@/components/Toast";
import { NativeShareSheet } from "@/components/NativeShareSheet";
import { useAppMode } from "@/lib/theme-prefs";
import { useTransientToast } from "@/lib/use-transient-toast";
import { getAppointment, updateAppointment } from "@/lib/therapist-prefs";
import { getTherapist, matchedTherapists, summaryPdfUrl } from "@/lib/therapist-data";

// ─── Share a summary ─────────────────────────────────────────────────────────
// An in-app preview of the generated conversation-summary document (the mock
// PDF), with one fixed action: Share, which raises the simulated OS share
// sheet. Picking any destination marks the appointment's summary as shared.

export const Route = createFileRoute("/therapist-share-summary/$id")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    // The appointment this share belongs to, so its `summaryShared` flag flips.
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
  const router = useRouter();
  const surface = useAppMode() === "light" ? "light" : "dark";

  const therapist = getTherapist(id) ?? matchedTherapists()[0];

  const [sheetOpen, setSheetOpen] = useState(false);
  const { message: toast, show: flashToast, dismiss } = useTransientToast();

  const back = () =>
    router.history.canGoBack() ? router.history.back() : navigate({ to: "/therapist-hub" });

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
        <PageHeader
          surface={surface}
          onBack={back}
          center={<span className="text-sm font-semibold text-white">Summary Preview</span>}
        />

        {/* The document itself, viewed in place. */}
        <div className="flex-1 min-h-0 px-4 pt-2 yuna-fade-in">
          <iframe
            src={summaryPdfUrl(therapist)}
            title="Conversation summary"
            className="h-full w-full rounded-2xl border border-white/15 bg-white"
          />
        </div>

        <footer className="shrink-0 px-6 pb-10 pt-4">
          <Button surface={surface} variant="primary" fullWidth onClick={() => setSheetOpen(true)}>
            <Share size={16} strokeWidth={2} aria-hidden />
            Share
          </Button>
        </footer>
      </div>

      {toast && (
        <ToastViewport>
          <Toast
            surface={surface}
            variant="success"
            message={toast}
            onDismiss={dismiss}
            className="yuna-fade-in"
          />
        </ToastViewport>
      )}

      <NativeShareSheet
        open={sheetOpen}
        fileName="Conversation summary.pdf"
        fileMeta={`PDF document · For ${therapist.name}`}
        onDismiss={() => setSheetOpen(false)}
        onShare={(destination) => {
          setSheetOpen(false);
          if (getAppointment(appt)) updateAppointment(appt!, { summaryShared: true });
          flashToast(`Shared via ${destination}.`);
        }}
      />
    </PhoneFrame>
  );
}
