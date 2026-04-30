import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s.mode as "signin" | "signup") ?? "signup",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Yuna" },
      { name: "description", content: "Create an account or sign in to Yuna." },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [view, setView] = useState<"choose" | "email" | "referral">(
    mode === "signin" ? "email" : "choose",
  );

  const continueOn = () => navigate({ to: "/intro" });

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10 yuna-fade-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (view === "choose") navigate({ to: "/" });
              else setView("choose");
            }}
            aria-label="Back"
            className="h-9 w-9 rounded-full hairline flex items-center justify-center hover:bg-accent transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            {view === "choose" ? "Welcome" : view === "email" ? "Sign in" : "Referral"}
          </span>
          <span className="h-9 w-9" />
        </div>

        {view === "choose" && (
          <>
            <div className="mt-14 yuna-rise">
              <h1 className="text-2xl leading-snug tracking-tight">
                Let's get acquainted.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a way to begin. I'll keep things between us.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-3">
              <button
                onClick={() => setView("email")}
                className="font-sans-ui w-full rounded-full hairline px-6 py-3.5 text-sm hover:bg-accent transition-colors"
              >
                Login
              </button>
              <button
                onClick={continueOn}
                className="w-full rounded-full bg-foreground text-background px-6 py-3.5 text-sm tracking-wide hover:opacity-90 transition-opacity"
              >
                Get started
              </button>
            </div>

            <div className="mt-auto text-center">
              <button
                onClick={() => setView("referral")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Use referral code
              </button>
            </div>
          </>
        )}

        {view === "email" && (
          <>
            <div className="mt-14 yuna-rise">
              <h1 className="text-2xl leading-snug tracking-tight">Welcome back.</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to pick up where we left off.
              </p>
            </div>
            <div className="mt-10 flex flex-col gap-3">
              <SocialButton label="Continue with Apple" onClick={continueOn} />
              <SocialButton label="Continue with Google" onClick={continueOn} />
              <div className="flex items-center gap-3 my-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                <span className="flex-1 h-px bg-border" />
                or
                <span className="flex-1 h-px bg-border" />
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); continueOn(); }}
                className="flex flex-col gap-3"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="font-sans-ui w-full rounded-full hairline px-5 py-3.5 text-sm bg-background outline-none focus:border-foreground transition-colors"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-foreground text-background px-6 py-3.5 text-sm tracking-wide hover:opacity-90 transition-opacity"
                >
                  Sign in
                </button>
              </form>
            </div>
          </>
        )}

        {view === "referral" && (
          <>
            <div className="mt-14 yuna-rise">
              <h1 className="text-2xl leading-snug tracking-tight">
                Got a referral code?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter it below to unlock your invitation.
              </p>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); continueOn(); }}
              className="mt-10 flex flex-col gap-3"
            >
              <input
                type="text"
                required
                placeholder="REFERRAL CODE"
                className="font-sans-ui tracking-[0.25em] uppercase text-center w-full rounded-full hairline px-5 py-3.5 text-sm bg-background outline-none focus:border-foreground transition-colors"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-foreground text-background px-6 py-3.5 text-sm tracking-wide hover:opacity-90 transition-opacity"
              >
                Apply code
              </button>
            </form>
          </>
        )}
      </div>
    </PhoneFrame>
  );
}

function SocialButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-sans-ui w-full rounded-full hairline px-6 py-3.5 text-sm hover:bg-accent transition-colors"
    >
      {label}
    </button>
  );
}