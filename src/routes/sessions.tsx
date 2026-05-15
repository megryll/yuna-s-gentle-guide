import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";
import { SentimentTag } from "@/components/SentimentTag";
import { PAST_SESSIONS, type PastSession } from "@/lib/sessions";
import { useUserType } from "@/lib/user-type";
import { useAppMode } from "@/lib/theme-prefs";

export const Route = createFileRoute("/sessions")({
  head: () => ({ meta: [{ title: "Sessions — Yuna" }] }),
  component: SessionsRoute,
});

function SessionsRoute() {
  const userType = useUserType();
  return userType === "returning" ? <SessionsReturning /> : <SessionsNew />;
}

function SessionsNew() {
  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col justify-center px-6 pb-10 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center text-center">
          <span
            className="h-20 w-20 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center"
            aria-hidden="true"
          >
            <MessageCircle
              size={32}
              strokeWidth={1.4}
              className="text-white/70"
              aria-hidden
            />
          </span>
          <h1 className="mt-7 font-display text-2xl tracking-tight text-white">
            No past sessions yet
          </h1>
          <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-[20rem]">
            Once you finish your first chat or call with Yuna, you'll find it
            here, ready to pick back up from.
          </p>
          <Button surface="dark" variant="primary" className="mt-7" asChild>
            <Link to="/chat">Start your first conversation</Link>
          </Button>
        </div>
      </div>
    </ScreenChrome>
  );
}

function SessionsReturning() {
  const navigate = useNavigate();
  const mode = useAppMode();
  const isLight = mode === "light";
  const openSession = (s: PastSession) => {
    navigate({ to: "/sessions/$id", params: { id: s.id } });
  };

  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pb-8 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <h1 className="mt-2 font-display text-3xl tracking-tight text-white">
          Past sessions
        </h1>

        <ul className="mt-6 flex flex-col gap-7">
          {PAST_SESSIONS.map((s, i) => {
            const accent = SESSION_ACCENTS[i % SESSION_ACCENTS.length];
            const natureBg = SESSION_NATURE_BGS[i % SESSION_NATURE_BGS.length];
            const cornerStop = isLight
              ? "rgba(255, 255, 255, 0.78)"
              : "rgba(15, 18, 24, 0.55)";
            // Wash over the nature photo so light mode reads light, dark
            // mode reads dark. Sits between the accent gradient (top) and
            // the photo (bottom).
            const tint = isLight
              ? "rgba(255, 255, 255, 0.88)"
              : "rgba(15, 18, 24, 0.86)";
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => openSession(s)}
                  style={{
                    animationDelay: `${i * 60}ms`,
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
                      {s.date} · {s.length}
                    </p>
                  </div>
                  <p className="font-display text-xl leading-tight tracking-tight text-white pr-12">
                    {s.title}
                  </p>

                  {s.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pr-12">
                      {s.tags.map((tag) => (
                        <SentimentTag
                          key={tag.label}
                          tone={tag.tone}
                          emoji={tag.emoji}
                          label={tag.label}
                        />
                      ))}
                    </div>
                  )}

                  <span
                    aria-hidden
                    className="absolute bottom-4 right-4 shrink-0 h-9 w-9 rounded-full border border-white/30 text-white inline-flex items-center justify-center"
                  >
                    <ArrowRight size={14} strokeWidth={2} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </ScreenChrome>
  );
}

// Cycled per session so each card lands on a slightly different hue —
// mirrors the home-row gradient palette.
const SESSION_ACCENTS = ["#7E84CC", "#5E9389", "#C7916A", "#7BB068"];

// Photo bgs layered behind each card's accent gradient. Cycle for variety
// so cards don't all read identically; the gradient + mode tint keep them
// from clashing.
const SESSION_NATURE_BGS = [
  "/nature/Background-3.png",
  "/nature/Background-7.png",
  "/nature/Background-11.png",
  "/nature/Background-15.png",
  "/nature/Background-19.png",
];
