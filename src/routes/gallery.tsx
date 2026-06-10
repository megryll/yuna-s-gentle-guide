import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { useFrameSize } from "@/lib/frame-size";
import { getScreenSections, type ResolvedScreen } from "@/lib/screen-catalog";

// Board view of the whole prototype: every catalogued screen rendered live as a
// scaled-down iframe (loaded with ?chrome=off so it's frame-only and silent).
// Because the platform/mode/frame-size toggles are localStorage-backed and the
// iframes are same-origin, flipping a toggle up top re-renders every thumbnail
// in real time — the thing Figma can't do. Click a thumbnail to open the real
// screen (⌘/Ctrl-click opens it in a new tab).
export const Route = createFileRoute("/gallery")({
  head: () => ({ meta: [{ title: "All screens — Yuna" }] }),
  component: Gallery,
});

// On-board width of each phone thumbnail; height follows the live frame ratio.
const THUMB_WIDTH = 190;

function withChromeOff(url: string): string {
  return url + (url.includes("?") ? "&" : "?") + "chrome=off";
}

function Gallery() {
  const sections = getScreenSections();

  return (
    <main className="min-h-screen bg-background md:pl-44">
      <div className="mx-auto max-w-[1400px] px-6 pt-20 pb-16">
        <header className="mb-10">
          <h1 className="font-display text-4xl tracking-tight text-foreground">All screens</h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Every prototype screen, live. Flip platform, mode, or frame size up top and the
            whole board follows. Click a screen to open it, or ⌘-click for a new tab.
          </p>
        </header>

        {sections.map((section) =>
          section.screens.length === 0 ? null : (
            <section key={section.title} className="mb-12">
              <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                {section.title}
              </h2>
              <div className="flex flex-wrap gap-x-6 gap-y-8">
                {section.screens.map((screen) => (
                  <Thumb key={screen.url} screen={screen} />
                ))}
              </div>
            </section>
          ),
        )}
      </div>
    </main>
  );
}

function Thumb({ screen }: { screen: ResolvedScreen }) {
  const navigate = useNavigate();
  const frame = useFrameSize();
  const scale = THUMB_WIDTH / frame.w;
  const scaledHeight = frame.h * scale;

  // Lazy-mount: spinning up an iframe per screen at once is heavy, so each cell
  // stays a placeholder until it scrolls near the viewport, then mounts and
  // stays mounted (no reload churn on scroll-away). rootMargin preloads ahead.
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "500px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [visible]);

  const open = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      window.open(screen.url, "_blank");
      return;
    }
    navigate({
      to: screen.to as never,
      search: screen.search as never,
      params: screen.params as never,
    });
  };

  return (
    <div className="flex flex-col gap-2" style={{ width: THUMB_WIDTH }}>
      <div
        ref={ref}
        className="relative overflow-hidden rounded-[1.25rem] border border-border bg-muted/40"
        style={{ width: THUMB_WIDTH, height: scaledHeight }}
      >
        {visible && (
          <iframe
            src={withChromeOff(screen.url)}
            title={screen.label}
            aria-hidden
            tabIndex={-1}
            className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
            style={{ width: frame.w, height: frame.h, transform: `scale(${scale})` }}
          />
        )}
        {/* Click target sits over the (non-interactive) iframe so taps open the
            real screen instead of poking into the embedded app. */}
        <button
          type="button"
          onClick={open}
          aria-label={`Open ${screen.label}`}
          className="absolute inset-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:bg-foreground/10"
        />
      </div>
      <span className="text-xs text-foreground/80">{screen.label}</span>
    </div>
  );
}
