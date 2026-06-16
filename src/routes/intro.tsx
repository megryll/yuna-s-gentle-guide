import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  ChevronDown,
  Gauge,
  Globe,
  ScanFace,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { LeafSpinner } from "@/components/LeafSpinner";
import { KEYBOARD_HEIGHT } from "@/components/KeyboardSimulator";
import { Button } from "@/components/Button";
import { ChatBubble } from "@/components/ChatBubble";
import { Switch } from "@/components/Switch";
import { TextField } from "@/components/TextField";
import { getVoice, setName as saveName, setVoice, useYunaIdentity } from "@/lib/yuna-session";
import { VOICES, VOICE_IDS, type VoiceId } from "@/lib/voices";
import { avatarSrc } from "@/components/YunaAvatar";
import { setUserType } from "@/lib/user-type";
import { setAppMode, useDarkBlurImage } from "@/lib/theme-prefs";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { playYunaBubbleSound, playUserSendSound } from "@/lib/bubble-sound";
import {
  ChoiceList,
  DEFAULT_PACE_IDX,
  IntroVoicePicker,
  LANGUAGE_OPTIONS,
  PACE_STEPS,
} from "@/components/yuna-settings-shared";
import { Slider } from "@/components/Slider";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AMBIENT_VOLUME,
  fadeAmbientTo,
  pauseAmbient,
  startAmbient,
} from "@/lib/ambient-audio";

export const Route = createFileRoute("/intro")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { step?: number; branch?: "tellMeMore" } => {
    const raw = s.step;
    const n =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number(raw)
          : NaN;
    const branch = s.branch === "tellMeMore" ? ("tellMeMore" as const) : undefined;
    return {
      ...(Number.isFinite(n) ? { step: n } : {}),
      ...(branch ? { branch } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Meet Yuna" },
      { name: "description", content: "A short introduction from Yuna." },
    ],
  }),
  component: Intro,
});

type Card =
  | { kind: "harvard" }
  | { kind: "stats" }
  | { kind: "mood-stats" }
  | { kind: "privacy" }
  | { kind: "push-preview" }
  | { kind: "faceid" };

const FaceIdCtx = createContext<{ on: boolean; request: (next: boolean) => void }>({
  on: false,
  request: () => {},
});

type BubbleData = {
  id: string;
  from: "yuna" | "you";
  text: string;
  card?: Card;
};

type Phase = "reveal" | "wait-input" | "wait-tap";

const TOTAL_STEPS = 6;
const TYPING_MS = 1100;
const INTRO_SECOND_TYPING_MS = 1800;
const INTRO_LONG_TYPING_MS = 1700;
const POST_BUBBLE_GAP_MS = 350;
const INTRO_BETWEEN_BUBBLES_MS = 700;
const FIRST_STEP_AVATAR_DELAY_MS = 400;
const SUBSEQUENT_STEP_DELAY_MS = 300;
const POST_NAME_DELAY_MS = 500;

const REACTION_AMAZING = {
  userText: "Tell me more about Yuna \u{1F440}",
  yunaReply:
    "I'm trained in proven therapy methods. I can help you notice unhelpful thoughts, work through emotions, and live by what matters most to you.",
};
// Stress check-in options offered after the mood-stats card. Replies are
// tiered by intensity so a low-stress choice doesn't get an "I'm sorry"
// acknowledgement that would land wrong.
const STRESS_REPLY_HIGH =
  "I'm sorry to hear that. It's a great thing you're here then.\n\nI'll wrap this up quick so we can talk about that.";
const STRESS_REPLY_MED =
  "Thanks for sharing.\n\nI'll wrap this up quick so we can dig into it together.";
const STRESS_REPLY_LOW =
  "Glad to hear it.\n\nI'll wrap this up quick so we can get started.";

const STRESS_OPTIONS: { label: string; reply: string }[] = [
  { label: "\u{1F616} Barely hanging in", reply: STRESS_REPLY_HIGH },
  { label: "\u{1F61F} Stressed out", reply: STRESS_REPLY_HIGH },
  { label: "\u{1F610} Some stress", reply: STRESS_REPLY_MED },
  { label: "\u{1F642} Feeling pretty good", reply: STRESS_REPLY_LOW },
];

const initialRevealsForStep = (
  stepIdx: number,
): { text: string; card?: Card }[] => {
  if (stepIdx === 0) {
    return [
      { text: "Hi, great job showing up for yourself today." },
      { text: "Before we continue, what should I call you?" },
    ];
  }
  if (stepIdx === 1) {
    return [
      {
        text: "Let me introduce myself too. I was created by psychologists from leading U.S. universities.",
        card: { kind: "harvard" },
      },
      {
        text: "Our mission is to help people find support and better mental well-being.",
        card: { kind: "stats" },
      },
    ];
  }
  if (stepIdx === 2) {
    return [
      {
        text: "I'll check in once in a while, want to set up notifications?",
        card: { kind: "push-preview" },
      },
    ];
  }
  if (stepIdx === 3) {
    return [
      {
        text: "Did you know: 70% of people feel better after just one session.",
        card: { kind: "mood-stats" },
      },
      { text: "On that note, how's your stress today?" },
    ];
  }
  if (stepIdx === 4) {
    return [{ text: "What would you like me to sound like?" }];
  }
  return [
    {
      text: "Everything you share stays between us, guaranteed.",
      card: { kind: "privacy" },
    },
    {
      text: "Want to enable FaceID so only you can open the app?",
      card: { kind: "faceid" },
    },
  ];
};

const ctaLabelForStep = (stepIdx: number): string => {
  // Onboarding uses "Continue" throughout — "Next" is reserved for explicit
  // survey pagination, which this conversational intro isn't. The voice pick
  // keeps its own action label.
  if (stepIdx === 4) return "Choose this voice";
  return "Continue";
};

let bubbleIdSeq = 0;
const newBubbleId = () => `b${++bubbleIdSeq}`;

