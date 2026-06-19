type Props = {
  size?: number;
  className?: string;
  /** One of the 13 photo avatars. Omit to render the Yuna brand mark
   *  (`/avatar.png`) — used by Welcome and the intro flow. */
  variant?: AvatarVariant;
  /** Wrap the avatar in the animated aura (breathing halo + drifting glow +
   *  spinning ring). The Yuna-presence treatment on hero screens. */
  glow?: boolean;
};

export type AvatarVariant =
  | "iris"
  | "marcus"
  | "mei"
  | "arun"
  | "vivian"
  | "rosa"
  | "theo"
  | "sage"
  | "felix"
  | "aura"
  | "ember"
  | "tide"
  | "cloud";

export const AVATAR_VARIANTS: AvatarVariant[] = [
  "iris",
  "marcus",
  "mei",
  "arun",
  "vivian",
  "rosa",
  "theo",
  "sage",
  "felix",
  "aura",
  "ember",
  "tide",
  "cloud",
];

const AVATAR_SRC: Record<AvatarVariant, string> = {
  iris: "/avatars/avatar-1.png",
  marcus: "/avatars/avatar-2.png",
  mei: "/avatars/avatar-3.png",
  arun: "/avatars/avatar-4.png",
  vivian: "/avatars/avatar-13.png",
  rosa: "/avatars/avatar-5.png",
  theo: "/avatars/avatar-6.png",
  sage: "/avatars/avatar-7.png",
  felix: "/avatars/avatar-8.png",
  aura: "/avatars/avatar-9.png",
  ember: "/avatars/avatar-10.png",
  tide: "/avatars/avatar-11.png",
  cloud: "/avatars/avatar-12.png",
};

export function avatarSrc(variant: AvatarVariant): string {
  return AVATAR_SRC[variant];
}

/**
 * Yuna avatar. With `variant`, renders one of the 13 photo avatars inside a
 * circular crop; without it, the Yuna brand mark. Width and height match
 * `size` so the image stays square at the requested px. Pass `glow` for the
 * animated-aura presence treatment on hero screens.
 */
export function YunaAvatar({ size = 32, className, variant, glow = false }: Props) {
  const isPhoto = !!variant;
  const src = variant ? AVATAR_SRC[variant] : "/avatar.png";

  const img = (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        transition: "width 300ms ease-out, height 300ms ease-out",
      }}
      className={
        (glow ? "relative " : "") +
        (isPhoto ? "rounded-full object-cover " : "") +
        (glow ? "" : className ?? "")
      }
      draggable={false}
    />
  );

  if (!glow) return img;

  return (
    <div
      className={"relative shrink-0 " + (className ?? "")}
      style={{ width: size, height: size }}
    >
      <AvatarGlow size={size} />
      {img}
    </div>
  );
}

// Three stacked, independently-animated layers behind the avatar. Sizes scale
// off `size` so the aura tracks any avatar dimension (tuned at size=56). All
// glow values are white so the treatment reads on both photo backgrounds.
function AvatarGlow({ size }: { size: number }) {
  const center = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  } as const;
  return (
    <>
      <span
        aria-hidden
        className="rounded-full"
        style={{
          ...center,
          width: size * 3.9,
          height: size * 3.9,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.14) 28%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 70%)",
          animation: "glow-breathe 7.5s ease-in-out infinite",
          filter: "blur(2px)",
          willChange: "transform, opacity",
        }}
      />
      <span
        aria-hidden
        className="rounded-full"
        style={{
          ...center,
          width: size * 2.85,
          height: size * 2.85,
          background:
            "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.28), rgba(255,255,255,0) 65%)",
          animation: "glow-drift 11s ease-in-out infinite",
          mixBlendMode: "screen",
          filter: "blur(6px)",
          willChange: "transform",
        }}
      />
      <span
        aria-hidden
        className="rounded-full"
        style={{
          ...center,
          width: size * 1.14,
          height: size * 1.14,
          background:
            "conic-gradient(from 0deg, rgba(255,255,255,0.95), rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.95))",
          WebkitMask:
            "radial-gradient(circle, transparent 58%, #000 62%, #000 96%, transparent 100%)",
          mask: "radial-gradient(circle, transparent 58%, #000 62%, #000 96%, transparent 100%)",
          animation: "glow-spin 9s linear infinite",
          filter: "blur(1.5px)",
          willChange: "transform",
        }}
      />
    </>
  );
}
