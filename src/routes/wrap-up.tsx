import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { YunaAvatar, type AvatarVariant } from "@/components/YunaAvatar";
import { YunaMark } from "@/components/YunaMark";
import { useYunaIdentity } from "@/lib/yuna-session";
import {
  clearStoredMessages,
  loadStoredMessages,
  type ChatMsg,
} from "@/lib/chat-store";
import { keepsakeUid, saveKeepsake, type Keepsake } from "@/lib/keepsakes";
import {
  PERSONALIZED_ACTIVITIES,
  type Activity,
} from "@/lib/activities";

export const Route = createFileRoute("/wrap-up")({
  head: () => ({
    meta: [
      { title: "Session highlights — Yuna" },
      { name: "description", content: "A reflection from your conversation." },
    ],
  }),
  component: WrapUp,
});

type Status = "loading" | "ready" | "error";

// Hold the loading state for a beat even if the LLM resolves early. Keeps
// the skeleton on screen long enough to read as intentional rather than a
// flicker.
const MIN_LOADING_MS = 2500;

// What the wrap-up tells the user Yuna placed for them — the two NEW items
// from the personalized list. This is the moment the "I made these for you"
// connection gets formed; it's intentionally just two so it reads as
// curated, not a content dump.
const PLACED_FOR_YOU: Activity[] = PERSONALIZED_ACTIVITIES.filter(
  (a) => a.isNew,
).slice(0, 2);

