import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import {
  EmptyStateCard,
  InsightCard,
  MoreButton,
} from "@/components/profile-components";
import { useAppMode } from "@/lib/theme-prefs";
import { useUserType } from "@/lib/user-type";
import {
  getProfileData,
  INSIGHT_PREVIEW_COUNT,
  type Insight,
  type InsightCategory,
} from "@/lib/profile-data";

// ─── Your Insights ───────────────────────────────────────────────────────────
// The full picture Yuna has built — Breakthroughs, Beliefs & Behaviors, and
// Basics — reached via "View all" from the You tab's condensed Recent Insights.
// Each category previews a few and links into /insights/$category for the rest.
// Photo-bg cluster; follows the Light/Dark toggle.

export const Route = createFileRoute("/your-insights")({
  head: () => ({ meta: [{ title: "Insights — Yuna" }] }),
  component: YourInsightsRoute,
});

function YourInsightsRoute() {
  const navigate = useNavigate();
  const router = useRouter();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const userType = useUserType();
  const data = getProfileData(userType);

  const back = () =>
    router.history.canGoBack() ? router.history.back() : navigate({ to: "/you" });
  const openInsights = (category: InsightCategory) =>
    navigate({ to: "/insights/$category", params: { category } });

  return (
    <PhoneFrame themed>
      <div className="relative flex-1 flex flex-col text-white min-h-0">
        <header className="shrink-0 px-6 pt-14 pb-2 flex items-center">
          <Button surface={surface} variant="secondary" size="icon" aria-label="Back" onClick={back}>
            <ChevronLeft strokeWidth={1.5} />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-12 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="pt-2 flex flex-col items-center text-center gap-2">
            <h1 className="font-display text-3xl leading-tight tracking-tight text-white">
              Insights
            </h1>
            <p className="text-sm leading-[22px] text-white/75">
              Everything Yuna has noticed about you
            </p>
          </div>

          <div className="flex flex-col gap-8 mt-8">
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
                  <ListOfInsights insights={data.beliefs.slice(0, INSIGHT_PREVIEW_COUNT)} />
                  {data.beliefs.length > INSIGHT_PREVIEW_COUNT && (
                    <MoreButton
                      count={data.beliefs.length - INSIGHT_PREVIEW_COUNT}
                      onClick={() => openInsights("beliefs")}
                    />
                  )}
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
              <ListOfInsights insights={data.basics.slice(0, INSIGHT_PREVIEW_COUNT)} />
              {data.basics.length > INSIGHT_PREVIEW_COUNT && (
                <MoreButton
                  count={data.basics.length - INSIGHT_PREVIEW_COUNT}
                  onClick={() => openInsights("basics")}
                />
              )}
            </Section>
          </div>

          <div className="flex flex-col items-center gap-3 mt-10">
            <p className="font-display text-xl leading-7 text-white/90 text-center">
              Something feel off?
            </p>
            <p className="text-sm leading-[22px] text-white/75 text-center max-w-[20rem]">
              Yuna's understanding grows over time. If anything here doesn't feel right, you can help
              refine it.
            </p>
            <Button surface={surface} variant="secondary" size="md" className="mt-1">
              Help Yuna understand you better
            </Button>
          </div>
        </div>
      </div>
    </PhoneFrame>
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
