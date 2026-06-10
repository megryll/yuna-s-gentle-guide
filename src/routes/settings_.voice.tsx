import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { PageHeader } from "@/components/PageHeader";
import { Slider } from "@/components/Slider";
import { IntroVoicePicker, PACE_STEPS, useVoicePreview } from "@/components/yuna-settings-shared";
import { setVoice as persistVoice, useYunaIdentity } from "@/lib/yuna-session";
import { VOICE_IDS } from "@/lib/voices";
import { useAppMode, useModeImage } from "@/lib/theme-prefs";
import { flagSettingsSaved } from "@/lib/settings-saved-toast";

const DEFAULT_PACE_IDX = 2; // "1.0x" — the centred default step

export const Route = createFileRoute("/settings_/voice")({
  head: () => ({ meta: [{ title: "Customize Voice — Yuna" }] }),
  component: CustomizeVoiceRoute,
});

function CustomizeVoiceRoute() {
  const navigate = useNavigate();
  const mode = useAppMode();
  const surface = mode === "dark" ? "dark" : "light";
  const bgImage = useModeImage();
  const voicePreview = useVoicePreview();

  const { voice: persistedVoice } = useYunaIdentity();
  const voice = persistedVoice ?? VOICE_IDS[0];
  const voiceIdx = Math.max(0, VOICE_IDS.indexOf(voice));
  const playingIdx = voicePreview.playingId ? VOICE_IDS.indexOf(voicePreview.playingId) : null;

  // Pace is screen-local and always opens at 1.0x (the Personalize drawer never
  // persisted it either) — no restore from a prior session.
  const [paceIdx, setPaceIdx] = useState<number>(DEFAULT_PACE_IDX);

  const chooseVoice = (idx: number) => {
    const id = VOICE_IDS[idx];
    if (!id) return;
    persistVoice(id);
    voicePreview.stop();
    flagSettingsSaved("Your voice has been updated.");
  };

  const choosePace = (idx: number) => {
    setPaceIdx(idx);
    flagSettingsSaved("Your voice pace has been updated.");
  };

  const back = () => {
    voicePreview.stop();
    navigate({ to: "/settings" });
  };

  return (
    <PhoneFrame>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />

      <div
        className={
          "relative flex-1 flex flex-col text-foreground min-h-0 " +
          (mode === "dark" ? "overlay-on-dark" : "")
        }
      >
        <PageHeader title="Customize Voice" tone="ink" onBack={back} />

        <div className="flex-1 overflow-y-auto pt-4 pb-10 flex flex-col gap-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <section className="flex flex-col gap-3">
            <p className="px-6 text-sm leading-relaxed text-foreground/75">
              Pick the voice Yuna speaks with. Tap a card to preview it.
            </p>
            <IntroVoicePicker
              surface={surface}
              selectedIdx={voiceIdx}
              onSelect={chooseVoice}
              playingIdx={playingIdx}
              onTogglePlay={(i) => {
                const id = VOICE_IDS[i];
                if (id) void voicePreview.toggle(id);
              }}
            />
          </section>

          <section className="px-6 flex flex-col gap-3">
            <h2 className="font-display text-xl tracking-tight text-foreground">Voice pace</h2>
            <Slider
              surface={surface}
              steps={PACE_STEPS}
              value={paceIdx}
              onChange={choosePace}
              label="Voice pace"
            />
          </section>
        </div>
      </div>
    </PhoneFrame>
  );
}
