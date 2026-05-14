import { Link, useLocation } from "@tanstack/react-router";
import { Bookmark, House, MessageCircle, Pencil, User } from "lucide-react";

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
  return <House size={22} strokeWidth={1.6} aria-hidden="true" />;
}

function PersonIcon() {
  return <User size={22} strokeWidth={1.6} aria-hidden="true" />;
}

function ChatIcon() {
  return (
    <MessageCircle
      size={28}
      strokeWidth={1.6}
      fill="currentColor"
      aria-hidden="true"
    />
  );
}

function ToolsIcon() {
  return <Pencil size={22} strokeWidth={1.6} aria-hidden="true" />;
}

function SessionsIcon() {
  return <Bookmark size={22} strokeWidth={1.6} aria-hidden="true" />;
}
