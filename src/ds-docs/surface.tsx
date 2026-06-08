import { Fragment, useState, type ReactNode } from "react";
import { PhoneFrameContext } from "@/components/PhoneFrame";
import { usePlatform } from "@/lib/platform";
import { modeImage } from "@/lib/theme-prefs";

/**
 * DS-documentation page kit — NOT a prototype component.
 *
 * Everything in src/ds-docs/ exists only to build the /ds/* showcase pages.
 * The actual mobile app never imports from here; keep it that way. Real,
 * shippable components live in src/components/.
 *
 * Every primitive is documented on both photo backgrounds the app sits on
 * (the app's own dark/light mode photos, via `modeImage`) so contrast can be
 * eyeballed in the same context the user sees.
 */

export function DSPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="ml-44 min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-10 py-12">
        <header className="mb-10">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Design System
          </p>
          <h1 className="text-3xl tracking-tight">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  );
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="text-lg tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

export function SurfacePair({
  renderRow,
  innerLabel,
  align = "center",
}: {
  renderRow: (surface: "dark" | "light") => ReactNode;
  innerLabel?: string;
  align?: "center" | "start";
}) {
  return (
    <div>
      {innerLabel && (
        <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
          {innerLabel}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <SurfacePanel tone="dark" align={align}>{renderRow("dark")}</SurfacePanel>
        <SurfacePanel tone="light" align={align}>{renderRow("light")}</SurfacePanel>
      </div>
    </div>
  );
}

export function SurfacePanel({
  tone,
  children,
  align = "center",
}: {
  tone: "dark" | "light";
  children: ReactNode;
  align?: "center" | "start";
}) {
  const bg = modeImage(tone);
  const itemsClass = align === "start" ? "items-start" : "items-center";
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className={`relative px-6 py-7 min-h-[96px] flex ${itemsClass}`}>
        <div className="w-full">
          <p
            className={
              "text-[11px] tracking-[0.25em] uppercase mb-3 " +
              (tone === "dark" ? "text-white/65" : "text-foreground/65")
            }
          >
            {tone === "dark" ? "Dark surface" : "Light surface"}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Row({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex items-center flex-wrap gap-3 ${className}`}>{children}</div>;
}

// ─── Device frame ─────────────────────────────────────────────────────────
// A simulated phone for position-dependent things — overlays that slide up
// (drawers, modals) or pin to an edge (toasts). It provides the
// PhoneFrameContext so a real Drawer portals INTO the frame (absolute, scrim
// clipped to the device) instead of the browser viewport. `surface` picks the
// photo + adds `.theme-light` so white-on-dark content inverts for light mode,
// and it mirrors the live platform toggle for blur fidelity. Children render
// over the photo; position them with absolute classes (e.g. a top toast).

export function DeviceFrame({
  surface,
  label = true,
  children,
}: {
  surface: "dark" | "light";
  label?: boolean;
  children?: ReactNode;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const platform = usePlatform();
  const dark = surface === "dark";
  const bg = modeImage(surface);
  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">
          {dark ? "Dark surface" : "Light surface"}
        </p>
      )}
      <div
        ref={setContainer}
        className={
          "relative w-[252px] h-[512px] shrink-0 rounded-[2.25rem] overflow-hidden border border-border bg-cover bg-center " +
          (dark ? "" : "theme-light ") +
          (platform === "android" ? "platform-android" : "")
        }
        style={{ backgroundImage: `url(${bg})` }}
      >
        <span
          aria-hidden
          className="absolute top-2 left-1/2 -translate-x-1/2 h-1.5 w-16 rounded-full bg-black/25 z-10"
        />
        <PhoneFrameContext.Provider value={container}>
          {children}
        </PhoneFrameContext.Provider>
      </div>
    </div>
  );
}

// Neutral placeholder bar for device-frame mockups — shows a component's
// footprint (a title, a line of copy, a CTA) without committing to text, so the
// frame reads as size/position only. Tone is picked per surface: white-alpha on
// the dark photo, ink-alpha on the light photo (frosted bg-white/* doesn't
// invert via .theme-light, so we choose directly).
export function Bar({
  surface,
  className = "",
}: {
  surface: "dark" | "light";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={
        "block rounded-full " +
        (surface === "dark" ? "bg-white/30 " : "bg-foreground/25 ") +
        className
      }
    />
  );
}

export function DevicePair({
  renderRow,
}: {
  renderRow: (surface: "dark" | "light") => ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-8">
      <DeviceFrame surface="dark">{renderRow("dark")}</DeviceFrame>
      <DeviceFrame surface="light">{renderRow("light")}</DeviceFrame>
    </div>
  );
}

export function PropsBlock({ children }: { children: string }) {
  return (
    <pre className="text-xs leading-relaxed bg-muted/40 border border-border rounded-2xl p-5 overflow-x-auto">
      {children}
    </pre>
  );
}

// ─── Surface matrix ───────────────────────────────────────────────────────
// Canonical layout for component DS pages: a set of labelled rows (variants,
// states, sizes…) shown on both the dark and light photo surfaces.
//
// Wide: one shared right-aligned label gutter + dark and light filling the
// remaining width as equal columns. Narrow: surfaces stack, each keeping its
// own gutter. Every cell gets an explicit grid-row so content overlaps the
// background layer instead of being bumped past it by auto-placement.

export type MatrixRow = {
  label: string;
  render: (surface: "dark" | "light") => ReactNode;
};

export function SurfaceMatrix({ rows }: { rows: MatrixRow[] }) {
  const templateRows = { gridTemplateRows: `repeat(${rows.length + 1}, auto)` };
  return (
    <>
      {/* Wide — shared gutter, dark + light fill the remaining width equally */}
      <div
        className="hidden lg:grid grid-cols-[minmax(64px,auto)_1fr_1fr] gap-x-6 items-center"
        style={templateRows}
      >
        <MatrixBg tone="dark" col={2} />
        <MatrixBg tone="light" col={3} />
        <div style={{ gridColumn: 1, gridRow: 1 }} />
        <MatrixCaption tone="dark" col={2} />
        <MatrixCaption tone="light" col={3} />
        {rows.map((r, i) => {
          const row = i + 2;
          const last = i === rows.length - 1;
          return (
            <Fragment key={r.label}>
              <MatrixLabel row={row}>{r.label}</MatrixLabel>
              <MatrixCell col={2} row={row} last={last}>{r.render("dark")}</MatrixCell>
              <MatrixCell col={3} row={row} last={last}>{r.render("light")}</MatrixCell>
            </Fragment>
          );
        })}
      </div>

      {/* Narrow — surfaces stack, each keeps its own gutter */}
      <div className="flex flex-col gap-8 lg:hidden">
        <MatrixColumn tone="dark" rows={rows} />
        <MatrixColumn tone="light" rows={rows} />
      </div>
    </>
  );
}

function MatrixColumn({ tone, rows }: { tone: "dark" | "light"; rows: MatrixRow[] }) {
  return (
    <div
      className="grid grid-cols-[minmax(64px,auto)_1fr] gap-x-6 items-center"
      style={{ gridTemplateRows: `repeat(${rows.length + 1}, auto)` }}
    >
      <MatrixBg tone={tone} col={2} />
      <div style={{ gridColumn: 1, gridRow: 1 }} />
      <MatrixCaption tone={tone} col={2} />
      {rows.map((r, i) => {
        const row = i + 2;
        const last = i === rows.length - 1;
        return (
          <Fragment key={r.label}>
            <MatrixLabel row={row}>{r.label}</MatrixLabel>
            <MatrixCell col={2} row={row} last={last}>{r.render(tone)}</MatrixCell>
          </Fragment>
        );
      })}
    </div>
  );
}

function MatrixBg({ tone, col }: { tone: "dark" | "light"; col: number }) {
  const bg = modeImage(tone);
  return (
    <div
      aria-hidden
      className="self-stretch rounded-2xl overflow-hidden border border-border bg-cover bg-center"
      style={{ gridColumn: col, gridRow: "1 / -1", backgroundImage: `url(${bg})` }}
    />
  );
}

function MatrixCaption({ tone, col }: { tone: "dark" | "light"; col: number }) {
  return (
    <div style={{ gridColumn: col, gridRow: 1 }} className="relative z-10 px-6 pt-6 pb-2">
      <p
        className={
          "text-[11px] tracking-[0.25em] uppercase " +
          (tone === "dark" ? "text-white/65" : "text-foreground/65")
        }
      >
        {tone === "dark" ? "Dark surface" : "Light surface"}
      </p>
    </div>
  );
}

// Right-aligned gutter label; smaller than the section heading so it reads as a
// row caption rather than a title.
function MatrixLabel({ row, children }: { row: number; children: ReactNode }) {
  return (
    <div style={{ gridColumn: 1, gridRow: row }} className="text-right">
      <span className="font-display text-sm text-foreground/70">{children}</span>
    </div>
  );
}

function MatrixCell({
  col,
  row,
  last,
  children,
}: {
  col: number;
  row: number;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{ gridColumn: col, gridRow: row }}
      className={"relative z-10 px-6 py-4 " + (last ? "pb-7" : "")}
    >
      {children}
    </div>
  );
}
