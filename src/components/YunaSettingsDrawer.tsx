import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { avatarSrc, type AvatarVariant } from "@/components/YunaAvatar";
import {
  AMBIENCE_OPTIONS,
  type Ambience,
  getAmbience,
  setAmbience as persistAmbience,
  setVoice as persistVoice,
  useYunaIdentity,
} from "@/lib/yuna-session";
import { VOICE_IDS, VOICES, type VoiceId } from "@/lib/voices";
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

const AMBIENCE_CHOICES: Choice[] = [
  { id: "None", label: "None", description: "Silent — no background sounds" },
  { id: "Forest", label: "Forest", description: "Light wind, distant birdsong" },
  { id: "Campfire", label: "Campfire", description: "Crackling logs, gentle warmth" },
  { id: "Ocean", label: "Ocean", description: "Slow waves on a quiet shore" },
  { id: "Busy Cafe", label: "Busy Cafe", description: "Murmured conversation, soft clatter" },
];

const DEFAULT_PACE_IDX = 2;
const DEFAULT_VOICE_ID: VoiceId = VOICE_IDS[0];

type Screen =
  | "main"
  | "responseLength"
  | "supportStyle"
  | "voice"
  | "pace"
  | "language"
  | "ambience";

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
  const [paceIdx, setPaceIdx] = useState<number>(DEFAULT_PACE_IDX);
  const [language, setLanguage] = useState<string>("English");
  const [ambience, setAmbienceLocal] = useState<Ambience>("None");

  // Live source of truth — picker carousel reflects the current persisted
  // voice, and the NavRow imageSrc updates the moment chooseVoice writes.
  const { voice: persistedVoice } = useYunaIdentity();
  const voice: VoiceId = persistedVoice ?? DEFAULT_VOICE_ID;

  // Ambience isn't part of the reactive identity store — read it on open.
  useEffect(() => {
    setAmbienceLocal(getAmbience());
  }, [open]);

  const chooseAmbience = (v: string) => {
    if (!(AMBIENCE_OPTIONS as readonly string[]).includes(v)) return;
    const next = v as Ambience;
    setAmbienceLocal(next);
    persistAmbience(next);
  };

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
    responseLength: "Response length",
    supportStyle: "Support style",
    voice: "Voice",
    pace: "Voice pace",
    language: "Language",
    ambience: "Ambience",
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
                <NavRow
                  icon={<LeafIcon />}
                  label="Ambience"
                  value={ambience}
                  onClick={() => setScreen("ambience")}
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
            {screen === "ambience" && (
              <ChoiceList
                value={ambience}
                onChange={chooseAmbience}
                options={AMBIENCE_CHOICES}
              />
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

function LeafIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M5 19c4-4 7-7 11-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
