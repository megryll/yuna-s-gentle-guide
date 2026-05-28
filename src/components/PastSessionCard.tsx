import { ArrowRight } from "lucide-react";
import { useAppMode } from "@/lib/theme-prefs";
import type { PastSession } from "@/lib/sessions";

const SESSION_NATURE_BGS = [
  "/nature/Background-3.png",
  "/nature/Background-7.png",
  "/nature/Background-11.png",
  "/nature/Background-15.png",
  "/nature/Background-16.png",
];

export function PastSessionCard({
  session,
  index = 0,
  onClick,
}: {
  session: Pick<PastSession, "id" | "date" | "length" | "title">;
  index?: number;
  onClick?: () => void;
}) {
  const mode = useAppMode();
  const isLight = mode === "light";

  const natureBg = SESSION_NATURE_BGS[index % SESSION_NATURE_BGS.length];
  const tint = isLight ? "rgba(255, 255, 255, 0.72)" : "rgba(0, 0, 0, 0.55)";

  const strokeClass = isLight
    ? "ring-1 ring-black/10"
    : "ring-1 ring-white/15";

  const style = {
    animationDelay: `${index * 60}ms`,
    backgroundImage: `linear-gradient(${tint}, ${tint}), url(${natureBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] tracking-[0.2em] uppercase text-white/70">
          {session.date} · {session.length}
        </p>
      </div>
      <p className="font-display text-xl leading-tight tracking-tight text-white pr-12">
        {session.title}
      </p>

      <span
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 right-4 shrink-0 h-9 w-9 rounded-full border border-white/30 text-white inline-flex items-center justify-center"
      >
        <ArrowRight size={14} strokeWidth={2} />
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={style}
        className={`yuna-rise w-full text-left rounded-2xl p-5 pb-4 flex flex-col gap-3 overflow-hidden relative ${strokeClass} active:opacity-90 transition-opacity`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      style={style}
      className={`yuna-rise w-full text-left rounded-2xl p-5 pb-4 flex flex-col gap-3 overflow-hidden relative ${strokeClass}`}
    >
      {inner}
    </div>
  );
}
