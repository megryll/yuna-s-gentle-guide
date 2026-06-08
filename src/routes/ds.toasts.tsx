import { createFileRoute } from "@tanstack/react-router";
import { Toast } from "@/components/Toast";
import {
  DSPage,
  DevicePair,
  PropsBlock,
  Section,
  SurfaceMatrix,
  type MatrixRow,
} from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/toasts")({
  head: () => ({
    meta: [
      { title: "Design System — Toast Alerts" },
      {
        name: "description",
        content: "Design system: toast alert variants for light and dark surfaces.",
      },
    ],
  }),
  component: DSToasts,
});

function DSToasts() {
  return (
    <DSPage title="Toast Alerts">
      <Section
        title="Variants"
        subtitle="Surface only changes neutral — it inverts to stay legible. Colored variants read the same on both."
      >
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section
        title="Options"
        subtitle="A title adds a bold line above the message; onDismiss adds a close button."
      >
        <SurfaceMatrix rows={OPTION_ROWS} />
      </Section>

      <Section
        title="Position"
        subtitle="Toasts enter from the top edge, below the status area, and auto-dismiss. Pin them to the top of the screen — never floating mid-content."
      >
        <DevicePair
          renderRow={() => (
            <div className="absolute top-8 inset-x-0 px-4">
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-secondary-green shadow-[0_12px_30px_-12px_rgba(0,0,0,0.45)]">
                <span
                  aria-hidden
                  className="h-[18px] w-[18px] rounded-full shrink-0 bg-neutral/40"
                />
                <span
                  aria-hidden
                  className="block h-3 flex-1 max-w-[70%] rounded-full bg-neutral/30"
                />
              </div>
            </div>
          )}
        />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Toast
  variant?:   "error" | "neutral" | "success"   // default: "neutral"
  surface?:   "dark" | "light"                   // default: "dark"
  title?:     string                             // optional bold line above
  message:    string                             // the alert copy
  onDismiss?: () => void                          // show a close (×) button
  ...native div props
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

// ─── Matrix rows ──────────────────────────────────────────────────────────

const VARIANT_ROWS: MatrixRow[] = [
  {
    label: "Error",
    render: (s) => (
      <ToastCell>
        <Toast surface={s} variant="error" message="Your password needs at least 8 characters." />
      </ToastCell>
    ),
  },
  {
    label: "Neutral",
    render: (s) => (
      <ToastCell>
        <Toast surface={s} variant="neutral" message="Your request has been sent." />
      </ToastCell>
    ),
  },
  {
    label: "Success",
    render: (s) => (
      <ToastCell>
        <Toast surface={s} variant="success" message="You're in. Your pass is ready to claim." />
      </ToastCell>
    ),
  },
];

const OPTION_ROWS: MatrixRow[] = [
  {
    label: "With a title",
    render: (s) => (
      <ToastCell>
        <Toast
          surface={s}
          variant="success"
          title="Saved"
          message="Your reflection was added to this week."
        />
      </ToastCell>
    ),
  },
  {
    label: "Dismissible",
    render: (s) => (
      <ToastCell>
        <Toast
          surface={s}
          variant="neutral"
          message="On a new device? Check your email for a sign-in link."
          onDismiss={() => {}}
        />
      </ToastCell>
    ),
  },
];

function ToastCell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-sm">{children}</div>;
}
