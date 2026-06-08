import { useState } from "react";
import { ChevronDown as ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/Button";
import { YunaMark } from "@/components/YunaMark";
import { YunaAvatar } from "@/components/YunaAvatar";
import { useYunaIdentity } from "@/lib/yuna-session";
import { YunaSettingsDrawer } from "@/components/YunaSettingsDrawer";

/**
 * Centered "Yuna ▾" pill that opens the settings drawer.
 * Renders the trigger and owns the drawer state — drop into a header.
 *
 * surface: "light" (default) or "dark" — flips border + text color for use
 * over photo backgrounds.
 */
export function YunaHeaderTrigger({
  surface = "light",
}: {
  surface?: "light" | "dark";
} = {}) {
  const [open, setOpen] = useState(false);
  const { avatar } = useYunaIdentity();
  const isDark = surface === "dark";

  return (
    <>
      <Button
        surface={isDark ? "dark" : "light"}
        variant="secondary"
        onClick={() => setOpen(true)}
        aria-label="Open Yuna settings"
        className="h-9 gap-2 px-3 text-uppercase uppercase tracking-[0.2em]"
      >
        <span
          className={
            "h-5 w-5 rounded-full overflow-hidden flex items-center justify-center " +
            (isDark ? "bg-[#f3f1ee]" : "bg-muted")
          }
        >
          {avatar
            ? <YunaAvatar variant={avatar} size={20} />
            : <span className="h-5 w-5 rounded-full hairline flex items-center justify-center"><YunaMark size={12} className="text-foreground" /></span>}
        </span>
        Yuna
        <ChevronDown />
      </Button>
      <YunaSettingsDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}

function ChevronDown() {
  return <ChevronDownIcon size={10} strokeWidth={1.5} />;
}
