import { useSyncExternalStore } from "react";

// ─── Therapist Recommendations — local prototype state ───────────────────────
// localStorage-backed so saved therapists and "preferences applied" persist
// across the prototype's screen-to-screen navigation. Mirrors the lightweight
// store pattern used by notes-prefs.ts / theme-prefs.ts. Filter selections in
// the drawer are ephemeral screen state, not persisted here.

/** Where an appointment sits in its life. The prototype has no clock, so
 *  `completed` is flipped by the EngineerSidebar "Appointment followup"
 *  control (the stand-in for the session time passing). Cancelling and
 *  rescheduling retire a row rather than deleting it, so the past-sessions
 *  list can show the whole record. */
export type AppointmentStatus = "booked" | "cancelled" | "rescheduled" | "completed";

/** One pass through the guided debrief. Revisiting a session appends another
 *  entry instead of overwriting, so the reflection reads as a thread. */
export type DebriefEntry = { atISO: string; question: string; answer: string };

/** A call with a therapist. `debriefed` / `summaryShared` track the
 *  post-booking follow-ups. */
export type Appointment = {
  id: string;
  therapistId: string;
  sessionTypeId: string;
  dateISO: string;
  time: string;
  status: AppointmentStatus;
  /** Secured on the therapist's booking platform. Requests start unconfirmed
   *  (the timeslot is held 24 hours); the hub's confirm action flips this. */
  confirmed?: boolean;
  debriefed?: boolean;
  summaryShared?: boolean;
  /** Retirement trail: where a rescheduled row moved to (and, on the new row,
   *  where it came from), and when a cancelled one was called off. */
  rescheduledToId?: string;
  rescheduledFromId?: string;
  cancelledAtISO?: string;
  /** What the user told Yuna after the session. */
  debrief?: DebriefEntry[];
};

/** The client's edits to the shareable summary: which sections they left out,
 *  and any narrative they reworded. Both are keyed by section id, so the
 *  document's own copy stays the default and edits layer on top. */
export type SummaryEdits = { removed: string[]; bodies: Record<string, string> };

type State = {
  savedIds: string[];
  preferencesApplied: boolean;
  appointments: Appointment[];
  summaryEdits: SummaryEdits;
};

const KEY = "yuna.therapistPrefs";
const NO_EDITS: SummaryEdits = { removed: [], bodies: {} };
const EMPTY: State = {
  savedIds: [],
  preferencesApplied: false,
  appointments: [],
  summaryEdits: NO_EDITS,
};

/** Rows written before the lifecycle existed carried only a `completed` flag. */
function normalizeAppointment(raw: Appointment & { completed?: boolean }): Appointment {
  const { completed, ...a } = raw;
  return { ...a, status: a.status ?? (completed ? "completed" : "booked") };
}

function read(): State {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      savedIds: Array.isArray(parsed.savedIds) ? parsed.savedIds : [],
      preferencesApplied: !!parsed.preferencesApplied,
      appointments: Array.isArray(parsed.appointments)
        ? parsed.appointments.map(normalizeAppointment)
        : [],
      summaryEdits: {
        removed: Array.isArray(parsed.summaryEdits?.removed) ? parsed.summaryEdits.removed : [],
        bodies:
          parsed.summaryEdits?.bodies && typeof parsed.summaryEdits.bodies === "object"
            ? parsed.summaryEdits.bodies
            : {},
      },
    };
  } catch {
    return EMPTY;
  }
}

let state: State = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function write(next: State) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / privacy-mode errors in the prototype */
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ─── Saved therapists ────────────────────────────────────────────────────────

export function toggleSaved(id: string) {
  const has = state.savedIds.includes(id);
  write({
    ...state,
    savedIds: has ? state.savedIds.filter((x) => x !== id) : [...state.savedIds, id],
  });
}

export function useSavedIds(): string[] {
  return useSyncExternalStore(subscribe, () => state.savedIds, () => state.savedIds);
}

export function useIsSaved(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.savedIds.includes(id),
    () => false,
  );
}

// ─── Appointments ────────────────────────────────────────────────────────────

export function addAppointment(a: Omit<Appointment, "id" | "status">): string {
  const id = `appt-${Math.random().toString(36).slice(2, 9)}`;
  write({ ...state, appointments: [...state.appointments, { ...a, id, status: "booked" }] });
  return id;
}

export function updateAppointment(id: string, patch: Partial<Omit<Appointment, "id">>) {
  write({
    ...state,
    appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  });
}

/** Called off, but kept: the past-sessions list shows cancellations too. */
export function cancelAppointment(id: string) {
  updateAppointment(id, { status: "cancelled", cancelledAtISO: new Date().toISOString() });
}

/** Demo seeding (the admin "Returning" toggle, the EngineerSidebar chip) only:
 *  drop a prepared journey into the store, replacing whatever is there. The
 *  content itself lives in therapist-demo.ts. */
export function seedTherapistState(next: { appointments: Appointment[]; savedIds: string[] }) {
  write({
    ...state,
    appointments: next.appointments,
    savedIds: next.savedIds,
    preferencesApplied: true,
  });
}

