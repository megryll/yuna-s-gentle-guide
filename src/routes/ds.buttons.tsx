import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Mic, PhoneOff, Volume2 } from "lucide-react";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/ds/buttons")({
  head: () => ({
    meta: [
      { title: "Design System — Buttons" },
      { name: "description", content: "Yuna design system: button variants and states." },
    ],
  }),
  component: DSButtons,
});

const TEXT_SIZES = ["md", "sm", "xs"] as const;
const ICON_SIZES = ["icon-sm", "icon", "icon-lg"] as const;

function DSButtons() {
  return (
    <main className="ml-44 min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-10 py-12">
        <header className="mb-10">
          <p className="font-sans-ui text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Design System
          </p>
          <h1 className="text-3xl tracking-tight">Buttons</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
            One root <code className="font-sans-ui text-xs">Button</code> drives every CTA.
            Pick a <code className="font-sans-ui text-xs">surface</code> (the background it sits on), a{" "}
            <code className="font-sans-ui text-xs">variant</code> (fill style), and a{" "}
            <code className="font-sans-ui text-xs">size</code>. Each variant below is shown on both
            surfaces.
          </p>
        </header>

        {/* ─── Variants × text sizes ───────────────────────────────────────── */}
        <Section
          title="Primary"
          subtitle="Solid fill — strongest CTA. Use sparingly: one primary per screen."
        >
          <SurfacePair
            renderRow={(surface) => (
              <Row>
                {TEXT_SIZES.map((s) => (
                  <Button key={s} surface={surface} variant="primary" size={s}>
                    Continue
                  </Button>
                ))}
              </Row>
            )}
          />
        </Section>

        <Section
          title="Secondary"
          subtitle="Outlined, no fill — supporting actions. Also the off-state for toggle buttons."
        >
          <SurfacePair
            renderRow={(surface) => (
              <Row>
                {TEXT_SIZES.map((s) => (
                  <Button key={s} surface={surface} variant="secondary" size={s}>
                    Continue
                  </Button>
                ))}
              </Row>
            )}
          />
        </Section>

        <Section
          title="Ghost"
          subtitle="No border or fill — text-only affordances."
        >
          <SurfacePair
            renderRow={(surface) => (
              <Row>
                {TEXT_SIZES.map((s) => (
                  <Button key={s} surface={surface} variant="ghost" size={s}>
                    Use code
                  </Button>
                ))}
              </Row>
            )}
          />
        </Section>

        {/* ─── Icon buttons — sizes, toggle, label-below all together ─────── */}
        <Section
          title="Icon buttons"
          subtitle={
            <>
              <code className="font-sans-ui text-[11px]">size="icon-sm" | "icon" | "icon-lg"</code>.
              Pass <code className="font-sans-ui text-[11px]">pressed</code> to flip into primary (toggle state).
              Pass <code className="font-sans-ui text-[11px]">label</code> on icon sizes to render a small caption underneath.
            </>
          }
        >
          {/* Sizes */}
          <SurfacePair
            innerLabel="Sizes"
            renderRow={(surface) => (
              <Row>
                {ICON_SIZES.map((s) => (
                  <Button key={s} surface={surface} variant="secondary" size={s} aria-label="Back">
                    <BackArrow />
                  </Button>
                ))}
              </Row>
            )}
          />

          <div className="h-4" />

          {/* Toggle (pressed) — interactive */}
          <SurfacePair
            innerLabel="Toggle — click to flip pressed/unpressed"
            renderRow={(surface) => <ToggleDemo surface={surface} />}
          />

          <div className="h-4" />

          {/* Label-below */}
          <SurfacePair
            innerLabel="Label below (icon-lg)"
            renderRow={(surface) => (
              <Row className="gap-6">
                <Button surface={surface} variant="secondary" size="icon-lg" label="Default" aria-label="Default">
                  <MicGlyph />
                </Button>
                <Button surface={surface} variant="secondary" size="icon-lg" pressed label="Pressed" aria-label="Pressed">
                  <SpeakerGlyph />
                </Button>
                <Button surface={surface} variant="secondary" size="icon-lg" pressed label="Pressed" aria-label="Pressed">
                  <EndGlyph />
                </Button>
              </Row>
            )}
          />
        </Section>

        {/* ─── States ──────────────────────────────────────────────────────── */}
        <Section
          title="States"
          subtitle="Default, focused, disabled. Tap and hold a button to feel the pressed (active:) state — there are no hover states."
        >
          <SurfacePair
            renderRow={(surface) => (
              <div className="flex flex-col gap-3 w-full max-w-[220px]">
                <Button surface={surface} variant="primary" fullWidth>Default</Button>
                <Button surface={surface} variant="primary" fullWidth autoFocus>Focused</Button>
                <Button surface={surface} variant="primary" fullWidth disabled>Disabled</Button>
              </div>
            )}
          />
        </Section>

        {/* ─── Props reference ────────────────────────────────────────────── */}
        <Section title="Props" subtitle="Type signature.">
          <pre className="font-sans-ui text-[12px] leading-relaxed bg-muted/40 border border-border rounded-2xl p-5 overflow-x-auto">
{`<Button
  surface?:  "dark" | "light"                          // default: "light"
  variant?:  "primary" | "secondary" | "ghost"         // default: "primary"
  size?:     "md" | "sm" | "xs" | "icon" | "icon-sm" | "icon-lg"   // default: "md"
  fullWidth?: boolean                                  // default: false
  pressed?:  boolean       // toggles into primary look; sets aria-pressed
  label?:    string        // icon sizes only — caption below the circle
  asChild?:  boolean       // wrap a <Link> with asChild
  disabled?: boolean
  ...native button props
/>`}
          </pre>
        </Section>
      </div>
    </main>
  );
}

