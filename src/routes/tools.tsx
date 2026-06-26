import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WebShell, WebContent } from "@/components/WebShell";
import { Badge } from "@/components/Badge";
import { useAppMode } from "@/lib/theme-prefs";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/tools")({
  head: () => ({ meta: [{ title: "Tools — Yuna" }] }),
  component: ToolsRoute,
});

function ToolsRoute() {
  const navigate = useNavigate();
  const mode = useAppMode();
  const isLight = mode === "light";
  // Light mode: lift the photo with a white wash so the title reads dark.
  // Dark mode: existing tar-to-light gradient keeps the white title legible.
  const overlay = isLight
    ? "linear-gradient(to top, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0.15) 100%)"
    : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.10) 100%)";
  const titleClass = isLight ? "text-foreground" : "text-white";
  const captionClass = isLight ? "text-foreground/80" : "text-white/90";

  return (
    <WebShell>
      <WebContent>
        <h1 className="font-display text-3xl lg:text-4xl tracking-tight text-white">Tools</h1>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t, i) => (
            <li key={t.id}>
              <div
                style={{ animationDelay: `${i * 60}ms` }}
                className={
                  "yuna-rise relative w-full rounded-3xl overflow-hidden aspect-[16/9] " +
                  (t.to ? "cursor-pointer hover:opacity-95 active:opacity-90 transition-opacity" : "")
                }
                role={t.to ? "button" : undefined}
                tabIndex={t.to ? 0 : undefined}
                aria-label={t.to ? t.title : undefined}
                onClick={t.to ? () => navigate({ to: t.to! }) : undefined}
                onKeyDown={
                  t.to
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate({ to: t.to! });
                        }
                      }
                    : undefined
                }
              >
                <img
                  src={t.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  aria-hidden
                />
                <div className="absolute inset-0" style={{ background: overlay }} />
                {t.isNew && <Badge className="absolute top-3 left-3">New</Badge>}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className={"font-display text-xl leading-tight tracking-tight " + titleClass}>
                    {t.title}
                  </p>
                  <p
                    className={
                      "mt-1.5 flex items-center gap-1.5 text-sm leading-snug " + captionClass
                    }
                  >
                    <span aria-hidden className="text-sm leading-none">
                      {t.emoji}
                    </span>
                    {t.caption}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </WebContent>
    </WebShell>
  );
}
