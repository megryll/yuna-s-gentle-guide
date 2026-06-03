import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic } from "lucide-react";
import { TextField, FieldError } from "@/components/TextField";
import { Button } from "@/components/Button";
import { Waveform } from "@/components/Waveform";
import { DSPage, PropsBlock, Section, SurfaceMatrix, type MatrixRow } from "@/ds-docs/surface";

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

const STATE_ROWS: MatrixRow[] = [
  {
    label: "Default",
    render: (s) => <TextField surface={s} placeholder="Add a note for yourself…" readOnly />,
  },
  {
    label: "Active",
    render: (s) => <TextField surface={s} active defaultValue="Grateful for the slow morning" />,
  },
  {
    label: "Error",
    render: (s) => (
      <div className="flex flex-col gap-2">
        <TextField
          surface={s}
          type="password"
          error
          defaultValue="short"
          placeholder="At least 8 characters"
        />
        <FieldError>Your password needs at least 8 characters.</FieldError>
      </div>
    ),
  },
];

const SIZE_ROWS: MatrixRow[] = [
  {
    label: "Regular",
    render: (s) => <TextField surface={s} placeholder="Add a note for yourself…" />,
  },
  { label: "Compact", render: (s) => <TextField surface={s} size="sm" placeholder="Type here…" /> },
  { label: "Large", render: (s) => <TextField surface={s} size="lg" placeholder="Enter your name" /> },
];

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

  // Defined here (not module scope) so the hold-to-talk row can read the
  // page-level recording state.
  const trailingRows: MatrixRow[] = [
    { label: "Icon button", render: (s) => <TrailingIconField surface={s} /> },
    {
      label: "Hold to talk",
      render: (s) => (
        <HoldToTalkField
          surface={s}
          recording={recordingSurface === s}
          analyser={analyser}
          onStart={() => startRecording(s)}
          onStop={stopRecording}
        />
      ),
    },
  ];

  return (
    <DSPage title="Text Fields">
      <Section title="States">
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Sizes" subtitle="Regular (default) · Compact (sm) · Large (lg).">
        <SurfaceMatrix rows={SIZE_ROWS} />
      </Section>

      <Section
        title="Trailing"
        subtitle="An inline DS Button — icon-only, or labelled. Hold the labelled button to record a voice note."
      >
        <SurfaceMatrix rows={trailingRows} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<TextField
  surface?:  "dark" | "light"          // default: "dark"
  size?:     "md" | "sm" | "lg"        // Regular (default) | Compact | Large
  error?:    boolean                   // orange alert border + aria-invalid
  active?:   boolean                   // hold the focus border on (e.g. recording)
  leading?:  ReactNode                 // inline indicator (e.g. recording waveform)
  trailing?: ReactNode                 // inline DS Button (icon or labelled)
  containerClassName?: string          // class on the pill wrapper
  ...native input props                // value, onChange, placeholder, …
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

// ─── Trailing-button demos ────────────────────────────────────────────────

function TrailingIconField({ surface }: { surface: Surface }) {
  const [text, setText] = useState("");
  return (
    <TextField
      surface={surface}
      value={text}
      onChange={(ev) => setText(ev.target.value)}
      placeholder="Enter your name"
      trailing={
        <Button
          surface={surface}
          variant="primary"
          size="icon-sm"
          type="button"
          aria-label="Send"
          disabled={!text.trim()}
        >
          <ArrowUp size={13} strokeWidth={2} />
        </Button>
      }
    />
  );
}

function HoldToTalkField({
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
  const [labelText, setLabelText] = useState("");
  const barClass = surface === "dark" ? "bg-white" : "bg-foreground";
  return (
    <TextField
      surface={surface}
      value={recording ? "" : labelText}
      onChange={(ev) => setLabelText(ev.target.value)}
      placeholder={recording ? "" : "Type a Message…"}
      readOnly={recording}
      active={recording}
      className={recording ? "hidden" : undefined}
      leading={recording ? <Waveform analyser={analyser} barClassName={barClass} /> : undefined}
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
  );
}
