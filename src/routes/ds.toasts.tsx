import { createFileRoute } from "@tanstack/react-router";
import { Toast } from "@/components/Toast";

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
    <main className="ml-44 min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-10 py-12">
        <header className="mb-10">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Design System
          </p>
          <h1 className="text-3xl tracking-tight">Toast Alerts</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
            A brief notification pill at the top of a screen.
          </p>
        </header>

        <Section title="Surface: dark">
          <DarkSurface>
            <div className="flex flex-col gap-3 max-w-sm">
              <Toast
                surface="dark"
                variant="error"
                message="Your password needs at least 8 characters."
              />
              <Toast
                surface="dark"
                variant="neutral"
                message="Your request has been sent."
              />
              <Toast
                surface="dark"
                variant="success"
                message="You're in. Your pass is ready to claim."
              />
            </div>
          </DarkSurface>
        </Section>

        <Section title="Surface: light">
          <LightSurface>
            <div className="flex flex-col gap-3 max-w-sm">
              <Toast
                surface="light"
                variant="error"
                message="Your password needs at least 8 characters."
              />
              <Toast
                surface="light"
                variant="neutral"
                message="Your request has been sent."
              />
              <Toast
                surface="light"
                variant="success"
                message="You're in. Your pass is ready to claim."
              />
            </div>
          </LightSurface>
        </Section>

        <Section title="With a title">
          <div className="grid grid-cols-2 gap-4">
            <DarkSurface>
              <div className="max-w-sm">
                <Toast
                  surface="dark"
                  variant="success"
                  title="Saved"
                  message="Your reflection was added to this week."
                />
              </div>
            </DarkSurface>
            <LightSurface>
              <div className="max-w-sm">
                <Toast
                  surface="light"
                  variant="error"
                  title="Couldn't connect"
                  message="I'm having trouble right now. Try again in a moment?"
                />
              </div>
            </LightSurface>
          </div>
        </Section>

        <Section title="Dismissible">
          <div className="grid grid-cols-2 gap-4">
            <DarkSurface>
              <div className="max-w-sm">
                <Toast
                  surface="dark"
                  variant="neutral"
                  message="On a new device? Check your email for a sign-in link."
                  onDismiss={() => {}}
                />
              </div>
            </DarkSurface>
            <LightSurface>
              <div className="max-w-sm">
                <Toast
                  surface="light"
                  variant="success"
                  title="All set"
                  message="Your reflection was added to this week."
                  onDismiss={() => {}}
                />
              </div>
            </LightSurface>
          </div>
        </Section>

        <Section title="Props">
          <pre className="text-[12px] leading-relaxed bg-muted/40 border border-border rounded-2xl p-5 overflow-x-auto">
{`<Toast
  variant?:   "error" | "neutral" | "success"   // default: "neutral"
  surface?:   "dark" | "light"                   // default: "dark"
  title?:     string                             // optional bold line above
  message:    string                             // the alert copy
  onDismiss?: () => void                          // show a close (×) button
  ...native div props
/>`}
          </pre>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-lg tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1 mb-4">{subtitle}</p>
      )}
      {children}
    </section>
  );
}

function DarkSurface({ children }: { children: React.ReactNode }) {
  return <SurfacePanel tone="dark">{children}</SurfacePanel>;
}

function LightSurface({ children }: { children: React.ReactNode }) {
  return <SurfacePanel tone="light">{children}</SurfacePanel>;
}

function SurfacePanel({
  tone,
  children,
}: {
  tone: "dark" | "light";
  children: React.ReactNode;
}) {
  const bg = tone === "dark" ? "/background.png" : "/light-blur-bg.png";
  const textColor = tone === "dark" ? "text-white" : "text-foreground";
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className={`relative px-6 py-7 ${textColor}`}>{children}</div>
    </div>
  );
}
