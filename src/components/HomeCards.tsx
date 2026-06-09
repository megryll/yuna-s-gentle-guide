import { useState } from "react";
import { Play, Star } from "lucide-react";
import { KIND_META, type HomeCard } from "@/lib/home-cards";
import { Button } from "@/components/Button";
import { YunaAvatar } from "@/components/YunaAvatar";
import { TextField } from "@/components/TextField";
import {
  Card,
  CardCTA,
  CardFooter,
  CardHeader,
  CardRow,
  DailyTag,
} from "@/components/Card";
import { useYunaIdentity } from "@/lib/yuna-session";

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
  interactive = true,
}: {
  card: HomeCard;
  onClick: () => void;
  interactive?: boolean;
}) {
  const meta = KIND_META[card.type];
  const { avatar } = useYunaIdentity();
  const isGuided = card.type === "guided-session";

  const isSolid = meta.solidBg != null;
  // Photo rows always use the dark cluster (black tint + white ink) in both
  // modes, matching the card view; solid rows keep their fixed tone.
  const isLight = isSolid ? meta.tone === "light" : false;

  return (
    <CardRow
      title={rowTitle(card)}
      tone={isLight ? "light" : "dark"}
      italic={card.type === "affirmation"}
      isNew={card.isNew}
      naturePath={isSolid ? undefined : card.naturePath ?? meta.naturePath}
      solidFill={isSolid ? meta.solidBg ?? undefined : undefined}
      onClick={onClick}
      interactive={interactive}
      meta={
        <>
          <span className={`text-xs font-medium tracking-[0.08em] uppercase ${isLight ? "text-foreground" : "text-white"} inline-flex items-center gap-1.5`}>
            {isGuided && avatar && <YunaAvatar variant={avatar} size={15} />}
            {meta.label}
          </span>
          {hasCadence(card) && <DailyTag tone={isLight ? "light" : "dark"} />}
        </>
      }
    />
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
      return `${card.title} by ${card.author}`;
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
    <Card tone={meta.tone} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath} solidFill={meta.solidBg}>
      <CardHeader
        meta={meta}
        leading={
          avatar ? (
            <YunaAvatar variant={avatar} size={24} className="ring-1 ring-white" />
          ) : (
            <span aria-hidden className="h-6 w-6 rounded-full bg-white/25 ring-1 ring-white" />
          )
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-9">
        <h3 className="font-display text-2xl leading-[1.75] tracking-tight text-white max-w-[18rem]">
          {card.title}
        </h3>
        {card.subtitle && (
          <p className="mt-4 text-sm leading-relaxed text-white/85 max-w-[18rem]">
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
    </Card>
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
    <Card tone={meta.tone} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath} solidFill={meta.solidBg}>
      <CardHeader meta={meta} cadence={card.cadence} />
      <div className="flex-1 flex items-center justify-center px-6 pt-9">
        <h3 className="font-display text-2xl leading-[1.75] tracking-tight text-white text-center">
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
    </Card>
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
    <Card
      tone={meta.tone}
      isNew={card.isNew}
      naturePath={card.naturePath ?? meta.naturePath}
      solidFill={meta.solidBg}
    >
      <CardHeader meta={meta} cadence={card.cadence} />
      <div className="flex-1 flex flex-col justify-center">
        <p className="font-display text-xl leading-[1.75] tracking-tight text-foreground">
          {card.prompt}
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <TextField
              key={i}
              surface="light"
              size="lg"
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
            />
          ))}
        </div>
      </div>
      <CardFooter
        primary={
          <CardCTA tone={meta.tone} onClick={onClick}>
            My Gratitude Journal
          </CardCTA>
        }
        tone={meta.tone}
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </Card>
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
    <Card tone={meta.tone} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath} solidFill={meta.solidBg}>
      <CardHeader meta={meta} />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-9">
        <h3 className="font-display text-2xl leading-[1.75] tracking-tight text-white">
          {card.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/80 max-w-[20rem]">
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
    </Card>
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
    <Card tone={meta.tone} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath} solidFill={meta.solidBg}>
      <CardHeader meta={meta} cadence={card.cadence} />
      <div className="flex-1 flex items-center justify-center px-6 pt-9">
        <p className="font-display text-2xl leading-[1.75] tracking-tight text-white text-center">
          “{card.quote}”
        </p>
      </div>
      <CardFooter
        primary={
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            onClick={onClick}
            aria-label="Play affirmation"
          >
            <Play strokeWidth={2} fill="currentColor" aria-hidden />
          </Button>
        }
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </Card>
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
    <Card tone={meta.tone} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath} solidFill={meta.solidBg}>
      <CardHeader meta={meta} eyebrow={card.eyebrow} />
      <div className="flex-1 flex items-center justify-center px-6 pt-9">
        <h3 className="font-display text-2xl leading-[1.75] tracking-tight text-white text-center">
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
    </Card>
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
    <Card tone={meta.tone} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath} solidFill={meta.solidBg}>
      <CardHeader meta={meta} eyebrow={card.eyebrow} />
      <div className="flex-1 flex items-center justify-center px-6 pt-9">
        <p className="font-display text-2xl leading-[1.75] tracking-tight text-white text-center">
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
    </Card>
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
    <Card tone={meta.tone} isNew={card.isNew} naturePath={card.naturePath ?? meta.naturePath} solidFill={meta.solidBg}>
      <CardHeader meta={meta} />
      <div className="flex-1 flex items-center gap-4">
        {card.cover ? (
          <img
            src={card.cover}
            alt={`${card.title} cover`}
            className="h-24 w-[72px] shrink-0 rounded-md object-cover border border-black/10 shadow-md"
          />
        ) : (
          <span
            aria-hidden
            className="h-24 w-[72px] shrink-0 rounded-md bg-gradient-to-br from-pink-300 via-amber-200 to-sky-300 border border-black/10 shadow-md flex items-center justify-center text-uppercase font-bold uppercase text-neutral-700 text-center px-1 leading-tight"
          >
            {card.title}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-uppercase tracking-[0.18em] uppercase text-foreground">
            {card.author}
          </p>
          <p className="mt-1 font-display text-2xl leading-[1.75] tracking-tight text-foreground">
            {card.title}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-sm text-foreground/80">
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
        tone={meta.tone}
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </Card>
  );
}

// ─── Card chrome shared bits ─────────────────────────────────────────────────
// Card / CardHeader / CardFooter / CardCTA / DailyTag / CardRow (the list-row
// layout, incl. its ActionCircle) now live in the Card primitive
// (components/Card.tsx).
