import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Mic, PhoneOff, Volume2 } from "lucide-react";
import { Button } from "@/components/Button";
import { DSPage, PropsBlock, Row, Section, SurfaceMatrix, type MatrixRow } from "@/ds-docs/surface";

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
    <DSPage title="Buttons">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section
        title="States"
        subtitle="Tap and hold to feel the pressed state; there are no hover states."
      >
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Button
  surface?:  "dark" | "light"                          // default: "light"
  variant?:  "primary" | "secondary" | "ghost" | "card" | "link"   // default: "primary"
  size?:     "md" | "sm" | "xs" | "icon" | "icon-sm" | "icon-lg"   // default: "md" (ignored by card/link)
  fullWidth?: boolean                                  // default: false
  pressed?:  boolean       // toggles into primary look; sets aria-pressed
  label?:    string        // icon sizes only — caption below the circle
  subtitle?: string        // card variant — secondary line under the title
  trailing?: ReactNode     // card variant — trailing element (e.g. a chevron)
  asChild?:  boolean       // wrap a <Link> with asChild
  disabled?: boolean
  ...native button props
/>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

// ─── Matrix rows ──────────────────────────────────────────────────────────

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Primary", render: (s) => <SizeRow surface={s} variant="primary" label="Continue" /> },
  { label: "Secondary", render: (s) => <SizeRow surface={s} variant="secondary" label="Continue" /> },
  { label: "Ghost", render: (s) => <SizeRow surface={s} variant="ghost" label="Use code" /> },
  { label: "Icon buttons", render: (s) => <IconSizeRow surface={s} /> },
  { label: "Card", render: (s) => <CardRow surface={s} /> },
  { label: "Link", render: (s) => <LinkRow surface={s} /> },
];

const STATE_ROWS: MatrixRow[] = [
  { label: "Primary", render: (s) => <StateStack surface={s} variant="primary" /> },
  { label: "Secondary", render: (s) => <StateStack surface={s} variant="secondary" /> },
  { label: "Ghost", render: (s) => <StateStack surface={s} variant="ghost" /> },
  { label: "Icon buttons", render: (s) => <IconStateRow surface={s} /> },
];

function SizeRow({
  surface,
  variant,
  label,
}: {
  surface: "dark" | "light";
  variant: "primary" | "secondary" | "ghost";
  label: string;
}) {
  return (
    <Row>
      {TEXT_SIZES.map((s) => (
        <Button key={s} surface={surface} variant={variant} size={s}>
          {label}
        </Button>
      ))}
    </Row>
  );
}

function CardRow({ surface }: { surface: "dark" | "light" }) {
  return (
    <div className="w-full max-w-[320px] flex flex-col gap-3">
      <Button
        surface={surface}
        variant="card"
        subtitle="Free access and 100% private"
        trailing={<ChevronRight size={20} strokeWidth={1.75} />}
      >
        Sign up through my employer
      </Button>
      <Button
        surface={surface}
        variant="card"
        trailing={<ChevronRight size={20} strokeWidth={1.75} />}
      >
        Title only, no subtitle
      </Button>
    </div>
  );
}

function LinkRow({ surface }: { surface: "dark" | "light" }) {
  return (
    <Row className="gap-5">
      <Button surface={surface} variant="link">Referral Code</Button>
      <Button surface={surface} variant="link">Login</Button>
      <Button surface={surface} variant="link" className="underline underline-offset-4">
        Forgot password?
      </Button>
    </Row>
  );
}

function IconSizeRow({ surface }: { surface: "dark" | "light" }) {
  return (
    <Row>
      {ICON_SIZES.map((s) => (
        <Button key={s} surface={surface} variant="secondary" size={s} aria-label="Back">
          <BackArrow />
        </Button>
      ))}
    </Row>
  );
}

function StateStack({
  surface,
  variant,
}: {
  surface: "dark" | "light";
  variant: "primary" | "secondary" | "ghost";
}) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-[260px]">
      <Button surface={surface} variant={variant} fullWidth>
        Default
      </Button>
      <Button surface={surface} variant={variant} fullWidth className={focusRing(surface)}>
        Focused
      </Button>
      <Button surface={surface} variant={variant} fullWidth disabled>
        Disabled
      </Button>
    </div>
  );
}

function IconStateRow({ surface }: { surface: "dark" | "light" }) {
  return (
    <Row className="gap-6">
      <Button surface={surface} variant="secondary" size="icon-lg" label="Default" aria-label="Default">
        <MicGlyph />
      </Button>
      <Button surface={surface} variant="secondary" size="icon-lg" pressed label="Pressed" aria-label="Pressed">
        <SpeakerGlyph />
      </Button>
      <Button surface={surface} variant="secondary" size="icon-lg" disabled label="Disabled" aria-label="Disabled">
        <EndGlyph />
      </Button>
    </Row>
  );
}

// Static ring mirroring the button's focus-visible appearance, so the
// "Focused" state is visible in the matrix without stealing real focus.
function focusRing(surface: "dark" | "light") {
  return surface === "dark"
    ? "ring-2 ring-offset-0 ring-white/60"
    : "ring-2 ring-offset-0 ring-foreground/40";
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
