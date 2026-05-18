import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";
import { PastSessionCard } from "@/components/PastSessionCard";
import { PAST_SESSIONS } from "@/lib/sessions";
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
  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pb-8 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <h1 className="mt-2 font-display text-3xl tracking-tight text-white">
          Past sessions
        </h1>

        <ul className="mt-6 flex flex-col gap-7">
          {PAST_SESSIONS.map((s, i) => (
            <li key={s.id}>
              <PastSessionCard session={s} index={i} />
            </li>
          ))}
        </ul>
      </div>
    </ScreenChrome>
  );
}