/** EngineerSidebar dev reset only: drop a row outright. The user-facing cancel
 *  keeps the record so the past-sessions list stays honest. */
export function removeAppointment(id: string) {
  write({ ...state, appointments: state.appointments.filter((a) => a.id !== id) });
}

/** Move an appointment to a new slot. The original is retired rather than
 *  edited, and the two rows point at each other, so the past list can say
 *  where a session went instead of quietly losing the old time. */
export function rescheduleAppointment(
  id: string,
  next: Omit<Appointment, "id" | "status">,
): string {
  const newId = addAppointment({ ...next, rescheduledFromId: id });
  updateAppointment(id, { status: "rescheduled", rescheduledToId: newId });
  return newId;
}

export function getAppointment(id: string | undefined): Appointment | null {
  return id ? state.appointments.find((a) => a.id === id) ?? null : null;
}

export function getAppointments(): Appointment[] {
  return state.appointments;
}

export function useAppointments(): Appointment[] {
  return useSyncExternalStore(
    subscribe,
    () => state.appointments,
    () => state.appointments,
  );
}

// ─── Selectors ───────────────────────────────────────────────────────────────
// Pure helpers rather than hooks: useSyncExternalStore needs a stable snapshot,
// so derived lists are memoised at the call site off useAppointments().

/** Still on the calendar. Soonest first. */
export function sortedUpcoming(list: Appointment[]): Appointment[] {
  return list
    .filter((a) => a.status === "booked")
    .slice()
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

/** Everything off the calendar — completed, cancelled, or moved. Newest first. */
export function sortedPast(list: Appointment[]): Appointment[] {
  return list
    .filter((a) => a.status !== "booked")
    .slice()
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
}

/** Sessions that have happened but haven't been talked through yet. */
export function pendingDebriefs(list: Appointment[]): Appointment[] {
  return list.filter((a) => a.status === "completed" && !a.debriefed);
}

/** The most recent session that actually happened — who to offer a rebook with. */
export function latestCompleted(list: Appointment[]): Appointment | null {
  return (
    list
      .filter((a) => a.status === "completed")
      .slice()
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0] ?? null
  );
}

/** EngineerSidebar control: mark the earliest still-upcoming appointment as
 *  completed — the prototype's stand-in for the session time passing. */
export function completeNextAppointment() {
  const next = sortedUpcoming(state.appointments)[0];
  if (next) updateAppointment(next.id, { status: "completed" });
}

/** The reverse, so the sidebar chip can put the session back in the future.
 *  Clears the debrief with it: that's a post-session artifact. */
export function reopenLastAppointment() {
  const last = latestCompleted(state.appointments);
  if (last)
    updateAppointment(last.id, { status: "booked", debriefed: false, debrief: undefined });
}

/** Save what the user told Yuna in the guided debrief. Appending rather than
 *  replacing means revisiting a session adds to the reflection. */
export function recordDebrief(id: string, entries: DebriefEntry[]) {
  const a = getAppointment(id);
  if (!a || entries.length === 0) return;
  updateAppointment(id, { debriefed: true, debrief: [...(a.debrief ?? []), ...entries] });
}

// ─── Summary edits ───────────────────────────────────────────────────────────

export function useSummaryEdits(): SummaryEdits {
  return useSyncExternalStore(
    subscribe,
    () => state.summaryEdits,
    () => NO_EDITS,
  );
}

/** Leave a section out of the share, or put it back. */
export function toggleSummarySection(id: string) {
  const { removed } = state.summaryEdits;
  write({
    ...state,
    summaryEdits: {
      ...state.summaryEdits,
      removed: removed.includes(id) ? removed.filter((x) => x !== id) : [...removed, id],
    },
  });
}

/** Reword a section's narrative. An empty edit falls back to Yuna's draft. */
export function setSummaryBody(id: string, body: string) {
  const bodies = { ...state.summaryEdits.bodies };
  if (body.trim()) bodies[id] = body.trim();
  else delete bodies[id];
  write({ ...state, summaryEdits: { ...state.summaryEdits, bodies } });
}

// ─── Preferences applied ─────────────────────────────────────────────────────

// True once setPreferencesApplied(true) has run in this JS session — i.e. the
// survey was actually completed since the last page load, as opposed to the
// flag being restored from a previous session's localStorage.
let appliedThisSession = false;

export function setPreferencesApplied(v: boolean) {
  if (v) appliedThisSession = true;
  if (state.preferencesApplied === v) return;
  write({ ...state, preferencesApplied: v });
}

export function preferencesAppliedThisSession(): boolean {
  return appliedThisSession;
}

/** Reset to the brand-new-user starting state: no saved therapists, survey not
 *  yet taken (so the recommendations screen shows its pre-survey teaser), no
 *  appointments. Used when the admin "New" user toggle is flipped. */
export function resetTherapistPrefs() {
  const { removed, bodies } = state.summaryEdits;
  if (
    !state.preferencesApplied &&
    state.savedIds.length === 0 &&
    state.appointments.length === 0 &&
    removed.length === 0 &&
    Object.keys(bodies).length === 0
  )
    return;
  write(EMPTY);
}

export function usePreferencesApplied(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.preferencesApplied,
    () => false,
  );
}
