import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { SentimentTag } from "@/components/SentimentTag";
import {
  PAST_SESSIONS,
  useSessionEmotionColors,
  type PastSession,
  type SessionHighlight,
  type TranscriptTurn,
} from "@/lib/sessions";

export const Route = createFileRoute("/sessions/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Session — Yuna` }, { name: "session-id", content: params.id }],
  }),
  component: SessionDetail,
});

const TRANSCRIPT_PREVIEW_TURNS = 3;

function SessionDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const session = PAST_SESSIONS.find((s) => s.id === id);

  if (!session) {
    return (
      <PhoneFrame backgroundImage="/background.png" themed>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-white">
          <p className="text-sm text-white/85">Session not found.</p>
          <Button
            surface="dark"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => navigate({ to: "/sessions" })}
          >
            Back to sessions
          </Button>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame backgroundImage="/background.png" themed>
      <div className="flex-1 flex flex-col text-white min-h-0">
        <header className="flex items-center justify-between px-8 pt-14 pb-2 shrink-0">
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            onClick={() => navigate({ to: "/sessions" })}
            aria-label="Back"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </Button>
          <Button
            surface="dark"
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate({ to: "/chat", search: { q: session.title } })
            }
          >
            Continue
          </Button>
        </header>

        <div className="flex-1 flex flex-col gap-8 overflow-y-auto overflow-x-hidden px-8 pt-6 pb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SessionHeader session={session} />

          {(session.tags.length > 0 || session.note) && (
            <SessionInputSection session={session} />
          )}

          <TranscriptSection turns={session.transcript} />

          {session.highlights.length > 0 && (
            <HighlightsSection highlights={session.highlights} />
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

function SessionHeader({ session }: { session: PastSession }) {
  return (
    <section className="flex flex-col gap-2 yuna-fade-in">
      <p className="font-sans-ui text-[10px] tracking-[0.32em] uppercase text-white/65">
        {session.date} · {session.length}
      </p>
      <h1 className="font-display text-[26px] leading-tight tracking-tight text-white">
        {session.title}
      </h1>
    </section>
  );
}

function SessionInputSection({ session }: { session: PastSession }) {
  return (
    <section className="flex flex-col gap-3 yuna-rise">
      <h2 className="font-display text-[18px] leading-tight text-white text-center">
        What you shared
      </h2>

      {session.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {session.tags.map((tag) => (
            <SentimentTag
              key={tag.label}
              tone={tag.tone}
              emoji={tag.emoji}
              label={tag.label}
            />
          ))}
        </div>
      )}

      {session.note && (
        <div className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-4">
          <p className="text-[15px] leading-relaxed text-white/90 italic">
            “{session.note}”
          </p>
        </div>
      )}
    </section>
  );
}

function TranscriptSection({ turns }: { turns: TranscriptTurn[] }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = turns.length > TRANSCRIPT_PREVIEW_TURNS;
  const visible = expanded ? turns : turns.slice(0, TRANSCRIPT_PREVIEW_TURNS);

  return (
    <section className="flex flex-col gap-3 yuna-rise">
      <h2 className="font-display text-[18px] leading-tight text-white text-center">
        Transcript
      </h2>

      <div className="relative flex flex-col gap-2">
        {visible.map((turn, i) => (
          <TranscriptBubble key={i} turn={turn} />
        ))}

        {canExpand && !expanded && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-10 h-20 bg-gradient-to-b from-transparent to-[rgba(15,18,24,0.55)]"
          />
        )}
      </div>

      {canExpand && (
        <div className="flex justify-center pt-1">
          <Button
            surface="dark"
            variant="secondary"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : `Show full transcript`}
          </Button>
        </div>
      )}
    </section>
  );
}

function TranscriptBubble({ turn }: { turn: TranscriptTurn }) {
  const mine = turn.from === "you";
  return (
    <div className={"w-full flex " + (mine ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[85%] rounded-2xl overflow-hidden " +
          (mine
            ? "bg-white text-neutral-900 rounded-br-sm"
            : "rounded-bl-sm border border-white/25 bg-white/10 backdrop-blur-sm text-white")
        }
      >
        <p className="text-[14px] leading-[1.45] px-4 py-2.5">{turn.text}</p>
      </div>
    </div>
  );
}

function HighlightsSection({ highlights }: { highlights: SessionHighlight[] }) {
  return (
    <section className="flex flex-col gap-3 yuna-rise">
      <h2 className="font-display text-[18px] leading-tight text-white text-center">
        Highlights and emotions
      </h2>
      {highlights.map((h, i) => (
        <HighlightItem key={i} highlight={h} />
      ))}
    </section>
  );
}

function HighlightItem({ highlight }: { highlight: SessionHighlight }) {
  const emotionColors = useSessionEmotionColors();
  const colors = highlight.emotions
    .map((e) => emotionColors[e])
    .filter(Boolean);
  const ribbon =
    colors.length === 0
      ? "rgba(255,255,255,0.25)"
      : colors.length === 1
        ? colors[0]
        : `linear-gradient(180deg, ${colors.join(", ")})`;

  return (
    <div className="relative rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-4 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          padding: 2,
          background: ribbon,
          WebkitMask:
            "linear-gradient(90deg, #000 0px, #000 22px, transparent 32px), " +
            "linear-gradient(#000 0 0) content-box, " +
            "linear-gradient(#000 0 0)",
          WebkitMaskComposite: "source-in, xor",
          mask:
            "linear-gradient(90deg, #000 0px, #000 22px, transparent 32px), " +
            "linear-gradient(#000 0 0) content-box, " +
            "linear-gradient(#000 0 0)",
          maskComposite: "intersect, exclude",
        }}
      />
      <div className="flex flex-col gap-3">
        <p className="text-[16px] leading-relaxed text-white/90">
          “{highlight.quote}”
        </p>

        {highlight.emotions.length > 0 && (
          <div className="pt-3 border-t border-white/12 flex flex-wrap gap-1.5">
            {highlight.emotions.map((name) => (
              <EmotionPill key={name} name={name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmotionPill({ name }: { name: string }) {
  const emotionColors = useSessionEmotionColors();
  const color = emotionColors[name] ?? "rgba(255,255,255,0.5)";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/15 px-2.5 py-1 text-[12px] leading-none font-sans-ui text-white/85">
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      {name}
    </span>
  );
}

