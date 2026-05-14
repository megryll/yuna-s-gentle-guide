import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import { HomeCardRow } from "@/components/HomeCards";
import { useYunaIdentity } from "@/lib/yuna-session";
import {
  clearStoredMessages,
  loadStoredMessages,
  type ChatMsg,
} from "@/lib/chat-store";
import { keepsakeUid, saveKeepsake, type Keepsake } from "@/lib/keepsakes";
import { HOME_CARDS, type HomeCard } from "@/lib/home-cards";
import { setUserType } from "@/lib/user-type";

export const Route = createFileRoute("/wrap-up")({
  head: () => ({
    meta: [
      { title: "Session wrap-up — Yuna" },
      { name: "description", content: "A reflection from your conversation." },
    ],
  }),
  component: WrapUp,
});

type Status = "loading" | "ready" | "error";

// Hold the loading state for a beat even if the LLM resolves early. Keeps
// the skeleton on screen long enough to read as intentional rather than a
// flicker.
const MIN_LOADING_MS = 1250;

// Two list-view home cards Yuna surfaces as new activities for this session.
const PLACED_FOR_YOU: HomeCard[] = HOME_CARDS.filter((c) => c.isNew).slice(0, 2);

// 2×3 grid of self-reflection tags. Emoji + label; emoji first so the row
// scans as iconography → words.
const REFLECTION_TAGS: ReadonlyArray<{ label: string; emoji: string }> = [
  { label: "Improved mood", emoji: "🌤️" },
  { label: "Relieved stress", emoji: "😮‍💨" },
  { label: "Felt inspired", emoji: "✨" },
  { label: "Learned something", emoji: "💡" },
  { label: "Gained clarity", emoji: "💎" },
  { label: "Felt heard", emoji: "🫶" },
];

// Surfaced only when the user taps "None of these" — gives space for honest
// negative feedback without making it the default affordance.
const NEGATIVE_TAGS: ReadonlyArray<{ label: string; emoji: string }> = [
  { label: "Felt misunderstood", emoji: "😕" },
  { label: "Didn't help", emoji: "🙁" },
  { label: "Too generic", emoji: "📋" },
  { label: "Felt rushed", emoji: "⏱️" },
  { label: "Repeated itself", emoji: "🔁" },
  { label: "Made things worse", emoji: "💢" },
];

// Palette tying each detected emotion to a soft, readable hue. Real impl
// would classify the transcript server-side; this prototype hardcodes the
// pairings so the sentiment-tagged-quote pattern reads true.
const EMOTION_COLORS: Record<string, string> = {
  Overwhelm: "#F7A7A7",
  Relief: "#B3D4B0",
  Resolve: "#E8C77E",
  Hopefulness: "#A7C7E7",
  "Self-compassion": "#C5B6E0",
  Gratitude: "#F4C39F",
  Tenderness: "#F2B4D3",
  Curiosity: "#B5DEDB",
};
const TOTAL_EMOTIONS_DETECTED = 53;

// One highlight pairs a quote with the emotions Yuna heard underneath it.
type Highlight = { quote: string; emotions: string[] };

// Fallback used when the session has no substantive user turns. Quotes
// match the prototype's stress-and-planning theme.
const FALLBACK_HIGHLIGHTS: Highlight[] = [
  {
    quote:
      "Maybe I could try to organize my tasks better and take some time off to relax.",
    emotions: ["Overwhelm", "Resolve"],
  },
  {
    quote:
      "I think I'll start by making a list of all the tasks I need to do and then prioritize them. I also want to set aside some time each day for relaxation.",
    emotions: ["Relief", "Resolve", "Hopefulness"],
  },
  {
    quote:
      "Yes, I think I might need to do that. Thank you for your support.",
    emotions: ["Gratitude", "Self-compassion"],
  },
];

// Cycling emotion sets used when we pair real extracted quotes with
// prototype tags. Three sets keep enough variety that consecutive cards
// don't all repeat the same colors.
const PROTOTYPE_EMOTION_SETS: string[][] = [
  ["Overwhelm", "Resolve"],
  ["Relief", "Hopefulness"],
  ["Gratitude", "Self-compassion"],
  ["Curiosity", "Tenderness"],
];

