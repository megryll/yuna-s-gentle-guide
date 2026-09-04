import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Play, Share2, Star, X } from "lucide-react";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import { usePhoneFrameContainer } from "@/components/PhoneFrame";
import { CardCTA, DailyTag, MotifIcon } from "@/components/Card";
import { GRATITUDE_PROMPTS, KIND_META, type HomeCard } from "@/lib/home-cards";
import { useYunaIdentity } from "@/lib/yuna-session";
import { DEFAULT_VOICE } from "@/lib/voices";

// The full-bleed photo behind a story slide (and the circular launcher thumb).
// Falls back to the card kind's default when an individual card has no photo.
function cardPhoto(card: HomeCard): string {
  return card.naturePath ?? KIND_META[card.type].naturePath;
}

// Auto-advance dwell per slide (ms) for the IG-style story.
const SLIDE_MS = 6000;

/**
 * Instagram-style story launcher — a gradient ring around a circular crop of
 * the first feed card's photo. Tapping opens the StoryViewer. Sits beside the
 * "Created For You" section title.
 */
export function StoryRing({ card, onClick }: { card: HomeCard; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open your daily highlights"
      className="relative h-10 w-10 shrink-0 rounded-full transition-transform active:scale-95"
    >
      <img
        src={cardPhoto(card)}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
      />
      {/* Gradient ring with a transparent hole punched out, so the 2px gap
          between ring and image shows the real background (IG-style). */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 210deg, var(--secondary-green), var(--primary-green), var(--secondary-green))",
          WebkitMask: "radial-gradient(circle, transparent 0 18px, #000 18px)",
          mask: "radial-gradient(circle, transparent 0 18px, #000 18px)",
        }}
      />
    </button>
  );
}

