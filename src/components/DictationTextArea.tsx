import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Mic, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { Waveform } from "@/components/Waveform";
import {
  isSpeechRecognitionSupported,
  startRecognition,
  type RecognitionHandle,
} from "@/lib/speech";

/**
 * DictationTextArea — a multiline answer field that can be typed into *or*
 * recorded. The block-shaped, tap-to-toggle sibling to DictationField (which is
 * the single-line, press-and-hold chat composer). The trailing circular button
 * cycles through three runtime states:
 *   • empty       — a Mic; tap to start recording (a live Waveform replaces the
 *                   text while listening, transcribed in real time).
 *   • recording   — a Stop square; tap to end and keep the transcript.
 *   • has text    — an X; tap to clear (or `onClear`, when the caller owns it).
 * The field auto-grows with its content, so a long answer reads in full.
 *
 * Controlled: pass `value` / `onChange` for the text. Used standalone, and as
 * the expanded form of a MultipleChoice `other` option.
 *
 * value:        the answer text
 * onChange:     next text (typing or live transcript)
 * onClear?:     overrides the X button's default (clear to ""), e.g. to let a
 *               container collapse the field when it's already empty
 * surface?:     "dark" | "light" (default "dark")
 * placeholder?: idle hint (default "Type or record your answer")
 * autoFocus?:   focus the field on mount
 */
type Props = {
  value: string;
  onChange: (v: string) => void;
  onClear?: () => void;
  surface?: "dark" | "light";
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
};

export function DictationTextArea({
  value,
  onChange,
  onClear,
  surface = "dark",
  placeholder = "Type or record your answer",
  autoFocus,
  className,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const recRef = useRef<RecognitionHandle | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const baseRef = useRef("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const dark = surface === "dark";
  const hasText = value.trim().length > 0;

  // Auto-grow: reset to a single row, then snap to the content height so the
  // field expands as the answer (typed or transcribed) gets longer.
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el || recording) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, recording]);

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
    // New speech appends to whatever's already typed.
    baseRef.current = value.trim();
    const join = (t: string) => (baseRef.current ? `${baseRef.current} ${t}` : t).trim();
    const handle = startRecognition({
      onTranscript: (t) => onChange(join(t)),
      onFinal: (t) => {
        recRef.current = null;
        setRecording(false);
        stopAnalyser();
        onChange(join(t));
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

  const stopRecord = () => recRef.current?.stop();
  const clear = () => (onClear ? onClear() : onChange(""));

  useEffect(
    () => () => {
      recRef.current?.abort();
      recRef.current = null;
      stopAnalyser();
    },
    [],
  );

  return (
    <div
      className={cn(
        "rounded-2xl border pl-4 pr-2 py-2 flex items-center gap-2 transition-colors backdrop-blur-sm",
        dark ? "bg-black/20" : "bg-white/40",
        // The field reads as the active answer: an opaque edge while focused,
        // recording, or holding text; a quiet edge only when idle and empty.
        recording || hasText
          ? dark
            ? "border-white"
            : "border-foreground"
          : dark
            ? "border-white/30 focus-within:border-white"
            : "border-foreground/30 focus-within:border-foreground",
        className,
      )}
    >
      {recording ? (
        <Waveform
          className="flex-1 h-7"
          barClassName={dark ? "bg-white" : "bg-foreground"}
          analyser={analyser}
        />
      ) : (
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "flex-1 resize-none bg-transparent outline-none text-base leading-relaxed min-w-0 max-h-40",
            dark
              ? "text-white placeholder:text-white/50"
              : "text-foreground placeholder:text-foreground/45",
          )}
        />
      )}

      {recording ? (
        <Button
          surface={surface}
          variant="primary"
          size="icon"
          pressed
          aria-label="Stop recording"
          onClick={stopRecord}
          className="shrink-0 ring-4 ring-foreground/15"
        >
          <Square strokeWidth={2} fill="currentColor" aria-hidden />
        </Button>
      ) : hasText ? (
        <Button
          surface={surface}
          variant="primary"
          size="icon"
          aria-label="Clear answer"
          onClick={clear}
          className="shrink-0"
        >
          <X strokeWidth={2} aria-hidden />
        </Button>
      ) : (
        <Button
          surface={surface}
          variant="primary"
          size="icon"
          aria-label="Record answer"
          onClick={startRecord}
          className="shrink-0"
        >
          <Mic strokeWidth={1.75} aria-hidden />
        </Button>
      )}
    </div>
  );
}
DictationTextArea.displayName = "DictationTextArea";
