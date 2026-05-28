import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  ChevronDown,
  Gauge,
  Globe,
  Lock,
  ScanFace,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Switch } from "@/components/Switch";
import { TextField } from "@/components/TextField";
import { setName as saveName, setVoice, useYunaIdentity } from "@/lib/yuna-session";
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
const POST_BUBBLE_GAP_MS = 350;
const INTRO_BETWEEN_BUBBLES_MS = 700;
const FIRST_STEP_AVATAR_DELAY_MS = 400;
const SUBSEQUENT_STEP_DELAY_MS = 300;
const POST_NAME_DELAY_MS = 500;

const REACTION_AMAZING = {
  userText: "Tell me more about Yuna \u{1F440}",
  yunaReply:
    "I'm an emotionally intelligent chatbot, trained in well-tested types of therapy, here to listen and guide you. I can help you notice unhelpful thoughts, work through emotions, and live by what matters most to you.",
};
const REACTION_IMPRESSIVE = {
  userText: "I'm listening \u{1F442}",
  yunaReply: "It really does work",
};

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
        text: "Let me introduce myself too. I was developed by experts in psychology and wellness, from some of the leading US universities.",
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
        text: "91% of people felt better after just one session.",
        card: { kind: "mood-stats" },
      },
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
  if (stepIdx === 0) return "Continue";
  if (stepIdx === 4) return "Choose this voice";
  if (stepIdx === TOTAL_STEPS - 1) return "Continue";
  return "Next";
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

  const KEYBOARD_OFFSET = 260;

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

  // Forest ambient lives in a module singleton (src/lib/ambient-audio.ts) so
  // it survives the intro→home transition. Mute toggles pause/resume the
  // singleton; we deliberately do NOT pause on unmount so the bed keeps
  // playing once the user lands on /home.
  useEffect(() => {
    if (muted) {
      pauseAmbient();
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
        stepIdx === 0 && i === 1 ? INTRO_SECOND_TYPING_MS : TYPING_MS;
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
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [bubbles, typing, stepIdx, phase]);

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
      if (stepIdx === 3) {
        submitChatReaction(
          REACTION_IMPRESSIVE.userText,
          REACTION_IMPRESSIVE.yunaReply,
        );
        return;
      }
      if (stepIdx === 2) {
        // Two-button choice step — let the user click explicitly.
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
    setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    setTimeout(() => {
      setTyping(false);
      playBubblePop();
      setBubbles((prev) => [
        ...prev,
        {
          id: newBubbleId(),
          from: "yuna",
          text: "Here's how it works — chat with me anytime, voice or text, and I'll listen and help you work through what's on your mind.",
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
          text: "Whenever you’re ready",
        },
      ]);
      goToStep(stepIdx + 1);
    }, POST_NAME_DELAY_MS + TYPING_MS);
  };

  const dismissPushModal = (allowed: boolean) => {
    setPushModalOpen(false);
    setPhase("reveal");

    const userText = allowed ? "✓ You set up notifications" : "Maybe later";
    const yunaReply = allowed ? "I’ll keep them gentle" : "Whenever you’re ready";

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
      { id: newBubbleId(), from: "you", text: "✓ You chose a voice" },
    ]);
    // Hide the picker + CTA immediately so the screen lands on the sent
    // bubble before step 5 starts revealing.
    setPhase("reveal");
    setTimeout(() => goToStep(stepIdx + 1), 600);
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
    setUserType("new");
    setAppMode("dark");
    setTransitioning(true);
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
          <Spinner />
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
              <Bubble key={b.id} bubble={b} />
            ))}
            {typing && <TypingBubble />}
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
                  <Button
                    surface="dark"
                    variant="primary"
                    fullWidth
                    onClick={() =>
                      submitChatReaction(
                        REACTION_IMPRESSIVE.userText,
                        REACTION_IMPRESSIVE.yunaReply,
                      )
                    }
                  >
                    I'm listening {"\u{1F442}"}
                  </Button>
                ) : stepIdx === 2 ? (
                  <div className="flex flex-col gap-2.5">
                    <Button
                      surface="dark"
                      variant="primary"
                      fullWidth
                      onClick={() =>
                        submitNotificationChoice(true, "✓ You set up notifications")
                      }
                    >
                      Set them up {"\u{2728}"}
                    </Button>
                    <Button
                      surface="dark"
                      variant="secondary"
                      fullWidth
                      onClick={() =>
                        submitNotificationChoice(false, "Maybe later")
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

function Bubble({ bubble }: { bubble: BubbleData }) {
  const mine = bubble.from === "you";
  return (
    <div
      className={
        "yuna-rise w-full flex " + (mine ? "justify-end" : "justify-start")
      }
    >
      <div
        className={
          "max-w-[85%] rounded-2xl overflow-hidden " +
          (mine
            ? "bg-white text-neutral-900 rounded-br-sm"
            : "rounded-bl-sm border border-white/25 bg-white/10 backdrop-blur-sm text-white")
        }
      >
        <p
          className={
            (mine ? "text-[18px]" : "text-[20px]") + " leading-[1.4] px-4 py-3"
          }
        >
          {bubble.text}
        </p>
        {bubble.card &&
          (bubble.card.kind === "mood-stats" ? (
            <div
              className="border-t border-white/15"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Attachment kind={bubble.card.kind} />
            </div>
          ) : bubble.card.kind === "push-preview" ? (
            <div className="border-t border-white/20 bg-white/5 px-3 py-3">
              <Attachment kind={bubble.card.kind} />
            </div>
          ) : bubble.card.kind === "privacy" ? (
            <div className="border-t border-white/20 bg-white/10 px-4 py-4">
              <Attachment kind={bubble.card.kind} />
            </div>
          ) : (
            <div className="border-t border-white/20 bg-white/10 px-4 py-3">
              <Attachment kind={bubble.card.kind} />
            </div>
          ))}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="yuna-fade-in w-full flex justify-start">
      <div className="rounded-2xl rounded-bl-sm border border-white/25 bg-white/10 backdrop-blur-sm px-4 py-3 flex gap-1">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="h-1.5 w-1.5 rounded-full bg-white"
            style={{
              animation: "yuna-fade 900ms ease-in-out infinite alternate",
              animationDelay: `${d}ms`,
            }}
          />
        ))}
      </div>
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
            <ArrowUp size={13} strokeWidth={2} />
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
      <div className="flex items-center justify-center">
        <img src="/harvard.svg" alt="Harvard University" className="h-10 w-auto" />
      </div>
    );
  }
  if (kind === "stats") {
    return (
      <div className="flex items-center gap-3 text-white">
        <img
          src="/app-store-icon.png"
          alt="App Store"
          className="h-12 w-12 shrink-0"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[22px] leading-none">4.7</span>
            <span className="text-[11px] tracking-[0.08em] uppercase text-white/70">
              Out of 5
            </span>
          </div>
          <StarRow count={5} />
        </div>
        <div className="ml-auto flex flex-col gap-1.5 items-center">
          <span className="font-display text-[22px] leading-none">60k</span>
          <span className="text-[11px] tracking-[0.08em] uppercase text-white/70">
            Happy users
          </span>
        </div>
      </div>
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
        <div
          className="h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#66BA24" }}
        >
          <YunaPushMark />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-sans-ui text-[13px] font-semibold leading-tight truncate">
              Quick gut check
            </span>
            <span className="font-sans-ui text-[11px] text-neutral-500 shrink-0">
              5m ago
            </span>
          </div>
          <p className="text-[13px] leading-snug mt-0.5 text-neutral-800">
            How's tomorrow's meeting sitting with you{name ? `, ${name}` : ""}? If the spiral starts tonight, I'm right here.
          </p>
        </div>
      </div>
    );
  }
  if (kind === "faceid") {
    return <FaceIdToggle />;
  }
  return (
    <a
      href="https://yuna.io/privacy"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 text-white active:opacity-80 transition-opacity"
    >
      <Lock size={22} strokeWidth={1.75} aria-hidden className="shrink-0" />
      <span className="flex-1 min-w-0 text-[15px] font-semibold leading-snug">
        Read our Privacy Policy
      </span>
      <ArrowUpRight
        size={18}
        strokeWidth={1.75}
        aria-hidden
        className="shrink-0"
      />
    </a>
  );
}

