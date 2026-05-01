import { Link, useLocation } from "@tanstack/react-router";

type Entry = { label: string; to: string };

const PAGES: Entry[] = [
  { label: "Welcome", to: "/" },
  { label: "Create account", to: "/auth" },
  { label: "Intro", to: "/intro" },
  { label: "Home: New", to: "/home" },
  { label: "Home: Returning", to: "/home-returning" },
  { label: "Chat", to: "/chat" },
  { label: "Call", to: "/call" },
  { label: "You", to: "/you" },
  { label: "Activities", to: "/activities" },
  { label: "Progress", to: "/progress" },
];

const DS_PAGES: Entry[] = [
  { label: "Buttons", to: "/ds/buttons" },
];

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen w-44 flex-col gap-1 px-4 py-6 border-r border-border bg-background/60 backdrop-blur-sm z-50 overflow-y-auto"
      aria-label="Admin navigation"
    >
      <div className="font-sans-ui text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-3 px-2">
        Pages
      </div>
      {PAGES.map((p) => (
        <NavLink key={p.to} entry={p} active={currentPath === p.to} />
      ))}

      <div className="font-sans-ui text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-3 mt-6 px-2">
        Design System
      </div>
      {DS_PAGES.map((p) => (
        <NavLink key={p.to} entry={p} active={currentPath === p.to} />
      ))}
    </aside>
  );
}

function NavLink({ entry, active }: { entry: Entry; active: boolean }) {
  return (
    <Link
      to={entry.to}
      className={
        "font-sans-ui text-[11px] tracking-wide rounded-md px-2 py-1.5 transition-colors " +
        (active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-accent")
      }
    >
      {entry.label}
    </Link>
  );
}
