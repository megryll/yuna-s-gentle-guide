import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";

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
  return (
    <PhoneFrame backgroundImage="/background.png">
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10 text-white">
        <div className="yuna-fade-in">
          <img src="/yuna-logo.svg" alt="Yuna" className="h-5 w-auto" />
        </div>

        <div className="flex-1 flex flex-col justify-center items-start gap-10">
          <div
            className="relative h-14 w-14"
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
          <div>
            <h1
              className="text-3xl leading-snug tracking-tight text-white"
              style={{
                animation:
                  "welcome-rise 800ms cubic-bezier(0.2,0.8,0.2,1) 120ms both",
              }}
            >
              Hi, I'm Yuna.
            </h1>
            <p
              className="mt-3 text-base text-white/95 leading-relaxed max-w-[18rem]"
              style={{
                animation:
                  "welcome-rise 900ms cubic-bezier(0.2,0.8,0.2,1) 240ms both",
              }}
            >
              An intelligent system designed to guide you toward becoming the best version of yourself.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5">
          <div className="w-full grid grid-cols-2 gap-3">
            <Button surface="dark" variant="secondary" fullWidth>
              Log in
            </Button>
            <Button surface="dark" variant="primary" fullWidth asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
          <Button surface="dark" variant="ghost">
            Use Referral Code
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
}
