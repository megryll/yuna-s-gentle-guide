import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { WebShell, WebContent } from "@/components/WebShell";
import { PageHeader } from "@/components/PageHeader";
import { MultipleChoice } from "@/components/MultipleChoice";
import { useAppMode } from "@/lib/theme-prefs";
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
    <WebShell>
      <div className={"text-foreground " + (mode === "dark" ? "overlay-on-dark" : "")}>
        <WebContent width="max-w-2xl">
          <PageHeader
            title="Session Language"
            tone="ink"
            layout="inline"
            className="px-0 pt-0 pb-0"
            onBack={() => navigate({ to: "/settings" })}
          />

          <div className="mt-6 flex flex-col gap-5">
            <p className="text-sm leading-relaxed text-foreground/75">
              Select your preferred language. Yuna will guide your sessions in the language you choose.
            </p>

            <MultipleChoice
              surface="light"
              ariaLabel="Session language"
              options={LANGUAGES}
              value={language}
              onChange={choose}
            />
          </div>
        </WebContent>
      </div>
    </WebShell>
  );
}
