import type { ReactNode } from "react";

/**
 * Shared layout primitives for DS pages.
 *
 * Every component is documented on both photo backgrounds the app actually
 * sits on (/background.png and /light-blur-bg.png) so we can eyeball
 * contrast in the same context the user sees.
 */

export function DSPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="ml-44 min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-10 py-12">
        <header className="mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Design System
          </p>
          <h1 className="text-3xl tracking-tight">{title}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
            {intro}
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="text-lg tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

export function SurfacePair({
  renderRow,
  innerLabel,
  align = "center",
}: {
  renderRow: (surface: "dark" | "light") => ReactNode;
  innerLabel?: string;
  align?: "center" | "start";
}) {
  return (
    <div>
      {innerLabel && (
        <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
          {innerLabel}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <SurfacePanel tone="dark" align={align}>{renderRow("dark")}</SurfacePanel>
        <SurfacePanel tone="light" align={align}>{renderRow("light")}</SurfacePanel>
      </div>
    </div>
  );
}

export function SurfacePanel({
  tone,
  children,
  align = "center",
}: {
  tone: "dark" | "light";
  children: ReactNode;
  align?: "center" | "start";
}) {
  const bg = tone === "dark" ? "/background.png" : "/light-blur-bg.png";
  const itemsClass = align === "start" ? "items-start" : "items-center";
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className={`relative px-6 py-7 min-h-[96px] flex ${itemsClass}`}>
        <div className="w-full">
          <p
            className={
              "text-[10px] tracking-[0.25em] uppercase mb-3 " +
              (tone === "dark" ? "text-white/65" : "text-foreground/65")
            }
          >
            {tone === "dark" ? "Dark surface" : "Light surface"}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Row({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex items-center flex-wrap gap-3 ${className}`}>{children}</div>;
}

export function PropsBlock({ children }: { children: string }) {
  return (
    <pre className="text-[12px] leading-relaxed bg-muted/40 border border-border rounded-2xl p-5 overflow-x-auto">
      {children}
    </pre>
  );
}
