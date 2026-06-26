import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { WebContent } from "@/components/WebShell";
import { Button } from "@/components/Button";
import { Slider } from "@/components/Slider";
import { Surface } from "@/components/Surface";
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
import { cn } from "@/lib/utils";
import { usePlatform } from "@/lib/platform";
import { useAdminChrome } from "@/lib/admin-chrome";
import { isLightMode, useAppMode, useModeImage } from "@/lib/theme-prefs";

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
  // Focused-takeover theming (mirrors chat.tsx): no nav rail — the reflection
  // owns the viewport. Paint the mode photo and apply the .theme-light /
  // .platform-android shims so reused DS components read across all four
  // mode × platform combos; md:pl-72 clears the admin sidebar while shown.
  const appMode = useAppMode();
  const light = isLightMode(appMode);
  const bg = useModeImage();
  const platform = usePlatform();
  const adminChrome = useAdminChrome();

  const quotes = useMemo(() => extractQuotes(), []);
  const displayQuotes = quotes.length > 0 ? quotes : FALLBACK_QUOTES;

  // Bipolar reflection sliders rest at center (0). Touched flags let us persist
  // null when the user never moved them, so "neutral" stays distinct from "no input."
  const [stress, setStress] = useState(0);
  const [mood, setMood] = useState(0);
  const [stressTouched, setStressTouched] = useState(false);
  const [moodTouched, setMoodTouched] = useState(false);

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
    <div
      className={cn(
        "min-h-screen w-full bg-cover bg-center bg-fixed text-white",
        adminChrome && "md:pl-72",
        light && "theme-light",
        platform === "android" && "platform-android",
      )}
      style={{
        backgroundImage: light
          ? `url(${bg})`
          : `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url(${bg})`,
      }}
    >
      <WebContent width="max-w-xl" className="yuna-fade-in">
        <div className="flex flex-col gap-16">
          {/* Top cluster — the label/close bar and keepsake card stay tight;
              the wider section gap only kicks in from the reflection onward. */}
          <div className="flex flex-col gap-6">
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
            <HeroKeepsakeCard message={HERO_MESSAGE} avatar={avatar} onShare={() => undefined} />
          </div>

          {/* ── Reflection: how did the session land? ───────────────────── */}
          <ReflectionSection
            stress={stress}
            stressTouched={stressTouched}
            onStressChange={(v) => {
              setStress(v);
              setStressTouched(true);
            }}
            mood={mood}
            moodTouched={moodTouched}
            onMoodChange={(v) => {
              setMood(v);
              setMoodTouched(true);
            }}
          />

          {/* ── Emotions ────────────────────────────────────────────────── */}
          <EmotionsSection emotions={EMOTIONS} />

          {/* ── Change-talk highlights ──────────────────────────────────── */}
          <HighlightsSection quotes={displayQuotes} />

          {/* ── New activities ──────────────────────────────────────────── */}
          <PlacedForYou items={PLACED_FOR_YOU} />

          <Button surface="dark" variant="primary" fullWidth onClick={onDone}>
            Finish session
          </Button>
        </div>
      </WebContent>
    </div>
  );
}

// ── Reflection: how did the session land? ──────────────────────────────────────
// Two center-out (bipolar) sliders let the user self-report the directional shift
// the session produced — stress and mood. Rests at center; the active end label
// emphasises once moved. Lives outside a card so it reads at body width.
function ReflectionSection({
  stress,
  stressTouched,
  onStressChange,
  mood,
  moodTouched,
  onMoodChange,
}: {
  stress: number;
  stressTouched: boolean;
  onStressChange: (v: number) => void;
  mood: number;
  moodTouched: boolean;
  onMoodChange: (v: number) => void;
}) {
  return (
    <section className="flex flex-col gap-9 yuna-rise">
      <h2 className="font-display text-xl leading-tight text-white text-center">
        How did this session land?
      </h2>

      <div className="flex flex-col gap-9">
        <Slider
          variant="bipolar"
          surface="dark"
          leftLabel="Increased stress"
          rightLabel="Decreased stress"
          value={stress}
          touched={stressTouched}
          onChange={onStressChange}
        />
        <Slider
          variant="bipolar"
          surface="dark"
          leftLabel="Worsened mood"
          rightLabel="Improved mood"
          value={mood}
          touched={moodTouched}
          onChange={onMoodChange}
        />
      </div>
    </section>
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