function FaceIdToggle() {
  const { on, request } = useContext(FaceIdCtx);
  return (
    <div className="flex items-center gap-3 text-white">
      <ScanFace size={22} strokeWidth={1.75} aria-hidden className="shrink-0" />
      <span className="flex-1 min-w-0 text-[15px] font-semibold leading-snug">
        Face ID
      </span>
      <Switch checked={on} onChange={request} label="Enable Face ID" />
    </div>
  );
}

function YunaPushMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M23.7609 33.0343L23.7621 33.0354L23.7636 33.0369C23.9788 33.2496 24.1955 33.4638 24.4046 33.6679V33.6778C25.0334 34.2867 24.6011 35.3572 23.7168 35.3572H10.5904C9.70614 35.3572 9.27384 34.2965 9.90265 33.6778C10.3251 33.2653 10.7771 32.8233 11.1897 32.4108C12.1231 31.4876 12.6439 30.2304 12.6439 28.9242L12.6439 24.8024C12.6445 23.2621 12.6451 21.7153 12.0937 20.242C11.5926 18.9063 6.80772 10.6269 3.56541 5.07775C2.91694 3.96793 2.07198 2.97596 1.06981 2.16078C0.834006 1.96435 0.627677 1.79739 0.4803 1.67953C-0.286064 1.06078 -0.099386 -0.00975432 0.78488 6.71089e-05C0.942281 6.71089e-05 2.29529 0.00196462 3.81188 0.00409155C5.74564 0.00680354 7.94537 0.00988853 8.27167 0.00988853C9.32296 0.00988853 10.2957 0.56971 10.8066 1.47328C13.0565 5.36257 19.0794 15.842 20.5237 18.7295C21.2802 20.2224 21.6634 21.8724 21.6634 23.5519V28.9144C21.6634 30.2206 22.1841 31.4778 23.1175 32.401C23.325 32.6034 23.5423 32.8183 23.7609 33.0343Z"
        fill="white"
      />
      <path
        d="M28.6813 5.87724C28.6318 5.82771 28.5723 5.79799 28.503 5.79799V5.77817C28.4534 5.77817 28.4138 5.79799 28.3741 5.8178C24.0135 8.25989 22.0259 10.5782 20.9193 13.3723C20.7767 13.7325 20.28 13.643 20.1305 13.3723C16.2801 6.39951 24.0203 2.23857 26.2506 1.46871C28.8273 0.57711 32.1401 -0.165857 34.8358 0.0322775C35.6506 0.0921667 36.106 0.939267 35.7521 1.6765C34.7445 3.77522 34.3541 5.85376 33.9978 7.75118C33.1248 12.3997 31.4882 15.3297 26.1536 15.929C25.4724 16.0055 24.7391 16.0453 23.952 16.0453C22.2448 16.0453 22.4118 14.3222 23.3916 12.5627C24.9695 9.72926 28.5127 6.31297 28.6615 6.18435C28.7606 6.07538 28.7408 5.95649 28.6813 5.87724Z"
        fill="white"
      />
    </svg>
  );
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
      <span className="text-white/70">{label}</span>
      <span className="font-semibold text-white">{value}</span>
      <ChevronDown
        size={9}
        strokeWidth={1.5}
        aria-hidden="true"
        className="text-white/70"
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
      <DrawerContent className="rounded-t-[1.5rem]">
        <DrawerHeader className="text-left px-6 pt-3 pb-3">
          <DrawerTitle className="font-display font-normal text-xl tracking-tight">
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
      <DrawerContent className="rounded-t-[1.5rem]">
        <DrawerHeader className="text-left px-6 pt-3 pb-3">
          <DrawerTitle className="font-display font-normal text-xl tracking-tight">
            Voice pace
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-6 pb-10">
          <Slider
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

