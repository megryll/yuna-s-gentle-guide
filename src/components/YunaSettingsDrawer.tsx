import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  AVATAR_VARIANTS,
  YunaAvatar,
  type AvatarVariant,
} from "@/components/YunaAvatar";
import { getAvatar, setAvatar } from "@/lib/yuna-session";
import {
  ChoiceList,
  GlobeIcon,
  LANGUAGE_OPTIONS,
  MicIcon,
  NavList,
  NavRow,
  PACE_STEPS,
  PaceSlider,
  SpeedIcon,
  SubScreen,
  VoiceCarousel,
  type Choice,
} from "@/components/yuna-settings-shared";

const SUPPORT_STYLES: Choice[] = [
  { id: "Friendly", label: "Friendly", description: "Warm and caring" },
  { id: "Motivational", label: "Motivational", description: "Energetic and encouraging" },
  { id: "Direct", label: "Direct", description: "Honest and firm" },
  { id: "Serious", label: "Serious", description: "Formal and focused" },
];

const RESPONSE_LENGTHS: Choice[] = [
  { id: "Brief", label: "Brief", description: "Short and concise" },
  { id: "Balanced", label: "Balanced", description: "Complete and well rounded" },
  { id: "Long", label: "Long", description: "Broad and detailed" },
];

const DEFAULT_PACE_IDX = 2;

type Screen = "main" | "responseLength" | "supportStyle" | "voice" | "pace" | "language";

export function YunaSettingsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [screen, setScreen] = useState<Screen>("main");
  const [supportStyle, setSupportStyle] = useState<string>("Friendly");
  const [responseLength, setResponseLength] = useState<string>("Brief");
  const [voice, setVoice] = useState<string>("Aria");
  const [paceIdx, setPaceIdx] = useState<number>(DEFAULT_PACE_IDX);
  const [language, setLanguage] = useState<string>("English");
  // Defer reading localStorage to an effect — accessing it synchronously
  // during render causes a server/client hydration mismatch under SSR.
  const [avatar, setAvatarLocal] = useState<AvatarVariant | null>(null);
  useEffect(() => {
    setAvatarLocal(getAvatar());
  }, [open]);

  const handleClose = (next: boolean) => {
    if (!next) setScreen("main");
    onOpenChange(next);
  };

  const chooseAvatar = (v: AvatarVariant) => {
    setAvatar(v);
    setAvatarLocal(v);
  };

  const subTitle: Record<Exclude<Screen, "main">, string> = {
    responseLength: "Response length",
    supportStyle: "Support style",
    voice: "Voice",
    pace: "Voice pace",
    language: "Language",
  };

  const responseLengthOption = RESPONSE_LENGTHS.find((o) => o.id === responseLength);
  const supportStyleOption = SUPPORT_STYLES.find((o) => o.id === supportStyle);

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
              <div
                className="overflow-x-auto -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
              >
                <div className="flex gap-3 pb-2 pt-1 w-max">
                  {AVATAR_VARIANTS.map((v) => {
                    const selected = v === avatar;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => chooseAvatar(v)}
                        aria-pressed={selected}
                        aria-label={`Avatar ${v}`}
                        className={
                          "shrink-0 transition-opacity " +
                          (selected || !avatar ? "opacity-100" : "opacity-60 hover:opacity-100")
                        }
                      >
                        <span
                          className={
                            "relative block h-16 w-16 rounded-full transition-all " +
                            (selected
                              ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                              : "hairline")
                          }
                        >
                          <span className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
                            <YunaAvatar variant={v} size={64} />
                          </span>
                          {selected && (
                            <span
                              aria-hidden="true"
                              className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center border-2 border-background"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M5 12.5l4.5 4.5L19 7"
                                  stroke="currentColor"
                                  strokeWidth="2.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <NavList>
                <NavRow
                  icon={<ChatLinesIcon />}
                  label="Response length"
                  value={responseLengthOption?.label ?? responseLength}
                  onClick={() => setScreen("responseLength")}
                />
                <NavRow
                  icon={<HeartIcon />}
                  label="Support style"
                  value={supportStyleOption?.label ?? supportStyle}
                  onClick={() => setScreen("supportStyle")}
                />
                <NavRow
                  icon={<MicIcon />}
                  label="Voice"
                  value={voice}
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
          <SubScreen title={subTitle[screen]} onBack={() => setScreen("main")}>
            {screen === "responseLength" && (
              <ChoiceList
                value={responseLength}
                onChange={setResponseLength}
                options={RESPONSE_LENGTHS}
              />
            )}
            {screen === "supportStyle" && (
              <ChoiceList
                value={supportStyle}
                onChange={setSupportStyle}
                options={SUPPORT_STYLES}
              />
            )}
            {screen === "voice" && <VoiceCarousel voice={voice} onVoiceChange={setVoice} />}
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

function ChatLinesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
