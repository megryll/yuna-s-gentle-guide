import { useEffect, useState } from "react";
import { YunaMark } from "@/components/YunaMark";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import { getAvatar } from "@/lib/yuna-session";
import { YunaSettingsDrawer } from "@/components/YunaSettingsDrawer";

/**
 * Centered "Yuna ▾" pill that opens the settings drawer.
 * Renders the trigger and owns the drawer state — drop into a header.
 */
export function YunaHeaderTrigger() {
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<AvatarVariant | null>(null);

  useEffect(() => {
    setAvatar(getAvatar());
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Yuna settings"
        className="font-sans-ui h-9 px-3 rounded-full hairline flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase hover:bg-accent transition-colors"
      >
        <span className="h-5 w-5 rounded-full overflow-hidden flex items-center justify-center bg-muted">
          {avatar
            ? <YunaAvatar variant={avatar} size={20} />
            : <span className="h-5 w-5 rounded-full hairline flex items-center justify-center"><YunaMark size={12} className="text-foreground" /></span>}
        </span>
        Yuna
        <ChevronDown />
      </button>
      <YunaSettingsDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
