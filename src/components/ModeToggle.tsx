import { Moon, Sun } from "lucide-react";
import { setAppMode, useAppMode, type AppMode } from "@/lib/theme-prefs";

export function ModeToggle() {
  const mode = useAppMode();

  return (
    <div
      className="hidden md:flex items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur-md p-1 shadow-sm"
      role="group"
      aria-label="App appearance"
    >
      <ToggleButton
        active={mode === "light"}
        onClick={() => setAppMode("light" satisfies AppMode)}
        label="Light mode"
      >
        <Sun size={15} strokeWidth={1.8} aria-hidden />
      </ToggleButton>
      <ToggleButton
        active={mode === "dark"}
        onClick={() => setAppMode("dark" satisfies AppMode)}
        label="Dark mode"
      >
        <Moon size={15} strokeWidth={1.8} aria-hidden />
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={
        "flex items-center justify-center p-1.5 rounded-full transition-colors " +
        (active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground/90 active:text-foreground")
      }
    >
      {children}
    </button>
  );
}
