import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ComponentType, SVGProps } from "react";
import {
  BookOpen,
  ClipboardList,
  Flower2,
  Lightbulb,
  NotebookPen,
  Quote,
  Sparkles,
  Target,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { PageHeader } from "@/components/PageHeader";
import { Switch } from "@/components/Switch";
import { useAppMode, useModeImage } from "@/lib/theme-prefs";
import { KIND_META, KIND_PLURAL, type CardKind } from "@/lib/home-cards";
import { setContentPref, useContentPrefs } from "@/lib/content-prefs";

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

const KIND_ICON: Record<CardKind, IconCmp> = {
  "guided-session": Sparkles,
  meditation: Flower2,
  gratitude: NotebookPen,
  "self-discovery": ClipboardList,
  affirmation: Quote,
  "learn-skill": Lightbulb,
  accountability: Target,
  book: BookOpen,
};

const KINDS = Object.keys(KIND_META) as CardKind[];

export const Route = createFileRoute("/settings_/content-preferences")({
  head: () => ({ meta: [{ title: "Content Preferences — Yuna" }] }),
  component: ContentPreferencesRoute,
});

function ContentPreferencesRoute() {
  const navigate = useNavigate();
  const mode = useAppMode();
  const bgImage = useModeImage();
  const prefs = useContentPrefs();

  return (
    <PhoneFrame>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div
        className={
          "relative flex-1 flex flex-col text-foreground min-h-0 " +
          (mode === "dark" ? "overlay-on-dark" : "")
        }
      >
        <PageHeader
          title="Content Preferences"
          tone="ink"
          layout="inline"
          onBack={() => navigate({ to: "/settings" })}
        />

        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10 flex flex-col gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="text-sm leading-relaxed text-foreground/75">
            Choose what Yuna includes in your feed. Turn off anything you'd
            rather not see.
          </p>

          <div className="shrink-0 rounded-2xl overflow-hidden hairline bg-background/40 backdrop-blur-md flex flex-col">
            {KINDS.map((kind, i) => {
              const Icon = KIND_ICON[kind];
              const last = i === KINDS.length - 1;
              return (
                <div
                  key={kind}
                  className={
                    "flex items-center justify-between gap-3 p-4 shrink-0 " +
                    (last ? "" : "border-b border-border")
                  }
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Icon size={18} strokeWidth={1.5} className="text-foreground shrink-0" aria-hidden />
                    <span className="text-base leading-6 font-medium text-foreground truncate">
                      {KIND_PLURAL[kind]}
                    </span>
                  </div>
                  <Switch
                    checked={prefs[kind] !== false}
                    onChange={(next) => setContentPref(kind, next)}
                    label={KIND_PLURAL[kind]}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
