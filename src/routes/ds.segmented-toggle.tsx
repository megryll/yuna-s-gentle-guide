import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Mic, Sun, Moon, LayoutGrid, List } from "lucide-react";
import { SegmentedToggle, type SegmentedToggleOption } from "@/components/SegmentedToggle";
import { DSPage, Section, SurfaceMatrix, PropsBlock, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/segmented-toggle")({
  head: () => ({
    meta: [
      { title: "Design System — Segmented Toggle" },
      { name: "description", content: "Two-segment pill toggle." },
    ],
  }),
  component: DSSegmentedToggle,
});

// ─── Real call-site option shapes ───────────────────────────────────────────
// These mirror what chat.tsx and settings.tsx pass — keeping the DS page
// honest about how the component actually shows up in the app.

const CHAT_OPTIONS: ReadonlyArray<SegmentedToggleOption<"text" | "voice">> = [
  { value: "voice", label: "Voice", icon: <Mic size={14} strokeWidth={1.75} /> },
  { value: "text", label: "Text", icon: <MessageSquare size={14} strokeWidth={1.75} /> },
] as const;

const THEME_OPTIONS: ReadonlyArray<SegmentedToggleOption<"light" | "dark">> = [
  { value: "light", label: "Light", icon: <Sun size={14} strokeWidth={1.75} /> },
  { value: "dark", label: "Dark", icon: <Moon size={14} strokeWidth={1.75} /> },
] as const;

// Icon-only, no label — the compact size="sm" rail (Home card/list switcher).
const VIEW_OPTIONS: ReadonlyArray<SegmentedToggleOption<"card" | "list">> = [
  { value: "card", icon: <LayoutGrid size={13} strokeWidth={1.75} />, ariaLabel: "Card view" },
  { value: "list", icon: <List size={13} strokeWidth={1.75} />, ariaLabel: "List view" },
] as const;

function DSSegmentedToggle() {
  return (
    <DSPage title="Segmented toggle">
      {/* ─── Variants ───────────────────────────────────────────────────── */}
      <Section
        title="Variants"
        subtitle="Default and Theme are md with labels; Compact is the size=&quot;sm&quot;, icon-only rail (Home card/list switcher)."
      >
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      {/* ─── Anatomy ────────────────────────────────────────────────────── */}
      <Section title="Anatomy">
        <div className="rounded-2xl border border-border p-6 bg-muted/30">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
            <span className="text-muted-foreground">Rail height</span>
            <code>md: h-9 (36px) · sm: h-8 (32px)</code>
            <span className="text-muted-foreground">Segment height</span>
            <code>md: h-8 px-3 · sm: h-7 (icon-only h-7 w-7)</code>
            <span className="text-muted-foreground">Active pill</span>
            <code>bg-[#ffffff] text-[#1D1F25] (dark) · bg-[#1D1F25] text-[#ffffff] (light)</code>
            <span className="text-muted-foreground">Inactive label</span>
            <code>text-white (dark) · text-foreground/75 (light)</code>
            <span className="text-muted-foreground">Label type</span>
            <code>text-[11px] tracking-[0.16em] uppercase</code>
          </div>
        </div>
      </Section>

      <Section title="Props">
        <PropsBlock>{`<SegmentedToggle
  value:    V
  options:  ReadonlyArray<SegmentedToggleOption<V>>
  onChange: (v: V) => void
  surface:  "dark" | "light"
  ariaLabel: string
  size?:    "sm" | "md"        // default "md"; "sm" = compact rail
/>

type SegmentedToggleOption<V extends string> = {
  value:      V
  label?:     string           // omit for icon-only (size="sm")
  icon:       ReactNode
  ariaLabel?: string           // required when label is omitted
}`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

// ─── Interactive demos ──────────────────────────────────────────────────────

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Default", render: (s) => <ChatToggleDemo surface={s} /> },
  { label: "Theme", render: (s) => <ThemeToggleDemo surface={s} /> },
  { label: "Compact", render: (s) => <ViewToggleDemo surface={s} /> },
];

function ChatToggleDemo({ surface }: { surface: "dark" | "light" }) {
  const [mode, setMode] = useState<"text" | "voice">("text");
  return (
    <SegmentedToggle
      value={mode}
      onChange={setMode}
      surface={surface}
      ariaLabel="Conversation mode"
      options={CHAT_OPTIONS}
    />
  );
}

function ThemeToggleDemo({ surface }: { surface: "dark" | "light" }) {
  const [mode, setMode] = useState<"light" | "dark">(surface === "dark" ? "dark" : "light");
  return (
    <SegmentedToggle
      value={mode}
      onChange={setMode}
      surface={surface}
      ariaLabel="Appearance"
      options={THEME_OPTIONS}
    />
  );
}

function ViewToggleDemo({ surface }: { surface: "dark" | "light" }) {
  const [view, setView] = useState<"card" | "list">("card");
  return (
    <SegmentedToggle
      size="sm"
      value={view}
      onChange={setView}
      surface={surface}
      ariaLabel="View mode"
      options={VIEW_OPTIONS}
    />
  );
}
