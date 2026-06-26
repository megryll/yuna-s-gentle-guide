import { createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, Share } from "lucide-react";
import { Button } from "@/components/Button";
import { OnboardingFrame } from "@/components/OnboardingFrame";

// Daily-affirmation splash: shows a reflection, then auto-advances into the app
// while a progress line fills along the bottom of the Continue button. Locked
// to the dark photo cluster, like the onboarding routes.
const AUTO_ADVANCE_MS = 5000;

export const Route = createFileRoute("/splash")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  // In the /gallery board (loaded with ?chrome=off) the splash thumbnail must
  // stay put — skip the progress fill and the auto-advance to /home.
  const chromeOff = useLocation({
    select: (l) => (l.search as Record<string, unknown>)?.chrome === "off",
  });

  useEffect(() => {
    if (chromeOff) return;
    const raf = requestAnimationFrame(() => setProgress(100));
    const advance = setTimeout(() => navigate({ to: "/home" }), AUTO_ADVANCE_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(advance);
    };
  }, [navigate, chromeOff]);

  return (
    // Dark-locked immersive moment (no nav shell), centered full-screen on the
    // dark blur photo — the web analog to its PhoneFrame, scaling to any viewport.
    <OnboardingFrame className="px-8 pt-14 pb-10">
      <div className="flex justify-center pt-10">
        <img src="/yuna-logo.svg" alt="Yuna" className="h-8 w-auto" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-7">
        <div className="flex items-center gap-3">
          <Button surface="dark" variant="secondary" size="icon-sm" aria-label="Share">
            <Share strokeWidth={1.75} aria-hidden />
          </Button>
          <Button surface="dark" variant="secondary" size="icon-sm" aria-label="Save">
            <Bookmark strokeWidth={1.75} aria-hidden />
          </Button>
        </div>

        <p className="font-display text-2xl leading-[1.5] text-center text-white">
          You are capable of creating a life filled with purpose and meaning,
          despite your mental health challenges.
        </p>
      </div>

      <div className="flex justify-center">
        <Button
          surface="dark"
          variant="secondary"
          onClick={() => navigate({ to: "/home" })}
          className="relative overflow-hidden px-14"
        >
          {/* Auto-advance timer: fills left-to-right over AUTO_ADVANCE_MS,
              width driven inline since it animates at runtime. */}
          <span
            aria-hidden
            className="absolute left-0 bottom-0 h-[5px] rounded-full bg-secondary-green"
            style={{
              width: `${progress}%`,
              transition: `width ${AUTO_ADVANCE_MS}ms linear`,
            }}
          />
          <span className="relative">Continue</span>
        </Button>
      </div>
    </OnboardingFrame>
  );
}
