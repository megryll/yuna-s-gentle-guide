import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, MessageCircle } from "lucide-react";
import { ScreenChrome } from "@/components/ScreenChrome";
import { PAST_SESSIONS, type PastSession } from "@/lib/sessions";
import { useUserType } from "@/lib/user-type";

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
            className="h-24 w-24 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center"
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
            here — ready to pick back up from.
          </p>
        </div>
      </div>
    </ScreenChrome>
  );
}

function SessionsReturning() {
  const navigate = useNavigate();
  const onContinue = (s: PastSession) => {
    navigate({ to: "/chat", search: { q: s.title } });
  };

  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pb-6 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <h1 className="mt-2 font-display text-3xl tracking-tight text-white">
          Past sessions
        </h1>

        <ul className="mt-5 flex flex-col gap-3">
          {PAST_SESSIONS.map((s, i) => {
            const accent = SESSION_ACCENTS[i % SESSION_ACCENTS.length];
            return (
            <li key={s.id}>
              <div
                style={{
                  animationDelay: `${i * 60}ms`,
                  backgroundImage: `linear-gradient(110deg, ${accent}99 0%, ${accent}40 35%, rgba(15, 18, 24, 0.55) 100%)`,
                }}
                className="yuna-rise rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-white/70">
                    {s.date} · {s.length}
                  </p>
                </div>
                <p className="text-[15px] leading-snug font-medium text-white">
                  {s.title}
                </p>
                <button
                  type="button"
                  onClick={() => onContinue(s)}
                  className="self-start mt-1 inline-flex items-center gap-1 rounded-full border border-white/30 px-3.5 h-8 text-[12px] text-white active:bg-white/15 transition-colors"
                >
                  Continue
                  <ChevronRight size={13} strokeWidth={1.75} aria-hidden />
                </button>
              </div>
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
