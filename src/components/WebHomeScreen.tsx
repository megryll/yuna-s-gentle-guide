import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronRight } from "lucide-react";

import { WebShell, WebContent } from "@/components/WebShell";
import { Button } from "@/components/Button";
import { SuggestionChip } from "@/components/SuggestionChip";
import { YunaAvatar } from "@/components/YunaAvatar";
import { Divider } from "@/components/Divider";
import { HomeCardItem } from "@/components/HomeCards";
import { CardActionsDrawer } from "@/components/CardActionsDrawer";
import { Toast } from "@/components/Toast";
import { Confetti } from "@/components/Confetti";
import { HOME_CARDS, KIND_PLURAL, type CardKind, type HomeCard } from "@/lib/home-cards";
import { Tag } from "@/components/Tag";
import { DEFAULT_VOICE } from "@/lib/voices";
import { useYunaIdentity } from "@/lib/yuna-session";
import { useAppMode } from "@/lib/theme-prefs";
import { setContentPref, useContentPrefs } from "@/lib/content-prefs";
import { getCompletedQuestionnaireIds } from "@/lib/questionnaire-state";
import { useStartChat } from "@/lib/chat-launch";

// Returning users land mid-day with a few tasks already behind them; new users
// start with a genuinely empty day. Mirrors the phone HomeScreen.
const RETURNING_COMPLETED = ["please-technique", "strength-overcome", "feeling-check"];

const GREETINGS: { title: (name: string | null) => string; sub: string }[] = [
  { title: (n) => (n ? `Welcome back, ${n}` : "Welcome back"), sub: "What should we dig into?" },
  { title: (n) => (n ? `Good to see you, ${n}` : "Good to see you"), sub: "Where should we start today?" },
  { title: () => "Glad you're here", sub: "What would feel good to talk through today?" },
];

// Short, chip-friendly labels for the Created For You type filter (KIND_META /
// KIND_PLURAL run too long for pills). The key order also sets the chip order.
const FILTER_LABELS: Record<CardKind, string> = {
  "guided-session": "Guided Sessions",
  meditation: "Meditations",
  gratitude: "Gratitude",
  "self-discovery": "Questionnaires",
  affirmation: "Affirmations",
  "learn-skill": "Skills",
  accountability: "Goals",
  book: "Books",
};
const CARD_KIND_ORDER = Object.keys(FILTER_LABELS) as CardKind[];

