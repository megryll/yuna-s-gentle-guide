import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

/**
 * PageHeader — the shared tool / detail-screen header: a back button pinned to
 * the leading edge with the page title optically centered on the same row. One
 * position + type treatment across Therapist Recommendation, Meditation,
 * Gratitude Journal, Goals, and the Settings sub-pages.
 *
 * title:   the screen title (Fraunces, text-3xl).
 * onBack:  back-button handler.
 * surface: back-button surface — "dark" | "light" (default "light").
 * tone:    title ink
 *   - "photo" — text-white, for the photo-bg themed cluster (`.theme-light`
 *               inverts it in light mode). Default.
 *   - "ink"   — text-foreground, for the settings cluster (`.overlay-on-dark`
 *               inverts it in dark mode).
 * className: extra classes on the <header> (e.g. px-8 to match a px-8 body).
 */
export function PageHeader({
  title,
  onBack,
  surface = "light",
  tone = "photo",
  className,
}: {
  title: string;
  onBack: () => void;
  surface?: "dark" | "light";
  tone?: "photo" | "ink";
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative flex items-center justify-center shrink-0 px-6 pt-14 pb-2",
        className,
      )}
    >
      <div className="absolute left-6">
        <Button
          surface={surface}
          variant="secondary"
          size="icon"
          aria-label="Back"
          onClick={onBack}
        >
          <ChevronLeft strokeWidth={1.5} />
        </Button>
      </div>
      <h1
        className={cn(
          "font-display text-3xl leading-tight tracking-tight text-center px-12",
          tone === "ink" ? "text-foreground" : "text-white",
        )}
      >
        {title}
      </h1>
    </header>
  );
}
