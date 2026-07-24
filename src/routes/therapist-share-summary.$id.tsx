import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Pencil, Share, X } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Divider } from "@/components/Divider";
import { TextArea } from "@/components/TextArea";
import { Toast, ToastViewport } from "@/components/Toast";
import { NativeShareSheet } from "@/components/NativeShareSheet";
import { KEYBOARD_HEIGHT } from "@/components/KeyboardSimulator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useAppMode } from "@/lib/theme-prefs";
import { useTransientToast } from "@/lib/use-transient-toast";
import {
  getAppointment,
  setSummaryBody,
  toggleSummarySection,
  updateAppointment,
  useSummaryEdits,
} from "@/lib/therapist-prefs";
import {
  getTherapist,
  matchedTherapists,
  SHARE_SUMMARY_DOC,
  SHARE_SUMMARY_SECTIONS,
  type ShareSummarySection,
} from "@/lib/therapist-data";

// ─── Share a summary ─────────────────────────────────────────────────────────
// An in-app preview of the generated conversation-summary document, with one
// fixed action: Share, which raises the simulated OS share sheet. Picking any
// destination marks the appointment's summary as shared.
//
// Editing is deliberately shallow. "Edit" turns on two controls per section —
// reword (opens a sheet) and leave out (instantly undoable) — and nothing
// else: the client owns their own narrative and what gets sent, but the
// title, the header, the screener numbers, and the disclaimer are the
// document's, not theirs to rewrite.

export const Route = createFileRoute("/therapist-share-summary/$id")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    // The appointment this share belongs to, so its `summaryShared` flag flips.
    appt?: string;
  } => ({
    appt: (s.appt as string | undefined) || undefined,
  }),
  head: () => ({ meta: [{ title: "Share a Summary — Yuna" }] }),
  component: ShareSummaryRoute,
});

