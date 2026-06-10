import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { useFrameSize } from "@/lib/frame-size";
import { cn } from "@/lib/utils";

/**
 * PageHeader — the shared tool / detail-screen header: a back button pinned to
 * the leading edge with an optional on-row slot and a trailing action cluster,
 * and — when given a `title` — a centered screen title that sits on its own
 * line BELOW that row. One position + type treatment across the Therapist flow,
 * Meditation, Gratitude Journal, Goals, session detail, and the Settings
 * sub-pages.
 *
 * title:   centered screen title (Fraunces, text-3xl), stacked below the button
 *          row. A little more breathing room above it on larger frames; tighter
 *          on SE. Optional — omit for a bare action bar whose heading lives in
 *          the body.
 * center:  content for the centered slot ON the button row — a step indicator,
 *          an eyebrow, etc. Independent of `title`: one stacks below, one rides
 *          the row, so a screen can use either or both.
 * trailing: action(s) pinned to the trailing edge of the button row.
 * onBack:  back-button handler.
 * backDisabled: disables the back button (e.g. on the first step of a flow).
 * surface: which background the header sits on — "dark" | "light" (default
 *          "light"). Drives both the back-button surface AND the title ink, so
 *          the title reads correctly on its own (white on dark, foreground ink
 *          on light) without depending on the `.theme-light` shim.
 * tone:    forces the title ink for the settings cluster — "ink" =
 *          text-foreground in both modes. Default "photo" derives the ink from
 *          `surface`.
 * layout:  where the `title` sits relative to the button row.
 *   - "stacked" (default) — title on its own line below the row, the tool /
 *     detail-screen treatment (Therapist, Meditation, Goals, Gratitude).
 *   - "inline" — title rides the row in the centered slot, the compact bar the
 *     Settings sub-pages use. (Ignored when no `title` is given.)
 * className: extra classes on the <header> (e.g. px-8 to match a px-8 body, or
 *            zero out the built-in padding when nested in a padded scroller).
 */
export function PageHeader({
  title,
  center,
  trailing,
  onBack,
  backDisabled = false,
  surface = "light",
  tone = "photo",
  layout = "stacked",
  className,
}: {
  title?: string;
  center?: ReactNode;
  trailing?: ReactNode;
  onBack: () => void;
  backDisabled?: boolean;
  surface?: "dark" | "light";
  tone?: "photo" | "ink";
  layout?: "stacked" | "inline";
  className?: string;
}) {
  const isSE = useFrameSize().id === "se";
  const titleInk = tone === "ink" || surface === "light" ? "text-foreground" : "text-white";
  const titleBase = cn("font-display text-3xl leading-tight tracking-tight text-center", titleInk);

  return (
    <header className={cn("flex flex-col shrink-0 px-6 pt-14 pb-2", className)}>
      {/* Button row: symmetric 1fr/auto/1fr grid keeps the on-row slot optically
          centered whether or not a trailing action is present. An inline title
          rides this slot; a stacked one drops below the row. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="justify-self-start">
          <Button
            surface={surface}
            variant="secondary"
            size="icon"
            aria-label="Back"
            disabled={backDisabled}
            onClick={onBack}
          >
            <ChevronLeft strokeWidth={1.5} />
          </Button>
        </div>

        <div className="justify-self-center min-w-0">
          {center ?? (layout === "inline" && title ? <h1 className={titleBase}>{title}</h1> : null)}
        </div>

        <div className="justify-self-end flex items-center gap-2">{trailing}</div>
      </div>

      {layout === "stacked" && title && (
        <h1 className={cn(titleBase, isSE ? "pt-4" : "pt-6")}>{title}</h1>
      )}
    </header>
  );
}
