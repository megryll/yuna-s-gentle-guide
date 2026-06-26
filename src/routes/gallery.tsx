import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { useFrameSize } from "@/lib/frame-size";
import { getScreenRegions, type ResolvedScreen } from "@/lib/screen-catalog";

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

// Zoom = how many phone thumbnails sit in a row. Fewer columns → bigger screens.
// Each thumb's width is derived from the live board width so the row always
// fills edge-to-edge; height follows the selected device's aspect ratio.
const MIN_COLS = 3;
const MAX_COLS = 8;
const DEFAULT_COLS = 6;
const COLS_KEY = "yuna.galleryCols";
const GAP_X = 20; // matches gap-x-5

function withChromeOff(url: string): string {
  return url + (url.includes("?") ? "&" : "?") + "chrome=off";
}

function readCols(): number {
  if (typeof window === "undefined") return DEFAULT_COLS;
  const raw = Number(window.localStorage.getItem(COLS_KEY));
  return raw >= MIN_COLS && raw <= MAX_COLS ? raw : DEFAULT_COLS;
}

function Gallery() {
  const regions = getScreenRegions();

  const [cols, setCols] = useState(DEFAULT_COLS);
  // Read the persisted zoom after mount to avoid an SSR/client mismatch.
  useEffect(() => setCols(readCols()), []);

  const setZoom = (next: number) => {
    const clamped = Math.min(MAX_COLS, Math.max(MIN_COLS, next));
    setCols(clamped);
    if (typeof window !== "undefined")
      window.localStorage.setItem(COLS_KEY, String(clamped));
  };

  // Measure the board's content width so we can size each thumb to fill the row.
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(0);
  useLayoutEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    const measure = () => setBoardWidth(node.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const thumbWidth =
    boardWidth > 0 ? (boardWidth - (cols - 1) * GAP_X) / cols : 0;

  return (
    <main className="min-h-screen bg-background md:pl-44">
      <div className="mx-auto max-w-[1400px] px-6 pt-20 pb-16">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl tracking-tight text-foreground">
              All screens
            </h1>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Every prototype screen, live. Flip platform, mode, or frame size up top and
              the whole board follows. Click a screen to open it, or ⌘-click for a new tab.
            </p>
          </div>
          <ZoomControl cols={cols} onChange={setZoom} />
        </header>

        <div ref={boardRef}>
          {regions.map((region) => (
            <section key={region.title} className="mb-12">
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-foreground">
                {region.title}
              </h2>
              <div
                className="grid justify-start gap-y-7"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  columnGap: GAP_X,
                }}
              >
                {region.screens.map((screen) => (
                  <Thumb key={screen.url} screen={screen} width={thumbWidth} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

// Slider plus −/+ steppers. Lower column count = larger screens, so "+" (zoom
// in) decreases the count and "−" (zoom out) increases it.
function ZoomControl({
  cols,
  onChange,
}: {
  cols: number;
  onChange: (next: number) => void;
}) {
  const stepBtn =
    "flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground/[0.06] active:bg-foreground/10 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-muted/40 px-3 py-1.5">
      <span className="text-xs font-medium text-muted-foreground">Zoom</span>
      <button
        type="button"
        className={stepBtn}
        onClick={() => onChange(cols + 1)}
        disabled={cols >= MAX_COLS}
        aria-label="Zoom out (more screens per row)"
      >
        −
      </button>
      {/* Slider runs the natural way: drag right → zoom in → bigger screens.
          Value is inverted against the column count to keep that direction. */}
      <input
        type="range"
        min={MIN_COLS}
        max={MAX_COLS}
        step={1}
        value={MIN_COLS + MAX_COLS - cols}
        onChange={(e) => onChange(MIN_COLS + MAX_COLS - Number(e.target.value))}
        aria-label="Screens per row"
        className="w-28 accent-foreground"
      />
      <button
        type="button"
        className={stepBtn}
        onClick={() => onChange(cols - 1)}
        disabled={cols <= MIN_COLS}
        aria-label="Zoom in (fewer screens per row)"
      >
        +
      </button>
      <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
        {cols} / row
      </span>
    </div>
  );
}

function Thumb({ screen, width }: { screen: ResolvedScreen; width: number }) {
  const navigate = useNavigate();
  const frame = useFrameSize();
  const scale = width / frame.w;
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
    <div className="flex min-w-0 flex-col gap-2">
      <div
        ref={ref}
        className="relative overflow-hidden rounded-[1.25rem] border border-border bg-muted/40"
        style={{ height: scaledHeight }}
      >
        {visible && width > 0 && (
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
          className="absolute inset-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring hover:bg-foreground/[0.06] active:bg-foreground/10"
        />
      </div>
      <span className="truncate text-xs text-foreground/80">{screen.label}</span>
    </div>
  );
}
