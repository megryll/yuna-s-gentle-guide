import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Leaf,
  MessageSquare,
  ScanFace,
  SlidersHorizontal,
  Star,
  User,
  Users,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Switch } from "@/components/Switch";
import { Toast, ToastViewport } from "@/components/Toast";
import { useAppMode, useModeImage } from "@/lib/theme-prefs";
import { setNatureSoundsOn, useNatureSoundsOn } from "@/lib/nature-sounds-prefs";
import { consumeSettingsSaved } from "@/lib/settings-saved-toast";

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

type LinkRow = {
  id: string;
  label: string;
  Icon: IconCmp;
  kind: "link";
  to?: string;
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
  { id: "natureSounds", label: "Background sounds", Icon: Leaf, kind: "toggle", defaultOn: true },
  { id: "account", label: "Account Settings", Icon: User, kind: "link", to: "/settings/account" },
  { id: "subscription", label: "Subscription", Icon: Star, kind: "link", to: "/settings/subscription" },
  { id: "voice", label: "Customize Voice", Icon: Users, kind: "link", to: "/settings/voice" },
  { id: "language", label: "Session Language", Icon: Globe, kind: "link", to: "/settings/language" },
  { id: "content", label: "Content Preferences", Icon: SlidersHorizontal, kind: "link", to: "/settings/content-preferences" },
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
  const bgImage = useModeImage();
  const natureSoundsOn = useNatureSoundsOn();
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      [...GROUP_ONE, ...GROUP_TWO]
        .filter((r): r is ToggleRow => r.kind === "toggle")
        .map((r) => [r.id, r.defaultOn]),
    ),
  );

  // Confirm a change made on a sub-page (Account, Subscription, Language,
  // Voice) the moment the user lands back here.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const message = consumeSettingsSaved();
    if (!message) return;
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const readToggle = (id: string) =>
    id === "natureSounds" ? natureSoundsOn : !!toggles[id];

  const toggle = (id: string) => {
    if (id === "natureSounds") {
      setNatureSoundsOn(!natureSoundsOn);
      return;
    }
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <PhoneFrame>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgImage})`,
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
        {toast && (
          <ToastViewport>
            <Toast
              surface="light"
              variant="success"
              message={toast}
              onDismiss={() => setToast(null)}
              className="yuna-fade-in"
            />
          </ToastViewport>
        )}

        <header className="flex items-center justify-between px-6 pt-14 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              surface="light"
              variant="secondary"
              size="icon"
              onClick={() => navigate({ to: "/home" })}
              aria-label="Back"
            >
              <ChevronLeft strokeWidth={1.5} />
            </Button>
            <h1 className="font-display text-2xl leading-8 tracking-tight text-foreground">
              Settings
            </h1>
          </div>
          <Button surface="light" variant="secondary" size="xs">
            Share Yuna
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-10 flex flex-col gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CardGroup>
            {GROUP_ONE.map((row, i) => (
              <SettingsRowItem
                key={row.id}
                row={row}
                isLast={i === GROUP_ONE.length - 1}
                toggleOn={row.kind === "toggle" ? readToggle(row.id) : undefined}
                onToggle={() => toggle(row.id)}
                onNavigate={(to) => navigate({ to })}
              />
            ))}
          </CardGroup>

          <CardGroup>
            {GROUP_TWO.map((row, i) => (
              <SettingsRowItem
                key={row.id}
                row={row}
                isLast={i === GROUP_TWO.length - 1}
                toggleOn={row.kind === "toggle" ? readToggle(row.id) : undefined}
                onToggle={() => toggle(row.id)}
                onNavigate={(to) => navigate({ to })}
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
    <div className="shrink-0 rounded-2xl overflow-hidden hairline bg-background/40 backdrop-blur-md flex flex-col">
      {children}
    </div>
  );
}

function SettingsRowItem({
  row,
  isLast,
  toggleOn,
  onToggle,
  onNavigate,
}: {
  row: Row;
  isLast: boolean;
  toggleOn?: boolean;
  onToggle: () => void;
  onNavigate: (to: string) => void;
}) {
  const Icon = row.Icon;
  const borderClass = isLast ? "" : "border-b border-border";
  const baseClass = `flex items-center justify-between gap-3 p-4 shrink-0 ${borderClass}`;

  if (row.kind === "toggle") {
    return (
      <div className={baseClass}>
        <div className="flex items-center gap-4">
          <Icon size={18} strokeWidth={1.5} className="text-foreground" aria-hidden />
          <span className="text-base leading-6 font-medium text-foreground">{row.label}</span>
        </div>
        <Switch checked={!!toggleOn} onChange={onToggle} label={row.label} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => row.to && onNavigate(row.to)}
      className={`${baseClass} active:bg-foreground/[0.05] transition-colors`}
    >
      <div className="flex items-center gap-4">
        <Icon size={18} strokeWidth={1.5} className="text-foreground" aria-hidden />
        <span className="text-base leading-6 font-medium text-foreground">{row.label}</span>
      </div>
      <ChevronRight size={16} strokeWidth={2} className="text-foreground/55" aria-hidden />
    </button>
  );
}
