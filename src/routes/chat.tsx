import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaMark } from "@/components/YunaMark";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import { getAvatar, setHasChatted, setLastTopics } from "@/lib/yuna-session";
import { YunaHeaderTrigger } from "@/components/YunaHeaderTrigger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/chat")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    q?: string;
    callEnded?: string;
    callDuration?: string;
  } => ({
    q: (s.q as string | undefined) ?? "",
    callEnded: s.callEnded as string | undefined,
    callDuration: s.callDuration as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Conversation — Yuna" },
      { name: "description", content: "A private conversation with Yuna." },
    ],
  }),
  component: Chat,
});

type Msg =
  | { id: string; from: "you" | "yuna"; kind: "text"; text: string }
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

function uid() {
  return crypto.randomUUID();
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const CHAT_STORE_KEY = "yuna.chatMessages";

function loadStoredMessages(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(CHAT_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Msg[]) : [];
  } catch {
    return [];
  }
}

function saveStoredMessages(msgs: Msg[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CHAT_STORE_KEY, JSON.stringify(msgs));
}

function clearStoredMessages() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CHAT_STORE_KEY);
}

function Chat() {
  const { q, callEnded, callDuration } = Route.useSearch();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [avatar, setAvatarState] = useState<AvatarVariant | null>(null);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [micState, setMicState] = useState<"idle" | "asking" | "granted" | "denied">("idle");
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userTopicsRef = useRef<string[]>([]);
  const bootedRef = useRef(false);

  const KEYBOARD_OFFSET = 260;

  // Boot — guarded so Strict Mode's double-mount doesn't fire respondCanned twice
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const savedAvatar = getAvatar();
    setAvatarState(savedAvatar);
    setHasChatted();

    const isReturnFromCall = !!callEnded && !!callDuration;
    // Returning from a voice call: keep the chat the user already had and
    // append a summary. Anything else (a fresh `q` from Home, or a clean
    // open) starts a new thread.
    const seed: Msg[] = isReturnFromCall ? loadStoredMessages() : [];

    if (isReturnFromCall) {
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
    } else {
      // Any non-call entry starts a fresh thread — wipe the persisted log.
      clearStoredMessages();
      if (q) {
        seed.push({ id: uid(), from: "you", kind: "text", text: q });
        userTopicsRef.current.push(q);
      }
    }

    setMessages(seed);
    if (q && !isReturnFromCall) respondCanned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages so a roundtrip through the call screen doesn't drop them.
  useEffect(() => {
    if (messages.length > 0) saveStoredMessages(messages);
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

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
    userTopicsRef.current.push(value);
    setLastTopics(userTopicsRef.current);
    inputRef.current?.blur();
    respondCanned();
  };

  const endChat = () => navigate({ to: "/home" });

  const openCall = () => {
    setMicState("idle");
    setMicOpen(true);
  };
  const requestMic = async () => {
    setMicState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState("granted");
      setMicOpen(false);
      navigate({ to: "/call", search: { returnTo: "chat" } });
    } catch {
      setMicState("denied");
    }
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col yuna-fade-in min-h-0">
        {/* Header */}
        <div className="grid grid-cols-3 items-center px-5 pt-14 pb-2 border-b border-border">
          <div className="justify-self-start">
            <Button
              surface="light"
              variant="ghost"
              size="icon-lg"
              pressed={speakerOn}
              onClick={() => setSpeakerOn((s) => !s)}
              aria-label={speakerOn ? "Mute Yuna's voice" : "Hear Yuna's voice"}
            >
              {speakerOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
            </Button>
          </div>
          <div className="justify-self-center">
            <YunaHeaderTrigger />
          </div>
          <div className="justify-self-end">
            <Button
              surface="light"
              variant="ghost"
              size="icon-lg"
              onClick={endChat}
              aria-label="End conversation"
            >
              <CloseIcon />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3 transition-[padding] duration-200 ease-out"
          style={inputFocused ? { paddingBottom: KEYBOARD_OFFSET + 24 } : undefined}
        >
          {messages.map((m) => {
            if (m.kind === "call-summary") return <CallSummary key={m.id} msg={m} />;
            return <Bubble key={m.id} msg={m} avatar={avatar} />;
          })}
          {typing && <TypingBubble avatar={avatar} />}
        </div>

        {/* Input + Call Yuna footer */}
        <div
          className="border-t border-border bg-background transition-transform duration-200 ease-out"
          style={inputFocused ? { transform: `translateY(-${KEYBOARD_OFFSET}px)` } : undefined}
        >
          <form onSubmit={send} className="px-5 pt-3">
            <div className="flex items-center gap-1 rounded-full hairline pl-5 pr-1.5 py-1.5 bg-background focus-within:border-foreground transition-colors">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Write to Yuna…"
                className="flex-1 bg-transparent text-sm py-2 outline-none placeholder:text-muted-foreground min-w-0"
              />
              <Button
                surface="light"
                variant="ghost"
                size="icon-sm"
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                aria-label="Send a voice note"
              >
                <MicIcon />
              </Button>
              <Button
                surface="light"
                variant="primary"
                size="icon-sm"
                type="submit"
                onMouseDown={(e) => e.preventDefault()}
                aria-label="Send"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </div>
          </form>

          <div
            className={
              "px-5 pt-3 pb-6 flex justify-center transition-opacity duration-150 " +
              (inputFocused
                ? "opacity-0 pointer-events-none h-0 overflow-hidden p-0"
                : "opacity-100")
            }
          >
            <Button surface="light" variant="secondary" size="sm" onClick={openCall}>
              <PhoneCallIcon />
              Call Yuna
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={micOpen} onOpenChange={setMicOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-3xl">
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
            <Button
              surface="light"
              variant="primary"
              fullWidth
              onClick={requestMic}
              disabled={micState === "asking"}
            >
              {micState === "asking" ? "Requesting…" : "Allow microphone"}
            </Button>
            <Button
              surface="light"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => setMicOpen(false)}
            >
              Not now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </PhoneFrame>
  );
}

function Bubble({
  msg,
  avatar,
}: {
  msg: Extract<Msg, { kind: "text" }>;
  avatar: AvatarVariant | null;
}) {
  const mine = msg.from === "you";
  return (
    <div className={"flex items-end gap-2 yuna-rise " + (mine ? "justify-end" : "justify-start")}>
      {!mine && (
        <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center text-foreground shrink-0 bg-muted">
          {avatar ? (
            <YunaAvatar variant={avatar} size={28} />
          ) : (
            <span className="h-7 w-7 rounded-full hairline flex items-center justify-center">
              <YunaMark size={14} />
            </span>
          )}
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
        <Button surface="light" variant="secondary" size="sm" fullWidth className="mt-4">
          View transcript
        </Button>
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

function TypingBubble({ avatar }: { avatar: AvatarVariant | null }) {
  return (
    <div className="flex items-end gap-2 yuna-fade-in justify-start">
      <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center text-foreground shrink-0 bg-muted">
        {avatar ? (
          <YunaAvatar variant={avatar} size={28} />
        ) : (
          <span className="h-7 w-7 rounded-full hairline flex items-center justify-center">
            <YunaMark size={14} />
          </span>
        )}
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

function SpeakerOnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10v4h4l5 4V6L8 10H4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 9c1.2 1 1.2 5 0 6M19 6c2.5 2 2.5 10 0 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function SpeakerOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10v4h4l5 4V6L8 10H4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
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
function PhoneCallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
        fill="currentColor"
      />
    </svg>
  );
}
function MicLargeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
