import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useDarkBlurImage } from "@/lib/theme-prefs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Create account — Yuna" },
      { name: "description", content: "Create an account to start with Yuna." },
    ],
  }),
  component: AuthScreen,
});

type Step = "email" | "password";

function AuthScreen() {
  const navigate = useNavigate();
  const darkBg = useDarkBlurImage();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const finish = () => navigate({ to: "/accept-terms" });
  const goBack = () => {
    if (step === "password") setStep("email");
    else navigate({ to: "/" });
  };

  return (
    <PhoneFrame backgroundImage={darkBg}>
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
              {step === "email" ? "Create your account." : "Create a password."}
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
                  Continue with email
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
                minLength={8}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <Button surface="dark" variant="primary" fullWidth type="submit">
                Continue
              </Button>
            </form>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
