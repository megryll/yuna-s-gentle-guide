import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { WebShell, WebContent } from "@/components/WebShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { TextArea } from "@/components/TextArea";
import { Toast, ToastViewport } from "@/components/Toast";
import { useAppMode } from "@/lib/theme-prefs";
import { useTransientToast } from "@/lib/use-transient-toast";

type Tab = "feedback" | "bug";

const COPY: Record<Tab, { prompt: string; placeholder: string; sent: string }> = {
  feedback: {
    prompt: "Share your feedback. We're here to improve your experience.",
    placeholder: "What's on your mind?",
    sent: "Thanks for sharing. Your feedback helps us improve.",
  },
  bug: {
    prompt: "Found a bug? Briefly describe it here and we'll get on the fix.",
    placeholder: "What happened?",
    sent: "Thanks for the report. We're on the fix.",
  },
};

export const Route = createFileRoute("/settings_/feedback")({
  head: () => ({ meta: [{ title: "Your Feedback — Yuna" }] }),
  component: FeedbackRoute,
});

function FeedbackRoute() {
  const navigate = useNavigate();
  const mode = useAppMode();

  const [tab, setTab] = useState<Tab>("feedback");
  // Keep a separate draft per tab so switching doesn't lose what was typed.
  const [drafts, setDrafts] = useState<Record<Tab, string>>({ feedback: "", bug: "" });
  const { message: toast, show, dismiss } = useTransientToast();

  const copy = COPY[tab];
  const text = drafts[tab];
  const canSend = text.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    show(copy.sent);
    setDrafts((prev) => ({ ...prev, [tab]: "" }));
  };

  return (
    <WebShell>
      <div className={"text-foreground " + (mode === "dark" ? "overlay-on-dark" : "")}>
        {toast && (
          <ToastViewport>
            <Toast
              surface="light"
              variant="success"
              message={toast}
              onDismiss={dismiss}
              className="yuna-fade-in"
            />
          </ToastViewport>
        )}

        <WebContent width="max-w-2xl">
          <PageHeader
            title="Your Feedback"
            tone="ink"
            layout="inline"
            className="px-0 pt-0 pb-0"
            onBack={() => navigate({ to: "/settings" })}
          />

          <div className="mt-6 flex flex-col gap-6">
            <div className="flex justify-center">
              <SegmentedToggle
                value={tab}
                onChange={setTab}
                surface={mode}
                ariaLabel="Feedback type"
                options={[
                  { value: "feedback", label: "Feedback" },
                  { value: "bug", label: "Report bug" },
                ]}
              />
            </div>

            <h2 className="font-display text-lg leading-snug tracking-tight text-foreground/85">
              {copy.prompt}
            </h2>

            <TextArea
              surface={mode}
              rows={6}
              value={text}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [tab]: e.target.value }))}
              placeholder={copy.placeholder}
              aria-label={tab === "bug" ? "Describe the bug" : "Your feedback"}
            />

            <Button
              surface={mode}
              variant="primary"
              fullWidth
              disabled={!canSend}
              onClick={send}
              className="mt-2"
            >
              Send
            </Button>
          </div>
        </WebContent>
      </div>
    </WebShell>
  );
}
