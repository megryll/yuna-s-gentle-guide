import { Fragment, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, LayoutGrid } from "lucide-react";

import {
  PAGES,
  resolveEntryPath,
  type ScreenLeaf as Leaf,
  type ScreenEntry as Entry,
} from "@/lib/screen-catalog";

type DsGroup = { label: string; items: Leaf[] };

// Foundations = the tokens everything is built from; Components = everything
// else, alphabetical. Both collapse. Add new component pages in alpha order.
const DS_GROUPS: DsGroup[] = [
  {
    label: "Foundations",
    items: [
      { label: "Typography", to: "/ds/typography" },
      { label: "Colors", to: "/ds/colors" },
      { label: "Spacing", to: "/ds/spacing" },
    ],
  },
  {
    label: "Components",
    items: [
      { label: "Accordion", to: "/ds/accordion" },
      { label: "App Bar", to: "/ds/app-bar" },
      { label: "Avatars", to: "/ds/avatars" },
      { label: "Badge", to: "/ds/badge" },
      { label: "Buttons", to: "/ds/buttons" },
      { label: "Calendar", to: "/ds/calendar" },
      { label: "Card Suggestion", to: "/ds/card-suggestion" },
      { label: "Cards", to: "/ds/cards" },
      { label: "Chat Bubbles", to: "/ds/chat-bubbles" },
      { label: "Checkbox", to: "/ds/checkbox" },
      { label: "Divider", to: "/ds/divider" },
      { label: "Drawer", to: "/ds/drawer" },
      { label: "Icons", to: "/ds/icons" },
      { label: "Multiple Choice", to: "/ds/multiple-choice" },
      { label: "Page Header", to: "/ds/page-header" },
      { label: "Progress Bar", to: "/ds/progress-bar" },
      { label: "Radial Progress", to: "/ds/radial-progress" },
      { label: "Rating Scale", to: "/ds/rating-scale" },
      { label: "Segmented Toggle", to: "/ds/segmented-toggle" },
      { label: "Slider", to: "/ds/slider" },
      { label: "Step Dots", to: "/ds/step-dots" },
      { label: "Surface", to: "/ds/surface" },
      { label: "Switches", to: "/ds/switches" },
      { label: "Tags", to: "/ds/tags" },
      { label: "Text Area", to: "/ds/text-area" },
      { label: "Text Fields", to: "/ds/text-fields" },
      { label: "Toast Alerts", to: "/ds/toasts" },
      { label: "Waveform", to: "/ds/waveform" },
      { label: "Yuna Explains", to: "/ds/yuna-explains" },
    ],
  },
];

function readSearchObject(search: unknown): Record<string, unknown> {
  if (!search || typeof search !== "object") return {};
  return search as Record<string, unknown>;
}

function entryMatchesSearch(
  entrySearch: Record<string, unknown> | undefined,
  currentSearch: Record<string, unknown>,
): boolean {
  if (!entrySearch) return true;
  return Object.entries(entrySearch).every(
    ([k, v]) => String(currentSearch[k] ?? "") === String(v),
  );
}

// The single active node, addressed as a parent index plus an optional child
// index. Specificity = (is a child) + number of search keys constrained, so a
// step-specific child always wins over its catch-all parent at the same path.
type Active = { p: number; c: number | null };

