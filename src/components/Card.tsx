import * as React from "react";
import { ArrowRight, Bookmark, ListChecks, MoreHorizontal, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";

/**
 * Content card primitive — the rounded photo-tinted tile behind Home's
 * "Created For You" feed (meditations, affirmations, books, …). NOT the
 * list-row option card (that's <Button variant="card">).
 *
 * Anatomy: <Card> shell + optional <CardHeader> (eyebrow + More), centered
 * body (caller-owned), and optional <CardFooter> (save/share + a primary CTA).
 *
 * Color model: a card is either photo-tinted (`naturePath`) or a solid /
 * gradient fill (`solidFill`), and its look is FIXED across the app's
 * light/dark toggle.
 *   • Photo cards always use the dark cluster — a black wash + white ink — so
 *     they read identically in light and dark mode.
 *   • Solid cards carry a fixed fill: pair a pale fill with tone "light" (dark
 *     ink) or a deep fill with tone "dark" (white ink). A fill may be any CSS
 *     background value, so gradient kinds (quiz) live here too.
 * Any tone "dark" card pins its white ink against the global `.theme-light`
 * shim via the `card-fixed-dark` class (the shim would otherwise invert it).
 *
 * Card props:
 *   tone:       "dark" | "light"  — content tone (dark = white text)
 *   naturePath: string            — background photo (dark-washed)
 *   solidFill?: string            — flat or gradient fill (overrides photo)
 *   motif?:     "quiz"            — decorative kind glyph painted behind the
 *                                   content (see CardMotif / QuizMotif)
 *   isNew?:     boolean           — green "New" flag, top-left
 *   completed?: boolean           — fade the tile + show a check Badge top-left
 *
 * CardRow is the list-row layout of the same content card: a short pressable
 * row (title + a meta line below + a trailing ActionCircle) sharing the photo /
 * solid fill model. Used by Home's feed rows and the past-sessions list.
 *   onMenu?:    () => void        — show a top-right 3-dot menu button and drop
 *                                   the ActionCircle to the bottom-right corner;
 *                                   omit it to keep the arrow centered.
 *   motif?:     "quiz"            — same kind glyph, cropped for the row
 *   completed?: boolean           — fade the row + show a check Badge top-left
 *
 * CardHeader props: meta {label, tone}, cadence?, eyebrow?, leading?, onMore?
 *   (pass <MotifIcon motif> as `leading` on a motif kind so the eyebrow reads
 *   as its content type before you get to the label)
 *   (set onMore to show the top-right 3-dot menu; omit it for a plain header)
 * CardFooter props: primary, meta?, isSaved?, onToggleSave?, tone?
 * CardCTA props:    tone, onClick, children
 * MetaDot props:    tone?, children — dot-prefixed meta token after an eyebrow
 *                   ("• Daily", "• 3 min"); DailyTag is its "Daily" preset.
 */

export type CardChromeMeta = {
  label: string;
  tone: "dark" | "light";
};

// Background for a photo content card, shared by the tile and the list row.
// Always the dark cluster — a black wash + white ink — in both app modes, so
// photo cards read identically light and dark.
export function cardSurface({
  naturePath,
}: {
  naturePath: string;
}): { style: React.CSSProperties } {
  return {
    style: {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${naturePath})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    },
  };
}

export function NewBadge({ className }: { className?: string }) {
  // The corner "New" flag is the DS Badge pinned to the card with absolute
  // positioning supplied by the caller.
  return <Badge className={cn("absolute z-10", className)}>New</Badge>;
}

