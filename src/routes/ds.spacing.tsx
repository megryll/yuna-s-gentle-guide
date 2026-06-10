import { createFileRoute } from "@tanstack/react-router";
import { DSPage, Section } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/spacing")({
  head: () => ({
    meta: [
      { title: "Design System — Spacing" },
      { name: "description", content: "Spacing scale, screen padding, and radius tokens." },
    ],
  }),
  component: DSSpacing,
});

// ─── Spacing scale ──────────────────────────────────────────────────────────
// Tailwind's 4px base unit (step n = n × 4px). Only the steps the product
// actually paints with are listed — pick the named step by role, never an
// arbitrary px value.

type Step = { step: string; px: number; role: string };

const SCALE: Step[] = [
  { step: "1", px: 4, role: "Hairline gaps — icon-to-label, tight stacks" },
  { step: "1.5", px: 6, role: "Chip / tag interior, small inline gaps" },
  { step: "2", px: 8, role: "Default chip row gap, compact list spacing" },
  { step: "3", px: 12, role: "Control gaps, button icon spacing" },
  { step: "4", px: 16, role: "Standard block gap inside a section" },
  { step: "5", px: 20, role: "Header bar padding, chat gutter" },
  { step: "6", px: 24, role: "Tab-screen body gutter, section spacing" },
  { step: "8", px: 32, role: "Hero gutter, between major sections" },
  { step: "10", px: 40, role: "Hero footer breathing room (pb-10)" },
  { step: "12", px: 48, role: "Large vertical rhythm between groups" },
  { step: "14", px: 56, role: "Top safe-area gutter (pt-14)" },
  { step: "20", px: 80, role: "Generous centered-layout padding" },
];

// ─── Screen padding ───────────────────────────────────────────────────────
// The agreed per-cluster padding. These are conventions, not free choices —
// every screen of a given cluster shares them so back arrows and CTAs line up.

type Pad = { cluster: string; classes: string; note: string };

const PADDING: Pad[] = [
  {
    cluster: "Photo-bg hero (no scroll)",
    classes: "px-8 pt-14 pb-10",
    note: "Welcome, Auth, Intro — header, body, footer share px-8 so edges align.",
  },
  {
    cluster: "Photo-bg scrolling",
    classes: "px-8 / px-6",
    note: "Focus area, Wrap-up, You — no hero pt-14/pb-10 on the scroll wrapper; let content own its vertical padding.",
  },
  {
    cluster: "Tab screens",
    classes: "px-6",
    note: "Home, You, Progress, Activities body gutter.",
  },
  {
    cluster: "Light header bar",
    classes: "px-5 pt-14 pb-2",
    note: "Chat, call, ScreenChrome header cluster.",
  },
  {
    cluster: "Chat scroll",
    classes: "px-5",
    note: "Conversational scroll — denser than hero.",
  },
  {
    cluster: "Call body",
    classes: "px-8",
    note: "Heroic centered layout.",
  },
];

// ─── Radius ─────────────────────────────────────────────────────────────────
// Derived from --radius (1.25rem / 20px). Used for cards, sheets, pills, and
// the frosted surfaces across the app.

type Rad = { token: string; cls: string; px: number; role: string };

const RADIUS: Rad[] = [
  { token: "--radius-sm", cls: "rounded-sm", px: 16, role: "Small inset elements" },
  { token: "--radius-md", cls: "rounded-md", px: 18, role: "Nav rows, compact controls" },
  { token: "--radius-lg", cls: "rounded-lg", px: 20, role: "Base — inputs, swatches" },
  { token: "--radius-xl", cls: "rounded-xl", px: 24, role: "Buttons, tags" },
  { token: "--radius-2xl", cls: "rounded-2xl", px: 28, role: "Content & feed cards, sheets" },
  { token: "--radius-3xl", cls: "rounded-3xl", px: 32, role: "Drawers, large overlays" },
  { token: "--radius-4xl", cls: "rounded-4xl", px: 36, role: "Phone frame, hero panels" },
];

function DSSpacing() {
  return (
    <DSPage title="Spacing">
      {/* ─── Scale ───────────────────────────────────────────────────────── */}
      <Section
        title="Scale"
        subtitle="Tailwind's 4px base unit (step n × 4px). Use a named step (gap-4, p-6, mt-8) — never an arbitrary px value."
      >
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-[64px_64px_1fr_minmax(0,1.4fr)] gap-x-4 bg-muted/40 px-4 py-3 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
            <span>Step</span>
            <span>Px</span>
            <span>Size</span>
            <span>Role</span>
          </div>
          {SCALE.map((s) => (
            <div
              key={s.step}
              className="grid grid-cols-[64px_64px_1fr_minmax(0,1.4fr)] items-center gap-x-4 px-4 py-2.5 border-t border-border text-[13px]"
            >
              <span className="text-[12px] text-muted-foreground tabular-nums">{s.step}</span>
              <span className="text-[12px] text-muted-foreground tabular-nums">{s.px}px</span>
              <span className="block h-3 rounded-full bg-foreground/80" style={{ width: s.px }} />
              <span className="text-muted-foreground">{s.role}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Screen padding ──────────────────────────────────────────────── */}
      <Section
        title="Screen padding"
        subtitle="Per-cluster gutters. These are agreed conventions — every screen in a cluster shares them so back arrows and CTAs sit on one vertical edge."
      >
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.6fr)] gap-x-4 bg-muted/40 px-4 py-3 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
            <span>Cluster</span>
            <span>Padding</span>
            <span>Note</span>
          </div>
          {PADDING.map((p) => (
            <div
              key={p.cluster}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.6fr)] gap-x-4 px-4 py-3 border-t border-border text-[13px]"
            >
              <span className="text-foreground">{p.cluster}</span>
              <code className="text-[12px] text-muted-foreground">{p.classes}</code>
              <span className="text-muted-foreground leading-snug">{p.note}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Radius ──────────────────────────────────────────────────────── */}
      <Section
        title="Radius"
        subtitle="Derived from --radius (20px). Cards and sheets use rounded-2xl; pills/buttons round fully (rounded-full)."
      >
        <div className="flex flex-wrap gap-x-6 gap-y-5">
          {RADIUS.map((r) => (
            <div key={r.token} className="flex w-[150px] flex-col gap-2">
              <div
                className="h-16 w-16 border border-border bg-muted/60"
                style={{ borderRadius: r.px }}
              />
              <div className="leading-tight">
                <p className="text-[12px] font-semibold text-foreground">{r.cls}</p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {r.token} · {r.px}px
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </DSPage>
  );
}
