import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WebShell, WebContent } from "@/components/WebShell";
import { PageHeader } from "@/components/PageHeader";
import { InsightCard } from "@/components/profile-components";
import { useUserType } from "@/lib/user-type";
import { getInsightCategory, isInsightCategory } from "@/lib/profile-data";
import { useAppMode } from "@/lib/theme-prefs";

export const Route = createFileRoute("/insights/$category")({
  head: ({ params }) => ({
    meta: [{ title: `Insights — Yuna` }],
  }),
  component: InsightsListRoute,
});

function InsightsListRoute() {
  const { category: raw } = Route.useParams();
  const navigate = useNavigate();
  const userType = useUserType();
  // Themed screen: follows the Light/Dark toggle, so its controls flip surface
  // with it (the photo + .theme-light invert automatically).
  const surface = useAppMode();

  const category = isInsightCategory(raw) ? raw : "basics";
  const { title, insights } = getInsightCategory(userType, category);
  const accentLeft = category === "breakthroughs";

  return (
    <WebShell>
      <WebContent width="max-w-6xl" className="text-white">
        <PageHeader
          surface={surface}
          className="px-0 pt-0 pb-0"
          onBack={() => navigate({ to: "/you" })}
        />

        <div className="mt-4 flex flex-col items-center text-center gap-2">
          <h1
            className="font-display font-semibold text-3xl leading-tight text-white"
            style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}
          >
            {title}
          </h1>
          <p className="text-sm leading-[22px] text-white/75">
            {insights.length} insights Yuna has gathered
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} accentLeft={accentLeft} />
          ))}
        </div>
      </WebContent>
    </WebShell>
  );
}
