import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { WebShell, WebContent } from "@/components/WebShell";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { Toast, ToastViewport } from "@/components/Toast";
import { RatingScale } from "@/components/RatingScale";
import { DictationField } from "@/components/DictationField";
import { YunaAvatar } from "@/components/YunaAvatar";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { MeditationPlayer } from "@/components/MeditationPlayer";
import { RadialProgress } from "@/components/RadialProgress";
import { KEYBOARD_HEIGHT } from "@/components/KeyboardSimulator";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { VOICES, DEFAULT_VOICE } from "@/lib/voices";
import { getVoice, useYunaIdentity } from "@/lib/yuna-session";
import { useAppMode } from "@/lib/theme-prefs";

type Step = "create" | "crafting" | "player" | "complete";
const STEPS: Step[] = ["create", "crafting", "player", "complete"];

export const Route = createFileRoute("/meditation")({
  // Admin sidebar deep-links each screen of the flow via ?step=…
  validateSearch: (s: Record<string, unknown>): { step?: Step } => {
    const step = STEPS.includes(s.step as Step) ? (s.step as Step) : undefined;
    return step ? { step } : {};
  },
  head: () => ({ meta: [{ title: "Create A Meditation — Yuna" }] }),
  component: MeditationRoute,
});

const PRESETS = [
  "Morning Inspiration",
  "Navigating Change",
  "Staying Present",
  "Burnout",
  "Relieve Stress",
];

const MIN_MINUTES = 1;
const MAX_MINUTES = 20;

const CRAFTING_STATUS = [
  "Reviewing your conversations…",
  "Composing your meditation…",
  "Preparing your voice…",
];

const FALLBACK_SCRIPT =
  "Let's begin. Settle into a comfortable position, and when you're ready, gently close your eyes… " +
  "Take a slow breath in through your nose… and let it go… " +
  "Notice the weight of your body, held and supported… " +
  "There's nothing to fix right now, nothing to solve. Just this breath… and the next… " +
  "If your mind wanders, that's okay. Softly bring it back to the rhythm of your breathing… " +
  "Stay here for a few quiet moments, letting each breath carry a little more ease… " +
  "When you're ready, let your awareness widen, and gently open your eyes.";

