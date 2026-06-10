import { cn } from "@/lib/utils";

// The single Yuna leaf, drawn from the brand mark. Used as the repeating unit
// in LeafSpinner (3-leaf orbit) and YunaStatus (flipping status indicator).
// Fill is `currentColor` so callers set the tone with a text-* token — keep it
// to DS colors (text-white on the dark photo, text-primary-green on light).
const LEAF_PATH =
  "M52.1069 75.2084C51.5053 75.2075 50.9641 75.3871 50.5437 75.8076L50.4232 75.6871" +
  "C50.1228 75.9874 50.003 76.3482 49.8833 76.709C38.3058 117.99 40.358 144.135 " +
  "50.6434 167.835C51.9695 170.89 48.4144 173.356 45.862 172.616C-19.8797 153.547 " +
  "1.72761 81.33 10.5634 63.1303C20.7584 42.0906 36.3187 17.4936 53.8618 2.3604" +
  "C59.1645 -2.21385 67.0766 0.177371 69.4149 6.80616C76.0714 25.6766 86.3464 " +
  "40.6833 95.726 54.3822C102.257 63.9204 108.354 72.825 112.493 81.9582C114.374 " +
  "86.1096 115.851 90.3085 116.78 94.6356C120.295 111.001 114.926 130.328 97.9166 " +
  "151.66C94.2536 156.253 90.0509 160.94 85.2807 165.71C74.9332 176.058 65.4662 " +
  "164.566 60.7043 147.927C53.0359 121.132 53.7345 78.8805 53.8544 77.1962" +
  "C53.7924 75.9328 52.9492 75.3299 52.1069 75.2084Z";

// Native leaf aspect ratio (height / width) from the source artwork's viewBox.
export const LEAF_RATIO = 173 / 118;

export function Leaf({
  size = 24,
  className,
}: {
  /** Leaf width in px; height derives from LEAF_RATIO. */
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * LEAF_RATIO)}
      viewBox="0 0 118 173"
      fill="none"
      aria-hidden="true"
      className={cn(className)}
    >
      <path d={LEAF_PATH} fill="currentColor" />
    </svg>
  );
}
