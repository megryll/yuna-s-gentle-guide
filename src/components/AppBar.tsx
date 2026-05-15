import { Link, useLocation } from "@tanstack/react-router";
import { Bookmark, House, MessageCircle, Pencil, User } from "lucide-react";
import { useUserType } from "@/lib/user-type";
import { isLightMode, useAppMode } from "@/lib/theme-prefs";

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
  { label: "Home", to: "/home", icon: HomeIcon, matches: ["/home"] },
  { label: "You", to: "/you", icon: PersonIcon, notify: true },
  { label: "Chat", to: "/chat", icon: ChatIcon, emphasized: true },
  { label: "Tools", to: "/tools", icon: ToolsIcon, matches: ["/tools"] },
  { label: "Sessions", to: "/sessions", icon: SessionsIcon, matches: ["/sessions"] },
];

export function AppBar({ surface = "light" }: { surface?: Surface } = {}) {
  const { pathname } = useLocation();
  const userType = useUserType();
  // Notification dots only surface for returning users — that's where the
  // "new content since last visit" framing applies.
  const showNotifications = userType === "returning" && pathname === "/home";
  const isDark = surface === "dark";
  const isLight = isLightMode(useAppMode());

  const tabs = ITEMS.map((it) => {
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
  });

  if (isDark) {
    // Arbitrary border color in light mode so `.theme-light`'s
    // `border-white/25` → dark swap can't kick in and turn the top edge
    // into a hard dark line over the pale photo bg.
    const borderClass = isLight
      ? "border-[rgba(255,255,255,0.65)]"
      : "border-white/25";
    return (
      <nav
        aria-label="Main"
        className={
          "rounded-t-3xl bg-white/10 backdrop-blur-md border-t px-2 pt-2 pb-3 grid grid-cols-5 gap-1 " +
          borderClass
        }
      >
        {tabs}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main"
      className="px-2 pt-2 pb-3 grid grid-cols-5 gap-1 border-t border-border bg-background"
    >
      {tabs}
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
    // The emphasized chat tab scales 25% larger than the inactive tabs' icon
    // box (h-10 -> h-[50px]) so it reads as the primary action. It still fits
    // inside the icon+label stack height of the other tabs, so the AppBar's
    // vertical padding stays untouched.
    return (
      <Link
        to={item.to}
        className="flex flex-col items-center justify-center"
        aria-current={active ? "page" : undefined}
      >
        <span
          className="relative flex items-center justify-center rounded-full bg-white text-foreground shadow-lg h-[50px] w-[50px]"
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

function NotificationDot({ surface: _surface }: { surface: Surface }) {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full"
      style={{
        backgroundColor: "#66BA24",
        boxShadow: "0 0 0 3px rgba(102, 186, 36, 0.35)",
      }}
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
      size={24}
      strokeWidth={1.6}
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
