import { setPlatform, usePlatform, type Platform } from "@/lib/platform";

export function PlatformToggle() {
  const platform = usePlatform();

  return (
    <div
      className="hidden md:flex items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur-md p-1 shadow-sm"
      role="group"
      aria-label="Simulated device platform"
    >
      <ToggleButton
        active={platform === "ios"}
        onClick={() => setPlatform("ios" satisfies Platform)}
      >
        iOS
      </ToggleButton>
      <ToggleButton
        active={platform === "android"}
        onClick={() => setPlatform("android" satisfies Platform)}
      >
        Android
      </ToggleButton>
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
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "text-uppercase tracking-wide px-3 py-1 rounded-full transition-colors " +
        (active
          ? "bg-foreground text-background"
          : "text-muted-foreground active:text-foreground")
      }
    >
      {children}
    </button>
  );
}
