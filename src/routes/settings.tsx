import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  MessageSquare,
  Moon,
  ScanFace,
  Star,
  Sun,
  User,
  Users,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { Switch } from "@/components/Switch";
import { APP_MODE_META, setAppMode, useAppMode } from "@/lib/theme-prefs";

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

type LinkRow = {
  id: string;
  label: string;
  Icon: IconCmp;
  kind: "link";
};

type ToggleRow = {
  id: string;
  label: string;
  Icon: IconCmp;
  kind: "toggle";
  defaultOn: boolean;
};

type Row = LinkRow | ToggleRow;

const GROUP_ONE: Row[] = [
  { id: "account", label: "Account Settings", Icon: User, kind: "link" },
  { id: "subscription", label: "Subscription", Icon: Star, kind: "link" },
  { id: "voice", label: "Customize Voice", Icon: Users, kind: "link" },
  { id: "language", label: "Session Language", Icon: Globe, kind: "link" },
  { id: "faceid", label: "Face ID", Icon: ScanFace, kind: "toggle", defaultOn: true },
  { id: "push", label: "Push notifications", Icon: Bell, kind: "toggle", defaultOn: true },
];

const GROUP_TWO: Row[] = [
  { id: "feedback", label: "Your Feedback", Icon: MessageSquare, kind: "link" },
  { id: "terms", label: "Terms and Conditions", Icon: FileText, kind: "link" },
  { id: "privacy", label: "Privacy Policy", Icon: FileText, kind: "link" },
  { id: "references", label: "References", Icon: FileText, kind: "link" },
];

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Yuna" }] }),
  component: SettingsRoute,
});

function SettingsRoute() {
  const navigate = useNavigate();
  const mode = useAppMode();
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      [...GROUP_ONE, ...GROUP_TWO]
        .filter((r): r is ToggleRow => r.kind === "toggle")
        .map((r) => [r.id, r.defaultOn]),
    ),
  );

  const toggle = (id: string) =>
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <PhoneFrame>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${APP_MODE_META[mode].image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div
        className={
          "relative flex-1 flex flex-col text-foreground min-h-0 " +
          (mode === "dark" ? "overlay-on-dark" : "")
        }
      >
        <header className="flex items-center justify-between px-6 pt-14 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              surface="light"
              variant="secondary"
              size="icon"
              onClick={() => navigate({ to: "/home" })}
              aria-label="Back"
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
            </Button>
            <h1 className="font-display text-2xl leading-8 tracking-tight text-foreground">
              Settings
            </h1>
          </div>
          <Button
            surface="light"
            variant="secondary"
            size="xs"
            className="bg-background/60 backdrop-blur-sm border-foreground/20 text-foreground/85 active:bg-background/80"
          >
            Share Yuna
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-10 flex flex-col gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex justify-center pb-2">
            <SegmentedToggle
              value={mode}
              onChange={setAppMode}
              surface={mode === "dark" ? "dark" : "light"}
              ariaLabel="Appearance"
              options={THEME_TOGGLE_OPTIONS}
            />
          </div>

          <CardGroup>
            {GROUP_ONE.map((row, i) => (
              <SettingsRowItem
                key={row.id}
                row={row}
                isLast={i === GROUP_ONE.length - 1}
                toggleOn={row.kind === "toggle" ? toggles[row.id] : undefined}
                onToggle={() => toggle(row.id)}
              />
            ))}
          </CardGroup>

          <CardGroup>
            {GROUP_TWO.map((row, i) => (
              <SettingsRowItem
                key={row.id}
                row={row}
                isLast={i === GROUP_TWO.length - 1}
                toggleOn={row.kind === "toggle" ? toggles[row.id] : undefined}
                onToggle={() => toggle(row.id)}
              />
            ))}
          </CardGroup>

          <Button
            surface="light"
            variant="secondary"
            size="sm"
            className="self-center mt-2"
          >
            Log Out
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function CardGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 rounded-2xl overflow-hidden hairline bg-background/40 backdrop-blur-sm flex flex-col">
      {children}
    </div>
  );
}

function SettingsRowItem({
  row,
  isLast,
  toggleOn,
  onToggle,
}: {
  row: Row;
  isLast: boolean;
  toggleOn?: boolean;
  onToggle: () => void;
}) {
  const Icon = row.Icon;
  const borderClass = isLast ? "" : "border-b border-border";
  const baseClass = `flex items-center justify-between gap-3 p-4 shrink-0 ${borderClass}`;

  if (row.kind === "toggle") {
    return (
      <div className={baseClass}>
        <div className="flex items-center gap-4">
          <Icon size={18} strokeWidth={1.5} className="text-foreground" aria-hidden />
          <span className="text-[15px] leading-6 font-medium text-foreground">{row.label}</span>
        </div>
        <Switch checked={!!toggleOn} onChange={onToggle} label={row.label} />
      </div>
    );
  }

  return (
    <button type="button" className={`${baseClass} active:bg-foreground/[0.05] transition-colors`}>
      <div className="flex items-center gap-4">
        <Icon size={18} strokeWidth={1.5} className="text-foreground" aria-hidden />
        <span className="text-[15px] leading-6 font-medium text-foreground">{row.label}</span>
      </div>
      <ChevronRight size={16} strokeWidth={2} className="text-foreground/55" aria-hidden />
    </button>
  );
}

const THEME_TOGGLE_OPTIONS = [
  {
    value: "light" as const,
    label: "Light",
    ariaLabel: "Light mode",
    icon: <Sun size={14} strokeWidth={1.6} aria-hidden />,
  },
  {
    value: "dark" as const,
    label: "Dark",
    ariaLabel: "Dark mode",
    icon: <Moon size={14} strokeWidth={1.6} aria-hidden />,
  },
];
