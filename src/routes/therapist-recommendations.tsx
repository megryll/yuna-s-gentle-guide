import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, SlidersHorizontal, Clock, Sprout } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { PageHeader } from "@/components/PageHeader";
import { Toast, ToastViewport } from "@/components/Toast";
import { YunaAvatar } from "@/components/YunaAvatar";
import { TherapistCard, TherapistPhoto, frostedPanel } from "@/components/TherapistCard";
import {
  TherapistFiltersDrawer,
  EMPTY_FILTERS,
  countFilters,
  type TherapistFilters,
} from "@/components/TherapistFiltersDrawer";
import { useAppMode } from "@/lib/theme-prefs";
import { useFrameSize } from "@/lib/frame-size";
import { useTransientToast } from "@/lib/use-transient-toast";
import {
  usePreferencesApplied,
  useSavedIds,
  toggleSaved,
  setPreferencesApplied,
  resetTherapistPrefs,
} from "@/lib/therapist-prefs";
import { useUserType } from "@/lib/user-type";
import { matchedTherapists, getTherapist, type Therapist } from "@/lib/therapist-data";

export const Route = createFileRoute("/therapist-recommendations")({
  head: () => ({ meta: [{ title: "Therapist Recommendations — Yuna" }] }),
  component: RecommendationsRoute,
});

function applyFilters(list: Therapist[], f: TherapistFilters): Therapist[] {
  const overlaps = (a: string[], b: string[]) => a.some((x) => b.includes(x));
  return list.filter((t) => {
    if (f.format === "Online" && !t.sessionFormats.includes("Video")) return false;
    if (f.format === "In person" && !t.sessionFormats.includes("In-person")) return false;
    if (f.specialties.length && !overlaps(f.specialties, [...t.issues, ...t.tags])) return false;
    if (f.approaches.length && !overlaps(f.approaches, [...t.modalities, ...t.tags])) return false;
    if (f.insurance.length && !overlaps(f.insurance, t.insurance)) return false;
    return true;
  });
}

function RecommendationsRoute() {
  const navigate = useNavigate();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const isSE = useFrameSize().id === "se";
  const preferencesApplied = usePreferencesApplied();
  const savedIds = useSavedIds();

  const [showSaved, setShowSaved] = useState(false);
  const [filters, setFilters] = useState<TherapistFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { message: toast, show: flashToast, dismiss } = useTransientToast();

  // The admin "New" / "Returning" toggle drives the screen's starting state:
  // flipping to "New" resets to the pre-survey teaser (no saved, prefs cleared),
  // "Returning" lands straight on the deck. Only react to an actual toggle
  // change (prevUserType) so the survey's own setPreferencesApplied → navigate
  // back here isn't clobbered on mount. Mirrors goals.tsx.
  const userType = useUserType();
  const prevUserType = useRef(userType);
  useEffect(() => {
    if (prevUserType.current === userType) return;
    prevUserType.current = userType;
    if (userType === "new") {
      resetTherapistPrefs();
      setShowSaved(false);
      setFilters(EMPTY_FILTERS);
    } else {
      setPreferencesApplied(true);
    }
  }, [userType]);

  const all = useMemo(() => matchedTherapists(), []);
  const matched = useMemo(() => applyFilters(all, filters), [all, filters]);
  const savedList = useMemo(
    () => savedIds.map((id) => getTherapist(id)).filter(Boolean) as Therapist[],
    [savedIds],
  );
  const activeCount = countFilters(filters);

  const openProfile = (id: string) =>
    navigate({ to: "/therapist-profile/$id", params: { id } });

  return (
    <PhoneFrame themed>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top bar */}
        <PageHeader
          surface={surface}
          onBack={() => navigate({ to: "/tools" })}
          trailing={
            <>
              <Button
                surface={surface}
                variant={showSaved ? "primary" : "secondary"}
                size="icon"
                aria-label="Saved therapists"
                aria-pressed={showSaved}
                onClick={() => setShowSaved((v) => !v)}
              >
                <Bookmark strokeWidth={1.75} fill={savedIds.length && showSaved ? "currentColor" : "none"} />
              </Button>
              <Button
                surface={surface}
                variant={activeCount ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal size={14} strokeWidth={2} aria-hidden className="mr-1" />
                Preferences{activeCount ? ` · ${activeCount}` : ""}
              </Button>
            </>
          }
        />

        {/* Body */}
        {showSaved ? (
          <SavedView surface={surface} list={savedList} savedIds={savedIds} onView={openProfile} />
        ) : !preferencesApplied ? (
          <Teaser surface={surface} onStart={() => navigate({ to: "/therapist-preferences" })} />
        ) : (
          <>
            <h1
              className={`shrink-0 px-6 font-display text-3xl tracking-tight text-white text-center ${
                isSE ? "pt-4" : "pt-6 pb-2"
              }`}
            >
              Therapist Recommendations
            </h1>
            <Deck
              surface={surface}
              therapists={matched}
              savedIds={savedIds}
              filters={filters}
              onView={openProfile}
              onClearFilters={() => {
                setFilters(EMPTY_FILTERS);
                flashToast("Preferences cleared. Showing more matches.");
              }}
            />
          </>
        )}

        {toast && (
          <ToastViewport>
            <Toast
              surface={surface}
              variant="success"
              message={toast}
              onDismiss={dismiss}
              className="yuna-fade-in"
            />
          </ToastViewport>
        )}
      </div>

      <TherapistFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
        onApply={() => {
          setFiltersOpen(false);
          flashToast("Your preferences have been applied.");
        }}
      />
    </PhoneFrame>
  );
}

