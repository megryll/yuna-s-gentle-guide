import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { CardRow, MetaDot } from "@/components/Card";
import { useAppMode } from "@/lib/theme-prefs";
import {
  TASKS,
  TASK_TYPES,
  TASK_TYPE_LABEL,
  type Task,
  type TaskType,
} from "@/lib/all-tasks-data";

// ─── All Tasks ────────────────────────────────────────────────────────────────
// One feed for everything the user can work on, reached from the You tab's
// Skills / Questionnaires / Meditations / Goals / Days of Gratitude tiles. A
// horizontal row of type filters narrows the list; within each type the
// incomplete tasks sort above the completed ones. Photo-bg cluster; follows the
// Light/Dark toggle.

type Filter = "all" | TaskType;
type Cluster = "dark" | "light";

export const Route = createFileRoute("/all-tasks")({
  // `?type=` pre-selects a filter so a You-tab tile lands on its own category;
  // an unknown or missing value falls back to the All view.
  validateSearch: (search: Record<string, unknown>): { type?: TaskType } => {
    const t = search.type;
    return typeof t === "string" && (TASK_TYPES as string[]).includes(t)
      ? { type: t as TaskType }
      : {};
  },
  head: () => ({ meta: [{ title: "All Tasks — Yuna" }] }),
  component: AllTasksRoute,
});

function AllTasksRoute() {
  const navigate = useNavigate();
  const router = useRouter();
  const surface: Cluster = useAppMode() === "light" ? "light" : "dark";
  const { type } = Route.useSearch();
  const [filter, setFilter] = useState<Filter>(type ?? "all");

  const back = () =>
    router.history.canGoBack() ? router.history.back() : navigate({ to: "/you" });

  const types = filter === "all" ? TASK_TYPES : [filter];

  return (
    <PhoneFrame themed>
      <div className="relative flex-1 flex flex-col text-white min-h-0">
        <header className="shrink-0 px-6 pt-14 flex items-center">
          <Button surface={surface} variant="secondary" size="icon" aria-label="Back" onClick={back}>
            <ChevronLeft strokeWidth={1.5} />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-10 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <h1 className="px-6 pt-5 font-display text-3xl tracking-tight text-white">All Tasks</h1>

          {/* Horizontal scrolling type filters. */}
          <div className="mt-4 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterTag label="All" active={filter === "all"} surface={surface} onClick={() => setFilter("all")} />
            {TASK_TYPES.map((t) => (
              <FilterTag
                key={t}
                label={TASK_TYPE_LABEL[t]}
                active={filter === t}
                surface={surface}
                onClick={() => setFilter(t)}
              />
            ))}
          </div>

          <div className="mt-6 px-6 flex flex-col gap-8">
            {types.map((type) => {
              const items = TASKS.filter((t) => t.type === type).sort(
                (a, b) => Number(a.completed) - Number(b.completed),
              );
              if (items.length === 0) return null;
              return (
                <section key={type} className="flex flex-col gap-3">
                  {filter === "all" && (
                    <h2 className="font-display text-xl tracking-tight text-white">
                      {TASK_TYPE_LABEL[type]}
                    </h2>
                  )}
                  <ul className="flex flex-col gap-3">
                    {items.map((task) => (
                      <li key={task.id}>
                        <TaskCard task={task} navigate={navigate} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function FilterTag({
  label,
  active,
  surface,
  onClick,
}: {
  label: string;
  active: boolean;
  surface: Cluster;
  onClick: () => void;
}) {
  return (
    <span className="shrink-0">
      <Tag surface={surface} selected={active} onClick={onClick}>
        {label}
      </Tag>
    </span>
  );
}

function TaskCard({
  task,
  navigate,
}: {
  task: Task;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <CardRow
      title={task.title}
      tone="dark"
      naturePath={task.naturePath}
      completed={task.completed}
      interactive={!!task.to}
      onClick={task.to ? () => navigate({ to: task.to!, params: task.params as never }) : undefined}
      meta={
        <>
          <span className="text-xs font-medium tracking-[0.08em] uppercase text-white">
            {TASK_TYPE_LABEL[task.type]}
          </span>
          <MetaDot>{task.completed ? "Done" : "To do"}</MetaDot>
        </>
      }
    />
  );
}
