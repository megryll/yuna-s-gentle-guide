import { Link, useLocation } from "@tanstack/react-router";

type Item = {
  label: string;
  to: string;
  icon: () => React.ReactElement;
  emphasized?: boolean;
  matches?: string[];
  notify?: boolean;
};

const ITEMS: Item[] = [
  { label: "Home", to: "/home", icon: HomeIcon, matches: ["/home", "/home-returning"] },
  { label: "You", to: "/you", icon: PersonIcon, notify: true },
  { label: "Chat", to: "/chat", icon: ChatIcon, emphasized: true },
  { label: "Activities", to: "/activities", icon: PencilIcon, notify: true },
  { label: "Progress", to: "/progress", icon: ChartIcon },
];

export function AppBar() {
  const { pathname } = useLocation();
  // Notification dots only surface for returning users — that's where the
  // "new content since last visit" framing applies.
  const showNotifications = pathname === "/home-returning";

  return (
    <nav
      aria-label="Main"
      className="border-t border-border bg-background px-2 pt-2 pb-3 grid grid-cols-5 gap-1"
    >
      {ITEMS.map((it) => {
        const active = it.matches ? it.matches.includes(pathname) : pathname === it.to;
        const notify = !!it.notify && showNotifications && !active;
        return <Tab key={it.label} item={it} active={active} notify={notify} />;
      })}
    </nav>
  );
}

function Tab({
  item,
  active,
  notify,
}: {
  item: Item;
  active: boolean;
  notify: boolean;
}) {
  const Icon = item.icon;
  if (item.emphasized) {
    return (
      <Link
        to={item.to}
        className="flex flex-col items-center gap-1 -mt-3"
        aria-current={active ? "page" : undefined}
      >
        <span
          className={
            "relative h-12 w-12 rounded-full flex items-center justify-center transition-all " +
            (active
              ? "bg-foreground text-background shadow-lg ring-2 ring-foreground/15 ring-offset-2 ring-offset-background"
              : "bg-foreground text-background opacity-90 hover:opacity-100")
          }
        >
          <Icon />
          {notify && <NotificationDot />}
        </span>
        <span
          className={
            "font-sans-ui text-[9px] tracking-[0.04em] uppercase " +
            (active ? "text-foreground font-semibold" : "text-muted-foreground")
          }
        >
          {item.label}
        </span>
      </Link>
    );
  }
  return (
    <Link
      to={item.to}
      className="flex flex-col items-center gap-1 py-1 group"
      aria-current={active ? "page" : undefined}
    >
      <span
        className={
          "relative h-7 w-12 rounded-full flex items-center justify-center transition-all " +
          (active
            ? "bg-foreground text-background"
            : "text-muted-foreground group-hover:text-foreground")
        }
      >
        <Icon />
        {notify && <NotificationDot />}
      </span>
      <span
        className={
          "font-sans-ui text-[9px] tracking-[0.04em] uppercase transition-colors " +
          (active ? "text-foreground font-semibold" : "text-muted-foreground")
        }
      >
        {item.label}
      </span>
    </Link>
  );
}

function NotificationDot() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-0.5 right-1.5 h-2 w-2 rounded-full bg-green-600 ring-2 ring-background"
    />
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 6.5a3 3 0 1 1 3.5 3.5L9 18.5l-4 1 1-4L14.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="6" y="11" width="3" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="7" width="3" height="11" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="16" y="13" width="3" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
