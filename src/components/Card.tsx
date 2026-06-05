import * as React from "react";
import { Bookmark, MoreHorizontal, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";

/**
 * Content card primitive — the rounded photo-tinted tile behind Home's
 * "Created For You" feed (meditations, affirmations, books, …). NOT the
 * list-row option card (that's <Button variant="card">).
 *
 * Anatomy: <Card> shell + optional <CardHeader> (eyebrow + More), centered
 * body (caller-owned), and optional <CardFooter> (save/share + a primary CTA).
 *
 * Color model: a card is either photo-tinted (`naturePath`) or a flat solid
 * (`solidFill`), and its look is FIXED across the app's light/dark toggle.
 *   • Photo cards always use the dark cluster — a black wash + white ink — so
 *     they read identically in light and dark mode.
 *   • Solid cards carry a fixed fill: pair a pale fill with tone "light" (dark
 *     ink) or a deep fill with tone "dark" (white ink).
 * Any tone "dark" card pins its white ink against the global `.theme-light`
 * shim via the `card-fixed-dark` class (the shim would otherwise invert it).
 *
 * Card props:
 *   tone:      "dark" | "light"  — content tone (dark = white text)
 *   naturePath: string           — background photo (dark-washed)
 *   solidFill?: string           — flat fill (overrides photo)
 *   isNew?:    boolean           — green "New" flag, top-left
 *
 * CardHeader props: meta {label, tone}, cadence?, eyebrow?, leading?
 * CardFooter props: primary, meta?, isSaved?, onToggleSave?, tone?
 * CardCTA props:    tone, onClick, children
 */

export type CardChromeMeta = {
  label: string;
  tone: "dark" | "light";
};

// Background + ring for a photo content card, shared by the tile and the list
// row. Always the dark cluster — a black wash + white ink — in both app modes,
// so photo cards read identically light and dark.
export function cardSurface({
  naturePath,
}: {
  naturePath: string;
}): { style: React.CSSProperties; ringClass: string } {
  return {
    style: {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${naturePath})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    },
    ringClass: "ring-white/15",
  };
}

export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute z-10 text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-full text-white shadow bg-yuna-green",
        className,
      )}
    >
      New
    </span>
  );
}

export function Card({
  tone,
  isNew,
  naturePath,
  solidFill,
  className,
  children,
}: {
  tone: "dark" | "light";
  isNew?: boolean;
  naturePath?: string;
  solidFill?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const isDark = tone === "dark";

  // Solid cards carry a fixed fill + a tone-derived ring; photo cards get the
  // dark photo wash. Either way the look is mode-independent — a dark-toned
  // card pins its white ink against `.theme-light` via `card-fixed-dark`.
  // Solid-card ring echoes the card's ink/button-text color at a softer alpha:
  // white on dark fills, foreground ink on pale fills.
  const { style, ringClass } = solidFill
    ? {
        style: { backgroundColor: solidFill } as React.CSSProperties,
        ringClass: isDark ? "ring-white/20" : "ring-foreground/20",
      }
    : cardSurface({ naturePath: naturePath ?? "" });

  return (
    <div className="relative">
      {isNew && <NewBadge className="-top-2 left-4" />}
      <div
        className={cn(
          "rounded-[2.5rem] p-5 aspect-square flex flex-col overflow-hidden ring-1",
          ringClass,
          isDark ? "text-white" : "text-neutral-900",
          isDark && "card-fixed-dark",
          className,
        )}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}

export function CardHeader({
  meta,
  cadence,
  eyebrow,
  leading,
}: {
  meta: CardChromeMeta;
  cadence?: "Daily";
  eyebrow?: string;
  leading?: React.ReactNode;
}) {
  const isDark = meta.tone === "dark";
  const eyebrowColor = isDark ? "text-white" : "text-neutral-900";

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex flex-row items-center gap-1 flex-wrap">
        <p
          className={
            "text-[12px] font-medium tracking-[0.08em] uppercase inline-flex items-center gap-1.5 " +
            eyebrowColor
          }
        >
          {leading}
          {eyebrow ?? meta.label}
        </p>
        {cadence && <DailyTag tone={meta.tone} />}
      </div>
      <Button
        surface={isDark ? "dark" : "light"}
        variant="plain"
        size="icon-sm"
        aria-label="More"
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 -mt-1 -mr-1"
      >
        <MoreHorizontal strokeWidth={2} aria-hidden />
      </Button>
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
              "text-[12px] font-medium tracking-[0.08em] uppercase " +
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
      className="h-10 px-5 text-[12.5px] font-medium uppercase tracking-[0.1em]"
    >
      {children}
    </Button>
  );
}

export function DailyTag({ tone = "dark" }: { tone?: "dark" | "light" } = {}) {
  const isDark = tone === "dark";
  return (
    <span
      className={
        "text-[12px] font-medium tracking-[0.12em] uppercase " +
        (isDark ? "text-white" : "text-neutral-900")
      }
    >
      <span aria-hidden className="mx-0.5">•</span>
      Daily
    </span>
  );
}
