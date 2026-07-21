import { Copy, FileText, FolderDown, Mail, MessageCircle, Wifi, X } from "lucide-react";
import { usePlatform } from "@/lib/platform";

/**
 * Simulated native OS share sheet — the device's own share surface, not an app
 * component. Like KeyboardSimulator / NativeDatePicker, it's deliberately
 * hardcoded to the OS look (system font via `font-sans-ui`, platform colors
 * inline) and presented inside the phone frame: an iOS activity sheet or an
 * Android (Material) sharesheet, both sliding up from the bottom. Reserved for
 * this OS-chrome role only.
 *
 * Mounts when `open`. Picking any destination calls `onShare(destination)`;
 * the backdrop or close control calls `onDismiss`.
 */
export function NativeShareSheet({
  open,
  fileName,
  fileMeta,
  onDismiss,
  onShare,
}: {
  open: boolean;
  fileName: string;
  fileMeta: string;
  onDismiss: () => void;
  onShare: (destination: string) => void;
}) {
  const platform = usePlatform();
  if (!open) return null;
  const Sheet = platform === "android" ? AndroidSheet : IosSheet;
  return <Sheet fileName={fileName} fileMeta={fileMeta} onDismiss={onDismiss} onShare={onShare} />;
}

type SheetProps = {
  fileName: string;
  fileMeta: string;
  onDismiss: () => void;
  onShare: (destination: string) => void;
};

// ─── iOS — activity sheet ────────────────────────────────────────────────────

const IOS_TARGETS = [
  { label: "AirDrop", icon: Wifi, bg: "#FFFFFF", fg: "#007AFF" },
  { label: "Messages", icon: MessageCircle, bg: "#34C759", fg: "#FFFFFF" },
  { label: "Mail", icon: Mail, bg: "#007AFF", fg: "#FFFFFF" },
];

function IosSheet({ fileName, fileMeta, onDismiss, onShare }: SheetProps) {
  return (
    <div className="absolute inset-0 z-40 font-sans-ui" aria-modal role="dialog" aria-label="Share">
      <div className="absolute inset-0 bg-black/30 yuna-fade-in" onClick={onDismiss} aria-hidden />
      <div
        className="absolute inset-x-2 bottom-2 yuna-slide-up overflow-hidden"
        style={{ background: "#F2F2F7", borderRadius: 16 }}
      >
        {/* File header */}
        <div className="flex items-center gap-3 px-4" style={{ height: 64, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
          <span
            className="flex items-center justify-center shrink-0"
            style={{ height: 40, width: 40, borderRadius: 8, background: "#FFFFFF" }}
          >
            <FileText size={20} color="#E0383E" aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "#000" }}>{fileName}</p>
            <p className="truncate" style={{ fontSize: 13, color: "rgba(60,60,67,0.6)" }}>{fileMeta}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="flex items-center justify-center shrink-0"
            style={{ height: 30, width: 30, borderRadius: 15, background: "rgba(120,120,128,0.16)" }}
          >
            <X size={17} color="rgba(60,60,67,0.6)" aria-hidden />
          </button>
        </div>

        {/* Destination apps */}
        <div className="flex items-start gap-5 px-5" style={{ paddingTop: 14, paddingBottom: 14 }}>
          {IOS_TARGETS.map(({ label, icon: Icon, bg, fg }) => (
            <button key={label} type="button" onClick={() => onShare(label)} className="flex flex-col items-center gap-1.5">
              <span
                className="flex items-center justify-center"
                style={{ height: 56, width: 56, borderRadius: 28, background: bg, border: bg === "#FFFFFF" ? "1px solid rgba(0,0,0,0.08)" : "none" }}
              >
                <Icon size={26} color={fg} aria-hidden />
              </span>
              <span style={{ fontSize: 11, color: "#000" }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="mx-3 mb-3 overflow-hidden" style={{ borderRadius: 12, background: "#FFFFFF" }}>
          {[
            { label: "Copy", icon: Copy },
            { label: "Save to Files", icon: FolderDown },
          ].map(({ label, icon: Icon }, i) => (
            <button
              key={label}
              type="button"
              onClick={() => onShare(label)}
              className="w-full flex items-center justify-between px-4"
              style={{ height: 48, fontSize: 17, color: "#000", borderTop: i ? "1px solid rgba(0,0,0,0.1)" : "none" }}
            >
              {label}
              <Icon size={20} color="rgba(60,60,67,0.6)" aria-hidden />
            </button>
          ))}
        </div>
        <div style={{ height: 18 }} />
      </div>
    </div>
  );
}

// ─── Android — Material sharesheet ───────────────────────────────────────────

const ANDROID_TARGETS = [
  { label: "Nearby", icon: Wifi },
  { label: "Messages", icon: MessageCircle },
  { label: "Gmail", icon: Mail },
  { label: "Drive", icon: FolderDown },
];

function AndroidSheet({ fileName, fileMeta, onDismiss, onShare }: SheetProps) {
  return (
    <div className="absolute inset-0 z-40 font-sans-ui" aria-modal role="dialog" aria-label="Share">
      <div className="absolute inset-0 bg-black/40 yuna-fade-in" onClick={onDismiss} aria-hidden />
      <div
        className="absolute inset-x-0 bottom-0 yuna-slide-up"
        style={{ background: "#FFFFFF", borderRadius: "28px 28px 0 0", color: "#1C1B1F" }}
      >
        <div className="mx-auto" style={{ height: 4, width: 32, borderRadius: 2, background: "#C4C7C5", marginTop: 12 }} />
        <div className="px-6" style={{ paddingTop: 14 }}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>{fileName}</p>
          <p style={{ fontSize: 13, color: "#5F6368" }}>{fileMeta}</p>
        </div>
        <div className="flex items-start justify-between px-8" style={{ paddingTop: 18, paddingBottom: 26 }}>
          {ANDROID_TARGETS.map(({ label, icon: Icon }) => (
            <button key={label} type="button" onClick={() => onShare(label)} className="flex flex-col items-center gap-1.5">
              <span
                className="flex items-center justify-center"
                style={{ height: 52, width: 52, borderRadius: 26, background: "#E8F0E9" }}
              >
                <Icon size={24} color="#3C6844" aria-hidden />
              </span>
              <span style={{ fontSize: 12, color: "#1C1B1F" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
NativeShareSheet.displayName = "NativeShareSheet";
