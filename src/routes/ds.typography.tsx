import { createFileRoute } from "@tanstack/react-router";
import { DSPage, Section } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/typography")({
  head: () => ({
    meta: [
      { title: "Design System — Typography" },
      { name: "description", content: "Font families, scale, and weights." },
    ],
  }),
  component: DSTypography,
});

// ─── Scale catalogue ────────────────────────────────────────────────────────
// The Tailwind named type scale (text-xs … text-3xl) plus one custom step,
// `text-uppercase` (11px), for tracked-uppercase labels. No arbitrary px sizes
// in app code — pick the named token by the semantic role below.

type ScaleRow = {
  size: string;
  px: number;
  family: "display" | "body";
  role: string;
};

const SCALE: ScaleRow[] = [
  { size: "text-3xl", px: 30, family: "display", role: "Page hero & overlay titles" },
  { size: "text-2xl", px: 24, family: "display", role: "Section hero & card titles" },
  { size: "text-xl", px: 20, family: "display", role: "Large heading & subsection titles" },
  { size: "text-lg", px: 18, family: "display", role: "Dialog, card & option titles, body emphasis" },
  { size: "text-base", px: 16, family: "body", role: "Primary body & list items" },
  { size: "text-sm", px: 14, family: "body", role: "Default body & secondary copy" },
  { size: "text-xs", px: 12, family: "body", role: "Meta text, captions & chip labels" },
  { size: "text-uppercase", px: 11, family: "body", role: "Eyebrows, badges & button labels (tracked uppercase)" },
];

function DSTypography() {
  return (
    <DSPage title="Typography">
      {/* ─── Families ───────────────────────────────────────────────────── */}
      <Section title="Families">
        <div className="grid grid-cols-1 gap-3">
          <FamilyCard
            family="Fraunces"
            tagline="Display / headings — h1–h6, .font-display"
            sample="Quiet space for your mind"
            classNames="font-display text-3xl tracking-tight"
            details={[
              "Variable weight (100–900)",
              "Italic variant available",
              "Source: /fonts/Fraunces-Variable.ttf",
            ]}
          />
          <FamilyCard
            family="Stara"
            tagline="Body — set on `body`, inherits to buttons + inputs"
            sample="Here to listen, reflect, and grow with you."
            classNames="text-xl leading-snug"
            details={[
              "Weights: 500, 600, 700 (+ italics)",
              "Source: /fonts/Stara-Medium.otf, Stara-SemiBold.otf, Stara-Bold.otf",
            ]}
          />
        </div>
      </Section>

      {/* ─── Scale ──────────────────────────────────────────────────────── */}
      <Section title="Scale">
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                <th className="text-left px-4 py-3 font-normal">Class</th>
                <th className="text-left px-4 py-3 font-normal">Px</th>
                <th className="text-left px-4 py-3 font-normal">Family</th>
                <th className="text-left px-4 py-3 font-normal">Role</th>
                <th className="text-left px-4 py-3 font-normal">Sample</th>
              </tr>
            </thead>
            <tbody>
              {SCALE.map((r) => (
                <tr key={r.size} className="border-t border-border align-middle">
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{r.size}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{r.px}px</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{r.family}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{r.role}</td>
                  <td className="px-4 py-3">
                    <ScaleSample row={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ─── Weights ────────────────────────────────────────────────────── */}
      <Section
        title="Weights"
        subtitle="Don't reach for weights not listed — they won't ship."
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border p-5">
            <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
              Stara
            </p>
            <div className="flex flex-col gap-1.5 text-[16px]">
              <p style={{ fontWeight: 500 }}>500 — Medium · Lorem ipsum</p>
              <p style={{ fontWeight: 600 }}>600 — Semibold · Lorem ipsum</p>
              <p style={{ fontWeight: 700 }}>700 — Bold · Lorem ipsum</p>
              <p style={{ fontWeight: 800 }}>800 — ExtraBold · Lorem ipsum</p>
              <p style={{ fontWeight: 900 }}>900 — Black · Lorem ipsum</p>
              <p style={{ fontWeight: 500, fontStyle: "italic" }}>500 italic · Lorem ipsum</p>
              <p style={{ fontWeight: 600, fontStyle: "italic" }}>600 italic · Lorem ipsum</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border p-5">
            <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
              Fraunces (variable)
            </p>
            <div className="flex flex-col gap-1.5 text-[16px] font-display">
              <p style={{ fontWeight: 300 }}>300 — Light · Lorem ipsum</p>
              <p style={{ fontWeight: 400 }}>400 — Regular · Lorem ipsum</p>
              <p style={{ fontWeight: 500 }}>500 — Medium · Lorem ipsum</p>
              <p style={{ fontWeight: 600 }}>600 — Semibold · Lorem ipsum</p>
              <p style={{ fontWeight: 400, fontStyle: "italic" }}>400 italic · Lorem ipsum</p>
            </div>
          </div>
        </div>
      </Section>
    </DSPage>
  );
}

// ─── Cards ──────────────────────────────────────────────────────────────────

function FamilyCard({
  family,
  tagline,
  sample,
  classNames,
  details,
}: {
  family: string;
  tagline: string;
  sample: string;
  classNames: string;
  details: string[];
}) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">
          {family}
        </p>
        <p className="text-[12px] text-muted-foreground">{tagline}</p>
      </div>
      <p className={classNames}>{sample}</p>
      <ul className="mt-3 text-[12px] text-muted-foreground space-y-0.5">
        {details.map((d) => (
          <li key={d}>· {d}</li>
        ))}
      </ul>
    </div>
  );
}

function ScaleSample({ row }: { row: ScaleRow }) {
  const fontClass = row.family === "display" ? "font-display" : "";
  // The 11px tier is always a tracked-uppercase label (eyebrows, button labels,
  // badges) — show it that way rather than in sentence case.
  if (row.px === 11) {
    return (
      <span className={`${row.size} ${fontClass} tracking-[0.2em] uppercase`}>
        The quiet
      </span>
    );
  }
  return (
    <span className={`${row.size} ${fontClass} tracking-tight`}>
      The quiet
    </span>
  );
}
