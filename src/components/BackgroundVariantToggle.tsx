import {
  BG_VARIANTS,
  setBgVariant,
  useBgVariant,
  type BgVariant,
} from "@/lib/theme-prefs";

export function BackgroundVariantToggle() {
  const variant = useBgVariant();

  return (
    <div
      className="hidden md:flex items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur-md p-1 shadow-sm"
      role="group"
      aria-label="Dark mode background variant"
    >
      <span
        aria-hidden="true"
        className="text-[11px] tracking-wide text-muted-foreground px-1.5"
      >
        BG
      </span>
      {BG_VARIANTS.map((v) => (
        <ToggleButton
          key={v}
          active={variant === v}
          onClick={() => setBgVariant(v)}
        >
          {v}
        </ToggleButton>
      ))}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: BgVariant;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "text-[11px] tracking-wide w-6 h-6 rounded-full transition-colors " +
        (active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}
