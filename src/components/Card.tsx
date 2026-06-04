import * as React from "react";
import { Bookmark, MoreHorizontal, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppMode, type AppMode } from "@/lib/theme-prefs";
import { Button } from "@/components/Button";

/**
 * Content card primitive — the rounded photo-tinted tile behind Home's
 * "Created For You" feed (meditations, affirmations, books, …). NOT the
 * list-row option card (that's <Button variant="card">).
 *
 * Anatomy: <Card> shell + optional <CardHeader> (eyebrow + More), centered
 * body (caller-owned), and optional <CardFooter> (save/share + a primary CTA).
 *
 * Color model: content is authored white-on-dark (text-white/*) and inverts
 * for the light cluster via the global `.theme-light` shim — same as the rest
 * of the photo-bg screens. Only the photo tint + ring can't be inverted by a
 * shim (they're inline/arbitrary), so they follow `surface` (defaults to the
 * live app mode); pass `surface` explicitly to pin a card to one cluster.
 *
 * Card props:
 *   tone:      "dark" | "light"  — content tone (dark = white text)
 *   naturePath: string           — background photo (tinted per surface)
 *   isNew?:    boolean           — green "New" flag, top-left
 *   surface?:  "dark" | "light"  — tint cluster; default useAppMode()
 *
 * CardHeader props: meta {label, emoji, tone}, cadence?, eyebrow?, leading?
 * CardFooter props: primary, meta?, isSaved?, onToggleSave?, tone?
 * CardCTA props:    tone, onClick, children
 */

export type CardChromeMeta = {
  label: string;
  emoji: string;
  tone: "dark" | "light";
};

// Background + ring for a content card, shared by the tile and the list row.
// The photo is tinted per cluster — a white wash in light, a black wash in dark.
export function cardSurface({
  naturePath,
  isLight,
}: {
  naturePath: string;
  isLight: boolean;
}): { style: React.CSSProperties; ringClass: string } {
  const tintLayer = isLight
    ? "linear-gradient(rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.72))"
    : "linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55))";
  return {
    style: {
      backgroundImage: `${tintLayer}, url(${naturePath})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    },
    ringClass: isLight ? "ring-black/10" : "ring-white/15",
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
  surface,
  className,
  children,
}: {
  tone: "dark" | "light";
  isNew?: boolean;
  naturePath: string;
  surface?: AppMode;
  className?: string;
  children: React.ReactNode;
}) {
  const appMode = useAppMode();
  const isLight = (surface ?? appMode) === "light";
  const isDark = tone === "dark";
  const { style, ringClass } = cardSurface({ naturePath, isLight });

  return (
    <div className="relative">
      {isNew && <NewBadge className="-top-2 left-4" />}
      <div
        className={cn(
          "rounded-2xl p-5 aspect-square flex flex-col overflow-hidden ring-1",
          ringClass,
          isDark ? "text-white" : "text-neutral-900",
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
          {leading ?? <span aria-hidden>{meta.emoji}</span>}
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
