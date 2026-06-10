import { cn } from "@/lib/utils";
import { Leaf, LEAF_RATIO } from "@/components/Leaf";

/**
 * Yuna loading spinner: three leaves orbiting a shared center on a
 * fast→slow→fast loop (1080° over 2.4s). The brand's "we're working on it"
 * moment — used on Creating Your Space and other full-screen waits.
 *
 * size:    diameter of the orbit container in px. The leaf scales with it.
 * surface: which photo cluster it sits on. `dark` → white leaves (the default,
 *          since loads happen on the dark photo); `light` → deep forest green.
 */
export function LeafSpinner({
  size = 56,
  surface = "dark",
  className,
}: {
  size?: number;
  surface?: "dark" | "light";
  className?: string;
}) {
  const leafW = Math.round(size * 0.26);
  const leafH = Math.round(leafW * LEAF_RATIO);
  const radius = size * 0.33;
  const center = size / 2;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "relative",
        surface === "dark" ? "text-white" : "text-primary-green",
        className,
      )}
      style={{
        width: size,
        height: size,
        animation: "yuna-orbit-spin 2.4s linear infinite",
        willChange: "transform",
      }}
    >
      {[0, 120, 240].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        return (
          <div
            key={deg}
            className="absolute"
            style={{
              left: center + radius * Math.cos(rad) - leafW / 2,
              top: center + radius * Math.sin(rad) - leafH / 2,
              transform: `rotate(${deg + 90}deg)`,
            }}
          >
            <Leaf size={leafW} />
          </div>
        );
      })}
    </div>
  );
}
