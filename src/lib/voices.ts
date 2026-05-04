// Voice config — one entry per avatar variant. Each voice maps to an
// ElevenLabs premade voice ID; the ID list below is shipped with every
// ElevenLabs account (including free tier). Gender of the ElevenLabs voice
// matches the avatar (female/male/abstract → any).

import { AVATAR_VARIANTS, type AvatarVariant } from "@/components/YunaAvatar";

export type VoiceId = AvatarVariant;

export const VOICE_IDS: VoiceId[] = AVATAR_VARIANTS;

export type VoiceConfig = {
  id: VoiceId;
  elevenlabsId: string;
  sampleText: string;
};

const SAMPLE = "Hi, I'm here to listen, whenever you're ready.";

export const VOICES: Record<VoiceId, VoiceConfig> = {
  // ── Photoreal women ────────────────────────────────────────────────────────
  iris: {
    id: "iris",
    // Rachel — calm, mature American female (warm, unhurried narrative tone)
    elevenlabsId: "21m00Tcm4TlvDq8ikWAM",
    sampleText: SAMPLE,
  },
  mei: {
    id: "mei",
    // Sarah — soft American young adult female, thoughtful
    elevenlabsId: "EXAVITQu4vr4xnSDxMaL",
    sampleText: "Hello — take your time. I'll be right here when you want to talk.",
  },
  // ── Photoreal men ──────────────────────────────────────────────────────────
  marcus: {
    id: "marcus",
    // Brian — mature American male, deep, resonant
    elevenlabsId: "nPczCjzI2devNBz1zQrb",
    sampleText: "Hey. Whatever's on your mind — I've got space for it.",
  },
  arun: {
    id: "arun",
    // Daniel — articulate British male, professional warmth
    elevenlabsId: "onwK4e9ZLuTAKqWW03F9",
    sampleText: "Hi there. There's no right place to begin — just start where you are.",
  },
  // ── Illustrated women ──────────────────────────────────────────────────────
  rosa: {
    id: "rosa",
    // Lily — warm young female, expressive
    elevenlabsId: "pFZP5JQG7iQjIQuC4Bku",
    sampleText: "Hey, I'm so glad you're here. Let's settle in for a moment.",
  },
  sage: {
    id: "sage",
    // Matilda — articulate American female, supportive
    elevenlabsId: "XrExE9yKIg1WjnnlVkGX",
    sampleText: "Hi, I'm listening. Take whatever time you need.",
  },
  // ── Illustrated men ────────────────────────────────────────────────────────
  theo: {
    id: "theo",
    // Eric — friendly American male, approachable
    elevenlabsId: "cjVigY5qzO86Huf0OWal",
    sampleText: "Hey, what's going on today? I'm right here.",
  },
  felix: {
    id: "felix",
    // Will — youthful, easy-going American male (reads as smart teenage boy)
    elevenlabsId: "bIHbv24MWmeRgasZH58o",
    sampleText: "Hey there. Whatever's on your mind, I'm all ears.",
  },
  // ── Abstract (any voice) ───────────────────────────────────────────────────
  aura: {
    id: "aura",
    // Charlotte — soft, mysterious female
    elevenlabsId: "XB0fDUnXU5powFXDhCwa",
    sampleText: "I'm here. Let's breathe through whatever you're carrying.",
  },
  ember: {
    id: "ember",
    // George — mature British male, warm
    elevenlabsId: "JBFqnCBsd6RMkjVDRZzb",
    sampleText: "Hello. Take a breath. I'm right here whenever you're ready.",
  },
  tide: {
    id: "tide",
    // River — calming non-binary American
    elevenlabsId: "SAz9YHcvj6GT2YYXdXww",
    sampleText: "Hey. Ease in — there's no rush at all.",
  },
  cloud: {
    id: "cloud",
    // Alice — soft, articulate female
    elevenlabsId: "Xb7hH8MSUJpSbSDYk0k2",
    sampleText: "Hi. Let's land softly into the next moment together.",
  },
};

export function voiceById(id: VoiceId): VoiceConfig {
  return VOICES[id];
}
