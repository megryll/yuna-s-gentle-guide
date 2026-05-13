import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Create account — Yuna" },
      { name: "description", content: "Create an account to start with Yuna." },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const continueOn = () => navigate({ to: "/accept-terms" });

  return (
    <PhoneFrame backgroundImage="/background.png">
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10 yuna-fade-in text-white">
        <div className="flex items-center justify-between">
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            aria-label="Back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
          <span className="h-9 w-9" />
        </div>

        <div className="mt-14 yuna-rise">
          <h1 className="text-[32px] leading-tight tracking-tight text-white">
            Create your account.
          </h1>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <Button surface="dark" variant="primary" fullWidth onClick={continueOn}>
            <img src="/logos/apple.svg" alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
            Continue with Apple
          </Button>
          <Button surface="dark" variant="primary" fullWidth onClick={continueOn}>
            <img src="/logos/google.svg" alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 my-2 text-[10px] tracking-[0.2em] uppercase text-white/60">
            <span className="flex-1 h-px bg-white/25" />
            or
            <span className="flex-1 h-px bg-white/25" />
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
              className="w-full rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-5 py-3.5 text-sm text-white placeholder:text-white/50 outline-none focus:border-white transition-colors"
            />
            <Button surface="dark" variant="primary" fullWidth type="submit">
              Continue with email
            </Button>
          </form>
        </div>
      </div>
    </PhoneFrame>
  );
}
