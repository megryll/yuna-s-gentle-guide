import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The question card shared by the survey runner (/survey/$id) and the
// starting-point questionnaire (/questionnaire/$id): a frosted surface panel
// that follows the photo cluster (same fill idiom as YunaExplains), so it reads
// white-on-dark in dark mode and inverts with the rest of the screen in light
// mode rather than being a solid white tile. Scrolls internally if content runs
// long. The tilt-and-slide transition is driven by the caller via `className`
// (the `survey-card-*` animation classes in styles.css).
export function QuestionCard({
  surface,
  className,
  children,
}: {
  surface: "dark" | "light";
  className?: string;
  children: ReactNode;
}) {
  const dark = surface === "dark";
  return (
    <div
      className={cn(
        "w-full max-h-full overflow-y-auto rounded-3xl backdrop-blur-md px-5 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        dark ? "border border-white/12 bg-white/10" : "border border-foreground/10 bg-foreground/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

// The question text printed at the top of every card.
export function CardLead({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-snug text-white">{children}</p>;
}
