import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { TextArea } from "@/components/TextArea";
import { Surface } from "@/components/Surface";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  HeroKeepsakeCard,
  EmotionDonut,
  HighlightsSection,
  type EmotionDatum,
} from "@/components/SessionReflection";
import { cn } from "@/lib/utils";
import {
  deleteSession,
  renameSession,
  useSessions,
  useSessionEmotionColors,
  type PastSession,
} from "@/lib/sessions";
import { requestSessionToast } from "@/lib/session-toast";
import { useYunaIdentity } from "@/lib/yuna-session";
import { useAppMode } from "@/lib/theme-prefs";

export const Route = createFileRoute("/sessions_/$id")({
  head: () => ({ meta: [{ title: "Session — Yuna" }] }),
  component: SessionDetailRoute,
});

// Keepsake line when a past session has no saved note of its own.
const HERO_FALLBACK = "A moment worth keeping, you showed up for yourself.";

// Aggregate the session's per-highlight emotion tags into donut segments. Equal
// weight per mention; hues come from the shared session emotion palette.
function deriveEmotions(
  session: PastSession,
  colors: Record<string, string>,
): EmotionDatum[] {
  const counts = new Map<string, number>();
  for (const h of session.highlights)
    for (const name of h.emotions) counts.set(name, (counts.get(name) ?? 0) + 1);

  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return [...counts.entries()].map(([name, n]) => ({
    name,
    value: Math.round((n / total) * 100),
    color: colors[name] ?? "var(--blue)",
  }));
}

function SessionDetailRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { avatar } = useYunaIdentity();
  // Themed screen: follows the Light/Dark toggle, so its controls must flip
  // surface with it (the photo + .theme-light invert automatically).
  const surface = useAppMode();
  const emotionColors = useSessionEmotionColors();
  // Subscribe so a rename reflects live and a delete drops us out cleanly.
  const sessions = useSessions();
  const session = sessions.find((s) => s.id === id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  // The session was deleted (or the id is unknown) — fall back to the list.
  useEffect(() => {
    if (!session) navigate({ to: "/sessions" });
  }, [session, navigate]);
  if (!session) return null;

  const emotions = deriveEmotions(session, emotionColors);

  const onContinue = () =>
    navigate({ to: "/chat", search: { q: "", mode: "text", revisit: "1" } });

  const onDelete = () => {
    setMenuOpen(false);
    deleteSession(session.id);
    requestSessionToast("Conversation deleted.");
    navigate({ to: "/sessions" });
  };

  return (
    <PhoneFrame backgroundImage="/background.png" themed>
      <div className="flex-1 flex flex-col px-8 text-white min-h-0">
        <div className="flex-1 flex flex-col gap-16 overflow-y-auto overflow-x-hidden -mx-2 px-2 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Top cluster — header bar, title, and the Continue action stay tight;
              the wider section gap kicks in from the keepsake onward. pt-14 lives
              on this first scroll child (like a back-arrow header) so it doesn't
              eat viewport per the photo-bg-scrolling padding rule. */}
          <div className="flex flex-col gap-6 pt-14">
            {/* ── Header: back arrow, date·length eyebrow, options menu ────── */}
            <PageHeader
              surface={surface}
              className="px-0 pt-0 pb-0"
              onBack={() => navigate({ to: "/sessions" })}
              center={
                <p className="text-uppercase tracking-[0.32em] uppercase text-white/75">
                  {session.date} · {session.length}
                </p>
              }
              trailing={
                <Button
                  surface={surface}
                  variant="secondary"
                  size="icon"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Conversation options"
                >
                  <MoreHorizontal strokeWidth={1.8} aria-hidden />
                </Button>
              }
            />

            {/* ── Title + Continue ────────────────────────────────────────── */}
            <h1 className="mt-4 font-display text-3xl leading-tight tracking-tight text-white text-center">
              {session.title}
            </h1>
            <Button surface={surface} variant="primary" fullWidth onClick={onContinue}>
              Continue session
            </Button>
          </div>

          {/* ── Hero keepsake card ────────────────────────────────────────── */}
          <HeroKeepsakeCard
            message={session.note ?? HERO_FALLBACK}
            avatar={avatar}
            onShare={() => undefined}
          />

          {/* ── Emotions ──────────────────────────────────────────────────── */}
          {emotions.length > 0 && (
            <section className="flex flex-col gap-6 yuna-rise">
              <h2 className="font-display text-xl leading-tight text-white text-center">
                Your emotions
              </h2>
              <div className="flex justify-center">
                <EmotionDonut data={emotions} />
              </div>
              <ul className="flex flex-col gap-2">
                {emotions.map((e) => (
                  <li key={e.name}>
                    <Surface radius="xl" className="flex items-center gap-3 px-4 py-3.5">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: e.color }}
                      />
                      <span className="flex-1 text-base text-white/90">{e.name}</span>
                      <span className="text-sm font-medium tracking-[0.02em] text-white/75">
                        {e.value}%
                      </span>
                    </Surface>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Change-talk highlights ────────────────────────────────────── */}
          {session.highlights.length > 0 && (
            <HighlightsSection quotes={session.highlights.map((h) => h.quote)} />
          )}
        </div>
      </div>

      {/* ── Options action sheet: Rename / Delete ─────────────────────────── */}
      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerContent>
          <div className="px-4 pb-8 pt-3 flex flex-col gap-4">
            <DrawerTitle className="sr-only">Conversation options</DrawerTitle>
            <MenuGroup>
              <MenuRow
                icon={<Pencil size={20} strokeWidth={1.75} />}
                label="Rename conversation"
                onClick={() => {
                  setMenuOpen(false);
                  setRenameOpen(true);
                }}
              />
              <MenuRow
                icon={<Trash2 size={20} strokeWidth={1.75} />}
                label="Delete conversation"
                tone="danger"
                onClick={onDelete}
                last
              />
            </MenuGroup>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Rename drawer ─────────────────────────────────────────────────── */}
      <RenameDrawer
        open={renameOpen}
        onOpenChange={setRenameOpen}
        initial={session.title}
        onSave={(title) => {
          renameSession(session.id, title);
          setRenameOpen(false);
        }}
      />
    </PhoneFrame>
  );
}

