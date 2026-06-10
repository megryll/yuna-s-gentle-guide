import { Share2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Surface } from "@/components/Surface";
import { IconMedallion } from "@/components/IconMedallion";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import { HomeCardRow } from "@/components/HomeCards";
import type { HomeCard } from "@/lib/home-cards";
import { useAppMode } from "@/lib/theme-prefs";
import { DEFAULT_VOICE } from "@/lib/voices";

// Presentational pieces shared by the session wrap-up (`/wrap-up`) and a past
// session's detail screen (`/sessions/$id`) — the two surfaces render the same
// keepsake hero, emotion donut, change-talk highlights, and "new activities"
// list. Kept here so the detail screen reuses them by reference rather than
// reproducing their markup.

export type EmotionDatum = { name: string; value: number; color: string };

// ── Hero keepsake card ────────────────────────────────────────────────────────
// A nature photo behind a centered keepsake line and a Share action. The hero
// keeps a mode-aware veil — the tint lightens the photo on the light cluster (so
// the inverted ink keepsake reads) and darkens it on the dark cluster (for white
// copy), since inline backgrounds are invisible to the .theme-light shim.
export function HeroKeepsakeCard({
  message,
  avatar,
  onShare,
}: {
  message: string;
  avatar: AvatarVariant | null;
  onShare: () => void;
}) {
  const isLight = useAppMode() === "light";
  const tint = isLight ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.55)";
  const ring = isLight ? "ring-1 ring-black/10" : "ring-1 ring-white/15";
  return (
    <section
      style={{
        backgroundImage: `linear-gradient(${tint}, ${tint}), url(/nature/Background-13.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className={
        "shrink-0 rounded-2xl overflow-hidden px-6 py-7 flex flex-col items-center text-center gap-5 yuna-rise " +
        ring
      }
    >
      <IconMedallion size="lg">
        <YunaAvatar variant={avatar ?? DEFAULT_VOICE} size={64} />
      </IconMedallion>
      <p className="font-display italic text-2xl leading-[1.35] text-white max-w-[260px]">
        {message}
      </p>
      <Button surface={isLight ? "light" : "dark"} variant="secondary" size="sm" onClick={onShare}>
        <Share2 size={15} strokeWidth={1.8} aria-hidden />
        Share
      </Button>
    </section>
  );
}

// ── Emotion donut ───────────────────────────────────────────────────────────
// A donut of detected emotions. Hues are mode-stable palette tokens; only the
// track follows the app mode.
export function EmotionDonut({ data }: { data: EmotionDatum[] }) {
  const size = 176;
  const stroke = 26;
  const cx = size / 2;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const gap = 6; // path units of empty space between segments

  // Track is the only mode-dependent part — segment hues are mode-stable
  // tokens. Inline SVG values are invisible to the .theme-light shim, so pick
  // ink-alpha on the light photo directly. (CSS vars only resolve through the
  // `style` prop, not SVG presentation attributes, so segments use style too.)
  const isLight = useAppMode() === "light";
  const trackColor = isLight ? "rgba(20,20,22,0.10)" : "rgba(255,255,255,0.12)";

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
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
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
              style={{ stroke: d.color }}
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

// ── Change-talk highlights ────────────────────────────────────────────────────
// Quotes from the conversation, each in a frosted card topped with a small quote
// mark — the "change talk" Yuna heard during the session.
export function HighlightsSection({ quotes }: { quotes: string[] }) {
  return (
    <section className="flex flex-col gap-5 yuna-rise">
      <div className="flex flex-col items-center text-center gap-2">
        <h2 className="font-display text-xl leading-tight text-white">Your highlights</h2>
        <p className="text-sm leading-relaxed text-white/75 max-w-[280px]">
          A closer look at the change talk from our conversation.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {quotes.map((q, i) => (
          <Surface key={i} className="p-5 flex flex-col items-center text-center">
            <span aria-hidden className="font-display text-white/40 text-[44px] leading-none -mb-5">
              &ldquo;
            </span>
            <p className="text-base leading-relaxed text-white/90">{q}</p>
          </Surface>
        ))}
      </div>
    </section>
  );
}

// ── New activities ────────────────────────────────────────────────────────────
// Display-only home cards Yuna placed for this session — neither surface is a
// launch point, so the tiles don't react to taps.
export function PlacedForYou({ items }: { items: HomeCard[] }) {
  return (
    <section className="flex flex-col gap-5 yuna-rise">
      <h2 className="font-display text-xl leading-tight text-white text-center">
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
