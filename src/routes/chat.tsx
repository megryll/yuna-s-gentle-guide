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
import {
  getAvatar,
  getName,
  setAvatar,
  setHasChatted,
  setLastTopics,
  setName,
} from "@/lib/yuna-session";
import { YunaSettingsDrawer } from "@/components/YunaSettingsDrawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/chat")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: (s.q as string | undefined) ?? "",
    callEnded: (s.callEnded as string | undefined),
    callDuration: (s.callDuration as string | undefined),
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
  | { id: string; from: "yuna"; kind: "avatar-picker" }
  | {
      id: string;
      from: "system";
      kind: "call-summary";
      startedAt: string;
      endedAt: string;
      durationLabel: string;
    };

const cannedReplies = [
  "Thank you for sharing that. Take your time — I'm listening. What feels most present right now?",
  "I hear you. Could you tell me a little more about when this started?",
  "That sounds like a lot to hold. What would feel like a small relief, even momentarily?",
];

const voices = [
  { id: "Aria", note: "Warm, unhurried" },
  { id: "Sol", note: "Bright, attentive" },
  { id: "Wren", note: "Soft, low" },
  { id: "Kit", note: "Plain, even" },
];

function uid() {
  return crypto.randomUUID();
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Chat() {
  const { q, callEnded, callDuration } = Route.useSearch();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [stage, setStage] = useState<Stage>("open");
  const [avatar, setAvatarState] = useState<AvatarVariant | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callStep, setCallStep] = useState<"mic" | "voice">("mic");
  const [micState, setMicState] = useState<"idle" | "asking" | "granted" | "denied">("idle");
  const [voice, setVoice] = useState<string>("Aria");
  const scrollRef = useRef<HTMLDivElement>(null);
  const userTopicsRef = useRef<string[]>([]);

  // Boot
  useEffect(() => {
    const savedName = getName();
    const savedAvatar = getAvatar();
    setAvatarState(savedAvatar);
    setHasChatted();

    const seed: Msg[] = [];

    // If returning from a call, prepend a call summary card.
    if (callEnded && callDuration) {
      const ended = new Date(Number(callEnded));
      const durSec = Number(callDuration);
      const started = new Date(ended.getTime() - durSec * 1000);
      const mm = String(Math.floor(durSec / 60)).padStart(2, "0");
      const ss = String(durSec % 60).padStart(2, "0");
      seed.push({
        id: uid(),
        from: "system",
        kind: "call-summary",
        startedAt: fmtTime(started),
        endedAt: fmtTime(ended),
        durationLabel: `${mm}:${ss}`,
      });
    }

    if (q) {
      seed.push({ id: uid(), from: "you", kind: "text", text: q });
      userTopicsRef.current.push(q);
    }

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
      yunaSay("Pick one of the shapes above whenever you're ready.");
      return;
    }
    userTopicsRef.current.push(value);
    setLastTopics(userTopicsRef.current);
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

  const endChat = () => navigate({ to: "/home" });

  const openCall = () => {
    setCallStep("mic");
    setMicState("idle");
    setCallOpen(true);
  };
  const requestMic = async () => {
    setMicState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState("granted");
      setCallStep("voice");
    } catch {
      setMicState("denied");
    }
  };
  const startCall = () => {
    setCallOpen(false);
    navigate({ to: "/call", search: { voice, returnTo: "chat" } });
  };

  const HeaderAvatar = avatar
    ? <YunaAvatar variant={avatar} size={16} className="text-foreground" />
    : <YunaMark size={14} className="text-foreground" />;

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col yuna-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-border">
          <button
            onClick={() => setSpeakerOn((s) => !s)}
            aria-label={speakerOn ? "Mute Yuna's voice" : "Hear Yuna's voice"}
            className={
              "h-9 w-9 rounded-full hairline flex items-center justify-center transition-colors " +
              (speakerOn ? "bg-foreground text-background" : "hover:bg-accent")
            }
          >
            {speakerOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="font-sans-ui h-9 px-3 rounded-full hairline flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase hover:bg-accent transition-colors"
          >
            <span className="h-5 w-5 rounded-full hairline flex items-center justify-center">
              {HeaderAvatar}
            </span>
            Yuna
            <ChevronDown />
          </button>

          <button
            onClick={endChat}
            className="font-sans-ui h-9 px-3 rounded-full hairline flex items-center text-[10px] tracking-[0.2em] uppercase hover:bg-accent transition-colors"
          >
            End
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3">
          {messages.map((m) => {
            if (m.kind === "avatar-picker") return <AvatarPicker key={m.id} onPick={pickAvatar} />;
            if (m.kind === "call-summary") return <CallSummary key={m.id} msg={m} />;
            return <Bubble key={m.id} msg={m} avatar={avatar} />;
          })}
          {typing && <TypingBubble avatar={avatar} />}
        </div>

        {/* Input */}
        <form onSubmit={send} className="px-5 pb-6 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1 rounded-full hairline pl-5 pr-1.5 py-1.5 bg-background focus-within:border-foreground transition-colors">
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
                className="font-sans-ui flex-1 bg-transparent text-sm py-2 outline-none placeholder:text-muted-foreground min-w-0"
              />
              <button
                type="button"
                aria-label="Send a voice note"
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <MicIcon />
              </button>
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
            <button
              type="button"
              onClick={openCall}
              aria-label="Call Yuna"
              className="h-11 w-11 rounded-full hairline flex items-center justify-center hover:bg-accent transition-colors shrink-0"
            >
              <PhoneIcon />
            </button>
          </div>
        </form>
      </div>

      <YunaSettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />

      <Dialog open={callOpen} onOpenChange={setCallOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-3xl">
          {callStep === "mic" ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl tracking-tight">
                  Allow microphone access
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  Yuna needs to hear you to hold a conversation.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center py-6">
                <div className="h-20 w-20 rounded-full hairline flex items-center justify-center">
                  <MicLargeIcon />
                </div>
              </div>
              {micState === "denied" && (
                <p className="text-xs text-destructive text-center">
                  Microphone blocked. Update your browser settings and try again.
                </p>
              )}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={requestMic}
                  disabled={micState === "asking"}
                  className="w-full rounded-full bg-foreground text-background px-6 py-3 text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {micState === "asking" ? "Requesting…" : "Allow microphone"}
                </button>
                <button
                  onClick={() => setCallOpen(false)}
                  className="w-full text-xs text-muted-foreground py-2 hover:text-foreground transition-colors"
                >
                  Not now
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl tracking-tight">
                  Choose a voice
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  Pick how you'd like me to sound.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 pt-2">
                {voices.map((v) => {
                  const selected = v.id === voice;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVoice(v.id)}
                      className={
                        "flex items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors hairline " +
                        (selected ? "bg-foreground text-background" : "hover:bg-accent")
                      }
                    >
                      <span>
                        <span className="block text-sm">{v.id}</span>
                        <span
                          className={
                            "block font-sans-ui text-[10px] tracking-[0.2em] uppercase " +
                            (selected ? "text-background/70" : "text-muted-foreground")
                          }
                        >
                          {v.note}
                        </span>
                      </span>
                      <span
                        className={
                          "h-2 w-2 rounded-full " +
                          (selected ? "bg-background" : "bg-border")
                        }
                      />
                    </button>
                  );
                })}
                <button
                  onClick={startCall}
                  className="mt-3 w-full rounded-full bg-foreground text-background px-6 py-3 text-sm tracking-wide hover:opacity-90 transition-opacity"
                >
                  Start call
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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

function CallSummary({ msg }: { msg: Extract<Msg, { kind: "call-summary" }> }) {
  return (
    <div className="yuna-rise flex justify-center">
      <div className="w-full max-w-[92%] rounded-2xl hairline bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-full hairline flex items-center justify-center">
            <PhoneIcon />
          </div>
          <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            Voice call · ended
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Started" value={msg.startedAt} />
          <Stat label="Ended" value={msg.endedAt} />
          <Stat label="Length" value={msg.durationLabel} />
        </div>
        <button className="mt-4 w-full rounded-full hairline px-4 py-2.5 text-xs font-sans-ui tracking-wide hover:bg-accent transition-colors">
          View transcript
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm">{value}</p>
      <p className="font-sans-ui text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">
        {label}
      </p>
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

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SpeakerOnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 10v4h4l5 4V6L8 10H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 9c1.2 1 1.2 5 0 6M19 6c2.5 2 2.5 10 0 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function SpeakerOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 10v4h4l5 4V6L8 10H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function MicLargeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
