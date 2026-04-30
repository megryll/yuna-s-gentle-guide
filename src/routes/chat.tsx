import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaMark } from "@/components/YunaMark";
import {
  AVATAR_LABELS,
  AVATAR_VARIANTS,
  YunaAvatar,
  type AvatarVariant,
} from "@/components/YunaAvatar";
import { getAvatar, getName, setAvatar, setName } from "@/lib/yuna-session";

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

type Stage = "ask-name" | "ask-avatar" | "open";

type Msg =
  | { id: string; from: "you" | "yuna"; kind: "text"; text: string }
  | { id: string; from: "yuna"; kind: "avatar-picker" };

const cannedReplies = [
  "Thank you for sharing that. Take your time — I'm listening. What feels most present right now?",
  "I hear you. Could you tell me a little more about when this started?",
  "That sounds like a lot to hold. What would feel like a small relief, even momentarily?",
];

function uid() {
  return crypto.randomUUID();
}

function Chat() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [stage, setStage] = useState<Stage>("open");
  const [avatar, setAvatarState] = useState<AvatarVariant | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Boot the conversation based on saved session.
  useEffect(() => {
    const savedName = getName();
    const savedAvatar = getAvatar();
    setAvatarState(savedAvatar);

    const seed: Msg[] = [];
    if (q) seed.push({ id: uid(), from: "you", kind: "text", text: q });

    if (!savedName) {
      setStage("ask-name");
      setMessages(seed);
      yunaSay("Before we go further — what should I call you?");
    } else if (!savedAvatar) {
      setStage("ask-avatar");
      setMessages(seed);
      yunaSay(`It's good to meet you, ${savedName}. What would you like me to look like?`, true);
    } else {
      setStage("open");
      setMessages(seed);
      if (q) respondCanned();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const yunaSay = (line: string, withPicker = false) => {
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => {
        const next: Msg[] = [...m, { id: uid(), from: "yuna", kind: "text", text: line }];
        if (withPicker) next.push({ id: uid(), from: "yuna", kind: "avatar-picker" });
        return next;
      });
      setTyping(false);
    }, 900);
  };

  const respondCanned = () => {
    setTyping(true);
    setTimeout(() => {
      const reply = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
      setMessages((m) => [...m, { id: uid(), from: "yuna", kind: "text", text: reply }]);
      setTyping(false);
    }, 1100);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setMessages((m) => [...m, { id: uid(), from: "you", kind: "text", text: value }]);
    setText("");

    if (stage === "ask-name") {
      setName(value);
      setStage("ask-avatar");
      yunaSay(`Lovely to meet you, ${value}. What would you like me to look like?`, true);
      return;
    }
    if (stage === "ask-avatar") {
      // ignore typed input until they pick
      yunaSay("Pick one of the shapes above whenever you're ready.");
      return;
    }
    respondCanned();
  };

  const pickAvatar = (v: AvatarVariant) => {
    setAvatar(v);
    setAvatarState(v);
    setStage("open");
    setMessages((m) => [
      ...m,
      { id: uid(), from: "you", kind: "text", text: `I'll see you as ${AVATAR_LABELS[v]}.` },
    ]);
    yunaSay("Thank you. I'll wear this shape for you. What's on your mind?");
  };

  const HeaderMark = avatar
    ? <YunaAvatar variant={avatar} size={20} className="text-primary" />
    : <YunaMark size={18} className="text-primary" />;

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
            {HeaderMark}
            <span className="font-sans-ui text-xs tracking-[0.2em] uppercase">Yuna</span>
          </div>
          <span className="h-9 w-9" />
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3">
          {messages.map((m) =>
            m.kind === "avatar-picker" ? (
              <AvatarPicker key={m.id} onPick={pickAvatar} />
            ) : (
              <Bubble key={m.id} msg={m} avatar={avatar} />
            ),
          )}
          {typing && <TypingBubble avatar={avatar} />}
        </div>

        {/* Input */}
        <form onSubmit={send} className="px-5 pb-6 pt-3 border-t border-border">
          <div className="flex items-center gap-2 rounded-full hairline pl-5 pr-1.5 py-1.5 bg-background focus-within:border-foreground transition-colors">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                stage === "ask-name"
                  ? "Type your name…"
                  : stage === "ask-avatar"
                    ? "Pick a shape above…"
                    : "Write to Yuna…"
              }
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

function Bubble({ msg, avatar }: { msg: Extract<Msg, { kind: "text" }>; avatar: AvatarVariant | null }) {
  const mine = msg.from === "you";
  return (
    <div className={"flex items-end gap-2 yuna-rise " + (mine ? "justify-end" : "justify-start")}>
      {!mine && (
        <div className="h-7 w-7 rounded-full hairline flex items-center justify-center text-foreground shrink-0">
          {avatar ? <YunaAvatar variant={avatar} size={18} /> : <YunaMark size={14} />}
        </div>
      )}
      <div
        className={
          "max-w-[78%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl " +
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

function AvatarPicker({ onPick }: { onPick: (v: AvatarVariant) => void }) {
  return (
    <div className="yuna-rise -mx-5">
      <div className="overflow-x-auto px-5">
        <div className="flex gap-3 pb-1">
          {AVATAR_VARIANTS.map((v) => (
            <button
              key={v}
              onClick={() => onPick(v)}
              className="shrink-0 flex flex-col items-center gap-2 group"
            >
              <span className="h-20 w-20 rounded-full hairline flex items-center justify-center group-hover:bg-accent transition-colors">
                <YunaAvatar variant={v} size={56} className="text-foreground" />
              </span>
              <span className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                {AVATAR_LABELS[v]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TypingBubble({ avatar }: { avatar: AvatarVariant | null }) {
  return (
    <div className="flex items-end gap-2 yuna-fade-in justify-start">
      <div className="h-7 w-7 rounded-full hairline flex items-center justify-center text-foreground shrink-0">
        {avatar ? <YunaAvatar variant={avatar} size={18} /> : <YunaMark size={14} />}
      </div>
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