import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  AVATAR_LABELS,
  AVATAR_VARIANTS,
  YunaAvatar,
  type AvatarVariant,
} from "@/components/YunaAvatar";
import { getAvatar, setAvatar } from "@/lib/yuna-session";

const STYLES = ["Gentle", "Direct", "Socratic", "Coach"] as const;
const VOICES = ["Aria", "Sol", "Wren", "Kit"] as const;
const PACES = ["Slow", "Natural", "Brisk"] as const;
const LANGUAGES = ["English", "Español", "Français", "Deutsch"] as const;

export function YunaSettingsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [style, setStyle] = useState<string>("Gentle");
  const [voice, setVoice] = useState<string>("Aria");
  const [pace, setPace] = useState<string>("Natural");
  const [language, setLanguage] = useState<string>("English");
  const [avatar, setAvatarLocal] = useState<AvatarVariant | null>(
    typeof window !== "undefined" ? getAvatar() : null,
  );

  const choose = (v: AvatarVariant) => {
    setAvatar(v);
    setAvatarLocal(v);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[92vh] rounded-t-[1.5rem]">
        <DrawerHeader className="text-left px-6 pt-2">
          <DrawerTitle className="font-serif text-xl tracking-tight">
            Yuna settings
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            Shape how I show up for you.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-10 flex flex-col gap-7">
          <Section label="Therapy style">
            <ChipRow value={style} onChange={setStyle} options={STYLES as readonly string[]} />
          </Section>

          <Section label="Avatar">
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="flex gap-3 pb-1">
                {AVATAR_VARIANTS.map((v) => {
                  const selected = v === avatar;
                  return (
                    <button
                      key={v}
                      onClick={() => choose(v)}
                      className="shrink-0 flex flex-col items-center gap-2 group"
                    >
                      <span
                        className={
                          "h-16 w-16 rounded-full hairline flex items-center justify-center transition-colors " +
                          (selected ? "bg-foreground text-background" : "group-hover:bg-accent")
                        }
                      >
                        <YunaAvatar variant={v} size={42} />
                      </span>
                      <span className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                        {AVATAR_LABELS[v]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section label="Voice">
            <ChipRow value={voice} onChange={setVoice} options={VOICES as readonly string[]} />
          </Section>

          <Section label="Voice pace">
            <ChipRow value={pace} onChange={setPace} options={PACES as readonly string[]} />
          </Section>

          <Section label="Language">
            <ChipRow value={language} onChange={setLanguage} options={LANGUAGES as readonly string[]} />
          </Section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
        {label}
      </p>
      {children}
    </div>
  );
}

function ChipRow({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = o === value;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={
              "font-sans-ui text-xs px-4 py-2 rounded-full hairline transition-colors " +
              (selected ? "bg-foreground text-background" : "hover:bg-accent")
            }
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}