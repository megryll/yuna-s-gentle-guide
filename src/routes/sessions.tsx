import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";
import { PastSessionCard } from "@/components/PastSessionCard";
import { PAST_SESSIONS, type PastSession } from "@/lib/sessions";
import { setUserType, useUserType } from "@/lib/user-type";
import { getMiddleStateSession } from "@/lib/middle-state";

export const Route = createFileRoute("/sessions")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { tooltips?: string } => ({
    tooltips: typeof s.tooltips === "string" ? s.tooltips : undefined,
  }),
  head: () => ({ meta: [{ title: "Sessions — Yuna" }] }),
  component: SessionsRoute,
});

function SessionsRoute() {
  const userType = useUserType();
  const { tooltips } = Route.useSearch();
  const tooltipsActive = tooltips === "1";

  // Tooltips deep-link sets the user type so the populated screen renders
  // behind the coachmark — pointing at a "no past sessions yet" empty state
  // would defeat the purpose of the tour.
  useEffect(() => {
    if (tooltipsActive && userType !== "returning") setUserType("returning");
  }, [tooltipsActive, userType]);

  return userType === "returning" ? (
    <SessionsReturning tooltipsActive={tooltipsActive} />
  ) : (
    <SessionsNew tooltipsActive={tooltipsActive} />
  );
}

function SessionsNew({ tooltipsActive }: { tooltipsActive: boolean }) {
  return (
    <ScreenChrome
      hideHeader
      surface="dark"
      tooltipsStep={tooltipsActive ? "sessions" : undefined}
    >
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

function SessionsReturning({ tooltipsActive }: { tooltipsActive: boolean }) {
  const navigate = useNavigate();
  const openSession = (s: Pick<PastSession, "id">) => {
    navigate({ to: "/sessions/$id", params: { id: s.id } });
  };

  // During the post-wrap-up tour, show a single "fresh from your first
  // session" card derived from the latest keepsake — the populated list
  // would lie about how much history this user actually has.
  const sessions = tooltipsActive
    ? [getMiddleStateSession()]
    : PAST_SESSIONS;

  return (
    <ScreenChrome
      hideHeader
      surface="dark"
      tooltipsStep={tooltipsActive ? "sessions" : undefined}
    >
      <div className="flex-1 flex flex-col px-6 pb-8 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <h1 className="mt-2 font-display text-3xl tracking-tight text-white">
          Past sessions
        </h1>

        <ul className="mt-6 flex flex-col gap-7">
          {sessions.map((s, i) => (
            <li key={s.id}>
              <PastSessionCard
                session={s}
                index={i}
                onClick={() => openSession(s)}
              />
            </li>
          ))}
        </ul>
      </div>
    </ScreenChrome>
  );
}