// ─── Teaser (pre-survey) ─────────────────────────────────────────────────────

function Teaser({ surface, onStart }: { surface: "dark" | "light"; onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 yuna-fade-in">
      <div className="flex -space-x-2">
        {["/therapists/kerstin.jpg", "/therapists/mira.jpg", "/therapists/leo.jpg"].map((src) => (
          <TherapistPhoto key={src} src={src} size={44} className="ring-2 ring-white/40" />
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold text-white/85">500+ therapists to match with</p>
      <h1 className="mt-5 font-display text-3xl leading-tight tracking-tight text-white max-w-[18rem]">
        Find a therapist who truly fits you
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/85 max-w-[17rem]">
        Answer a few questions about your focus, insurance, and preferences. Then meet the therapists Yuna matches to you.
      </p>
      <Button surface={surface} variant="primary" fullWidth onClick={onStart} className="mt-8 max-w-xs">
        Take the preferences survey
      </Button>
      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-white/75">
        <Clock size={15} strokeWidth={2} aria-hidden /> About 2 minutes
      </p>
    </div>
  );
}

// ─── Saved view ──────────────────────────────────────────────────────────────

function SavedView({
  surface,
  list,
  savedIds,
  onView,
}: {
  surface: "dark" | "light";
  list: Therapist[];
  savedIds: string[];
  onView: (id: string) => void;
}) {
  if (list.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 yuna-fade-in">
        <YunaAvatar size={56} />
        <h1 className="mt-5 font-display text-2xl tracking-tight text-white">No saved therapists yet</h1>
        <p className="mt-2 text-sm leading-snug text-white/85 max-w-[16rem]">
          Tap the bookmark on any therapist to save them here for later.
        </p>
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-8 flex flex-col gap-3 yuna-fade-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <h1 className="font-display text-3xl tracking-tight text-white">Saved</h1>
      {list.map((t) => (
        <TherapistCard
          key={t.id}
          surface={surface}
          variant="list"
          name={t.name}
          credentials={t.credentials}
          photo={t.photo}
          saved={savedIds.includes(t.id)}
          onToggleSave={() => toggleSaved(t.id)}
          onView={() => onView(t.id)}
        />
      ))}
    </div>
  );
}

// ─── Swipe deck ──────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 90;

function Deck({
  surface,
  therapists,
  savedIds,
  filters,
  onView,
  onClearFilters,
}: {
  surface: "dark" | "light";
  therapists: Therapist[];
  savedIds: string[];
  filters: TherapistFilters;
  onView: (id: string) => void;
  onClearFilters: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  // The card currently flying off-screen, rendered as its own element so the
  // dismissed card leaves while the next one grows into place underneath.
  const [exit, setExit] = useState<{ t: Therapist; dir: "left" | "right"; fromX: number } | null>(null);
  const dragging = useRef(false);
  const startX = useRef(0);

  const atEnd = index >= therapists.length;
  const hasFilters = countFilters(filters) > 0;

  const advance = (dir: "left" | "right") => {
    const t = therapists[index];
    if (!t) return;
    setExit({ t, dir, fromX: dragX });
    dragging.current = false;
    setDragX(0);
    setIndex((i) => i + 1);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (exit) return; // ignore input mid-exit
    dragging.current = true;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging.current) return;
    setDragX(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragX <= -SWIPE_THRESHOLD) advance("left");
    else if (dragX >= SWIPE_THRESHOLD) advance("right");
    else setDragX(0);
  };

  if (atEnd && !exit) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 yuna-fade-in">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full ${frostedPanel(surface)}`}>
          <Sprout size={28} className="text-white" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl tracking-tight text-white">You've seen them all</h2>
        <p className="mt-2 text-sm leading-snug text-white/85 max-w-[18rem]">
          {hasFilters
            ? "Those fit your current preferences. Clear a few to see more options."
            : "Those were all of the therapists Yuna matched to you for now."}
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          {hasFilters && (
            <Button surface={surface} variant="secondary" onClick={onClearFilters}>
              Clear preferences
            </Button>
          )}
          <Button surface={surface} variant="primary" onClick={() => setIndex(0)}>
            Review again
          </Button>
        </div>
      </div>
    );
  }

  // Up to 3 cards, front to back. Each is keyed by id and positioned purely by
  // its depth, so when the deck advances the card behind keeps the same element
  // and its transform transitions from the peek pose to the front pose — it
  // grows into view instead of a fresh card sliding in. All cards are opaque so
  // none bleed through during the move.
  const stack = therapists.slice(index, index + 3);

  return (
    <div className="flex-1 min-h-0 relative px-6 pt-5 pb-8">
      <div className="relative h-full">
        {stack.map((t, depth) => {
          const isTop = depth === 0;
          const transform = isTop
            ? `translateX(${dragX}px) rotate(${dragX / 22}deg)`
            : `translateY(${depth * -14}px) scale(${1 - depth * 0.05})`;
          return (
            <div
              key={t.id}
              aria-hidden={!isTop}
              className={"absolute inset-x-0 top-0 " + (isTop ? "touch-none" : "pointer-events-none")}
              style={{
                transform,
                transition: isTop && dragging.current ? "none" : "transform 0.34s ease",
                zIndex: 20 - depth,
              }}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
              onPointerCancel={isTop ? onPointerUp : undefined}
            >
              <TherapistCard
                surface={surface}
                name={t.name}
                credentials={t.credentials}
                location={t.location}
                photo={t.photo}
                tags={t.tags}
                matchNote={t.yunaMatch}
                saved={savedIds.includes(t.id)}
                onToggleSave={() => toggleSaved(t.id)}
                onDismiss={() => advance("left")}
                onView={() => onView(t.id)}
              />
            </div>
          );
        })}

        {exit && (
          <ExitingCard
            key={`exit-${exit.t.id}`}
            therapist={exit.t}
            dir={exit.dir}
            fromX={exit.fromX}
            surface={surface}
            saved={savedIds.includes(exit.t.id)}
            onDone={() => setExit(null)}
          />
        )}
      </div>

      {/* Active filter chips, removable */}
      {hasFilters && (
        <div className="absolute bottom-2 inset-x-6 flex flex-wrap justify-center gap-2">
          <Tag surface={surface} variant="informational">
            {countFilters(filters)} preference{countFilters(filters) === 1 ? "" : "s"} applied
          </Tag>
        </div>
      )}
    </div>
  );
}

// The just-dismissed card: mounts at the release position, then on the next
// frame transitions off-screen in the swipe direction and unmounts. Separate
// from the stack so it can leave while the next card grows into place.
function ExitingCard({
  therapist,
  dir,
  fromX,
  surface,
  saved,
  onDone,
}: {
  therapist: Therapist;
  dir: "left" | "right";
  fromX: number;
  surface: "dark" | "light";
  saved: boolean;
  onDone: () => void;
}) {
  const [off, setOff] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOff(true));
    const timer = setTimeout(() => onDoneRef.current(), 360);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  const x = off ? (dir === "left" ? -640 : 640) : fromX;
  const rotate = off ? (dir === "left" ? -16 : 16) : fromX / 22;

  return (
    <div
      aria-hidden
      className="absolute inset-x-0 top-0 pointer-events-none"
      style={{
        transform: `translateX(${x}px) rotate(${rotate}deg)`,
        opacity: off ? 0 : 1,
        transition: "transform 0.36s ease, opacity 0.36s ease",
        zIndex: 30,
      }}
    >
      <TherapistCard
        surface={surface}
        name={therapist.name}
        credentials={therapist.credentials}
        location={therapist.location}
        photo={therapist.photo}
        tags={therapist.tags}
        matchNote={therapist.yunaMatch}
        saved={saved}
        onToggleSave={() => {}}
        onDismiss={() => {}}
        onView={() => {}}
      />
    </div>
  );
}
