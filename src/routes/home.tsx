import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaMark, YunaWordmark } from "@/components/YunaMark";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

const voices = [
  { id: "Aria", note: "Warm, unhurried" },
  { id: "Sol", note: "Bright, attentive" },
  { id: "Wren", note: "Soft, low" },
  { id: "Kit", note: "Plain, even" },
];

function Home() {
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const [callOpen, setCallOpen] = useState(false);
  const [step, setStep] = useState<"mic" | "voice">("mic");
  const [micState, setMicState] = useState<"idle" | "asking" | "granted" | "denied">("idle");
  const [voice, setVoice] = useState<string>("Aria");

  const open = (initial: string) => {
    if (!initial.trim()) return;
    navigate({ to: "/chat", search: { q: initial } });
  };

  const openCall = () => {
    setStep("mic");
    setMicState("idle");
    setCallOpen(true);
  };

  const requestMic = async () => {
    setMicState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState("granted");
      setStep("voice");
    } catch {
      setMicState("denied");
    }
  };

  const startCall = () => {
    setCallOpen(false);
    navigate({ to: "/call", search: { voice } });
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-7 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <YunaWordmark />
          <button
            onClick={openCall}
            aria-label="Call Yuna"
            className="font-sans-ui h-9 px-4 rounded-full hairline flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase hover:bg-accent transition-colors"
          >
            <PhoneIcon />
            Call
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

      <Dialog open={callOpen} onOpenChange={setCallOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-3xl">
          {step === "mic" ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl tracking-tight">
                  Allow microphone access
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  Yuna needs to hear you to hold a conversation. Audio is processed for the call only.
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

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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