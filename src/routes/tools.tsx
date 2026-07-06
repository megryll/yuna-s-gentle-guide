import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Badge } from "@/components/Badge";
import { useAppMode } from "@/lib/theme-prefs";
import { useAppointments } from "@/lib/therapist-prefs";
import { formatShortDate, fromISODate, getTherapist } from "@/lib/therapist-data";

type Tool = {
  id: string;
  title: string;
  caption: string;
  image: string;
  emoji: string;
  /** Optional corner badge label ("New", "Upcoming", …). */
  badge?: string;
  /** Destination route when the tool is wired up; omit for inert tiles. */
  to?: string;
};

// The therapist tile follows the user through the journey: discover → an
// upcoming appointment → a completed call waiting on its debrief. Derived in
// useTherapistTool below; this is the not-yet-booked base state.
const THERAPIST_TILE: Tool = {
  id: "therapist",
  title: "Therapist Recommendation",
  caption: "Discover licensed therapists",
  image: "/tools/therapist.jpg",
  emoji: "💬",
  to: "/therapist-recommendations",
};

function useTherapistTool(): Tool {
  const appointments = useAppointments();
  const upcoming = appointments
    .filter((a) => !a.completed)
    .slice()
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0];
  const needsDebrief = appointments.find((a) => a.completed && !a.debriefed);

  if (upcoming) {
    const name = getTherapist(upcoming.therapistId)?.name.split(" ")[0] ?? "your therapist";
    const kind = upcoming.sessionTypeId === "intro" ? "Intro call" : "Session";
    return {
      ...THERAPIST_TILE,
      title: "Your Therapist",
      caption: `${kind} with ${name} · ${formatShortDate(fromISODate(upcoming.dateISO))}, ${upcoming.time}`,
      emoji: "🗓️",
      badge: "Upcoming",
      to: "/therapist-hub",
    };
  }
  if (needsDebrief) {
    const name = getTherapist(needsDebrief.therapistId)?.name.split(" ")[0] ?? "your therapist";
    return {
      ...THERAPIST_TILE,
      title: "Your Therapist",
      caption: `How did your call with ${name} go?`,
      to: "/therapist-hub",
    };
  }
  return THERAPIST_TILE;
}

const TOOLS: Tool[] = [
  {
    id: "guided-audio",
    title: "Guided Audio",
    caption: "Personalized meditations and breathing exercises",
    image: "/tools/guided-audio.jpg",
    emoji: "🎧",
    to: "/meditation",
  },
  {
    id: "gratitude",
    title: "Gratitude Journal",
    caption: "Reflect daily on the best things in your life",
    image: "/tools/gratitude.jpg",
    emoji: "💗",
    to: "/gratitude",
  },
  {
    id: "goal-setting",
    title: "Goal Setting",
    caption: "A partner to help you reach your goals",
    image: "/tools/goal-setting.jpg",
    emoji: "🚀",
    to: "/goals",
  },
];

export const Route = createFileRoute("/tools")({
  head: () => ({ meta: [{ title: "Tools — Yuna" }] }),
  component: ToolsRoute,
});

function ToolsRoute() {
  const navigate = useNavigate();
  const therapistTool = useTherapistTool();
  const tools = [therapistTool, ...TOOLS];
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
        <h1 className="mt-2 font-display text-3xl tracking-tight text-white">Tools</h1>

        <ul className="mt-5 flex flex-col gap-3">
          {tools.map((t, i) => (
            <li key={t.id}>
              <div
                style={{ animationDelay: `${i * 60}ms` }}
                className={
                  "yuna-rise relative w-full rounded-3xl overflow-hidden aspect-[16/9] " +
                  (t.to ? "cursor-pointer active:opacity-90 transition-opacity" : "")
                }
                role={t.to ? "button" : undefined}
                tabIndex={t.to ? 0 : undefined}
                aria-label={t.to ? t.title : undefined}
                onClick={t.to ? () => navigate({ to: t.to! }) : undefined}
                onKeyDown={
                  t.to
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate({ to: t.to! });
                        }
                      }
                    : undefined
                }
              >
                <img
                  src={t.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  aria-hidden
                />
                <div className="absolute inset-0" style={{ background: overlay }} />
                {t.badge && <Badge className="absolute top-3 left-3">{t.badge}</Badge>}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className={"font-display text-xl leading-tight tracking-tight " + titleClass}>
                    {t.title}
                  </p>
                  <p
                    className={
                      "mt-1.5 flex items-center gap-1.5 text-sm leading-snug " + captionClass
                    }
                  >
                    <span aria-hidden className="text-sm leading-none">
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
