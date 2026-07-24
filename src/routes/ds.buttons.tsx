import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp, Bookmark, ChevronDown, ChevronLeft, ChevronRight, Clock, Menu, MoreHorizontal, Volume2, X } from "lucide-react";
import { Button } from "@/components/Button";
import { IconMedallion } from "@/components/IconMedallion";
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

function DSButtons() {
  return (
    <DSPage title="Buttons">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section
        title="States"
        subtitle="Every variant in its three states; press is simulated here — there are no hover states."
      >
        <SurfaceMatrix rows={STATE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<Button
  surface?:  "dark" | "light"                          // default: "light"
  variant?:  "primary" | "destructive" | "secondary" | "plain" | "card" | "link"   // default: "primary"
             // destructive = solid alert-orange fill for irreversible actions (same on both surfaces)
             // plain = naked icon glyph (no border/fill/box); pressed → primary look
  size?:     "md" | "sm" | "xs" | "icon" | "icon-sm" | "icon-lg"   // default: "md" (ignored by card/link)
             // icon* sizes also set the glyph size (16 / 18 / 22px) — don't size icons at the call site
  fullWidth?: boolean                                  // default: false
  pressed?:  boolean       // toggles into primary look; sets aria-pressed
  loading?:  boolean       // busy: LeafSpinner replaces the label, size held, input blocked
                           // (no disabled dimming); ignored by card/link
  label?:    string        // icon sizes only — caption below the circle
  subtitle?: string        // card variant — secondary line under the title
  leading?:  ReactNode     // card variant — leading element (e.g. an IconMedallion)
  trailing?: ReactNode     // card variant — trailing element (e.g. a chevron)
  selected?: boolean       // card variant — selected/checked row; adds highlight + auto check
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
  { label: "Destructive", render: (s) => <SizeRow surface={s} variant="destructive" label="Delete account" /> },
  { label: "Secondary", render: (s) => <SizeRow surface={s} variant="secondary" label="Continue" /> },
  { label: "With icon", render: (s) => <IconLabelRow surface={s} /> },
  { label: "Link", render: (s) => <LinkRow surface={s} /> },
  { label: "Icon — primary", render: (s) => <IconButtonsRow surface={s} variant="primary" /> },
  { label: "Icon — secondary", render: (s) => <IconButtonsRow surface={s} variant="secondary" /> },
  { label: "Icon — plain", render: (s) => <IconButtonsRow surface={s} variant="plain" /> },
  { label: "Card", render: (s) => <CardRow surface={s} /> },
];

const STATE_ROWS: MatrixRow[] = [
  { label: "Primary", render: (s) => <StateStack surface={s} variant="primary" /> },
  { label: "Destructive", render: (s) => <StateStack surface={s} variant="destructive" /> },
  { label: "Secondary", render: (s) => <StateStack surface={s} variant="secondary" /> },
  { label: "Link", render: (s) => <LinkStateRow surface={s} /> },
  { label: "Card", render: (s) => <CardStateStack surface={s} /> },
  {
    label: "Icon — primary",
    render: (s) => <IconStateRow surface={s} variant="primary" glyph={<ArrowUp strokeWidth={2} />} />,
  },
  {
    label: "Icon — secondary",
    render: (s) => (
      <IconStateRow surface={s} variant="secondary" glyph={<ChevronLeft strokeWidth={1.5} />} />
    ),
  },
  {
    label: "Icon — plain",
    render: (s) => <IconStateRow surface={s} variant="plain" glyph={<Menu strokeWidth={1.6} />} />,
  },
];

function SizeRow({
  surface,
  variant,
  label,
}: {
  surface: "dark" | "light";
  variant: "primary" | "destructive" | "secondary";
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

// Icons live in the button's children, not a prop — place one before the label
// (leading), after it (trailing), or both. The base gap spaces them; size the
// glyph at the call site (text sizes don't auto-size svgs the way icon sizes do).
function IconLabelRow({ surface }: { surface: "dark" | "light" }) {
  return (
    <Row className="gap-3">
      <Button surface={surface} variant="secondary" size="sm">
        <Volume2 size={16} strokeWidth={1.75} aria-hidden />
        Leading
      </Button>
      <Button surface={surface} variant="secondary" size="sm">
        Trailing
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
      </Button>
      <Button surface={surface} variant="secondary" size="sm">
        <Volume2 size={16} strokeWidth={1.75} aria-hidden />
        Both
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
      </Button>
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
        subtitle="Perfect for an evening wind-down"
        leading={
          <IconMedallion size="sm">
            <Clock size={18} strokeWidth={1.8} className="text-white" aria-hidden />
          </IconMedallion>
        }
      >
        Today at 6:00 PM
      </Button>
    </div>
  );
}

function LinkRow({ surface }: { surface: "dark" | "light" }) {
  return (
    <Row className="gap-5">
      <Button surface={surface} variant="link">Login</Button>
    </Row>
  );
}

// Icon buttons as the prototype actually uses them: plain (no border) spans
// all three sizes (Card More, drawer/header close, header menu); secondary
// (border) and primary (filled) appear only at the two smaller sizes (back +
// save toggle; Send + speaker). Button sizes every glyph — callers don't.
function IconButtonsRow({
  surface,
  variant,
}: {
  surface: "dark" | "light";
  variant: "primary" | "secondary" | "plain";
}) {
  if (variant === "primary") {
    return (
      <Row className="gap-3">
        <Button surface={surface} variant="primary" size="icon-sm" aria-label="Send">
          <ArrowUp strokeWidth={2} />
        </Button>
        <Button surface={surface} variant="primary" size="icon" aria-label="Mute Yuna">
          <Volume2 strokeWidth={1.6} />
        </Button>
      </Row>
    );
  }
  if (variant === "secondary") {
    return (
      <Row className="gap-3">
        <Button surface={surface} variant="secondary" size="icon-sm" aria-label="Save">
          <Bookmark strokeWidth={1.75} />
        </Button>
        <Button surface={surface} variant="secondary" size="icon" aria-label="Back">
          <ChevronLeft strokeWidth={1.5} />
        </Button>
      </Row>
    );
  }
  return (
    <Row className="gap-3">
      <Button surface={surface} variant="plain" size="icon-sm" aria-label="More">
        <MoreHorizontal strokeWidth={2} />
      </Button>
      <Button surface={surface} variant="plain" size="icon" aria-label="Close">
        <X strokeWidth={1.6} />
      </Button>
      <Button surface={surface} variant="plain" size="icon-lg" aria-label="Menu">
        <Menu strokeWidth={1.6} />
      </Button>
    </Row>
  );
}

function StateStack({
  surface,
  variant,
}: {
  surface: "dark" | "light";
  variant: "primary" | "destructive" | "secondary";
}) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-[260px]">
      <Button surface={surface} variant={variant} fullWidth>
        Default
      </Button>
      <Button surface={surface} variant={variant} fullWidth className={pressedClass(variant, surface)}>
        Pressed
      </Button>
      <Button surface={surface} variant={variant} fullWidth disabled>
        Disabled
      </Button>
      <Button surface={surface} variant={variant} fullWidth loading>
        Loading
      </Button>
    </div>
  );
}

function LinkStateRow({ surface }: { surface: "dark" | "light" }) {
  return (
    <Row className="gap-5">
      <Button surface={surface} variant="link">Default</Button>
      <Button surface={surface} variant="link" className={pressedClass("link", surface)}>
        Pressed
      </Button>
      <Button surface={surface} variant="link" disabled>Disabled</Button>
    </Row>
  );
}

function CardStateStack({ surface }: { surface: "dark" | "light" }) {
  return (
    <div className="w-full max-w-[320px] flex flex-col gap-3">
      <Button surface={surface} variant="card">Default</Button>
      <Button surface={surface} variant="card" selected>
        Selected
      </Button>
      <Button surface={surface} variant="card" className={pressedClass("card", surface)}>
        Pressed
      </Button>
      <Button surface={surface} variant="card" disabled>Disabled</Button>
    </div>
  );
}

// Icon buttons in default / pressed / disabled. Press is simulated with a
// static class (no `label` prop, so it lands on the styled element) mirroring
// each variant's `active:` feedback, since the matrix can't show a real tap.
function IconStateRow({
  surface,
  variant,
  glyph,
}: {
  surface: "dark" | "light";
  variant: "plain" | "secondary" | "primary";
  glyph: ReactNode;
}) {
  const states: { caption: string; className?: string; disabled?: boolean; loading?: boolean }[] = [
    { caption: "Default" },
    { caption: "Pressed", className: pressedClass(variant, surface) },
    { caption: "Disabled", disabled: true },
    { caption: "Loading", loading: true },
  ];
  return (
    <Row className="gap-6">
      {states.map(({ caption, className, disabled, loading }) => (
        <div key={caption} className="flex flex-col items-center gap-2">
          <Button
            surface={surface}
            variant={variant}
            size="icon"
            className={className}
            disabled={disabled}
            loading={loading}
            aria-label={caption}
          >
            {glyph}
          </Button>
          <span
            className={
              "text-[11px] tracking-[0.2em] uppercase " +
              (surface === "dark" ? "text-white/70" : "text-muted-foreground")
            }
          >
            {caption}
          </span>
        </div>
      ))}
    </Row>
  );
}

// Static class mirroring each variant's `active:` press feedback, so the
// "Pressed" state is visible at rest in the matrix.
function pressedClass(
  variant: "primary" | "destructive" | "secondary" | "card" | "link" | "plain",
  surface: "dark" | "light",
): string {
  switch (variant) {
    case "secondary":
      return surface === "dark" ? "bg-white/15" : "bg-foreground/8";
    case "card":
      return surface === "dark" ? "bg-white/10" : "bg-foreground/8";
    case "link":
      return "opacity-70";
    case "plain":
      return "opacity-60";
    case "primary":
    default:
      return "opacity-80";
  }
}

