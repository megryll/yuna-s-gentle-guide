type Props = { size?: number; className?: string; variant: AvatarVariant };

export type AvatarVariant = "arc" | "leaf" | "bloom" | "tide" | "ember" | "stone";

export const AVATAR_VARIANTS: AvatarVariant[] = [
  "arc",
  "leaf",
  "bloom",
  "tide",
  "ember",
  "stone",
];

export const AVATAR_LABELS: Record<AvatarVariant, string> = {
  arc: "Arc",
  leaf: "Leaf",
  bloom: "Bloom",
  tide: "Tide",
  ember: "Ember",
  stone: "Stone",
};

/**
 * Wireframe avatar marks for Yuna. Pure SVG, currentColor-aware.
 */
export function YunaAvatar({ size = 32, className, variant }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": true,
  };

  switch (variant) {
    case "arc":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <circle cx="16" cy="16" r="2.2" fill="currentColor" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <path d="M6 22 C 12 8, 20 8, 26 22" stroke="currentColor" strokeWidth="1" />
          <path d="M6 22 C 12 18, 20 18, 26 22" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
      );
    case "bloom":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <ellipse
              key={d}
              cx="16"
              cy="10"
              rx="3"
              ry="6"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.6"
              transform={`rotate(${d} 16 16)`}
            />
          ))}
          <circle cx="16" cy="16" r="1.6" fill="currentColor" />
        </svg>
      );
    case "tide":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <path d="M4 14 Q 10 10, 16 14 T 28 14" stroke="currentColor" strokeWidth="1" />
          <path d="M4 18 Q 10 14, 16 18 T 28 18" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <path d="M4 22 Q 10 18, 16 22 T 28 22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        </svg>
      );
    case "ember":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <path d="M16 6 C 22 12, 22 20, 16 26 C 10 20, 10 12, 16 6 Z" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <circle cx="16" cy="18" r="2.4" fill="currentColor" />
        </svg>
      );
    case "stone":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <polygon points="16,7 25,15 21,25 11,25 7,15" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <circle cx="16" cy="17" r="1.8" fill="currentColor" />
        </svg>
      );
  }
}