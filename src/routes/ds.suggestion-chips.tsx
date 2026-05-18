import { createFileRoute } from "@tanstack/react-router";
import { SuggestionChip } from "@/components/SuggestionChip";
import { DSPage, Section, SurfacePair, PropsBlock } from "@/components/ds-surface";

export const Route = createFileRoute("/ds/suggestion-chips")({
  head: () => ({
    meta: [
      { title: "Design System — Prompt Suggestions" },
      { name: "description", content: "Conversation starter prompts — single chips and chip rails." },
    ],
  }),
  component: DSPromptSuggestions,
});

function DSPromptSuggestions() {
  return (
    <DSPage
      title="Prompt suggestions"
      intro={
        <>
          <strong>SuggestionChip</strong> is a full-width starter card with a
          circular action affordance — used on the home screen to surface
          canned conversation openers.
        </>
      }
    >
      {/* ─── SuggestionChip — filled (sm / md / lg) ─────────────────────── */}
      <Section
        title="Filled"
        subtitle="Default. Frosted body — translucent off-white on the dark photo, translucent white on the light photo. Text matches the surface tone; the affordance circle inverts to stay readable."
      >
        <SurfacePair
          align="start"
          renderRow={(surface) => (
            <div className="flex flex-col gap-2">
              <SuggestionChip size="sm" surface={surface} onClick={() => undefined}>
                Small (sm)
              </SuggestionChip>
              <SuggestionChip size="md" surface={surface} onClick={() => undefined}>
                Default (md)
              </SuggestionChip>
              <SuggestionChip size="lg" surface={surface} onClick={() => undefined}>
                Large (lg)
              </SuggestionChip>
            </div>
          )}
        />
      </Section>

      {/* ─── Primary ────────────────────────────────────────────────────── */}
      <Section
        title="Primary"
        subtitle="Solid fill for the lead opener. White-on-dark, ink-on-light."
      >
        <SurfacePair
          align="start"
          renderRow={(surface) => (
            <SuggestionChip variant="primary" surface={surface} onClick={() => undefined}>
              Start the first conversation
            </SuggestionChip>
          )}
        />
      </Section>

      <Section title="SuggestionChip — Props">
        <PropsBlock>{`<SuggestionChip
  children:    ReactNode
  onClick:     () => void
  variant?:    "filled" | "primary"      // default: "filled"
  size?:       "sm" | "md" | "lg"        // default: "md"
  surface?:    "dark" | "light"          // default: useAppMode()
  fullWidth?:  boolean                   // default: true
  disabled?:   boolean
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
