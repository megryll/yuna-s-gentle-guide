import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { OnboardingFrame } from "@/components/OnboardingFrame";
import { Button } from "@/components/Button";
import { TextField, FieldError } from "@/components/TextField";
import { Divider } from "@/components/Divider";
import { Toast, ToastViewport } from "@/components/Toast";

// Basic shape check — enough to catch typos like a missing "@" without
// rejecting valid-but-unusual addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "email" | "password" | "reset";

export const Route = createFileRoute("/login")({
  // `step` seeds the initial view so each state is deep-linkable (used by the
  // /gallery board to thumbnail password + reset, not just the email entry).
  validateSearch: (search: Record<string, unknown>): { step?: Step } => {
    const s = search.step;
    return s === "password" || s === "reset" ? { step: s } : {};
  },
  head: () => ({
    meta: [
      { title: "Log in — Yuna" },
      { name: "description", content: "Log in to your Yuna account." },
    ],
  }),
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  // The URL is the source of truth for the step, so sidebar taps that only
  // change `?step=` (same route, no remount) actually switch the view.
  const { step: searchStep } = Route.useSearch();
  const step: Step = searchStep ?? "email";
  const setStep = (s: Step) =>
    navigate({ to: "/login", search: s === "email" ? {} : { step: s }, replace: true });
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Top-pinned confirmation after a password-reset email is "sent".
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showResetSent = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({
      title: "Password reset email sent",
      message: "Please follow the instructions sent in the email",
    });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const finish = () => navigate({ to: "/home" });
  const goBack = () => {
    if (step === "reset") {
      setEmailError("");
      setStep("password");
    } else if (step === "password") {
      setPasswordError("");
      setStep("email");
    } else navigate({ to: "/" });
  };

  return (
    <OnboardingFrame>
      <div className="relative flex-1 flex flex-col px-8 pt-14 pb-10 yuna-fade-in text-white">
        {toast && (
          <ToastViewport>
            <Toast
              variant="success"
              title={toast.title}
              message={toast.message}
              onDismiss={() => setToast(null)}
            />
          </ToastViewport>
        )}
        <div className="flex items-center justify-between">
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            onClick={goBack}
            aria-label="Back"
          >
            <ChevronLeft strokeWidth={1.5} />
          </Button>
          <span className="h-9 w-9" />
        </div>

        <div key={step} className="yuna-fade-in flex flex-col">
          <div className="mt-14 yuna-rise">
            <h1 className="text-3xl leading-tight tracking-tight text-white">
              {step === "email"
                ? "Welcome back."
                : step === "reset"
                  ? "Reset your password."
                  : "Enter your password."}
            </h1>
            {step === "password" && email && (
              <p className="mt-3 text-sm text-white/75">{email}</p>
            )}
            {step === "reset" && (
              <p className="mt-3 text-sm text-white/75 max-w-[20rem]">
                We'll send reset instructions to this email.
              </p>
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
                  Log in with email
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
          ) : step === "reset" ? (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!EMAIL_RE.test(email.trim())) {
                  setEmailError("That doesn't look like a valid email.");
                  return;
                }
                setStep("password");
                showResetSent();
              }}
              className="mt-10 flex flex-col gap-3"
            >
              <div className="flex flex-col gap-2">
                <TextField
                  surface="dark"
                  type="email"
                  autoFocus
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
                Reset Password
              </Button>
            </form>
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!password) {
                  setPasswordError("Enter your password to log in.");
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
                  placeholder="Your password"
                />
                {passwordError && <FieldError>{passwordError}</FieldError>}
              </div>
              <Button surface="dark" variant="primary" fullWidth type="submit">
                Log in
              </Button>
              <Button
                surface="dark"
                variant="link"
                type="button"
                onClick={() => {
                  setPasswordError("");
                  setEmailError("");
                  setStep("reset");
                }}
                className="self-center mt-1"
              >
                Forgot password?
              </Button>
            </form>
          )}
        </div>
      </div>
    </OnboardingFrame>
  );
}
