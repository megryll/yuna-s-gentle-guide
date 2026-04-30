import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaMark } from "@/components/YunaMark";

export const Route = createFileRoute("/intro")({
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
  | { kind: "people" }
  | { kind: "stars" };

type Bubble = {
  id: number;
  text: string;
  card?: Card;
};

const script: Bubble[] = [
  {
    id: 1,
    text:
      "Hi — I'm Yuna. Before we get into anything, a few things I'd like you to know.",
  },
  {
    id: 2,
    text: "I was shaped by researchers at Harvard, alongside clinicians studying how language can quietly support emotional wellbeing.",
    card: { kind: "harvard" },
  },
  {
    id: 3,
    text: "Around 60,000 people have spoken with me so far. Each conversation is its own.",
    card: { kind: "people" },
  },
  {
    id: 4,
    text: "If it helps — 4.7 stars on the App Store. What matters more to me is whether I'm useful to you.",
    card: { kind: "stars" },
  },
];

function Intro() {
  const navigate = useNavigate();
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (shown >= script.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), 1200);
    return () => clearTimeout(t);
  }, [shown]);

  const done = shown >= script.length;

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col yuna-fade-in">
        <div className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-border">
          <button
            onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
            aria-label="Back"
            className="h-9 w-9 rounded-full hairline flex items-center justify-center hover:bg-accent transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <YunaMark size={18} className="text-primary" />
            <span className="font-sans-ui text-xs tracking-[0.2em] uppercase">Yuna</span>
          </div>
          <button
            onClick={() => navigate({ to: "/home" })}
            className="text-xs text-muted-foreground tracking-wide hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3">
          {script.slice(0, shown).map((b) => (
            <YunaBubble key={b.id} bubble={b} />
          ))}
          {!done && <Typing />}
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-border">
          <button
            onClick={() => navigate({ to: "/home" })}
            disabled={!done}
            className="w-full rounded-full bg-foreground text-background px-6 py-3.5 text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {done ? "Continue" : "Reading…"}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function YunaBubble({ bubble }: { bubble: Bubble }) {
  return (
    <div className="flex items-end gap-2 yuna-rise justify-start">
      <div className="h-7 w-7 rounded-full hairline flex items-center justify-center text-foreground shrink-0">
        <YunaMark size={14} />
      </div>
      <div className="max-w-[82%] hairline bg-background rounded-2xl rounded-bl-sm overflow-hidden">
        <p className="text-sm leading-relaxed px-4 py-2.5">{bubble.text}</p>
        {bubble.card && (
          <div className="border-t border-border px-4 py-3 bg-muted/40">
            <Attachment kind={bubble.card.kind} />
          </div>
        )}
      </div>
    </div>
  );
}

function Attachment({ kind }: { kind: Card["kind"] }) {
  if (kind === "harvard") {
    return (
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg hairline flex items-center justify-center">
          <YunaMark size={28} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            Research paper
          </p>
          <p className="text-sm truncate">Harvard · Affective computing lab</p>
          <div className="mt-1.5 flex flex-col gap-1">
            <span className="h-px w-full bg-border" />
            <span className="h-px w-3/4 bg-border" />
            <span className="h-px w-2/3 bg-border" />
          </div>
        </div>
      </div>
    );
  }
  if (kind === "people") {
    return (
      <div>
        <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
          Community · 60,000+
        </p>
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-1.5">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    "h-2 w-2 rounded-full " +
                    (row === 2 && i < 6 ? "bg-foreground" : "hairline")
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
        App Store rating
      </p>
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < 4} half={i === 4} />
        ))}
        <span className="font-sans-ui ml-1 text-sm tracking-wide">4.7</span>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-end gap-2 yuna-fade-in justify-start">
      <div className="h-7 w-7 rounded-full hairline flex items-center justify-center text-foreground shrink-0">
        <YunaMark size={14} />
      </div>
      <div className="hairline rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            style={{ animation: "yuna-fade 900ms ease-in-out infinite alternate", animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function Star({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="halfFill2">
          <stop offset="70%" stopColor="currentColor" />
          <stop offset="70%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z"
        stroke="currentColor"
        strokeWidth="1"
        fill={half ? "url(#halfFill2)" : filled ? "currentColor" : "transparent"}
      />
    </svg>
  );
}
