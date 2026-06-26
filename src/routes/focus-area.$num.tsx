import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Info } from "lucide-react";
import { WebShell, WebContent } from "@/components/WebShell";
import { PageHeader } from "@/components/PageHeader";
import { HomeCardRow } from "@/components/HomeCards";
import { useUserType } from "@/lib/user-type";
import { getFocusAreaData } from "@/lib/profile-data";
import { useAppMode, useModeImage } from "@/lib/theme-prefs";

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
  const bgImage = useModeImage();
  // Themed screen: controls flip surface with the Light/Dark toggle.
  const surface = mode;

  return (
    <WebShell>
      <WebContent width="max-w-3xl" className="text-white">
        <PageHeader
          surface={surface}
          className="px-0 pt-0 pb-0"
          onBack={() => navigate({ to: "/you" })}
        />

        <div className="mt-6 flex flex-col items-center text-center gap-3">
          <span className="text-uppercase tracking-[0.32em] uppercase text-white/75">
            {meta.eyebrow}
          </span>
          <h1
            className="font-display font-semibold text-3xl leading-tight text-white"
            style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}
          >
            {meta.title}
          </h1>
          <p className="text-sm leading-[22px] text-white/80">{meta.body}</p>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl leading-tight text-white text-center mb-3">
            Created For You
          </h2>
          <div className="flex flex-col gap-2">
            {tasks.map((card) => (
              <HomeCardRow key={card.id} card={card} onClick={() => undefined} />
            ))}
          </div>
        </div>

        <div className="mt-10 relative">
          <div className="relative mb-3 flex items-center justify-center gap-1.5">
            <h2 className="font-display text-xl leading-tight text-white">
              Coming Up Next
            </h2>
            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              className="flex items-center justify-center hover:opacity-80 active:opacity-70 transition-opacity"
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
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <p className="text-sm leading-[22px] text-neutral-900 m-0">
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
      </WebContent>
    </WebShell>
  );
}
