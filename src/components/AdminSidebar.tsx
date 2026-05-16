import { Link, useLocation } from "@tanstack/react-router";

type Entry = {
  label: string;
  to: string;
  search?: Record<string, unknown>;
  sub?: boolean;
};

const PAGES: Entry[] = [
  { label: "Welcome", to: "/" },
  { label: "Log in", to: "/login" },
  { label: "Employer access", to: "/employer-access" },
  { label: "Create account", to: "/auth" },
  { label: "Accept terms", to: "/accept-terms" },
  { label: "Intro", to: "/intro" },
  { label: "Name", to: "/intro", search: { step: 0 }, sub: true },
  { label: "Credentials + Ratings", to: "/intro", search: { step: 1 }, sub: true },
  { label: "Notifications", to: "/intro", search: { step: 2 }, sub: true },
  { label: "Mood data", to: "/intro", search: { step: 3 }, sub: true },
  { label: "Voice", to: "/intro", search: { step: 4 }, sub: true },
  { label: "Privacy", to: "/intro", search: { step: 5 }, sub: true },
  { label: "Home", to: "/home" },
  { label: "Session", to: "/chat" },
  { label: "Wrap-up", to: "/wrap-up" },
  { label: "Profile", to: "/you" },
  { label: "Profile tooltips", to: "/you", search: { tooltips: "1" }, sub: true },
  { label: "Focus area 1", to: "/focus-area/1", sub: true },
  { label: "Focus area 2", to: "/focus-area/2", sub: true },
  { label: "Tools", to: "/tools" },
  { label: "Sessions", to: "/sessions" },
  { label: "Progress", to: "/progress" },
  { label: "Settings", to: "/settings" },
];

const DS_PAGES: Entry[] = [
  { label: "Buttons", to: "/ds/buttons" },
  { label: "Text Fields", to: "/ds/text-fields" },
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

// Pick the single most-specific matching entry for the current location.
// Specificity = (entry is a sub) + number of search keys it constrains, so
// `/you?tooltips=1` resolves to "Profile tooltips" rather than the bare
// "Profile" entry.
function findActiveIndex(
  entries: Entry[],
  currentPath: string,
  currentSearch: Record<string, unknown>,
): number {
  let bestIndex = -1;
  let bestScore = -1;
  entries.forEach((entry, i) => {
    if (entry.to !== currentPath) return;
    if (!entryMatchesSearch(entry.search, currentSearch)) return;
    const keyCount = entry.search ? Object.keys(entry.search).length : 0;
    const score = (entry.sub ? 1 : 0) + keyCount;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });
  return bestIndex;
}

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentSearch = readSearchObject(location.search);

  const activePagesIndex = findActiveIndex(PAGES, currentPath, currentSearch);
  const activeDsIndex = findActiveIndex(DS_PAGES, currentPath, currentSearch);

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen w-44 flex-col gap-1 px-4 py-6 border-r border-border bg-background/60 backdrop-blur-sm z-50 overflow-y-auto"
      aria-label="Admin navigation"
    >
      <div className="font-sans-ui text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-3 px-2">
        Pages
      </div>
      {PAGES.map((p, i) => (
        <NavLink key={`${p.to}-${i}`} entry={p} active={i === activePagesIndex} />
      ))}

      <div className="font-sans-ui text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-3 mt-6 px-2">
        Design System
      </div>
      {DS_PAGES.map((p, i) => (
        <NavLink key={p.to} entry={p} active={i === activeDsIndex} />
      ))}
    </aside>
  );
}

function NavLink({ entry, active }: { entry: Entry; active: boolean }) {
  const base =
    "font-sans-ui rounded-md transition-colors " +
    (entry.sub
      ? "text-[10px] tracking-wide ml-3 pl-3 pr-2 py-1 border-l border-border/60 "
      : "text-[11px] tracking-wide px-2 py-1.5 ");
  return (
    <Link
      to={entry.to}
      // TanStack's typed Link doesn't accept arbitrary search shapes here;
      // the route's validateSearch coerces step at runtime.
      search={entry.search as never}
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
