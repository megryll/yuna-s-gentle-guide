import { Volume2, VolumeX } from "lucide-react";
import { setPrototypeMute, usePrototypeMute } from "@/lib/prototype-mute";

export function PrototypeMuteToggle() {
  const muted = usePrototypeMute();
  return (
    <button
      type="button"
      onClick={() => setPrototypeMute(!muted)}
      aria-pressed={muted}
      aria-label={muted ? "Unmute prototype audio" : "Mute prototype audio"}
      title={muted ? "Prototype audio muted" : "Mute prototype audio"}
      className={
        "hidden md:inline-flex items-center justify-center h-8 w-8 rounded-full border border-border backdrop-blur-md shadow-sm transition-colors " +
        (muted
          ? "bg-foreground text-background"
          : "bg-background/80 text-muted-foreground active:text-foreground")
      }
    >
      {muted ? (
        <VolumeX size={14} strokeWidth={2} aria-hidden />
      ) : (
        <Volume2 size={14} strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
