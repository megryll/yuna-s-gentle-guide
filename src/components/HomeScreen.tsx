import { useNavigate } from "@tanstack/react-router";
import { YunaMark } from "@/components/YunaMark";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";

const firstTimeSuggestions = [
  "I'm just exploring the app.",
  "I have a topic in mind.",
  "Get to know me first.",
];

type FollowUp = {
  eyebrow?: string;
  title: string;
};

const followUps: FollowUp[] = [
  {
    eyebrow: "a topic for you",
    title: "Your Experience of Grief",
  },
  {
    eyebrow: "continue our conversation",
    title: "Staying Present in the Evenings",
  },
  {
    title: "Talk about something else",
  },
];

const activities = [
  { title: "Guided breath", note: "3 min · Meditation" },
  { title: "Set a small goal", note: "Goals" },
  { title: "Learn: name the feeling", note: "Skill · 4 min" },
];

export function HomeScreen({ variant }: { variant: "new" | "returning" }) {
  const navigate = useNavigate();

  const returning = variant === "returning";

  const open = (initial: string) => {
    if (!initial.trim()) return;
    navigate({ to: "/chat", search: { q: initial } });
  };

  return (
    <ScreenChrome>
      <div className="flex-1 flex flex-col px-6 pb-4 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mt-6 yuna-rise">
          <h1 className="text-2xl leading-snug tracking-tight">
            {returning ? "Welcome back." : "Where shall we begin?"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-[18rem]">
            {returning ? "What should we dig into?" : "Pick a thread, or start one of your own."}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {returning
            ? followUps.map((f, i) => (
                <button
                  key={f.title}
                  onClick={() => open(f.title)}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="yuna-rise text-left rounded-2xl hairline px-5 py-4 hover:bg-accent transition-colors flex items-center gap-3"
                >
                  <span className="flex-1 min-w-0">
                    {f.eyebrow && (
                      <span className="block font-sans-ui text-[11px] text-muted-foreground mb-0.5">
                        {f.eyebrow}
                      </span>
                    )}
                    <span className="block text-sm leading-snug">{f.title}</span>
                  </span>
                  <Chevron />
                </button>
              ))
            : firstTimeSuggestions.map((s, i) => (
                <button
                  key={s}
                  onClick={() => open(s)}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="yuna-rise text-left rounded-2xl hairline px-5 py-4 hover:bg-accent transition-colors flex items-center gap-3"
                >
                  <span className="flex-1 text-sm leading-snug">{s}</span>
                  <Chevron />
                </button>
              ))}
        </div>

        {returning && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                Try an activity
              </p>
              <Button
                surface="light"
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/activities" })}
              >
                View all
              </Button>
            </div>
            <div className="-mx-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-3 px-6 pb-1">
                {activities.map((a) => (
                  <button
                    key={a.title}
                    onClick={() => open(a.title)}
                    className="shrink-0 w-44 text-left rounded-2xl hairline p-4 hover:bg-accent transition-colors"
                  >
                    <div className="h-16 rounded-lg hairline mb-3 flex items-center justify-center">
                      <YunaMark size={22} className="text-primary" />
                    </div>
                    <p className="text-sm leading-snug">{a.title}</p>
                    <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">
                      {a.note}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <Button
              surface="light"
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/progress" })}
              className="mt-3 self-start"
            >
              <span className="font-sans-ui">
                <span className="tabular-nums font-medium">8</span> completed today
              </span>
              <Chevron />
            </Button>
          </div>
        )}
      </div>
    </ScreenChrome>
  );
}

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="text-muted-foreground shrink-0"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
