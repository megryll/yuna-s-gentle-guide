import { useSyncExternalStore } from "react";

// ─── Therapist Recommendations — local prototype state ───────────────────────
// localStorage-backed so saved therapists and "preferences applied" persist
// across the prototype's screen-to-screen navigation. Mirrors the lightweight
// store pattern used by notes-prefs.ts / theme-prefs.ts. Filter selections in
// the drawer are ephemeral screen state, not persisted here.

/** A booked call with a therapist. `completed` is flipped by the EngineerSidebar
 *  "complete" control (the prototype's stand-in for the session time passing);
 *  `debriefed` / `summaryShared` track the post-booking follow-ups. */
export type Appointment = {
  id: string;
  therapistId: string;
  sessionTypeId: string;
  dateISO: string;
  time: string;
  /** Secured on the therapist's booking platform. Requests start unconfirmed
   *  (the timeslot is held 24 hours); the hub's confirm action flips this. */
  confirmed?: boolean;
  completed?: boolean;
  debriefed?: boolean;
  summaryShared?: boolean;
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

function read(): State {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      savedIds: Array.isArray(parsed.savedIds) ? parsed.savedIds : [],
      preferencesApplied: !!parsed.preferencesApplied,
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
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

export function addAppointment(a: Omit<Appointment, "id">): string {
  const id = `appt-${Math.random().toString(36).slice(2, 9)}`;
  write({ ...state, appointments: [...state.appointments, { ...a, id }] });
  return id;
}

export function updateAppointment(id: string, patch: Partial<Omit<Appointment, "id">>) {
  write({
    ...state,
    appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  });
}

export function cancelAppointment(id: string) {
  write({ ...state, appointments: state.appointments.filter((a) => a.id !== id) });
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

/** EngineerSidebar control: mark the earliest still-upcoming appointment as
 *  completed — the prototype's stand-in for the session time passing. */
export function completeNextAppointment() {
  const next = state.appointments.find((a) => !a.completed);
  if (next) updateAppointment(next.id, { completed: true });
}

/** The reverse, so the sidebar chip can put the session back in the future.
 *  Clears the debrief with it: that's a post-session artifact. */
export function reopenLastAppointment() {
  const last = [...state.appointments].reverse().find((a) => a.completed);
  if (last) updateAppointment(last.id, { completed: false, debriefed: false });
}

/** The debrief chat resolves the completed appointment by therapist (the chat
 *  is launched with a therapist id, not an appointment id). */
export function markDebriefed(therapistId: string) {
  const target = state.appointments.find(
    (a) => a.therapistId === therapistId && a.completed && !a.debriefed,
  );
  if (target) updateAppointment(target.id, { debriefed: true });
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
