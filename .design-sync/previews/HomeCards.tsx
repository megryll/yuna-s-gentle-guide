import { HomeCards } from "yuna-design-system";
import type { ComponentProps } from "react";

// HomeCards (the HomeCardRow primitive) maps a feed item onto the content
// card's list-row layout. Photo rows reference public/ images that don't ship,
// so they fall back to their black wash (still white-on-dark, legible); the
// self-discovery row paints a watermark <img> (/yuna-mark.svg) that also
// doesn't ship, so we hide any broken row watermark with a raw <style> rule.
// Solid-fill rows render exactly as in the app.

type Card = ComponentProps<typeof HomeCards>["card"];

const MEDITATION: Card = {
  type: "meditation",
  id: "midday-reset",
  title: "A Five-Minute Midday Reset",
  cadence: "Daily",
  naturePath: "/nature/Background-13.png",
  isNew: true,
};

const GRATITUDE: Card = {
  type: "gratitude",
  id: "gratitude-today",
  prompt: "Three small things today that didn't have to go right, but did.",
  cadence: "Daily",
};

const QUESTIONNAIRE: Card = {
  type: "self-discovery",
  id: "feeling-check",
  title: "How have you been feeling lately?",
  description: "A short check-in.",
  duration: "5 min",
};

function noop() {}

export function Rows() {
  return (
    <div className="p-4">
      <style>{`.hc-rows img{opacity:0}`}</style>
      <div className="hc-rows max-w-[360px] flex flex-col gap-3">
        <HomeCards card={MEDITATION} onClick={noop} interactive={false} />
        <HomeCards card={GRATITUDE} onClick={noop} interactive={false} />
        <HomeCards card={QUESTIONNAIRE} onClick={noop} interactive={false} />
      </div>
    </div>
  );
}

export function WithMenu() {
  return (
    <div className="p-4">
      <style>{`.hc-menu img{opacity:0}`}</style>
      <div className="hc-menu max-w-[360px]">
        <HomeCards card={MEDITATION} onClick={noop} onMenu={noop} interactive={false} />
      </div>
    </div>
  );
}

export function Completed() {
  return (
    <div className="p-4 pt-6">
      <style>{`.hc-done img{opacity:0}`}</style>
      <div className="hc-done max-w-[360px]">
        <HomeCards card={MEDITATION} completed onClick={noop} onMenu={noop} interactive={false} />
      </div>
    </div>
  );
}