function StarRow({ count, color = "#7FB6FF" }: { count: number; color?: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          size={16}
          fill={color}
          strokeWidth={0}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="block h-9 w-9 rounded-full border-2 border-white/25 border-t-white"
      style={{ animation: "yuna-spin 800ms linear infinite" }}
      aria-hidden="true"
    />
  );
}

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
            className="font-sans-ui text-[16px] font-semibold leading-snug"
          >
            &ldquo;Yuna&rdquo; Would Like to Send You Notifications
          </h3>
          <p className="mt-2 font-sans-ui text-[12px] text-white/75 leading-snug">
            Notifications may include alerts, sounds, and icon badges. These
            can be configured in Settings.
          </p>
        </div>
        <div className="border-t border-white/15 grid grid-cols-2">
          <button
            type="button"
            onClick={onDeny}
            className="px-3 py-2.5 font-sans-ui text-[15px] text-white border-r border-white/15 active:bg-white/10"
          >
            Don&rsquo;t Allow
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="px-3 py-2.5 font-sans-ui text-[15px] font-semibold text-white active:bg-white/10"
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
            className="font-sans-ui text-[16px] font-semibold leading-snug"
          >
            Do You Want to Allow &ldquo;Yuna&rdquo; to Use Face ID?
          </h3>
          <p className="mt-2 font-sans-ui text-[12px] text-white/75 leading-snug">
            Face ID lets you securely unlock the app so only you can open it.
          </p>
        </div>
        <div className="border-t border-white/15 grid grid-cols-2">
          <button
            type="button"
            onClick={onDeny}
            className="px-3 py-2.5 font-sans-ui text-[15px] text-white border-r border-white/15 active:bg-white/10"
          >
            Don&rsquo;t Allow
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="px-3 py-2.5 font-sans-ui text-[15px] font-semibold text-white active:bg-white/10"
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

