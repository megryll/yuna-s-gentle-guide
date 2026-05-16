import { ArrowRight } from "lucide-react";
import { useAppMode } from "@/lib/theme-prefs";
import type { PastSession } from "@/lib/sessions";

const SESSION_ACCENTS = ["#7E84CC", "#5E9389", "#C7916A", "#7BB068"];

const SESSION_NATURE_BGS = [
  "/nature/Background-3.png",
  "/nature/Background-7.png",
  "/nature/Background-11.png",
  "/nature/Background-15.png",
  "/nature/Background-19.png",
];

export function PastSessionCard({
  session,
  index = 0,
  onClick,
}: {
  session: Pick<PastSession, "id" | "date" | "length" | "title">;
  index?: number;
  onClick: () => void;
}) {
  const mode = useAppMode();
  const isLight = mode === "light";

  const accent = SESSION_ACCENTS[index % SESSION_ACCENTS.length];
  const natureBg = SESSION_NATURE_BGS[index % SESSION_NATURE_BGS.length];
  const cornerStop = isLight
    ? "rgba(255, 255, 255, 0.78)"
    : "rgba(15, 18, 24, 0.55)";
  const tint = isLight ? "rgba(255, 255, 255, 0.88)" : "rgba(15, 18, 24, 0.86)";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        animationDelay: `${index * 60}ms`,
        backgroundImage:
          `linear-gradient(110deg, ${accent}99 0%, ${accent}40 35%, ${cornerStop} 100%), ` +
          `linear-gradient(${tint}, ${tint}), ` +
          `url(${natureBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="yuna-rise w-full text-left rounded-2xl p-5 pb-4 flex flex-col gap-3 overflow-hidden relative active:opacity-90 transition-opacity"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-white/70">
          {session.date} · {session.length}
        </p>
      </div>
      <p className="font-display text-xl leading-tight tracking-tight text-white pr-12">
        {session.title}
      </p>

      <span
        aria-hidden
        className="absolute bottom-4 right-4 shrink-0 h-9 w-9 rounded-full border border-white/30 text-white inline-flex items-center justify-center"
      >
        <ArrowRight size={14} strokeWidth={2} />
      </span>
    </button>
  );
}
