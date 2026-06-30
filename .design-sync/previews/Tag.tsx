import { Tag } from "yuna-design-system";
import { Sun, Music, Plus } from "lucide-react";

// Tappable + informational tags are authored in white-on-dark vocabulary on the
// dark cluster, so dark-surface cells sit on a brand-green panel. The light
// surface uses ink tokens and needs no wrapper.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6 flex flex-wrap items-center gap-2"
    >
      {children}
    </div>
  );
}

export function Tappable() {
  return (
    <Dark>
      <Tag surface="dark" onClick={() => {}}>
        Sunshine
      </Tag>
      <Tag surface="dark" selected onClick={() => {}}>
        Music
      </Tag>
      <Tag surface="dark" icon={<Sun />} onClick={() => {}}>
        Morning light
      </Tag>
      <Tag surface="dark" aria-label="Add" onClick={() => {}}>
        <Plus />
      </Tag>
    </Dark>
  );
}

export function Informational() {
  return (
    <Dark>
      <Tag surface="dark" variant="informational">
        Anxiety
      </Tag>
      <Tag surface="dark" variant="informational">
        CBT
      </Tag>
      <Tag surface="dark" variant="informational" icon={<Music />}>
        Sound therapy
      </Tag>
      <Tag surface="dark" variant="informational">
        Trauma-informed
      </Tag>
    </Dark>
  );
}

export function OnLight() {
  return (
    <div className="flex flex-wrap items-center gap-2 p-4">
      <Tag surface="light" onClick={() => {}}>
        Sunshine
      </Tag>
      <Tag surface="light" selected onClick={() => {}}>
        Music
      </Tag>
      <Tag surface="light" variant="informational">
        Trauma-informed
      </Tag>
      <Tag surface="light" disabled onClick={() => {}}>
        Resting
      </Tag>
    </div>
  );
}
