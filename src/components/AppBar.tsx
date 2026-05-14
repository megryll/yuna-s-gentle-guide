import { Link, useLocation } from "@tanstack/react-router";

type Surface = "light" | "dark";

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
  { label: "Tools", to: "/activities", icon: ToolsIcon, matches: ["/activities"] },
  { label: "Sessions", to: "/progress", icon: SessionsIcon, matches: ["/progress"] },
];

export function AppBar({ surface = "light" }: { surface?: Surface } = {}) {
  const { pathname } = useLocation();
  // Notification dots only surface for returning users — that's where the
  // "new content since last visit" framing applies.
  const showNotifications = pathname === "/home-returning";
  const isDark = surface === "dark";

  return (
    <nav
      aria-label="Main"
      className={
        "px-2 pt-2 pb-3 grid grid-cols-5 gap-1 " +
        (isDark
          ? "bg-transparent"
          : "border-t border-border bg-background")
      }
    >
      {ITEMS.map((it) => {
        const active = it.matches ? it.matches.includes(pathname) : pathname === it.to;
        const notify = !!it.notify && showNotifications && !active;
        return (
          <Tab
            key={it.label}
            item={it}
            active={active}
            notify={notify}
            surface={surface}
          />
        );
      })}
    </nav>
  );
}

function Tab({
  item,
  active,
  notify,
  surface,
}: {
  item: Item;
  active: boolean;
  notify: boolean;
  surface: Surface;
}) {
  const Icon = item.icon;
  const isDark = surface === "dark";

  if (item.emphasized) {
    return (
      <Link
        to={item.to}
        className="flex flex-col items-center gap-1 -mt-5"
        aria-current={active ? "page" : undefined}
      >
        <span
          className={
            "relative flex items-center justify-center rounded-full text-white shadow-lg " +
            (isDark ? "h-[68px] w-[68px]" : "h-12 w-12 ")
          }
          style={{ backgroundColor: "#115430" }}
        >
          <Icon />
          {notify && <NotificationDot surface={surface} />}
        </span>
      </Link>
    );
  }

  const labelActiveClass = isDark
    ? "text-white font-semibold"
    : "text-foreground font-semibold";
  const labelInactiveClass = isDark
    ? "text-white/60"
    : "text-muted-foreground";

  const iconActiveClass = isDark ? "text-white" : "text-foreground";
  const iconInactiveClass = isDark
    ? "text-white/60"
    : "text-muted-foreground group-hover:text-foreground";

  return (
    <Link
      to={item.to}
      className="flex flex-col items-center gap-1 py-1 group"
      aria-current={active ? "page" : undefined}
    >
      <span
        className={
          "relative h-6 w-6 flex items-center justify-center transition-colors " +
          (active ? iconActiveClass : iconInactiveClass)
        }
      >
        <Icon />
        {notify && <NotificationDot surface={surface} />}
      </span>
      <span
        className={
          "text-[12px] tracking-[0.01em] transition-colors " +
          (active ? labelActiveClass : labelInactiveClass)
        }
      >
        {item.label}
      </span>
    </Link>
  );
}

function NotificationDot({ surface }: { surface: Surface }) {
  return (
    <span
      aria-hidden="true"
      className={
        "absolute -top-0.5 -right-1 h-2 w-2 rounded-full " +
        (surface === "dark"
          ? "ring-2 ring-transparent"
          : "ring-2 ring-background")
      }
      style={{ backgroundColor: "#66BA24" }}
    />
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 6.5a3 3 0 1 1 3.5 3.5L9 18.5l-4 1 1-4L14.5 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SessionsIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V20l-7-3-7 3V4.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
