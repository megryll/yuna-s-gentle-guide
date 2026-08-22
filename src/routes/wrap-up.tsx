import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Surface } from "@/components/Surface";
import { WrapUpReflection } from "@/components/WrapUpReflection";
import { Accordion } from "@/components/Accordion";
import {
  HeroKeepsakeCard,
  EmotionDonut,
  HighlightsSection,
  PlacedForYou,
} from "@/components/SessionReflection";
import { useYunaIdentity } from "@/lib/yuna-session";
import { clearStoredMessages, loadStoredMessages, type ChatMsg } from "@/lib/chat-store";
import { keepsakeUid, saveKeepsake, type Keepsake } from "@/lib/keepsakes";
import { HOME_CARDS, type HomeCard } from "@/lib/home-cards";
import { setUserType } from "@/lib/user-type";
import { requestSchedulePrompt } from "@/lib/schedule-prompt";
import { useWrapUpVariant } from "@/lib/session-dev";

export const Route = createFileRoute("/wrap-up")({
  head: () => ({
    meta: [
      { title: "Session wrap-up — Yuna" },
      { name: "description", content: "A reflection from your conversation." },
    ],
  }),
  component: WrapUp,
});

// Hero keepsake shown in the photo card. Comma, not an em dash, per Yuna's voice.
const HERO_MESSAGE = "Keep shining, you're making remarkable progress.";

// Detected-emotion breakdown for the session. Hues come from the secondary
// palette tokens (soft, on-brand, mode-stable — see styles.css) rather than the
// saturated chart primaries of the reference mock. Values sum to 100. A real
// impl would classify the transcript server-side.
type Emotion = { name: string; value: number; color: string; note: string };

const EMOTIONS: Emotion[] = [
  {
    name: "Joy",
    value: 45,
    color: "var(--peach-soft)",
    note: "This came through as you talked about making space to rest.",
  },
  {
    name: "Trust",
    value: 25,
    color: "var(--blue)",
    note: "You leaned into this as you shared what's been weighing on you.",
  },
  {
    name: "Surprise",
    value: 12,
    color: "var(--amber)",
    note: "A few moments caught you off guard as you reflected.",
  },
  {
    name: "Fear",
    value: 10,
    color: "var(--purple-soft)",
    note: "This sat underneath the worry about getting everything done.",
  },
  {
    name: "Sadness",
    value: 8,
    color: "var(--teal-soft)",
    note: "A quieter thread, present when you spoke about feeling stretched thin.",
  },
];

// Two list-view home cards Yuna surfaces as new activities for this session.
const PLACED_FOR_YOU: HomeCard[] = HOME_CARDS.filter((c) => c.isNew).slice(0, 2);

// Fallback change-talk quotes when the session has no substantive user turns.
const FALLBACK_QUOTES = [
  "Maybe I could try to organize my tasks better and take some time off to relax.",
  "I think I'll start by making a list of all the tasks I need to do and then prioritize them. I also want to set aside some time each day for relaxation.",
  "Yes, I think I might need to do that. Thank you for your support.",
];

