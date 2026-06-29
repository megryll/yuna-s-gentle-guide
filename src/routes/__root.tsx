import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { AdminSidebar } from "@/components/AdminSidebar";
import { EngineerSidebar } from "@/components/EngineerSidebar";
import { UserTypeToggle } from "@/components/UserTypeToggle";
import { PlatformToggle } from "@/components/PlatformToggle";
import { ModeToggle } from "@/components/ModeToggle";
import { FrameSizeToggle } from "@/components/FrameSizeToggle";
import { PrototypeMuteToggle } from "@/components/PrototypeMuteToggle";
import { CommentsToggle } from "@/components/CommentsToggle";
import { CommentLayer } from "@/components/CommentLayer";
import { useCommentsEnabled } from "@/lib/comments";
// Side-effect import: installs the global Audio() interceptor early so every
// audio element the app creates respects the prototype-mute admin toggle.
import "@/lib/prototype-mute";
import { startAmbient, stopAmbient } from "@/lib/ambient-audio";
import { useNatureSoundsOn } from "@/lib/nature-sounds-prefs";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors active:bg-foreground/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  // `chrome=off` is a global search flag, preserved on every route via the
  // root's validateSearch (leaf routes only return their own keys, so without
  // this the flag would be stripped and the URL rewritten). The /gallery board
  // appends it to each iframe src to suppress admin chrome + ambient audio.
  validateSearch: (search: Record<string, unknown>) => ({
    chrome: search.chrome === "off" ? ("off" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Yuna — your gentle guide" },
      {
        name: "description",
        content:
          "A calm, private space to talk through what's on your mind. Chat or call with Yuna, your AI wellness companion.",
      },
      { name: "author", content: "Yuna" },
      { property: "og:title", content: "Yuna — your gentle guide" },
      {
        property: "og:description",
        content:
          "A calm, private space to talk through what's on your mind. Chat or call with Yuna, your AI wellness companion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "twitter:description",
        content: "A calm, private space to talk through what's on your mind.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  // Bare render: no admin chrome and no ambient audio. Used by standalone doc
  // routes (animation-specs) and by any screen loaded with `?chrome=off` —
  // which is how the /gallery board embeds every screen as a live iframe
  // without 60 sidebars and 60 forest beds layering on top of each other.
  const bare = useLocation({
    select: (l) =>
      l.pathname === "/animation-specs" ||
      (l.search as Record<string, unknown>)?.chrome === "off",
  });

  // The /gallery board is itself a wide admin surface, so the right-hand
  // engineer panel (per-screen notes / inspector) has nothing to act on and
  // just crowds the board — hide it there. The left page index stays.
  const onGallery = useLocation({ select: (l) => l.pathname === "/gallery" });

  // Global forest-ambient controller. Runs once for the app's lifetime so the
  // bed plays across every screen unless the user flips Nature Sounds off in
  // Settings. Routes that manage their own ambient (intro, chat) still pause
  // the singleton locally; they restart it on the way out so navigating
  // anywhere else picks it up again.
  const natureSoundsOn = useNatureSoundsOn();
  useEffect(() => {
    if (bare) return;
    if (natureSoundsOn) startAmbient();
    else stopAmbient(400);
  }, [natureSoundsOn, bare]);

  const commentsEnabled = useCommentsEnabled();

  if (bare) {
    return <Outlet />;
  }

  return (
    <>
      <AdminSidebar />
      {!onGallery && <EngineerSidebar />}
      <div className="hidden md:flex fixed left-1/2 -translate-x-1/2 top-3 z-50 items-center gap-2">
        <PlatformToggle />
        <ModeToggle />
        <FrameSizeToggle />
        <UserTypeToggle />
        <PrototypeMuteToggle />
        <CommentsToggle />
      </div>
      <Outlet />
      {commentsEnabled && <CommentLayer />}
    </>
  );
}
