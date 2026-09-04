import { useLocation } from "@tanstack/react-router";
import {
  isOnboardingPath,
  setUserType,
  useUserType,
  type UserType,
} from "@/lib/user-type";
import { resetTherapistPrefs } from "@/lib/therapist-prefs";
import { seedTherapistHistory } from "@/lib/therapist-demo";

export function UserTypeToggle() {
  const userType = useUserType();
  const { pathname } = useLocation();
  const returningDisabled = isOnboardingPath(pathname);

  // While on onboarding screens we lock the toggle to "new" so the user can't
  // jump into a returning-state surface mid-flow. Reading from cached state
  // would let stale values render here; force-display "new" instead.
  const displayed: UserType = returningDisabled ? "new" : userType;

  return (
    <div
      className="hidden md:flex items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur-md p-1 shadow-sm"
      role="group"
      aria-label="Simulated user type"
    >
      <ToggleButton
        active={displayed === "new"}
        disabled={false}
        onClick={() => {
          setUserType("new");
          // A brand-new user has no therapist journey: clear saved therapists,
          // survey completion, and any booked appointments, wherever we are.
          resetTherapistPrefs();
        }}
      >
        New
      </ToggleButton>
      <ToggleButton
        active={displayed === "returning"}
        disabled={returningDisabled}
        onClick={() => {
          setUserType("returning");
          // Land on a therapist journey that already has a past — an upcoming
          // session, one waiting on its debrief, and the record behind them —
          // rather than making the reviewer click the whole flow through.
          seedTherapistHistory();
        }}
      >
        Returning
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={
        "text-uppercase tracking-wide px-3 py-1 rounded-full transition-colors " +
        (active
          ? "bg-foreground text-background"
          : disabled
            ? "text-muted-foreground/40 cursor-not-allowed"
            : "text-muted-foreground active:text-foreground")
      }
    >
      {children}
    </button>
  );
}
