import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { WebShell, WebContent } from "@/components/WebShell";
import { Button } from "@/components/Button";
import { IconMedallion } from "@/components/IconMedallion";
import { PastSessionCard } from "@/components/PastSessionCard";
import { Toast } from "@/components/Toast";
import { useSessions } from "@/lib/sessions";
import { consumeSessionToast } from "@/lib/session-toast";
import { useTransientToast } from "@/lib/use-transient-toast";
import { useUserType } from "@/lib/user-type";
import { useStartChat } from "@/lib/chat-launch";
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
  const startChat = useStartChat();
  return (
    <WebShell>
      <WebContent width="max-w-xl" className="min-h-[60vh] flex flex-col justify-center">
        <div className="flex flex-col items-center text-center yuna-fade-in">
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
      </WebContent>
    </WebShell>
  );
}

function SessionsReturning() {
  const navigate = useNavigate();
  const sessions = useSessions();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const { message: toast, show, dismiss } = useTransientToast();

  // Pick up a one-shot confirmation handed off from a detail screen (e.g. after
  // deleting a conversation); the hook auto-dismisses it.
  useEffect(() => {
    const message = consumeSessionToast();
    if (message) show(message);
  }, [show]);

  return (
    <WebShell>
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,420px)]">
          <Toast surface={surface} variant="success" message={toast} onDismiss={dismiss} />
        </div>
      )}

      <WebContent>
        <h1 className="font-display text-3xl lg:text-4xl tracking-tight text-white">
          Past sessions
        </h1>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </WebContent>
    </WebShell>
  );
}
