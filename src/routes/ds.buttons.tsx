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

const VARIANTS = ["primary", "secondary", "ghost"] as const;
const SIZES = ["md", "sm"] as const;

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
            One root <code className="font-sans-ui text-xs">Button</code> component drives every CTA in the prototype.
            Pick a <code className="font-sans-ui text-xs">surface</code> (the background it sits on), a{" "}
            <code className="font-sans-ui text-xs">variant</code> (fill style), and a{" "}
            <code className="font-sans-ui text-xs">size</code>.
          </p>
        </header>

        {/* Surface: dark (over photo / dark bg) */}
        <Section
          title="Surface: dark"
          subtitle="Use on photo or dark-gradient screens (Welcome, Create Account, Intro)."
        >
          <DarkSurface>
            <Matrix surface="dark" />
          </DarkSurface>
        </Section>

        {/* Surface: light (over wireframe / light bg) */}
        <Section
          title="Surface: light"
          subtitle="Use on wireframe / light surfaces (Home, You, Activities, Progress)."
        >
          <LightSurface>
            <Matrix surface="light" />
          </LightSurface>
        </Section>

        {/* States */}
        <Section
          title="States"
          subtitle="Default, pressed, focused, disabled. Tap and hold a button to see its pressed state."
        >
          <div className="grid grid-cols-2 gap-6">
            <DarkSurface>
              <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/60 mb-3">Dark · primary</p>
              <div className="flex flex-col gap-3">
                <Button surface="dark" variant="primary" fullWidth>Default</Button>
                <Button surface="dark" variant="primary" fullWidth autoFocus>Focused</Button>
                <Button surface="dark" variant="primary" fullWidth disabled>Disabled</Button>
              </div>
            </DarkSurface>
            <LightSurface>
              <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">Light · primary</p>
              <div className="flex flex-col gap-3">
                <Button surface="light" variant="primary" fullWidth>Default</Button>
                <Button surface="light" variant="primary" fullWidth>Focused</Button>
                <Button surface="light" variant="primary" fullWidth disabled>Disabled</Button>
              </div>
            </LightSurface>
          </div>
        </Section>

        {/* Sizes */}
        <Section
          title="Sizes"
          subtitle="md (default CTA), sm (compact), icon (h-9), icon-sm (h-8), icon-lg (h-11)."
        >
          <LightSurface>
            <div className="flex items-center gap-4 flex-wrap">
              <Button surface="light" variant="primary" size="md">Medium</Button>
              <Button surface="light" variant="primary" size="sm">Small</Button>
              <Button surface="light" variant="secondary" size="icon-sm" aria-label="Back">
                <BackArrow />
              </Button>
              <Button surface="light" variant="secondary" size="icon" aria-label="Back">
                <BackArrow />
              </Button>
              <Button surface="light" variant="secondary" size="icon-lg" aria-label="Back">
                <BackArrow />
              </Button>
            </div>
          </LightSurface>
        </Section>

        {/* Toggle / pressed state */}
        <Section
          title="Toggle (pressed)"
          subtitle="Pass `pressed` to flip a button into the primary look. Use for mute/speaker/voice toggles. aria-pressed is set automatically."
        >
          <LightSurface>
            <ToggleDemo />
          </LightSurface>
        </Section>

        {/* Label-below icon button */}
        <Section
          title="Icon button with label"
          subtitle="Pass `label` to an icon-size button to render a small caption below. Use for stacked icon-stacks like the call-screen action bar."
        >
          <LightSurface>
            <div className="flex items-center justify-center gap-6">
              <Button surface="light" variant="secondary" size="icon-lg" label="Mute" aria-label="Mute">
                <MicGlyph />
              </Button>
              <Button surface="light" variant="secondary" size="icon-lg" pressed label="Speaker" aria-label="Speaker">
                <SpeakerGlyph />
              </Button>
              <Button surface="light" variant="secondary" size="icon-lg" pressed label="End Call" aria-label="End Call">
                <EndGlyph />
              </Button>
            </div>
          </LightSurface>
        </Section>

        {/* Props reference */}
        <Section title="Props" subtitle="Type signature.">
          <pre className="font-sans-ui text-[12px] leading-relaxed bg-muted/40 border border-border rounded-2xl p-5 overflow-x-auto">
{`<Button
  surface?:  "dark" | "light"                          // default: "light"
  variant?:  "primary" | "secondary" | "ghost"         // default: "primary"
  size?:     "md" | "sm" | "icon" | "icon-sm" | "icon-lg"   // default: "md"
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-lg tracking-tight">{title}</h2>
      {subtitle && (
        <p className="font-sans-ui text-xs text-muted-foreground mt-1 mb-4">{subtitle}</p>
      )}
      {children}
    </section>
  );
}

function DarkSurface({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(20,30,55,0.95), rgba(50,30,80,0.95))",
      }}
    >
      {children}
    </div>
  );
}

function LightSurface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl p-6 border border-border bg-card">{children}</div>;
}

function Matrix({ surface }: { surface: "dark" | "light" }) {
  const labelClass =
    surface === "dark"
      ? "font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/60"
      : "font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground";

  return (
    <div className="grid grid-cols-[120px_1fr_1fr] gap-x-6 gap-y-4 items-center">
      <span className={labelClass}>Variant ↓</span>
      {SIZES.map((s) => (
        <span key={s} className={labelClass}>
          {s}
        </span>
      ))}
      {VARIANTS.map((v) => (
        <RowEntry key={v} surface={surface} variant={v} labelClass={labelClass} />
      ))}
    </div>
  );
}

function RowEntry({
  surface,
  variant,
  labelClass,
}: {
  surface: "dark" | "light";
  variant: "primary" | "secondary" | "ghost";
  labelClass: string;
}) {
  return (
    <>
      <span className={labelClass}>{variant}</span>
      {SIZES.map((s) => (
        <div key={s}>
          <Button surface={surface} variant={variant} size={s}>
            {variant === "ghost" ? "Use code" : "Continue"}
          </Button>
        </div>
      ))}
    </>
  );
}

function ToggleDemo() {
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  return (
    <div className="flex items-center gap-6">
      <Button
        surface="light"
        variant="secondary"
        size="icon"
        pressed={muted}
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        <MicGlyph />
      </Button>
      <Button
        surface="light"
        variant="ghost"
        size="icon-lg"
        pressed={speakerOn}
        onClick={() => setSpeakerOn((s) => !s)}
        aria-label={speakerOn ? "Speaker on" : "Speaker off"}
      >
        <SpeakerGlyph />
      </Button>
      <p className="font-sans-ui text-xs text-muted-foreground max-w-xs">
        Click the buttons to toggle. The off-state respects the variant you pass; the
        on-state always renders as primary.
      </p>
    </div>
  );
}

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
