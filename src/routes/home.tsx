import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaMark, YunaWordmark } from "@/components/YunaMark";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — Yuna" },
      { name: "description", content: "Begin a conversation with Yuna." },
    ],
  }),
  component: Home,
});

const suggestions = [
  "Tell me what you can help with.",
  "There's something on my mind.",
  "Guide our first conversation.",
];

function Home() {
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const open = (initial: string) => {
    if (!initial.trim()) return;
    navigate({ to: "/chat", search: { q: initial } });
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-7 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <YunaWordmark />
          <button
            aria-label="Menu"
            className="h-9 w-9 rounded-full hairline flex flex-col items-center justify-center gap-[3px] hover:bg-accent transition-colors"
          >
            <span className="h-px w-3.5 bg-foreground" />
            <span className="h-px w-3.5 bg-foreground" />
          </button>
        </div>

        <div className="mt-14 yuna-rise">
          <YunaMark size={44} className="text-primary" />
          <h1 className="mt-6 text-2xl leading-snug tracking-tight">
            Good to see you.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-[18rem]">
            Where shall we begin? Pick a thread, or start one of your own.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-2.5">
          {suggestions.map((s, i) => (
            <button
              key={s}
              onClick={() => open(s)}
              style={{ animationDelay: `${i * 80}ms` }}
              className="yuna-rise text-left rounded-2xl hairline px-5 py-4 text-sm leading-snug hover:bg-accent transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); open(text); }}
          className="mt-auto"
        >
          <div className="flex items-center gap-2 rounded-full hairline pl-5 pr-1.5 py-1.5 bg-background focus-within:border-foreground transition-colors">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write to Yuna…"
              className="font-sans-ui flex-1 bg-transparent text-sm py-2 outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label="Send"
              className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </PhoneFrame>
  );
}