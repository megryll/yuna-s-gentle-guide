import { Link, useLocation } from "@tanstack/react-router";
import { History, House, MessageCircle, Pencil, User } from "lucide-react";
import { useUserType } from "@/lib/user-type";
import { useStartChat } from "@/lib/chat-launch";
import { usePlatform } from "@/lib/platform";
import { useModeImage } from "@/lib/theme-prefs";

type Surface = "light" | "dark";

type Item = {
  label: string;
  to: string;
  icon: () => React.ReactElement;
  emphasized?: boolean;
  matches?: string[];
  notify?: boolean;
  search?: Record<string, string>;
};

// Bulge silhouette from the AppBar background SVG. The original path drew
// the bar's flat top at y=16 with the bulge curving up from there, which
// left small L-shaped cutouts between the rounded corners and the bulge —
// those exposed the dark photo behind the AppBar as a band. This version
// shifts the top half so the bar's flat top sits at y=0 (bounding box top),
// the rounded corners terminate at the top edge, and the bulge protrudes
// above y=0 into the area where the backdrop is extended over the nav.
// viewBox effectively becomes 393 × 109.34 (-18.21 to 91.13).
const APPBAR_BULGE_PATH =
  "M0 10.1631C0 4.6403 4.47715 0.1631 10 0.1631H98.3359H148.465C153.456 0.1631 158.357 -1.1711 162.659 -3.7014L172.306 -9.37508C187.3 -18.19316 205.891 -18.20933 220.901 -9.41736L230.701 -3.6767C234.993 -1.1623 239.878 0.1631 244.853 0.1631H295.008H383.344C388.867 0.1631 393.344 4.6403 393.344 10.1631V81.1291C393.344 86.652 388.867 91.129 383.344 91.129H10C4.47715 91.129 0 86.652 0 81.1291V10.1631Z";

// Mask via inline SVG data URI rather than a referenced `<clipPath>`. WebKit
// in particular fails to honor `clip-path: url(#…)` against `backdrop-filter`
// — the backdrop blur paints unclipped as a rectangle behind the bar — but
// `mask-image` clips both the element's own paint and its backdrop reliably.
// `preserveAspectRatio="none"` lets the path stretch to whatever the nav's
// width is; mask-size 100% 100% then fills the element.
const APPBAR_MASK_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -18.20933 393.344 109.33833' preserveAspectRatio='none'><path d='${APPBAR_BULGE_PATH}' fill='black'/></svg>`;
const APPBAR_MASK_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(APPBAR_MASK_SVG)}")`;

const ITEMS: Item[] = [
  { label: "Home", to: "/home", icon: HomeIcon, matches: ["/home"] },
  { label: "You", to: "/you", icon: PersonIcon, notify: true },
  {
    label: "Chat",
    to: "/chat",
    icon: ChatIcon,
    emphasized: true,
    search: { q: "Chat Now", mode: "voice" },
  },
  { label: "Tools", to: "/tools", icon: ToolsIcon, matches: ["/tools"] },
  { label: "Sessions", to: "/sessions", icon: SessionsIcon, matches: ["/sessions"] },
];

