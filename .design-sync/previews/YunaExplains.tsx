import { YunaExplains } from "yuna-design-system";
import { Image as ImageIcon } from "lucide-react";

// YunaExplains defaults to surface="dark" (frosted white-on-dark row), so
// previews sit on a dark brand-green panel.
//
// The component renders a YunaAvatar internally, whose photo lives in the app's
// public/ dir and is NOT shipped to the design bundle — the real <img> would
// render as a broken box. We hide it (the `.ye-stand img` rule below, a raw
// <style> so it always resolves) and overlay a brand-green gradient + image
// glyph as a faithful stand-in, positioned where the avatar sits (the row's
// p-4 = 16px inset, size 32). Production needs the real assets shipped.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6 flex flex-col gap-3 ye-stand relative"
    >
      <style>{`.ye-stand img{opacity:0}`}</style>
      {children}
    </div>
  );
}

// A 32px circle stand-in, placed over the avatar's resting position inside the
// frosted row (panel p-6 = 24px + row p-4 = 16px → 40px from the panel edge).
function AvatarStand({ top }: { top: number }) {
  return (
    <div
      aria-hidden
      className="absolute rounded-full grid place-items-center pointer-events-none"
      style={{
        left: 40,
        top,
        width: 32,
        height: 32,
        background: "linear-gradient(135deg, #9bc4a6 0%, #4a7a5c 100%)",
      }}
    >
      <ImageIcon size={13} className="text-white/70" strokeWidth={1.75} />
    </div>
  );
}

export function MatchReason() {
  return (
    <Dark>
      <YunaExplains avatar="maya">
        I matched you with Dr. Okafor because you mentioned wanting someone warm
        who works with anxiety. She has a gentle, steady style.
      </YunaExplains>
      <AvatarStand top={40} />
    </Dark>
  );
}

export function ProfileInsight() {
  return (
    <Dark>
      <YunaExplains avatar="kai">
        You named rest as something you keep putting last. Let's hold that gently
        this week and see what a little more of it feels like.
      </YunaExplains>
      <AvatarStand top={40} />
    </Dark>
  );
}

export function OnLight() {
  return (
    <div className="rounded-2xl p-6 bg-white ye-stand relative">
      <style>{`.ye-stand img{opacity:0}`}</style>
      <YunaExplains surface="light" avatar="arun">
        Here's what stood out from our last conversation. No pressure to do
        anything with it, just something to sit with.
      </YunaExplains>
      <AvatarStand top={40} />
    </div>
  );
}
