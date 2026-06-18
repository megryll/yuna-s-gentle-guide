import {
  ClipboardList,
  Flower2,
  GraduationCap,
  MessageCircle,
  NotebookPen,
  Target,
  type LucideIcon,
} from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";
import { IconMedallion } from "@/components/IconMedallion";
import { Surface } from "@/components/Surface";
import { DimensionTrends } from "@/components/DimensionTrends";
import { useAppMode } from "@/lib/theme-prefs";
import { useUserType } from "@/lib/user-type";
import { useStartChat } from "@/lib/chat-launch";
import {
  getProfileData,
  type Insight,
  type ProfileStats,
} from "@/lib/profile-data";

// The activity stat grid, in display order. "Skills Learned" sits second; the
// rest follow in sequence. Each key reads its tally off ProfileData.stats, and
// `to` deep-links the tile to its destination screen.
const STAT_CARDS: {
  key: keyof ProfileStats;
  label: string;
  icon: LucideIcon;
  to: string;
  search?: Record<string, unknown>;
}[] = [
  { key: "chats", label: "Chats", icon: MessageCircle, to: "/sessions", search: { from: "you" } },
  { key: "skills", label: "Skills", icon: GraduationCap, to: "/all-tasks", search: { type: "skill" } },
  { key: "questionnaires", label: "Questionnaires", icon: ClipboardList, to: "/all-tasks", search: { type: "questionnaire" } },
  { key: "gratitude", label: "Days of Gratitude", icon: NotebookPen, to: "/all-tasks", search: { type: "gratitude" } },
  { key: "meditations", label: "Meditations", icon: Flower2, to: "/all-tasks", search: { type: "meditation" } },
  { key: "goals", label: "Goals", icon: Target, to: "/all-tasks", search: { type: "goal" } },
];
import {
  EmptyStateCard,
  FocusAreaBentoCard,
  InsightCard,
  ProgressRing,
} from "@/components/profile-components";

// Round-robin merge: take the first of each list, then the second of each, …
// so a fixed-length slice spans categories instead of draining the first list.
function interleave<T>(...lists: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const list of lists) if (i < list.length) out.push(list[i]);
  }
  return out;
}

export const Route = createFileRoute("/you")({
  head: () => ({
    meta: [
      { title: "You — Yuna" },
      { name: "description", content: "What Yuna has noticed about you." },
    ],
  }),
  component: YouRoute,
});

function YouRoute() {
  const userType = useUserType();
  const navigate = useNavigate();
  const surface = useAppMode() === "light" ? "light" : "dark";

  if (userType === "new") return <YouEmptyState />;
  const data = getProfileData(userType);

  // A mix of recently surfaced insights — one from each category in turn
  // (breakthrough, belief, basic, …) so the preview spans the picture rather
  // than showing three of one kind. The full set lives on /your-insights.
  const recent = interleave(
    data.breakthroughs ?? [],
    data.beliefs ?? [],
    data.basics,
  ).slice(0, 3);
  const totalInsights =
    (data.breakthroughs?.length ?? 0) + (data.beliefs?.length ?? 0) + data.basics.length;

  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pt-2 pb-12 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center justify-center gap-4 pt-4">
          <ProgressRing progress={data.progress} icon={data.ringIcon} size={64} />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl leading-none text-white">{data.name}</h1>
            <p className="text-sm leading-none text-white/75">
              Profile Stage: <span className="text-white/90">{data.stage}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-6">
          {STAT_CARDS.map(({ key, label, icon: Icon, to, search }) => (
            <Link
              key={key}
              to={to}
              search={search as never}
              className="block active:opacity-90 transition-opacity"
            >
              <Surface radius="xl" className="h-full flex items-center gap-2.5 px-3 py-2.5">
                <Icon size={26} strokeWidth={1.5} className="shrink-0 text-white/85" aria-hidden />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-display font-normal text-2xl leading-none text-white">
                    {data.stats[key]}
                  </span>
                  <span className="text-[13px] leading-[16px] text-white/75">{label}</span>
                </div>
              </Surface>
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-8 mt-10">
          <Section heading="Focus Areas">
            <div className="flex gap-2">
              <FocusAreaBentoCard
                num={1}
                title={data.focusArea1.title}
                taskCount={data.tasks1.length}
              />
              <FocusAreaBentoCard
                num={2}
                title={data.focusArea2.title}
                taskCount={data.tasks2.length}
              />
            </div>
          </Section>

          <Section heading="Progress">
            <DimensionTrends surface={surface} navigate={navigate} />
          </Section>

          <Section heading="Recent Insights">
            {recent.length > 0 ? (
              <>
                <ListOfInsights insights={recent} />
                <Button
                  surface="dark"
                  variant="secondary"
                  fullWidth
                  className="mt-1"
                  onClick={() => navigate({ to: "/your-insights" })}
                >
                  View all {totalInsights} insights
                </Button>
              </>
            ) : (
              <EmptyStateCard
                heading="None yet, keep chatting"
                body="As your conversations deepen, Yuna will surface what she's noticing about you here."
                leafSrc="/assets/profile/empty-leaf-1.svg"
              />
            )}
          </Section>
        </div>
      </div>
    </ScreenChrome>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xl leading-7 text-white text-center">{heading}</h2>
      {children}
    </div>
  );
}

function ListOfInsights({ insights, accentLeft }: { insights: Insight[]; accentLeft?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {insights.map((insight, i) => (
        <InsightCard key={i} insight={insight} accentLeft={accentLeft} />
      ))}
    </div>
  );
}

// ─── Empty state (no conversations yet) ─────────────────────────────────────

function YouEmptyState() {
  const startChat = useStartChat();
  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pt-2 pb-12 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center text-center pt-10">
          <EmptyHeroGlow />
          <h1 className="font-display text-2xl leading-[1.15] tracking-tight mt-6">
            Your space, just beginning
          </h1>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <PreviewRow heading="Focus Areas" body="Where we'll be working together" />
          <PreviewRow heading="Breakthroughs" body="Real shifts in your thinking, as they emerge" />
          <PreviewRow
            heading="Beliefs & Behaviors"
            body="Patterns I'll start to notice as we talk"
          />
        </div>

        <div className="mt-10 flex justify-center">
          <Button surface="dark" variant="primary" onClick={() => startChat()}>
            Start your first conversation
          </Button>
        </div>
      </div>
    </ScreenChrome>
  );
}

function EmptyHeroGlow() {
  return (
    <div className="relative" style={{ width: 96, height: 96 }}>
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
        style={{
          width: 220,
          height: 220,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.14) 28%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 70%)",
          animation: "glow-breathe 7.5s ease-in-out infinite",
          filter: "blur(2px)",
          transform: "translate(-50%, -50%)",
          willChange: "transform, opacity",
        }}
      />
      <IconMedallion
        size="xl"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <img
          src="/assets/profile/emerging.png"
          alt=""
          aria-hidden="true"
          style={{ width: 56, height: 56 }}
        />
      </IconMedallion>
    </div>
  );
}

function PreviewRow({ heading, body }: { heading: string; body: string }) {
  return (
    <Surface dashed className="px-4 py-3.5">
      <p className="text-uppercase font-semibold tracking-[0.1em] uppercase text-white/75">
        {heading}
      </p>
      <p className="text-sm leading-[20px] text-white/75 mt-1">{body}</p>
    </Surface>
  );
}
