import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import {
  ChevronRight,
  Download,
  ExternalLink,
  FileAudio,
  FileDown,
  FileImage,
  MousePointerClick,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { getEngineerNotes, type Gotcha } from "@/lib/engineer-notes";
import {
  completeNextAppointment,
  latestCompleted,
  reopenLastAppointment,
  sortedUpcoming,
  updateAppointment,
  useAppointments,
} from "@/lib/therapist-prefs";
import { clearSeededHistory, seedTherapistHistory } from "@/lib/therapist-demo";
import { addUserNote, editNote, exportOverlay, removeNote, useResolvedNotes, type ResolvedNote } from "@/lib/notes-prefs";
import { cn } from "@/lib/utils";
import type { YunaState } from "@/components/YunaStatus";
import type { CardKind } from "@/lib/home-cards";
import {
  GUIDED_SAMPLE_TITLE,
  setSessionEscalation,
  setSessionGuided,
  setSessionGuidedComplete,
  setSessionIllinois,
  setSessionReco,
  setSessionScheduleSession,
  setSessionStatus,
  setSessionSuicidality,
  setSessionUpcomingAppointment,
  setWrapUpVariant,
  triggerBookingCelebration,
  useWrapUpVariant,
  WRAPUP_VARIANTS,
  useSessionEscalation,
  useSessionGuided,
  useSessionGuidedComplete,
  useSessionIllinois,
  useSessionScheduleSession,
  useSessionUpcomingAppointment,
  useSessionReco,
  useSessionStatus,
  useSessionSuicidality,
} from "@/lib/session-dev";

// Right-hand admin panel for engineers: a link to the animation reference, asset
// downloads, an editable per-screen Notes list, and a live className inspector.
// Desktop-only (lg+), collapsible to a thin edge tab. Lives outside the phone
// frame so it never affects the simulated screen.

// Leading icon for an asset row, picked off its file extension so the kind
// (audio vs image) reads at a glance. Falls back to a generic file icon.
const AUDIO_EXTS = ["m4a", "mp3", "wav", "aac", "ogg"];
const IMAGE_EXTS = ["png", "svg", "jpg", "jpeg", "gif", "webp"];
function assetKindIcon(href: string) {
  const ext = href.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (AUDIO_EXTS.includes(ext)) return FileAudio;
  if (IMAGE_EXTS.includes(ext)) return FileImage;
  return Download;
}

export function EngineerSidebar() {
  const location = useLocation();
  const path = location.pathname;
  const notes = getEngineerNotes(path);
  // Collapse by default on Design System pages — the panel is for prototype
  // screens. Re-syncs on navigation but a manual toggle still wins per page.
  const isDsPage = path.startsWith("/ds");
  const [open, setOpen] = useState(!isDsPage);
  useEffect(() => {
    setOpen(!isDsPage);
  }, [isDsPage]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open implementation panel"
        className="hidden lg:flex fixed right-0 top-24 z-50 items-center gap-1 rounded-l-md border border-r-0 border-border bg-background/80 backdrop-blur-sm px-2 py-2 text-[9px] tracking-[0.3em] uppercase text-muted-foreground active:text-foreground [writing-mode:vertical-rl]"
      >
        Implementation
      </button>
    );
  }

  return (
    <aside
      className="hidden lg:flex fixed right-0 top-0 h-screen w-72 flex-col px-4 py-6 border-l border-border bg-background/60 backdrop-blur-sm z-50 overflow-y-auto"
      aria-label="Implementation notes"
    >
      <div className="flex items-center justify-between mb-5 px-2">
        <span className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground">
          Implementation
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Collapse implementation panel"
          className="text-muted-foreground active:text-foreground"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      <ClassInspector />

      <div className="mb-5 px-2">
        <a
          href={`/animation-specs?screen=${encodeURIComponent(path)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-[12px] text-foreground active:bg-muted"
        >
          <span className="flex items-center gap-2">
            <Play size={13} strokeWidth={2} className="text-muted-foreground" />
            Animation specs
          </span>
          <ExternalLink size={13} strokeWidth={2} className="text-muted-foreground" />
        </a>
      </div>

      {notes.assets.length > 0 && (
        <Section title="Asset downloads" count={notes.assets.length}>
          <ul className="flex flex-col gap-1.5">
            {notes.assets.map((asset) => {
              const KindIcon = assetKindIcon(asset.href);
              return (
                <li key={asset.label}>
                  <a
                    href={asset.href}
                    download
                    className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 text-[12px] text-foreground active:bg-muted"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <KindIcon size={13} strokeWidth={2} className="shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate leading-tight">{asset.label}</span>
                    </span>
                    <Download size={13} strokeWidth={2} className="shrink-0 text-muted-foreground" />
                  </a>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <NotesSection path={path} codeNotes={notes.gotchas} />

      {/* Screen-scoped dev states: drive a screen into a given state for review.
          Last in the panel, and only where each state actually lives. */}
      {path === "/chat" && <YunaStatesSection />}
      {path === "/home" && <HomeStatesSection />}
      {(path === "/therapist-hub" || path === "/tools") && <TherapistStatesSection />}
      {path === "/wrap-up" && <WrapUpStatesSection />}
    </aside>
  );
}

// ─── Notes (code seeds render live; engineer's edits overlay on top) ──────────

function NotesSection({ path, codeNotes }: { path: string; codeNotes: Gotcha[] }) {
  const notes = useResolvedNotes(path, codeNotes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setDraft(text);
  };

  const close = () => {
    setEditingId(null);
    setDraft("");
  };

  const save = (note: ResolvedNote) => {
    editNote(path, note.id, draft, note.isUser); // empty draft removes/hides it
    close();
  };

  const cancel = (note: ResolvedNote) => {
    // Discard a freshly-added user note left blank; never delete a code note.
    if (note.isUser && !note.text.trim()) removeNote(path, note.id, true);
    close();
  };

  const add = () => {
    const id = addUserNote(path);
    startEdit(id, "");
  };

  // Dump this browser's overlay (added notes, edits, deletes — keyed by route
  // and note id) to a JSON file. Hand it to Claude to fold into the
  // engineer-notes.ts seeds, the durable shared-in-production source.
  const exportAll = () => {
    const data = exportOverlay();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "yuna-implementation-notes.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Section
      title="Notes"
      count={notes.length}
      action={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportAll}
            aria-label="Export all notes as JSON (for the code seeds)"
            title="Export all notes for code"
            className="text-muted-foreground active:text-foreground"
          >
            <FileDown size={13} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={add}
            aria-label="Add note"
            className="text-muted-foreground active:text-foreground"
          >
            <Plus size={13} strokeWidth={2} />
          </button>
        </div>
      }
    >
      {notes.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          No notes yet. Use + to add one.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => {
            const editing = editingId === note.id;
            return (
              <li key={note.id} className="group/note">
                {editing ? (
                  <div className="flex flex-col gap-1.5">
                    <textarea
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(note);
                        if (e.key === "Escape") cancel(note);
                      }}
                      rows={3}
                      placeholder="Write a note…"
                      className="w-full resize-y rounded-md border border-border bg-background px-2 py-1.5 text-[12px] leading-snug text-foreground outline-none focus-visible:border-foreground/40"
                    />
                    <div className="flex items-center gap-2 text-[10px] tracking-wide uppercase">
                      <button
                        type="button"
                        onClick={() => save(note)}
                        className="rounded bg-foreground px-2 py-1 text-background"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => cancel(note)}
                        className="px-2 py-1 text-muted-foreground active:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-[12px] leading-snug text-muted-foreground">
                    <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-foreground/40" />
                    <span className="min-w-0 flex-1 whitespace-pre-line">{note.text}</span>
                    <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/note:opacity-100">
                      <button
                        type="button"
                        onClick={() => startEdit(note.id, note.text)}
                        aria-label="Edit note"
                        className="text-muted-foreground active:text-foreground"
                      >
                        <Pencil size={12} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNote(path, note.id, note.isUser)}
                        aria-label="Delete note"
                        className="text-muted-foreground active:text-foreground"
                      >
                        <Trash2 size={12} strokeWidth={2} />
                      </button>
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// ─── className inspector ─────────────────────────────────────────────────────

const FRAME_SELECTOR = "[data-phone-frame]";

const CATEGORY_ORDER = [
  "Layout",
  "Spacing",
  "Sizing",
  "Position",
  "Typography",
  "Color",
  "Border",
  "Effects",
  "Other",
] as const;

// Group a Tailwind token by what it controls, reading the live class string —
// these are token names (px-6, bg-foreground), never resolved pixels. Variant
// prefixes (active:, md:, dark:) are stripped before classifying.
function classify(token: string): (typeof CATEGORY_ORDER)[number] {
  const base = token.includes(":") ? token.slice(token.lastIndexOf(":") + 1) : token;
  const b = base.replace(/^-/, "");
  if (b === "text-uppercase") return "Typography";
  if (/^(flex|grid|inline|block|hidden|table|contents|items-|justify-|content-|self-|place-|order-|gap-|flex-|grid-|col-|row-|basis-|shrink|grow|auto-)/.test(b)) return "Layout";
  if (/^(p[xytrbl]?-|m[xytrbl]?-|space-)/.test(b)) return "Spacing";
  if (/^(w-|h-|size-|min-|max-|aspect-)/.test(b)) return "Sizing";
  if (/^(absolute|relative|fixed|sticky|static|inset|top-|bottom-|left-|right-|z-)/.test(b)) return "Position";
  if (/^(font-|leading-|tracking-|uppercase|lowercase|capitalize|italic|underline|truncate|whitespace|break-|tabular|antialiased)/.test(b)) return "Typography";
  if (/^text-(xs|sm|base|lg|xl|\dxl|\[)/.test(b)) return "Typography";
  if (/^(bg-|text-|fill-|stroke-|from-|via-|to-|decoration-|placeholder-|caret-|accent-)/.test(b)) return "Color";
  if (/^(rounded|border|ring|outline|divide)/.test(b)) return "Border";
  if (/^(shadow|opacity|blur|backdrop|transition|duration|ease|delay|animate|transform|scale|rotate|translate|origin-|will-change|mix-blend|pointer-events|cursor-|select-)/.test(b)) return "Effects";
  return "Other";
}

function ClassInspector() {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<HTMLElement | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!active) {
      setHoverRect(null);
      return;
    }
    const inFrame = (el: EventTarget | null): el is HTMLElement => {
      const root = document.querySelector(FRAME_SELECTOR);
      return el instanceof HTMLElement && !!root && root.contains(el);
    };
    const onMove = (e: MouseEvent) => {
      if (inFrame(e.target)) setHoverRect((e.target as HTMLElement).getBoundingClientRect());
      else setHoverRect(null);
    };
    const onClick = (e: MouseEvent) => {
      if (!inFrame(e.target)) return;
      // Eat the click so the simulated screen doesn't navigate while picking.
      e.preventDefault();
      e.stopPropagation();
      setSelected(e.target as HTMLElement);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(false);
    };
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [active]);

  const classStr = selected?.getAttribute("class") ?? "";
  const tokens = classStr.split(/\s+/).filter(Boolean);
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    tokens: tokens.filter((t) => classify(t) === cat),
  })).filter((g) => g.tokens.length > 0);

  const selectParent = () => {
    const root = document.querySelector(FRAME_SELECTOR);
    const parent = selected?.parentElement;
    if (parent && root && root.contains(parent)) setSelected(parent);
  };

  const selectedRect = active && selected ? selected.getBoundingClientRect() : null;

  return (
    <div className="mb-5 px-2">
      <button
        type="button"
        onClick={() => setActive((v) => !v)}
        aria-pressed={active}
        className={
          "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-[12px] tracking-wide uppercase transition-colors " +
          (active
            ? "bg-foreground text-background"
            : "border border-border text-foreground active:bg-muted")
        }
      >
        <MousePointerClick size={14} strokeWidth={2} />
        {active ? "Picking… (Esc to stop)" : "Inspect element"}
      </button>

      {active && !selected && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Click any element in the frame to read its token classes.
        </p>
      )}

      {selected && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <code className="font-mono text-[11px] text-foreground">
              &lt;{selected.tagName.toLowerCase()}&gt;
            </code>
            <button
              type="button"
              onClick={selectParent}
              className="text-[10px] tracking-wide uppercase text-muted-foreground active:text-foreground"
            >
              ↑ parent
            </button>
          </div>

          {tokens.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              No utility classes on this element.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-2.5">
              {grouped.map((g) => (
                <div key={g.cat}>
                  <div className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/70 mb-1">
                    {g.cat}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {g.tokens.map((t) => (
                      <code
                        key={t}
                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-foreground"
                      >
                        {t}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Highlight overlays — fixed to the viewport, never intercept clicks. */}
      {hoverRect && <HighlightBox rect={hoverRect} kind="hover" />}
      {selectedRect && <HighlightBox rect={selectedRect} kind="selected" />}
    </div>
  );
}

function HighlightBox({ rect, kind }: { rect: DOMRect; kind: "hover" | "selected" }) {
  return (
    <div
      aria-hidden="true"
      className={
        "fixed z-[55] pointer-events-none rounded-[3px] " +
        (kind === "selected"
          ? "outline outline-2 outline-foreground bg-foreground/5"
          : "outline outline-1 outline-dashed outline-foreground/60")
      }
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
    />
  );
}

// ─── shared section ──────────────────────────────────────────────────────────

function Section({
  title,
  count,
  action,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center justify-between rounded-md px-2 py-1.5 text-[9px] tracking-[0.3em] uppercase text-muted-foreground active:text-foreground"
        >
          <span>
            {title}
            {count != null && <span className="text-muted-foreground/60"> · {count}</span>}
          </span>
          <ChevronRight
            size={12}
            strokeWidth={2}
            className={"shrink-0 transition-transform " + (open ? "rotate-90" : "")}
          />
        </button>
        {action && <div className="shrink-0 pr-1">{action}</div>}
      </div>
      {open && <div className="mt-2 px-2">{children}</div>}
    </div>
  );
}

// ─── Yuna states (session trigger) ───────────────────────────────────────────
// Pushes the live Session screen into a given state for review: a conversational
// status (drives the voice call), or a surfaced card recommendation (text +
// voice). One chip active at a time — picking one clears the rest; clicking the
// active chip hands the screen back to the live flow.

const STATUS_STATES: YunaState[] = [
  "listening",
  "thinking",
  "speaking",
  "reconnecting",
  "slow",
  "offline",
];

// Card kinds Yuna can surface as a mid-session suggestion, with the chip label.
const RECO_STATES: { kind: CardKind; label: string }[] = [
  { kind: "meditation", label: "Meditation Reco" },
  { kind: "self-discovery", label: "Questionnaire Reco" },
];

// Statuses that only exist in a voice session — disabled in text mode.
const VOICE_ONLY_STATES: YunaState[] = ["listening", "speaking"];

function YunaStatesSection() {
  const status = useSessionStatus();
  const reco = useSessionReco();
  const escalation = useSessionEscalation();
  const suicidality = useSessionSuicidality();
  const guided = useSessionGuided();
  const guidedComplete = useSessionGuidedComplete();
  const location = useLocation();
  const inVoice = (location.search as { mode?: string })?.mode === "voice";

  // Picking any chip clears the other transient states so one is active at a time.
  const clearOthers = () => {
    setSessionStatus(null);
    setSessionReco(null);
    setSessionEscalation(null);
    setSessionSuicidality(false);
  };

  return (
    <Section title="States" defaultOpen={true}>
      <div className="flex flex-wrap gap-1">
        {STATUS_STATES.map((s) => {
          const active = status === s;
          const disabled = !inVoice && VOICE_ONLY_STATES.includes(s);
          return (
            <Chip
              key={s}
              active={active}
              label={s}
              disabled={disabled}
              disabledReason="Only in voice mode"
              onClick={() => {
                clearOthers();
                if (!active) setSessionStatus(s);
              }}
            />
          );
        })}
        {RECO_STATES.map(({ kind, label }) => {
          const active = reco === kind;
          return (
            <Chip
              key={kind}
              active={active}
              label={label}
              onClick={() => {
                clearOthers();
                if (!active) setSessionReco(kind);
              }}
            />
          );
        })}
        <Chip
          active={!!escalation}
          label="Escalation"
          onClick={() => {
            const wasActive = !!escalation;
            clearOthers();
            if (!wasActive) setSessionEscalation("self-harm");
          }}
        />
        <Chip
          active={suicidality}
          label="Suicidality"
          onClick={() => {
            const wasActive = suicidality;
            clearOthers();
            if (!wasActive) setSessionSuicidality(true);
          }}
        />
        {/* Session type — independent of the transient status/reco chips above:
            a guided session can still be listening, thinking, etc. */}
        <Chip
          active={!!guided}
          label="Guided Session"
          onClick={() => setSessionGuided(guided ? null : GUIDED_SAMPLE_TITLE)}
        />
        {/* Completion is a sub-state of a guided session: it marks every step
            done and surfaces the conclusion card. Turning it on ensures a
            guided session is active so the header + tracker render. */}
        <Chip
          active={guidedComplete}
          label="Guided Complete"
          onClick={() => setSessionGuidedComplete(!guidedComplete)}
        />
      </div>
    </Section>
  );
}

// ─── Home states (screen trigger) ────────────────────────────────────────────
// Pushes the Home screen into a given state for review: the Illinois
// service-limitation takeover, the "Schedule a session" drawer, the
// "Upcoming appointment" prep card pinned to the top of the feed, and (shared
// with the therapist screens) completing a booked appointment, which pins the
// post-session follow-up card to the top of the feed.

function HomeStatesSection() {
  const illinois = useSessionIllinois();
  const scheduleSession = useSessionScheduleSession();
  const upcoming = useSessionUpcomingAppointment();
  return (
    <Section title="States" defaultOpen={true}>
      <div className="flex flex-wrap gap-1">
        <Chip
          active={illinois}
          label="Illinois Limitations"
          onClick={() => setSessionIllinois(!illinois)}
        />
        <Chip
          active={scheduleSession}
          label="Schedule a session"
          onClick={() => setSessionScheduleSession(!scheduleSession)}
        />
        <Chip
          active={upcoming}
          label="Upcoming appointment"
          onClick={() => setSessionUpcomingAppointment(!upcoming)}
        />
        <CompleteAppointmentChip />
      </div>
    </Section>
  );
}

// ─── Therapist states (screen trigger) ───────────────────────────────────────
// The prototype has no clock: "Complete next appointment" stands in for a
// booked session's time passing, flipping the hub, the Tools tile, and the
// Home follow-up card into their post-session (debrief) state.

function CompleteAppointmentChip() {
  const appointments = useAppointments();
  const on = !!latestCompleted(appointments);
  const hasUpcoming = sortedUpcoming(appointments).length > 0;
  return (
    <Chip
      active={on}
      label="Appointment followup"
      onClick={() => (on ? reopenLastAppointment() : completeNextAppointment())}
      disabled={!on && !hasUpcoming}
      disabledReason="No upcoming appointment to complete"
    />
  );
}

// Secures the next upcoming appointment and replays the hub's celebration —
// the same thing the card's "Confirm on booking platform" button does, minus
// the 2s handoff. Toggling back off returns the card to "Action Required".
function ConfirmAppointmentChip() {
  const appointments = useAppointments();
  const next = sortedUpcoming(appointments)[0];
  const on = !!next?.confirmed;
  return (
    <Chip
      active={on}
      label="Booking confirmed"
      onClick={() => {
        if (!next) return;
        updateAppointment(next.id, { confirmed: !on });
        if (!on) triggerBookingCelebration();
      }}
      disabled={!next}
      disabledReason="No upcoming appointment to confirm"
    />
  );
}

// Seeds a whole therapist journey (upcoming session, one waiting on its
// debrief, and the past record behind them) so the hub and the past-sessions
// list can be reviewed without booking and completing a chain by hand. Same
// seed the admin "Returning" toggle uses.
function DemoHistoryChip() {
  const appointments = useAppointments();
  const seeded = appointments.some((a) => a.id.startsWith("seed-appt-"));
  return (
    <Chip
      active={seeded}
      label="Demo history"
      onClick={() => (seeded ? clearSeededHistory() : seedTherapistHistory())}
    />
  );
}

function TherapistStatesSection() {
  return (
    <Section title="States" defaultOpen={true}>
      <div className="flex flex-wrap gap-1">
        <ConfirmAppointmentChip />
        <CompleteAppointmentChip />
        <DemoHistoryChip />
      </div>
    </Section>
  );
}

// ─── Wrap-up states (A/B variants) ───────────────────────────────────────────
// Swaps the wrap-up's reflection treatment for an A/B comparison. "Current" is
// the shipped screen; the rest hide the hero keepsake card and lead with the
// stress/mood question, varying only how the two answers are captured. Exactly
// one is active at a time, so the chips read as a radio group.

function WrapUpStatesSection() {
  const variant = useWrapUpVariant();
  return (
    <Section title="States" defaultOpen={true}>
      <div className="flex flex-wrap gap-1">
        {WRAPUP_VARIANTS.map((v) => (
          <Chip
            key={v.value}
            active={variant === v.value}
            label={v.label}
            onClick={() => setWrapUpVariant(v.value)}
          />
        ))}
      </div>
    </Section>
  );
}

function Chip({
  active,
  label,
  onClick,
  disabled = false,
  disabledReason,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [showTip, setShowTip] = useState(false);

  if (disabled) {
    return (
      <span className="relative inline-block">
        <button
          type="button"
          aria-disabled
          onClick={() => setShowTip((v) => !v)}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          className="cursor-not-allowed rounded-full border border-border px-2.5 py-1 text-[10.5px] capitalize text-muted-foreground/40"
        >
          {label}
        </button>
        {showTip && disabledReason && (
          <span className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] normal-case text-background shadow-md">
            {disabledReason}
          </span>
        )}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-2.5 py-1 text-[10.5px] capitalize transition-colors",
        active
          ? "bg-foreground text-background"
          : "border border-border text-muted-foreground active:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

