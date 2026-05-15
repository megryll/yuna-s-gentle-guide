import { useState } from "react";
import {
  ArrowRight,
  Bookmark,
  MoreHorizontal,
  Play,
  Share2,
  Star,
} from "lucide-react";
import {
  KIND_META,
  type CardKindMeta,
  type HomeCard,
} from "@/lib/home-cards";
import { YunaAvatar } from "@/components/YunaAvatar";
import { useYunaIdentity } from "@/lib/yuna-session";
import { useThemePrefs } from "@/lib/theme-prefs";

type ItemProps = {
  card: HomeCard;
  isSaved: boolean;
  onClick: () => void;
  onToggleSave: () => void;
};

export function HomeCardItem(props: ItemProps) {
  switch (props.card.type) {
    case "guided-session":
      return <GuidedSessionCard {...props} card={props.card} />;
    case "meditation":
      return <MeditationCard {...props} card={props.card} />;
    case "gratitude":
      return <GratitudeCard {...props} card={props.card} />;
    case "self-discovery":
      return <SelfDiscoveryCard {...props} card={props.card} />;
    case "affirmation":
      return <AffirmationCard {...props} card={props.card} />;
    case "learn-skill":
      return <LearnSkillCard {...props} card={props.card} />;
    case "accountability":
      return <AccountabilityCard {...props} card={props.card} />;
    case "book":
      return <BookCard {...props} card={props.card} />;
  }
}

