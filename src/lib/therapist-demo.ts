import {
  getAppointments,
  removeAppointment,
  seedTherapistState,
  type Appointment,
} from "@/lib/therapist-prefs";
import {
  guidedDebriefScript,
  matchedTherapists,
  SESSION_TYPES,
  toISODate,
} from "@/lib/therapist-data";

// ─── Demo therapist journey ──────────────────────────────────────────────────
// The admin "Returning" toggle (and the EngineerSidebar chip) drops the user
// into a therapist journey that already has a past, so the hub, the
// past-sessions list, and a saved reflection can all be reviewed without
// clicking through booking, completing, and debriefing every time.
//
// Fixed ids, so seeding twice is a no-op and the rows can be cleared again.

const SEED_PREFIX = "seed-appt-";

function dayFromNow(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toISODate(d);
}

export function hasSeededHistory(): boolean {
  return getAppointments().some((a) => a.id.startsWith(SEED_PREFIX));
}

/** Wipe the seeded rows. Real bookings made during the demo stay. */
export function clearSeededHistory() {
  for (const a of getAppointments()) if (a.id.startsWith(SEED_PREFIX)) removeAppointment(a.id);
}

/** A journey mid-flight: one session on the calendar, one call still waiting on
 *  its debrief, and behind them a record — a session talked through, a
 *  cancellation, and a reschedule. */
export function seedTherapistHistory() {
  // Already seeded: leave it alone rather than wiping whatever the reviewer
  // has done on top of it. "New" then "Returning" gives a fresh journey.
  if (hasSeededHistory()) return;
  const matched = matchedTherapists();
  const therapist = matched[0];
  if (!therapist) return;
  const session = SESSION_TYPES[0];
  const base = { therapistId: therapist.id, sessionTypeId: session.id, confirmed: true };
  const script = guidedDebriefScript(therapist.name.split(" ")[0]);
  const movedFrom = `${SEED_PREFIX}moved`;
  const firstSession = `${SEED_PREFIX}first`;

  const appointments: Appointment[] = [
    {
      ...base,
      id: movedFrom,
      dateISO: dayFromNow(-35),
      time: "9:00 AM",
      status: "rescheduled",
      rescheduledToId: firstSession,
    },
    {
      ...base,
      id: firstSession,
      dateISO: dayFromNow(-28),
      time: "10:00 AM",
      status: "completed",
      rescheduledFromId: movedFrom,
      debriefed: true,
      debrief: [
        {
          atISO: `${dayFromNow(-28)}T18:00:00.000Z`,
          question: script.greeting[script.greeting.length - 1],
          answer:
            "Easier than I expected. I was nervous for the first ten minutes and then it just felt like a conversation.",
        },
        {
          atISO: `${dayFromNow(-28)}T18:02:00.000Z`,
          question: script.followUp,
          answer:
            "Mostly, yes. I didn't get into the work side of things, but that was me holding back rather than her.",
        },
      ],
    },
    {
      ...base,
      id: `${SEED_PREFIX}cancelled`,
      dateISO: dayFromNow(-21),
      time: "2:00 PM",
      status: "cancelled",
      cancelledAtISO: `${dayFromNow(-22)}T09:00:00.000Z`,
    },
    // Recent enough that the debrief is still worth offering — this is the one
    // the hub demotes to a nudge once something new is booked.
    {
      ...base,
      id: `${SEED_PREFIX}recent`,
      dateISO: dayFromNow(-6),
      time: "10:00 AM",
      status: "completed",
    },
    {
      ...base,
      id: `${SEED_PREFIX}next`,
      dateISO: dayFromNow(9),
      time: "10:00 AM",
      status: "booked",
    },
  ];

  // A second therapist kept on the list, so the hub's "Keep exploring" section
  // has something in it too.
  seedTherapistState({ appointments, savedIds: matched[1] ? [matched[1].id] : [] });
}