function findActive(
  pages: Entry[],
  currentPath: string,
  currentSearch: Record<string, unknown>,
): Active | null {
  let best: Active | null = null;
  let bestScore = -1;
  pages.forEach((entry, p) => {
    if (
      resolveEntryPath(entry) === currentPath &&
      entryMatchesSearch(entry.search, currentSearch)
    ) {
      const score = entry.search ? Object.keys(entry.search).length : 0;
      if (score > bestScore) {
        bestScore = score;
        best = { p, c: null };
      }
    }
    entry.children?.forEach((child, c) => {
      if (
        resolveEntryPath(child) === currentPath &&
        entryMatchesSearch(child.search, currentSearch)
      ) {
        const score = 1 + (child.search ? Object.keys(child.search).length : 0);
        if (score > bestScore) {
          bestScore = score;
          best = { p, c };
        }
      }
    });
  });
  return best;
}

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentSearch = readSearchObject(location.search);

  const activePage = findActive(PAGES, currentPath, currentSearch);

  // Manual open/closed overrides, keyed by parent label. A group with no entry
  // here follows its active state — open while you're inside it, else closed.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen w-72 flex-col gap-1 px-4 py-6 border-r border-border bg-background z-50 overflow-y-auto"
      aria-label="Admin navigation"
    >
      <Link
        to="/gallery"
        className={
          `mb-2 flex items-center gap-2 rounded-md px-2 py-1.5 ${ROW_TEXT} ` +
          (currentPath === "/gallery"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground hover:bg-muted")
        }
      >
        <LayoutGrid size={13} strokeWidth={2} className="shrink-0" />
        <span>All screens</span>
      </Link>

      <div className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-3 px-2">
        Pages
      </div>
      {PAGES.map((entry, p) => {
        const activeHere = activePage?.p === p;
        if (!entry.children) {
          return (
            <NavLink
              key={`${entry.to}-${p}`}
              entry={entry}
              active={activeHere && activePage?.c === null}
            />
          );
        }
        const open = expanded[entry.label] ?? activeHere;
        return (
          <Fragment key={`${entry.to}-${p}`}>
            <ParentRow
              entry={entry}
              active={activeHere && activePage?.c === null}
              open={open}
              onToggle={() =>
                setExpanded((e) => ({
                  ...e,
                  [entry.label]: !(e[entry.label] ?? activeHere),
                }))
              }
            />
            {open &&
              entry.children.map((child, c) => (
                <NavLink
                  key={`${child.to}-${c}`}
                  entry={child}
                  sub
                  active={activeHere && activePage?.c === c}
                />
              ))}
          </Fragment>
        );
      })}

      <div className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-3 mt-6 px-2">
        Design System
      </div>
      {DS_GROUPS.map((group) => {
        // Default-open (the DS section is the workspace), but a manual toggle
        // wins. There's no parent destination, so the header is the toggle.
        const open = expanded[group.label] ?? true;
        return (
          <Fragment key={group.label}>
            <DsGroupHeader
              label={group.label}
              open={open}
              onToggle={() =>
                setExpanded((e) => ({
                  ...e,
                  [group.label]: !(e[group.label] ?? true),
                }))
              }
            />
            {open &&
              group.items.map((item) => (
                <NavLink key={item.to} entry={item} sub active={item.to === currentPath} />
              ))}
          </Fragment>
        );
      })}
    </aside>
  );
}

const ROW_TEXT = "text-uppercase tracking-wide";

// Collapsible section header for a DS group. Unlike ParentRow it has no
// destination — the whole row is the toggle — so it reads as a grouping, not a
// page link.
function DsGroupHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
      aria-expanded={open}
      className={
        `flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors ${ROW_TEXT} ` +
        "text-muted-foreground hover:text-foreground hover:bg-muted"
      }
    >
      <span>{label}</span>
      <ChevronRight
        size={13}
        strokeWidth={2}
        className={"shrink-0 transition-transform " + (open ? "rotate-90" : "")}
      />
    </button>
  );
}

function ParentRow({
  entry,
  active,
  open,
  onToggle,
}: {
  entry: Entry;
  active: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={
        "flex items-center rounded-md transition-colors " +
        (active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-muted")
      }
    >
      <Link
        to={entry.to}
        search={entry.search as never}
        params={entry.params as never}
        className={`flex-1 ${ROW_TEXT} pl-2 pr-1 py-1.5`}
      >
        {entry.label}
      </Link>
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? `Collapse ${entry.label}` : `Expand ${entry.label}`}
        aria-expanded={open}
        className="shrink-0 px-1.5 py-1.5"
      >
        <ChevronRight
          size={13}
          strokeWidth={2}
          className={"transition-transform " + (open ? "rotate-90" : "")}
        />
      </button>
    </div>
  );
}

function NavLink({
  entry,
  active,
  sub = false,
}: {
  entry: Leaf;
  active: boolean;
  sub?: boolean;
}) {
  const base =
    `rounded-md transition-colors ${ROW_TEXT} ` +
    (sub ? "ml-3 pl-3 pr-2 py-1 border-l border-border/60 " : "px-2 py-1.5 ");
  return (
    <Link
      to={entry.to}
      // TanStack's typed Link doesn't accept arbitrary search shapes here;
      // the route's validateSearch coerces step at runtime.
      search={entry.search as never}
      params={entry.params as never}
      className={
        base +
        (active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-muted")
      }
    >
      {entry.label}
    </Link>
  );
}