export function WebHomeScreen({ variant }: { variant: "new" | "returning" }) {
  const navigate = useNavigate();
  const startChat = useStartChat();
  const { name, avatar } = useYunaIdentity();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const returning = variant === "returning";

  const [greetIdx, setGreetIdx] = useState(0);
  useEffect(() => {
    setGreetIdx(Math.floor(Math.random() * GREETINGS.length));
  }, []);
  const greeting = GREETINGS[greetIdx];

  // Returning users have already set their starting point, so that onboarding
  // card is dropped; for new users the per-card "New" flags carry no signal.
  const cards = useMemo(
    () =>
      returning
        ? HOME_CARDS.filter((c) => c.id !== "your-starting-point")
        : HOME_CARDS.map((c) => ({ ...c, isNew: false })),
    [returning],
  );

  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(cards.filter((c) => c.isSaved).map((c) => c.id)),
  );
  const [savedOnly, setSavedOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CardKind | "all">("all");
  const [completedIds, setCompletedIds] = useState<Set<string>>(() =>
    returning ? new Set(RETURNING_COMPLETED) : new Set(),
  );
  useEffect(() => {
    const done = getCompletedQuestionnaireIds();
    if (done.length) setCompletedIds((prev) => new Set([...prev, ...done]));
  }, []);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [menuCard, setMenuCard] = useState<HomeCard | null>(null);

  const toggleSave = (id: string) =>
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Top-center confirmation toast (neutral) / celebration (success).
  const [toast, setToast] = useState<{ message: string; variant: "neutral" | "success" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string, v: "neutral" | "success" = "neutral") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, variant: v });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };
  useEffect(() => () => void (toastTimer.current && clearTimeout(toastTimer.current)), []);

  const [burstKey, setBurstKey] = useState(0);
  const completeGoal = (card: HomeCard) => {
    if (completedIds.has(card.id)) return;
    setCompletedIds((prev) => new Set(prev).add(card.id));
    setBurstKey((k) => k + 1);
    showToast("Goal complete. Way to follow through.", "success");
  };

  const toggleComplete = () => {
    if (!menuCard) return;
    const id = menuCard.id;
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMenuCard(null);
  };
  const dismissCard = () => {
    if (!menuCard) return;
    setDismissedIds((prev) => new Set(prev).add(menuCard.id));
    setMenuCard(null);
  };
  const stopSeeing = () => {
    if (!menuCard) return;
    setContentPref(menuCard.type, false);
    showToast(`You'll stop seeing ${KIND_PLURAL[menuCard.type]}.`);
    setMenuCard(null);
  };
  const managePreferences = () => {
    setMenuCard(null);
    navigate({ to: "/settings/content-preferences" });
  };

  const openCard = (c: HomeCard) => {
    if (c.type === "accountability") return completeGoal(c);
    if (c.type === "book") return void navigate({ to: "/book/$id", params: { id: c.id } });
    if (c.type === "learn-skill") return void navigate({ to: "/skill/$id", params: { id: c.id } });
    if (c.type === "gratitude") return void navigate({ to: "/gratitude" });
    if (c.type === "guided-session") return void startChat({ q: c.title, guided: c.title });
    if (c.type === "self-discovery") {
      if (c.id === "your-starting-point")
        navigate({ to: "/questionnaire/$id", params: { id: c.id } });
      return;
    }
    startChat({ q: openPrompt(c) });
  };

  const prefs = useContentPrefs();
  const base = cards.filter((c) => !dismissedIds.has(c.id) && prefs[c.type] !== false);
  // Chips reflect only the kinds actually present, in a stable order.
  const availableTypes = CARD_KIND_ORDER.filter((k) => base.some((c) => c.type === k));
  const typeFiltered = typeFilter === "all" ? base : base.filter((c) => c.type === typeFilter);
  const visible = savedOnly ? typeFiltered.filter((c) => savedIds.has(c.id)) : typeFiltered;
  const incomplete = visible.filter((c) => !completedIds.has(c.id));
  const done = visible.filter((c) => completedIds.has(c.id));

  // Masonry grid — varied card heights flow into balanced columns, a more
  // web-native layout than the phone's single stacked column.
  const grid = (list: HomeCard[]) => (
    <div className="columns-1 sm:columns-2 xl:columns-3 gap-5">
      {list.map((c, i) => (
        <div
          key={c.id}
          className="mb-5 break-inside-avoid yuna-rise"
          style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
        >
          <HomeCardItem
            card={c}
            isSaved={savedIds.has(c.id)}
            completed={completedIds.has(c.id)}
            onClick={() => openCard(c)}
            onMenu={() => setMenuCard(c)}
            onToggleSave={() => toggleSave(c.id)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <WebShell>
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,420px)]">
          <Toast
            variant={toast.variant}
            surface={surface}
            message={toast.message}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}
      {burstKey > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[55] overflow-hidden">
          <Confetti key={burstKey} />
        </div>
      )}

      <WebContent>
        <header className="yuna-rise text-center">
          <h1 className="font-display text-3xl lg:text-4xl leading-tight tracking-tight text-white">
            {returning ? greeting.title(name) : "Welcome in"}
          </h1>
          <p className="mt-2 text-base text-white/80">
            {returning ? greeting.sub : "I'll be here when you're ready to chat."}
          </p>
          <div className="mt-6 flex justify-center">
            <SuggestionChip
              onClick={() => startChat({ q: "Chat Now", mode: "voice" })}
              leading={
                <span className="block shrink-0 -my-2 -ml-3">
                  <YunaAvatar variant={avatar ?? DEFAULT_VOICE} size={52} className="block" />
                </span>
              }
            >
              Chat Now
            </SuggestionChip>
          </div>
        </header>

        <section className="mt-12">
          <div className="flex items-center justify-between gap-3 mb-5">
            <p className="text-xs tracking-[0.25em] uppercase text-white/70">Created For You</p>
            <Button
              surface={surface}
              variant="secondary"
              size="icon-sm"
              pressed={savedOnly}
              onClick={() => setSavedOnly((v) => !v)}
              aria-label={savedOnly ? "Show all activities" : "Show saved only"}
            >
              <Bookmark strokeWidth={1.75} fill={savedOnly ? "currentColor" : "none"} aria-hidden />
            </Button>
          </div>

          {availableTypes.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-5">
              <Tag
                surface={surface}
                selected={typeFilter === "all"}
                onClick={() => setTypeFilter("all")}
              >
                All
              </Tag>
              {availableTypes.map((k) => (
                <Tag
                  key={k}
                  surface={surface}
                  selected={typeFilter === k}
                  onClick={() => setTypeFilter(k)}
                >
                  {FILTER_LABELS[k]}
                </Tag>
              ))}
            </div>
          )}

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/25 bg-white/[0.04] px-6 py-10 text-center yuna-rise">
              <p className="text-sm text-white/80">No saved items yet</p>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                Bookmark anything Yuna shares to keep it close.
              </p>
            </div>
          ) : (
            <>
              {grid(incomplete)}
              {done.length > 0 && (
                <>
                  <Divider surface={surface} label="Completed Today" className="mt-10 mb-6" />
                  {grid(done)}
                  <div className="mt-6 flex justify-center">
                    <Button
                      surface={surface}
                      variant="link"
                      onClick={() => navigate({ to: "/completed-tasks" })}
                      className="inline-flex items-center gap-1.5"
                    >
                      All completed tasks
                      <ChevronRight size={16} strokeWidth={2} aria-hidden />
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </WebContent>

      <CardActionsDrawer
        card={menuCard}
        completed={!!menuCard && completedIds.has(menuCard.id)}
        onOpenChange={(o) => {
          if (!o) setMenuCard(null);
        }}
        onToggleComplete={toggleComplete}
        onDismiss={dismissCard}
        onStopSeeing={stopSeeing}
        onManagePreferences={managePreferences}
      />
    </WebShell>
  );
}

function openPrompt(c: HomeCard): string {
  switch (c.type) {
    case "guided-session":
    case "meditation":
    case "self-discovery":
    case "learn-skill":
      return c.title;
    case "gratitude":
      return c.prompt;
    case "affirmation":
      return c.quote;
    case "accountability":
      return c.goal;
    case "book":
      return `${c.title} by ${c.author}`;
  }
}
