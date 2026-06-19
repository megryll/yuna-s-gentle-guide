import type { ReactNode } from "react";
import { Bookmark, MapPin, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { useFrameSize } from "@/lib/frame-size";

/**
 * TherapistCard — a frosted content card for a recommended therapist. Two
 * forms:
 *   • "deck" — a tall card for the recommendation swipe stack: avatar, name,
 *     credentials, a small location/Virtual meta line, a short description, a
 *     "Suggested for you" tag list, and actions (View profile + optional Not
 *     interested). Save lives in the corner.
 *   • "list" — a compact pressable row for the Saved view: avatar + name +
 *     credentials, save in the corner, the whole row opens the profile.
 *
 * Not a photo-tinted feed `Card` and not a `Button variant="card"` list-row —
 * a therapist is a richer entity (avatar + tags + match note + save), so it's
 * its own primitive composed from Avatar, Tag, and Button.
 *
 * The frosted fill is chosen by `surface` directly (the `.theme-light` shim
 * doesn't remap `bg-white/*`) and pairs blur with a liftable white-alpha fill
 * so it stays defined on Android where blur is killed.
 *
 * variant?:      "deck" (default) | "list"
 * name / credentials / location / photo / tags: therapist fields
 * virtual?:      shows a "Virtual" meta pill beside location (deck only)
 * description?:  a short plain-text bio (deck only)
 * saved?:        bookmarked state
 * onToggleSave?: bookmark toggle
 * onView?:       open the profile (deck: View profile button; list: whole row)
 * onDismiss?:    deck only — renders a "Not interested" action
 * surface?:      "dark" | "light" (default "dark")
 */
export type TherapistCardProps = {
  variant?: "deck" | "list";
  name: string;
  credentials: string;
  location?: string;
  photo: string;
  tags?: string[];
  virtual?: boolean;
  description?: string;
  saved?: boolean;
  onToggleSave?: () => void;
  onView?: () => void;
  onDismiss?: () => void;
  surface?: "dark" | "light";
  className?: string;
};

/**
 * Frosted panel classes for a card/tile sitting on the themed photo. Chosen by
 * surface directly (the `.theme-light` shim doesn't remap `bg-white/*`) and
 * pairs blur with a liftable white-alpha fill so it survives Android's blur
 * kill. Uses a real `border` (not a `ring`) — like `Surface` — so the hairline
 * sits over the frosted fill and reads consistently over a bright photo, rather
 * than a ring painted on the raw background that washes out. Shared by
 * TherapistCard and the therapist screens' inline panels.
 */
export function frostedPanel(surface: "dark" | "light"): string {
  return surface === "dark"
    ? "bg-white/10 border border-white/15 backdrop-blur-md"
    : "bg-white/60 border border-black/[0.06] backdrop-blur-md";
}

/**
 * Circular therapist headshot. A plain photo (decorative — the name sits beside
 * it), sized in px so it stays exact regardless of utility purge. A faint fill
 * shows while the image loads. Shared by TherapistCard and the therapist screens.
 */
export function TherapistPhoto({
  src,
  size,
  className,
}: {
  src: string;
  size: number;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size }}
      className={cn("rounded-full object-cover shrink-0 bg-white/10", className)}
    />
  );
}

/** A quiet meta entry (location, Virtual) — a small icon + label, no fill. */
function MetaItem({
  icon,
  children,
  sub,
}: {
  icon: ReactNode;
  children: ReactNode;
  sub: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs [&_svg]:shrink-0 [&_svg]:size-3.5", sub)}>
      <span className="flex items-center" aria-hidden>
        {icon}
      </span>
      <span>{children}</span>
    </span>
  );
}

function SaveButton({
  saved,
  onToggleSave,
  surface,
}: {
  saved?: boolean;
  onToggleSave?: () => void;
  surface: "dark" | "light";
}) {
  if (!onToggleSave) return null;
  return (
    <Button
      surface={surface}
      variant="plain"
      size="icon-sm"
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Save therapist"}
      onClick={(e) => {
        e.stopPropagation();
        onToggleSave();
      }}
    >
      <Bookmark strokeWidth={2} fill={saved ? "currentColor" : "none"} aria-hidden />
    </Button>
  );
}

