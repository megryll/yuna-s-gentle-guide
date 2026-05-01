import { createFileRoute } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";

export const Route = createFileRoute("/you")({
  head: () => ({
    meta: [
      { title: "You — Yuna" },
      { name: "description", content: "What Yuna has noticed about you." },
    ],
  }),
  component: YouScreen,
});

const PREVIEW = [
  {
    title: "Breakthroughs",
    body: "Quiet shifts you and Yuna notice together.",
    icon: <SparkIcon />,
  },
  {
    title: "Beliefs & behaviors",
    body: "Patterns that show up in how you move through your days.",
    icon: <PersonIcon />,
  },
  {
    title: "Basics",
    body: "The context Yuna holds about your life.",
    icon: <PersonIcon />,
  },
];

function YouScreen() {
  return (
    <ScreenChrome hideHeader>
      <div className="flex-1 flex flex-col px-6 pt-2 pb-10 yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center pt-4 text-center">
          <span
            className="h-24 w-24 rounded-full border-2 border-foreground flex items-center justify-center bg-background"
            aria-hidden="true"
          >
            <TreeIcon />
          </span>
          <h1 className="mt-7 font-serif text-2xl tracking-tight">
            Yuna's getting to know you
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[20rem]">
            As you have more sessions, this is where you'll see what Yuna's
            learning about you — your story, your patterns, the moments that
            matter.
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

function TreeIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="20" r="11" stroke="currentColor" strokeWidth="2" />
      <circle cx="22" cy="28" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="42" cy="28" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M32 36v18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M32 44l-4-3M32 48l4-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M22 56h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"
        stroke="currentColor"
        strokeWidth="1.6"
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
