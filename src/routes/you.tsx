import { createFileRoute, Link } from "@tanstack/react-router";
import { ScreenChrome } from "@/components/ScreenChrome";
import { Button } from "@/components/Button";
import { useUserType } from "@/lib/user-type";
import { getProfileData, type Insight } from "@/lib/profile-data";
import {
  EmptyStateCard,
  FocusAreaBentoCard,
  InsightCard,
  MoreButton,
  ProgressRing,
} from "@/components/profile-components";

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
  if (userType === "new") return <YouEmptyState />;
  const data = getProfileData(userType);

  return (
    <ScreenChrome hideHeader surface="dark">
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
                body="As your conversations deepen, Yuna will surface the core beliefs shaping how you see the world — and the recurring patterns that tend to follow from them."
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

function YouEmptyState() {
  return (
    <ScreenChrome hideHeader surface="dark">
      <div className="flex-1 flex flex-col px-6 pt-2 pb-12 text-white yuna-fade-in overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center text-center pt-10">
          <EmptyHeroGlow />
          <h1 className="font-display text-[26px] leading-[1.15] tracking-tight mt-6">
            Your space, just beginning
          </h1>
          <p className="text-[15px] leading-[22px] text-white/80 mt-3 max-w-[20rem]">
            Once we start talking, this is where I'll share what I'm noticing —
            patterns, shifts in your thinking, and the things worth keeping
            close.
          </p>
        </div>

        <p className="font-sans-ui text-[11px] font-semibold tracking-[0.14em] uppercase text-white/55 text-center mt-12">
          What will live here
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
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
        aria-hidden
        className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
        style={{
          width: 72,
          height: 72,
          background:
            "conic-gradient(from 0deg, rgba(255,255,255,0.95), rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.95))",
          WebkitMask:
            "radial-gradient(circle, transparent 56%, #000 60%, #000 96%, transparent 100%)",
          mask: "radial-gradient(circle, transparent 56%, #000 60%, #000 96%, transparent 100%)",
          animation: "glow-spin 9s linear infinite",
          filter: "blur(1.5px)",
          transform: "translate(-50%, -50%)",
          willChange: "transform",
        }}
      />
      <img
        src="/avatar.png"
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 56, height: 56 }}
      />
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
