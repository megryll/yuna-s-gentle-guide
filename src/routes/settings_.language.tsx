import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { PageHeader } from "@/components/PageHeader";
import { MultipleChoice } from "@/components/MultipleChoice";
import { useAppMode, useModeImage } from "@/lib/theme-prefs";
import { flagSettingsSaved } from "@/lib/settings-saved-toast";

const LANG_KEY = "yuna.sessionLanguage";
const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "German", label: "German" },
];

export const Route = createFileRoute("/settings_/language")({
  head: () => ({ meta: [{ title: "Session Language — Yuna" }] }),
  component: SessionLanguageRoute,
});

function SessionLanguageRoute() {
  const navigate = useNavigate();
  const mode = useAppMode();
  const bgImage = useModeImage();

  const [language, setLanguage] = useState<string>(() => {
    if (typeof window === "undefined") return "English";
    return window.localStorage.getItem(LANG_KEY) ?? "English";
  });

  const choose = (next: string) => {
    setLanguage(next);
    if (typeof window !== "undefined") window.localStorage.setItem(LANG_KEY, next);
    flagSettingsSaved("Session language updated.");
  };

  return (
    <PhoneFrame>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />

      <div
        className={
          "relative flex-1 flex flex-col text-foreground min-h-0 " +
          (mode === "dark" ? "overlay-on-dark" : "")
        }
      >
        <PageHeader title="Session Language" tone="ink" onBack={() => navigate({ to: "/settings" })} />

        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10 flex flex-col gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="text-sm leading-relaxed text-foreground/75">
            Select your preferred language. Yuna will guide your sessions in the language you choose.
          </p>

          <MultipleChoice
            surface="light"
            ariaLabel="Session language"
            indicator="radio"
            options={LANGUAGES}
            value={language}
            onChange={choose}
          />
        </div>
      </div>
    </PhoneFrame>
  );
}
