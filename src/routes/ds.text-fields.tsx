import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/ds/text-fields")({
  head: () => ({
    meta: [
      { title: "Design System — Text Fields" },
      {
        name: "description",
        content: "Design system: text field variants and states.",
      },
    ],
  }),
  component: DSTextFields,
});

function DSTextFields() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [d, setD] = useState("");
  const [e, setE] = useState("");

  return (
    <main className="ml-44 min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-10 py-12">
        <header className="mb-10">
          <p className="font-sans-ui text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Design System
          </p>
          <h1 className="text-3xl tracking-tight">Text Fields</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
            A pill-shaped single-line input. Pick a{" "}
            <code className="font-sans-ui text-xs">surface</code> (the
            background it sits on) and a{" "}
            <code className="font-sans-ui text-xs">size</code>; pass{" "}
            <code className="font-sans-ui text-xs">trailing</code> for an
            inline action.
          </p>
        </header>

        <Section
          title="Surface: dark"
          subtitle="Use on dark or photo backgrounds."
        >
          <DarkSurface>
            <div className="flex flex-col gap-4 max-w-sm">
              <Row label="md (default)">
                <TextField
                  surface="dark"
                  value={a}
                  onChange={(ev) => setA(ev.target.value)}
                  placeholder="Add a note for yourself…"
                />
              </Row>
              <Row label="sm (compact)">
                <TextField
                  surface="dark"
                  size="sm"
                  value={b}
                  onChange={(ev) => setB(ev.target.value)}
                  placeholder="Type here…"
                />
              </Row>
              <Row label="md, trailing">
                <TextField
                  surface="dark"
                  value={c}
                  onChange={(ev) => setC(ev.target.value)}
                  placeholder="Enter your name"
                  trailing={
                    <Button
                      surface="dark"
                      variant="primary"
                      size="icon-sm"
                      type="button"
                      aria-label="Send"
                      disabled={!c.trim()}
                    >
                      <ArrowUp size={13} strokeWidth={2} />
                    </Button>
                  }
                />
              </Row>
              <Row label="md, leading + trailing (recording state)">
                <TextField
                  surface="dark"
                  placeholder="Listening…"
                  readOnly
                  containerClassName="border-white"
                  leading={
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full bg-success-green shrink-0"
                    />
                  }
                  trailing={
                    <Button
                      surface="dark"
                      variant="primary"
                      size="icon-sm"
                      type="button"
                      pressed
                      aria-label="Stop recording"
                    >
                      <ArrowUp size={13} strokeWidth={2} />
                    </Button>
                  }
                />
              </Row>
            </div>
          </DarkSurface>
        </Section>

        <Section
          title="Surface: light"
          subtitle="Use on light backgrounds."
        >
          <LightSurface>
            <div className="flex flex-col gap-4 max-w-sm">
              <Row label="md (default)">
                <TextField
                  surface="light"
                  value={d}
                  onChange={(ev) => setD(ev.target.value)}
                  placeholder="Add a note for yourself…"
                />
              </Row>
              <Row label="sm (compact)">
                <TextField
                  surface="light"
                  size="sm"
                  value={e}
                  onChange={(ev) => setE(ev.target.value)}
                  placeholder="Type here…"
                />
              </Row>
            </div>
          </LightSurface>
        </Section>

        <Section title="Props" subtitle="Type signature.">
          <pre className="font-sans-ui text-[12px] leading-relaxed bg-muted/40 border border-border rounded-2xl p-5 overflow-x-auto">
{`<TextField
  surface?:  "dark" | "light"          // default: "dark"
  size?:     "md" | "sm"               // default: "md"
  leading?:  ReactNode                 // inline indicator (e.g. recording dot)
  trailing?: ReactNode                 // inline action (e.g. send button)
  containerClassName?: string          // class on the pill wrapper
  ...native input props                // value, onChange, placeholder, …
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
        <p className="font-sans-ui text-xs text-muted-foreground mt-1 mb-4">
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-current opacity-60">
        {label}
      </span>
      {children}
    </label>
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
