import { createFileRoute } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";
import { useAppMode } from "@/lib/theme-prefs";

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
  const mode = useAppMode();
  const isLight = mode === "light";
  // Light mode: lift the photo with a white wash so the title reads dark.
  // Dark mode: existing tar-to-light gradient keeps the white title legible.
  const overlay = isLight
    ? "linear-gradient(to top, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0.15) 100%)"
    : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.10) 100%)";
  const titleClass = isLight ? "text-foreground" : "text-white";
  const captionClass = isLight ? "text-foreground/80" : "text-white/90";

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
                <div
                  className="absolute inset-0"
                  style={{ background: overlay }}
                />
                {t.isNew && (
                  <span
                    className="absolute top-3 left-3 font-sans-ui text-[10px] tracking-[0.2em] uppercase px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: "#66BA24" }}
                  >
                    New
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className={"font-display text-xl leading-tight tracking-tight " + titleClass}>
                    {t.title}
                  </p>
                  <p className={"mt-1.5 flex items-center gap-1.5 text-[13px] leading-snug " + captionClass}>
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
