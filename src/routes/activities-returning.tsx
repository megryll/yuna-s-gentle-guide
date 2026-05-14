import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, Target } from "lucide-react";
import { ScreenChrome } from "@/components/ScreenChrome";
import { YunaMark } from "@/components/YunaMark";
import {
  PERSONALIZED_ACTIVITIES,
  type Activity,
} from "@/lib/activities";

const QUICK_LINKS = [
  { name: "Goals", Icon: TargetIcon },
  { name: "Meditate", Icon: MeditateIcon },
  { name: "Gratitude Journal", Icon: BookIcon },
] as const;

export const Route = createFileRoute("/activities-returning")({
  head: () => ({ meta: [{ title: "Activities — Yuna (returning)" }] }),
  component: ActivitiesReturningScreen,
});

function ActivitiesReturningScreen() {
  const navigate = useNavigate();

  const open = (a: Activity) => {
    navigate({ to: "/chat", search: { q: a.title } });
  };

  const openLink = (title: string) => {
    navigate({ to: "/chat", search: { q: title } });
  };

  return (
    <ScreenChrome>
      <div className="flex-1 flex flex-col px-6 pb-6 yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <p className="mt-4 font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
          Tools
        </p>

        <QuickLinksSection onOpen={openLink} />

        <p className="mt-7 font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
          Activities for you
        </p>

        <ul className="mt-3 flex flex-col gap-3">
          {PERSONALIZED_ACTIVITIES.map((a, i) => (
            <li key={a.id}>
              <button
                onClick={() => open(a)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="yuna-rise w-full text-left rounded-2xl hairline bg-card p-4 hover:bg-accent transition-colors flex items-start gap-3"
              >
                <span className="h-12 w-12 shrink-0 rounded-xl hairline flex items-center justify-center bg-accent/30">
                  <YunaMark size={22} className="text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                      {a.kind}
                      {a.duration ? ` · ${a.duration}` : ""}
                    </p>
                    {a.isNew && (
                      <span className="font-sans-ui text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-full bg-green-600 text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[15px] leading-snug font-medium">
                    {a.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground italic">
                    {a.why}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </ScreenChrome>
  );
}

function QuickLinksSection({ onOpen }: { onOpen: (title: string) => void }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {QUICK_LINKS.map(({ name, Icon }) => (
        <button
          key={name}
          onClick={() => onOpen(name)}
          className="rounded-2xl hairline bg-card px-3 py-3 flex flex-col items-start gap-2 min-h-[88px] text-left active:bg-accent transition-colors"
        >
          <span className="text-muted-foreground">
            <Icon />
          </span>
          <p className="font-display text-base leading-tight mt-auto">{name}</p>
        </button>
      ))}
    </div>
  );
}

function TargetIcon() {
  return <Target size={16} strokeWidth={1.6} aria-hidden />;
}

function MeditateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 19c2-5 5-6 7-6s5 1 7 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return <BookOpen size={16} strokeWidth={1.6} aria-hidden />;
}
