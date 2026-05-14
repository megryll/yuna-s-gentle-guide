import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  Gauge,
  Globe,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { setName as saveName, setVoice } from "@/lib/yuna-session";
import { VOICES, VOICE_IDS, type VoiceId } from "@/lib/voices";
import { fetchTtsBlobUrl } from "@/lib/tts-client";
import { playYunaBubbleSound, playUserSendSound } from "@/lib/bubble-sound";
import { IntroVoicePicker } from "@/components/yuna-settings-shared";

export const Route = createFileRoute("/intro")({
  validateSearch: (s: Record<string, unknown>): { step?: number } => {
    const raw = s.step;
    const n =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number(raw)
          : NaN;
    return Number.isFinite(n) ? { step: n } : {};
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
  | { kind: "push-preview" };

type BubbleData = {
  id: string;
  from: "yuna" | "you";
  text: string;
  card?: Card;
};

type Phase = "reveal" | "wait-input" | "wait-tap";

const TOTAL_STEPS = 6;
const TYPING_MS = 750;
const INTRO_SECOND_TYPING_MS = 1800;
const POST_BUBBLE_GAP_MS = 350;
const INTRO_BETWEEN_BUBBLES_MS = 100;
const FIRST_STEP_AVATAR_DELAY_MS = 400;
const SUBSEQUENT_STEP_DELAY_MS = 300;
const POST_NAME_DELAY_MS = 500;

// Slide-up + fade used both by the chat-style messages exit and by the
// voice-step elements (bubble, picker, CTA) when transitioning to privacy.
// Snappy on purpose — the user has already committed to leaving the step,
// so we get out of the way fast.
const EXIT_SLIDE_UP_STYLE: React.CSSProperties = {
  transform: "translateY(-120%)",
  opacity: 0,
  transition:
    "transform 380ms cubic-bezier(0.4, 0, 1, 1), opacity 280ms ease-in",
};
const EXIT_ANIM_MS = 400;

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
        text: "I was lovingly created by experienced mental health professionals.",
        card: { kind: "harvard" },
      },
      {
        text: "I'm so grateful to be helping people \u{1F60A}",
        card: { kind: "stats" },
      },
    ];
  }
  if (stepIdx === 2) {
    return [
      {
        text: "People love when I send them notifications. Want to set them up now?",
        card: { kind: "push-preview" },
      },
    ];
  }
  if (stepIdx === 3) {
    return [
      {
        text: "91% of people reported improved mood and stress after 4 weeks of working together.",
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
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [typing, setTyping] = useState(false);
  const [phase, setPhase] = useState<Phase>("reveal");
  const [nameInput, setNameInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [voicePlayingIdx, setVoicePlayingIdx] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [messagesExiting, setMessagesExiting] = useState(false);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceCacheRef = useRef<Map<VoiceId, string>>(new Map());
  // Monotonically increases on every play/stop so an in-flight fetch or a
  // pending el.play() promise can detect that it's stale and bail out.
  const voicePlayGenRef = useRef(0);
  const fadeRafRef = useRef<number | null>(null);
  const mutedRef = useRef(muted);

  const KEYBOARD_OFFSET = 260;
  const AMBIENT_VOLUME = 0.35;
  const AMBIENT_FADE_IN_MS = 1000;

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

  const cancelAmbientFade = () => {
    if (fadeRafRef.current != null) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
  };

  // Smoothly fade the ambient bed to `target` over `ms`. Used to duck the
  // forest sound while a voice preview plays so the voice cuts through.
  const fadeAmbientTo = (target: number, ms: number) => {
    cancelAmbientFade();
    const el = audioRef.current;
    if (!el) return;
    const startVol = el.volume;
    const startT = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - startT) / ms, 1);
      el.volume = startVol + (target - startVol) * p;
      if (p < 1) {
        fadeRafRef.current = requestAnimationFrame(tick);
      } else {
        fadeRafRef.current = null;
      }
    };
    fadeRafRef.current = requestAnimationFrame(tick);
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

  // Forest ambient — file is pre-trimmed; we fade in volume on first start.
  // If autoplay is blocked (refresh / direct sidebar nav), we wait for the
  // first user gesture anywhere on the page and start then.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (muted) {
      cancelAmbientFade();
      el.pause();
      return;
    }

    let listenersBound = false;

    const fadeInTo = (target: number, ms: number) => {
      cancelAmbientFade();
      const startVol = el.volume;
      const startT = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - startT) / ms, 1);
        el.volume = startVol + (target - startVol) * p;
        if (p < 1) {
          fadeRafRef.current = requestAnimationFrame(tick);
        } else {
          fadeRafRef.current = null;
        }
      };
      fadeRafRef.current = requestAnimationFrame(tick);
    };

    const attemptStart = () => {
      el.volume = 0;
      el
        .play()
        .then(() => fadeInTo(AMBIENT_VOLUME, AMBIENT_FADE_IN_MS))
        .catch(() => bindGestureListeners());
    };

    const startOnGesture = () => {
      unbindGestureListeners();
      attemptStart();
    };

    const bindGestureListeners = () => {
      if (listenersBound) return;
      listenersBound = true;
      document.addEventListener("pointerdown", startOnGesture, true);
      document.addEventListener("keydown", startOnGesture, true);
      document.addEventListener("touchstart", startOnGesture, true);
    };

    const unbindGestureListeners = () => {
      if (!listenersBound) return;
      listenersBound = false;
      document.removeEventListener("pointerdown", startOnGesture, true);
      document.removeEventListener("keydown", startOnGesture, true);
      document.removeEventListener("touchstart", startOnGesture, true);
    };

    attemptStart();

    return () => {
      unbindGestureListeners();
      cancelAmbientFade();
    };
  }, [muted]);

  useEffect(() => {
    return () => {
      cancelAmbientFade();
      audioRef.current?.pause();
    };
  }, []);

  // On step change: clear, then play the initial Yuna reveals for this step
  useEffect(() => {
    setBubbles([]);
    setTyping(false);
    setPhase("reveal");
    setMessagesExiting(false);
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

    // Pause the CTA, then play Yuna's response, then show Continue
    setPhase("reveal");

    const READ_DELAY_MS = 1800;

    const t1 = setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    const t2 = setTimeout(() => {
      setTyping(false);
      playBubblePop();
      setBubbles((prev) => [
        ...prev,
        {
          id: newBubbleId(),
          from: "yuna",
          text: `I'm looking forward to getting to know you, ${value}.`,
        },
      ]);
    }, POST_NAME_DELAY_MS + TYPING_MS);
    const t3 = setTimeout(() => {
      setMessagesExiting(true);
    }, POST_NAME_DELAY_MS + TYPING_MS + READ_DELAY_MS);
    const t4 = setTimeout(() => {
      goToStep(1);
    }, POST_NAME_DELAY_MS + TYPING_MS + READ_DELAY_MS + EXIT_ANIM_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
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

    const READ_DELAY_MS = 1500;

    setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    setTimeout(() => {
      setTyping(false);
      playBubblePop();
      setBubbles((prev) => [
        ...prev,
        { id: newBubbleId(), from: "yuna", text: yunaReply },
      ]);
    }, POST_NAME_DELAY_MS + TYPING_MS);
    setTimeout(() => {
      setMessagesExiting(true);
    }, POST_NAME_DELAY_MS + TYPING_MS + READ_DELAY_MS);
    setTimeout(() => {
      goToStep(stepIdx + 1);
    }, POST_NAME_DELAY_MS + TYPING_MS + READ_DELAY_MS + EXIT_ANIM_MS);
  };

  const REACTION_AMAZING = {
    userText: "Amazing! \u{1F929}",
    yunaReply: "That means so much \u{1F49A}",
  };
  const REACTION_IMPRESSIVE = {
    userText: "Impressive! \u{1F92F}",
    yunaReply: "It really does work \u{1F49A}",
  };

  const submitNotificationChoice = (wantsPush: boolean, label: string) => {
    playSendPop();
    setBubbles((prev) => [
      ...prev,
      { id: newBubbleId(), from: "you", text: label },
    ]);
    setPhase("reveal");

    if (wantsPush) {
      // Surface the iOS-style permission modal after a short beat so the
      // user can register their tap before the modal arrives.
      setTimeout(() => setPushModalOpen(true), 450);
      return;
    }

    const READ_DELAY_MS = 1500;

    setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    setTimeout(() => {
      setTyping(false);
      playBubblePop();
      setBubbles((prev) => [
        ...prev,
        {
          id: newBubbleId(),
          from: "yuna",
          text: "Whenever you’re ready \u{1F49A}",
        },
      ]);
    }, POST_NAME_DELAY_MS + TYPING_MS);
    setTimeout(() => {
      setMessagesExiting(true);
    }, POST_NAME_DELAY_MS + TYPING_MS + READ_DELAY_MS);
    setTimeout(() => {
      goToStep(stepIdx + 1);
    }, POST_NAME_DELAY_MS + TYPING_MS + READ_DELAY_MS + EXIT_ANIM_MS);
  };

  const dismissPushModal = () => {
    setPushModalOpen(false);

    const READ_DELAY_MS = 1500;

    setTimeout(() => setTyping(true), POST_NAME_DELAY_MS);
    setTimeout(() => {
      setTyping(false);
      playBubblePop();
      setBubbles((prev) => [
        ...prev,
        {
          id: newBubbleId(),
          from: "yuna",
          text: "I’ll keep them gentle \u{1F49A}",
        },
      ]);
    }, POST_NAME_DELAY_MS + TYPING_MS);
    setTimeout(() => {
      setMessagesExiting(true);
    }, POST_NAME_DELAY_MS + TYPING_MS + READ_DELAY_MS);
    setTimeout(() => {
      goToStep(stepIdx + 1);
    }, POST_NAME_DELAY_MS + TYPING_MS + READ_DELAY_MS + EXIT_ANIM_MS);
  };

  const fadeOutAmbient = (ms: number) => {
    cancelAmbientFade();
    const el = audioRef.current;
    if (!el) return;
    const startVol = el.volume;
    const startT = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - startT) / ms, 1);
      el.volume = startVol * (1 - p);
      if (p < 1) {
        fadeRafRef.current = requestAnimationFrame(tick);
      } else {
        el.pause();
        fadeRafRef.current = null;
      }
    };
    fadeRafRef.current = requestAnimationFrame(tick);
  };

  const submitVoiceChoice = () => {
    // Persist whichever card the user landed on, even if they never tapped
    // to change the default, and tear down any in-flight preview.
    const id = VOICE_IDS[voiceIdx];
    if (id) setVoice(id);
    stopVoicePreview();
    // Slide the avatar, the bubble, the picker, and the CTA up off-screen
    // before navigating so the voice step exits like the chat-style steps.
    setMessagesExiting(true);
    setTimeout(() => goToStep(stepIdx + 1), EXIT_ANIM_MS);
  };

  const advance = () => {
    if (stepIdx < TOTAL_STEPS - 1) {
      goToStep(stepIdx + 1);
      return;
    }
    // Final step (privacy) — fade out and head to /home.
    setTransitioning(true);
    fadeOutAmbient(1300);
    setTimeout(() => {
      navigate({ to: "/home" });
    }, 1400);
  };

  return (
    <PhoneFrame backgroundImage="/background.png">
      <audio
        ref={audioRef}
        src="/forest-background.m4a"
        loop
        preload="auto"
        aria-hidden="true"
      />
      {transitioning && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 yuna-fade-in"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.42)), url(/background.png)",
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
          onAllow={dismissPushModal}
          onDeny={dismissPushModal}
        />
      )}
      <div className="flex-1 flex flex-col text-white min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-14 pb-2">
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            onClick={() => {
              if (stepIdx > 0) goToStep(stepIdx - 1);
              else navigate({ to: "/accept-terms" });
            }}
            aria-label="Back"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </Button>
          <ProgressDots current={stepIdx + 1} total={TOTAL_STEPS} />
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

        {/* Body — the avatar wrapper is re-keyed by stepIdx so it unmounts
            and remounts between steps, firing intro-avatar-rise fresh each
            time. The matching intro-avatar-exit is applied via the wrapper
            style while messagesExiting is true. The voice step uses a tighter
            top padding so the avatar+bubble row sits higher and the carousel
            below gets the full available height. */}
        <div
          className={
            "flex-1 flex flex-col px-8 pb-10 min-h-0 " +
            (stepIdx === 4 ? "pt-8" : "pt-[72px]")
          }
        >
          <div className="flex items-center gap-3">
            <div
              key={`avatar-${stepIdx}`}
              className="shrink-0"
              style={
                messagesExiting
                  ? {
                      animation:
                        "intro-avatar-exit 380ms cubic-bezier(0.4, 0, 1, 1) forwards",
                    }
                  : undefined
              }
            >
              <YunaAvatarLarge />
            </div>
            {stepIdx === 4 && (
              <div
                className="flex-1 flex flex-col gap-3 min-w-0"
                style={messagesExiting ? EXIT_SLIDE_UP_STYLE : undefined}
              >
                {bubbles.map((b) => (
                  <Bubble key={b.id} bubble={b} />
                ))}
                {typing && <TypingBubble />}
              </div>
            )}
          </div>

          {stepIdx === 4 ? (
            <div
              className="flex-1 flex flex-col justify-center -mx-8 min-h-0"
              style={messagesExiting ? EXIT_SLIDE_UP_STYLE : undefined}
            >
              {phase === "wait-tap" && (
                <div className="yuna-rise">
                  <VoicePicker
                    selectedIdx={voiceIdx}
                    onSelect={(i) => {
                      setVoiceIdx(i);
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
            </div>
          ) : (
            <div
              className="mt-6 flex-1 w-full flex flex-col gap-3 min-h-0"
              style={
                messagesExiting
                  ? {
                      transform: "translateY(-120%)",
                      opacity: 0,
                      transition:
                        "transform 700ms cubic-bezier(0.4, 0, 0.7, 1), opacity 600ms ease-in",
                      paddingBottom: inputFocused ? KEYBOARD_OFFSET : undefined,
                    }
                  : {
                      transition: "padding 200ms ease-out",
                      paddingBottom: inputFocused ? KEYBOARD_OFFSET : undefined,
                    }
              }
            >
              {bubbles.map((b) => (
                <Bubble key={b.id} bubble={b} />
              ))}
              {typing && <TypingBubble />}
            </div>
          )}

          {/* CTA — translates up to sit above the keyboard when input is focused.
              On the voice step, it joins the rest of the screen in sliding up
              off-screen when the user picks a voice and we transition out. */}
          <div
            className="pt-4 min-h-[60px] transition-transform duration-200 ease-out"
            style={
              stepIdx === 4 && messagesExiting
                ? EXIT_SLIDE_UP_STYLE
                : inputFocused
                  ? { transform: `translateY(-${KEYBOARD_OFFSET}px)` }
                  : undefined
            }
          >
            {phase === "wait-input" && (
              <div className="yuna-rise">
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
              <div className="yuna-rise">
                {stepIdx === 1 ? (
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
                    Amazing! {"\u{1F929}"}
                  </Button>
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
                    Impressive! {"\u{1F92F}"}
                  </Button>
                ) : stepIdx === 2 ? (
                  <div className="flex flex-col gap-2.5">
                    <Button
                      surface="dark"
                      variant="primary"
                      fullWidth
                      onClick={() =>
                        submitNotificationChoice(true, "Set them up \u{2728}")
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
                    Let’s Start! {"\u{1F49A}"}
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
  );
}

// ── Yuna avatar (welcome-screen sized halo cluster) ─────────────────────────

function YunaAvatarLarge() {
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
        src="/avatar.png"
        alt="Yuna avatar"
        className="relative h-14 w-14"
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

// ── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={
            "h-1.5 w-1.5 rounded-full transition-colors " +
            (i < current ? "bg-white" : "bg-white/30")
          }
        />
      ))}
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
      <div className="flex-1 flex items-center gap-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm pl-5 pr-1.5 py-2 focus-within:border-white transition-colors">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Enter your name"
          className="flex-1 bg-transparent text-sm py-1.5 outline-none text-white placeholder:text-white/50 min-w-0"
        />
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
      </div>
    </form>
  );
}

// ── Attachments ──────────────────────────────────────────────────────────────

function Attachment({ kind }: { kind: Card["kind"] }) {
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
            <span className="font-sans-ui text-[11px] tracking-[0.08em] uppercase text-white/70">
              Out of 5
            </span>
          </div>
          <StarRow count={5} />
        </div>
        <div className="ml-auto flex flex-col gap-1.5 items-center">
          <span className="font-display text-[22px] leading-none">60k</span>
          <span className="font-sans-ui text-[11px] tracking-[0.08em] uppercase text-white/70">
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
            <text x="24" y="160" textAnchor="middle">
              Week 1
            </text>
            <text x="88" y="160" textAnchor="middle">
              Week 2
            </text>
            <text x="152" y="160" textAnchor="middle">
              Week 3
            </text>
            <text x="216" y="160" textAnchor="middle">
              Week 4
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
              Check in w/ Yuna
            </span>
            <span className="font-sans-ui text-[11px] text-neutral-500 shrink-0">
              5m ago
            </span>
          </div>
          <p className="text-[13px] leading-snug mt-0.5 text-neutral-800">
            How did your grad ceremony go?
          </p>
        </div>
      </div>
    );
  }
  return (
    <a
      href="https://yuna.io/privacy"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 text-white active:opacity-80 transition-opacity"
    >
      <img
        src="/lock.png"
        alt=""
        aria-hidden="true"
        className="h-28 w-auto object-contain shrink-0"
      />
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold leading-snug">
          Read our Privacy Policy
        </span>
        <span className="text-xs text-white/70">yuna.io/privacy</span>
      </span>
      <ArrowUpRight
        size={22}
        strokeWidth={1.75}
        aria-hidden
        className="shrink-0 text-white"
      />
    </a>
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
  return (
    <div className="flex flex-col gap-7">
      <IntroVoicePicker
        selectedIdx={selectedIdx}
        onSelect={onSelect}
        playingIdx={playingIdx}
        onTogglePlay={onTogglePlay}
        surface="dark"
      />
      <VoiceControlPills />
    </div>
  );
}

function VoiceControlPills() {
  return (
    <div className="flex items-center justify-center gap-2 px-8">
      <ControlPill icon={<GlobePillIcon />} label="Language" value="English" />
      <ControlPill icon={<SpeedPillIcon />} label="Pace" value="1.0x" />
    </div>
  );
}

function ControlPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 px-3.5 h-9 rounded-full border border-white/40 text-white active:bg-white/15 transition-colors"
    >
      {icon}
      <span className="text-[12px] text-white/70">{label}</span>
      <span className="text-[12px] font-semibold text-white">{value}</span>
      <ChevronDown
        size={9}
        strokeWidth={1.5}
        aria-hidden="true"
        className="text-white/70"
      />
    </button>
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

function SpeakerOnIcon() {
  return <Volume2 size={16} strokeWidth={1.6} aria-hidden="true" />;
}

function SpeakerOffIcon() {
  return <VolumeX size={16} strokeWidth={1.6} aria-hidden="true" />;
}