// ─── Layout primitives ──────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="text-lg tracking-tight">{title}</h2>
      {subtitle && (
        <p className="font-sans-ui text-xs text-muted-foreground mt-1 mb-4 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

// Side-by-side dark + light surface panels. `renderRow` receives the surface
// name and returns the button content for that panel. `innerLabel` lets the
// caller stack multiple rows inside one Section without losing context.
function SurfacePair({
  renderRow,
  innerLabel,
}: {
  renderRow: (surface: "dark" | "light") => React.ReactNode;
  innerLabel?: string;
}) {
  return (
    <div>
      {innerLabel && (
        <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
          {innerLabel}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <SurfacePanel tone="dark">{renderRow("dark")}</SurfacePanel>
        <SurfacePanel tone="light">{renderRow("light")}</SurfacePanel>
      </div>
    </div>
  );
}

function SurfacePanel({
  tone,
  children,
}: {
  tone: "dark" | "light";
  children: React.ReactNode;
}) {
  const bg = tone === "dark" ? "/background.png" : "/light-blur-bg.png";
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className="relative px-6 py-7 min-h-[96px] flex items-center">
        <div className="w-full">
          <p
            className={
              "font-sans-ui text-[10px] tracking-[0.25em] uppercase mb-3 " +
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

function Row({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex items-center flex-wrap gap-3 ${className}`}>{children}</div>;
}

// ─── Interactive demos ──────────────────────────────────────────────────────

function ToggleDemo({ surface }: { surface: "dark" | "light" }) {
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  return (
    <Row className="gap-6">
      <Button
        surface={surface}
        variant="secondary"
        size="icon"
        pressed={muted}
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        <MicGlyph />
      </Button>
      <Button
        surface={surface}
        variant="ghost"
        size="icon-lg"
        pressed={speakerOn}
        onClick={() => setSpeakerOn((s) => !s)}
        aria-label={speakerOn ? "Speaker on" : "Speaker off"}
      >
        <SpeakerGlyph />
      </Button>
    </Row>
  );
}

// ─── Icon glyphs ────────────────────────────────────────────────────────────

function BackArrow() {
  return <ChevronLeft size={14} strokeWidth={1.5} />;
}

function MicGlyph() {
  return <Mic size={16} strokeWidth={1.5} />;
}

function SpeakerGlyph() {
  return <Volume2 size={16} strokeWidth={1.5} />;
}

function EndGlyph() {
  return <PhoneOff size={16} strokeWidth={1.5} />;
}
