import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";
import { setUserType, useUserType } from "@/lib/user-type";
import { getProfileData, type Insight } from "@/lib/profile-data";
import { getMiddleStateInsight } from "@/lib/middle-state";
import {
  EmptyStateCard,
  FocusAreaBentoCard,
  InsightCard,
  MoreButton,
  ProgressRing,
} from "@/components/profile-components";

export const Route = createFileRoute("/you")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { tooltips?: string } => ({
    tooltips: typeof s.tooltips === "string" ? s.tooltips : undefined,
  }),
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
  const { tooltips } = Route.useSearch();
  const tooltipsActive = tooltips === "1";

  // Deep-linking into the tour must show the populated profile, not the
  // empty state — otherwise there's nothing for the tooltip to point at.
  useEffect(() => {
    if (tooltipsActive && userType !== "returning") setUserType("returning");
  }, [tooltipsActive, userType]);

  if (userType === "new") return <YouEmptyState tooltipsActive={tooltipsActive} />;
  if (tooltipsActive) return <YouMiddleState />;
  const data = getProfileData(userType);

  return (
    <ScreenChrome
      hideHeader
      surface="dark"
      tooltipsStep={tooltipsActive ? "you" : undefined}
    >
      <div className="flex-1 flex flex-col px-6 pt-2 pb-12 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex justify-center pt-4">
          <ProgressRing progress={data.progress} icon={data.ringIcon} />
        </div>

        <div className="flex gap-2 mt-6">
          {[
            { value: data.conversations, label: "Conversations" },
            { value: data.messages, label: "Messages" },
            { value: data.insights, label: "Insights" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm py-5 px-2 flex flex-col items-center gap-1"
            >
              <span
                className="font-display font-normal text-white"
                style={{ fontSize: 26, lineHeight: "30px" }}
              >
                {stat.value}
              </span>
              <span className="font-sans-ui text-[10px] font-medium tracking-[0.12em] uppercase text-white/75">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-8 mt-10">
          <Section heading="Focus Areas">
            <div className="flex gap-2">
              <FocusAreaBentoCard num={1} title={data.focusArea1.title} taskCount={data.tasks1.length} />
              <FocusAreaBentoCard num={2} title={data.focusArea2.title} taskCount={data.tasks2.length} />
            </div>
          </Section>

          <Section heading="Breakthroughs">
            {data.breakthroughs ? (
              <ListOfInsights insights={data.breakthroughs} accentLeft />
            ) : (
              <EmptyStateCard
                heading="None yet, keep chatting"
                body="Breakthroughs happen gradually, then suddenly. As real shifts emerge in your thinking, Yuna will mark them here."
                leafSrc="/assets/profile/empty-leaf-2.svg"
              />
            )}
          </Section>

          <Section heading="Beliefs & Behaviors">
            {data.beliefs ? (
              <>
                <ListOfInsights insights={data.beliefs} />
                {data.beliefsMore > 0 && <MoreButton count={data.beliefsMore} />}
              </>
            ) : (
              <EmptyStateCard
                heading="None yet, keep chatting"
                body="As your conversations deepen, Yuna will surface the core beliefs shaping how you see the world, and the recurring patterns that tend to follow from them."
                leafSrc="/assets/profile/empty-leaf-1.svg"
              />
            )}
          </Section>

          <Section heading="Basics">
            <ListOfInsights insights={data.basics} />
            {data.basicsMore > 0 && <MoreButton count={data.basicsMore} />}
          </Section>
        </div>

        <div className="flex flex-col items-center gap-3 mt-10">
          <p className="font-display text-[20px] leading-7 text-white/90 text-center">
            Something feel off?
          </p>
          <p className="text-[14px] leading-[22px] text-white/75 text-center max-w-[20rem]">
            Yuna's understanding grows over time. If anything here doesn't feel right, you can help refine it.
          </p>
          <Button surface="dark" variant="secondary" size="md" className="mt-1">
            Help Yuna understand you better
          </Button>
        </div>
      </div>
    </ScreenChrome>
  );
}

// ─── Tooltip middle state ───────────────────────────────────────────────────
// Mirrors the layout of the populated YouRoute but trims to what would
// realistically exist after one conversation: a barely-started ring, single-
// digit stats, and one early insight. Used as the background while the
// tooltips coach is active so the tour doesn't oversell what Yuna knows.

function YouMiddleState() {
  const insight = getMiddleStateInsight();
  return (
    <ScreenChrome hideHeader surface="dark" tooltipsStep="you">
      <div className="flex-1 flex flex-col px-6 pt-2 pb-12 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex justify-center pt-4">
          <ProgressRing progress={0.05} icon="/assets/profile/emerging.png" />
        </div>

        <div className="flex gap-2 mt-6">
          {[
            { value: 1, label: "Conversations" },
            { value: 8, label: "Messages" },
            { value: 1, label: "Insights" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm py-5 px-2 flex flex-col items-center gap-1"
            >
              <span
                className="font-display font-normal text-white"
                style={{ fontSize: 26, lineHeight: "30px" }}
              >
                {stat.value}
              </span>
              <span className="font-sans-ui text-[10px] font-medium tracking-[0.12em] uppercase text-white/75">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 mt-10">
          <h2 className="font-display text-[20px] leading-7 text-white text-center">
            What I'm starting to notice
          </h2>
          <InsightCard insight={insight} />
        </div>
      </div>
    </ScreenChrome>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-[20px] leading-7 text-white text-center">{heading}</h2>
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

function YouEmptyState({ tooltipsActive }: { tooltipsActive: boolean }) {
  return (
    <ScreenChrome
      hideHeader
      surface="dark"
      tooltipsStep={tooltipsActive ? "you" : undefined}
    >
      <div className="flex-1 flex flex-col px-6 pt-2 pb-12 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center text-center pt-10">
          <EmptyHeroGlow />
          <h1 className="font-display text-[26px] leading-[1.15] tracking-tight mt-6">
            Your space, just beginning
          </h1>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <PreviewRow
            heading="Focus Areas"
            body="Where we'll be working together"
          />
          <PreviewRow
            heading="Breakthroughs"
            body="Real shifts in your thinking, as they emerge"
          />
          <PreviewRow
            heading="Beliefs & Behaviors"
            body="Patterns I'll start to notice as we talk"
          />
          <PreviewRow
            heading="Basics"
            body="The context I'll hold in mind for you"
          />
        </div>

        <div className="mt-10 flex justify-center">
          <Button surface="dark" variant="primary" asChild>
            <Link to="/chat">Start your first conversation</Link>
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
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center"
      >
        <img
          src="/assets/profile/emerging.png"
          alt=""
          aria-hidden="true"
          style={{ width: 56, height: 56 }}
        />
      </span>
    </div>
  );
}

function PreviewRow({ heading, body }: { heading: string; body: string }) {
  return (
    <div
      className="rounded-2xl border border-dashed border-white/25 bg-white/[0.04] backdrop-blur-sm px-4 py-3.5"
    >
      <p className="font-sans-ui text-[11px] font-semibold tracking-[0.1em] uppercase text-white/65">
        {heading}
      </p>
      <p className="text-[14px] leading-[20px] text-white/65 mt-1">
        {body}
      </p>
    </div>
  );
}