export function AppBar({ surface = "light" }: { surface?: Surface } = {}) {
  const { pathname } = useLocation();
  const userType = useUserType();
  const startChat = useStartChat();
  const platform = usePlatform();
  const modeImage = useModeImage();
  // Notification dots only surface for returning users — that's where the
  // "new content since last visit" framing applies.
  const showNotifications = userType === "returning" && pathname === "/home";
  const isDark = surface === "dark";

  const tabs = ITEMS.map((it) => {
    const active = it.matches ? it.matches.includes(pathname) : pathname === it.to;
    const notify = !!it.notify && showNotifications && !active;
    // The Chat tab is the first-session entry — route it through startChat so
    // the disclaimers play over the current screen before /chat, instead of
    // navigating away first.
    const onSelect =
      it.to === "/chat"
        ? () =>
            startChat({
              q: it.search?.q,
              mode: it.search?.mode === "voice" ? "voice" : "text",
            })
        : undefined;
    return (
      <Tab
        key={it.label}
        item={it}
        active={active}
        notify={notify}
        surface={surface}
        onSelect={onSelect}
      />
    );
  });

  if (isDark) {
    // The backdrop extends 20% of nav height above the nav top — that's the
    // portion of the path's bounding box (109.34 tall) that sits above the
    // bar (91.13 tall). The bar portion lands on the nav exactly; the bulge
    // protrudes up into the scroll area. Because the path now fills its full
    // bounding-box width at y=0 (no L-shaped cutouts), the visible bar reads
    // as a clean rounded rectangle with a bump on top.
    // Android kills backdrop-blur (`.platform-android`), so the frosted fill
    // vanishes and the masked shape reads as a flat wash. Paint the same masked
    // silhouette with the (already-blurred) themed background photo instead —
    // a faux-frost that keeps the bar + bulge defined without a live backdrop.
    // A faint black wash holds the white tab labels above the photo.
    const android = platform === "android";
    return (
      <nav aria-label="Main" className="relative isolate px-2 pt-2 pb-3 grid grid-cols-5 gap-1">
        <div
          aria-hidden="true"
          className={
            "absolute left-0 right-0 bottom-0 -z-10 " +
            (android ? "" : "bg-white/10 backdrop-blur-md")
          }
          style={{
            top: "-20%",
            ...(android
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url(${modeImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center bottom",
                }
              : null),
            maskImage: APPBAR_MASK_URL,
            WebkitMaskImage: APPBAR_MASK_URL,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
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
  onSelect,
}: {
  item: Item;
  active: boolean;
  notify: boolean;
  surface: Surface;
  onSelect?: () => void;
}) {
  const Icon = item.icon;
  const isDark = surface === "dark";

  if (item.emphasized) {
    // When a tab owns its navigation (e.g. Chat gating disclaimers first), it
    // renders as a button so the handler runs instead of a plain Link.
    if (onSelect) {
      return (
        <button
          type="button"
          onClick={onSelect}
          className="flex flex-col items-center justify-center"
          style={isDark ? { transform: "translateY(-12px)" } : undefined}
          aria-current={active ? "page" : undefined}
        >
          <span className="relative flex items-center justify-center rounded-full bg-white text-foreground shadow-lg h-[60px] w-[60px]">
            <Icon />
            {notify && <NotificationDot surface={surface} />}
          </span>
        </button>
      );
    }
    // The emphasized chat tab is a 60px circle (~50% larger than the inactive
    // tabs' h-10 icon box) so it reads as the primary action. The translateY
    // lifts the button so the chat icon sits on the same horizontal line as
    // the other tab icons (their centers land ~16px below link-top; button
    // center is link-center ≈ 28px, so −12px brings them flush) — the upper
    // half then protrudes into the bulge cradle naturally. Light surface
    // keeps the button flat inside the bar.
    return (
      <Link
        to={item.to}
        search={item.search}
        className="flex flex-col items-center justify-center"
        style={isDark ? { transform: "translateY(-12px)" } : undefined}
        aria-current={active ? "page" : undefined}
      >
        <span className="relative flex items-center justify-center rounded-full bg-white text-foreground shadow-lg h-[60px] w-[60px]">
          <Icon />
          {notify && <NotificationDot surface={surface} />}
        </span>
      </Link>
    );
  }

  const labelActiveClass = isDark ? "text-white font-semibold" : "text-foreground font-semibold";
  const labelInactiveClass = isDark ? "text-white/60" : "text-muted-foreground";

  const iconActiveClass = isDark ? "text-white" : "text-foreground";
  const iconInactiveClass = isDark
    ? "text-white/60"
    : "text-muted-foreground group-hover:text-foreground";

  return (
    <Link
      to={item.to}
      search={item.search}
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
          "text-xs tracking-[0.01em] transition-colors " +
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
        backgroundColor: "var(--secondary-green)",
        boxShadow: "0 0 0 3px color-mix(in srgb, var(--secondary-green) 35%, transparent)",
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
  return <MessageCircle size={26} strokeWidth={1.6} aria-hidden="true" />;
}

function ToolsIcon() {
  return <Pencil size={22} strokeWidth={1.6} aria-hidden="true" />;
}

function SessionsIcon() {
  return <History size={22} strokeWidth={1.6} aria-hidden="true" />;
}