// A card's headline + supporting elements rendered white-on-photo (no tile),
// so they sit directly on the full-bleed story background. Interactive bits
// (footer save/share + CTA, gratitude inputs) are wrapped pointer-events-auto;
// everything else stays transparent to taps so the surrounding nav zones work.
function StorySlide({
  card,
  saved,
  onToggleSave,
  onOpen,
  onPause,
}: {
  card: HomeCard;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
  // Called when the user taps into a gratitude entry — halts auto-advance so
  // the slide waits for an explicit Next.
  onPause: () => void;
}) {
  const meta = KIND_META[card.type];
  const { avatar } = useYunaIdentity();
  const [entries, setEntries] = useState<[string, string, string]>(["", "", ""]);

  // Story layout differs from the feed card on purpose: save + share are
  // centered up top, then the card-type label, then the title — all centered.
  const actions = (
    <div className="pointer-events-auto flex items-center justify-center gap-5 text-white">
      <Button
        surface="dark"
        variant="plain"
        size="icon-sm"
        aria-pressed={saved}
        aria-label={saved ? "Remove bookmark" : "Save"}
        onClick={onToggleSave}
      >
        <Bookmark strokeWidth={2} fill={saved ? "currentColor" : "none"} aria-hidden />
      </Button>
      <span aria-hidden>
        <Share2 size={20} strokeWidth={2} />
      </span>
    </div>
  );

  const head = (leading?: React.ReactNode, cadence?: boolean) => (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-white">
        {leading}
        {card.type === "learn-skill" || card.type === "accountability"
          ? card.eyebrow
          : meta.label}
      </span>
      {cadence && <DailyTag tone="dark" />}
    </div>
  );

  const footer = (primary: React.ReactNode, footerMeta?: string) => (
    <div className="pointer-events-auto flex items-center justify-center gap-3">
      {footerMeta && (
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-white/80">
          {footerMeta}
        </span>
      )}
      {primary}
    </div>
  );

  const cta = (label: string = meta.ctaLabel) => (
    <CardCTA tone="dark" onClick={onOpen}>
      {label}
    </CardCTA>
  );

  // The whole block (actions, label, title, body) sits in the vertical center,
  // grouped together and away from the progress-bar header.
  const frame = (
    eyebrow: React.ReactNode,
    body: React.ReactNode,
    foot: React.ReactNode,
  ) => (
    <div className="flex h-full flex-col py-5">
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {actions}
        <div className="mt-4">{eyebrow}</div>
        <div className="mt-3">{body}</div>
      </div>
      {foot}
    </div>
  );

  const centered =
    "font-display text-3xl leading-[1.45] tracking-tight text-white text-center max-w-[20rem] mx-auto";

  switch (card.type) {
    case "guided-session":
      return frame(
        head(
          <YunaAvatar
            variant={avatar ?? DEFAULT_VOICE}
            size={20}
            className="ring-1 ring-white"
          />,
        ),
        <div className="text-center">
          <h2 className={centered}>{card.title}</h2>
          {card.subtitle && (
            <p className="mx-auto mt-4 max-w-[18rem] text-sm leading-relaxed text-white/85">
              {card.subtitle}
            </p>
          )}
        </div>,
        footer(cta()),
      );

    case "meditation":
      return frame(
        head(undefined, true),
        <h2 className={centered}>{card.title}</h2>,
        footer(cta()),
      );

    case "self-discovery":
      return frame(
        head(meta.motif && <MotifIcon motif={meta.motif} />),
        <div className="text-center">
          <h2 className={centered}>{card.title}</h2>
          <p className="mx-auto mt-3 max-w-[20rem] text-sm leading-relaxed text-white/85">
            {card.description}
          </p>
        </div>,
        footer(cta(), card.duration),
      );

    case "learn-skill":
      return frame(head(), <h2 className={centered}>{card.title}</h2>, footer(cta()));

    case "affirmation":
      return frame(
        head(undefined, true),
        <p className={centered}>{`“${card.quote}”`}</p>,
        footer(
          <CardCTA tone="dark" onClick={onOpen}>
            <Play size={14} strokeWidth={2} fill="currentColor" aria-hidden />
            Play this affirmation
          </CardCTA>,
        ),
      );

    case "accountability":
      return frame(
        head(),
        <p className={centered}>{`“${card.goal}”`}</p>,
        footer(cta()),
      );

    case "gratitude":
      return frame(
        head(undefined, true),
        <div>
          <p className="font-display text-2xl leading-[1.45] tracking-tight text-white">
            {card.prompt}
          </p>
          <div className="pointer-events-auto mt-5 flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <TextField
                key={i}
                surface="dark"
                size="lg"
                value={entries[i]}
                onChange={(e) =>
                  setEntries((prev) => {
                    const next = [...prev] as [string, string, string];
                    next[i] = e.target.value;
                    return next;
                  })
                }
                placeholder={GRATITUDE_PROMPTS[i]}
                aria-label={`Gratitude ${i + 1}`}
                onFocus={onPause}
              />
            ))}
          </div>
        </div>,
        footer(cta("My gratitude journal")),
      );

    case "book":
      return frame(
        head(),
        <div className="flex flex-col items-center text-center">
          {card.cover ? (
            <img
              src={card.cover}
              alt={`${card.title} cover`}
              className="h-36 w-[108px] rounded-md border border-white/15 object-cover shadow-lg"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-36 w-[108px] items-center justify-center rounded-md border border-white/15 bg-white/10 px-2 text-center text-xs font-bold uppercase leading-tight text-white shadow-lg"
            >
              {card.title}
            </span>
          )}
          <h2 className={centered + " mt-5"}>{card.title}</h2>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/85">{card.author}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-sm text-white/85">
            <span className="font-medium">{card.rating.toFixed(1)}</span>
            {[0, 1, 2, 3].map((i) => (
              <Star
                key={i}
                size={12}
                fill="currentColor"
                className="text-secondary-green"
                aria-hidden
              />
            ))}
            <Star size={12} fill="currentColor" className="text-secondary-green/50" aria-hidden />
          </p>
        </div>,
        footer(cta()),
      );
  }
}

/**
 * Full-screen story takeover. Steps through `cards` — each slide is a full-bleed
 * version of the card's photo with the card's elements laid on top. Segmented
 * progress bars up top fill over each slide's dwell and auto-advance. The whole
 * left third taps back / right two-thirds taps forward, plus explicit prev/next
 * arrows in the bottom corners. Focusing a gratitude entry halts auto-advance
 * so the slide waits for an explicit Next. Portals into the phone frame so it
 * covers the whole frame, AppBar included.
 */