function ShareSummaryRoute() {
  const { id } = Route.useParams();
  const { appt } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const surface = useAppMode() === "light" ? "light" : "dark";

  const therapist = getTherapist(id) ?? matchedTherapists()[0];
  const edits = useSummaryEdits();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  // The section whose narrative is open in the reword sheet.
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  // The simulated keyboard covers the bottom 260px, so the sheet grows by that
  // much for as long as it's open — latched, so Save never shifts under a
  // finger when the textarea blurs.
  const [kbOpen, setKbOpen] = useState(false);
  const { message: toast, show: flashToast, dismiss } = useTransientToast();

  // Generated client-side: a server-rendered date would mismatch on hydration.
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    );
  }, []);

  const kept = SHARE_SUMMARY_SECTIONS.filter((s) => !edits.removed.includes(s.id));
  const left = SHARE_SUMMARY_SECTIONS.filter((s) => edits.removed.includes(s.id));

  const bodyFor = (s: ShareSummarySection) => edits.bodies[s.id] ?? s.body ?? "";
  const editSection = SHARE_SUMMARY_SECTIONS.find((s) => s.id === editId) ?? null;

  const openEditor = (s: ShareSummarySection) => {
    setDraft(bodyFor(s));
    setEditId(s.id);
    setKbOpen(true);
  };

  const closeEditor = () => {
    setEditId(null);
    setKbOpen(false);
  };

  const back = () =>
    router.history.canGoBack() ? router.history.back() : navigate({ to: "/therapist-hub" });

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
        <PageHeader
          surface={surface}
          onBack={back}
          center={<span className="text-sm font-semibold text-white">Summary Preview</span>}
          trailing={
            // A real toggle, not a text link: outlined at rest, and `pressed`
            // flips it to the filled primary look while editing.
            <Button
              surface={surface}
              variant="secondary"
              size="sm"
              pressed={editing}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Done" : "Edit"}
            </Button>
          }
        />

        {/* Mode banner: stays put above the document rather than scrolling with
            it, so the screen never stops saying it's in an editing state. */}
        {editing && (
          <div className="shrink-0 px-4 pb-2">
            <Toast
              surface={surface}
              variant="neutral"
              title="Editing"
              message="Reword or remove any section."
              className="yuna-fade-in"
            />
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-2 pb-6 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* The document as paper: authored in ink-on-off-white so it reads the
              same in either app mode. It's an artifact, not a screen. */}
          <article className="rounded-2xl bg-background px-6 py-8 shadow-lg">
            <div className="flex items-baseline justify-between gap-3 border-b border-foreground/15 pb-5">
              <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                Yuna
              </span>
              <span className="text-uppercase font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Conversation summary
              </span>
            </div>

            <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight text-foreground">
              {SHARE_SUMMARY_DOC.title}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-foreground/75">
              Prepared for <span className="font-semibold text-foreground">{therapist.name}</span>,{" "}
              {therapist.credentials}
              {today && (
                <>
                  <br />
                  Generated on {today} · Shared with your consent
                </>
              )}
            </p>

            {kept.map((s) => (
              <section key={s.id} className="mt-9">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-uppercase font-bold uppercase tracking-[0.14em] text-primary-green pt-1">
                      {s.title}
                    </h2>
                    {editing && (
                      <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
                        {s.body && (
                          <Button
                            surface="light"
                            variant="plain"
                            size="icon-sm"
                            aria-label={`Reword ${s.title}`}
                            onClick={() => openEditor(s)}
                          >
                            <Pencil strokeWidth={1.75} />
                          </Button>
                        )}
                        <Button
                          surface="light"
                          variant="plain"
                          size="icon-sm"
                          aria-label={`Leave out ${s.title}`}
                          onClick={() => toggleSummarySection(s.id)}
                        >
                          <X strokeWidth={1.75} />
                        </Button>
                      </div>
                    )}
                  </div>

                  {s.intro && (
                    <p className="mt-2.5 text-sm leading-relaxed text-foreground/75">{s.intro}</p>
                  )}
                  {s.body && (
                    <p className="mt-2.5 text-sm leading-relaxed text-foreground/75">{bodyFor(s)}</p>
                  )}
                  {s.trends && (
                    <div className="mt-3.5 flex flex-col gap-3">
                      {s.trends.map((t) => (
                        <div
                          key={t.label}
                          className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3"
                        >
                          <span className="text-xs font-semibold text-foreground">{t.label}</span>
                          <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                            <div
                              className="h-full rounded-full bg-primary-green/80"
                              style={{ width: `${t.fill}%` }}
                            />
                          </div>
                          <span className="text-xs text-foreground/75">{t.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {s.bullets && (
                    <ul className="mt-2.5 list-disc pl-5">
                      {s.bullets.map((b) => (
                        <li key={b} className="mt-1 text-sm leading-relaxed text-foreground/75">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
              </section>
            ))}

            <p className="mt-10 border-t border-foreground/15 pt-5 text-xs leading-relaxed text-foreground/60">
              {SHARE_SUMMARY_DOC.disclaimer}
            </p>
          </article>

          {/* Left-out sections live outside the paper, on the photo: anything
              inside the white page is what the therapist receives. */}
          {editing && left.length > 0 && (
            <div className="mt-5 px-2">
              <Divider surface={surface} label="Left out" />
              <div className="mt-3 flex flex-col gap-2">
                {left.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-white/40 px-4 py-3"
                  >
                    <span className="text-sm text-white/85">{s.title}</span>
                    <Button
                      surface={surface}
                      variant="link"
                      onClick={() => toggleSummarySection(s.id)}
                    >
                      Add back
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="shrink-0 px-6 pb-10 pt-4">
          <Button surface={surface} variant="primary" fullWidth onClick={() => setSheetOpen(true)}>
            <Share size={16} strokeWidth={2} aria-hidden />
            Share
          </Button>
        </footer>
      </div>

      {toast && (
        <ToastViewport>
          <Toast
            surface={surface}
            variant="success"
            message={toast}
            onDismiss={dismiss}
            className="yuna-fade-in"
          />
        </ToastViewport>
      )}

      {/* Reword a section — a sheet, not an inline caret: the document scrolls
          and the keyboard eats the bottom third, so editing in place on a phone
          is a fight. */}
      <Drawer open={!!editSection} onOpenChange={(v) => !v && closeEditor()}>
        <DrawerContent style={kbOpen ? { paddingBottom: KEYBOARD_HEIGHT } : undefined}>
          <DrawerHeader className="px-6 pt-3 pb-2 text-left">
            <DrawerTitle>In your words</DrawerTitle>
            <DrawerDescription className="mt-1">
              This is Yuna's draft of “{editSection?.title.toLowerCase()}”. Change anything that
              doesn't sound right.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-6">
            <TextArea
              surface={surface}
              rows={6}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label={editSection?.title}
            />
          </div>
          <DrawerFooter className="px-6 pb-8 gap-2">
            <Button
              surface={surface}
              variant="primary"
              fullWidth
              onClick={() => {
                if (editId) setSummaryBody(editId, draft);
                closeEditor();
              }}
            >
              Save
            </Button>
            <Button surface={surface} variant="link" className="mx-auto" onClick={closeEditor}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <NativeShareSheet
        open={sheetOpen}
        fileName="Conversation summary.pdf"
        fileMeta={`PDF document · For ${therapist.name}`}
        onDismiss={() => setSheetOpen(false)}
        onShare={(destination) => {
          setSheetOpen(false);
          if (getAppointment(appt)) updateAppointment(appt!, { summaryShared: true });
          flashToast(`Shared via ${destination}.`);
        }}
      />
    </PhoneFrame>
  );
}
