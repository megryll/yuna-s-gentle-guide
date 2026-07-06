import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, SlidersHorizontal, Clock, Sprout, MoveHorizontal } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { PageHeader } from "@/components/PageHeader";
import { Toast, ToastViewport } from "@/components/Toast";
import { Surface } from "@/components/Surface";
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
  preferencesAppliedThisSession,
  getAppointments,
} from "@/lib/therapist-prefs";
import { getUserType, useUserType } from "@/lib/user-type";
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
  // A "New" user starts at the pre-survey teaser on every fresh page load: a
  // preferencesApplied flag restored from a previous session's localStorage is
  // stale for them. A flag set *this* session is the survey's own completion
  // hand-off and must survive the mount, so it's exempt.
  // …unless a booked appointment exists: the journey is mid-flight (the hub's
  // "Browse more therapists" lands here), so a fresh-load reset would silently
  // cancel the booking. Only the explicit admin toggle flip resets past one.
  useEffect(() => {
    if (getUserType() === "new" && !preferencesAppliedThisSession() && getAppointments().length === 0)
      resetTherapistPrefs();
  }, []);

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
          <Teaser
            surface={surface}
            onStart={() => navigate({ to: "/therapist-preferences", search: { step: 0 } })}
          />
        ) : (
          // One vertical scroll owns the title, hint, card, and buttons, so on a
          // short frame (SE) everything scrolls together and nothing is clipped
          // or sits under a fixed footer. The carousel inside only scrolls
          // horizontally for swiping.
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <h1
              className={`shrink-0 px-6 font-display text-3xl tracking-tight text-white text-center ${
                isSE ? "pt-4" : "pt-6"
              }`}
            >
              Therapist Recommendations
            </h1>
            {matched.length > 1 && (
              <p className="shrink-0 flex items-center justify-center gap-2 px-6 pt-3 pb-2 text-sm font-medium text-white/75">
                <MoveHorizontal size={16} strokeWidth={2} aria-hidden /> Swipe to browse therapists
              </p>
            )}
            <Carousel
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
          </div>
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
        Find a therapist who truly fits you.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/85 max-w-[17rem]">
        Answer a few questions about what matters to you, your location, and coverage. Then meet the therapists Yuna matches to you.
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
      <div className="flex-1 flex flex-col justify-center px-6 yuna-fade-in">
        <Surface dashed surface={surface} className="px-4 py-6 text-center">
          <p className="text-sm text-white/80">No saved therapists yet</p>
          <p className="mt-1 text-xs text-white/60 leading-relaxed">
            Tap the bookmark on any therapist to save them here for later.
          </p>
        </Surface>
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

// ─── Carousel ────────────────────────────────────────────────────────────────

// Carousel geometry: each slide is the scroller's full content width (`w-full`),
// so a centred card shows the `px-9` gutter (36px) on each side and the
// neighbour peeks ~32px (gutter 36px − the 4px `gap-1`). The gutter is real
// scrollable padding, so snap-center can bring even the first/last card to the
// middle. Gutter and gap are the two dials — change the `px-9` / `gap-1` pair.

function Carousel({
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ticking = useRef(false);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const snapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Set when a dismissal is about to remove a card: the index (in the trimmed
  // list) of the card we glided to, so the layout effect can re-anchor scroll
  // to it before the browser paints the shorter list — no visible jump.
  const reanchorTo = useRef<number | null>(null);
  const hasFilters = countFilters(filters) > 0;

  // "Not interested" removes a card from the deck for this visit (ephemeral —
  // not persisted; Start over brings them back). Filter the matched set down to
  // what's still in play.
  const visible = useMemo(
    () => therapists.filter((t) => !dismissed.has(t.id)),
    [therapists, dismissed],
  );

  // When the matched set changes (filters applied/cleared), jump back to the
  // first card and forget dismissals so the indicator and scroll position stay
  // in sync with the fresh list.
  useEffect(() => {
    setActive(0);
    setDismissed(new Set());
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [therapists]);

  useEffect(() => () => clearTimeout(snapTimer.current), []);

  // After a dismissal trims the list, re-anchor scroll (pre-paint) to the card
  // we glided to. Removing a card to its left shifts everything left one pitch,
  // so we'd otherwise see the kept card jump; setting scrollLeft here, before
  // paint, makes the removal invisible. Snap is restored for subsequent swipes.
  useLayoutEffect(() => {
    const kept = reanchorTo.current;
    if (kept == null) return;
    reanchorTo.current = null;
    const el = scrollerRef.current;
    const step = slidePitch();
    if (el) {
      if (step > 0) el.scrollLeft = kept * step;
      el.style.scrollSnapType = "";
    }
    setActive(Math.min(kept, Math.max(0, visible.length - 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Distance between adjacent slide centres (equal-width slides + gap). The
  // centred card's index is scrollLeft / pitch.
  const slidePitch = () => {
    const el = scrollerRef.current;
    if (!el || el.children.length < 2) return 0;
    const a = el.children[0] as HTMLElement;
    const b = el.children[1] as HTMLElement;
    return b.offsetLeft - a.offsetLeft;
  };
  const nearestIndex = (scrollLeft: number, step: number) =>
    Math.min(visible.length - 1, Math.max(0, Math.round(scrollLeft / step)));

  // Read the centred card off the scroll position (rAF-throttled).
  const onScroll = () => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      const el = scrollerRef.current;
      const step = slidePitch();
      if (!el || step <= 0) return;
      setActive(nearestIndex(el.scrollLeft, step));
    });
  };

  // Mouse drag-to-swipe (desktop). Touch/trackpad already pan a scroll-snap
  // container natively, so we only hijack mouse pointers: snap is switched off
  // during the drag, then we glide to the nearest card and switch it back on.
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false };
    el.style.scrollSnapType = "none";
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current.active) return;
    const el = scrollerRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.startLeft - dx;
  };
  const endDrag = () => {
    const el = scrollerRef.current;
    if (!drag.current.active || !el) return;
    drag.current.active = false;
    const step = slidePitch();
    if (step > 0) el.scrollTo({ left: nearestIndex(el.scrollLeft, step) * step, behavior: "smooth" });
    // Re-enable snapping once the glide settles, so it doesn't fight the scroll.
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      if (scrollerRef.current) scrollerRef.current.style.scrollSnapType = "";
    }, 400);
  };
  // A drag ends in a click on whatever card was under the cursor; swallow it so
  // a swipe doesn't also open a profile. A genuine tap (no move) passes through.
  const onClickCapture = (e: ReactMouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  // "Not interested": glide to the neighbour like a swipe, then drop the
  // dismissed card once the glide settles (re-anchored in the layout effect so
  // it doesn't pop). Prefer the card to the right; fall back to the left when
  // dismissing the last one. With no neighbour, just remove it (done state).
  const dismiss = (id: string, index: number) => {
    const el = scrollerRef.current;
    const step = slidePitch();
    if (!el || step <= 0 || visible.length <= 1) {
      setDismissed((prev) => new Set(prev).add(id));
      return;
    }
    const goingRight = index < visible.length - 1;
    const target = goingRight ? index + 1 : index - 1;
    el.scrollTo({ left: target * step, behavior: "smooth" });
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      // Index of the kept (glided-to) card once `id` leaves the list.
      reanchorTo.current = goingRight ? index : index - 1;
      setDismissed((prev) => new Set(prev).add(id));
    }, 360);
  };

  if (therapists.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 yuna-fade-in">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full ${frostedPanel(surface)}`}>
          <Sprout size={28} className="text-white" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl tracking-tight text-white">No matches right now</h2>
        <p className="mt-2 text-sm leading-snug text-white/85 max-w-[18rem]">
          Your current preferences are narrowing things down. Clear a few to see more options.
        </p>
        {hasFilters && (
          <Button surface={surface} variant="secondary" onClick={onClearFilters} className="mt-7">
            Clear preferences
          </Button>
        )}
      </div>
    );
  }

  // Everyone was passed on. Offer a fresh start (un-dismiss) and, if filters are
  // narrowing the pool, a way to widen it.
  if (visible.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 yuna-fade-in">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full ${frostedPanel(surface)}`}>
          <Sprout size={28} className="text-white" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl tracking-tight text-white">That&apos;s everyone for now</h2>
        <p className="mt-2 text-sm leading-snug text-white/85 max-w-[18rem]">
          You&apos;ve gone through all your matches. Start over to revisit them
          {hasFilters ? ", or clear your preferences to see more." : "."}
        </p>
        <Button surface={surface} variant="primary" onClick={() => setDismissed(new Set())} className="mt-7">
          Start over
        </Button>
        {hasFilters && (
          <Button surface={surface} variant="secondary" onClick={onClearFilters} className="mt-3">
            Clear preferences
          </Button>
        )}
      </div>
    );
  }

  return (
    // shrink-0: keep full content height so the parent vertical scroll engages
    // instead of the flex column squeezing this down and clipping the card.
    <div className="shrink-0 pt-4 pb-6">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className="flex items-start gap-1 px-9 overflow-x-auto snap-x snap-mandatory overscroll-x-contain select-none cursor-grab active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visible.map((t, i) => (
          <div
            key={t.id}
            className="snap-center shrink-0 w-full flex items-start"
          >
            <div
              className="w-full flex transition-transform duration-300 ease-out"
              style={{ transform: active === i ? "scale(1)" : "scale(0.93)" }}
            >
              <TherapistCard
                className="w-full"
                surface={surface}
                name={t.name}
                credentials={t.credentials}
                location={t.location}
                photo={t.photo}
                tags={t.tags}
                virtual={t.sessionFormats.includes("Video")}
                description={t.bio}
                saved={savedIds.includes(t.id)}
                onToggleSave={() => toggleSaved(t.id)}
                onView={() => onView(t.id)}
                onDismiss={() => dismiss(t.id, i)}
              />
            </div>
          </div>
        ))}
      </div>

      {hasFilters && (
        <div className="flex justify-center pt-4">
          <Tag surface={surface} variant="informational">
            {countFilters(filters)} preference{countFilters(filters) === 1 ? "" : "s"} applied
          </Tag>
        </div>
      )}
    </div>
  );
}
