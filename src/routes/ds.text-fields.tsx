import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic } from "lucide-react";
import { TextField, FieldError } from "@/components/TextField";
import { Button } from "@/components/Button";
import { Waveform } from "@/components/Waveform";

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

type Surface = "dark" | "light";

function DSTextFields() {
  // One mic stream at a time — `recordingSurface` says which showcase owns it.
  const [recordingSurface, setRecordingSurface] = useState<Surface | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const stopRecording = () => {
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setAnalyser(null);
    setRecordingSurface(null);
  };

  // Mirrors the chat composer's analyser wiring (no speech recognition — the
  // DS demo only needs the bars to track the mic).
  const startRecording = async (surface: Surface) => {
    setRecordingSurface(surface);
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createAnalyser();
      node.fftSize = 512;
      node.smoothingTimeConstant = 0.6;
      source.connect(node);
      setAnalyser(node);
    } catch {
      // Mic blocked — the field still shows the active border; Waveform falls
      // back to its resting bars.
    }
  };

  useEffect(() => () => stopRecording(), []);

  return (
    <main className="ml-44 min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-10 py-12">
        <header className="mb-10">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Design System
          </p>
          <h1 className="text-3xl tracking-tight">Text Fields</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 items-start">
          <section>
            <h2 className="text-lg tracking-tight mb-4">Surface: dark</h2>
            <DarkSurface>
              <Showcase
                surface="dark"
                recording={recordingSurface === "dark"}
                analyser={analyser}
                onStart={() => startRecording("dark")}
                onStop={stopRecording}
              />
            </DarkSurface>
          </section>
          <section>
            <h2 className="text-lg tracking-tight mb-4">Surface: light</h2>
            <LightSurface>
              <Showcase
                surface="light"
                recording={recordingSurface === "light"}
                analyser={analyser}
                onStart={() => startRecording("light")}
                onStop={stopRecording}
              />
            </LightSurface>
          </section>
        </div>

        <Section title="Props">
          <pre className="text-[12px] leading-relaxed bg-muted/40 border border-border rounded-2xl p-5 overflow-x-auto">
{`<TextField
  surface?:  "dark" | "light"          // default: "dark"
  size?:     "md" | "sm" | "lg"        // Regular (default) | Compact | Large
  error?:    boolean                   // orange alert border + aria-invalid
  active?:   boolean                   // hold the focus border on (e.g. recording)
  leading?:  ReactNode                 // inline indicator (e.g. recording waveform)
  trailing?: ReactNode                 // inline DS Button (icon or labelled)
  containerClassName?: string          // class on the pill wrapper
  ...native input props                // value, onChange, placeholder, …
/>`}
          </pre>
        </Section>
      </div>
    </main>
  );
}

// ── Per-surface showcase: States · Sizes · Trailing ───────────────────────────

function Showcase({
  surface,
  recording,
  analyser,
  onStart,
  onStop,
}: {
  surface: Surface;
  recording: boolean;
  analyser: AnalyserNode | null;
  onStart: () => void;
  onStop: () => void;
}) {
  const [iconText, setIconText] = useState("");
  const [labelText, setLabelText] = useState("");
  const [regular, setRegular] = useState("");
  const [compact, setCompact] = useState("");
  const [large, setLarge] = useState("");
  const barClass = surface === "dark" ? "bg-white" : "bg-foreground";

  return (
    <div className="flex flex-col gap-9 max-w-sm">
      <Group title="States">
        <Row label="Default">
          <TextField surface={surface} placeholder="Add a note for yourself…" readOnly />
        </Row>
        <Row label="Active">
          <TextField surface={surface} active defaultValue="Grateful for the slow morning" />
        </Row>
        <Row label="Error">
          <div className="flex flex-col gap-2">
            <TextField
              surface={surface}
              type="password"
              error
              defaultValue="short"
              placeholder="At least 8 characters"
            />
            <FieldError>Your password needs at least 8 characters.</FieldError>
          </div>
        </Row>
      </Group>

      <Group title="Sizes">
        <Row label="Regular">
          <TextField
            surface={surface}
            value={regular}
            onChange={(ev) => setRegular(ev.target.value)}
            placeholder="Add a note for yourself…"
          />
        </Row>
        <Row label="Compact">
          <TextField
            surface={surface}
            size="sm"
            value={compact}
            onChange={(ev) => setCompact(ev.target.value)}
            placeholder="Type here…"
          />
        </Row>
        <Row label="Large">
          <TextField
            surface={surface}
            size="lg"
            value={large}
            onChange={(ev) => setLarge(ev.target.value)}
            placeholder="Enter your name"
          />
        </Row>
      </Group>

      <Group title="Trailing">
        <Row label="Icon button">
          <TextField
            surface={surface}
            value={iconText}
            onChange={(ev) => setIconText(ev.target.value)}
            placeholder="Enter your name"
            trailing={
              <Button
                surface={surface}
                variant="primary"
                size="icon-sm"
                type="button"
                aria-label="Send"
                disabled={!iconText.trim()}
              >
                <ArrowUp size={13} strokeWidth={2} />
              </Button>
            }
          />
        </Row>
        <Row label="Labelled button — hold to talk">
          <TextField
            surface={surface}
            value={recording ? "" : labelText}
            onChange={(ev) => setLabelText(ev.target.value)}
            placeholder={recording ? "" : "Type a Message…"}
            readOnly={recording}
            active={recording}
            className={recording ? "hidden" : undefined}
            leading={
              recording ? <Waveform analyser={analyser} barClassName={barClass} /> : undefined
            }
            trailing={
              <Button
                surface={surface}
                variant="primary"
                size={labelText.trim() && !recording ? "icon" : "md"}
                type="button"
                pressed={recording}
                className={recording ? "opacity-80" : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  if (labelText.trim() || recording) return;
                  e.preventDefault();
                  onStart();
                }}
                onPointerUp={() => recording && onStop()}
                onPointerCancel={() => recording && onStop()}
                onPointerLeave={() => recording && onStop()}
                aria-label={
                  recording
                    ? "Release to send voice note"
                    : labelText.trim()
                      ? "Send"
                      : "Hold to record voice note"
                }
              >
                {labelText.trim() && !recording ? (
                  <ArrowUp size={15} strokeWidth={2} />
                ) : (
                  <>
                    <Mic size={15} strokeWidth={2} />
                    Hold to talk
                  </>
                )}
              </Button>
            }
          />
        </Row>
      </Group>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-lg tracking-tight mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[11px] tracking-[0.3em] uppercase text-current opacity-70">
        {title}
      </h3>
      {children}
    </div>
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
      <span className="text-[11px] tracking-[0.25em] uppercase text-current opacity-60">
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
  tone: Surface;
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
