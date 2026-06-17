import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { CardSuggestion } from "@/components/CardSuggestion";
import { modeImage } from "@/lib/theme-prefs";
import { DSPage, Section, SurfacePair, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/card-suggestion")({
  head: () => ({
    meta: [
      { title: "Design System — Card Suggestion" },
      {
        name: "description",
        content: "Yuna's in-session card recommendation + support escalation.",
      },
    ],
  }),
  component: DSCardSuggestion,
});

// CardSuggestion is authored white-on-dark and inverts via `.theme-light`, so
// the light-surface preview is wrapped to invert the way it does in PhoneFrame.
function themed(surface: "dark" | "light", node: ReactNode) {
  return surface === "light" ? <div className="theme-light">{node}</div> : node;
}

function DSCardSuggestion() {
  return (
    <DSPage title="Card Suggestion">
      <Section
        title="Variants"
        subtitle="Two forms — a left-aligned text bubble and a centered voice sheet. The reco and escalation variants swap the body but share this shell, so each is shown once: reco in text, escalation in voice."
      >
        <div className="flex flex-col gap-8">
          <SurfacePair
            innerLabel="Text — left-aligned chat bubble (reco)"
            align="start"
            renderRow={(s) =>
              themed(
                s,
                <div className="flex justify-start">
                  <CardSuggestion
                    mode="text"
                    kind="self-discovery"
                    title="How Have You Been Feeling Lately?"
                    description="A simple check-in to start noticing your emotional patterns."
                    duration="5 min"
                    surface={s}
                    frostedImage={modeImage(s)}
                  />
                </div>,
              )
            }
          />
          <SurfacePair
            innerLabel="Voice — centered slide-up sheet (escalation)"
            renderRow={(s) =>
              themed(
                s,
                <CardSuggestion
                  mode="voice"
                  variant="escalation"
                  tier="self-harm"
                  surface={s}
                  frostedImage={modeImage(s)}
                />,
              )
            }
          />
        </div>
      </Section>

      <Section title="Props">
        <PropsBlock>{`<CardSuggestion
  // shared
  mode?:         "text" | "voice"   // default: "text"
  surface?:      "dark" | "light"   // threads to the action buttons, default: "dark"
  frostedImage?: string             // blurred backdrop photo; opaque base for the voice sheet (all platforms)
  className?:    string
  style?:        CSSProperties

  // variant="reco" (default) — recommend a card
  kind:          CardKind           // drives the eyebrow label + tile background
                                    //   (solid kinds: fixed fill + watermark)
  title:         string             // recommended card's title (white Fraunces)
  description?:  string             // teaser line under the title, inside the tile
  duration?:     string             // length estimate — "• 5 min" after the eyebrow
  naturePath?:   string             // tile photo (photo kinds only), default:
                                    //   KIND_META[kind].naturePath
  startLabel?:   string             // primary action label, default: "Start"
  onStart?:      () => void
  onDismiss?:    () => void

  // variant="escalation" — hand over a support resource
  tier:            "self-harm" | "crisis" | "non-crisis"
  onFindTherapist?: () => void      // shown for crisis + non-crisis tiers
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
