import { createFileRoute } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";
import { useUserType } from "@/lib/user-type";

export const Route = createFileRoute("/you")({
  head: () => ({
    meta: [
      { title: "You — Yuna" },
      { name: "description", content: "What Yuna has noticed about you." },
    ],
  }),
  component: YouRoute,
});

const PREVIEW = [
  {
    title: "Breakthroughs",
    body: "Quiet shifts you and Yuna notice together.",
  },
  {
    title: "Beliefs & behaviors",
    body: "Patterns that show up in how you move through your days.",
  },
  {
    title: "Basics",
    body: "The context Yuna holds about your life.",
  },
];

function YouRoute() {
  const userType = useUserType();
  return userType === "returning" ? <YouReturning /> : <YouNew />;
}

function YouReturning() {
  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-white yuna-fade-in">
        <p className="font-display text-2xl tracking-tight text-white text-center">
          returning user: You
        </p>
      </div>
    </ScreenChrome>
  );
}

function YouNew() {
  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pt-2 pb-10 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center pt-4 text-center">
          <span
            className="h-24 w-24 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm"
            aria-hidden="true"
          />
          <h1 className="mt-7 font-display text-2xl tracking-tight text-white">
            Yuna's getting to know you
          </h1>
          <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-[20rem]">
            As you have more sessions, this is where you'll see what Yuna's
            learning about you — your story, your patterns, the moments that
            matter.
          </p>
        </div>

        <p className="mt-10 mb-3 font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/65 text-center">
          What will appear here
        </p>
        <ul className="flex flex-col gap-2.5">
          {PREVIEW.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-4 flex items-start gap-3"
            >
              <span
                className="h-9 w-9 rounded-full bg-white/10 border border-white/20 shrink-0"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] leading-snug font-medium text-white">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/70">
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
