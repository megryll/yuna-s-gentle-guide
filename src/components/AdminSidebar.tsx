import { Fragment, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

type Leaf = {
  label: string;
  to: string;
  search?: Record<string, unknown>;
  params?: Record<string, string>;
};

type Entry = Leaf & {
  // When present, this row is a collapsible parent: children render indented,
  // and the group auto-expands while the parent or one of its children is the
  // active route. Keeps the sidebar short without hiding where you are.
  children?: Leaf[];
};

const PAGES: Entry[] = [
  { label: "Welcome", to: "/" },
  { label: "Log in", to: "/login" },
  { label: "Employer access", to: "/employer-access" },
  { label: "Create account", to: "/auth" },
  { label: "Accept terms", to: "/accept-terms" },
  {
    label: "Intro",
    to: "/intro",
    children: [
      { label: "Name", to: "/intro", search: { step: 0 } },
      { label: "Credentials + Ratings", to: "/intro", search: { step: 1 } },
      {
        label: "Tell me more about Yuna",
        to: "/intro",
        search: { step: 2, branch: "tellMeMore" },
      },
      { label: "Notifications", to: "/intro", search: { step: 2 } },
      { label: "Mood data", to: "/intro", search: { step: 3 } },
      { label: "Voice", to: "/intro", search: { step: 4 } },
      { label: "Privacy", to: "/intro", search: { step: 5 } },
      { label: "Creating Your Space", to: "/creating-your-space" },
    ],
  },
  { label: "Home", to: "/home" },
  { label: "Session", to: "/chat" },
  { label: "Wrap-up", to: "/wrap-up" },
  {
    label: "Profile",
    to: "/you",
    children: [
      { label: "Focus area 1", to: "/focus-area/1" },
      { label: "Focus area 2", to: "/focus-area/2" },
    ],
  },
  { label: "Tools", to: "/tools" },
  {
    label: "Goal Setting",
    to: "/goals",
    children: [
      { label: "Empty / list", to: "/goals" },
      { label: "Name goal", to: "/goals", search: { step: "name" } },
      { label: "Timeframe", to: "/goals", search: { step: "timeframe" } },
      { label: "Goal created", to: "/goals", search: { step: "success" } },
    ],
  },
  {
    label: "Meditations",
    to: "/meditation",
    children: [
      { label: "Create", to: "/meditation", search: { step: "create" } },
      { label: "Crafting", to: "/meditation", search: { step: "crafting" } },
      { label: "Player", to: "/meditation", search: { step: "player" } },
      { label: "Complete", to: "/meditation", search: { step: "complete" } },
    ],
  },
  { label: "Sessions", to: "/sessions" },
  { label: "Gratitude List", to: "/gratitude" },
  { label: "Book Reco", to: "/book/$id", params: { id: "self-compassion-neff" } },
  { label: "Skill Article", to: "/skill/$id", params: { id: "please-technique" } },
  {
    label: "Settings",
    to: "/settings",
    children: [
      { label: "Content Preferences", to: "/settings/content-preferences" },
    ],
  },
];

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
      { label: "Card Suggestion", to: "/ds/card-suggestion" },
      { label: "Cards", to: "/ds/cards" },
      { label: "Chat Bubbles", to: "/ds/chat-bubbles" },
      { label: "Divider", to: "/ds/divider" },
      { label: "Drawer", to: "/ds/drawer" },
      { label: "Icons", to: "/ds/icons" },
      { label: "Radial Progress", to: "/ds/radial-progress" },
      { label: "Rating Scale", to: "/ds/rating-scale" },
      { label: "Segmented Toggle", to: "/ds/segmented-toggle" },
      { label: "Slider", to: "/ds/slider" },
      { label: "Surface", to: "/ds/surface" },
      { label: "Switches", to: "/ds/switches" },
      { label: "Tags", to: "/ds/tags" },
      { label: "Text Fields", to: "/ds/text-fields" },
      { label: "Toast Alerts", to: "/ds/toasts" },
      { label: "Waveform", to: "/ds/waveform" },
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

// Resolve `$param` segments in an entry's `to` against its params, so a
// pattern like `/sessions/$id` with `{ id: "s-04" }` becomes `/sessions/s-04`
// and can be compared to the live pathname.
function resolveEntryPath(entry: Leaf): string {
  if (!entry.params) return entry.to;
  return entry.to.replace(/\$(\w+)/g, (_, key: string) =>
    entry.params?.[key] ?? `$${key}`,
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
      className="hidden md:flex fixed left-0 top-0 h-screen w-44 flex-col gap-1 px-4 py-6 border-r border-border bg-background/60 backdrop-blur-sm z-50 overflow-y-auto"
      aria-label="Admin navigation"
    >
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
        "text-muted-foreground hover:text-foreground hover:bg-accent"
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
          : "text-muted-foreground hover:text-foreground hover:bg-accent")
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
          : "text-muted-foreground hover:text-foreground hover:bg-accent")
      }
    >
      {entry.label}
    </Link>
  );
}
