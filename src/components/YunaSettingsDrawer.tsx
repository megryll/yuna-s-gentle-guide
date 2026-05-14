import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { avatarSrc, type AvatarVariant } from "@/components/YunaAvatar";
import { setVoice as persistVoice, useYunaIdentity } from "@/lib/yuna-session";
import { VOICE_IDS, type VoiceId } from "@/lib/voices";
import {
  ChoiceList,
  GlobeIcon,
  IntroVoicePicker,
  LANGUAGE_OPTIONS,
  MicIcon,
  NavList,
  NavRow,
  PACE_STEPS,
  PaceSlider,
  SpeedIcon,
  SubScreen,
  useVoicePreview,
} from "@/components/yuna-settings-shared";

const DEFAULT_PACE_IDX = 2;
const DEFAULT_VOICE_ID: VoiceId = VOICE_IDS[0];

type Screen = "main" | "voice" | "pace" | "language";

export function YunaSettingsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [screen, setScreen] = useState<Screen>("main");
  const [paceIdx, setPaceIdx] = useState<number>(DEFAULT_PACE_IDX);
  const [language, setLanguage] = useState<string>("English");

  // Live source of truth — picker carousel reflects the current persisted
  // voice, and the NavRow imageSrc updates the moment chooseVoice writes.
  const { voice: persistedVoice } = useYunaIdentity();
  const voice: VoiceId = persistedVoice ?? DEFAULT_VOICE_ID;

  const handleClose = (next: boolean) => {
    if (!next) {
      setScreen("main");
      voicePreview.stop();
    }
    onOpenChange(next);
  };

  // Voice and avatar are mirrored inside persistVoice — one write, both keys
  // stay in lockstep, all subscribed screens (home, chat, call, header)
  // re-render with the new face/voice.
  const chooseVoice = (idx: number) => {
    const id = VOICE_IDS[idx];
    if (!id) return;
    persistVoice(id);
    voicePreview.stop();
  };

  const voicePreview = useVoicePreview();
  const voiceIdx = Math.max(0, VOICE_IDS.indexOf(voice));
  const playingIdx = voicePreview.playingId
    ? VOICE_IDS.indexOf(voicePreview.playingId)
    : null;

  const subTitle: Record<Exclude<Screen, "main">, string> = {
    voice: "Voice",
    pace: "Voice pace",
    language: "Language",
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="h-[85%] max-h-[85%] rounded-t-[1.5rem]">
        {screen === "main" ? (
          <>
            <DrawerHeader className="text-left px-6 pt-2">
              <DrawerTitle className="font-serif text-xl tracking-tight">
                Personalize Yuna
              </DrawerTitle>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-6 pb-10 flex flex-col gap-6">
              <NavList>
                <NavRow
                  icon={<MicIcon />}
                  label="Voice"
                  imageSrc={avatarSrc(voice as AvatarVariant)}
                  onClick={() => setScreen("voice")}
                />
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
          </>
        ) : (
          <SubScreen
            title={subTitle[screen]}
            onBack={() => {
              voicePreview.stop();
              setScreen("main");
            }}
          >
            {screen === "voice" && (
              <div className="-mx-6">
                <IntroVoicePicker
                  surface="light"
                  selectedIdx={voiceIdx}
                  onSelect={chooseVoice}
                  playingIdx={playingIdx}
                  onTogglePlay={(i) => {
                    const id = VOICE_IDS[i];
                    if (id) void voicePreview.toggle(id);
                  }}
                />
              </div>
            )}
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
