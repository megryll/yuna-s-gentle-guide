import { useState } from "react";
import { Check, Pause, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { usePhoneFrameContainer } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useDarkBlurImage } from "@/lib/theme-prefs";
import type { QuestionnaireAnswer } from "@/lib/chat-store";

export type IntroQuestion = {
  id: string;
  prompt: string;
  options: string[];
  allowOther?: boolean;
};

const OTHER_OPTION = "Other";

export const INTRO_QUESTIONS: IntroQuestion[] = [
  {
    id: "bring-you-here",
    prompt: "What brings you to Yuna today?",
    options: [
      "I'm carrying stress",
      "Something specific happened",
      "I want to grow and reflect",
      "Just curious",
    ],
  },
  {
    id: "overall-feel",
    prompt: "How have you been feeling overall this week?",
    options: [
      "On edge or anxious",
      "Low or flat",
      "Pretty steady",
      "Hopeful or light",
    ],
  },
  {
    id: "heaviest-area",
    prompt: "Where in your life feels heaviest right now?",
    options: [
      "Work or career",
      "Relationships",
      "Self-worth or identity",
      "Health or body",
    ],
    allowOther: true,
  },
  {
    id: "support-style",
    prompt: "How do you prefer to be supported?",
    options: [
      "Hold space and just listen",
      "Reflect what you're noticing",
      "Suggest tools or techniques",
      "Gently challenge me",
    ],
  },
];

export function QuestionnaireModal({
  open,
  onOpenChange,
  onFinish,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onFinish: (answers: QuestionnaireAnswer[]) => void;
}) {
  const phoneContainer = usePhoneFrameContainer();
  const darkBg = useDarkBlurImage();
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});

  const total = INTRO_QUESTIONS.length;
  const current = INTRO_QUESTIONS[index];
  const selected = picks[current.id];
  const isLast = index === total - 1;
  const progress = ((index + 1) / total) * 100;
  const isOtherSelected = selected === OTHER_OPTION;
  const otherValue = otherText[current.id] ?? "";
  const canAdvance =
    !!selected && (!isOtherSelected || otherValue.trim().length > 0);

  const pick = (option: string) => {
    setPicks((p) => ({ ...p, [current.id]: option }));
  };

  const next = () => {
    if (!canAdvance) return;
    if (isLast) {
      const answers: QuestionnaireAnswer[] = INTRO_QUESTIONS.map((q) => {
        const choice = picks[q.id];
        if (!choice) return null;
        if (choice === OTHER_OPTION) {
          const typed = (otherText[q.id] ?? "").trim();
          if (!typed) return null;
          return { questionId: q.id, option: typed };
        }
        return { questionId: q.id, option: choice };
      }).filter((a): a is QuestionnaireAnswer => !!a);
      onFinish(answers);
      reset();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const previous = () => {
    if (index === 0) return;
    setIndex((i) => i - 1);
  };

  const reset = () => {
    setIndex(0);
    setPicks({});
    setOtherText({});
  };

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const options = current.allowOther
    ? [...current.options, OTHER_OPTION]
    : current.options;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={phoneContainer ?? undefined}>
        <DialogPrimitive.Overlay
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="absolute inset-0 z-50 flex flex-col text-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${darkBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            Questionnaire
          </DialogPrimitive.Title>

          {/* Header */}
          <div className="relative grid grid-cols-3 items-center px-5 pt-14 pb-2 shrink-0">
            <div className="justify-self-start">
              <Button
                surface="dark"
                variant="secondary"
                size="icon-lg"
                aria-label="Pause"
                onClick={() => {}}
              >
                <Pause size={18} strokeWidth={1.75} aria-hidden />
              </Button>
            </div>
            <p className="justify-self-center inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-white/90">
              <span aria-hidden>🌿</span>
              Questionnaire
            </p>
            <div className="justify-self-end">
              <Button
                surface="dark"
                variant="secondary"
                size="icon-lg"
                aria-label="Close questionnaire"
                onClick={close}
              >
                <X size={18} strokeWidth={1.75} aria-hidden />
              </Button>
            </div>
          </div>

          {/* Title + progress */}
          <div className="px-6 pt-6 shrink-0">
            <h2 className="font-display text-[26px] leading-[1.2] tracking-tight text-white text-center max-w-[20rem] mx-auto">
              A quick intro check-in
            </h2>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div
                className="h-[5px] w-[160px] rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: "#66BA24",
                  }}
                />
              </div>
              <span className="text-[12.5px] leading-snug text-white/75">
                Question {index + 1} of {total}
              </span>
            </div>
          </div>

          {/* Question card */}
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm text-white p-5 yuna-fade-in">
              <p className="text-[15px] leading-snug text-white">
                {current.prompt}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {options.map((option) => {
                  const active = selected === option;
                  return (
                    <li key={option}>
                      <button
                        type="button"
                        onClick={() => pick(option)}
                        aria-pressed={active}
                        className={
                          "w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors backdrop-blur-sm bg-white/[0.06] " +
                          (active ? "" : "border-white/20 active:bg-white/10")
                        }
                        style={
                          active ? { borderColor: "#66BA24" } : undefined
                        }
                      >
                        <span className="flex-1 text-[14px] leading-snug text-white">
                          {option}
                        </span>
                        <span
                          aria-hidden="true"
                          className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: active ? "#66BA24" : "transparent",
                          }}
                        >
                          {active && (
                            <Check size={14} strokeWidth={2.6} className="text-white" />
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {isOtherSelected && (
                  <li>
                    <TextField
                      surface="dark"
                      value={otherValue}
                      onChange={(e) =>
                        setOtherText((prev) => ({
                          ...prev,
                          [current.id]: e.target.value,
                        }))
                      }
                      placeholder="Tell me more…"
                      aria-label="Other — please specify"
                      autoFocus
                    />
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer nav */}
          <div className="px-6 pb-10 pt-2 flex items-center justify-between gap-3 shrink-0">
            <Button
              surface="dark"
              variant="secondary"
              onClick={previous}
              disabled={index === 0}
              className="min-w-[120px]"
            >
              Previous
            </Button>
            <Button
              surface="dark"
              variant="primary"
              onClick={next}
              disabled={!canAdvance}
              className="min-w-[120px]"
            >
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
