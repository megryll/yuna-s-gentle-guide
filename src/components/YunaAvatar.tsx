type Props = {
  size?: number;
  className?: string;
  /** One of the 4 photo avatars. Omit to render the Yuna brand mark
   *  (`/avatar.png`) — used by Welcome and the intro flow. */
  variant?: AvatarVariant;
  /** Wrap the avatar in the animated aura (breathing halo + drifting glow +
   *  spinning ring). The Yuna-presence treatment on hero screens. */
  glow?: boolean;
};

export type AvatarVariant = "maya" | "kai" | "arun" | "vivian";

export const AVATAR_VARIANTS: AvatarVariant[] = ["maya", "kai", "arun", "vivian"];

const AVATAR_SRC: Record<AvatarVariant, string> = {
  maya: "/avatars/avatar-2.png",
  kai: "/avatars/avatar-3.png",
  arun: "/avatars/avatar-4.png",
  vivian: "/avatars/avatar-13.png",
};

// Full-body portraits (proper 3:4 aspect) for the voice picker card. The
// `AVATAR_SRC` files above are square face crops of these same shots, framed
// tight for the circular avatar.
const VOICE_PHOTO_SRC: Record<AvatarVariant, string> = {
  maya: "/avatars/voice-maya.jpg",
  kai: "/avatars/voice-kai.jpg",
  arun: "/avatars/voice-arun.jpg",
  vivian: "/avatars/voice-vivian.jpg",
};

export function avatarSrc(variant: AvatarVariant): string {
  return AVATAR_SRC[variant];
}

export function voicePhotoSrc(variant: AvatarVariant): string {
  return VOICE_PHOTO_SRC[variant];
}

/**
 * Yuna avatar. With `variant`, renders one of the 4 photo avatars inside a
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
