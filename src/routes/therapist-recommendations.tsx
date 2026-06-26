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
import { Bookmark, SlidersHorizontal, Clock, Sprout, MoveHorizontal, Loader2 } from "lucide-react";
import { WebShell, WebContent } from "@/components/WebShell";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { Toast, ToastViewport } from "@/components/Toast";
import { Surface } from "@/components/Surface";
import { TherapistCard, TherapistPhoto, frostedPanel } from "@/components/TherapistCard";
import {
  TherapistFiltersDrawer,
  TherapistFiltersPanel,
  EMPTY_FILTERS,
  countFilters,
  type TherapistFilters,
} from "@/components/TherapistFiltersDrawer";
import { useAppMode } from "@/lib/theme-prefs";
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

// md breakpoint (768px): drives whether Preferences open as the docked right
// rail (desktop) or the bottom sheet (mobile). Both are toggled by the same
// header button via `filtersOpen`.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isDesktop;
}

function RecommendationsRoute() {
  const navigate = useNavigate();
  const surface = useAppMode() === "light" ? "light" : "dark";
  const isDesktop = useIsDesktop();
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
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    flashToast("Preferences cleared. Showing more matches.");
  };

  return (
    <WebShell>
      {/* md+ is a two-pane layout: the content column plus a right-edge
          Preferences rail that expands/collapses via the header toggle. Mobile
          opens the same filters in a bottom sheet instead. */}
      <div className="md:flex">
        <div className="flex flex-col items-center flex-1 min-w-0 min-h-[100svh] md:min-h-screen">
          {!preferencesApplied ? (
            <Teaser surface={surface} onStart={() => navigate({ to: "/therapist-preferences" })} />
          ) : (
            // Home-tab layout: WebContent well (max-w-6xl + px/py), a centered
            // hero title, and a section row whose trailing edge holds the Saved
            // toggle (mirrors home's "Created For You" + bookmark).
            <WebContent>
              <header className="text-center yuna-fade-in">
                <h1 className="font-display text-3xl lg:text-4xl leading-tight tracking-tight text-white">
                  {showSaved ? "Saved" : "Therapist Recommendations"}
                </h1>
              </header>

              <section className="mt-10 lg:mt-12">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <p className="text-xs tracking-[0.25em] uppercase text-white/70">
                    {showSaved ? "Saved therapists" : "Recommended for you"}
                  </p>
                  <div className="flex items-center gap-2">
                    {!showSaved && (
                      <Button
                        surface={surface}
                        variant={activeCount ? "primary" : "secondary"}
                        size="sm"
                        pressed={filtersOpen}
                        aria-expanded={filtersOpen}
                        onClick={() => setFiltersOpen((v) => !v)}
                      >
                        <SlidersHorizontal size={14} strokeWidth={2} aria-hidden className="mr-1" />
                        Preferences{activeCount ? ` · ${activeCount}` : ""}
                      </Button>
                    )}
                    <Button
                      surface={surface}
                      variant="secondary"
                      size="icon-sm"
                      pressed={showSaved}
                      aria-label={showSaved ? "Show recommendations" : "Show saved therapists"}
                      onClick={() => setShowSaved((v) => !v)}
                    >
                      <Bookmark strokeWidth={1.75} fill={savedIds.length && showSaved ? "currentColor" : "none"} aria-hidden />
                    </Button>
                  </div>
                </div>

                {showSaved ? (
                  <SavedView surface={surface} list={savedList} savedIds={savedIds} onView={openProfile} />
                ) : (
                  <>
                    {matched.length > 1 && (
                      <p className="md:hidden flex items-center justify-center gap-2 pb-4 text-sm font-medium text-white/75">
                        <MoveHorizontal size={16} strokeWidth={2} aria-hidden /> Swipe to browse therapists
                      </p>
                    )}
                    {/* Mobile: swipe deck (screen-level by design). */}
                    <div className="md:hidden">
                      <Carousel
                        surface={surface}
                        therapists={matched}
                        savedIds={savedIds}
                        filters={filters}
                        onView={openProfile}
                        onClearFilters={clearFilters}
                      />
                    </div>
                    {/* md+: browse grid. */}
                    <div className="hidden md:block">
                      <Grid
                        surface={surface}
                        therapists={matched}
                        savedIds={savedIds}
                        filters={filters}
                        onView={openProfile}
                        onClearFilters={clearFilters}
                      />
                    </div>
                  </>
                )}
              </section>

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
            </WebContent>
          )}
        </div>

        {/* Right-edge Preferences rail (md+) — expands/collapses with the header
            toggle. Mirrors the left nav: bordered, full-height, on the photo. */}
        {preferencesApplied && !showSaved && filtersOpen && (
          <aside
            aria-label="Preferences"
            className="hidden md:flex sticky top-0 h-screen w-72 shrink-0 flex-col border-l border-white/15 px-4 lg:px-5 py-6 text-white overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex items-center justify-between mb-1 px-1">
              <h2 className="font-display text-2xl tracking-tight">Preferences</h2>
              <Button surface={surface} variant="link" onClick={() => setFilters(EMPTY_FILTERS)}>
                Reset
              </Button>
            </div>
            <TherapistFiltersPanel
              surface={surface}
              filters={filters}
              onChange={setFilters}
              dividerClass="border-white/25"
            />
          </aside>
        )}
      </div>

      {/* Mobile: the same filters as a bottom sheet (md+ uses the rail above). */}
      <TherapistFiltersDrawer
        open={filtersOpen && !isDesktop}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
        onApply={() => {
          setFiltersOpen(false);
          flashToast("Your preferences have been applied.");
        }}
      />
    </WebShell>
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
      <h1 className="mt-5 font-display text-3xl leading-tight tracking-tight text-white max-w-md">
        Find a therapist who truly fits you.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/85 max-w-md">
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
      <div className="w-full max-w-md mx-auto yuna-fade-in">
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
    <div className="flex flex-col gap-3 w-full max-w-2xl yuna-fade-in">
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

// ─── Empty states (shared by Carousel + Grid) ───────────────────────────────

function NoMatches({
  surface,
  hasFilters,
  onClearFilters,
}: {
  surface: "dark" | "light";
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <>
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
    </>
  );
}

function AllSeen({
  surface,
  hasFilters,
  onStartOver,
  onClearFilters,
}: {
  surface: "dark" | "light";
  hasFilters: boolean;
  onStartOver: () => void;
  onClearFilters: () => void;
}) {
  return (
    <>
      <span className={`flex h-16 w-16 items-center justify-center rounded-full ${frostedPanel(surface)}`}>
        <Sprout size={28} className="text-white" aria-hidden />
      </span>
      <h2 className="mt-5 font-display text-2xl tracking-tight text-white">That&apos;s everyone for now</h2>
      <p className="mt-2 text-sm leading-snug text-white/85 max-w-[18rem]">
        You&apos;ve gone through all your matches. Start over to revisit them
        {hasFilters ? ", or clear your preferences to see more." : "."}
      </p>
      <Button surface={surface} variant="primary" onClick={onStartOver} className="mt-7">
        Start over
      </Button>
      {hasFilters && (
        <Button surface={surface} variant="secondary" onClick={onClearFilters} className="mt-3">
          Clear preferences
        </Button>
      )}
    </>
  );
}

// End-of-list footer: once every match is on screen, echo the mobile deck's
// "that's everyone" beat and nudge toward widening the filters.
function EndOfList({
  surface,
  hasFilters,
  onClearFilters,
}: {
  surface: "dark" | "light";
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <p className="text-sm leading-snug text-white/75 max-w-[22rem]">
        {hasFilters
          ? "That's everyone who matches your preferences. Try removing some to see more therapists."
          : "That's everyone for now."}
      </p>
      {hasFilters && (
        <Button surface={surface} variant="secondary" onClick={onClearFilters} className="mt-5">
          Clear preferences
        </Button>
      )}
    </div>
  );
}

// ─── Grid (md+) ──────────────────────────────────────────────────────────────
// The desktop browse view: a two-column card grid in the content well beside the
// preferences sidebar (matching the home tab's width). "Not interested" removes a
// card for this visit (ephemeral, mirroring the carousel). The list pages in as
// you scroll — a spinner, a short beat, then the next batch — closing with the
// end-of-list note.

const INITIAL_VISIBLE = 6;
const LOAD_BATCH = 6;

function Grid({
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
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [shown, setShown] = useState(INITIAL_VISIBLE);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasFilters = countFilters(filters) > 0;
  const visible = useMemo(
    () => therapists.filter((t) => !dismissed.has(t.id)),
    [therapists, dismissed],
  );

  // Reset paging + dismissals when the matched set changes (filters applied/cleared).
  useEffect(() => {
    setDismissed(new Set());
    setShown(INITIAL_VISIBLE);
    setLoading(false);
    clearTimeout(loadTimer.current);
  }, [therapists]);
  useEffect(() => () => clearTimeout(loadTimer.current), []);

  const page = visible.slice(0, shown);
  const hasMore = shown < visible.length;

  // Load the next batch when the bottom sentinel scrolls into view, after a
  // short delay so the spinner reads as a real fetch.
  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLoading(true);
        clearTimeout(loadTimer.current);
        loadTimer.current = setTimeout(() => {
          setShown((n) => Math.min(n + LOAD_BATCH, visible.length));
          setLoading(false);
        }, 1800);
      },
      { rootMargin: "100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, visible.length, shown]);

  if (therapists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-8 py-20 yuna-fade-in">
        <NoMatches surface={surface} hasFilters={hasFilters} onClearFilters={onClearFilters} />
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-8 py-20 yuna-fade-in">
        <AllSeen
          surface={surface}
          hasFilters={hasFilters}
          onStartOver={() => setDismissed(new Set())}
          onClearFilters={onClearFilters}
        />
      </div>
    );
  }

  return (
    <div className="yuna-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-5">
        {page.map((t) => (
          <TherapistCard
            key={t.id}
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
            onDismiss={() => setDismissed((prev) => new Set(prev).add(t.id))}
          />
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
      {loading && (
        <div className="flex justify-center py-10" role="status" aria-label="Loading more therapists">
          <Loader2 size={28} strokeWidth={2} aria-hidden className="animate-spin text-white/80" />
        </div>
      )}
      {!hasMore && !loading && (
        <EndOfList surface={surface} hasFilters={hasFilters} onClearFilters={onClearFilters} />
      )}
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
        <NoMatches surface={surface} hasFilters={hasFilters} onClearFilters={onClearFilters} />
      </div>
    );
  }

  // Everyone was passed on. Offer a fresh start (un-dismiss) and, if filters are
  // narrowing the pool, a way to widen it.
  if (visible.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 yuna-fade-in">
        <AllSeen
          surface={surface}
          hasFilters={hasFilters}
          onStartOver={() => setDismissed(new Set())}
          onClearFilters={onClearFilters}
        />
      </div>
    );
  }

  return (
    // shrink-0: keep full content height so the parent vertical scroll engages
    // instead of the flex column squeezing this down and clipping the card.
    // max-w-md mx-auto: the deck stays a readable card width, centered in the
    // wide (6xl) well so it matches the other screens' frame without ballooning.
    <div className="shrink-0 pt-4 pb-6 w-full max-w-md mx-auto">
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
