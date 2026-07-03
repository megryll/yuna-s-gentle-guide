import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";
import { IconMedallion } from "@/components/IconMedallion";
import { PastSessionCard } from "@/components/PastSessionCard";
import { Toast, ToastViewport } from "@/components/Toast";
import { useSessions } from "@/lib/sessions";
import { consumeSessionToast } from "@/lib/session-toast";
import { useTransientToast } from "@/lib/use-transient-toast";
import { useUserType } from "@/lib/user-type";
import { useStartChat } from "@/lib/chat-launch";

export const Route = createFileRoute("/sessions")({
  // `?from=you` marks an entry pushed from the You tab's Chats tile, which gets a
  // back arrow. Arriving via the AppBar tab carries no param and shows none.
  validateSearch: (search: Record<string, unknown>): { from?: "you" } =>
    search.from === "you" ? { from: "you" } : {},
  head: () => ({ meta: [{ title: "Sessions — Yuna" }] }),
  component: SessionsRoute,
});

function SessionsRoute() {
  const userType = useUserType();

  return userType === "returning" ? <SessionsReturning /> : <SessionsNew />;
}

// Sessions is a primary tab, so it has no header by default. Only when entered
// from the You tab's Chats tile (?from=you) does a back arrow appear, to return
// there; arriving via the AppBar tab shows none.
function BackArrow() {
  const router = useRouter();
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  if (from !== "you") return null;
  const back = () =>
    router.history.canGoBack() ? router.history.back() : navigate({ to: "/you" });
  return (
    <header className="shrink-0 mb-3">
      <Button surface="dark" variant="secondary" size="icon" aria-label="Back" onClick={back}>
        <ChevronLeft strokeWidth={1.5} />
      </Button>
    </header>
  );
}

function SessionsNew() {
  const startChat = useStartChat();
  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pb-10 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <BackArrow />
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <IconMedallion size="xl">
            <MessageCircle size={32} strokeWidth={1.4} className="text-white/70" aria-hidden />
          </IconMedallion>
          <h1 className="mt-7 font-display text-2xl tracking-tight text-white">
            No past sessions yet
          </h1>
          <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-[20rem]">
            Once you finish your first chat or call with Yuna, you'll find it here.
          </p>
          <Button surface="dark" variant="primary" className="mt-7" onClick={() => startChat()}>
            Start your first conversation
          </Button>
        </div>
      </div>
    </ScreenChrome>
  );
}

function SessionsReturning() {
  const navigate = useNavigate();
  const sessions = useSessions();
  const { message: toast, show, dismiss } = useTransientToast();

  // Pick up a one-shot confirmation handed off from a detail screen (e.g. after
  // deleting a conversation); the hook auto-dismisses it.
  useEffect(() => {
    const message = consumeSessionToast();
    if (message) show(message);
  }, [show]);

  return (
    <ScreenChrome hideHeader surface="dark">
      <ToastViewport>
        {toast && (
          <Toast
            surface="dark"
            variant="success"
            message={toast}
            onDismiss={dismiss}
          />
        )}
      </ToastViewport>

      <div className="flex-1 flex flex-col px-6 pb-8 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <BackArrow />
        <h1 className="mt-2 font-display text-3xl tracking-tight text-white">Past sessions</h1>

        <ul className="mt-6 flex flex-col gap-4">
          {sessions.map((s, i) => (
            <li key={s.id} className="yuna-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <PastSessionCard
                session={s}
                index={i}
                onClick={() => navigate({ to: "/sessions/$id", params: { id: s.id } })}
              />
            </li>
          ))}
        </ul>
      </div>
    </ScreenChrome>
  );
}
