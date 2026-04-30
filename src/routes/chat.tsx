import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaMark } from "@/components/YunaMark";

export const Route = createFileRoute("/chat")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: (s.q as string) ?? "",
  }),
  head: () => ({
    meta: [
      { title: "Conversation — Yuna" },
      { name: "description", content: "A private conversation with Yuna." },
    ],
  }),
  component: Chat,
});

type Msg = { id: string; from: "you" | "yuna"; text: string };

const cannedReplies = [
  "Thank you for sharing that. Take your time — I'm listening. What feels most present right now?",
  "I hear you. Could you tell me a little more about when this started?",
  "That sounds like a lot to hold. What would feel like a small relief, even momentarily?",
];

function Chat() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Seed the conversation with the prompt that brought us here.
  useEffect(() => {
    if (q && messages.length === 0) {
      const seed: Msg = { id: crypto.randomUUID(), from: "you", text: q };
      setMessages([seed]);
      respond();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const respond = () => {
    setTyping(true);
    setTimeout(() => {
      const reply = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
      setMessages((m) => [...m, { id: crypto.randomUUID(), from: "yuna", text: reply }]);
      setTyping(false);
    }, 1100);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "you", text }]);
    setText("");
    respond();
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col yuna-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-border">
          <button
            onClick={() => navigate({ to: "/home" })}
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
          <span className="h-9 w-9" />
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3">
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {typing && <TypingBubble />}
        </div>

        {/* Input */}
        <form onSubmit={send} className="px-5 pb-6 pt-3 border-t border-border">
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

function Bubble({ msg }: { msg: Msg }) {
  const mine = msg.from === "you";
  return (
    <div className={"flex yuna-rise " + (mine ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[80%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl " +
          (mine
            ? "bg-foreground text-background rounded-br-sm"
            : "hairline bg-background rounded-bl-sm")
        }
      >
        {msg.text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start yuna-fade-in">
      <div className="hairline rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
      style={{
        animation: "yuna-fade 900ms ease-in-out infinite alternate",
        animationDelay: `${delay}ms`,
      }}
    />
  );
}