import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { InsightCard } from "@/components/profile-components";
import { useUserType } from "@/lib/user-type";
import { getInsightCategory, isInsightCategory } from "@/lib/profile-data";

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

  const category = isInsightCategory(raw) ? raw : "basics";
  const { title, insights } = getInsightCategory(userType, category);
  const accentLeft = category === "breakthroughs";

  return (
    <PhoneFrame themed>
      <div className="relative flex-1 flex flex-col text-white min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <header className="px-6 pt-14 pb-2 shrink-0">
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            onClick={() => navigate({ to: "/you" })}
            aria-label="Back"
          >
            <ChevronLeft strokeWidth={1.5} />
          </Button>
        </header>

        <div className="px-6 pt-4 flex flex-col items-center text-center gap-2">
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

        <div className="px-6 mt-8 pb-12 flex flex-col gap-2">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} accentLeft={accentLeft} />
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
