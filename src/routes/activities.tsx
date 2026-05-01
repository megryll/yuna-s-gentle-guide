import { createFileRoute } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";

export const Route = createFileRoute("/activities")({
  head: () => ({ meta: [{ title: "Activities — Yuna" }] }),
  component: ActivitiesScreen,
});

const PREVIEW = [
  {
    title: "Personalized meditations",
    body: "Audio sessions tuned to where you are this week.",
    icon: <SparkIcon />,
  },
  {
    title: "Affirmations",
    body: "Small daily reminders that steady you.",
    icon: <SunIcon />,
  },
  {
    title: "Tools & exercises",
    body: "Box breathing, gratitude lists, and skills you can practice.",
    icon: <ToolIcon />,
  },
];

function ActivitiesScreen() {
  return (
    <ScreenChrome hideHeader>
      <div className="flex-1 flex flex-col px-6 pt-2 pb-10 yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center pt-4 text-center">
          <span
            className="h-24 w-24 rounded-full border-2 border-foreground flex items-center justify-center bg-background"
            aria-hidden="true"
          >
            <BasketIcon />
          </span>
          <h1 className="mt-7 font-serif text-2xl tracking-tight">
            Your activities will live here
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[20rem]">
            After your first session, Yuna will hand-pick meditations,
            affirmations, and tools just for you — refreshed as your needs
            shift.
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

function BasketIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M14 26h36l-3 22a4 4 0 0 1-4 3.5H21a4 4 0 0 1-4-3.5L14 26z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M22 26l4-10M42 26l-4-10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M10 26h44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M28 34v8M36 34v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3.5 3.5M14.5 14.5L18 18M18 6l-3.5 3.5M9.5 14.5L6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ToolIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M6 4v14" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 9h6M10 13h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
