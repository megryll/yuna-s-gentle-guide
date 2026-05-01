import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  ChoiceList,
  DEFAULT_PACE_IDX,
  GlobeIcon,
  LANGUAGE_OPTIONS,
  NavList,
  NavRow,
  PACE_STEPS,
  PaceSlider,
  SpeedIcon,
  SubScreen,
  VoiceCarousel,
} from "@/components/yuna-settings-shared";
import { Button } from "@/components/Button";

type Screen = "main" | "pace" | "language";

export function VoicePickerDrawer({
  open,
  onOpenChange,
  voice,
  onVoiceChange,
  onStart,
  startLabel = "Start call",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  voice: string;
  onVoiceChange: (id: string) => void;
  onStart: () => void;
  startLabel?: string;
}) {
  const [screen, setScreen] = useState<Screen>("main");
  const [paceIdx, setPaceIdx] = useState<number>(DEFAULT_PACE_IDX);
  const [language, setLanguage] = useState<string>("English");

  useEffect(() => {
    if (!open) setScreen("main");
  }, [open]);

  const handleClose = (next: boolean) => {
    if (!next) setScreen("main");
    onOpenChange(next);
  };

  const subTitle: Record<Exclude<Screen, "main">, string> = {
    pace: "Voice pace",
    language: "Language",
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="h-[92%] max-h-[92%] rounded-t-[1.75rem] p-0">
        {screen === "main" ? (
          <>
            <DrawerHeader className="text-left px-6 pt-2 pb-1 shrink-0">
              <DrawerTitle className="font-serif text-2xl tracking-tight">
                Choose a voice
              </DrawerTitle>
              <DrawerDescription className="text-xs leading-relaxed">
                Pick how you'd like me to sound. Swipe to preview.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
              <div className="pt-6 pb-2 shrink-0">
                <VoiceCarousel voice={voice} onVoiceChange={onVoiceChange} />
              </div>

              <div className="px-6 pt-4 pb-6 shrink-0">
                <NavList>
                  <NavRow
                    icon={<SpeedIcon />}
                    label="Voice pace"
                    value={PACE_STEPS[paceIdx]}
                    onClick={() => setScreen("pace")}
                  />
                  <NavRow
                    icon={<GlobeIcon />}
                    label="Language"
                    value={language}
                    onClick={() => setScreen("language")}
                  />
                </NavList>
              </div>
            </div>

            <div className="px-6 pt-3 pb-6 border-t border-border bg-background shrink-0">
              <Button surface="light" variant="primary" fullWidth onClick={onStart}>
                {startLabel}
              </Button>
            </div>
          </>
        ) : (
          <SubScreen title={subTitle[screen]} onBack={() => setScreen("main")}>
            {screen === "pace" && (
              <PaceSlider steps={PACE_STEPS} value={paceIdx} onChange={setPaceIdx} />
            )}
            {screen === "language" && (
              <ChoiceList value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS} />
            )}
          </SubScreen>
        )}
      </DrawerContent>
    </Drawer>
  );
}
