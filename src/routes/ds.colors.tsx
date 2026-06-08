import { createFileRoute } from "@tanstack/react-router";
import { DSPage, Section, SurfacePair } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/colors")({
  head: () => ({
    meta: [
      { title: "Design System — Colors" },
      { name: "description", content: "Palette, secondary palette, and text-on-background." },
    ],
  }),
  component: DSColors,
});

// ─── Swatch model ─────────────────────────────────────────────────────────
// One swatch = one shade actually used in the product. `fill` is the CSS the
// chip paints; `on` backs translucent fills so they read against the page.

type Swatch = {
  name: string;
  value: string;
  fill: string;
  token?: string;
  // Backing behind the fill, for shades that aren't fully opaque:
  //   "checker" — checkerboard grid, so a translucent fill reads as see-through
  //   "dark"    — the dark cluster surface, to show a tint as it sits on it
  on?: "checker" | "dark";
};

type Family = { label: string; base: string; token?: string; shades: Swatch[] };

// Checkerboard so translucent shades read as transparent rather than as a pale
// solid against the page.
const CHECKER =
  "repeating-conic-gradient(#ccc9c5 0% 25%, #ffffff 0% 50%) 0 0 / 12px 12px";

// ─── Palette ────────────────────────────────────────────────────────────────
// Each family lists only the shades the product paints with — the solid base,
// the interaction/ink companions where they exist, and (for ink and white) the
// opacity steps the type ramp uses.

const PALETTE: Family[] = [
  {
    label: "Primary Green",
    base: "#115430",
    token: "--primary-green",
    shades: [{ name: "Base", value: "#115430", fill: "#115430", token: "--primary-green" }],
  },
  {
    label: "Secondary Green",
    base: "#66BA24",
    token: "--secondary-green",
    shades: [
      { name: "Base", value: "#66BA24", fill: "#66BA24", token: "--secondary-green" },
      { name: "Pressed", value: "#4D9C1A", fill: "#4D9C1A", token: "--secondary-green-pressed" },
      {
        name: "Tint",
        value: "10% on dark",
        fill: "color-mix(in srgb, #66BA24 10%, transparent)",
        on: "dark",
      },
      {
        name: "Tint",
        value: "10% on white",
        fill: "color-mix(in srgb, #66BA24 10%, transparent)",
        on: "checker",
      },
    ],
  },
  {
    label: "Primary Beige",
    base: "#F5F0ED",
    token: "--primary-beige",
    shades: [{ name: "Base", value: "#F5F0ED", fill: "#F5F0ED", token: "--primary-beige" }],
  },
  {
    label: "Neutral",
    base: "#1E2220",
    token: "--neutral",
    shades: [
      { name: "100%", value: "#1E2220", fill: "#1E2220", token: "--neutral" },
      { name: "85%", value: "rgba(30,34,32,0.85)", fill: "rgba(30,34,32,0.85)", on: "checker" },
      { name: "75%", value: "rgba(30,34,32,0.75)", fill: "rgba(30,34,32,0.75)", on: "checker" },
      { name: "60%", value: "rgba(30,34,32,0.6)", fill: "rgba(30,34,32,0.6)", on: "checker" },
    ],
  },
  {
    label: "White",
    base: "#FFFFFF",
    shades: [
      { name: "100%", value: "#FFFFFF", fill: "#FFFFFF", on: "checker" },
      { name: "85%", value: "rgba(255,255,255,0.85)", fill: "rgba(255,255,255,0.85)", on: "checker" },
      { name: "75%", value: "rgba(255,255,255,0.75)", fill: "rgba(255,255,255,0.75)", on: "checker" },
      { name: "60%", value: "rgba(255,255,255,0.6)", fill: "rgba(255,255,255,0.6)", on: "checker" },
    ],
  },
  {
    label: "Alert Orange",
    base: "#F2994A",
    token: "--alert-orange",
    shades: [
      { name: "Base", value: "#F2994A", fill: "#F2994A", token: "--alert-orange" },
      { name: "Pressed", value: "#D97E2E", fill: "#D97E2E", token: "--alert-orange-pressed" },
    ],
  },
  {
    label: "Alert Red",
    base: "#E0493F",
    token: "--alert-red",
    shades: [
      { name: "Base", value: "#E0493F", fill: "#E0493F", token: "--alert-red" },
      { name: "Pressed", value: "#C53A30", fill: "#C53A30", token: "--alert-red-pressed" },
    ],
  },
];

// ─── Secondary palette ───────────────────────────────────────────────────────
// Accent hues beyond the core palette, organized by color — each a light tint
// paired with a deeper companion. Documented by hue, not by where the app
// happens to spend them.

const SECONDARY: Family[] = [
  {
    label: "Blue",
    base: "#A7C7E7",
    shades: [
      { name: "Base", value: "#A7C7E7", fill: "#A7C7E7", token: "--blue" },
      { name: "Soft", value: "#D4E3F4", fill: "#D4E3F4", token: "--blue-soft" },
    ],
  },
  {
    label: "Purple",
    base: "#6E5A6B",
    shades: [
      { name: "Base", value: "#6E5A6B", fill: "#6E5A6B", token: "--purple" },
      { name: "Soft", value: "#C5B6E0", fill: "#C5B6E0", token: "--purple-soft" },
    ],
  },
  {
    label: "Amber",
    base: "#F2D08A",
    shades: [
      { name: "Base", value: "#F2D08A", fill: "#F2D08A", token: "--amber" },
      { name: "Soft", value: "#F8F1DC", fill: "#F8F1DC", token: "--amber-soft" },
    ],
  },
  {
    label: "Peach",
    base: "#D98C52",
    shades: [
      { name: "Base", value: "#D98C52", fill: "#D98C52", token: "--peach" },
      { name: "Soft", value: "#F4B183", fill: "#F4B183", token: "--peach-soft" },
    ],
  },
  {
    label: "Teal",
    base: "#5E9389",
    shades: [
      { name: "Base", value: "#5E9389", fill: "#5E9389", token: "--teal" },
      { name: "Soft", value: "#9FD0CB", fill: "#9FD0CB", token: "--teal-soft" },
    ],
  },
];

