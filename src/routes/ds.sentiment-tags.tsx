import { createFileRoute } from "@tanstack/react-router";
import { SentimentTag } from "@/components/SentimentTag";
import { DSPage, Section, SurfacePair, PropsBlock } from "@/components/ds-surface";

export const Route = createFileRoute("/ds/sentiment-tags")({
  head: () => ({
    meta: [
      { title: "Design System — Sentiment Tags" },
      { name: "description", content: "Frosted pill with a small colored dot." },
    ],
  }),
  component: DSSentimentTags,
});

// ─── Secondary palette ──────────────────────────────────────────────────────
// Dot colors map to emotion families across the app. Positive + negative
// tones come from useSentimentToneColor; the rest are fixed hues.

const PALETTE = [
  { name: "Relief", dotColor: "#9EFF94", tone: "positive" },
  { name: "Resolve", dotColor: "#FFCB87", tone: "negative" },
  { name: "Hopefulness", dotColor: "#A7C7E7", tone: undefined },
  { name: "Overwhelm", dotColor: "#F7A7A7", tone: undefined },
  { name: "Self-compassion", dotColor: "#C5B6E0", tone: undefined },
  { name: "Tenderness", dotColor: "#F2B4D3", tone: undefined },
  { name: "Curiosity", dotColor: "#B5DEDB", tone: undefined },
  { name: "Clarity", dotColor: "#A7C7E7", tone: undefined },
] as const;

function DSSentimentTags() {
  return (
    <DSPage title="Sentiment tags">
      {/* ─── Display — examples on both surfaces ─────────────────────────── */}
      <Section title="Display">
        <SurfacePair
          align="start"
          renderRow={(surface) => (
            <div className="flex flex-wrap gap-1.5">
              <SentimentTag label="Relief" dotColor="#9EFF94" surface={surface} />
              <SentimentTag label="Resolve" dotColor="#FFCB87" surface={surface} />
              <SentimentTag label="Hopefulness" dotColor="#A7C7E7" surface={surface} />
            </div>
          )}
        />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<SentimentTag
  label:     string
  tone?:     "positive" | "negative"   // sets dot from tone palette
  dotColor?: string                    // explicit hex; overrides tone
  surface?:  "dark" | "light"          // default: useAppMode()
/>

// Helper hook for matching-tone color reads:
useSentimentToneColor(): (tone: SentimentTone) => string`}</PropsBlock>
      </Section>

      {/* ─── Palette catalogue ──────────────────────────────────────────── */}
      <Section title="Dot palette">
        <div className="grid grid-cols-2 gap-2">
          {PALETTE.map((p) => (
            <div
              key={p.name}
              className="rounded-xl border border-border p-3 flex items-center gap-3"
            >
              <span
                aria-hidden
                className="h-5 w-5 rounded-full border border-border shrink-0"
                style={{ background: p.dotColor }}
              />
              <div className="flex flex-col">
                <span className="text-[13px]">{p.name}</span>
                <code className="text-[11px] text-muted-foreground">
                  {p.dotColor}
                  {p.tone ? ` · tone="${p.tone}"` : ""}
                </code>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </DSPage>
  );
}
