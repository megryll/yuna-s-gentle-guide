import { SOUNDTRACKS, setSoundtrackId, useSoundtrackId } from "@/lib/soundtrack-prefs";

export function SoundtrackToggle() {
  const current = useSoundtrackId();

  return (
    <div
      className="hidden md:flex items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur-md p-1 shadow-sm"
      role="group"
      aria-label="Background audio"
    >
      <span className="text-[11px] tracking-wide px-2 text-muted-foreground">
        Background audio
      </span>
      {SOUNDTRACKS.map((track) => (
        <ToggleButton
          key={track.id}
          active={current === track.id}
          onClick={() => setSoundtrackId(track.id)}
        >
          {track.label}
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
        "text-[11px] tracking-wide px-3 py-1 rounded-full transition-colors " +
        (active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}
