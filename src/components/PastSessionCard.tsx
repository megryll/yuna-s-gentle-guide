import { ArrowRight } from "lucide-react";
import { Card } from "@/components/Card";
import type { PastSession } from "@/lib/sessions";

const SESSION_NATURE_BGS = [
  "/nature/Background-3.png",
  "/nature/Background-7.png",
  "/nature/Background-11.png",
  "/nature/Background-15.png",
  "/nature/Background-16.png",
];

// A past session is the content Card's compact row variant: the photo-tinted
// shell with the header (eyebrow + More) and footer (save / share + CTA) left
// off, leaving just the date·length meta, the title, and a trailing arrow.
// Like every photo Card it's fixed-dark — white ink on a dark wash in both
// app modes (no mode-aware veil).
export function PastSessionCard({
  session,
  index = 0,
  onClick,
}: {
  session: Pick<PastSession, "id" | "date" | "length" | "title">;
  index?: number;
  onClick?: () => void;
}) {
  const natureBg = SESSION_NATURE_BGS[index % SESSION_NATURE_BGS.length];

  return (
    <Card
      tone="dark"
      naturePath={natureBg}
      compact
      onClick={onClick}
      style={{ animationDelay: `${index * 60}ms` }}
      className="yuna-rise gap-3"
    >
      <p className="text-xs tracking-[0.2em] uppercase text-white/75">
        {session.date} · {session.length}
      </p>
      <p className="font-display text-xl leading-tight tracking-tight text-white pr-12">
        {session.title}
      </p>

      <span
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 right-4 shrink-0 h-9 w-9 rounded-full border border-white/30 text-white inline-flex items-center justify-center"
      >
        <ArrowRight size={14} strokeWidth={2} />
      </span>
    </Card>
  );
}