// Grouped action rows for the options sheet — mirrors the Home card menu
// (CardActionsDrawer): a frosted group of full-width rows the overlay shims
// remap for light/dark.
function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden hairline bg-background/40 backdrop-blur-md flex flex-col">
      {children}
    </div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  tone = "default",
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  last?: boolean;
}) {
  // Destructive rows take the warm alert tone (never red, per the DS).
  const ink = tone === "danger" ? "text-alert-orange" : "text-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 text-left active:bg-foreground/[0.06] transition-colors",
        !last && "border-b border-border",
      )}
    >
      <span aria-hidden className={cn("shrink-0", ink)}>
        {icon}
      </span>
      <span className={cn("text-base leading-6 font-medium", ink)}>{label}</span>
    </button>
  );
}

// Rename sheet — the conversation title shown big and editable, echoing the
// drawer-title scale. One-off title input (no DS field fits a large editable
// heading yet); flagged for a possible future TextField display size.
function RenameDrawer({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: string;
  onSave: (title: string) => void;
}) {
  const [value, setValue] = useState(initial);
  // Drawer paints the mode photo as its background, so its controls follow it.
  const surface = useAppMode();

  // Reset to the current title each time the sheet opens.
  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85%]">
        <div className="px-6 pt-3">
          <DrawerTitle className="sr-only">Rename conversation</DrawerTitle>
          <label className="text-uppercase font-semibold tracking-[0.12em] uppercase text-white/75">
            Conversation name
          </label>
          <TextArea
            surface={surface}
            variant="display"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Conversation name"
            className="mt-3"
          />
        </div>
        <DrawerFooter className="px-6 pb-8 gap-2">
          <Button
            surface={surface}
            variant="primary"
            fullWidth
            disabled={!value.trim()}
            onClick={() => onSave(value)}
          >
            Save
          </Button>
          <Button surface={surface} variant="plain" fullWidth onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
