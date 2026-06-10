import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic } from "lucide-react";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { Waveform } from "@/components/Waveform";
import {
  isSpeechRecognitionSupported,
  startRecognition,
  type RecognitionHandle,
} from "@/lib/speech";

/**
 * DictationField — a TextField that can be typed into *or* dictated. The
 * trailing button is a press-and-hold mic while the field is empty: holding it
 * records the mic (a live waveform replaces the input), and releasing converts
 * the speech to text and submits it. Once text is present the button flips to a
 * send affordance. This is the chat composer's input pattern, lifted into one
 * reusable control.
 *
 * Controlled: pass `value` / `onChange` for the typed text. `onSubmit` fires
 * with the final text — the typed value on send, or the transcript on release.
 *
 * surface: which background it sits on (dark photo vs light).
 */
type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (text: string) => void;
  surface?: "dark" | "light";
  size?: "md" | "lg";
  placeholder?: string;
  autoFocus?: boolean;
};

export function DictationField({
  value,
  onChange,
  onSubmit,
  surface = "dark",
  size = "md",
  placeholder,
  autoFocus,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const recRef = useRef<RecognitionHandle | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const hasText = value.trim().length > 0;

  const stopAnalyser = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setAnalyser(null);
  };

  const startAnalyser = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createAnalyser();
      node.fftSize = 512;
      node.smoothingTimeConstant = 0.6;
      source.connect(node);
      setAnalyser(node);
    } catch {
      // Mic blocked — Waveform falls back to its resting bars.
    }
  };

  const startRecord = () => {
    if (recording) return;
    if (!isSpeechRecognitionSupported()) {
      alert("Voice notes need a browser that supports speech recognition (try Chrome or Safari).");
      return;
    }
    onChange("");
    const handle = startRecognition({
      onFinal: (committed) => {
        recRef.current = null;
        setRecording(false);
        stopAnalyser();
        const t = committed.trim();
        if (t) onSubmit(t);
      },
      onError: (err) => {
        recRef.current = null;
        setRecording(false);
        stopAnalyser();
        if (err.error !== "aborted" && err.error !== "no-speech") {
          console.error("Dictation recognition error", err);
        }
      },
    });
    if (!handle) return;
    recRef.current = handle;
    setRecording(true);
    void startAnalyser();
  };

  const finishRecord = () => {
    recRef.current?.stop();
  };

  useEffect(
    () => () => {
      recRef.current?.abort();
      recRef.current = null;
      stopAnalyser();
    },
    [],
  );

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (hasText) onSubmit(value.trim());
      }}
    >
      <TextField
        surface={surface}
        size={size}
        value={recording ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={recording ? "" : placeholder}
        readOnly={recording}
        active={recording}
        autoFocus={autoFocus}
        className={recording ? "hidden" : undefined}
        leading={
          recording ? (
            <Waveform analyser={analyser} barClassName={surface === "light" ? "bg-foreground" : "bg-white"} />
          ) : undefined
        }
        trailing={
          <Button
            surface={surface}
            variant="primary"
            size="icon-sm"
            type={hasText && !recording ? "submit" : "button"}
            pressed={recording}
            aria-label={recording ? "Release to send" : hasText ? "Send" : "Hold to talk"}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              if (hasText || recording) return;
              e.preventDefault();
              startRecord();
            }}
            onPointerUp={() => {
              if (recording) finishRecord();
            }}
            onPointerCancel={() => {
              if (recording) finishRecord();
            }}
            onPointerLeave={() => {
              if (recording) finishRecord();
            }}
          >
            {hasText && !recording ? <ArrowUp strokeWidth={2} /> : <Mic strokeWidth={1.75} />}
          </Button>
        }
      />
    </form>
  );
}
