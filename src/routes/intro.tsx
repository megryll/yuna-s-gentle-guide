import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaMark, YunaWordmark } from "@/components/YunaMark";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "Meet Yuna" },
      { name: "description", content: "A short introduction from Yuna." },
    ],
  }),
  component: Intro,
});

const slides = [
  {
    eyebrow: "A note before we begin",
    title: "I was shaped by researchers at Harvard.",
    body: "Built alongside clinicians and scientists studying how language can support emotional wellbeing — quietly, and without judgment.",
    figure: <Figure variant="harvard" />,
  },
  {
    eyebrow: "You're not alone here",
    title: "60,000 people have spoken with me.",
    body: "Each conversation is its own. I'm here when you want to think out loud, untangle a feeling, or simply be heard.",
    figure: <Figure variant="people" />,
  },
  {
    eyebrow: "If it helps",
    title: "4.7 stars on the App Store.",
    body: "I share that softly — what matters more is whether I'm useful to you. Let's find out together.",
    figure: <Figure variant="stars" />,
  },
];

function Intro() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const slide = slides[step];
  const last = step === slides.length - 1;

  const next = () => {
    if (last) navigate({ to: "/home" });
    else setStep((s) => s + 1);
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10">
        <div className="flex items-center justify-between">
          <YunaWordmark />
          <button
            onClick={() => navigate({ to: "/home" })}
            className="text-xs text-muted-foreground tracking-wide hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>

        <div key={step} className="flex-1 flex flex-col justify-center yuna-rise">
          <div className="mb-10 text-foreground/70">{slide.figure}</div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
            {slide.eyebrow}
          </p>
          <h2 className="text-2xl leading-snug tracking-tight">{slide.title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-[20rem]">
            {slide.body}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={
                  "h-1 rounded-full transition-all " +
                  (i === step ? "w-6 bg-foreground" : "w-1.5 bg-border")
                }
              />
            ))}
          </div>
          <button
            onClick={next}
            className="rounded-full hairline px-6 py-3 text-sm tracking-wide hover:bg-accent transition-colors"
          >
            {last ? "Enter" : "Continue"}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Figure({ variant }: { variant: "harvard" | "people" | "stars" }) {
  if (variant === "harvard") {
    return (
      <div className="flex items-end gap-6">
        <YunaMark size={64} className="text-primary" />
        <div className="flex flex-col gap-1.5 pb-1">
          <div className="h-px w-24 bg-border" />
          <div className="h-px w-16 bg-border" />
          <div className="h-px w-20 bg-border" />
          <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-2">
            Harvard · Research
          </p>
        </div>
      </div>
    );
  }
  if (variant === "people") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full hairline" />
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full hairline" />
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={
                "h-2.5 w-2.5 rounded-full " + (i < 4 ? "bg-foreground" : "hairline")
              }
            />
          ))}
        </div>
        <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-3">
          60,000+ conversations
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < 4} half={i === 4} />
        ))}
        <span className="font-sans-ui ml-2 text-sm tracking-wide">4.7</span>
      </div>
      <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
        App Store rating
      </p>
    </div>
  );
}

function Star({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="halfFill">
          <stop offset="70%" stopColor="currentColor" />
          <stop offset="70%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z"
        stroke="currentColor"
        strokeWidth="1"
        fill={half ? "url(#halfFill)" : filled ? "currentColor" : "transparent"}
      />
    </svg>
  );
}