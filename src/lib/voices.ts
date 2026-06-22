// Voice config — one entry per avatar variant. Each voice maps to an
// ElevenLabs voice ID (premade defaults plus a few voice-library picks). The
// gender/character of the ElevenLabs voice matches its photoreal avatar.

import { AVATAR_VARIANTS, type AvatarVariant } from "@/components/YunaAvatar";

export type VoiceId = AvatarVariant;

export const VOICE_IDS: VoiceId[] = AVATAR_VARIANTS;

// Shown when the user lands somewhere that needs a face/voice without having
// picked one (e.g. navigating straight to Home, skipping the intro). A
// photoreal, human-looking woman — not the brand mark. Matches the intro's
// index-0 pre-selection.
export const DEFAULT_VOICE: VoiceId = "maya";

export type VoiceConfig = {
  id: VoiceId;
  elevenlabsId: string;
  sampleText: string;
};

export const VOICES: Record<VoiceId, VoiceConfig> = {
  maya: {
    id: "maya",
    // ElevenLabs library voice — warm, grounded mature female
    elevenlabsId: "AIFDUhRnM6s61433WMNu",
    sampleText: "Hello. Whatever's on your mind, there's room for it here.",
  },
  kai: {
    id: "kai",
    // ElevenLabs library voice — warm, mature male; matches the older,
    // professorial avatar.
    elevenlabsId: "Ih5c9jfzl0g5jmK1Z2Nq",
    sampleText: "Hello. It's good to have you here. We can take this as slowly as you'd like.",
  },
  arun: {
    id: "arun",
    // ElevenLabs library voice — matches the articulate male avatar
    elevenlabsId: "hU1ickYwpgncnNFbbXQ1",
    sampleText: "Hi there. There's no right place to begin. Just start where you are.",
  },
  vivian: {
    id: "vivian",
    // ElevenLabs library voice — poised, elegant mature female
    elevenlabsId: "2qQJWjw5XdG80GreshqG",
    sampleText: "Hello. I'm so glad you're here. Whenever you're ready, we'll begin.",
  },
};

export function voiceById(id: VoiceId): VoiceConfig {
  return VOICES[id];
}
