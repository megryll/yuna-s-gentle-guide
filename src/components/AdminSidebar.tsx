import { Link, useLocation } from "@tanstack/react-router";

type Entry = {
  label: string;
  to: string;
  search?: Record<string, unknown>;
  sub?: boolean;
};

const PAGES: Entry[] = [
  { label: "Welcome", to: "/" },
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
  { label: "Focus area 1", to: "/focus-area/1", sub: true },
  { label: "Focus area 2", to: "/focus-area/2", sub: true },
  { label: "Tools", to: "/tools" },
  { label: "Sessions", to: "/sessions" },
  { label: "Progress", to: "/progress" },
  { label: "Settings", to: "/settings" },
];

const DS_PAGES: Entry[] = [{ label: "Buttons", to: "/ds/buttons" }];

function readStep(search: unknown): number | undefined {
  if (!search || typeof search !== "object") return undefined;
  const raw = (search as Record<string, unknown>).step;
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function isEntryActive(
  entry: Entry,
  currentPath: string,
  currentStep: number | undefined,
): boolean {
  if (currentPath !== entry.to) return false;
  const entryStep = (entry.search as { step?: number } | undefined)?.step;
  if (entry.sub) return entryStep === currentStep;
  if (entry.to === "/intro") return currentStep === undefined;
  return true;
}

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentStep = readStep(location.search);

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen w-44 flex-col gap-1 px-4 py-6 border-r border-border bg-background/60 backdrop-blur-sm z-50 overflow-y-auto"
      aria-label="Admin navigation"
    >
      <div className="font-sans-ui text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-3 px-2">
        Pages
      </div>
      {PAGES.map((p, i) => (
        <NavLink
          key={`${p.to}-${i}`}
          entry={p}
          active={isEntryActive(p, currentPath, currentStep)}
        />
      ))}

      <div className="font-sans-ui text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-3 mt-6 px-2">
        Design System
      </div>
      {DS_PAGES.map((p) => (
        <NavLink key={p.to} entry={p} active={isEntryActive(p, currentPath, currentStep)} />
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
