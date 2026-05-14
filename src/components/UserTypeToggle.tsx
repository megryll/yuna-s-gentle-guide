import { useLocation } from "@tanstack/react-router";
import {
  isOnboardingPath,
  setUserType,
  useUserType,
  type UserType,
} from "@/lib/user-type";

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
      className="hidden md:flex fixed left-1/2 -translate-x-1/2 top-3 z-50 items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur-md p-1 shadow-sm"
      role="group"
      aria-label="Simulated user type"
    >
      <ToggleButton
        active={displayed === "new"}
        disabled={false}
        onClick={() => setUserType("new")}
      >
        New
      </ToggleButton>
      <ToggleButton
        active={displayed === "returning"}
        disabled={returningDisabled}
        onClick={() => setUserType("returning")}
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
        "font-sans-ui text-[11px] tracking-wide px-3 py-1 rounded-full transition-colors " +
        (active
          ? "bg-foreground text-background"
          : disabled
            ? "text-muted-foreground/40 cursor-not-allowed"
            : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}
