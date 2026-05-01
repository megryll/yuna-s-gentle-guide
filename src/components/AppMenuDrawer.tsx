import { useEffect, type ReactNode } from "react";
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
        className={
          "absolute inset-y-0 left-0 w-[88%] max-w-[340px] bg-background border-r border-border flex flex-col transition-transform duration-300 ease-out " +
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Therapist Match hero */}
          <div className="rounded-2xl hairline bg-muted/40 p-4 flex items-center gap-3">
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
              <div className="rounded-2xl hairline overflow-hidden bg-background">
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground shrink-0">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 7l8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function CardArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 16l2-2-2-2M16 14H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChatBubbleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="0.8" fill="currentColor" />
      <path d="M12 13.5v0.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 12a8 8 0 0 1 13.7-5.7L20 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4v5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12a8 8 0 0 1-13.7 5.7L4 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20v-5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function QuestionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12.5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8l-4 4 4 4M6 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
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