export function HomeCardRow({
  card,
  onClick,
}: {
  card: HomeCard;
  onClick: () => void;
}) {
  const meta = KIND_META[card.type];
  const title = rowTitle(card);
  const isQuote = card.type === "affirmation";
  const { avatar } = useYunaIdentity();
  const isGuided = card.type === "guided-session";

  const { mainBg } = useThemePrefs();
  const isSnowy = mainBg === "Snowy";
  const natureDarkEnd = isSnowy ? "rgba(255, 255, 255, 0.4)" : "rgba(15, 18, 24, 0.55)";
  const photoPath = card.naturePath ?? meta.naturePath;
  const background = `linear-gradient(110deg, ${meta.accent}${isSnowy ? "66" : "99"} 0%, ${meta.accent}${isSnowy ? "22" : "40"} 35%, ${natureDarkEnd} 100%), linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url(${photoPath})`;

  return (
    <div className="relative">
      {card.isNew && (
        <span
          className="absolute -top-1.5 left-3 z-10 font-sans-ui text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-full text-white shadow"
          style={{ backgroundColor: "#66BA24" }}
        >
          New
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        className="relative w-full text-left rounded-xl px-4 py-3.5 active:opacity-90 transition-opacity flex items-center gap-4 overflow-hidden"
        style={{
          backgroundImage: background,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="flex-1 min-w-0">
          <p
            className={
              "text-[16px] leading-snug text-white " +
              (isQuote ? "italic" : "font-medium")
            }
          >
            {title}
          </p>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <span className="font-sans-ui text-[11px] tracking-[0.12em] uppercase text-white inline-flex items-center gap-1.5">
              {isGuided && avatar ? (
                <YunaAvatar variant={avatar} size={15} />
              ) : (
                <span aria-hidden>{meta.emoji}</span>
              )}
              {meta.label}
            </span>
            {hasCadence(card) && <DailyTag />}
          </div>
        </div>
        <ActionCircle />
      </button>
    </div>
  );
}

function rowTitle(card: HomeCard): string {
  switch (card.type) {
    case "guided-session":
    case "meditation":
    case "self-discovery":
    case "learn-skill":
      return card.title;
    case "gratitude":
      return card.prompt;
    case "affirmation":
      return `"${card.quote}"`;
    case "accountability":
      return `"${card.goal}"`;
    case "book":
      return `${card.title} — ${card.author}`;
  }
}

function hasCadence(card: HomeCard): boolean {
  return (
    card.type === "meditation" ||
    card.type === "gratitude" ||
    card.type === "affirmation"
  );
}

// ─── Card-view components ────────────────────────────────────────────────────

function GuidedSessionCard({
  card,
  isSaved,
  onClick,
  onToggleSave,
}: ItemProps & { card: Extract<HomeCard, { type: "guided-session" }> }) {
  const meta = KIND_META[card.type];
  const { avatar } = useYunaIdentity();
  return (
    <CardShell tone={meta.tone} accent={meta.accent} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath}>
      <CardHeader
        meta={meta}
        leading={
          avatar ? (
            <YunaAvatar variant={avatar} size={16} />
          ) : (
            <span aria-hidden className="h-4 w-4 rounded-full bg-white/25" />
          )
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
        <h3 className="font-display text-[24px] leading-[1.15] tracking-tight text-white max-w-[18rem]">
          {card.title}
        </h3>
        {card.subtitle && (
          <p className="mt-4 text-[13.5px] leading-relaxed text-white/85 max-w-[18rem]">
            {card.subtitle}
          </p>
        )}
      </div>

      <CardFooter
        primary={
          <CardCTA tone={meta.tone} onClick={onClick}>
            {meta.ctaLabel}
          </CardCTA>
        }
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </CardShell>
  );
}

function MeditationCard({
  card,
  isSaved,
  onClick,
  onToggleSave,
}: ItemProps & { card: Extract<HomeCard, { type: "meditation" }> }) {
  const meta = KIND_META[card.type];
  return (
    <CardShell tone={meta.tone} accent={meta.accent} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath}>
      <CardHeader meta={meta} cadence={card.cadence} />
      <div className="flex-1 flex items-center justify-center">
        <h3 className="font-display text-[22px] leading-[1.2] tracking-tight text-white text-center">
          {card.title}
        </h3>
      </div>
      <CardFooter
        primary={
          <CardCTA tone={meta.tone} onClick={onClick}>
            {meta.ctaLabel}
          </CardCTA>
        }
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </CardShell>
  );
}

function GratitudeCard({
  card,
  isSaved,
  onClick,
  onToggleSave,
}: ItemProps & { card: Extract<HomeCard, { type: "gratitude" }> }) {
  const meta = KIND_META[card.type];
  const [entries, setEntries] = useState<[string, string, string]>(["", "", ""]);
  return (
    <CardShell tone={meta.tone} accent={meta.accent} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath}>
      <CardHeader meta={meta} cadence={card.cadence} />
      <div className="flex-1 flex flex-col">
        <p className="mt-3 font-display text-[20px] leading-[1.25] tracking-tight text-white">
          {card.prompt}
        </p>
        <ul className="mt-4 flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="font-sans-ui text-[10px] tracking-[0.18em] uppercase text-white/65 shrink-0 w-5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-3.5 py-1 focus-within:border-white transition-colors">
                <input
                  value={entries[i]}
                  onChange={(e) =>
                    setEntries((prev) => {
                      const next = [...prev] as [string, string, string];
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                  placeholder="Type here…"
                  aria-label={`Gratitude ${i + 1}`}
                  className="w-full bg-transparent text-[13px] outline-none text-white placeholder:text-white/50"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <CardFooter
        primary={
          <CardCTA tone={meta.tone} onClick={onClick}>
            My Gratitude Journal
          </CardCTA>
        }
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </CardShell>
  );
}

function SelfDiscoveryCard({
  card,
  isSaved,
  onClick,
  onToggleSave,
}: ItemProps & { card: Extract<HomeCard, { type: "self-discovery" }> }) {
  const meta = KIND_META[card.type];
  return (
    <CardShell tone={meta.tone} accent={meta.accent} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath}>
      <CardHeader meta={meta} />
      <div className="flex-1 flex flex-col justify-center">
        <h3 className="font-display text-[22px] leading-[1.2] tracking-tight text-white">
          {card.title}
        </h3>
        <p className="mt-3 text-[13px] leading-relaxed text-white/80 max-w-[20rem]">
          {card.description}
        </p>
      </div>
      <CardFooter
        primary={
          <CardCTA tone={meta.tone} onClick={onClick}>
            {meta.ctaLabel}
          </CardCTA>
        }
        meta={card.duration}
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </CardShell>
  );
}

function AffirmationCard({
  card,
  isSaved,
  onClick,
  onToggleSave,
}: ItemProps & { card: Extract<HomeCard, { type: "affirmation" }> }) {
  const meta = KIND_META[card.type];
  return (
    <CardShell tone={meta.tone} accent={meta.accent} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath}>
      <CardHeader meta={meta} cadence={card.cadence} />
      <div className="flex-1 flex items-center">
        <p className="font-display text-[17px] leading-[1.4] tracking-tight text-white">
          “{card.quote}”
        </p>
      </div>
      <CardFooter
        primary={
          <button
            type="button"
            onClick={onClick}
            aria-label="Play affirmation"
            className="h-10 w-10 rounded-full border border-white/30 text-white inline-flex items-center justify-center active:bg-white/10 transition-colors"
          >
            <Play size={16} strokeWidth={2} fill="currentColor" aria-hidden />
          </button>
        }
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </CardShell>
  );
}

function LearnSkillCard({
  card,
  isSaved,
  onClick,
  onToggleSave,
}: ItemProps & { card: Extract<HomeCard, { type: "learn-skill" }> }) {
  const meta = KIND_META[card.type];
  return (
    <CardShell tone={meta.tone} accent={meta.accent} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath}>
      <CardHeader meta={meta} eyebrow={card.eyebrow} />
      <div className="flex-1 flex items-center justify-center">
        <h3 className="font-display text-[24px] leading-[1.25] tracking-tight text-white text-center">
          {card.title}
        </h3>
      </div>
      <CardFooter
        primary={
          <CardCTA tone={meta.tone} onClick={onClick}>
            {meta.ctaLabel}
          </CardCTA>
        }
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </CardShell>
  );
}

function AccountabilityCard({
  card,
  isSaved,
  onClick,
  onToggleSave,
}: ItemProps & { card: Extract<HomeCard, { type: "accountability" }> }) {
  const meta = KIND_META[card.type];
  return (
    <CardShell tone={meta.tone} accent={meta.accent} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath}>
      <CardHeader meta={meta} eyebrow={card.eyebrow} />
      <div className="flex-1 flex items-center justify-center">
        <p className="font-display text-[20px] leading-[1.3] tracking-tight text-white text-center">
          “{card.goal}”
        </p>
      </div>
      <CardFooter
        primary={
          <CardCTA tone={meta.tone} onClick={onClick}>
            {meta.ctaLabel}
          </CardCTA>
        }
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </CardShell>
  );
}

function BookCard({
  card,
  isSaved,
  onClick,
  onToggleSave,
}: ItemProps & { card: Extract<HomeCard, { type: "book" }> }) {
  const meta = KIND_META[card.type];
  return (
    <CardShell tone={meta.tone} accent={meta.accent} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath}>
      <CardHeader meta={meta} />
      <div className="flex-1 flex items-center gap-4">
        {card.cover ? (
          <img
            src={card.cover}
            alt={`${card.title} cover`}
            className="h-24 w-[72px] shrink-0 rounded-md object-cover border border-white/30 shadow-md"
          />
        ) : (
          <span
            aria-hidden
            className="h-24 w-[72px] shrink-0 rounded-md bg-gradient-to-br from-pink-300 via-amber-200 to-sky-300 border border-white/30 shadow-md flex items-center justify-center text-[10px] font-bold uppercase text-neutral-700 text-center px-1 leading-tight"
          >
            {card.title}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-sans-ui text-[10px] tracking-[0.18em] uppercase text-white">
            {card.author}
          </p>
          <p className="mt-1 font-display text-[18px] leading-[1.25] tracking-tight text-white">
            {card.title}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-[13px] text-white/85">
            <span className="font-medium">{card.rating.toFixed(1)}</span>
            <Star size={12} fill="currentColor" className="text-amber-300" aria-hidden />
            <Star size={12} fill="currentColor" className="text-amber-300" aria-hidden />
            <Star size={12} fill="currentColor" className="text-amber-300" aria-hidden />
            <Star size={12} fill="currentColor" className="text-amber-300" aria-hidden />
            <Star size={12} fill="currentColor" className="text-amber-300/50" aria-hidden />
          </p>
        </div>
      </div>
      <CardFooter
        primary={
          <CardCTA tone={meta.tone} onClick={onClick}>
            {meta.ctaLabel}
          </CardCTA>
        }
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </CardShell>
  );
}

// ─── Card chrome shared bits ─────────────────────────────────────────────────

function CardShell({
  tone,
  accent,
  isNew,
  naturePath,
  children,
}: {
  tone: "dark" | "light";
  accent: string;
  isNew?: boolean;
  naturePath?: string;
  children: React.ReactNode;
}) {
  const { mainBg } = useThemePrefs();
  const isDark = tone === "dark";
  const isSnowy = mainBg === "Snowy";

  const natureOverlay = isSnowy
    ? `linear-gradient(155deg, ${accent}66 0%, ${accent}22 35%, rgba(255, 255, 255, 0.4) 100%)`
    : `linear-gradient(155deg, ${accent}99 0%, ${accent}40 35%, rgba(15, 18, 24, 0.55) 100%)`;
  const background = naturePath
    ? `${natureOverlay}, linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url(${naturePath})`
    : isDark
      ? `linear-gradient(155deg, ${accent}CC 0%, ${accent}55 35%, rgba(15, 18, 24, 0.78) 100%)`
      : `linear-gradient(160deg, #F4ECDE 0%, #EFE3CC 100%)`;

  return (
    <div className="relative">
      {isNew && (
        <span
          className="absolute -top-2 left-4 z-10 font-sans-ui text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-full text-white shadow"
          style={{ backgroundColor: "#66BA24" }}
        >
          New
        </span>
      )}
      <div
        className={
          "rounded-2xl p-5 aspect-square flex flex-col overflow-hidden " +
          (isDark ? "text-white" : "text-neutral-900")
        }
        style={{
          backgroundImage: background,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CardHeader({
  meta,
  cadence,
  eyebrow,
  leading,
}: {
  meta: CardKindMeta;
  cadence?: "Daily";
  eyebrow?: string;
  leading?: React.ReactNode;
}) {
  const isDark = meta.tone === "dark";
  const eyebrowColor = isDark ? "text-white" : "text-neutral-900";
  const iconColor = isDark
    ? "text-white"
    : "text-neutral-600 active:text-neutral-900";

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex flex-row items-center gap-3 flex-wrap">
        <p
          className={
            "font-sans-ui text-[10px] tracking-[0.14em] uppercase inline-flex items-center gap-1.5 " +
            eyebrowColor
          }
        >
          {leading ?? <span aria-hidden>{meta.emoji}</span>}
          {eyebrow ?? meta.label}
        </p>
        {cadence && <DailyTag tone={meta.tone} />}
      </div>
      <button
        type="button"
        aria-label="More"
        onClick={(e) => e.stopPropagation()}
        className={"transition-colors shrink-0 " + iconColor}
      >
        <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}

function CardFooter({
  primary,
  meta,
  isSaved,
  onToggleSave,
  tone = "dark",
}: {
  primary: React.ReactNode;
  meta?: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
  tone?: "dark" | "light";
}) {
  const isDark = tone === "dark";
  const iconColor = isDark
    ? "text-white"
    : "text-neutral-600 active:text-neutral-900";

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 shrink-0">
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Remove bookmark" : "Save"}
            className={"transition-colors " + iconColor}
          >
            <Bookmark
              size={16}
              strokeWidth={1.75}
              fill={isSaved ? "currentColor" : "none"}
              aria-hidden
            />
          </button>
        )}
        <span aria-hidden className={iconColor}>
          <Share2 size={16} strokeWidth={1.75} />
        </span>
      </div>
      <div className="flex items-center gap-3 min-w-0">
        {meta && (
          <span
            className={
              "font-sans-ui text-[10px] tracking-[0.18em] uppercase " +
              (isDark ? "text-white/65" : "text-neutral-600")
            }
          >
            {meta}
          </span>
        )}
        {primary}
      </div>
    </div>
  );
}

function CardCTA({
  tone,
  onClick,
  children,
}: {
  tone: "dark" | "light";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const isDark = tone === "dark";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center justify-center rounded-full px-5 h-10 font-sans-ui text-[11px] tracking-[0.18em] uppercase border active:bg-white/10 transition-colors " +
        (isDark
          ? "border-white/30 text-white"
          : "border-neutral-900/30 text-neutral-900")
      }
    >
      {children}
    </button>
  );
}

function DailyTag({ tone = "dark" }: { tone?: "dark" | "light" } = {}) {
  const isDark = tone === "dark";
  return (
    <span
      className={
        "inline-flex items-center gap-1 font-sans-ui text-[10px] tracking-[0.12em] uppercase " +
        (isDark ? "text-white" : "text-neutral-900")
      }
    >
      <span aria-hidden>📅</span>
      Daily
    </span>
  );
}

function ActionCircle() {
  return (
    <span
      aria-hidden
      className="shrink-0 h-9 w-9 rounded-full border border-white/30 text-white inline-flex items-center justify-center"
    >
      <ArrowRight size={14} strokeWidth={2} />
    </span>
  );
}
