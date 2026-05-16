import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, User } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
  const [loaded, setLoaded] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <PhoneFrame backgroundImage="/welcome-forest.png">
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
          <div className="flex-1 min-w-0">
            <div
              className="rounded-2xl rounded-bl-sm border border-white/25 bg-white/10 backdrop-blur-sm px-5 py-4"
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
          </div>
        </div>
        </div>

      </div>

      <div
        className="absolute left-0 right-0 bottom-[-72px] rounded-t-[48px] bg-white/10 backdrop-blur-sm border-t border-white/25 text-white px-8 pt-7 pb-24 flex flex-col items-center gap-5"
        style={{ animation: "welcome-rise 900ms cubic-bezier(0.2,0.8,0.2,1) 320ms both" }}
      >
        <div className="w-full grid grid-cols-2 gap-3">
          <Button surface="dark" variant="secondary" fullWidth asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button
            surface="dark"
            variant="primary"
            fullWidth
            onClick={() => setJoinOpen(true)}
          >
            Get started
          </Button>
        </div>
        <Button surface="dark" variant="ghost">
          Use Referral Code
        </Button>
      </div>
      </>
      )}

      <Drawer open={joinOpen} onOpenChange={setJoinOpen}>
        <DrawerContent className="rounded-t-[1.75rem] pb-2">
          <DrawerHeader className="text-left px-6 pt-4 pb-2">
            <DrawerTitle className="font-serif font-normal text-[26px] leading-[1.15] tracking-tight">
              How would you like to join?
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pt-4 pb-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setJoinOpen(false);
                navigate({ to: "/employer-access" });
              }}
              className="rounded-2xl hairline bg-background/70 backdrop-blur-sm py-9 flex flex-col items-center gap-4 transition-transform duration-100 ease-out active:scale-[0.99]"
            >
              <span className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center">
                <Building2 size={20} strokeWidth={1.75} />
              </span>
              <span className="text-[17px] font-semibold">
                I have access through my employer
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setJoinOpen(false);
                navigate({ to: "/auth" });
              }}
              className="rounded-2xl hairline bg-background/70 backdrop-blur-sm py-9 flex flex-col items-center gap-4 transition-transform duration-100 ease-out active:scale-[0.99]"
            >
              <span className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center">
                <User size={20} strokeWidth={1.75} />
              </span>
              <span className="text-[17px] font-semibold">
                I am signing up myself
              </span>
            </button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link
                to="/login"
                onClick={() => setJoinOpen(false)}
                className="text-foreground font-semibold"
              >
                Log in here
              </Link>
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </PhoneFrame>
  );
}
