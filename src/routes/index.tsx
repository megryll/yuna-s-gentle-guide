import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { ChatBubble } from "@/components/ChatBubble";
import { YunaAvatar } from "@/components/YunaAvatar";
import { useDarkBlurImage, useWelcomeImage } from "@/lib/theme-prefs";
import { usePlatform } from "@/lib/platform";
import { useFrameSize } from "@/lib/frame-size";

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
  const blurBg = useDarkBlurImage();
  const platform = usePlatform();
  // Center the conversation in the space above the sheet on roomy frames; on a
  // short frame (SE) bottom-anchor it instead so it doesn't float far above the
  // sheet. Keyed on frame height since the device toggle changes height, not the
  // browser viewport — so a CSS breakpoint can't see it.
  const shortFrame = useFrameSize().h < 750;
  // Android can't render backdrop-filter, so the frosted bottom sheet over the
  // un-blurred forest photo looks harsh. Paint the pre-blurred photo into its
  // background instead — fixed attachment so the patch aligns with what's
  // behind the sheet. (Chat bubbles get the same treatment via ChatBubble's
  // `frostedImage` prop.)
  const sheetStyle =
    platform === "android"
      ? ({
          background: `url(${blurBg}) center/cover fixed no-repeat`,
        } as const)
      : undefined;
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <PhoneFrame backgroundImage={welcomeBg}>
      {loaded && (
      <div className="flex-1 flex flex-col min-h-0 text-white">
        <div className="yuna-fade-in shrink-0 px-8 pt-14 pb-2">
          <img src="/yuna-logo.svg" alt="Yuna" className="h-5 w-auto" />
        </div>

        {/* Conversation fills the space above the sheet: centered on roomy
            frames, bottom-anchored on a short one (see shortFrame). It never
            sits behind the sheet. Intentionally NOT clipped — the avatar's glow
            aura bleeds ~80px past its box, and on a short frame the bottom-anchor
            grows any spillover upward into the empty logo space, never down. */}
        <div className="flex-1 min-h-0 px-8 flex flex-col">
          <div className={`flex items-end gap-3 pb-4 ${shortFrame ? "mt-auto" : "my-auto"}`}>
            <div
              className="shrink-0"
              style={{
                animation:
                  "welcome-rise 700ms cubic-bezier(0.2,0.8,0.2,1) 0ms both",
              }}
            >
              <YunaAvatar glow size={56} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <ChatBubble
                from="yuna"
                size="lg"
                tail={false}
                frostedImage={blurBg}
                style={{
                  animation:
                    "welcome-rise 800ms cubic-bezier(0.2,0.8,0.2,1) 120ms both",
                }}
              >
                Hi, I'm Yuna.
                <br />
                <br />
                Here to listen, reflect, and grow with you.
              </ChatBubble>
              <ChatBubble
                from="yuna"
                size="lg"
                frostedImage={blurBg}
                style={{
                  animation:
                    "welcome-rise 800ms cubic-bezier(0.2,0.8,0.2,1) 220ms both",
                }}
              >
                How would you like to get started?
              </ChatBubble>
            </div>
          </div>
        </div>

        {/* Pinned to the bottom in flow — its height is reserved automatically,
            so the conversation never sits behind it. The -mb peeks the sheet's
            base past the frame's rounded corner, matching the old absolute look. */}
        <div
          className="shrink-0 -mb-[72px] overflow-hidden rounded-t-[48px] bg-white/10 backdrop-blur-sm border-t border-white/25 text-white px-8 pt-7 pb-24 flex flex-col gap-5"
          style={{
            animation: "welcome-rise 900ms cubic-bezier(0.2,0.8,0.2,1) 1770ms both",
            ...sheetStyle,
          }}
        >
        <div className="flex flex-col gap-3">
          <Button
            surface="dark"
            variant="card"
            onClick={() => navigate({ to: "/employer-access" })}
            subtitle="Free, and private from your employer"
            trailing={<ChevronRight size={20} strokeWidth={1.75} aria-hidden />}
          >
            Sign up through my employer
          </Button>

          <Button
            surface="dark"
            variant="card"
            onClick={() => navigate({ to: "/auth" })}
            subtitle="3-day free trial, cancel anytime"
            trailing={<ChevronRight size={20} strokeWidth={1.75} aria-hidden />}
          >
            Sign up on my own
          </Button>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Button surface="dark" variant="link" className="justify-self-end">
            Referral Code
          </Button>
          <span aria-hidden className="text-white/30">|</span>
          <Button asChild surface="dark" variant="link" className="justify-self-start">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
      </div>
      )}
    </PhoneFrame>
  );
}
