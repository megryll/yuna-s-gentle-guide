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
    // Jin — warm, casual male with a subtle Taiwanese accent
    elevenlabsId: "vZZLclMx4wouUtKBRfZn",
    sampleText: "Hello. Take your time. I'll be right here when you want to talk.",
  },
  arun: {
    id: "arun",
    // Daniel — articulate British male, professional warmth
    elevenlabsId: "onwK4e9ZLuTAKqWW03F9",
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