function WrapUp() {
  const navigate = useNavigate();
  const { avatar } = useYunaIdentity();

  const [status, setStatus] = useState<Status>("loading");
  const [keepsake, setKeepsake] = useState<string>("");
  const [themes, setThemes] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const idRef = useRef<string>(keepsakeUid());

  useEffect(() => {
    const messages = loadStoredMessages();

    const textTurns = messages
      .filter((m): m is Extract<ChatMsg, { kind: "text" }> => m.kind === "text")
      .map((m) => ({
        role: m.from === "you" ? "user" : "assistant",
        content: m.text,
      }));

    let cancelled = false;
    const startedAt = Date.now();
    const waitMinimum = async () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
    };

    if (textTurns.length === 0) {
      // Empty transcript — still hold the reflective beat so the screen
      // doesn't snap straight to "ready".
      (async () => {
        await waitMinimum();
        if (cancelled) return;
        setKeepsake("Showing up at all is the part that mattered.");
        setThemes([]);
        setStatus("ready");
      })();
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const res = await fetch("/api/wrap-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: textTurns }),
        });
        if (!res.ok) throw new Error(`wrap-up ${res.status}`);
        const data = (await res.json()) as {
          keepsake?: string;
          themes?: string[];
        };
        const q = (data.keepsake ?? "").trim();
        if (!q) throw new Error("empty keepsake");
        await waitMinimum();
        if (cancelled) return;
        setKeepsake(q);
        setThemes(Array.isArray(data.themes) ? data.themes.slice(0, 3) : []);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.warn("Wrap-up generation failed", err);
        await waitMinimum();
        if (cancelled) return;
        setKeepsake("What you brought is worth carrying with you.");
        setThemes([]);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = () => {
    const k: Keepsake = {
      id: idRef.current,
      quote: keepsake,
      themes,
      note: note.trim() || undefined,
      mood: null,
      stress: null,
      createdAt: Date.now(),
    };
    saveKeepsake(k);
  };

  const onSaveToggle = () => {
    if (!saved) {
      persist();
      setSaved(true);
    } else {
      // No "unsave" UI elsewhere yet — just flip the visual.
      setSaved(false);
    }
  };

  const handleNoteBlur = () => {
    if (saved) persist();
  };

  const onDone = () => {
    if (saved) persist();
    clearStoredMessages();
    navigate({ to: "/home-returning" });
  };

  const onViewActivities = () => {
    if (saved) persist();
    clearStoredMessages();
    navigate({ to: "/activities-returning" });
  };

  const isLoading = status === "loading";

  return (
    <PhoneFrame backgroundImage="/background.png">
      <div className="flex-1 flex flex-col px-8 pt-14 pb-10 text-white min-h-0">
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto -mx-2 px-2 pb-2">
          {isLoading ? (
            <SkeletonScreen />
          ) : (
            <>
              <h1 className="font-display text-[26px] leading-tight tracking-tight text-white yuna-fade-in">
                Session highlights
              </h1>

              <HighlightCard
                avatar={avatar}
                keepsake={keepsake}
                note={note}
                onNoteChange={setNote}
                onNoteBlur={handleNoteBlur}
                saved={saved}
                onSaveToggle={onSaveToggle}
              />

              <PlacedForYou items={PLACED_FOR_YOU} />
            </>
          )}
        </div>

        <div className="pt-2 flex flex-col gap-2">
          {!isLoading && (
            <Button
              surface="dark"
              variant="ghost"
              fullWidth
              onClick={onViewActivities}
            >
              View all activities
            </Button>
          )}
          <Button surface="dark" variant="primary" fullWidth onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── Skeleton (full-screen) ──────────────────────────────────────────────────
// Stand-in for the entire wrap-up while the LLM is working. Stack mirrors
// the post-load layout (title, card, section header, two activity rows) so
// the transition feels like content settling into place rather than the
// screen reflowing.
function SkeletonScreen() {
  return (
    <div aria-busy aria-live="polite" className="flex flex-col gap-6 yuna-fade-in">
      <SkeletonBar widthClass="w-[55%]" heightClass="h-7" />

      <div className="relative rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm px-5 py-7 overflow-hidden min-h-[200px]">
        <span aria-hidden className="absolute inset-0 pointer-events-none keepsake-shimmer" />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="block h-9 w-9 rounded-full bg-white/15" />
            <span className="block h-5 w-5 rounded bg-white/15" />
          </div>
          <SkeletonBar widthClass="w-[90%]" />
          <SkeletonBar widthClass="w-[78%]" />
          <SkeletonBar widthClass="w-[55%]" />
        </div>
      </div>

      <div className="pt-1">
        <SkeletonBar widthClass="w-28" heightClass="h-3" />
      </div>

      <SkeletonRow />
      <SkeletonRow />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-4">
      <span className="h-10 w-10 shrink-0 rounded-full bg-white/15" />
      <div className="flex-1 flex flex-col gap-2 pt-1">
        <SkeletonBar widthClass="w-[55%]" heightClass="h-3" />
        <SkeletonBar widthClass="w-[80%]" />
        <SkeletonBar widthClass="w-[65%]" />
      </div>
    </div>
  );
}

function SkeletonBar({
  widthClass,
  heightClass = "h-4",
}: {
  widthClass: string;
  heightClass?: string;
}) {
  return (
    <span
      className={`block ${heightClass} rounded-full bg-white/15 ${widthClass}`}
      style={{ animation: "yuna-fade 1.6s ease-in-out infinite alternate" }}
    />
  );
}

// ── Highlight card ──────────────────────────────────────────────────────────
// Single state: the keepsake, save toggle, and note input. Loading is
// handled at the screen level by SkeletonScreen.
function HighlightCard({
  avatar,
  keepsake,
  note,
  onNoteChange,
  onNoteBlur,
  saved,
  onSaveToggle,
}: {
  avatar: AvatarVariant | null;
  keepsake: string;
  note: string;
  onNoteChange: (v: string) => void;
  onNoteBlur: () => void;
  saved: boolean;
  onSaveToggle: () => void;
}) {
  return (
    <div className="relative rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-sm px-5 py-6 flex flex-col gap-4 yuna-rise overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center bg-white/10 shrink-0">
          {avatar ? (
            <YunaAvatar variant={avatar} size={36} />
          ) : (
            <span className="h-2 w-2 rounded-full bg-white" />
          )}
        </span>
        <button
          type="button"
          onClick={onSaveToggle}
          aria-pressed={saved}
          aria-label={saved ? "Unsave highlight" : "Save highlight"}
          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors active:scale-95"
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      <p className="font-display italic text-[22px] leading-[1.35] text-white">
        {keepsake}
      </p>

      <div className="pt-2 border-t border-white/12">
        <input
          type="text"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          onBlur={onNoteBlur}
          placeholder="Add a note for yourself…"
          className="w-full bg-transparent text-sm py-2 outline-none placeholder:text-white/45 text-white"
          maxLength={140}
        />
      </div>
    </div>
  );
}

// ── Activities Yuna placed for you ──────────────────────────────────────────
function PlacedForYou({ items }: { items: Activity[] }) {
  return (
    <div className="flex flex-col gap-3 yuna-rise">
      <div className="flex items-baseline justify-between">
        <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-white/75">
          Activities for you
        </p>
        <p className="font-sans-ui text-[10px] tracking-[0.18em] uppercase text-white/55">
          From this session
        </p>
      </div>

      {items.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-4"
        >
          <span className="h-10 w-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
            <YunaMark size={20} className="text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-sans-ui text-[10px] tracking-[0.2em] uppercase text-white/65">
                {a.kind}
                {a.duration ? ` · ${a.duration}` : ""}
              </p>
              {a.isNew && (
                <span className="font-sans-ui text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-full bg-green-600 text-white">
                  New
                </span>
              )}
            </div>
            <p className="mt-1 text-[15px] leading-snug font-medium text-white">
              {a.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/70 italic">
              {a.why}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <Bookmark
      size={18}
      strokeWidth={1.5}
      aria-hidden
      className="text-white"
      fill={filled ? "currentColor" : "none"}
    />
  );
}
