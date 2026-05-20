import {
  INTRO_VARIANTS,
  setIntroVariant,
  useIntroVariant,
  type IntroVariant,
} from "@/lib/intro-variant";

const LABELS: Record<IntroVariant, string> = {
  continuous: "Continuous Intro",
  stepped: "Stepped Intro",
};

export function IntroVariantToggle() {
  const variant = useIntroVariant();

  return (
    <div
      className="hidden md:flex items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur-md p-1 shadow-sm"
      role="group"
      aria-label="Intro variant"
    >
      {INTRO_VARIANTS.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => setIntroVariant(v)}
          aria-pressed={variant === v}
          className={
            "text-[11px] tracking-wide h-6 px-2 rounded-full transition-colors " +
            (variant === v
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {LABELS[v]}
        </button>
      ))}
    </div>
  );
}
