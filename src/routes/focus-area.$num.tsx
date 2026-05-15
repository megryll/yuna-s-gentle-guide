import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Info } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { HomeCardRow } from "@/components/HomeCards";
import { useUserType } from "@/lib/user-type";
import { getFocusAreaData } from "@/lib/profile-data";
import { APP_MODE_META, useAppMode } from "@/lib/theme-prefs";

export const Route = createFileRoute("/focus-area/$num")({
  head: ({ params }) => ({
    meta: [{ title: `Focus Area ${params.num} — Yuna` }],
  }),
  component: FocusAreaRoute,
});

function FocusAreaRoute() {
  const { num: raw } = Route.useParams();
  const navigate = useNavigate();
  const userType = useUserType();
  const num: "1" | "2" = raw === "2" ? "2" : "1";
  const { meta, tasks, upcoming } = getFocusAreaData(userType, num);
  const [infoOpen, setInfoOpen] = useState(false);
  const mode = useAppMode();

  return (
    <PhoneFrame themed>
      <div className="relative flex-1 flex flex-col text-white min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <header className="px-6 pt-14 pb-2 shrink-0">
          <Button
            surface="dark"
            variant="secondary"
            size="icon"
            onClick={() => navigate({ to: "/you" })}
            aria-label="Back"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </Button>
        </header>

        <div className="px-6 pt-6 flex flex-col items-center text-center gap-3">
          <span className="font-sans-ui text-[10px] tracking-[0.32em] uppercase text-white/65">
            {meta.eyebrow}
          </span>
          <h1
            className="font-display font-semibold text-white"
            style={{ fontSize: 28, lineHeight: "38px", fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}
          >
            {meta.title}
          </h1>
          <p className="text-[14px] leading-[22px] text-white/80">{meta.body}</p>
        </div>

        <div className="px-6 mt-8">
          <h2 className="font-display text-[18px] leading-tight text-white text-center mb-3">
            Created For You
          </h2>
          <div className="flex flex-col gap-2">
            {tasks.map((card) => (
              <HomeCardRow key={card.id} card={card} onClick={() => undefined} />
            ))}
          </div>
        </div>

        <div className="px-6 mt-8 pb-12 relative">
          <div className="relative mb-3 flex items-center justify-center gap-1.5">
            <h2 className="font-display text-[18px] leading-tight text-white">
              Coming Up Next
            </h2>
            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              className="flex items-center justify-center active:opacity-70 transition-opacity"
              aria-label="About upcoming tasks"
              aria-expanded={infoOpen}
            >
              <Info size={14} strokeWidth={1.5} className="text-white/50" aria-hidden />
            </button>

            {infoOpen && (
              <>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => setInfoOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div
                  className={
                    "absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 rounded-2xl p-4 shadow-[0_8px_28px_rgba(0,0,0,0.22)] overflow-hidden " +
                    (mode === "dark" ? "overlay-on-dark" : "")
                  }
                  style={{
                    width: 260,
                    backgroundImage: `url(${APP_MODE_META[mode].image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <p className="text-[14px] leading-[22px] text-neutral-900 m-0">
                    New growth tasks unlock as you chat with Yuna and complete existing tasks.
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2 opacity-50 pointer-events-none">
            {upcoming.map((card) => (
              <HomeCardRow key={card.id} card={card} onClick={() => undefined} />
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
