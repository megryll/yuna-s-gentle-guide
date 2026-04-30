import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaWordmark } from "@/components/YunaMark";

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
  const isSignup = mode === "signup";

  const continueOn = () => navigate({ to: "/intro" });

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10 yuna-fade-in">
        <YunaWordmark />

        <div className="mt-16">
          <h1 className="text-2xl leading-snug tracking-tight">
            {isSignup ? "Let's get acquainted." : "Welcome back."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Choose a way to begin. I'll keep things between us."
              : "Sign in to pick up where we left off."}
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
              {isSignup ? "Create account" : "Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-auto pt-10 text-center">
          <Link
            to="/auth"
            search={{ mode: isSignup ? "signin" : "signup" }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignup ? "I already have an account" : "Create a new account"}
          </Link>
        </div>
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