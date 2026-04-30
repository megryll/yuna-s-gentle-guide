type Props = { size?: number; className?: string };

/**
 * Minimalist wireframe mark for Yuna — concentric arcs + dot.
 * Pure SVG, theme-aware via currentColor.
 */
export function YunaMark({ size = 28, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function YunaWordmark({ className }: { className?: string }) {
  return (
    <div className={"flex items-center gap-2 " + (className ?? "")}>
      <YunaMark size={20} />
      <span className="font-sans-ui text-sm tracking-[0.2em] uppercase">Yuna</span>
    </div>
  );
}