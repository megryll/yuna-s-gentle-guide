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
  ScanFace,
  Star,
  User,
  Users,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";

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
  head: () => ({ meta: [{ title: "My Account — Yuna" }] }),
  component: SettingsRoute,
});

function SettingsRoute() {
  const navigate = useNavigate();
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
    <PhoneFrame backgroundImage="/background.png" themed>
      <div className="flex-1 flex flex-col text-white min-h-0">
        <header className="flex items-center justify-between px-6 pt-14 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              surface="dark"
              variant="secondary"
              size="icon"
              onClick={() => navigate({ to: "/home" })}
              aria-label="Back"
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
            </Button>
            <h1 className="font-display text-2xl leading-8 tracking-tight text-white">
              My Account
            </h1>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/25 bg-white/10 backdrop-blur-sm px-3 h-[26px] text-[12px] text-white/85 active:bg-white/15 transition-colors"
          >
            Share Yuna
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-10 flex flex-col gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

          <button
            type="button"
            className="self-center mt-2 py-4 px-4 text-[16px] leading-6 font-semibold text-alert-red active:opacity-70 transition-opacity"
          >
            Log Out
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function CardGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 rounded-2xl overflow-hidden border border-white/15 bg-white/[0.06] backdrop-blur-sm flex flex-col">
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
  const borderClass = isLast ? "" : "border-b border-white/10";
  const baseClass = `flex items-center justify-between gap-3 p-4 shrink-0 ${borderClass}`;

  if (row.kind === "toggle") {
    return (
      <div className={baseClass}>
        <div className="flex items-center gap-2">
          <Icon size={24} strokeWidth={1.6} className="text-white" aria-hidden />
          <span className="text-[16px] leading-6 text-white">{row.label}</span>
        </div>
        <IOSSwitch checked={!!toggleOn} onChange={onToggle} label={row.label} />
      </div>
    );
  }

  return (
    <button type="button" className={`${baseClass} active:bg-white/[0.05] transition-colors`}>
      <div className="flex items-center gap-2">
        <Icon size={24} strokeWidth={1.6} className="text-white" aria-hidden />
        <span className="text-[16px] leading-6 text-white">{row.label}</span>
      </div>
      <ChevronRight size={16} strokeWidth={2} className="text-white/70" aria-hidden />
    </button>
  );
}

function IOSSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={
        "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors " +
        (checked ? "bg-[#34C759]" : "bg-white/25")
      }
    >
      <span
        aria-hidden
        className="absolute top-[2px] left-0 h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15),0_3px_8px_rgba(0,0,0,0.15)] transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}