export function Card({
  tone,
  isNew,
  completed,
  naturePath,
  solidFill,
  motif,
  className,
  children,
}: {
  tone: "dark" | "light";
  isNew?: boolean;
  completed?: boolean;
  naturePath?: string;
  solidFill?: string;
  motif?: CardMotif;
  className?: string;
  children: React.ReactNode;
}) {
  const isDark = tone === "dark";

  // Solid cards carry a fixed fill (a flat colour or a gradient); photo cards
  // get the dark photo wash. Either way the look is mode-independent — a
  // dark-toned card pins its white ink against `.theme-light` via
  // `card-fixed-dark`.
  const style: React.CSSProperties = solidFill
    ? { background: solidFill }
    : cardSurface({ naturePath: naturePath ?? "" }).style;

  return (
    <div className="relative">
      {/* Completed cards trade the "New" flag for a check badge in the same
          top-left corner slot and fade the tile. The badge sits outside the
          faded tile so it stays crisp. */}
      {isNew && !completed && <NewBadge className="-top-2 left-5" />}
      {completed && <Badge icon size="sm" label="Completed" className="absolute -top-2 left-5 z-10" />}
      {/* Grid overlay: a square spacer sets the minimum (the tile is never
          shorter than it is wide, at any device size), while the content layer
          stacks in the same cell and grows the row taller when its content
          exceeds that square — so nothing clips on a narrower frame. */}
      <div
        className={cn(
          "relative grid grid-cols-1 rounded-[2.5rem] overflow-hidden",
          isDark ? "text-white" : "text-neutral-900",
          isDark && "card-fixed-dark",
          completed && "opacity-60",
          className,
        )}
        style={style}
      >
        {motif && <CardMotif motif={motif} placement="tile" tone={tone} />}
        <span aria-hidden className="[grid-area:1/1] aspect-square" />
        <div className="[grid-area:1/1] relative min-w-0 px-5 py-7 flex flex-col">{children}</div>
      </div>
    </div>
  );
}

// List-row layout of the content card — a short, pressable row used by Home's
// feed and the past-sessions list. Same photo / solid fill model as the tile,
// laid out horizontally: title on top, a caller-supplied meta line below, and a
// trailing ActionCircle. `tone` is the ink tone ("dark" = white text on a photo
// or deep solid; "light" = ink on a pale solid).
export function CardRow({
  title,
  meta,
  tone = "dark",
  italic = false,
  isNew = false,
  completed = false,
  naturePath,
  solidFill,
  motif,
  onClick,
  onMenu,
  interactive = true,
}: {
  title: string;
  meta: React.ReactNode;
  tone?: "dark" | "light";
  italic?: boolean;
  isNew?: boolean;
  completed?: boolean;
  naturePath?: string;
  solidFill?: string;
  motif?: CardMotif;
  onClick?: () => void;
  // When set, a 3-dot menu button is pinned to the top-right and the trailing
  // ActionCircle drops to the bottom-right corner. Without it the ActionCircle
  // stays vertically centered (the past-sessions list keeps this layout).
  onMenu?: () => void;
  interactive?: boolean;
}) {
  const isLight = tone === "light";
  const hasMenu = !!onMenu;
  const style: React.CSSProperties = solidFill
    ? { background: solidFill }
    : cardSurface({ naturePath: naturePath ?? "" }).style;

  return (
    // Dark-tone rows pin white ink against `.theme-light` at the wrapper so the
    // arrow + menu (siblings of the inner button) stay white in light app mode.
    // Completed rows reserve top margin for the badge that overhangs (-top-2), so
    // stacked cards keep their gap instead of the badge crowding the row above.
    <div className={cn("relative", completed && "mt-2", !isLight && "card-fixed-dark")}>
      {isNew && !completed && <NewBadge className="-top-3 left-4" />}
      {completed && <Badge icon size="sm" label="Completed" className="absolute -top-2 left-4 z-10" />}
      <button
        type="button"
        onClick={interactive ? onClick : undefined}
        disabled={!interactive}
        className={cn(
          "relative w-full text-left rounded-2xl px-4 py-5 transition-opacity flex gap-4 overflow-hidden",
          hasMenu ? "items-stretch min-h-[96px] pr-14" : "items-center",
          !isLight && "card-fixed-dark",
          completed && "opacity-60",
          interactive && "active:opacity-90",
          !interactive && "cursor-default",
          // Pin disabled (display-only) rows to full opacity — unless completed,
          // whose opacity-60 fade must survive (the :disabled variant otherwise
          // outweighs it on specificity).
          !interactive && !completed && "disabled:opacity-100",
        )}
        style={style}
      >
        {motif && <CardMotif motif={motif} placement="row" tone={tone} />}
        <div className="relative flex-1 min-w-0 flex flex-col justify-center">
          <p
            className={cn(
              "font-display text-xl leading-snug tracking-tight",
              isLight ? "text-foreground" : "text-white",
              italic && "italic",
            )}
          >
            {title}
          </p>
          <div className="mt-3.5 flex items-center gap-1 flex-wrap">{meta}</div>
        </div>
        {!hasMenu && <ActionCircle tone={isLight ? "light" : "dark"} className="relative" />}
      </button>

      {/* Menu + trailing arrow are siblings of the row button (not nested in
          it — that would be invalid markup) and sit on top of its corners. */}
      {hasMenu && (
        <>
          <span aria-hidden className="absolute bottom-4 right-4 pointer-events-none">
            <ActionCircle tone={isLight ? "light" : "dark"} />
          </span>
          <Button
            surface={isLight ? "light" : "dark"}
            variant="plain"
            size="icon-sm"
            aria-label="More options"
            onClick={(e) => {
              e.stopPropagation();
              onMenu();
            }}
            className="absolute top-2 right-2 z-10"
          >
            <MoreHorizontal strokeWidth={2} aria-hidden />
          </Button>
        </>
      )}
    </div>
  );
}