export function StoryViewer({
  open,
  cards,
  avatar,
  onClose,
  onOpenCard,
}: {
  open: boolean;
  cards: HomeCard[];
  avatar: AvatarVariant | null | undefined;
  onClose: () => void;
  onOpenCard: (card: HomeCard) => void;
}) {
  const container = usePhoneFrameContainer();
  const [current, setCurrent] = useState(0);
  // Bumped to replay the slide's fade when tapping back from the first slide.
  const [nonce, setNonce] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  // Auto-advance is paused for the current slide once the user taps into a
  // gratitude entry; navigating to any slide clears it.
  const [paused, setPaused] = useState(false);

  // Each fresh open starts on the first slide, un-paused.
  useEffect(() => {
    if (open) {
      setCurrent(0);
      setNonce((n) => n + 1);
      setPaused(false);
    }
  }, [open]);

  // A new slide always resumes auto-advance.
  useEffect(() => {
    setPaused(false);
  }, [current, nonce]);

  // Auto-advance: dwell on each slide, then move forward (closing past the
  // last). Cleared while paused or whenever the slide changes.
  useEffect(() => {
    if (!open || paused) return;
    const t = setTimeout(() => goNext(), SLIDE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current, nonce, paused]);

  if (!open || cards.length === 0 || !container) return null;

  const goNext = () =>
    setCurrent((c) => {
      if (c >= cards.length - 1) {
        onClose();
        return c;
      }
      return c + 1;
    });
  const goPrev = () =>
    setCurrent((c) => {
      if (c <= 0) {
        setNonce((n) => n + 1); // replay the first slide
        return 0;
      }
      return c - 1;
    });
  const toggleSave = (id: string) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const card = cards[current];

  const overlay = (
    <div className="card-fixed-dark story-in absolute inset-0 z-[60] select-none overflow-hidden bg-black text-white">
      {/* Full-bleed slide photo — a single persistent layer whose image swaps
          per slide (no remount), so the frame never flashes through. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${cardPhoto(card)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Edge scrim — darker top (progress + header) and bottom (footer CTA). */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Tap zones — sit behind the chrome; transparent slide areas pass taps
          through. Left third goes back, right two-thirds advances. */}
      <div className="absolute inset-0 flex">
        <button type="button" aria-label="Previous" className="h-full w-1/3" onClick={goPrev} />
        <button type="button" aria-label="Next" className="h-full w-2/3" onClick={goNext} />
      </div>

      {/* Chrome: progress + header pinned top, the slide below. */}
      <div className="pointer-events-none relative flex h-full flex-col px-5 pt-3 pb-8">
        <div className="flex items-center gap-1">
          {cards.map((c, i) => {
            const active = i === current;
            return (
              <span
                key={c.id}
                className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/30"
              >
                <span
                  // Re-key the active fill so its animation restarts on each slide.
                  key={active ? `fill-${current}-${nonce}` : "static"}
                  className="absolute inset-0 origin-left rounded-full bg-white"
                  style={
                    active
                      ? {
                          animation: `story-progress ${SLIDE_MS}ms linear both`,
                          animationPlayState: paused ? "paused" : "running",
                        }
                      : { transform: i < current ? "scaleX(1)" : "scaleX(0)" }
                  }
                />
              </span>
            );
          })}
        </div>

        <div className="pointer-events-auto mt-3 flex items-center gap-2.5">
          <YunaAvatar variant={avatar ?? undefined} size={26} />
          <span className="text-sm font-medium text-white">Created for you</span>
          <span aria-hidden className="text-sm text-white/70">
            ·
          </span>
          <span className="text-sm text-white/70">Today</span>
          <Button
            surface="dark"
            variant="plain"
            size="icon"
            aria-label="Close"
            onClick={onClose}
            className="-mr-1 ml-auto"
          >
            <X strokeWidth={2} aria-hidden />
          </Button>
        </div>

        <div
          key={`slide-${current}-${nonce}`}
          className="mt-2 min-h-0 flex-1"
          style={{ animation: "yuna-fade 320ms ease both" }}
        >
          <StorySlide
            card={card}
            saved={saved.has(card.id)}
            onToggleSave={() => toggleSave(card.id)}
            onOpen={() => onOpenCard(card)}
            onPause={() => setPaused(true)}
          />
        </div>

        {/* Explicit prev/next arrows in the bottom corners — supplement the
            full-height left/right tap zones. */}
        <Button
          surface="dark"
          variant="secondary"
          size="icon"
          aria-label="Previous"
          onClick={goPrev}
          className="pointer-events-auto absolute bottom-7 left-5 bg-black/30 backdrop-blur-sm"
        >
          <ChevronLeft strokeWidth={2} aria-hidden />
        </Button>
        <Button
          surface="dark"
          variant="secondary"
          size="icon"
          aria-label="Next"
          onClick={goNext}
          className="pointer-events-auto absolute bottom-7 right-5 bg-black/30 backdrop-blur-sm"
        >
          <ChevronRight strokeWidth={2} aria-hidden />
        </Button>
      </div>
    </div>
  );

  return createPortal(overlay, container);
}
