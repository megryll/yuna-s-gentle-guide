import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, EyeOff, X } from "lucide-react";
import { WebShell, WebContent } from "@/components/WebShell";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useAppMode } from "@/lib/theme-prefs";
import { HOME_CARDS, KIND_META, KIND_PLURAL, type HomeCard } from "@/lib/home-cards";

type SkillCard = Extract<HomeCard, { type: "learn-skill" }>;

function findSkill(id: string): SkillCard | undefined {
  return HOME_CARDS.find((c): c is SkillCard => c.type === "learn-skill" && c.id === id);
}

export const Route = createFileRoute("/skill/$id")({
  head: ({ params }) => {
    const skill = findSkill(params.id);
    return { meta: [{ title: skill ? `${skill.article.name} — Yuna` : "Skill — Yuna" }] };
  },
  component: SkillDetailRoute,
});

function SkillDetailRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const mode = useAppMode();
  const surface = mode === "dark" ? "dark" : "light";
  const skill = findSkill(id);
  const close = () => navigate({ to: "/home" });

  return (
    <WebShell>
      <WebContent width="max-w-2xl" className="text-white">
        {skill ? (
          <div className="mt-2">
            {/* Hero keeps the learn-skill card's deep-green identity from the
                feed (a fixed solid fill, mode-independent), white ink. */}
            <div
              className="card-fixed-dark rounded-[2.5rem] px-6 py-9 flex flex-col items-center text-center text-white"
              style={{ backgroundColor: KIND_META["learn-skill"].solidBg }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">
                {KIND_META["learn-skill"].label}
              </p>
              <h1 className="mt-3 font-display text-5xl leading-none tracking-tight text-white">
                {skill.article.acronym}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-white/85 max-w-[16rem]">
                {skill.article.summary}
              </p>
              <p className="mt-5 text-xs tracking-wide text-white/70">
                {skill.article.readingTime}
              </p>
            </div>

            <p className="mt-8 text-base leading-relaxed text-white/85">
              {skill.article.intro}
            </p>

            {/* Acronym breakdown — each letter in a DS Badge circle. */}
            <h2 className="mt-9 font-display text-xl leading-snug tracking-tight text-white">
              What each letter stands for
            </h2>
            <ul className="mt-4 flex flex-col gap-5">
              {skill.article.breakdown.map((item, i) => (
                <li key={i} className="flex gap-3.5">
                  <Badge
                    icon={
                      <span className="font-display text-xs leading-none tracking-tight">
                        {item.letter}
                      </span>
                    }
                    label={item.letter}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-base font-semibold leading-snug text-white">
                      {item.term}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/75">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {skill.article.sections.map((section, i) => (
              <section key={i}>
                <h2 className="mt-9 font-display text-xl leading-snug tracking-tight text-white">
                  {section.heading}
                </h2>
                {section.paragraphs.map((para, j) => (
                  <p key={j} className="mt-3 text-base leading-relaxed text-white/85">
                    {para}
                  </p>
                ))}
                {section.image && (
                  <figure className="mt-5">
                    <img
                      src={section.image.src}
                      alt=""
                      className="w-full h-44 object-cover rounded-2xl border border-white/15"
                    />
                    <figcaption className="mt-2 text-xs leading-relaxed text-white/75 text-center">
                      {section.image.caption}
                    </figcaption>
                  </figure>
                )}
              </section>
            ))}

            <div className="mt-10 flex flex-col gap-2.5">
              <Button surface={surface} variant="primary" fullWidth onClick={close}>
                <Check size={18} strokeWidth={1.75} aria-hidden />
                Mark as Completed
              </Button>
              <Button surface={surface} variant="secondary" fullWidth onClick={close}>
                <X size={18} strokeWidth={1.75} aria-hidden />
                Dismiss this card
              </Button>
              <Button surface={surface} variant="secondary" fullWidth onClick={close}>
                <EyeOff size={18} strokeWidth={1.75} aria-hidden />
                Stop seeing {KIND_PLURAL["learn-skill"]}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center text-center gap-4">
            <p className="text-base text-white/85">We couldn't find that skill.</p>
            <Button surface={surface} variant="secondary" size="sm" onClick={close}>
              Back home
            </Button>
          </div>
        )}
      </WebContent>
    </WebShell>
  );
}
