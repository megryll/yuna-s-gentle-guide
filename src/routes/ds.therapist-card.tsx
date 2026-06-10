import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TherapistCard } from "@/components/TherapistCard";
import { DSPage, Section, SurfacePair, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/therapist-card")({
  head: () => ({
    meta: [
      { title: "Design System — Therapist Card" },
      { name: "description", content: "A frosted card for a recommended therapist — a tall deck form and a compact list row." },
    ],
  }),
  component: DSTherapistCard,
});

const SAMPLE = {
  name: "Mira Sokolova",
  credentials: "Licensed Clinical Psychologist, PhD",
  location: "San Francisco, CA",
  photo: "/therapists/mira.jpg",
  tags: ["Anxiety", "Mindfulness", "ACT", "Perfectionism"],
  matchNote: "Mira could be a great fit because she works with anxiety and perfectionism using ACT and mindfulness.",
};

function DeckDemo({ surface }: { surface: "dark" | "light" }) {
  const [saved, setSaved] = useState(false);
  return (
    <TherapistCard
      surface={surface}
      {...SAMPLE}
      saved={saved}
      onToggleSave={() => setSaved((v) => !v)}
      onView={() => {}}
      onDismiss={() => {}}
    />
  );
}

function ListDemo({ surface }: { surface: "dark" | "light" }) {
  const [saved, setSaved] = useState(true);
  return (
    <TherapistCard
      surface={surface}
      variant="list"
      {...SAMPLE}
      saved={saved}
      onToggleSave={() => setSaved((v) => !v)}
      onView={() => {}}
    />
  );
}

function DSTherapistCard() {
  return (
    <DSPage title="Therapist Card">
      <Section title="Variants">
        <div className="flex flex-col gap-10">
          <SurfacePair align="start" innerLabel="Deck" renderRow={(s) => <DeckDemo surface={s} />} />
          <SurfacePair align="start" innerLabel="List" renderRow={(s) => <ListDemo surface={s} />} />
        </div>
      </Section>

      <Section title="Props">
        <PropsBlock>{`<TherapistCard
  variant?:      "deck" | "list"    // default "deck"
  name:          string
  credentials:   string
  location?:     string
  photo:         string             // headshot image URL (/therapists/<id>.jpg)
  tags?:         string[]           // shown as informational Tags (deck, max 4)
  matchNote?:    string             // Yuna's match reason (deck only)
  saved?:        boolean
  onToggleSave?: () => void
  onView?:       () => void         // deck: View profile button; list: whole row
  onDismiss?:    () => void         // deck only — "Not interested" action
  surface?:      "dark" | "light"   // default "dark"
  className?:    string
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}
