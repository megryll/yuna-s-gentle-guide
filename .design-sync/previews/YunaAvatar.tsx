import { YunaAvatar } from "yuna-design-system";
import { Image as ImageIcon } from "lucide-react";

// The avatar photos live in the app's public/ dir and are NOT shipped to the
// design bundle, so the real <img> would render as a broken box. We hide it
// (the `.ya-stand img` rule below — a raw <style>, not Tailwind, so it always
// resolves) and lay a brand-green gradient + image glyph behind it as a
// faithful stand-in, keeping the component's true shape, sizing, and the
// pure-CSS glow aura. Production needs the real assets shipped.
function Stand({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <div className="relative shrink-0 ya-stand" style={{ width: size, height: size }}>
      <style>{`.ya-stand img{opacity:0}`}</style>
      <div
        className="absolute inset-0 rounded-full grid place-items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #9bc4a6 0%, #4a7a5c 100%)" }}
      >
        <ImageIcon size={Math.round(size * 0.38)} className="text-white/70" strokeWidth={1.75} />
      </div>
      {children}
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex items-end gap-4 p-4">
      <Stand size={32}>
        <YunaAvatar variant="maya" size={32} />
      </Stand>
      <Stand size={44}>
        <YunaAvatar variant="kai" size={44} />
      </Stand>
      <Stand size={56}>
        <YunaAvatar variant="arun" size={56} />
      </Stand>
    </div>
  );
}

export function Glow() {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-10 grid place-items-center"
    >
      <Stand size={64}>
        <YunaAvatar variant="vivian" size={64} glow />
      </Stand>
    </div>
  );
}

export function BrandMark() {
  return (
    <div className="p-4 grid place-items-center">
      <Stand size={48}>
        <YunaAvatar size={48} />
      </Stand>
    </div>
  );
}
