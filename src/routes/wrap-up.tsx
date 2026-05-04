import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import { useYunaIdentity } from "@/lib/yuna-session";
import {
  clearStoredMessages,
  loadStoredMessages,
  type ChatMsg,
} from "@/lib/chat-store";
import { keepsakeUid, saveKeepsake, type Keepsake } from "@/lib/keepsakes";

export const Route = createFileRoute("/wrap-up")({
  head: () => ({
    meta: [
      { title: "Session highlights — Yuna" },
      { name: "description", content: "A reflection from your conversation." },
    ],
  }),
  component: WrapUp,
});

type Status = "loading" | "ready" | "error";

// Sliders default to neutral — we only persist the value if the user
// actually moved them, so a "5/5" record can't be confused with "didn't rate."
const DEFAULT_SLIDER_VALUE = 5;

// Hold the loading state for a beat even if the LLM resolves early. Gives
// the user time to settle into the screen and (optionally) fiddle with the
// sliders before the reveal is offered.
const MIN_LOADING_MS = 6000;

function WrapUp() {
  const navigate = useNavigate();
  const { avatar } = useYunaIdentity();

  const [status, setStatus] = useState<Status>("loading");
  const [keepsake, setKeepsake] = useState<string>("");
  const [themes, setThemes] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  // The reveal flow is opt-in: even when the LLM has resolved, the user
  // taps the shimmering card to "open" it. Errors auto-reveal so the
  // fallback line shows up without a hidden button.
  const [revealed, setRevealed] = useState(false);

  const [stress, setStress] = useState(DEFAULT_SLIDER_VALUE);
  const [mood, setMood] = useState(DEFAULT_SLIDER_VALUE);
  const [stressTouched, setStressTouched] = useState(false);
  const [moodTouched, setMoodTouched] = useState(false);

  const idRef = useRef<string>(keepsakeUid());
  const transcriptLengthRef = useRef<number>(0);

  useEffect(() => {
    const messages = loadStoredMessages();
    transcriptLengthRef.current = messages.length;

    const textTurns = messages
      .filter((m): m is Extract<ChatMsg, { kind: "text" }> => m.kind === "text")
      .map((m) => ({
        role: m.from === "you" ? "user" : "assistant",
        content: m.text,
      }));

    let cancelled = false;
    const startedAt = Date.now();
    const waitMinimum = async () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
    };

    if (textTurns.length === 0) {
      // Empty transcript — still hold the reflective beat so the screen
      // doesn't snap straight to "ready".
      (async () => {
        await waitMinimum();
        if (cancelled) return;
        setKeepsake("Showing up at all is the part that mattered.");
        setThemes([]);
        setStatus("ready");
      })();
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const res = await fetch("/api/wrap-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: textTurns }),
        });
        if (!res.ok) throw new Error(`wrap-up ${res.status}`);
        const data = (await res.json()) as {
          keepsake?: string;
          themes?: string[];
        };
        const q = (data.keepsake ?? "").trim();
        if (!q) throw new Error("empty keepsake");
        await waitMinimum();
        if (cancelled) return;
        setKeepsake(q);
        setThemes(Array.isArray(data.themes) ? data.themes.slice(0, 3) : []);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.warn("Wrap-up generation failed", err);
        await waitMinimum();
        if (cancelled) return;
        setKeepsake("What you brought is worth carrying with you.");
        setThemes([]);
        setStatus("error");
        // Errors skip the reveal beat — show the fallback immediately.
        setRevealed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = () => {
    const k: Keepsake = {
      id: idRef.current,
      quote: keepsake,
      themes,
      note: note.trim() || undefined,
      mood: moodTouched ? mood : null,
      stress: stressTouched ? stress : null,
      createdAt: Date.now(),
    };
    saveKeepsake(k);
  };

  const onSaveToggle = () => {
    if (!saved) {
      persist();
      setSaved(true);
    } else {
      // No "unsave" UI elsewhere yet — just flip the visual.
      setSaved(false);
    }
  };

  const handleNoteBlur = () => {
    if (saved) persist();
  };

  const onDone = () => {
    if (saved) persist();
    clearStoredMessages();
    navigate({ to: "/home" });
  };

  return (
    <PhoneFrame backgroundImage="/background.png">
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10 text-white min-h-0">
        {/* Body — scrolls if it overflows on shorter phones */}
        <div className="flex-1 flex flex-col gap-8 overflow-y-auto -mx-2 px-2 pb-2">
          {/* Title sits above the card for the entire lifecycle so the user's
              focal point doesn't shift when content swaps in. */}
          <h1 className="font-display text-[26px] leading-tight tracking-tight text-white yuna-fade-in">
            Session highlights
          </h1>

          <HighlightCard
            status={status}
            revealed={revealed}
            avatar={avatar}
            keepsake={keepsake}
            note={note}
            onNoteChange={setNote}
            onNoteBlur={handleNoteBlur}
            saved={saved}
            onSaveToggle={onSaveToggle}
            onReveal={() => setRevealed(true)}
          />

          <CheckIn
            showHeader={!revealed}
            stress={stress}
            mood={mood}
            stressTouched={stressTouched}
            moodTouched={moodTouched}
            onStress={(v) => {
              setStress(v);
              setStressTouched(true);
            }}
            onMood={(v) => {
              setMood(v);
              setMoodTouched(true);
            }}
          />
        </div>

        <div className="pt-2">
          <Button surface="dark" variant="primary" fullWidth onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── Highlight card ──────────────────────────────────────────────────────────
// One card with three visual states:
//   loading              — quiet skeleton, "reflecting…" copy
//   ready (not revealed) — animated gradient sweep + "Reveal" button
//   revealed | error     — quote, themes, save toggle, note input
function HighlightCard({
  status,
  revealed,
  avatar,
  keepsake,
  note,
  onNoteChange,
  onNoteBlur,
  saved,
  onSaveToggle,
  onReveal,
}: {
  status: Status;
  revealed: boolean;
  avatar: AvatarVariant | null;
  keepsake: string;
  note: string;
  onNoteChange: (v: string) => void;
  onNoteBlur: () => void;
  saved: boolean;
  onSaveToggle: () => void;
  onReveal: () => void;
}) {
  if (revealed) {
    return (
      <div className="relative rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-sm px-5 py-6 flex flex-col gap-4 yuna-rise overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center bg-white/10 shrink-0">
            {avatar ? (
              <YunaAvatar variant={avatar} size={36} />
            ) : (
              <span className="h-2 w-2 rounded-full bg-white" />
            )}
          </span>
          <button
            type="button"
            onClick={onSaveToggle}
            aria-pressed={saved}
            aria-label={saved ? "Unsave highlight" : "Save highlight"}
            className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors active:scale-95"
          >
            <BookmarkIcon filled={saved} />
          </button>
        </div>

        <p className="font-display italic text-[22px] leading-[1.35] text-white">
          {keepsake}
        </p>

        <div className="pt-2 border-t border-white/12">
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            onBlur={onNoteBlur}
            placeholder="Add a note for yourself…"
            className="w-full bg-transparent text-sm py-2 outline-none placeholder:text-white/45 text-white"
            maxLength={140}
          />
        </div>
      </div>
    );
  }

  // Pre-reveal: skeleton bars sit in the back as texture; a centered
  // overlay carries the actual messaging (spinner + "loading" while we
  // wait, "your reflection is ready" + Reveal button when the LLM
  // resolves). On ready, the whole card adds a periodic gentle shake to
  // pull the user's eye back.
  const isReady = status === "ready";
  return (
    <div
      aria-busy={status === "loading"}
      aria-live="polite"
      className={
        "relative rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm px-5 py-8 overflow-hidden yuna-fade-in min-h-[200px] " +
        (isReady ? "keepsake-attention" : "")
      }
    >
      {/* Shimmer overlay — only animated on ready. */}
      <span
        aria-hidden
        className={
          "absolute inset-0 pointer-events-none " +
          (isReady ? "keepsake-shimmer" : "opacity-0")
        }
      />

      {/* Skeleton bars sit in document flow as background texture. */}
      <div className="relative flex flex-col gap-3 opacity-50">
        <SkeletonBar widthClass="w-[88%]" />
        <SkeletonBar widthClass="w-[72%]" />
        <SkeletonBar widthClass="w-[58%]" />
      </div>

      {/* Centered foreground — the focal copy + action. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 pointer-events-none">
        {!isReady ? (
          <>
            <Spinner size={22} />
            <p className="font-sans-ui text-sm tracking-[0.28em] uppercase text-white">
              loading
            </p>
          </>
        ) : (
          <>
            <p className="font-sans-ui text-sm tracking-[0.28em] uppercase text-white">
              your reflection is ready
            </p>
            <button
              type="button"
              onClick={onReveal}
              className="font-sans-ui text-[12px] tracking-[0.2em] uppercase text-white px-5 py-2.5 rounded-full border border-white/80 hover:border-white active:scale-[0.98] transition-transform pointer-events-auto"
            >
              Reveal
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonBar({ widthClass }: { widthClass: string }) {
  return (
    <span
      className={"block h-4 rounded-full bg-white/15 " + widthClass}
      style={{ animation: "yuna-fade 1.6s ease-in-out infinite alternate" }}
    />
  );
}

// ── Check-in ────────────────────────────────────────────────────────────────
function CheckIn({
  showHeader,
  stress,
  mood,
  stressTouched,
  moodTouched,
  onStress,
  onMood,
}: {
  showHeader: boolean;
  stress: number;
  mood: number;
  stressTouched: boolean;
  moodTouched: boolean;
  onStress: (v: number) => void;
  onMood: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5 yuna-rise">
      {showHeader && (
        <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/65">
          While you&apos;re waiting…
        </p>
      )}
      <SliderRow
        leftLabel="LOW STRESS"
        rightLabel="HIGH STRESS"
        value={stress}
        touched={stressTouched}
        onChange={onStress}
      />
      <SliderRow
        leftLabel="GOOD MOOD"
        rightLabel="BAD MOOD"
        value={mood}
        touched={moodTouched}
        onChange={onMood}
      />
    </div>
  );
}

// Same convention for both sliders: leftward (low value) = positive (green),
// rightward (high value) = negative (orange). Untouched stays muted so the
// user can tell whether they've actually rated it.
function SliderRow({
  leftLabel,
  rightLabel,
  value,
  touched,
  onChange,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
  touched: boolean;
  onChange: (v: number) => void;
}) {
  const fillClass = !touched
    ? "bg-white/85"
    : value <= 5
      ? "bg-gradient-to-r from-emerald-300 to-emerald-500"
      : "bg-gradient-to-r from-amber-300 to-orange-500";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between font-sans-ui text-[10px] tracking-[0.18em] uppercase text-white/75">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center h-5"
        min={0}
        max={10}
        step={0.01}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 0)}
        aria-label={`${leftLabel} to ${rightLabel}`}
      >
        <SliderPrimitive.Track className="relative h-[2px] w-full grow rounded-full bg-white/20">
          <SliderPrimitive.Range
            className={"absolute h-full rounded-full transition-colors " + fillClass}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full bg-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        />
      </SliderPrimitive.Root>
    </div>
  );
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="text-white shrink-0"
      style={{ animation: "yuna-spin 900ms linear infinite" }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="text-white"
    >
      <path
        d="M6 4h12v17l-6-4-6 4V4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}
