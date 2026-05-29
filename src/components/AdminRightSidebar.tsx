import { useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/Button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { USEFULNESS_QUESTION, WELLBEING_SCALE_QUESTION } from "@/lib/questionnaire";

// Right-side admin pane. Always mounted alongside AdminSidebar so the layout
// is stable, but only renders content on /chat where the prompt-engineering
// scaffold is relevant. Off-route the aside is a transparent spacer — keeps
// the phone frame visually centered without a layout shift.
export function AdminRightSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const onChat = location.pathname === "/chat";

  return (
    <aside
      className="hidden md:flex fixed right-0 top-0 h-screen w-44 flex-col gap-3 px-4 py-6 border-l border-border bg-background/60 backdrop-blur-sm z-50 overflow-y-auto"
      aria-label="Chat scaffold"
    >
      {onChat && (
        <>
          <div className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-1 px-2">
            Chat scaffold
          </div>
          <Button
            surface="light"
            variant="secondary"
            size="md"
            onClick={() => setOpen(true)}
          >
            Prompt engineering guide
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="w-[420px] sm:max-w-none overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl tracking-tight">
                  Prompt engineering guide
                </SheetTitle>
                <SheetDescription>
                  How Yuna&apos;s first-session intake is shaped — the system prompt,
                  the conversation arc, and the two structured questions that
                  surface mid-conversation.
                </SheetDescription>
              </SheetHeader>
              <ScaffoldDoc />
            </SheetContent>
          </Sheet>
        </>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-display text-lg tracking-tight">{title}</h3>
      <div className="text-sm leading-relaxed text-foreground/85 flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
      {children}
    </span>
  );
}

function ScaffoldDoc() {
  return (
    <div className="mt-6 flex flex-col gap-6 pb-6">
      <Section title="System prompt">
        <p>
          Yuna is a warm, present AI wellness companion. Not a therapist, not a
          doctor, not a crisis service. The first session is held open: she
          greets, follows what the user brings, and lets the relationship build
          on its own rhythm.
        </p>
        <p>
          Two non-negotiables shape every reply: reflect before you ask (the
          reflection is what makes the user feel heard), and stay brief. One
          to three short sentences per turn, with two as the sweet spot.
        </p>
      </Section>

      <Section title="Conversation arc">
        <p>
          The arc is six turns of natural exchange with two structured cards
          injected at fixed beats:
        </p>
        <ol className="list-decimal pl-5 flex flex-col gap-1">
          <li>Yuna&apos;s opener: a welcome and one open question.</li>
          <li>User shares. Yuna reflects and asks one open follow-up.</li>
          <li>User shares again. Yuna reflects, goes a layer deeper.</li>
          <li>
            <span className="font-medium">Scale card injects</span> after
            Yuna&apos;s reply to user turn 3.
          </li>
          <li>User answers; the choice flows to Claude as context. Yuna reflects.</li>
          <li>
            <span className="font-medium">Usefulness card injects</span> after
            Yuna&apos;s reply to user turn 5. Then the conversation stays open.
          </li>
        </ol>
      </Section>

      <Section title="Two structured questions">
        <div className="flex flex-col gap-1.5">
          <MicroLabel>Scale (1&ndash;10)</MicroLabel>
          <p className="italic">{WELLBEING_SCALE_QUESTION.prompt}</p>
          <ul className="list-disc pl-5 flex flex-col gap-0.5">
            {Object.entries(WELLBEING_SCALE_QUESTION.anchors).map(([step, label]) => (
              <li key={step}>
                <span className="tabular-nums font-medium">{step}:</span> {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-1.5">
          <MicroLabel>Usefulness chips</MicroLabel>
          <p className="italic">{USEFULNESS_QUESTION.prompt}</p>
          <ul className="list-disc pl-5 flex flex-col gap-0.5">
            {USEFULNESS_QUESTION.options.map((opt) => (
              <li key={opt}>{opt}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="Crisis detection">
        <p>
          A client-side regex scans user messages for trip words: suicidal
          language, self-harm, &ldquo;don&apos;t want to be here,&rdquo;
          &ldquo;can&apos;t go on,&rdquo; active panic, &ldquo;can&apos;t
          breathe,&rdquo; sudden acute events. A single hit permanently
          suppresses both structured cards for the rest of the session.
        </p>
        <p>
          The server system prompt handles the response posture. Yuna drops
          the rhythm, reflects what was said, and stays in the moment. She
          weaves 988 in naturally when the timing feels right &mdash; no
          hotline dump, no checklist tone.
        </p>
      </Section>

      <Section title="Tone rules">
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>
            <span className="font-medium">No em dashes</span> in Yuna&apos;s
            voice. Periods, commas, or a fresh sentence instead.
          </li>
          <li>
            <span className="font-medium">No fortune-telling.</span> She does
            not claim to read, sense, or know the user&apos;s inner state.
            She reflects what was actually said.
          </li>
          <li>Plain language. No clinical jargon, no coach-speak.</li>
          <li>One question per turn. Never stacked.</li>
          <li>Validate before reframing. Do not rush to fix or interpret.</li>
        </ul>
      </Section>

      <Section title="Sample turns">
        <div className="flex flex-col gap-3">
          <SampleTurn
            label="Calm opener"
            user="Honestly, I&apos;ve been feeling kind of flat lately."
            yuna="Flat is a real thing to name. When you say flat, is it more like the volume on everything got turned down, or more like nothing is reaching you?"
          />
          <SampleTurn
            label="Vague opener"
            user="I don&apos;t even know why I&apos;m here."
            yuna="That&apos;s a fair place to start. Sometimes showing up is the whole thing for one day. Is there a small piece of the last week that&apos;s sitting with you?"
          />
          <SampleTurn
            label="Acute moment"
            user="I just feel like I can&apos;t do this anymore."
            yuna="I hear how much pain you&apos;re carrying. You don&apos;t have to be alone with it. 988 has people trained for exactly this around the clock, and I&apos;m right here for as long as you want to be."
          />
        </div>
      </Section>
    </div>
  );
}

function SampleTurn({ label, user, yuna }: { label: string; user: string; yuna: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-l-2 border-border pl-3">
      <MicroLabel>{label}</MicroLabel>
      <p>
        <span className="font-medium">User:</span> {user}
      </p>
      <p>
        <span className="font-medium">Yuna:</span> {yuna}
      </p>
    </div>
  );
}
