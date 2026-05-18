import { createFileRoute } from "@tanstack/react-router";
import { DSPage, Section, SurfacePair } from "@/components/ds-surface";

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
// Real sizes in use across src/routes/ — top by frequency. Bound to a
// semantic role so call sites can pick by intent rather than pixel guess.

type ScaleRow = {
  size: string;
  px: number;
  family: "display" | "body";
  role: string;
};

const SCALE: ScaleRow[] = [
  { size: "text-3xl", px: 30, family: "display", role: "Page hero — auth, intro, employer access" },
  { size: "text-2xl", px: 24, family: "display", role: "Section hero — drawer titles, you page" },
  { size: "text-xl", px: 20, family: "display", role: "Large heading inside cards" },
  { size: "text-[18px]", px: 18, family: "body", role: "Body emphasis, drawer body copy" },
  { size: "text-[17px]", px: 17, family: "body", role: "Join drawer option labels" },
  { size: "text-[15px]", px: 15, family: "body", role: "Body — chat messages, list items" },
  { size: "text-sm", px: 14, family: "body", role: "Default secondary body" },
  { size: "text-[13px]", px: 13, family: "body", role: "Inline body, sentiment tag md" },
  { size: "text-xs", px: 12, family: "body", role: "Meta text, captions" },
  { size: "text-[12px]", px: 12, family: "body", role: "Suggestion chip label" },
  { size: "text-[11px]", px: 11, family: "body", role: "Button labels, tracked uppercase" },
  { size: "text-[10px]", px: 10, family: "body", role: "Eyebrow — section labels" },
];

function DSTypography() {
  return (
    <DSPage
      title="Typography"
      intro={
        <>
          Two font families. Headings use <strong>Fraunces</strong> (variable
          serif). Body copy and button labels use <strong>Stara</strong>{" "}
          (warm serif, set on <code>body</code> so it inherits everywhere).
          Don't add a third.
        </>
      }
    >
      {/* ─── Families ───────────────────────────────────────────────────── */}
      <Section
        title="Families"
        subtitle="The two families and where each is allowed."
      >
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
            classNames="text-[18px] leading-snug"
            details={[
              "Weights: 500, 600, 700 (+ italics)",
              "Source: /fonts/Stara-Medium.otf, Stara-SemiBold.otf, Stara-Bold.otf",
            ]}
          />
        </div>
      </Section>

      {/* ─── Scale ──────────────────────────────────────────────────────── */}
      <Section
        title="Scale"
        subtitle="Sizes actually in use across the app. Arbitrary `text-[Npx]` sizes are intentional — the rounded Tailwind scale doesn't hit the integer pixel sizes the design needs at this density."
      >
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

      {/* ─── On photo bgs ────────────────────────────────────────────────── */}
      <Section
        title="On photo backgrounds"
        subtitle="The cluster the user reads against. Body copy + meta labels must clear the alpha contrast floors enforced by the shim blocks in src/styles.css."
      >
        <SurfacePair
          align="start"
          innerLabel="Display — Fraunces"
          renderRow={() => (
            <div className="flex flex-col gap-2">
              <p className="font-display text-3xl tracking-tight text-white">
                Quiet space
              </p>
              <p className="font-display text-2xl tracking-tight text-white">
                Section heading
              </p>
              <p className="font-display text-xl tracking-tight text-white">
                Card heading
              </p>
            </div>
          )}
        />
        <div className="h-4" />
        <SurfacePair
          align="start"
          innerLabel="Body — Stara"
          renderRow={() => (
            <div className="flex flex-col gap-2">
              <p className="text-[18px] leading-snug text-white">
                Here to listen, reflect, and grow with you.
              </p>
              <p className="text-[15px] leading-snug text-white/85">
                Body / secondary at 85% (floor).
              </p>
              <p className="text-[13px] leading-snug text-white/75">
                Meta / value at 75% (floor on dark, 70% on light).
              </p>
              <p className="text-[13px] leading-snug text-white/55">
                Disabled / hint at 55% (floor).
              </p>
            </div>
          )}
        />
        <div className="h-4" />
        <SurfacePair
          align="start"
          innerLabel="Tracked uppercase — Stara"
          renderRow={() => (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/65">
                Eyebrow label
              </p>
              <p className="text-[11px] tracking-[0.16em] uppercase text-white">
                Toggle label
              </p>
            </div>
          )}
        />
      </Section>

      {/* ─── Weights ────────────────────────────────────────────────────── */}
      <Section
        title="Weights"
        subtitle="Available Stara + Fraunces weights. Don't reach for weights not listed — they won't ship."
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border p-5">
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
              Stara
            </p>
            <div className="flex flex-col gap-1.5 text-[16px]">
              <p style={{ fontWeight: 500 }}>500 — Medium · Lorem ipsum</p>
              <p style={{ fontWeight: 600 }}>600 — Semibold · Lorem ipsum</p>
              <p style={{ fontWeight: 700 }}>700 — Bold · Lorem ipsum</p>
              <p style={{ fontWeight: 500, fontStyle: "italic" }}>500 italic · Lorem ipsum</p>
              <p style={{ fontWeight: 600, fontStyle: "italic" }}>600 italic · Lorem ipsum</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border p-5">
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
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
  return (
    <span className={`${row.size} ${fontClass} tracking-tight`}>
      The quiet
    </span>
  );
}
