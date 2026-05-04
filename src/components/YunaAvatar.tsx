type Props = { size?: number; className?: string; variant: AvatarVariant };

export type AvatarVariant =
  | "iris"
  | "marcus"
  | "mei"
  | "arun"
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
 * Photo-based avatar. Renders the chosen image inside a circular crop.
 * Width and height match `size` so the image stays square at the requested px.
 */
export function YunaAvatar({ size = 32, className, variant }: Props) {
  return (
    <img
      src={AVATAR_SRC[variant]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={"rounded-full object-cover " + (className ?? "")}
      draggable={false}
    />
  );
}
