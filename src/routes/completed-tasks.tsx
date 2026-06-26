import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { WebShell, WebContent } from "@/components/WebShell";
import { PageHeader } from "@/components/PageHeader";
import { Divider } from "@/components/Divider";
import { YunaExplains } from "@/components/YunaExplains";
import { HomeCardRow } from "@/components/HomeCards";
import { HOME_CARDS, type HomeCard } from "@/lib/home-cards";
import { useYunaIdentity } from "@/lib/yuna-session";
import { useAppMode } from "@/lib/theme-prefs";

export const Route = createFileRoute("/completed-tasks")({
  head: () => ({ meta: [{ title: "All Completed Tasks — Yuna" }] }),
  component: CompletedTasksRoute,
});

// Static prototype content: completed tasks grouped by the day they were
// finished. Each id resolves to its Home card so the rows reuse the exact
// feed-row treatment (faded + "Completed" badge) rather than a parallel style.
const STATS = { week: 3, month: 8, allTime: 12 } as const;

const GROUPS: { date: string; ids: string[] }[] = [
  { date: "Today", ids: ["please-technique", "strength-overcome", "feeling-check"] },
  {
    date: "Mon, Jun 9",
    ids: [
      "rest-is-not-reward",
      "midday-reset",
      "stop-technique",
      "energy-audit",
      "morning-walk",
      "body-scan-bedtime",
      "gratitude-today",
    ],
  },
];

const BY_ID = new Map<string, HomeCard>(HOME_CARDS.map((c) => [c.id, c]));

function CompletedTasksRoute() {
  const navigate = useNavigate();
  const router = useRouter();
  const { name } = useYunaIdentity();
  const surface = useAppMode() === "light" ? "light" : "dark";

  const onBack = () =>
    router.history.canGoBack() ? router.history.back() : navigate({ to: "/home" });

  return (
    <WebShell>
      <WebContent width="max-w-2xl" className="text-white">
        <PageHeader
          title="All Completed Tasks"
          surface={surface}
          className="px-0 pt-0 pb-0"
          onBack={onBack}
        />

        <div className="mt-6 flex flex-col gap-7">
          {/* Tally — three Fraunces figures across the same row as the screenshot. */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { value: STATS.week, label: "This week" },
              { value: STATS.month, label: "This month" },
              { value: STATS.allTime, label: "All time" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="font-display text-4xl leading-none tracking-tight text-white">
                  {s.value}
                </span>
                <span className="text-[10px] tracking-[0.18em] uppercase text-white/70">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <YunaExplains surface={surface}>
            {name ? `${name}, you've` : "You've"} been showing up consistently, especially
            in your work around healing and new beginnings. That kind of steady presence is
            where real growth takes root.
          </YunaExplains>

          {GROUPS.map((group) => {
            const cards = group.ids.map((id) => BY_ID.get(id)).filter(Boolean) as HomeCard[];
            if (cards.length === 0) return null;
            return (
              <section key={group.date} className="flex flex-col gap-3">
                <Divider surface={surface} label={group.date} />
                <ul className="flex flex-col gap-4">
                  {cards.map((c) => (
                    <li key={c.id}>
                      <HomeCardRow card={c} completed interactive={false} onClick={() => {}} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </WebContent>
    </WebShell>
  );
}
