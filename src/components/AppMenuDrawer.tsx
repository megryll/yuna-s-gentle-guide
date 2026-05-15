import { useEffect, type ReactNode } from "react";
import {
  ChevronRight as ChevronRightLucide,
  CircleCheck,
  CircleHelp,
  CreditCard,
  FileText,
  Lock,
  LogOut,
  Mail,
  MessageSquareWarning,
  Receipt,
  RefreshCw,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/Button";

type Row = {
  label: string;
  icon: ReactNode;
  value?: string;
  chevron?: boolean;
  onClick?: () => void;
};

type Section = { title: string; rows: Row[] };

const SECTIONS: Section[] = [
  {
    title: "Account",
    rows: [
      { label: "Nickname", icon: <PersonIcon />, value: "Megan", chevron: true },
      { label: "Email", icon: <MailIcon />, value: "megan@yuna.io" },
      { label: "Current Plan", icon: <CardIcon />, value: "Paid Plan" },
      { label: "Manage Subscription", icon: <CardArrowIcon />, chevron: true },
      { label: "Report Issue", icon: <ChatBubbleIcon />, chevron: true },
      { label: "Restore Purchases", icon: <RefreshIcon />, chevron: true },
    ],
  },
  {
    title: "About",
    rows: [
      { label: "Privacy Policy", icon: <LockIcon />, chevron: true },
      { label: "Terms of Service", icon: <DocIcon />, chevron: true },
      { label: "Send Feedback", icon: <QuestionIcon />, chevron: true },
      { label: "Version", icon: <CheckCircleIcon />, value: "7.6.0" },
    ],
  },
];

export function AppMenuDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <div
      className={
        "absolute inset-0 z-40 " +
        (open ? "pointer-events-auto" : "pointer-events-none")
      }
      aria-hidden={!open}
    >
      <div
        onClick={() => onOpenChange(false)}
        className={
          "absolute inset-0 bg-foreground/30 transition-opacity duration-300 " +
          (open ? "opacity-100" : "opacity-0")
        }
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Account settings"
        style={{
          backgroundImage: "url(/light-blur-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className={
          "absolute inset-y-0 left-0 w-[88%] max-w-[340px] text-popover-foreground border-r border-border flex flex-col transition-transform duration-300 ease-out " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between px-5 pt-12 pb-3 shrink-0">
          <h2 className="font-serif text-xl tracking-tight">Account</h2>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Therapist Match hero */}
          <div className="rounded-2xl hairline bg-background/70 backdrop-blur-sm p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm leading-snug">Therapist Match</p>
              <p className="font-sans-ui text-[11px] text-muted-foreground mt-0.5">
                Find a real therapist who fits you
              </p>
              <Button
                surface="light"
                variant="primary"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="mt-3"
              >
                Get matched
              </Button>
            </div>
            <div className="h-16 w-16 rounded-2xl hairline flex items-center justify-center shrink-0">
              <TherapistMatchIcon />
            </div>
          </div>

          {/* Sections */}
          {SECTIONS.map((s) => (
            <div key={s.title} className="mt-6">
              <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2 px-1">
                {s.title}
              </p>
              <div className="rounded-2xl hairline overflow-hidden bg-background/70 backdrop-blur-sm">
                {s.rows.map((r, i) => (
                  <button
                    key={r.label}
                    onClick={() => { r.onClick?.(); onOpenChange(false); }}
                    className={
                      "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors " +
                      (i > 0 ? "border-t border-border" : "")
                    }
                  >
                    <span className="h-8 w-8 flex items-center justify-center text-foreground shrink-0">
                      {r.icon}
                    </span>
                    <span className="flex-1 text-sm">{r.label}</span>
                    {r.value && (
                      <span className="font-sans-ui text-xs text-muted-foreground">
                        {r.value}
                      </span>
                    )}
                    {r.chevron && <ChevronRight />}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom actions */}
          <div className="mt-8 rounded-2xl hairline overflow-hidden bg-background">
            <button
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
            >
              <span className="h-8 w-8 flex items-center justify-center text-foreground shrink-0">
                <LogoutIcon />
              </span>
              <span className="flex-1 text-sm">Log out</span>
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
            >
              <span className="h-8 w-8 flex items-center justify-center shrink-0">
                <TrashIcon />
              </span>
              <span className="flex-1 text-sm">Delete Account</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ChevronRight() {
  return (
    <ChevronRightLucide
      size={14}
      strokeWidth={1.5}
      className="text-muted-foreground shrink-0"
    />
  );
}

function PersonIcon() {
  return <User size={18} strokeWidth={1.5} />;
}
function MailIcon() {
  return <Mail size={18} strokeWidth={1.5} />;
}
function CardIcon() {
  return <CreditCard size={18} strokeWidth={1.5} />;
}
function CardArrowIcon() {
  return <Receipt size={18} strokeWidth={1.5} />;
}
function ChatBubbleIcon() {
  return <MessageSquareWarning size={18} strokeWidth={1.5} />;
}
function RefreshIcon() {
  return <RefreshCw size={18} strokeWidth={1.5} />;
}
function LockIcon() {
  return <Lock size={18} strokeWidth={1.5} />;
}
function DocIcon() {
  return <FileText size={18} strokeWidth={1.5} />;
}
function QuestionIcon() {
  return <CircleHelp size={18} strokeWidth={1.5} />;
}
function CheckCircleIcon() {
  return <CircleCheck size={18} strokeWidth={1.5} />;
}
function LogoutIcon() {
  return <LogOut size={18} strokeWidth={1.5} />;
}
function TrashIcon() {
  return <Trash2 size={18} strokeWidth={1.5} />;
}
function TherapistMatchIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="14" cy="15" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6 28c1-3.5 3.8-5.5 8-5.5s7 2 8 5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="25.5" cy="11" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M28.5 14l3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