export function TherapistCard({
  variant = "deck",
  name,
  credentials,
  location,
  photo,
  tags = [],
  virtual,
  description,
  saved,
  onToggleSave,
  onView,
  onDismiss,
  surface = "dark",
  className,
}: TherapistCardProps) {
  const dark = surface === "dark";
  const sub = dark ? "text-white/75" : "text-foreground/75";
  // On the short SE frame two full-width md buttons overflow the narrow card,
  // so the deck actions drop to the next size down.
  const actionSize = useFrameSize().id === "se" ? "sm" : "md";

  if (variant === "list") {
    return (
      <div className={cn("relative", className)}>
        <button
          type="button"
          onClick={onView}
          className={cn(
            "w-full rounded-3xl p-3.5 pr-12 flex items-center gap-3 text-left",
            "transition-opacity duration-100 active:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
            dark ? "text-white focus-visible:ring-white/60" : "text-foreground focus-visible:ring-foreground/30",
            frostedPanel(surface),
          )}
        >
          <TherapistPhoto src={photo} size={44} />
          <span className="flex-1 min-w-0">
            <span className="block font-display text-lg leading-tight tracking-tight truncate">{name}</span>
            <span className={cn("block text-xs mt-0.5 leading-snug truncate", sub)}>{credentials}</span>
          </span>
        </button>
        <span className="absolute top-3 right-3">
          <SaveButton saved={saved} onToggleSave={onToggleSave} surface={surface} />
        </span>
      </div>
    );
  }

  // Deck card. It sizes to its own content — no height cap — so nothing inside
  // is clipped; on a short frame (e.g. iPhone SE) the carousel scrolls
  // vertically to reach the parts that run past the viewport.
  return (
    <div
      className={cn(
        "relative rounded-[2rem] p-6 flex flex-col gap-5 overflow-hidden",
        dark ? "text-white" : "text-foreground",
        frostedPanel(surface),
        className,
      )}
    >
      {/* Save pins to the content corner so the name/credential/meta column can
          run the full content width (its right edge aligns with the bookmark's
          outer edge); only the name reserves clearance for it on line one. */}
      <div className="absolute top-6 right-6 z-10">
        <SaveButton saved={saved} onToggleSave={onToggleSave} surface={surface} />
      </div>
      <div className="flex items-start gap-4 shrink-0">
        <TherapistPhoto src={photo} size={64} />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div>
            <h2 className="font-display text-2xl leading-tight tracking-tight pr-9">{name}</h2>
            <p className={cn("text-sm mt-1 leading-snug", sub)}>{credentials}</p>
          </div>
          {(location || virtual) && (
            <div className="flex items-center gap-3">
              {location && (
                <MetaItem icon={<MapPin aria-hidden />} sub={sub}>
                  {location}
                </MetaItem>
              )}
              {virtual && (
                <MetaItem icon={<Video aria-hidden />} sub={sub}>
                  Virtual
                </MetaItem>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nothing is height-pressured (the card grows to fit), so the bio just
          clamps to four lines for rhythm and the tags render in full. */}
      {description && (
        <p className={cn("text-sm leading-relaxed line-clamp-4 shrink-0", sub)}>{description}</p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-col gap-3 shrink-0">
          <p className={cn("text-sm font-semibold", dark ? "text-white" : "text-foreground")}>
            Suggested for you
          </p>
          {/* Clamp to two rows of `h-8` tags (2 × 32px + one 8px gap = 72px);
              any overflow stays on the profile. Keeps the card from growing a
              third tag row on a narrow carousel slide. */}
          <div className="flex flex-wrap gap-2 max-h-[4.5rem] overflow-hidden">
            {tags.map((t) => (
              <Tag key={t} surface={surface} variant="informational">
                {t}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {(onView || onDismiss) && (
        <div className="flex items-center gap-3 shrink-0">
          {onDismiss && (
            <Button surface={surface} variant="secondary" size={actionSize} fullWidth onClick={onDismiss}>
              Not interested
            </Button>
          )}
          {onView && (
            <Button surface={surface} variant="primary" size={actionSize} fullWidth onClick={onView}>
              View profile
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
TherapistCard.displayName = "TherapistCard";