// Stepped emphasis for text — base color + opacity per role.
const TEXT_LADDER: { role: string; dark: string; light: string }[] = [
  { role: "Primary", dark: "White · 100%", light: "Ink · 100%" },
  { role: "Body / secondary", dark: "White · 85%", light: "Ink · 85%" },
  { role: "Meta / value", dark: "White · 75%", light: "Ink · 75%" },
  { role: "Hint / disabled", dark: "White · 60%", light: "Ink · 60%" },
];

function DSColors() {
  return (
    <DSPage title="Colors">
      {/* ─── Palette ────────────────────────────────────────────────────── */}
      <div className="mb-14 flex flex-col gap-9">
        {PALETTE.map((f) => (
          <ColorFamily key={f.label} family={f} />
        ))}
      </div>

      {/* ─── Secondary palette ──────────────────────────────────────────── */}
      <Section
        title="Secondary Palette"
        subtitle="Accent hues beyond the core palette, each a light tint paired with a deeper companion."
      >
        <div className="flex flex-col gap-7">
          {SECONDARY.map((f) => (
            <ColorFamily key={f.label} family={f} />
          ))}
        </div>
      </Section>

      {/* ─── Text on backgrounds ────────────────────────────────────────── */}
      <Section
        title="Text on backgrounds"
        subtitle="White on the dark background, ink on the light one, stepped down by opacity for secondary, meta, and hint. Don't go below the lowest step for anything meant to be read — add weight (heavier glyph, fill, layout) instead."
      >
        <SurfacePair
          align="start"
          renderRow={(surface) => {
            const isDark = surface === "dark";
            const ink = isDark ? "text-white" : "text-foreground";
            const secondary = isDark ? "text-white/85" : "text-foreground/85";
            const meta = isDark ? "text-white/75" : "text-foreground/75";
            const hint = isDark ? "text-white/60" : "text-foreground/60";
            return (
              <div className="flex flex-col gap-2">
                <p className={`font-display text-2xl tracking-tight ${ink}`}>
                  Quiet space for your mind
                </p>
                <p className={`text-[15px] leading-snug ${ink}`}>
                  Here to listen, reflect, and grow with you.
                </p>
                <p className={`text-[15px] leading-snug ${secondary}`}>
                  A calmer place to check in with yourself.
                </p>
                <p className={`text-[13px] leading-snug ${meta}`}>
                  Last reflection saved a few moments ago.
                </p>
                <p className={`text-[13px] leading-snug ${hint}`}>
                  Tap to begin whenever you're ready.
                </p>
              </div>
            );
          }}
        />
        <div className="mt-4 rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1.4fr)_1fr_1fr] gap-x-4 bg-muted/40 px-5 py-3 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
            <span>Role</span>
            <span>Dark background</span>
            <span>Light background</span>
          </div>
          {TEXT_LADDER.map((r) => (
            <div
              key={r.role}
              className="grid grid-cols-[minmax(0,1.4fr)_1fr_1fr] gap-x-4 px-5 py-3 border-t border-border text-[13px]"
            >
              <span className="text-foreground">{r.role}</span>
              <span className="text-muted-foreground">{r.dark}</span>
              <span className="text-muted-foreground">{r.light}</span>
            </div>
          ))}
        </div>
      </Section>
    </DSPage>
  );
}

// ─── Swatch chip ──────────────────────────────────────────────────────────
// The single swatch shape used everywhere on this page — same tile size, same
// label stack — so the palette reads as one system, not three.

function Chip({ swatch }: { swatch: Swatch }) {
  const backing = swatch.on === "checker" ? CHECKER : swatch.on === "dark" ? "#1E2220" : undefined;
  return (
    <div className="flex w-[152px] flex-col gap-1.5">
      <div
        className="h-14 w-14 overflow-hidden rounded-lg border border-border"
        style={{ background: backing }}
      >
        <div className="h-full w-full" style={{ background: swatch.fill }} />
      </div>
      <div className="leading-tight">
        <p className="text-xs font-semibold text-foreground">{swatch.name}</p>
        {swatch.token && (
          <p className="whitespace-nowrap text-[11px] text-muted-foreground">{swatch.token}</p>
        )}
        <p className="whitespace-nowrap text-[11px] text-muted-foreground tabular-nums">
          {swatch.value}
        </p>
      </div>
    </div>
  );
}

// ─── Family ───────────────────────────────────────────────────────────────

function ColorFamily({ family }: { family: Family }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="h-3.5 w-3.5 rounded-full border border-border shrink-0"
          style={{ background: family.base }}
        />
        <span className="text-[13px] font-semibold text-foreground">{family.label}</span>
        {family.token && (
          <span className="text-xs text-muted-foreground">{family.token}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        {family.shades.map((s, i) => (
          <Chip key={i} swatch={s} />
        ))}
      </div>
    </div>
  );
}
