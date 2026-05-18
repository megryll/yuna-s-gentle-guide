import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Mic, Sun, Moon } from "lucide-react";
import { SegmentedToggle, type SegmentedToggleOption } from "@/components/SegmentedToggle";
import { DSPage, Section, SurfacePair, PropsBlock } from "@/components/ds-surface";

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

function DSSegmentedToggle() {
  return (
    <DSPage
      title="Segmented toggle"
      intro={
        <>
          A two-segment pill toggle for mutually exclusive states.
          Used by the chat <strong>Voice / Text</strong> switch and the
          settings <strong>Light / Dark</strong> appearance toggle. The active
          segment uses arbitrary{" "}
          <code className="text-xs">#ffffff</code> /{" "}
          <code className="text-xs">#1D1F25</code> values so
          neither the <code className="text-xs">.overlay-on-dark</code>{" "}
          token swap nor <code className="text-xs">.theme-light</code>{" "}
          inversion can clobber the contrast.
        </>
      }
    >
      {/* ─── Default — Voice / Text ─────────────────────────────────────── */}
      <Section
        title="Default"
        subtitle="Chat-style — Voice / Text. Click a segment to flip the active pill."
      >
        <SurfacePair
          renderRow={(surface) => <ChatToggleDemo surface={surface} />}
        />
      </Section>

      {/* ─── Theme variant ──────────────────────────────────────────────── */}
      <Section
        title="Theme variant"
        subtitle="Settings-style — Light / Dark."
      >
        <SurfacePair
          renderRow={(surface) => <ThemeToggleDemo surface={surface} />}
        />
      </Section>

      {/* ─── Anatomy ────────────────────────────────────────────────────── */}
      <Section
        title="Anatomy"
        subtitle="Rail height 36px, segments 32px. Each segment is a centered flex row: icon (14px) + label (uppercase, tracked, 11px). Rail uses a translucent wash so it reads against either photo."
      >
        <div className="rounded-2xl border border-border p-6 bg-muted/30">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[12px]">
            <span className="text-muted-foreground">Rail height</span>
            <code>h-9 (36px)</code>
            <span className="text-muted-foreground">Segment height</span>
            <code>h-8 (32px) inside p-0.5 rail</code>
            <span className="text-muted-foreground">Active pill</span>
            <code>bg-[#ffffff] text-[#1D1F25] (dark) · bg-[#1D1F25] text-[#ffffff] (light)</code>
            <span className="text-muted-foreground">Inactive label</span>
            <code>text-white (dark) · text-foreground/75 (light)</code>
            <span className="text-muted-foreground">Label type</span>
            <code>text-[11px] tracking-[0.16em] uppercase</code>
          </div>
        </div>
      </Section>

      <Section title="Props" subtitle="Type signature.">
        <PropsBlock>{`<SegmentedToggle
  value:    V
  options:  ReadonlyArray<SegmentedToggleOption<V>>
  onChange: (v: V) => void
  surface:  "dark" | "light"
  ariaLabel: string
/>

type SegmentedToggleOption<V extends string> = {
  value:      V
  label:      string
  icon:       ReactNode
  ariaLabel?: string
}`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

// ─── Interactive demos ──────────────────────────────────────────────────────

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