// Asks the chat endpoint to write the spoken meditation. Reuses the same SSE
// shape VoiceSession consumes; on any failure we fall back to a fixed script
// so the player always has something to speak.
async function generateScript(minutes: number, focus: string[]): Promise<string> {
  const focusLine = focus.length ? `Focus on: ${focus.join(", ")}.` : "";
  const ask =
    `[Write a guided meditation script of about ${minutes} ${minutes === 1 ? "minute" : "minutes"} ` +
    `when read slowly and aloud. ${focusLine} Speak directly to the listener in a calm, warm voice. ` +
    `Return only the spoken words, with gentle pauses written as ellipses. No headings, no labels, ` +
    `no stage directions.]`;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: ask }] }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) throw new Error(`chat ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    let buffer = "";
    let final = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const events = pending.split("\n\n");
      pending = events.pop() ?? "";
      for (const ev of events) {
        const lines = ev.split("\n");
        const eventLine = lines.find((l) => l.startsWith("event: "));
        const dataLine = lines.find((l) => l.startsWith("data: "));
        if (!eventLine || !dataLine) continue;
        const eventType = eventLine.slice(7);
        let data: { text?: string };
        try {
          data = JSON.parse(dataLine.slice(6));
        } catch {
          continue;
        }
        if (eventType === "delta" && typeof data.text === "string") buffer += data.text;
        else if (eventType === "done" && typeof data.text === "string") final = data.text;
      }
    }
    const out = (final || buffer).trim();
    if (out) return out;
  } catch (err) {
    console.warn("Meditation script generation failed; using fallback", err);
  } finally {
    clearTimeout(timeout);
  }
  return FALLBACK_SCRIPT;
}

function MeditationRoute() {
  const navigate = useNavigate();
  const { step: stepParam } = Route.useSearch();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const [step, setStep] = useState<Step>(stepParam ?? "create");
  const [minutes, setMinutes] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  // The drawer opens on its own first; focusing the field raises the simulated
  // keyboard, and we lift the sheet by its height so it rests on top of it.
  const [kbOpen, setKbOpen] = useState(false);

  // Crafting
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  // Player handoff
  const [script, setScript] = useState("");
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);

  // Completion
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [saved, setSaved] = useState(false);

  // Top-pinned toast (shared by "applied" + "saved")
  const [toast, setToast] = useState<{ message: string; variant: "neutral" | "success" } | null>(
    null,
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, variant: "neutral" | "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, variant });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  const toggleTag = useCallback((label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label],
    );
  }, []);

  const applyCustom = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setSelected((prev) => (prev.includes(text) ? prev : [...prev, text]));
      setDraft("");
      setDrawerOpen(false);
      showToast("Custom instructions have been applied!", "neutral");
    },
    [showToast],
  );

  // Custom (non-preset) selections render after the presets.
  const customTags = selected.filter((t) => !PRESETS.includes(t));

  // Jump to whichever screen the sidebar deep-links to. Internal flow
  // transitions go through setStep and never touch the URL, so this effect
  // (keyed on the URL step) won't fight them.
  useEffect(() => {
    if (stepParam) setStep(stepParam);
  }, [stepParam]);

  // ── Crafting: generate script + audio, animate progress, then advance ─────
  useEffect(() => {
    if (step !== "crafting") return;
    let cancelled = false;
    setProgress(0);
    setStatusIdx(0);

    const bump = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + 3));
    }, 200);
    const cycle = setInterval(() => {
      setStatusIdx((i) => (i + 1) % CRAFTING_STATUS.length);
    }, 1800);

    (async () => {
      const voiceId = getVoice() ?? DEFAULT_VOICE;
      const text = await generateScript(minutes, selected);
      if (cancelled) return;
      let url: string | null = null;
      try {
        url = await fetchTtsBlobUrl(VOICES[voiceId].elevenlabsId, text);
      } catch (err) {
        console.warn("Meditation TTS failed; player will run audio-free", err);
      }
      if (cancelled) return;
      clearInterval(bump);
      setScript(text);
      setVoiceUrl(url);
      setProgress(100);
      setTimeout(() => {
        if (!cancelled) setStep("player");
      }, 450);
    })();

    return () => {
      cancelled = true;
      clearInterval(bump);
      clearInterval(cycle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <WebShell>
      {/* Immersive single-task flow: keep the rail for escape, top-anchor the
          single column (matching goals + the content screens so the header sits
          at a consistent Y on desktop), and let each step flow naturally rather
          than pinning CTAs to a phone's bottom edge. */}
      <div className="relative flex flex-col items-center min-h-[100svh] md:min-h-screen text-white">
        {toast && (
          <ToastViewport>
            <Toast
              variant={toast.variant}
              surface={surface}
              message={toast.message}
              onDismiss={() => setToast(null)}
            />
          </ToastViewport>
        )}

        {/* The setup step uses the standard content well (wide, top-anchored
            header at the shared Y); the immersive in-flow steps stay in a narrow
            centered column. */}
        {step === "create" ? (
          <CreateView
            minutes={minutes}
            onMinutes={setMinutes}
            presets={PRESETS}
            customTags={customTags}
            selected={selected}
            onToggleTag={toggleTag}
            onOpenCustomize={() => setDrawerOpen(true)}
            onStart={() => setStep("crafting")}
          />
        ) : (
          // Fill the shell's height so the immersive steps can vertically center
          // their content (each step is `flex-1 … justify-center`).
          <div className="w-full max-w-2xl flex-1 flex flex-col min-h-0">
            {step === "crafting" && (
              <CraftingView percent={progress} status={CRAFTING_STATUS[statusIdx]} />
            )}

            {step === "player" && (
              <MeditationPlayer
                minutes={minutes}
                // Deep-linking straight to the player skips generation, so fall
                // back to the fixed script rather than rendering an empty reader.
                script={script || FALLBACK_SCRIPT}
                voiceUrl={voiceUrl}
                onFinish={() => setStep("complete")}
              />
            )}

            {step === "complete" && (
              <CompleteView
                rating={rating}
                onRate={setRating}
                saved={saved}
                onSave={() => {
                  setSaved(true);
                  showToast("The meditation has been saved!", "success");
                }}
                onClose={() => navigate({ to: "/home" })}
              />
            )}
          </div>
        )}
      </div>

      <Drawer
        // vaul's keyboard accommodation keys off visualViewport, which our
        // simulated keyboard doesn't move — so we lift the sheet ourselves
        // (see kbOpen) and leave vaul's real-keyboard handling off.
        repositionInputs={false}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) {
            setKbOpen(false);
            // Drop focus on close so the on-screen keyboard dismisses with it.
            if (typeof document !== "undefined") {
              (document.activeElement as HTMLElement | null)?.blur();
            }
          }
        }}
      >
        <DrawerContent
          style={{
            marginBottom: kbOpen ? KEYBOARD_HEIGHT : 0,
            transition:
              "margin-bottom 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <CustomizeDrawer
            draft={draft}
            onDraft={setDraft}
            onApply={applyCustom}
            onKeyboard={setKbOpen}
          />
        </DrawerContent>
      </Drawer>
    </WebShell>
  );
}

// ─── Create ───────────────────────────────────────────────────────────────

function CreateView({
  minutes,
  onMinutes,
  presets,
  customTags,
  selected,
  onToggleTag,
  onOpenCustomize,
  onStart,
}: {
  minutes: number;
  onMinutes: (n: number) => void;
  presets: string[];
  customTags: string[];
  selected: string[];
  onToggleTag: (label: string) => void;
  onOpenCustomize: () => void;
  onStart: () => void;
}) {
  const surface = useAppMode() === "light" ? "light" : "dark";
  return (
    <WebContent className="text-white yuna-fade-in">
      <header className="text-center">
        <h1 className="font-display text-3xl lg:text-4xl leading-tight tracking-tight text-white">
          Guided Audio
        </h1>
        <p className="mt-2 text-sm leading-snug text-white/85">
          Personalized meditations and breathing exercises
        </p>
      </header>

      <div className="mx-auto max-w-3xl">
        <div className="mt-8 flex flex-col items-center text-center">
          <p className="text-sm text-white/85">How long do you have?</p>
          <DurationDial value={minutes} min={MIN_MINUTES} max={MAX_MINUTES} onChange={onMinutes} />
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          <p className="text-sm text-white/85">Tell me what we should focus on</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {presets.map((p) => (
              <Tag key={p} surface={surface} selected={selected.includes(p)} onClick={() => onToggleTag(p)}>
                {p}
              </Tag>
            ))}
            {customTags.map((t) => (
              <Tag key={t} surface={surface} selected onClick={() => onToggleTag(t)}>
                {t}
              </Tag>
            ))}
            <Tag surface={surface} aria-label="Add custom instructions" onClick={onOpenCustomize}>
              <Plus />
            </Tag>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center">
          <Button surface={surface} variant="primary" fullWidth onClick={onStart} className="max-w-sm">
            Start meditation
          </Button>
        </div>
      </div>
    </WebContent>
  );
}

// One-off radial duration control. No DS equivalent exists (Slider is linear /
// bipolar only); kept local to this flow rather than promoted to the DS.
function DurationDial({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const SIZE = 240;
  const STROKE = 6;
  const R = SIZE / 2 - STROKE - 8;
  const C = SIZE / 2;
  const CIRC = 2 * Math.PI * R;

  const frac = (value - min) / (max - min);
  const angRad = (-90 + frac * 360) * (Math.PI / 180);
  const knobX = C + R * Math.cos(angRad);
  const knobY = C + R * Math.sin(angRad);

  // SVG stroke/fill aren't touched by the `.theme-light` shim (it only remaps
  // text-white / border-white), so branch the dial colors on app mode directly
  // — otherwise the white arc vanishes on the light photo.
  const ink = useAppMode() === "light";
  const trackCls = ink ? "stroke-foreground/15" : "stroke-white/15";
  const progCls = ink ? "stroke-foreground" : "stroke-white";
  const knobCls = ink ? "fill-foreground" : "fill-white";

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const pointToValue = (clientX: number, clientY: number): number | null => {
    const el = svgRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);
    let fromTop = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (fromTop < 0) fromTop += 360;
    const next = Math.round(min + (fromTop / 360) * (max - min));
    // Guard the 12-o'clock seam: ignore moves that would jump most of the
    // range at once (dragging slightly across the top shouldn't snap 1 ↔ 20).
    if (Math.abs(next - valueRef.current) > (max - min) * 0.6) return null;
    return Math.min(max, Math.max(min, next));
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    svgRef.current?.setPointerCapture(e.pointerId);
    const v = pointToValue(e.clientX, e.clientY);
    if (v != null) onChange(v);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const v = pointToValue(e.clientX, e.clientY);
    if (v != null) onChange(v);
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    dragging.current = false;
    svgRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="relative mt-4" style={{ width: SIZE, height: SIZE }}>
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="touch-none select-none cursor-pointer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label="Meditation length in minutes"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <circle cx={C} cy={C} r={R} fill="none" strokeWidth={STROKE} className={trackCls} />
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          className={progCls}
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - frac)}
          transform={`rotate(-90 ${C} ${C})`}
        />
        <circle cx={knobX} cy={knobY} r={9} className={knobCls} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl leading-none text-white">{value}</span>
        <span className="mt-1 text-sm text-white/70">minutes</span>
      </div>
    </div>
  );
}

// ─── Customize drawer body ──────────────────────────────────────────────────

function CustomizeDrawer({
  draft,
  onDraft,
  onApply,
  onKeyboard,
}: {
  draft: string;
  onDraft: (v: string) => void;
  onApply: (text: string) => void;
  onKeyboard: (open: boolean) => void;
}) {
  const { avatar } = useYunaIdentity();
  return (
    <div
      className="px-6 pt-3 pb-8 flex flex-col items-center text-center gap-3"
      // focusin/out bubble, so a single handler here tracks the field's focus
      // and drives the sheet lift in MeditationRoute.
      onFocus={() => onKeyboard(true)}
      onBlur={() => onKeyboard(false)}
    >
      <YunaAvatar variant={avatar ?? DEFAULT_VOICE} size={64} />
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-uppercase tracking-[0.24em] uppercase text-white/70">
          Customize your meditation
        </span>
        <p className="max-w-[16rem] text-sm leading-snug text-white/85">
          Share what you'd like to focus on or the kind of meditation you need
        </p>
      </div>
      <DictationField
        surface="dark"
        value={draft}
        onChange={onDraft}
        onSubmit={onApply}
        placeholder="Type your instructions"
      />
    </div>
  );
}

// ─── Crafting ───────────────────────────────────────────────────────────────

function CraftingView({ percent, status }: { percent: number; status: string }) {
  const surface = useAppMode() === "light" ? "light" : "dark";

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8 py-12 text-center yuna-fade-in">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-display text-3xl tracking-tight text-white">Crafting Your Session…</h1>
        <p className="text-sm text-white/80">You can prepare by taking a long, slow breath.</p>
      </div>

      <RadialProgress
        value={percent / 100}
        surface={surface}
        aria-label={`${Math.round(percent)} percent`}
      >
        <span className="font-display text-5xl leading-none text-white">
          {Math.round(percent)}%
        </span>
      </RadialProgress>

      <p className="text-sm text-white/70">{status}</p>
    </div>
  );
}

// ─── Completion ─────────────────────────────────────────────────────────────

function CompleteView({
  rating,
  onRate,
  saved,
  onSave,
  onClose,
}: {
  rating: "up" | "down" | null;
  onRate: (v: "up" | "down") => void;
  saved: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const surface = useAppMode() === "light" ? "light" : "dark";
  return (
    <div className="flex-1 flex flex-col px-8 pt-14 pb-10 md:justify-center md:gap-8 yuna-fade-in min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex-1 md:flex-none flex flex-col items-center justify-center text-center gap-6">
        <div className="relative flex items-center justify-center h-28 w-28 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm">
          <span className="text-5xl" aria-hidden>
            🎉
          </span>
        </div>

        <h1 className="font-display text-3xl leading-tight tracking-tight text-white max-w-[16rem]">
          Great job completing this meditation.
        </h1>

        <div className="flex flex-col items-center gap-3">
          <span className="text-uppercase tracking-[0.2em] uppercase text-white/70">
            Rate your meditation?
          </span>
          <RatingScale<"up" | "down">
            surface={surface}
            ariaLabel="Rate your meditation"
            value={rating}
            onChange={onRate}
            options={[
              { value: "down", content: <ThumbsDown size={24} strokeWidth={1.75} />, label: "Not helpful" },
              { value: "up", content: <ThumbsUp size={24} strokeWidth={1.75} />, label: "Helpful" },
            ]}
          />
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center gap-3 [&>button]:max-w-sm">
        <Button
          surface={surface}
          variant="secondary"
          fullWidth
          onClick={onSave}
          disabled={saved}
          aria-pressed={saved}
        >
          {saved ? (
            <>
              <Check size={18} strokeWidth={2} />
              Saved
            </>
          ) : (
            "Save this meditation"
          )}
        </Button>
        <Button surface={surface} variant="secondary" fullWidth>
          Share Yuna
        </Button>
        <Button surface={surface} variant="primary" fullWidth onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
