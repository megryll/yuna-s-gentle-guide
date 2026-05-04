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
  },
  {
    title: "Past sessions",
    body: "A quiet log of conversations to pick back up from.",
  },
  {
    title: "Self-assessments",
    body: "Check-ins on self-esteem, anxiety, and depression over time.",
  },
];

function ProgressScreen() {
  return (
    <ScreenChrome hideHeader>
      <div className="flex-1 flex flex-col px-6 pt-2 pb-10 yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center pt-4 text-center">
          <span
            className="h-24 w-24 rounded-full bg-muted"
            aria-hidden="true"
          />
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
                className="h-9 w-9 rounded-full bg-muted shrink-0"
                aria-hidden="true"
              />
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

