import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useWelcomeImage } from "@/lib/theme-prefs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yuna — A quiet space for your mind" },
      { name: "description", content: "Yuna is a gentle mental health companion built with researchers from Harvard." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const welcomeBg = useWelcomeImage();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <PhoneFrame backgroundImage={welcomeBg}>
      {loaded && (
      <>
      <div className="flex-1 flex flex-col px-8 pt-14 pb-44 text-white">
        <div className="yuna-fade-in">
          <img src="/yuna-logo.svg" alt="Yuna" className="h-5 w-auto" />
        </div>

        <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-end gap-3">
          <div
            className="relative h-14 w-14 shrink-0"
            style={{
              animation:
                "welcome-rise 700ms cubic-bezier(0.2,0.8,0.2,1) 0ms both",
            }}
          >
            {/* Outer breathing halo */}
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
              style={{
                width: 220,
                height: 220,
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.14) 28%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 70%)",
                animation: "glow-breathe 7.5s ease-in-out infinite",
                filter: "blur(2px)",
                transform: "translate(-50%, -50%)",
                willChange: "transform, opacity",
              }}
            />
            {/* Slow drifting glow that softens the breathe */}
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
              style={{
                width: 160,
                height: 160,
                background:
                  "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.28), rgba(255,255,255,0) 65%)",
                animation: "glow-drift 11s ease-in-out infinite",
                mixBlendMode: "screen",
                filter: "blur(6px)",
                transform: "translate(-50%, -50%)",
                willChange: "transform",
              }}
            />
            {/* Rotating conic ring tracing the stroke */}
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
              style={{
                width: 64,
                height: 64,
                background:
                  "conic-gradient(from 0deg, rgba(255,255,255,0.95), rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.95))",
                WebkitMask:
                  "radial-gradient(circle, transparent 58%, #000 62%, #000 96%, transparent 100%)",
                mask: "radial-gradient(circle, transparent 58%, #000 62%, #000 96%, transparent 100%)",
                animation: "glow-spin 9s linear infinite",
                filter: "blur(1.5px)",
                transform: "translate(-50%, -50%)",
                willChange: "transform",
              }}
            />
            <img
              src="/avatar.png"
              alt="Yuna avatar"
              className="relative h-14 w-14"
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div
              className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm px-5 py-4"
              style={{
                animation:
                  "welcome-rise 800ms cubic-bezier(0.2,0.8,0.2,1) 120ms both",
              }}
            >
              <p className="text-[20px] leading-[1.4] text-white">
                Hi, I'm Yuna.
                <br />
                <br />
                Here to listen, reflect, and grow with you.
              </p>
            </div>
            <div
              className="rounded-2xl rounded-bl-sm border border-white/25 bg-white/10 backdrop-blur-sm px-5 py-4"
              style={{
                animation:
                  "welcome-rise 800ms cubic-bezier(0.2,0.8,0.2,1) 220ms both",
              }}
            >
              <p className="text-[20px] leading-[1.4] text-white">
                How would you like to get started?
              </p>
            </div>
          </div>
        </div>
        </div>

      </div>

      <div
        className="absolute left-0 right-0 bottom-[-72px] rounded-t-[48px] bg-white/10 backdrop-blur-sm border-t border-white/25 text-white px-8 pt-7 pb-24 flex flex-col gap-5"
        style={{ animation: "welcome-rise 900ms cubic-bezier(0.2,0.8,0.2,1) 2020ms both" }}
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/employer-access" })}
            className="w-full rounded-2xl border border-white/40 px-5 py-4 flex items-center gap-3 transition-transform duration-100 ease-out active:scale-[0.99]"
          >
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[17px] font-semibold leading-tight text-white">
                Sign up through my employer
              </div>
              <div className="text-[14px] text-white/70 mt-1">
                Free access and 100% private
              </div>
            </div>
            <ChevronRight
              size={20}
              strokeWidth={1.75}
              aria-hidden
              className="shrink-0 text-white/60"
            />
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/auth" })}
            className="w-full rounded-2xl border border-white/40 px-5 py-4 flex items-center gap-3 transition-transform duration-100 ease-out active:scale-[0.99]"
          >
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[17px] font-semibold leading-tight text-white">
                Sign up on my own
              </div>
              <div className="text-[14px] text-white/70 mt-1">
                3-day free trial, cancel anytime
              </div>
            </div>
            <ChevronRight
              size={20}
              strokeWidth={1.75}
              aria-hidden
              className="shrink-0 text-white/60"
            />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-[14px] text-white/85">
          <button type="button" className="text-right active:opacity-70 transition-opacity">
            Referral Code
          </button>
          <span aria-hidden className="text-white/30">|</span>
          <Link to="/login" className="text-left active:opacity-70 transition-opacity">
            Login
          </Link>
        </div>
      </div>
      </>
      )}
    </PhoneFrame>
  );
}
