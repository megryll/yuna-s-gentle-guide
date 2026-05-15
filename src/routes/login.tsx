import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Yuna" },
      { name: "description", content: "Log in to your Yuna account." },
    ],
  }),
  component: LoginScreen,
});

type Step = "email" | "password";

function LoginScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const finish = () => navigate({ to: "/home" });
  const goBack = () => {
    if (step === "password") setStep("email");
    else navigate({ to: "/" });
  };

  return (
    <PhoneFrame backgroundImage="/background.png">
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10 yuna-fade-in text-white">
        <div className="flex items-center justify-between">
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            onClick={goBack}
            aria-label="Back"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </Button>
          <span className="h-9 w-9" />
        </div>

        <div key={step} className="yuna-fade-in flex flex-col">
          <div className="mt-14 yuna-rise">
            <h1 className="text-[32px] leading-tight tracking-tight text-white">
              {step === "email" ? "Welcome back." : "Enter your password."}
            </h1>
            {step === "password" && email && (
              <p className="mt-3 text-sm text-white/70">{email}</p>
            )}
          </div>

          {step === "email" ? (
            <div className="mt-10 flex flex-col gap-3">
              <Button surface="dark" variant="primary" fullWidth onClick={finish}>
                <img src="/logos/apple.svg" alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
                Continue with Apple
              </Button>
              <Button surface="dark" variant="primary" fullWidth onClick={finish}>
                <img src="/logos/google.svg" alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
                Continue with Google
              </Button>
              <div className="flex items-center gap-3 my-2 text-[10px] tracking-[0.2em] uppercase text-white/60">
                <span className="flex-1 h-px bg-white/25" />
                or
                <span className="flex-1 h-px bg-white/25" />
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); setStep("password"); }}
                className="flex flex-col gap-3"
              >
                <TextField
                  surface="dark"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
                <Button surface="dark" variant="primary" fullWidth type="submit">
                  Log in with email
                </Button>
              </form>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); finish(); }}
              className="mt-10 flex flex-col gap-3"
            >
              <TextField
                surface="dark"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
              <Button surface="dark" variant="primary" fullWidth type="submit">
                Log in
              </Button>
              <button
                type="button"
                className="self-center mt-1 text-sm text-white/70 underline underline-offset-4 decoration-white/40"
              >
                Forgot password?
              </button>
            </form>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