function WrapUp() {
  const navigate = useNavigate();
  const { avatar } = useYunaIdentity();
  const idRef = useRef<string>(keepsakeUid());
  // A/B variant from the EngineerSidebar. Anything but "current" drops the hero
  // keepsake card and leads the screen with the stress/mood reflection instead.
  const variant = useWrapUpVariant();
  const reflectionFirst = variant !== "current";

  const quotes = useMemo(() => extractQuotes(), []);
  const displayQuotes = quotes.length > 0 ? quotes : FALLBACK_QUOTES;

  // Bipolar reflection sliders rest at center (0). Touched flags let us persist
  // null when the user never moved them, so "neutral" stays distinct from "no input."
  const [stress, setStress] = useState(0);
  const [mood, setMood] = useState(0);
  const [stressTouched, setStressTouched] = useState(false);
  const [moodTouched, setMoodTouched] = useState(false);

  const resetReflection = useCallback(() => {
    setStress(0);
    setMood(0);
    setStressTouched(false);
    setMoodTouched(false);
  }, []);

  // Switching A/B variants starts the new one unanswered. The answers live up
  // here so they survive a treatment swap, which is wrong for review: you'd
  // land on a variant's submitted state and never see how it opens.
  useEffect(() => {
    resetReflection();
  }, [variant, resetReflection]);

  const reflectionValues = {
    stress,
    stressTouched,
    onStressChange: (v: number) => {
      setStress(v);
      setStressTouched(true);
    },
    mood,
    moodTouched,
    onMoodChange: (v: number) => {
      setMood(v);
      setMoodTouched(true);
    },
  };

  const onDone = () => {
    const k: Keepsake = {
      id: idRef.current,
      quote: HERO_MESSAGE,
      themes: [],
      mood: moodTouched ? mood : null,
      stress: stressTouched ? stress : null,
      createdAt: Date.now(),
    };
    saveKeepsake(k);
    clearStoredMessages();
    setUserType("returning");
    requestSchedulePrompt();
    navigate({ to: "/home" });
  };

  return (
    <PhoneFrame backgroundImage="/background.png" themed>
      <div className="flex-1 flex flex-col px-8 text-white min-h-0">
        <div className="flex-1 flex flex-col gap-16 overflow-y-auto overflow-x-hidden -mx-2 px-2 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Top cluster — the label/close bar and keepsake card stay tight;
              the wider section gap only kicks in from the reflection onward.
              pt-14 lives here (the first scroll child, like a back-arrow
              header) rather than on the scroll wrapper, so it doesn't eat
              viewport per the photo-bg-scrolling padding rule. */}
          <div className={"flex flex-col pt-14 " + (reflectionFirst ? "gap-9" : "gap-6")}>
            {/* ── Title bar: centered eyebrow, close button pinned right ──── */}
            <div className="relative flex items-center justify-center">
              <p className="text-uppercase tracking-[0.32em] uppercase text-white/75">
                Session complete
              </p>
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <Button
                  surface="dark"
                  variant="plain"
                  size="icon"
                  onClick={onDone}
                  aria-label="Close wrap-up"
                >
                  <X strokeWidth={1.6} aria-hidden />
                </Button>
              </div>
            </div>

            {/* ── Hero keepsake card ──────────────────────────────────────── */}
            {!reflectionFirst && (
              <HeroKeepsakeCard message={HERO_MESSAGE} avatar={avatar} onShare={() => undefined} />
            )}

            {/* The variants promote the reflection into the top cluster, where
                the keepsake card used to sit, so it owns the first screenful.
                Keyed on the variant so a treatment swap remounts it: sibling
                variants share an element shape, so without the key React reuses
                the instance and its internal state (a reward panel's
                already-celebrated flag, a slider's press state) leaks across. */}
            {reflectionFirst && (
              <WrapUpReflection key={variant} variant={variant} values={reflectionValues} />
            )}
          </div>

          {/* ── Reflection: how did the session land? ───────────────────── */}
          {!reflectionFirst && (
            <WrapUpReflection key={variant} variant={variant} values={reflectionValues} />
          )}

          {/* ── Emotions ────────────────────────────────────────────────── */}
          <EmotionsSection emotions={EMOTIONS} />

          {/* ── Change-talk highlights ──────────────────────────────────── */}
          <HighlightsSection quotes={displayQuotes} />

          {/* ── New activities ──────────────────────────────────────────── */}
          <PlacedForYou items={PLACED_FOR_YOU} />

          <div className="pt-2 pb-2">
            <Button surface="dark" variant="primary" fullWidth onClick={onDone}>
              Finish session
            </Button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── Emotions ──────────────────────────────────────────────────────────────────
// A donut of the session's detected emotions, with an expandable legend below.
function EmotionsSection({ emotions }: { emotions: Emotion[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="flex flex-col gap-6 yuna-rise">
      <h2 className="font-display text-xl leading-tight text-white text-center">
        Your emotions
      </h2>

      <div className="flex justify-center">
        <EmotionDonut data={emotions} />
      </div>

      <ul className="flex flex-col gap-2">
        {emotions.map((e, i) => (
          <li key={e.name}>
            <EmotionRow
              emotion={e}
              expanded={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmotionRow({
  emotion,
  expanded,
  onToggle,
}: {
  emotion: Emotion;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Surface radius="xl" className="overflow-hidden">
      <Accordion
        open={expanded}
        onOpenChange={onToggle}
        triggerLabel={emotion.name}
        header={
          <>
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: emotion.color }}
            />
            <span className="flex-1 text-base text-white/90">{emotion.name}</span>
            <span className="text-sm font-medium tracking-[0.02em] text-white/75">
              {emotion.value}%
            </span>
          </>
        }
      >
        <p className="px-4 pb-3.5 text-sm leading-relaxed text-white/75">{emotion.note}</p>
      </Accordion>
    </Surface>
  );
}

// ── Quote extraction ──────────────────────────────────────────────────────────
// Pick up to three substantive user text turns from the stored conversation.
function extractQuotes(): string[] {
  const messages = loadStoredMessages();
  const candidates = messages
    .filter((m): m is Extract<ChatMsg, { kind: "text" }> => m.kind === "text")
    .filter((m) => m.from === "you")
    .map((m) => m.text.trim())
    .filter((t) => t.split(/\s+/).length >= 5);

  const seen = new Set<string>();
  return [...candidates]
    .sort((a, b) => b.length - a.length)
    .filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .slice(0, 3);
}
