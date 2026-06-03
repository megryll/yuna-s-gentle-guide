import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { TextField, FieldError } from "@/components/TextField";
import { Divider } from "@/components/Divider";

// Basic shape check — enough to catch typos like a missing "@" without
// rejecting valid-but-unusual addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const finish = () => navigate({ to: "/accept-terms" });
  const goBack = () => {
    if (step === "password") {
      setPasswordError("");
      setStep("email");
    } else navigate({ to: "/" });
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
            <h1 className="text-3xl leading-tight tracking-tight text-white">
              {step === "email" ? "Create your account." : "Create a password."}
            </h1>
            {step === "password" && email && (
              <p className="mt-3 text-sm text-white/75">{email}</p>
            )}
          </div>

          {step === "email" ? (
            <div className="mt-10 flex flex-col gap-3">
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!EMAIL_RE.test(email.trim())) {
                    setEmailError("That doesn't look like a valid email.");
                    return;
                  }
                  setStep("password");
                }}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-2">
                  <TextField
                    surface="dark"
                    type="email"
                    error={!!emailError}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    placeholder="your@email.com"
                  />
                  {emailError && <FieldError>{emailError}</FieldError>}
                </div>
                <Button surface="dark" variant="primary" fullWidth type="submit">
                  Continue with email
                </Button>
              </form>
              <Divider surface="dark" label="or" className="my-2" />
              <Button surface="dark" variant="primary" fullWidth onClick={finish}>
                <img src="/logos/google.svg" alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
                Continue with Google
              </Button>
              <Button surface="dark" variant="primary" fullWidth onClick={finish}>
                <img src="/logos/apple.svg" alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
                Continue with Apple
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (password.length < 8) {
                  setPasswordError("Your password needs at least 8 characters.");
                  return;
                }
                finish();
              }}
              className="mt-10 flex flex-col gap-3"
            >
              <div className="flex flex-col gap-2">
                <TextField
                  surface="dark"
                  type="password"
                  autoFocus
                  error={!!passwordError}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="At least 8 characters"
                />
                {passwordError && <FieldError>{passwordError}</FieldError>}
              </div>
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
