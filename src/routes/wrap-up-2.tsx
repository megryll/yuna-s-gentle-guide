import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ChevronDown, Share2, X } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { YunaAvatar } from "@/components/YunaAvatar";
import { HomeCardRow } from "@/components/HomeCards";
import { useYunaIdentity } from "@/lib/yuna-session";
import { clearStoredMessages, loadStoredMessages, type ChatMsg } from "@/lib/chat-store";
import { keepsakeUid, saveKeepsake, type Keepsake } from "@/lib/keepsakes";
import { HOME_CARDS, type HomeCard } from "@/lib/home-cards";
import { setUserType } from "@/lib/user-type";
import { requestSchedulePrompt } from "@/lib/schedule-prompt";

export const Route = createFileRoute("/wrap-up-2")({
  head: () => ({
    meta: [
      { title: "Session wrap-up — Yuna" },
      { name: "description", content: "A reflection from your conversation." },
    ],
  }),
  component: WrapUp2,
});

// Hero keepsake shown in the photo card. Comma, not an em dash, per Yuna's voice.
const HERO_MESSAGE = "Keep shining, you're making remarkable progress.";

// Detected-emotion breakdown for the session. Soft, on-brand hues (the same
// muted palette the wrap-up highlights use) rather than the saturated
// primaries of the reference mock. Values sum to 100. A real impl would
// classify the transcript server-side.
type Emotion = { name: string; value: number; color: string; note: string };

const EMOTIONS: Emotion[] = [
  {
    name: "Joy",
    value: 45,
    color: "#F4B183",
    note: "This came through as you talked about making space to rest.",
  },
  {
    name: "Trust",
    value: 25,
    color: "#A7C7E7",
    note: "You leaned into this as you shared what's been weighing on you.",
  },
  {
    name: "Surprise",
    value: 12,
    color: "#F2D08A",
    note: "A few moments caught you off guard as you reflected.",
  },
  {
    name: "Fear",
    value: 10,
    color: "#C5B6E0",
    note: "This sat underneath the worry about getting everything done.",
  },
  {
    name: "Sadness",
    value: 8,
    color: "#9FD0CB",
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

function WrapUp2() {
  const navigate = useNavigate();
  const { name, avatar } = useYunaIdentity();
  const idRef = useRef<string>(keepsakeUid());

  const quotes = useMemo(() => extractQuotes(), []);
  const displayQuotes = quotes.length > 0 ? quotes : FALLBACK_QUOTES;

  const onDone = () => {
    const k: Keepsake = {
      id: idRef.current,
      quote: HERO_MESSAGE,
      themes: [],
      mood: null,
      stress: null,
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
        <div className="flex-1 flex flex-col gap-9 overflow-y-auto overflow-x-hidden -mx-2 px-2 pt-14 pb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex justify-end -mb-4">
            <Button
              surface="dark"
              variant="secondary"
              size="icon"
              onClick={onDone}
              aria-label="Close wrap-up"
            >
              <X size={16} strokeWidth={1.6} aria-hidden />
            </Button>
          </div>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <header className="flex flex-col items-center text-center gap-3 pt-6 yuna-fade-in">
            <span className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center bg-white/10 shrink-0 ring-1 ring-white/15">
              {avatar ? (
                <YunaAvatar variant={avatar} size={56} />
              ) : (
                <span className="h-3 w-3 rounded-full bg-white" />
              )}
            </span>
            <h1 className="font-display text-[30px] leading-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
              Well done{name ? `, ${name}` : ""}!
            </h1>
            <p className="text-[15px] leading-relaxed text-white/85">
              Congrats on completing this session.
            </p>
          </header>

          {/* ── Hero keepsake card ──────────────────────────────────────── */}
          <HeroCard message={HERO_MESSAGE} onShare={() => undefined} />

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

// ── Hero keepsake card ────────────────────────────────────────────────────────
// Frosted card sized to its content: a centered keepsake line and a Share action.
function HeroCard({ message, onShare }: { message: string; onShare: () => void }) {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm px-6 py-7 flex flex-col items-center text-center gap-5 yuna-rise">
      <p className="font-display italic text-[24px] leading-[1.35] text-white max-w-[260px]">
        {message}
      </p>
      <Button surface="dark" variant="secondary" size="sm" onClick={onShare}>
        <Share2 size={15} strokeWidth={1.8} aria-hidden />
        Share
      </Button>
    </section>
  );
}

// ── Emotions ──────────────────────────────────────────────────────────────────
// A donut of the session's detected emotions, with an expandable legend below.
function EmotionsSection({ emotions }: { emotions: Emotion[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="flex flex-col gap-6 yuna-rise">
      <h2 className="font-display text-[20px] leading-tight text-white text-center">
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

function EmotionDonut({ data }: { data: Emotion[] }) {
  const size = 176;
  const stroke = 26;
  const cx = size / 2;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const gap = 6; // path units of empty space between segments

  let acc = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Emotion breakdown for this session"
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={stroke}
      />
      <g transform={`rotate(-90 ${cx} ${cx})`}>
        {data.map((d) => {
          const len = (d.value / 100) * circ;
          const dash = Math.max(len - gap, 1);
          const seg = (
            <circle
              key={d.name}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return seg;
        })}
      </g>
    </svg>
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
    <div className="rounded-xl border border-white/12 bg-white/[0.06] backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-white/[0.04] transition-colors"
      >
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ background: emotion.color }}
        />
        <span className="flex-1 text-[15px] text-white/90">{emotion.name}</span>
        <span className="text-[14px] font-medium tracking-[0.02em] text-white/75">
          {emotion.value}%
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden
          className={
            "text-white/55 transition-transform duration-200 " + (expanded ? "rotate-180" : "")
          }
        />
      </button>
      {expanded && (
        <p className="px-4 pb-3.5 -mt-0.5 text-[14px] leading-relaxed text-white/75">
          {emotion.note}
        </p>
      )}
    </div>
  );
}

// ── Change-talk highlights ────────────────────────────────────────────────────
// Quotes from the conversation, each in a frosted card topped with a small
// quote mark — the "change talk" Yuna heard during the session.
function HighlightsSection({ quotes }: { quotes: string[] }) {
  return (
    <section className="flex flex-col gap-5 yuna-rise">
      <div className="flex flex-col items-center text-center gap-2">
        <h2 className="font-display text-[20px] leading-tight text-white">Your highlights</h2>
        <p className="text-[14px] leading-relaxed text-white/75 max-w-[280px]">
          A closer look at the change talk from our conversation.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {quotes.map((q, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/[0.06] backdrop-blur-sm p-5 flex flex-col items-center text-center"
          >
            <span aria-hidden className="font-display text-white/40 text-[44px] leading-none -mb-5">
              &ldquo;
            </span>
            <p className="text-[15px] leading-relaxed text-white/90">{q}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── New activities ────────────────────────────────────────────────────────────
// Display-only home cards Yuna placed for this session — the wrap-up isn't a
// launch surface, so the tiles don't react to taps.
function PlacedForYou({ items }: { items: HomeCard[] }) {
  return (
    <section className="flex flex-col gap-5 yuna-rise">
      <h2 className="font-display text-[20px] leading-tight text-white text-center">
        New activities
      </h2>
      <ul className="flex flex-col gap-5">
        {items.map((c) => (
          <li key={c.id}>
            <HomeCardRow card={c} onClick={() => undefined} interactive={false} />
          </li>
        ))}
      </ul>
    </section>
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