// A card kind whose surface carries its own decorative glyph instead of a
// photo. "quiz" is the only one today — a tilted answer sheet behind the copy,
// so a quiz reads as something you fill in rather than something you read.
export type CardMotif = "quiz";

export type MotifPlacement = "tile" | "row" | "reco";

// Where the glyph sits, per surface. Every placement keeps the coloured element
// out of the copy: on a tile it lands in the band above the title, on a row it
// is cropped off entirely (a row already carries the green "Completed" badge,
// and a second green check reads as a second status).
const MOTIF_PLACEMENT: Record<MotifPlacement, string> = {
  tile: "w-[84%] -right-20 top-[7%] rotate-[-9deg]",
  row: "w-[52%] -right-8 -top-14 rotate-[-9deg]",
  reco: "w-[48%] -right-10 top-[3%] rotate-[-9deg]",
};

// The kind glyph painted behind a card's content. Exported for the other
// surfaces that paint a card background themselves (CardSuggestion's reco tile).
export function CardMotif({
  motif,
  placement,
  tone = "dark",
}: {
  motif: CardMotif;
  placement: MotifPlacement;
  // Ink tone of the card underneath: "dark" paints the glyph in white-alpha,
  // "light" in ink-alpha, so it reads as a tint of whatever fill it sits on.
  tone?: "dark" | "light";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute max-w-none pointer-events-none select-none",
        MOTIF_PLACEMENT[placement],
      )}
    >
      {motif === "quiz" && <QuizAnswerSheet tone={tone} />}
    </span>
  );
}

// Three answer rows — the ticked one leads the stack so its green check lands
// above a card's centred copy rather than behind it. Fills only, no outlines:
// a hairline crossing a card reads as a stray rule, while soft solid shapes
// read as an illustration and stay out of the copy's way. Drawn inline rather
// than shipped as an asset so the alphas stay tunable against each quiz
// surface, and so the tick can use the brand greens.
//
// Only the ticked row carries any weight — the waiting rows can end up behind
// copy, so they stay the faintest shapes on the card. On cream the tick needs a
// solid forest fill to hold; on the greens the brand lime at low alpha is
// enough of a pop.
function QuizAnswerSheet({ tone }: { tone: "dark" | "light" }) {
  const dark = tone === "dark";
  const ink = {
    pick: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)",
    pickLine: dark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)",
    row: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)",
    dot: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    line: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
    accent: dark ? "var(--secondary-green)" : "var(--primary-green)",
    accentOpacity: dark ? 0.34 : 0.85,
    onAccent: dark ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.95)",
  };
  return (
    <svg viewBox="0 0 176 136" fill="none" className="w-full h-auto block">
      {/* Ticked row — the pop of colour that makes the sheet read as filled in. */}
      <g>
        <rect x={0} y={0} width={142} height={40} rx={20} fill={ink.pick} />
        <circle cx={25} cy={20} r={10} fill={ink.accent} fillOpacity={ink.accentOpacity} />
        <path
          d="M20 20.5 L23.8 24.3 L30.5 15.5"
          stroke={ink.onAccent}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x={45} y={17} width={74} height={6} rx={3} fill={ink.pickLine} />
      </g>
      {/* Waiting rows. */}
      {[
        { y: 48, w: 176, line: 92 },
        { y: 96, w: 124, line: 56 },
      ].map((r) => (
        <g key={r.y}>
          <rect x={0} y={r.y} width={r.w} height={40} rx={20} fill={ink.row} />
          <circle cx={25} cy={r.y + 20} r={10} fill={ink.dot} />
          <rect x={45} y={r.y + 17} width={r.line} height={6} rx={3} fill={ink.line} />
        </g>
      ))}
    </svg>
  );
}

