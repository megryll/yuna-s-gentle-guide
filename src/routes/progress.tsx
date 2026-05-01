import { createFileRoute } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — Yuna" }] }),
  component: ProgressScreen,
});

const PREVIEW = [
  {
    title: "Mood & stress trends",
    body: "Where things are gently shifting from week to week.",
    icon: <TrendIcon />,
  },
  {
    title: "Past sessions",
    body: "A quiet log of conversations to pick back up from.",
    icon: <ClockIcon />,
  },
  {
    title: "Self-assessments",
    body: "Check-ins on self-esteem, anxiety, and depression over time.",
    icon: <ChartIcon />,
  },
];

function ProgressScreen() {
  return (
    <ScreenChrome hideHeader>
      <div className="flex-1 flex flex-col px-6 pt-2 pb-10 yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center pt-4 text-center">
          <span
            className="h-24 w-24 rounded-full border-2 border-foreground flex items-center justify-center bg-background"
            aria-hidden="true"
          >
            <SparklineIcon />
          </span>
          <h1 className="mt-7 font-serif text-2xl tracking-tight">
            Your progress lives here
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[20rem]">
            After a few sessions, Yuna will surface patterns from your
            conversations and track how you're doing — gently, never as a
            scoreboard.
          </p>
        </div>

        <p className="mt-10 mb-3 font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground text-center">
          What will appear here
        </p>
        <ul className="flex flex-col gap-2.5">
          {PREVIEW.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl hairline bg-card p-4 flex items-start gap-3"
            >
              <span
                className="h-9 w-9 rounded-full border border-border flex items-center justify-center shrink-0 bg-muted/40 text-foreground"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] leading-snug font-medium">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ScreenChrome>
  );
}

function SparklineIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M10 42c6-1 10-6 14-12s8-12 14-14 10 1 16 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="10" cy="42" r="2.4" fill="currentColor" />
      <circle cx="24" cy="30" r="2.4" fill="currentColor" />
      <circle cx="38" cy="22" r="2.4" fill="currentColor" />
      <circle cx="54" cy="22" r="2.4" fill="currentColor" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16l5-5 4 3 7-7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 7h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19V9M11 19V5M17 19v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 21h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
