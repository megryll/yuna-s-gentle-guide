import { createFileRoute } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";

type Tool = {
  id: string;
  title: string;
  caption: string;
  image: string;
  emoji: string;
  isNew?: boolean;
};

const TOOLS: Tool[] = [
  {
    id: "therapist",
    title: "Therapist Recommendation",
    caption: "Discover licensed therapists",
    image: "/tools/therapist.jpg",
    emoji: "💬",
    isNew: true,
  },
  {
    id: "guided-audio",
    title: "Guided Audio",
    caption: "Personalized meditations and breathing exercises",
    image: "/tools/guided-audio.jpg",
    emoji: "🎧",
  },
  {
    id: "gratitude",
    title: "Gratitude Journal",
    caption: "Reflect daily on the best things in your life",
    image: "/tools/gratitude.jpg",
    emoji: "💗",
  },
  {
    id: "goal-setting",
    title: "Goal Setting",
    caption: "A partner to help you reach your goals",
    image: "/tools/goal-setting.jpg",
    emoji: "🚀",
  },
];

export const Route = createFileRoute("/tools")({
  head: () => ({ meta: [{ title: "Tools — Yuna" }] }),
  component: ToolsRoute,
});

function ToolsRoute() {
  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pb-6 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <h1 className="mt-2 font-display text-3xl tracking-tight text-white">
          Tools
        </h1>

        <ul className="mt-5 flex flex-col gap-3">
          {TOOLS.map((t, i) => (
            <li key={t.id}>
              <div
                style={{ animationDelay: `${i * 60}ms` }}
                className="yuna-rise relative w-full rounded-2xl overflow-hidden aspect-[16/9]"
              >
                <img
                  src={t.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                {t.isNew && (
                  <span
                    className="absolute top-3 left-3 font-sans-ui text-[10px] tracking-[0.2em] uppercase px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: "#66BA24" }}
                  >
                    New
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-display text-xl leading-tight tracking-tight text-white">
                    {t.title}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] leading-snug text-white/90">
                    <span aria-hidden className="text-[14px] leading-none">
                      {t.emoji}
                    </span>
                    {t.caption}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ScreenChrome>
  );
}