function WrapUp() {
  const navigate = useNavigate();
  const { avatar } = useYunaIdentity();

  const [status, setStatus] = useState<Status>("loading");
  const [keepsake, setKeepsake] = useState<string>("");
  const [themes, setThemes] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [reflections, setReflections] = useState<string[]>([]);

  const idRef = useRef<string>(keepsakeUid());

  // Extract a small set of user-text quotes from the conversation to use as
  // session highlights. Memoized so loading transitions don't re-walk the
  // transcript on every render.
  const highlights = useMemo(() => extractHighlights(), []);

  useEffect(() => {
    const messages = loadStoredMessages();

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
      (async () => {
        await waitMinimum();
        if (cancelled) return;
        setKeepsake("You're making remarkable progress.");
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
        setKeepsake("You're making remarkable progress.");
        setThemes([]);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = (overrides?: { reflections?: string[] }) => {
    const k: Keepsake = {
      id: idRef.current,
      quote: keepsake,
      themes,
      note: note.trim() || undefined,
      reflections: (overrides?.reflections ?? reflections).length
        ? overrides?.reflections ?? reflections
        : undefined,
      mood: null,
      stress: null,
      createdAt: Date.now(),
    };
    saveKeepsake(k);
  };

  const onToggleReflection = (tag: string) => {
    setReflections((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const onShare = () => {
    const shareText = keepsake
      ? `From my Yuna session: "${keepsake}"`
      : "Just had a great session with Yuna.";
    if (typeof navigator !== "undefined" && "share" in navigator) {
      navigator.share({ text: shareText }).catch(() => {});
    }
  };

  const onDone = () => {
    if (keepsake) persist();
    clearStoredMessages();
    setUserType("returning");
    navigate({ to: "/home" });
  };

  const onViewActivities = () => {
    if (keepsake) persist();
    clearStoredMessages();
    setUserType("returning");
    navigate({ to: "/tools" });
  };

  const isLoading = status === "loading";
  const displayQuotes = highlights.length > 0 ? highlights : FALLBACK_HIGHLIGHTS;

  return (
    <PhoneFrame backgroundImage="/background.png" themed>
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10 text-white min-h-0">
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto overflow-x-hidden -mx-2 px-2 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isLoading ? (
            <SkeletonScreen />
          ) : (
            <>
              <SessionHero
                avatar={avatar}
                message={keepsake}
                onShare={onShare}
              />

              <ReflectionCard
                note={note}
                onNoteChange={setNote}
                reflections={reflections}
                onToggleReflection={onToggleReflection}
              />

              <HighlightsCard
                highlights={displayQuotes}
                totalEmotions={TOTAL_EMOTIONS_DETECTED}
              />

              <PlacedForYou
                items={PLACED_FOR_YOU}
                onViewAll={onViewActivities}
              />

              <div className="pt-2 pb-2">
                <Button
                  surface="dark"
                  variant="primary"
                  fullWidth
                  onClick={onDone}
                >
                  Finish session
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── Session hero ────────────────────────────────────────────────────────────
// Floating (no card) hero: tiny eyebrow, Yuna avatar, the personalized AI
// keepsake as the headline, and a Share action. White text gets a soft
// drop shadow so it stays legible against bright spots of the photo bg.
function SessionHero({
  avatar,
  message,
  onShare,
}: {
  avatar: AvatarVariant | null;
  message: string;
  onShare: () => void;
}) {
  return (
    <section className="flex flex-col items-center text-center gap-4 pt-1 pb-2 yuna-fade-in">
      <p className="font-sans-ui text-[10px] tracking-[0.32em] uppercase text-white/65 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
        Session complete
      </p>

      <span className="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center bg-white/10 shrink-0 ring-1 ring-white/15 drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]">
        {avatar ? (
          <YunaAvatar variant={avatar} size={64} />
        ) : (
          <span className="h-3 w-3 rounded-full bg-white" />
        )}
      </span>

      <p className="font-display italic text-[24px] leading-[1.3] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] max-w-[280px]">
        {message}
      </p>

      <Button
        surface="dark"
        variant="secondary"
        size="sm"
        onClick={onShare}
        className="mt-1"
      >
        <Share2 size={14} strokeWidth={1.75} aria-hidden />
        Share
      </Button>
    </section>
  );
}

// ── Reflection: tags + note ─────────────────────────────────────────────────
function ReflectionCard({
  note,
  onNoteChange,
  reflections,
  onToggleReflection,
}: {
  note: string;
  onNoteChange: (v: string) => void;
  reflections: string[];
  onToggleReflection: (tag: string) => void;
}) {
  const [negativeOpen, setNegativeOpen] = useState(false);
  const anyNegativeSelected = NEGATIVE_TAGS.some((t) =>
    reflections.includes(t.label),
  );

  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-sm px-5 py-6 flex flex-col gap-5 yuna-rise">
      <h2 className="font-['Stara'] text-[18px] leading-tight text-white">
        How did this session land?
      </h2>

      <div className="grid grid-cols-2 gap-2">
        {REFLECTION_TAGS.map((tag) => {
          const active = reflections.includes(tag.label);
          return (
            <button
              key={tag.label}
              type="button"
              onClick={() => onToggleReflection(tag.label)}
              aria-pressed={active}
              className={
                "relative w-full min-h-[40px] rounded-full px-3 text-[12px] leading-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors duration-150 active:scale-[0.97] " +
                (active
                  ? "bg-white text-neutral-900 border border-transparent shadow-[0_4px_18px_rgba(255,255,255,0.25)] tag-pop"
                  : "border border-white/25 bg-white/[0.04] text-white/85")
              }
            >
              <span aria-hidden className="text-[14px] leading-none translate-y-[-0.5px]">
                {tag.emoji}
              </span>
              <span className="leading-none">{tag.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setNegativeOpen((o) => !o)}
        aria-expanded={negativeOpen}
        className={
          "self-center text-[12px] leading-none active:text-white transition-colors " +
          (negativeOpen || anyNegativeSelected ? "text-white/85" : "text-white/65")
        }
      >
        None of these
      </button>

      {negativeOpen && (
        <div className="flex flex-col gap-3 yuna-fade-in">
          <p className="text-[12px] leading-relaxed text-white/75 italic">
            Sorry this session didn't land — what felt off?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {NEGATIVE_TAGS.map((tag) => {
              const active = reflections.includes(tag.label);
              return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => onToggleReflection(tag.label)}
                  aria-pressed={active}
                  className={
                    "relative w-full min-h-[40px] rounded-full px-3 text-[12px] leading-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors duration-150 active:scale-[0.97] " +
                    (active
                      ? "bg-white text-neutral-900 border border-transparent shadow-[0_4px_18px_rgba(255,255,255,0.25)] tag-pop"
                      : "border border-white/25 bg-white/[0.04] text-white/85")
                  }
                >
                  <span
                    aria-hidden
                    className="text-[14px] leading-none translate-y-[-0.5px]"
                  >
                    {tag.emoji}
                  </span>
                  <span className="leading-none">{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-white/12">
        <input
          type="text"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Add a note for yourself…"
          className="w-full bg-transparent text-sm py-3 outline-none placeholder:text-white/45 text-white"
          maxLength={140}
        />
      </div>
    </section>
  );
}

// ── Moments & emotions ──────────────────────────────────────────────────────
// One section. Each quote is shown with the emotions Yuna detected
// underneath it — sentiment-tagged highlights instead of a separate chart.
// The left-edge ribbon picks up the quote's emotion colors so the link
// between text and feeling is felt before it's read.
function HighlightsCard({
  highlights,
  totalEmotions,
}: {
  highlights: Highlight[];
  totalEmotions: number;
}) {
  if (highlights.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 yuna-rise">
      <header>
        <h2 className="font-display text-[18px] leading-tight text-white">
          Highlights and emotions
        </h2>
      </header>

      {highlights.map((h, i) => (
        <HighlightItem key={i} highlight={h} />
      ))}

      <p className="font-sans-ui text-[11px] leading-relaxed text-white/55 pt-1">
        Drawn from a vocabulary of {totalEmotions}+ emotional textures Yuna
        tracks across each conversation.
      </p>
    </section>
  );
}

function HighlightItem({ highlight }: { highlight: Highlight }) {
  const colors = highlight.emotions
    .map((e) => EMOTION_COLORS[e])
    .filter(Boolean);
  const ribbon =
    colors.length === 0
      ? "rgba(255,255,255,0.25)"
      : colors.length === 1
        ? colors[0]
        : `linear-gradient(180deg, ${colors.join(", ")})`;

  return (
    <div className="relative rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-4 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          padding: 2,
          background: ribbon,
          WebkitMask:
            "linear-gradient(90deg, #000 0px, #000 22px, transparent 32px), " +
            "linear-gradient(#000 0 0) content-box, " +
            "linear-gradient(#000 0 0)",
          WebkitMaskComposite: "source-in, xor",
          mask:
            "linear-gradient(90deg, #000 0px, #000 22px, transparent 32px), " +
            "linear-gradient(#000 0 0) content-box, " +
            "linear-gradient(#000 0 0)",
          maskComposite: "intersect, exclude",
        }}
      />
      <div className="flex flex-col gap-3">
        <p className="text-[14px] leading-relaxed text-white/90 italic">
          “{highlight.quote}”
        </p>

        {highlight.emotions.length > 0 && (
          <div className="pt-3 border-t border-white/12 flex flex-wrap gap-1.5">
            {highlight.emotions.map((name) => (
              <EmotionPill key={name} name={name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmotionPill({ name }: { name: string }) {
  const color = EMOTION_COLORS[name] ?? "rgba(255,255,255,0.5)";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/15 px-2.5 py-1 text-[11px] leading-none font-sans-ui text-white/85">
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      {name}
    </span>
  );
}

// ── Activities Yuna placed for you ──────────────────────────────────────────
function PlacedForYou({
  items,
  onViewAll,
}: {
  items: HomeCard[];
  onViewAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 yuna-rise">
      <h2 className="font-display text-[18px] leading-tight text-white">
        New activities
      </h2>

      <ul className="flex flex-col gap-2.5">
        {items.map((c) => (
          <li key={c.id}>
            <HomeCardRow card={c} onClick={onViewAll} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonScreen() {
  return (
    <div aria-busy aria-live="polite" className="flex flex-col gap-6 yuna-fade-in">
      <div className="flex flex-col gap-2">
        <SkeletonBar widthClass="w-[55%]" heightClass="h-7" />
        <SkeletonBar widthClass="w-[70%]" heightClass="h-3" />
      </div>

      <div className="relative rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm px-5 py-7 overflow-hidden min-h-[200px]">
        <span aria-hidden className="absolute inset-0 pointer-events-none keepsake-shimmer" />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="block h-9 w-9 rounded-full bg-white/15" />
            <span className="block h-5 w-5 rounded bg-white/15" />
          </div>
          <SkeletonBar widthClass="w-[40%]" heightClass="h-3" />
          <SkeletonBar widthClass="w-[90%]" />
          <SkeletonBar widthClass="w-[78%]" />
          <SkeletonBar widthClass="w-[55%]" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm px-5 py-6 flex flex-col gap-4">
        <SkeletonBar widthClass="w-[60%]" heightClass="h-4" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBar key={i} widthClass="w-full" heightClass="h-9" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonBar({
  widthClass,
  heightClass = "h-4",
}: {
  widthClass: string;
  heightClass?: string;
}) {
  return (
    <span
      className={`block ${heightClass} rounded-full bg-white/15 ${widthClass}`}
      style={{ animation: "yuna-fade 1.6s ease-in-out infinite alternate" }}
    />
  );
}

// ── Quote extraction ────────────────────────────────────────────────────────
// Pick up to three substantive user text turns to surface as highlights.
// Pairs each with a prototype emotion set so the sentiment column is
// populated — real impl would classify per quote.
function extractHighlights(): Highlight[] {
  const messages = loadStoredMessages();
  const candidates = messages
    .filter((m): m is Extract<ChatMsg, { kind: "text" }> => m.kind === "text")
    .filter((m) => m.from === "you")
    .map((m) => m.text.trim())
    .filter((t) => t.split(/\s+/).length >= 5);

  const seen = new Set<string>();
  const ranked = [...candidates]
    .sort((a, b) => b.length - a.length)
    .filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .slice(0, 3);

  return ranked.map((quote, i) => ({
    quote,
    emotions: PROTOTYPE_EMOTION_SETS[i % PROTOTYPE_EMOTION_SETS.length],
  }));
}
