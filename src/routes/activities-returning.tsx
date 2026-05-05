import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";
import { YunaMark } from "@/components/YunaMark";
import {
  PERSONALIZED_ACTIVITIES,
  RETURNING_THEMES,
  type Activity,
} from "@/lib/activities";

export const Route = createFileRoute("/activities-returning")({
  head: () => ({ meta: [{ title: "Activities — Yuna (returning)" }] }),
  component: ActivitiesReturningScreen,
});

function ActivitiesReturningScreen() {
  const navigate = useNavigate();

  const open = (a: Activity) => {
    navigate({ to: "/chat", search: { q: a.title } });
  };

  return (
    <ScreenChrome>
      <div className="flex-1 flex flex-col px-6 pb-6 yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mt-4 yuna-rise">
          <h1 className="text-2xl leading-snug tracking-tight">
            Your activities
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-[20rem]">
            Chosen for the highest impact on your long-term goals and growth.
          </p>
        </div>

        <ThemesSection />

        <ul className="mt-7 flex flex-col gap-3">
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

function ThemesSection() {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
        Working on
      </p>
      <div className="grid grid-cols-3 gap-2">
        {RETURNING_THEMES.map((name) => (
          <ThemeCard key={name} name={name} />
        ))}
      </div>
    </div>
  );
}

function ThemeCard({ name }: { name: string }) {
  return (
    <div className="rounded-2xl hairline bg-card px-3 py-3 flex flex-col items-start gap-2 min-h-[88px]">
      <span className="text-muted-foreground">
        <ThreadsIcon />
      </span>
      <p className="font-display text-base leading-tight mt-auto">{name}</p>
    </div>
  );
}

function ThreadsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h12M4 12h16M4 17h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="19" cy="7" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}
