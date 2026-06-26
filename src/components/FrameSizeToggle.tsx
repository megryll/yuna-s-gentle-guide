import { Smartphone } from "lucide-react";

import { FRAME_SIZES, setFrameSizeId, useFrameSizeId } from "@/lib/frame-size";

export function FrameSizeToggle() {
  const current = useFrameSizeId();

  return (
    <div
      className="hidden md:flex items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur-md p-1 shadow-sm"
      role="group"
      aria-label="Simulated device size"
    >
      <span className="px-2 text-muted-foreground" aria-hidden="true">
        <Smartphone size={14} strokeWidth={2} />
      </span>
      {FRAME_SIZES.map((size) => (
        <ToggleButton
          key={size.id}
          active={current === size.id}
          onClick={() => setFrameSizeId(size.id)}
        >
          {size.label}
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
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "text-uppercase tracking-wide px-3 py-1 rounded-full transition-colors " +
        (active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground/90 active:text-foreground")
      }
    >
      {children}
    </button>
  );
}
