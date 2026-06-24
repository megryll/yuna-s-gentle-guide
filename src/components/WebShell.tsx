import { type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { History, House, MessageCircle, Pencil, Settings, Sparkles, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { isLightMode, useAppMode, useModeImage } from "@/lib/theme-prefs";
import { usePlatform } from "@/lib/platform";
import { useAdminChrome } from "@/lib/admin-chrome";
import { useSessions } from "@/lib/sessions";
import { useStartChat } from "@/lib/chat-launch";
import { FirstSessionDisclaimerGate } from "@/components/FirstSessionDisclaimers";
import { YunaWordmark } from "@/components/YunaWordmark";

type Surface = "light" | "dark";

type NavItem = {
  label: string;
  to: string;
  Icon: typeof House;
  /** Chat routes through startChat so disclaimers gate first (see AppBar). */
  startsChat?: boolean;
};

const NAV: NavItem[] = [
  { label: "Home", to: "/home", Icon: House },
  { label: "You", to: "/you", Icon: User },
  { label: "Chat", to: "/chat", Icon: MessageCircle, startsChat: true },
  { label: "Tools", to: "/tools", Icon: Pencil },
  { label: "Sessions", to: "/sessions", Icon: History },
];

function useIsActive() {
  const { pathname } = useLocation();
  return (to: string) =>
    pathname === to || (to !== "/home" && pathname.startsWith(to));
}

/**
 * Responsive web chrome — the desktop counterpart to PhoneFrame + AppBar.
 *
 * - Desktop (md+): a persistent left nav rail, icon-only at md and expanded
 *   with labels + a Recent-sessions list at lg.
 * - Mobile (<md): the rail is replaced by a slim top bar (brand + quick
 *   actions) and a bottom tab bar, the familiar mobile-web pattern.
 *
 * Mirrors PhoneFrame's theming: paints the mode photo and applies
 * `.theme-light` / `.platform-android` so every reused DS component reads
 * correctly across all four mode × platform combinations. `md:pl-72` clears
 * the admin sidebar while it's shown.
 */
export function WebShell({ children }: { children: ReactNode }) {
  const mode = useAppMode();
  const light = isLightMode(mode);
  const surface: Surface = light ? "light" : "dark";
  const bg = useModeImage();
  const platform = usePlatform();
  const adminChrome = useAdminChrome();

  return (
    <div
      className={cn(
        "min-h-screen w-full bg-cover bg-center bg-fixed text-white",
        adminChrome && "md:pl-72",
        light && "theme-light",
        platform === "android" && "platform-android",
      )}
      style={{
        backgroundImage: light
          ? `url(${bg})`
          : `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url(${bg})`,
      }}
    >
      <MobileTopBar />
      <div className="flex min-h-screen">
        <AppNavRail surface={surface} />
        <main className="flex-1 min-w-0 pb-24 md:pb-0">{children}</main>
      </div>
      <MobileBottomBar />
      {/* First-conversation disclaimer gate. Entry points (Home "Chat Now",
          the Chat nav item, You / Sessions empty-state CTAs) route through
          useStartChat, which for a first-time user stashes the launch and
          waits for this gate to play the acknowledgements, then navigate to
          /chat. The web analog to mounting it in HomeScreen / ScreenChrome. */}
      <FirstSessionDisclaimerGate />
    </div>
  );
}

function AppNavRail({ surface: _surface }: { surface: Surface }) {
  const isActive = useIsActive();
  const startChat = useStartChat();
  const sessions = useSessions();
  const { pathname } = useLocation();

  return (
    <aside
      aria-label="Primary"
      className="hidden md:flex sticky top-0 h-screen w-[76px] lg:w-64 shrink-0 flex-col gap-1 border-r border-white/15 px-3 lg:px-4 py-6"
    >
      <Link
        to="/home"
        className="mb-7 flex items-center justify-center lg:justify-start px-1 text-white"
        aria-label="Yuna home"
      >
        <YunaWordmark className="h-5 lg:h-7 w-auto" />
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(item.to);
          const inner = (
            <>
              <item.Icon size={20} strokeWidth={1.7} aria-hidden className="shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </>
          );
          const cls = cn(
            "flex items-center justify-center lg:justify-start gap-3 rounded-2xl px-3 py-2.5 text-sm tracking-wide transition-colors",
            active
              ? "bg-white/15 text-white font-semibold"
              : "text-white/70 active:text-white",
          );
          return item.startsChat ? (
            <button
              key={item.label}
              type="button"
              onClick={() => startChat({ q: "Chat Now", mode: "voice" })}
              className={cls}
              aria-current={active ? "page" : undefined}
            >
              {inner}
            </button>
          ) : (
            <Link
              key={item.label}
              to={item.to}
              className={cls}
              aria-current={active ? "page" : undefined}
            >
              {inner}
            </Link>
          );
        })}
      </nav>

      {sessions.length > 0 && (
        <div className="hidden lg:block mt-7 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="px-3 mb-2 text-[10px] tracking-[0.25em] uppercase text-white/55">
            Recent
          </p>
          <ul className="flex flex-col">
            {sessions.slice(0, 6).map((s) => {
              const active = pathname === `/sessions/${s.id}`;
              return (
                <li key={s.id}>
                  <Link
                    to="/sessions/$id"
                    params={{ id: s.id }}
                    className={cn(
                      "block rounded-xl px-3 py-2 text-[13px] leading-snug transition-colors line-clamp-2",
                      active ? "bg-white/10 text-white" : "text-white/70 active:text-white",
                    )}
                  >
                    {s.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <RailFooterLink to="/design-your-trial" Icon={Sparkles} label="Upgrade" />
        <RailFooterLink to="/settings" Icon={Settings} label="Settings" />
      </div>
    </aside>
  );
}

function RailFooterLink({
  to,
  Icon,
  label,
}: {
  to: string;
  Icon: typeof House;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-center lg:justify-start gap-2 rounded-2xl px-3 py-2.5 text-sm tracking-wide text-white/70 active:text-white transition-colors"
    >
      <Icon size={20} strokeWidth={1.7} aria-hidden className="shrink-0" />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}

function MobileTopBar() {
  return (
    <header className="md:hidden flex items-center justify-between px-5 pt-4 pb-3">
      <Link to="/home" className="text-white" aria-label="Yuna home">
        <YunaWordmark className="h-6 w-auto" />
      </Link>
      <div className="flex items-center gap-1">
        <Link
          to="/design-your-trial"
          className="grid h-10 w-10 place-items-center rounded-full text-white/80 active:text-white"
          aria-label="Upgrade"
        >
          <Sparkles size={20} strokeWidth={1.7} aria-hidden />
        </Link>
        <Link
          to="/settings"
          className="grid h-10 w-10 place-items-center rounded-full text-white/80 active:text-white"
          aria-label="Settings"
        >
          <Settings size={20} strokeWidth={1.7} aria-hidden />
        </Link>
      </div>
    </header>
  );
}

function MobileBottomBar() {
  const isActive = useIsActive();
  const startChat = useStartChat();
  // Fill is mode-aware: `.theme-light` doesn't remap bg-black, so a dark wash
  // would clash with the inverted (ink) labels in light mode. Pick per mode.
  const light = isLightMode(useAppMode());
  const fill = light ? "bg-white/70 backdrop-blur-md" : "bg-black/30 backdrop-blur-md";

  return (
    <nav
      aria-label="Main"
      className={cn(
        "md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 gap-1 border-t border-white/15 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        fill,
      )}
    >
      {NAV.map((item) => {
        const active = isActive(item.to);
        const inner = (
          <>
            <item.Icon
              size={22}
              strokeWidth={1.7}
              aria-hidden
              className={active ? "text-white" : "text-white/60"}
            />
            <span
              className={cn(
                "text-[11px] tracking-[0.01em]",
                active ? "text-white font-semibold" : "text-white/60",
              )}
            >
              {item.label}
            </span>
          </>
        );
        const cls = "flex flex-col items-center gap-1 py-1";
        return item.startsChat ? (
          <button
            key={item.label}
            type="button"
            onClick={() => startChat({ q: "Chat Now", mode: "voice" })}
            className={cls}
            aria-current={active ? "page" : undefined}
          >
            {inner}
          </button>
        ) : (
          <Link
            key={item.label}
            to={item.to}
            className={cls}
            aria-current={active ? "page" : undefined}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Standard content well for web screens — centered, max-width, cluster padding.
 * `width` tunes the column: prose-ish screens stay narrow, grids go wider.
 */
export function WebContent({
  children,
  width = "max-w-3xl",
  className,
}: {
  children: ReactNode;
  width?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full px-6 lg:px-10 py-10 lg:py-14", width, className)}>
      {children}
    </div>
  );
}