function Intro() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const darkBg = useDarkBlurImage();
  const clampStep = (n: number) =>
    Math.max(0, Math.min(TOTAL_STEPS - 1, Math.floor(n)));
  const [stepIdx, setStepIdx] = useState(
    search.step !== undefined ? clampStep(search.step) : 0,
  );

  useEffect(() => {
    if (search.step !== undefined) {
      setStepIdx(clampStep(search.step));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.step]);
  const [bubbles, setBubbles] = useState<BubbleData[]>(() => {
    // Deep-link: ?branch=tellMeMore pre-populates the chat with the
    // "Tell me more about Yuna" exchange so the sidebar entry lands on
    // the reveal state instead of just the empty step.
    if (search.branch === "tellMeMore") {
      return [
        { id: newBubbleId(), from: "you", text: REACTION_AMAZING.userText },
        { id: newBubbleId(), from: "yuna", text: REACTION_AMAZING.yunaReply },
      ];
    }
    return [];
  });
  const [typing, setTyping] = useState(false);
  const [phase, setPhase] = useState<Phase>("reveal");
  const [nameInput, setNameInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voiceIdx, setVoiceIdx] = useState(0);
  // Tracks whether the user has explicitly tapped a card in the voice
  // carousel. Until then the welcome cluster shows the default Yuna avatar,
  // regardless of any stale voice/avatar left in localStorage from a prior
  // run. Once true, the picked voice's photo takes over everywhere.
  const [voicePicked, setVoicePicked] = useState(false);
  const [voicePlayingIdx, setVoicePlayingIdx] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [faceIdOn, setFaceIdOn] = useState(false);
  const [faceIdModalOpen, setFaceIdModalOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceCacheRef = useRef<Map<VoiceId, string>>(new Map());
  // Monotonically increases on every play/stop so an in-flight fetch or a
  // pending el.play() promise can detect that it's stale and bail out.
  const voicePlayGenRef = useRef(0);
  const mutedRef = useRef(muted);

  // ── Post-voice-pick TTS playback ────────────────────────────────────────
  // After the user confirms a voice in step 4, every new Yuna bubble gets
  // explicitly enqueued via enqueueSpeak at the point it's added to the
  // chat. A simple promise queue serializes playback so bubble 1 finishes
  // before bubble 2 starts.
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsCacheRef = useRef<Map<string, string>>(new Map());
  const ttsQueueRef = useRef<Promise<void>>(Promise.resolve());
  const ttsPlayGenRef = useRef(0);
  // Set true by fadeOutIntroTts on the intro→home handoff. Without this,
  // killing the playing element via removeAttribute("src") + load() fires
  // an `error` that resolves speakYunaLine's promise, the queue advances,
  // and the next queued bubble (e.g. the FaceID line after privacy) plays
  // right on top of /home's welcome. speakYunaLine bails at the top when
  // draining, so the rest of the queue drops silently.
  const drainingRef = useRef(false);

  // Keyboard height plus a gap so the focused name field clears the keyboard
  // with a little breathing room instead of sitting flush against it.
  const KEYBOARD_OFFSET = KEYBOARD_HEIGHT + 20;

  // Keep a ref of `muted` for setTimeout-scheduled callbacks (closure freshness)
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const playBubblePop = () => {
    playYunaBubbleSound({ muted: mutedRef.current });
  };

  const playSendPop = () => {
    playUserSendSound({ muted: mutedRef.current });
  };

  const stopVoicePreview = () => {
    voicePlayGenRef.current++;
    const el = voiceAudioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    if (!mutedRef.current) fadeAmbientTo(AMBIENT_VOLUME, 350);
  };

  const playVoicePreview = async (idx: number) => {
    const id = VOICE_IDS[idx];
    if (!id) return;
    const cfg = VOICES[id];
    const gen = ++voicePlayGenRef.current;

    // Duck the forest bed immediately on tap so even a slow fetch doesn't
    // make the user think nothing is happening — and so the voice has air.
    if (!mutedRef.current) fadeAmbientTo(0.04, 250);

    // Tear down the prior preview element entirely. Reusing the same audio
    // element across plays leaves it in `ended` state after the first finish,
    // and Chrome occasionally swallows the next play() as a no-op even after
    // resetting src + currentTime. A fresh Audio per preview is cheap and
    // avoids the whole class of bugs.
    const prior = voiceAudioRef.current;
    if (prior) {
      prior.onended = null;
      prior.pause();
      prior.removeAttribute("src");
      prior.load();
    }

    const el = new Audio();
    voiceAudioRef.current = el;
    el.volume = 1;

    try {
      let blobUrl = voiceCacheRef.current.get(id);
      if (!blobUrl) {
        blobUrl = await fetchTtsBlobUrl(cfg.elevenlabsId, cfg.sampleText);
        voiceCacheRef.current.set(id, blobUrl);
      }
      if (gen !== voicePlayGenRef.current) return;

      el.onended = () => {
        if (gen !== voicePlayGenRef.current) return;
        setVoicePlayingIdx((p) => (p === idx ? null : p));
        if (!mutedRef.current) fadeAmbientTo(AMBIENT_VOLUME, 600);
      };
      el.src = blobUrl;
      el.currentTime = 0;
      await el.play();
    } catch (err) {
      // AbortError fires when src is reassigned mid-play; that's expected on
      // rapid card switches and shouldn't wipe the freshly-set playing index.
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (gen !== voicePlayGenRef.current) return;
      console.error("Voice preview failed", err);
      setVoicePlayingIdx(null);
      if (!mutedRef.current) fadeAmbientTo(AMBIENT_VOLUME, 350);
    }
  };

  const speakYunaLine = async (text: string): Promise<void> => {
    if (drainingRef.current) return;
    if (mutedRef.current) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const voiceId = getVoice();
    if (!voiceId) return;
    const cfg = VOICES[voiceId];

    const gen = ++ttsPlayGenRef.current;
    const prior = ttsAudioRef.current;
    if (prior) {
      prior.onended = null;
      prior.onerror = null;
      prior.onplaying = null;
      prior.pause();
      prior.removeAttribute("src");
      prior.load();
    }
    const el = new Audio();
    ttsAudioRef.current = el;
    el.volume = 1;

    try {
      const cacheKey = `${voiceId}:${trimmed}`;
      let blobUrl = ttsCacheRef.current.get(cacheKey);
      if (!blobUrl) {
        blobUrl = await fetchTtsBlobUrl(cfg.elevenlabsId, trimmed);
        ttsCacheRef.current.set(cacheKey, blobUrl);
      }
      if (gen !== ttsPlayGenRef.current) return;
      if (mutedRef.current) return;
      fadeAmbientTo(0.04, 250);
      el.src = blobUrl;
      el.currentTime = 0;
      await new Promise<void>((resolve) => {
        const done = () => {
          el.onended = null;
          el.onerror = null;
          resolve();
        };
        el.onended = done;
        el.onerror = done;
        el.play().catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") {
            done();
            return;
          }
          console.error("Intro TTS play failed", err);
          done();
        });
      });
    } catch (err) {
      console.error("Intro TTS fetch failed", err);
    } finally {
      if (gen === ttsPlayGenRef.current && !mutedRef.current) {
        fadeAmbientTo(AMBIENT_VOLUME, 600);
      }
    }
  };

  const enqueueSpeak = (text: string) => {
    ttsQueueRef.current = ttsQueueRef.current
      .then(() => speakYunaLine(text))
      .catch(() => {});
  };

  // Fade the in-flight intro TTS to silent, then tear it down. Used on the
  // intro→home handoff so the last bubble's voice doesn't talk over the
  // welcome line that plays as soon as /home mounts. Bumping ttsPlayGenRef
  // also invalidates any queued speakYunaLine still waiting on its fetch.
  const fadeOutIntroTts = (ms: number) => {
    drainingRef.current = true;
    ttsPlayGenRef.current++;
    // Bumping the gen above invalidates any in-flight speakYunaLine's
    // restore-fade in its finally block. Without this the bed would arrive
    // at /home ducked to ~0.04 and the user would hear silence.
    if (!mutedRef.current) fadeAmbientTo(AMBIENT_VOLUME, ms);
    const el = ttsAudioRef.current;
    if (!el || el.paused) return;
    const startVol = el.volume;
    const startT = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - startT) / ms, 1);
      el.volume = Math.max(0, startVol * (1 - p));
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        el.onended = null;
        el.onerror = null;
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
    };
    requestAnimationFrame(tick);
  };

  // Forest ambient lives in a module singleton (src/lib/ambient-audio.ts) so
  // it survives the intro→home transition. Mute toggles pause/resume the
  // singleton; we deliberately do NOT pause on unmount so the bed keeps
  // playing once the user lands on /home.
  useEffect(() => {
    if (muted) {
      pauseAmbient();
      // Also cut off any in-flight Yuna TTS playback so muting silences her
      // mid-sentence, not just the ambient bed.
      ttsPlayGenRef.current++;
      const el = ttsAudioRef.current;
      if (el) {
        el.onended = null;
        el.onerror = null;
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
      return;
    }
    startAmbient();
  }, [muted]);

  // On step change: append the new Yuna reveals onto the existing chat.
  // Bubbles persist across steps so the whole conversation stays visible
  // and scrollable like a messaging app.
  useEffect(() => {
    setTyping(false);
    setPhase("reveal");
    setPushModalOpen(false);

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const reveals = initialRevealsForStep(stepIdx);

    let cursor =
      stepIdx === 0 ? FIRST_STEP_AVATAR_DELAY_MS : SUBSEQUENT_STEP_DELAY_MS;

    for (let i = 0; i < reveals.length; i++) {
      const reveal = reveals[i];
      const typingDuration =
        stepIdx === 0 && i === 1
          ? INTRO_SECOND_TYPING_MS
          : stepIdx === 1
            ? INTRO_LONG_TYPING_MS
            : TYPING_MS;
      const showTypingAt = cursor;
      const showBubbleAt = cursor + typingDuration;

      timers.push(
        setTimeout(() => {
          if (!cancelled) setTyping(true);
        }, showTypingAt),
      );
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setTyping(false);
          playBubblePop();
          setBubbles((prev) => [
            ...prev,
            {
              id: newBubbleId(),
              from: "yuna",
              text: reveal.text,
              card: reveal.card,
            },
          ]);
          // Voice is locked in by step 5 — speak every reveal beyond that
          // so the privacy + Face ID bubbles read aloud like "Great choice!"
          // does. Step 4 and below stay silent (no voice picked yet).
          if (stepIdx >= 5) enqueueSpeak(reveal.text);
        }, showBubbleAt),
      );
      const isLast = i === reveals.length - 1;
      const gap = !isLast ? INTRO_BETWEEN_BUBBLES_MS : POST_BUBBLE_GAP_MS;
      cursor = showBubbleAt + gap;
    }

    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setPhase(stepIdx === 0 ? "wait-input" : "wait-tap");
      }, cursor),
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [stepIdx]);

  // Auto-focus name input when wait-input begins — triggers the keyboard shift
  useEffect(() => {
    if (phase !== "wait-input") return;
    const t = setTimeout(() => nameInputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [phase]);

  // Auto-scroll the chat to the latest bubble (or typing indicator) so the
  // most recent reveal is always in view as the conversation accumulates.
  // Also fires when step 4 reaches its tap phase so the inline voice picker
  // — which renders after the last bubble — scrolls into view.
  // `inputFocused` is a dep so that when the keyboard opens and the scroll's
  // paddingBottom grows to KEYBOARD_OFFSET, we re-scroll and lift the name form
  // to the keyboard's top edge — without this the form stays hidden behind the
  // keyboard on short devices (iPhone SE).
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    // The paddingBottom transition (200ms) grows the scroll area over time, so
    // the scrollHeight read above is stale at the start of the transition and
    // the first scroll lands short. Re-anchor after it settles so the form
    // clears the keyboard fully. Mirrors the chat screen's keyboard re-anchor.
    const t = window.setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 240);
    return () => window.clearTimeout(t);
  }, [bubbles, typing, stepIdx, phase, inputFocused]);

  // Enter advances the Continue CTA on every step where it's the active
  // action. Step 0 lives in "wait-input" with a name form that handles
  // Enter natively, so this effect doesn't bind there. We also bow out if
  // an editable element has focus, so typing Enter inside a form control
  // never trips a navigation.
  useEffect(() => {
    if (phase !== "wait-tap" || transitioning) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      if (stepIdx === 1) {
        submitChatReaction(
          REACTION_AMAZING.userText,
          REACTION_AMAZING.yunaReply,
        );
        return;
      }
      if (stepIdx === 2) {
        // Two-button choice step — let the user click explicitly.
        return;
      }
      if (stepIdx === 3) {
        // Multi-option stress check — let the user click explicitly.
        return;
      }
      if (stepIdx === 4) {
        submitVoiceChoice();
        return;
      }
      advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, transitioning, stepIdx, voiceIdx]);

  const submitName = (e: React.FormEvent) => {
    e.preventDefault();
    const value = nameInput.trim();
    if (!value) return;
    saveName(value);
    setNameInput("");
    nameInputRef.current?.blur();
    setInputFocused(false);

    // Append the user's name as a sent bubble
    playSendPop();
    setBubbles((prev) => [
      ...prev,
      { id: newBubbleId(), from: "you", text: value },
    ]);

    // Pause the CTA, then play Yuna's response, then advance immediately.
    setPhase("reveal");

    const t1 = setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    const t2 = setTimeout(() => {
      setTyping(false);
      playBubblePop();
      setBubbles((prev) => [
        ...prev,
        {
          id: newBubbleId(),
          from: "yuna",
          text: `It's great to meet you, ${value}!`,
        },
      ]);
      goToStep(1);
    }, POST_NAME_DELAY_MS + TYPING_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  };

  const goToStep = (idx: number) => {
    navigate({ to: "/intro", search: { step: idx }, replace: true });
  };

  const submitChatReaction = (userText: string, yunaReply: string) => {
    playSendPop();
    setBubbles((prev) => [
      ...prev,
      { id: newBubbleId(), from: "you", text: userText },
    ]);
    setPhase("reveal");

    setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    setTimeout(() => {
      setTyping(false);
      playBubblePop();
      setBubbles((prev) => [
        ...prev,
        { id: newBubbleId(), from: "yuna", text: yunaReply },
      ]);
      goToStep(stepIdx + 1);
    }, POST_NAME_DELAY_MS + TYPING_MS);
  };

  const submitSkipToSetup = () => {
    setPhase("reveal");
    playSendPop();
    setBubbles((prev) => [
      ...prev,
      { id: newBubbleId(), from: "you", text: "Skip to Setup" },
    ]);

    setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    setTimeout(() => {
      setTyping(false);
      playBubblePop();
      setBubbles((prev) => [
        ...prev,
        {
          id: newBubbleId(),
          from: "yuna",
          text: "Setup it is!",
        },
      ]);
      goToStep(2);
    }, POST_NAME_DELAY_MS + TYPING_MS);
  };

  const submitNotificationChoice = (wantsPush: boolean, label: string) => {
    if (wantsPush) {
      // Leave the CTA row visible behind the iOS-style modal — the buttons
      // only hide once the user dismisses the modal with Allow / Don't Allow.
      setPushModalOpen(true);
      return;
    }

    // "Maybe later" path — hide the CTAs and show the user bubble immediately.
    setPhase("reveal");
    playSendPop();
    setBubbles((prev) => [
      ...prev,
      { id: newBubbleId(), from: "you", text: label },
    ]);

    setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    setTimeout(() => {
      setTyping(false);
      playBubblePop();
      setBubbles((prev) => [
        ...prev,
        {
          id: newBubbleId(),
          from: "yuna",
          text: "No worries, you can always change this later.",
        },
      ]);
      goToStep(stepIdx + 1);
    }, POST_NAME_DELAY_MS + TYPING_MS);
  };

  const dismissPushModal = (allowed: boolean) => {
    setPushModalOpen(false);
    setPhase("reveal");

    const userText = allowed ? "✓ They’re set up" : "⏳ Skipped them for now";
    const yunaReply = allowed
      ? "Love it. I’ll keep them light."
      : "No worries, you can always change this later.";

    playSendPop();
    setBubbles((prev) => [
      ...prev,
      { id: newBubbleId(), from: "you", text: userText },
    ]);

    setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    setTimeout(() => {
      setTyping(false);
      playBubblePop();
      setBubbles((prev) => [
        ...prev,
        { id: newBubbleId(), from: "yuna", text: yunaReply },
      ]);
      goToStep(stepIdx + 1);
    }, POST_NAME_DELAY_MS + TYPING_MS);
  };

  const submitVoiceChoice = () => {
    // Persist whichever card the user landed on, even if they never tapped
    // to change the default, and tear down any in-flight preview.
    const id = VOICE_IDS[voiceIdx];
    if (id) setVoice(id);
    stopVoicePreview();
    playSendPop();
    setBubbles((prev) => [
      ...prev,
      { id: newBubbleId(), from: "you", text: "I chose one" },
    ]);
    // Hide the picker + CTA so the screen lands on the sent bubble before
    // Yuna's acknowledgement reveals and the privacy step begins.
    setPhase("reveal");
    setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    setTimeout(() => {
      setTyping(false);
      playBubblePop();
      const ackText = "Great choice! Last couple of things…";
      setBubbles((prev) => [
        ...prev,
        { id: newBubbleId(), from: "yuna", text: ackText },
      ]);
      enqueueSpeak(ackText);
      goToStep(stepIdx + 1);
    }, POST_NAME_DELAY_MS + TYPING_MS);
  };

  const advance = () => {
    if (stepIdx < TOTAL_STEPS - 1) {
      goToStep(stepIdx + 1);
      return;
    }
    // Final step (privacy) — fade out and head to /home as a new user.
    // The app always boots into dark mode after onboarding so first-run
    // users land on the dark photo cluster regardless of any stale
    // light-mode preference left over from a prior session.
    // Fade the previous bubble's TTS so it doesn't talk over /home's
    // welcome line. The 600ms fade lands well inside the 1400ms transition
    // overlay, so the user just hears silence before "Welcome in.".
    fadeOutIntroTts(600);
    setUserType("new");
    setAppMode("dark");
    setTransitioning(true);
    // Hand off the welcome-line cue to HomeScreen via sessionStorage so
    // each completed intro plays the spoken greeting exactly once on the
    // next /home mount — independent of any module-level state that may
    // have been tripped by earlier dev navigation.
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("yuna.welcome-pending", "1");
    }
    setTimeout(() => {
      navigate({ to: "/home" });
    }, 1400);
  };

  const faceIdRequest = (next: boolean) => {
    if (next) setFaceIdModalOpen(true);
    else setFaceIdOn(false);
  };

  return (
    <FaceIdCtx.Provider value={{ on: faceIdOn, request: faceIdRequest }}>
    <PhoneFrame backgroundImage={darkBg}>
      {transitioning && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 yuna-fade-in"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.42)), url(${darkBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-live="polite"
          aria-label="Creating Your Space"
        >
          <LeafSpinner size={64} surface="dark" />
          <p className="text-white/95 text-sm tracking-[0.04em]">
            Creating Your Space
          </p>
        </div>
      )}
      {pushModalOpen && (
        <PushPermissionModal
          onAllow={() => dismissPushModal(true)}
          onDeny={() => dismissPushModal(false)}
        />
      )}
      {faceIdModalOpen && (
        <FaceIdPermissionModal
          onAllow={() => {
            setFaceIdOn(true);
            setFaceIdModalOpen(false);
          }}
          onDeny={() => setFaceIdModalOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col text-white min-h-0 relative">
        {/* Mute button — absolutely positioned at the top-right so the chat
            scroll container can extend up to the same row, letting the
            sticky avatar lock into the header line beside the mute icon
            once the conversation grows past its initial layout. */}
        <div className="absolute top-14 right-8 z-30">
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            pressed={muted}
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute Yuna's voice" : "Mute Yuna's voice"}
          >
            {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
          </Button>
        </div>

        {/* Body — persistent chat: avatar + bubbles scroll together in one
            container so the conversation reads as a single flow. The voice
            picker is nested inline at step 4. Action area below holds the
            CTA / form. The scroll container owns the horizontal padding so
            the carousel can break out to the phone edges via -mx-8 without
            being clipped by an outer px-8. */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Persistent scrolling chat — avatar is sticky at the mute-button
              row so it starts at its initial position below the header,
              drifts up with the conversation as the user scrolls, then locks
              alongside the mute icon while bubbles flow underneath it.
              Scrollbar is hidden. The scroll fills the full body so there's
              no static strip below it — bottom breathing room lives inside
              via paddingBottom, which expands when the keyboard opens. */}
          <div
            ref={chatScrollRef}
            className="flex-1 w-full flex flex-col gap-3 min-h-0 px-8 overflow-y-auto overflow-x-clip [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              transition: "padding 200ms ease-out",
              paddingBottom: inputFocused
                ? KEYBOARD_OFFSET
                : phase === "reveal"
                  ? 140
                  : 40,
            }}
          >
            {/* Blur fade overlay — sticks at the top of the scroll port and
                softens bubbles passing beneath the avatar/mute cluster. The
                mask gradient dissolves the blur into the photo background
                so there's no hard clipping edge. Negative margin + gap math
                makes it contribute zero vertical space to flow. */}
            <div
              className="sticky top-0 -mx-8 -mb-[172px] shrink-0 pointer-events-none z-[5]"
              aria-hidden
              style={{
                height: 160,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                maskImage:
                  "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
              }}
            />
            {/* Spacer pushes the avatar's initial position below the mute
                button row. Kept as a real flex item (not padding) so the
                sticky avatar's `top` measures from the scroll port edge,
                letting it lock exactly alongside the mute button. */}
            <div
              className="shrink-0"
              aria-hidden
              style={{ height: stepIdx === 4 ? 60 : 180 }}
            />
            <div className="sticky top-[46px] z-10 flex items-center gap-3 mb-3 pointer-events-none">
              <YunaAvatarLarge
                usePhoto={stepIdx >= 4}
                variant={
                  stepIdx === 4 && !voicePicked ? VOICE_IDS[0] : undefined
                }
              />
            </div>
            {bubbles.map((b) => (
              <Bubble key={b.id} bubble={b} frostedImage={darkBg} />
            ))}
            {typing && <TypingBubble frostedImage={darkBg} />}
            {stepIdx === 4 && phase === "wait-tap" && (
              <div className="yuna-rise -mx-8 mt-1">
                <VoicePicker
                  selectedIdx={voiceIdx}
                  onSelect={(i) => {
                    setVoiceIdx(i);
                    setVoicePicked(true);
                    const id = VOICE_IDS[i];
                    if (id) setVoice(id);
                    setVoicePlayingIdx(null);
                    stopVoicePreview();
                  }}
                  playingIdx={voicePlayingIdx}
                  onTogglePlay={(i) => {
                    const turningOff = voicePlayingIdx === i;
                    setVoicePlayingIdx(turningOff ? null : i);
                    if (turningOff) {
                      stopVoicePreview();
                    } else {
                      void playVoicePreview(i);
                    }
                  }}
                />
              </div>
            )}
            {/* CTA / form lives at the tail of the conversation so it reads
                as part of the same flow — no separate footer container that
                would visually mask the bubbles above it. Keyboard offset is
                handled by the scroll's own paddingBottom, which lifts this
                item above the keyboard once auto-scroll lands. */}
            {phase === "wait-input" && (
              <div className="yuna-rise mt-5 shrink-0">
                <NameForm
                  inputRef={nameInputRef}
                  value={nameInput}
                  onChange={setNameInput}
                  onSubmit={submitName}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                />
              </div>
            )}
            {phase === "wait-tap" && (
              <div className="yuna-rise mt-5 shrink-0">
                {stepIdx === 1 ? (
                  <div className="flex flex-col gap-2.5">
                    <Button
                      surface="dark"
                      variant="primary"
                      fullWidth
                      onClick={() =>
                        submitChatReaction(
                          REACTION_AMAZING.userText,
                          REACTION_AMAZING.yunaReply,
                        )
                      }
                    >
                      Tell me more about Yuna {"\u{1F440}"}
                    </Button>
                    <Button
                      surface="dark"
                      variant="secondary"
                      fullWidth
                      onClick={submitSkipToSetup}
                    >
                      Skip to Setup
                    </Button>
                  </div>
                ) : stepIdx === 3 ? (
                  <div className="flex flex-col gap-2.5">
                    {STRESS_OPTIONS.map((o) => (
                      <Button
                        key={o.label}
                        surface="dark"
                        variant="secondary"
                        fullWidth
                        onClick={() => submitChatReaction(o.label, o.reply)}
                      >
                        {o.label}
                      </Button>
                    ))}
                  </div>
                ) : stepIdx === 2 ? (
                  <div className="flex flex-col gap-2.5">
                    <Button
                      surface="dark"
                      variant="primary"
                      fullWidth
                      onClick={() =>
                        submitNotificationChoice(true, "✓ They’re set up")
                      }
                    >
                      Set them up {"\u{2728}"}
                    </Button>
                    <Button
                      surface="dark"
                      variant="secondary"
                      fullWidth
                      onClick={() =>
                        submitNotificationChoice(false, "⏳ Skipped them for now")
                      }
                    >
                      Maybe later
                    </Button>
                  </div>
                ) : stepIdx === 4 ? (
                  <Button
                    surface="dark"
                    variant="primary"
                    fullWidth
                    onClick={submitVoiceChoice}
                  >
                    {ctaLabelForStep(stepIdx)}
                  </Button>
                ) : stepIdx === 5 ? (
                  <Button
                    surface="dark"
                    variant="primary"
                    fullWidth
                    onClick={advance}
                  >
                    Let’s Start!
                  </Button>
                ) : (
                  <Button
                    surface="dark"
                    variant="primary"
                    fullWidth
                    onClick={advance}
                  >
                    {ctaLabelForStep(stepIdx)}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PhoneFrame>
    </FaceIdCtx.Provider>
  );
}

// ── Yuna avatar (welcome-screen sized halo cluster) ─────────────────────────

function YunaAvatarLarge({
  usePhoto = false,
  variant,
}: {
  usePhoto?: boolean;
  /** Explicit variant override — used by the Voice step to show the first
   *  voice's photo before the user has tapped a card, regardless of any
   *  stale session avatar. */
  variant?: VoiceId;
}) {
  const { avatar } = useYunaIdentity();
  const effective = variant ?? avatar;
  const showPhoto = usePhoto && !!effective;
  const src = showPhoto && effective ? avatarSrc(effective) : "/avatar.png";
  return (
    <div
      className="relative h-14 w-14 shrink-0"
      style={{
        animation:
          "intro-avatar-rise 700ms cubic-bezier(0.2,0.8,0.2,1) 0ms both",
      }}
    >
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
        style={{
          width: 220,
          height: 220,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.14) 28%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 70%)",
          animation: "glow-breathe 7.5s ease-in-out infinite",
          filter: "blur(2px)",
          transform: "translate(-50%, -50%)",
          willChange: "transform, opacity",
        }}
      />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
        style={{
          width: 160,
          height: 160,
          background:
            "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.28), rgba(255,255,255,0) 65%)",
          animation: "glow-drift 11s ease-in-out infinite",
          mixBlendMode: "screen",
          filter: "blur(6px)",
          transform: "translate(-50%, -50%)",
          willChange: "transform",
        }}
      />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
        style={{
          width: 64,
          height: 64,
          background:
            "conic-gradient(from 0deg, rgba(255,255,255,0.95), rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.95))",
          WebkitMask:
            "radial-gradient(circle, transparent 58%, #000 62%, #000 96%, transparent 100%)",
          mask: "radial-gradient(circle, transparent 58%, #000 62%, #000 96%, transparent 100%)",
          animation: "glow-spin 9s linear infinite",
          filter: "blur(1.5px)",
          transform: "translate(-50%, -50%)",
          willChange: "transform",
        }}
      />
      <img
        src={src}
        alt="Yuna avatar"
        className={
          "relative h-14 w-14 " + (showPhoto ? "rounded-full object-cover" : "")
        }
      />
    </div>
  );
}

// ── Bubbles ──────────────────────────────────────────────────────────────────

function Bubble({
  bubble,
  frostedImage,
}: {
  bubble: BubbleData;
  frostedImage?: string;
}) {
  const mine = bubble.from === "you";
  const card = bubble.card;
  // Privacy renders an inline link inside the text region, not a footer.
  const isPrivacy = card?.kind === "privacy";

  let attachment: React.ReactNode = undefined;
  if (card && !isPrivacy) {
    if (card.kind === "mood-stats") {
      attachment = (
        <div className="border-t border-white/15 bg-white">
          <Attachment kind={card.kind} />
        </div>
      );
    } else if (card.kind === "push-preview") {
      attachment = (
        <div className="border-t border-white/20 bg-white/5 px-3 py-3">
          <Attachment kind={card.kind} />
        </div>
      );
    } else {
      attachment = (
        <div className="border-t border-white/20 bg-white/10 px-4 py-3">
          <Attachment kind={card.kind} />
        </div>
      );
    }
  }

  return (
    <div
      className={
        "yuna-rise w-full flex " + (mine ? "justify-end" : "justify-start")
      }
    >
      <ChatBubble
        from={mine ? "user" : "yuna"}
        size="lg"
        frostedImage={mine ? undefined : frostedImage}
        attachment={attachment}
        className={mine ? "max-w-[85%]" : "max-w-[calc(85%+8px)]"}
      >
        {bubble.text}
        {isPrivacy && (
          <a
            href="https://yuna.io/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex w-fit items-center gap-1 text-white/85 underline underline-offset-2 decoration-white/50 text-base active:opacity-80 transition-opacity"
          >
            Read our Privacy Policy
            <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
          </a>
        )}
      </ChatBubble>
    </div>
  );
}

function TypingBubble({ frostedImage }: { frostedImage?: string }) {
  return (
    <div className="yuna-fade-in w-full flex justify-start">
      <ChatBubble from="yuna" typing frostedImage={frostedImage} />
    </div>
  );
}

// ── Name form ────────────────────────────────────────────────────────────────

function NameForm({
  inputRef,
  value,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 w-full">
      <TextField
        ref={inputRef}
        containerClassName="flex-1"
        surface="dark"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Enter your name"
        trailing={
          <Button
            surface="dark"
            variant="primary"
            size="icon-sm"
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Send"
            disabled={!value.trim()}
          >
            <ArrowUp strokeWidth={2} />
          </Button>
        }
      />
    </form>
  );
}

// ── Attachments ──────────────────────────────────────────────────────────────

function Attachment({ kind }: { kind: Card["kind"] }) {
  const { name } = useYunaIdentity();
  if (kind === "harvard") {
    return (
      <div className="flex items-center justify-center gap-2.5">
        <img src="/harvard.svg" alt="Harvard University" className="h-8 w-auto" />
        <span aria-hidden className="h-7 w-px bg-white/25" />
        <img src="/cornell.png" alt="Cornell University" className="h-5 w-auto" />
      </div>
    );
  }
  if (kind === "stats") {
    return (
      <img
        src="/app-store-rating.png"
        alt="Rated 5 stars on the App Store"
        className="w-full h-auto"
      />
    );
  }
  if (kind === "mood-stats") {
    const moodLine = "#5FA85C";
    const stressLine = "#A6D957";
    const moodPill = "#9CC36D";
    const stressPill = "#C5E97D";
    const pillText = "#1F3D1B";
    const grid = "rgba(31, 61, 27, 0.10)";
    const labelText = "rgba(31, 61, 27, 0.55)";
    // Used for the small outline ring on the pill endpoint dots — must
    // match the card surface so the dot reads as "punched into" the card.
    const surface = "#FFFFFF";

    return (
      <div className="px-4 py-4">
        <svg
          viewBox="0 0 320 180"
          className="w-full h-auto"
          aria-hidden="true"
        >
          <g stroke={grid} strokeWidth="1">
            <line x1="14" y1="30" x2="306" y2="30" />
            <line x1="14" y1="55" x2="306" y2="55" />
            <line x1="14" y1="80" x2="306" y2="80" />
            <line x1="14" y1="105" x2="306" y2="105" />
            <line x1="14" y1="130" x2="306" y2="130" />
          </g>

          <path
            d="M 24 105 C 80 105, 130 60, 216 40"
            stroke={moodLine}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="24" cy="105" r="4" fill={moodLine} />

          <path
            d="M 24 55 C 80 55, 130 100, 216 115"
            stroke={stressLine}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="24" cy="55" r="4" fill={stressLine} />

          <rect x="216" y="0" width="96" height="40" rx="10" fill={moodPill} />
          <text
            x="264"
            y="17"
            fontSize="13"
            fontWeight="700"
            fill={pillText}
            textAnchor="middle"
          >
            Improved
          </text>
          <text
            x="264"
            y="32"
            fontSize="13"
            fontWeight="700"
            fill={pillText}
            textAnchor="middle"
          >
            mood
          </text>
          <circle
            cx="216"
            cy="40"
            r="4"
            fill={moodPill}
            stroke={surface}
            strokeWidth="2"
          />

          <rect x="216" y="75" width="96" height="40" rx="10" fill={stressPill} />
          <text
            x="264"
            y="92"
            fontSize="13"
            fontWeight="700"
            fill={pillText}
            textAnchor="middle"
          >
            Reduced
          </text>
          <text
            x="264"
            y="107"
            fontSize="13"
            fontWeight="700"
            fill={pillText}
            textAnchor="middle"
          >
            stress
          </text>
          <circle
            cx="216"
            cy="115"
            r="4"
            fill={stressPill}
            stroke={surface}
            strokeWidth="2"
          />

          <g fontSize="11" fill={labelText}>
            <text x="24" y="160" textAnchor="start">
              Session Start
            </text>
            <text x="216" y="160" textAnchor="end">
              Session End
            </text>
          </g>
        </svg>
      </div>
    );
  }
  if (kind === "push-preview") {
    return (
      <div className="rounded-md bg-white/80 text-neutral-900 px-3 py-2.5 flex items-start gap-3">
        <div className="h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0 bg-secondary-green">
          <YunaPushMark />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-sans-ui text-sm font-semibold leading-tight truncate">
              Quick gut check
            </span>
            <span className="font-sans-ui text-uppercase text-neutral-500 shrink-0">
              5m ago
            </span>
          </div>
          <p className="text-sm leading-snug mt-0.5 text-neutral-800">
            How's tomorrow's meeting sitting with you{name ? `, ${name}` : ""}? If the spiral starts tonight, I'm right here.
          </p>
        </div>
      </div>
    );
  }
  if (kind === "faceid") {
    return <FaceIdToggle />;
  }
  return null;
}

function FaceIdToggle() {
  const { on, request } = useContext(FaceIdCtx);
  return (
    <div className="flex items-center gap-3 text-white">
      <ScanFace size={22} strokeWidth={1.75} aria-hidden className="shrink-0" />
      <span className="flex-1 min-w-0 text-base font-semibold leading-snug">
        Face ID
      </span>
      <Switch surface="dark" checked={on} onChange={request} label="Enable Face ID" />
    </div>
  );
}

function YunaPushMark() {
  // The isolated Yuna brand mark (the leaf glyph from the wordmark), white on
  // the green push tile. Lives in public/ so the engineer sidebar can offer it
  // as a download — keep the two in sync.
  return <img src="/yuna-mark.svg" alt="" aria-hidden className="h-[22px] w-[22px]" />;
}

// ── Voice picker ─────────────────────────────────────────────────────────────
// Picker carousel + card UI live in yuna-settings-shared so the Personalize
// drawer can use the same component. Intro adds the language/pace pills below.

function VoicePicker({
  selectedIdx,
  onSelect,
  playingIdx,
  onTogglePlay,
}: {
  selectedIdx: number;
  onSelect: (idx: number) => void;
  playingIdx: number | null;
  onTogglePlay: (idx: number) => void;
}) {
  const [paceIdx, setPaceIdx] = useState(DEFAULT_PACE_IDX);
  const [language, setLanguage] = useState("English");
  const [langOpen, setLangOpen] = useState(false);
  const [paceOpen, setPaceOpen] = useState(false);

  const languageLabel =
    LANGUAGE_OPTIONS.find((o) => o.id === language)?.label ?? language;

  return (
    <div className="flex flex-col gap-7">
      <IntroVoicePicker
        selectedIdx={selectedIdx}
        onSelect={onSelect}
        playingIdx={playingIdx}
        onTogglePlay={onTogglePlay}
        surface="dark"
      />
      <VoiceControlPills
        languageLabel={languageLabel}
        paceLabel={PACE_STEPS[paceIdx]}
        onOpenLanguage={() => setLangOpen(true)}
        onOpenPace={() => setPaceOpen(true)}
      />
      <LanguageDrawer
        open={langOpen}
        onOpenChange={setLangOpen}
        value={language}
        onChange={(v) => {
          setLanguage(v);
          setLangOpen(false);
        }}
      />
      <PaceDrawer
        open={paceOpen}
        onOpenChange={setPaceOpen}
        value={paceIdx}
        onChange={setPaceIdx}
      />
    </div>
  );
}

function VoiceControlPills({
  languageLabel,
  paceLabel,
  onOpenLanguage,
  onOpenPace,
}: {
  languageLabel: string;
  paceLabel: string;
  onOpenLanguage: () => void;
  onOpenPace: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 px-8">
      <ControlPill
        icon={<GlobePillIcon />}
        label="Language"
        value={languageLabel}
        onClick={onOpenLanguage}
      />
      <ControlPill
        icon={<SpeedPillIcon />}
        label="Pace"
        value={paceLabel}
        onClick={onOpenPace}
      />
    </div>
  );
}

function ControlPill({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <Button
      surface="dark"
      variant="secondary"
      size="xs"
      className="gap-1.5"
      onClick={onClick}
    >
      {icon}
      <span className="text-white/75">{label}</span>
      <span className="font-semibold text-white">{value}</span>
      <ChevronDown
        size={9}
        strokeWidth={1.5}
        aria-hidden="true"
        className="text-white/75"
      />
    </Button>
  );
}

function LanguageDrawer({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent mode="dark">
        <DrawerHeader className="text-left px-6 pt-3 pb-3">
          <DrawerTitle>
            Language
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-6 pb-10">
          <ChoiceList
            value={value}
            onChange={onChange}
            options={LANGUAGE_OPTIONS}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function PaceDrawer({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: number;
  onChange: (i: number) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent mode="dark">
        <DrawerHeader className="text-left px-6 pt-3 pb-3">
          <DrawerTitle>
            Voice pace
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-6 pb-10">
          <Slider
            surface="light"
            steps={PACE_STEPS}
            value={value}
            onChange={onChange}
            label="Voice pace"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function GlobePillIcon() {
  return (
    <Globe
      size={13}
      strokeWidth={1.2}
      aria-hidden="true"
      className="text-white/85"
    />
  );
}

function SpeedPillIcon() {
  return (
    <Gauge
      size={13}
      strokeWidth={1.2}
      aria-hidden="true"
      className="text-white/85"
    />
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────

function PushPermissionModal({
  onAllow,
  onDeny,
}: {
  onAllow: () => void;
  onDeny: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center px-10 bg-black/45 yuna-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="push-modal-title"
    >
      <div
        className="w-full max-w-[280px] rounded-[14px] overflow-hidden text-white"
        style={{
          backgroundColor: "rgba(40, 40, 44, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          animation:
            "welcome-rise 250ms cubic-bezier(0.2, 0.8, 0.2, 1) 0ms both",
        }}
      >
        <div className="px-5 pt-5 pb-4 text-center">
          <h3
            id="push-modal-title"
            className="font-sans-ui text-base font-semibold leading-snug"
          >
            &ldquo;Yuna&rdquo; Would Like to Send You Notifications
          </h3>
          <p className="mt-2 font-sans-ui text-xs text-white/75 leading-snug">
            Notifications may include alerts, sounds, and icon badges. These
            can be configured in Settings.
          </p>
        </div>
        <div className="border-t border-white/15 grid grid-cols-2">
          <button
            type="button"
            onClick={onDeny}
            className="px-3 py-2.5 font-sans-ui text-base text-white border-r border-white/15 active:bg-white/10"
          >
            Don&rsquo;t Allow
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="px-3 py-2.5 font-sans-ui text-base font-semibold text-white active:bg-white/10"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}

function FaceIdPermissionModal({
  onAllow,
  onDeny,
}: {
  onAllow: () => void;
  onDeny: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center px-10 bg-black/45 yuna-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="faceid-modal-title"
    >
      <div
        className="w-full max-w-[280px] rounded-[14px] overflow-hidden text-white"
        style={{
          backgroundColor: "rgba(40, 40, 44, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          animation:
            "welcome-rise 250ms cubic-bezier(0.2, 0.8, 0.2, 1) 0ms both",
        }}
      >
        <div className="px-5 pt-5 pb-4 text-center">
          <h3
            id="faceid-modal-title"
            className="font-sans-ui text-base font-semibold leading-snug"
          >
            Do You Want to Allow &ldquo;Yuna&rdquo; to Use Face ID?
          </h3>
          <p className="mt-2 font-sans-ui text-xs text-white/75 leading-snug">
            Face ID lets you securely unlock the app so only you can open it.
          </p>
        </div>
        <div className="border-t border-white/15 grid grid-cols-2">
          <button
            type="button"
            onClick={onDeny}
            className="px-3 py-2.5 font-sans-ui text-base text-white border-r border-white/15 active:bg-white/10"
          >
            Don&rsquo;t Allow
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="px-3 py-2.5 font-sans-ui text-base font-semibold text-white active:bg-white/10"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function SpeakerOnIcon() {
  return <Volume2 size={16} strokeWidth={1.6} aria-hidden="true" />;
}

function SpeakerOffIcon() {
  return <VolumeX size={16} strokeWidth={1.6} aria-hidden="true" />;
}