// The eyebrow glyph that pairs with a motif kind — drop it in CardHeader's
// `leading` (or before a row's label) so the card announces "form" before the
// label is read.
export function MotifIcon({ motif, size = 14 }: { motif: CardMotif; size?: number }) {
  if (motif !== "quiz") return null;
  return <ListChecks size={size} strokeWidth={2} aria-hidden />;
}

function ActionCircle({
  tone = "dark",
  className,
}: { tone?: "dark" | "light"; className?: string } = {}) {
  const isDark = tone === "dark";
  return (
    <span
      aria-hidden
      className={cn(
        "shrink-0 h-9 w-9 rounded-full border-[1.5px] inline-flex items-center justify-center",
        isDark ? "border-white/40 text-white" : "border-neutral-900/55 text-neutral-900",
        className,
      )}
    >
      <ArrowRight size={16} strokeWidth={2.25} />
    </span>
  );
}

export function CardHeader({
  meta,
  cadence,
  eyebrow,
  leading,
  onMore,
}: {
  meta: CardChromeMeta;
  cadence?: "Daily";
  eyebrow?: string;
  leading?: React.ReactNode;
  onMore?: () => void;
}) {
  const isDark = meta.tone === "dark";
  const eyebrowColor = isDark ? "text-white" : "text-neutral-900";

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex flex-row items-center gap-1 flex-wrap">
        <p
          className={
            "text-xs font-medium tracking-[0.08em] uppercase inline-flex items-center gap-1.5 " +
            eyebrowColor
          }
        >
          {leading}
          {eyebrow ?? meta.label}
        </p>
        {cadence && <DailyTag tone={meta.tone} />}
      </div>
      {onMore && (
        <Button
          surface={isDark ? "dark" : "light"}
          variant="plain"
          size="icon-sm"
          aria-label="More options"
          onClick={(e) => {
            e.stopPropagation();
            onMore();
          }}
          className="shrink-0 -mt-1 -mr-1"
        >
          <MoreHorizontal strokeWidth={2} aria-hidden />
        </Button>
      )}
    </div>
  );
}

export function CardFooter({
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
          <Button
            surface={isDark ? "dark" : "light"}
            variant="plain"
            size="icon-sm"
            aria-pressed={isSaved}
            aria-label={isSaved ? "Remove bookmark" : "Save"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            className="-ml-1"
          >
            <Bookmark
              strokeWidth={2}
              fill={isSaved ? "currentColor" : "none"}
              aria-hidden
            />
          </Button>
        )}
        <span aria-hidden className={iconColor}>
          <Share2 size={20} strokeWidth={2} />
        </span>
      </div>
      <div className="flex items-center gap-3 min-w-0">
        {meta && (
          <span
            className={
              "text-xs font-medium tracking-[0.08em] uppercase " +
              (isDark ? "text-white/80" : "text-neutral-700")
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

export function CardCTA({
  tone,
  onClick,
  children,
}: {
  tone: "dark" | "light";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      surface={tone === "dark" ? "dark" : "light"}
      variant="secondary"
      onClick={onClick}
      className={cn(
        "h-10 px-5 text-xs font-medium uppercase tracking-[0.1em]",
        // Light-tone CTAs (gratitude, book) sit on pale fills where the soft
        // border-border hairline reads weak — pin to the ink token.
        tone === "light" && "border-foreground",
      )}
    >
      {children}
    </Button>
  );
}

// Dot-prefixed meta token rendered after a card's eyebrow — a cadence
// ("• Daily") or a length estimate ("• 3 min").
export function MetaDot({
  tone = "dark",
  children,
}: {
  tone?: "dark" | "light";
  children: React.ReactNode;
}) {
  const isDark = tone === "dark";
  return (
    <span
      className={
        "text-xs font-medium tracking-[0.12em] uppercase " +
        (isDark ? "text-white" : "text-neutral-900")
      }
    >
      <span aria-hidden className="mx-0.5">•</span>
      {children}
    </span>
  );
}

export function DailyTag({ tone = "dark" }: { tone?: "dark" | "light" } = {}) {
  return <MetaDot tone={tone}>Daily</MetaDot>;
}
