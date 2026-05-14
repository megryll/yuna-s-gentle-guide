import { createFileRoute } from "@tanstack/react-router";
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
          <Button surface="dark" variant="secondary" size="sm" className="mt-1">
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
