# Handoff — "Track your progress" + Survey UX redesign

**Branch:** `feature/questionnaire-v2` (keep working here — do NOT branch).
**Build gate:** `npm run build` (only green check that matters; lint/tsc noisy at
baseline — don't chase). Dev server: `npm run dev` (currently on `:8081`).
**Always preview** new/changed screens in dark×light × iOS×Android via the admin
toggles. Follow `CLAUDE.md` + the `yuna-design-system` / `yuna-prototype-design`
skills (DS-first, reference-don't-reproduce, DS-page parity, padding rules).

---

## The big picture (two parts)

The goal is to make in-app assessments feel like delightful **self-discovery**
("know yourself," Buzzfeed/Myers-Briggs energy) with the added value prop that
**every survey answer + conversation feeds an AI that gets to know you over time
and coaches you.** Two workstreams:

- **Part 2 — Question UX + demo survey.** ✅ **DONE** (this session). More
  question-type variety, microanimations, sound, and a satisfying conclusion.
- **Part 1 — "You" tab rework.** 🟡 **IN PROGRESS** — see "Part 1 — progress" below.
  Turn "You" into the self-knowledge hub: a coverage radar, a unified survey
  library, and relocate "Track your progress" out of the Tools tab.

Agreed sequencing was Part 2 first, then Part 1.

---

## Part 2 — what shipped (context for Part 1)

Part 1 will surface things Part 2 built, so know these exist:

**New DS primitives** (each with `/ds/*` page + sidebar registration):
- `src/components/TileChoice.tsx` → `/ds/tile-choice` — 2-up illustrated tile grid,
  single-select, `animateIn` cascade, `surface` prop.
- `src/components/RankList.tsx` → `/ds/rank-list` — pointer drag-to-reorder list,
  live rank numerals, `onDragTick` for tick sound, `surface` prop.

**Changed DS components:**
- `MultipleChoice` — added `animateIn?: boolean` (staggered cascade entrance);
  JSDoc + `/ds/multiple-choice` Props updated.
- `SegmentedToggle` — now documented/used for **2–3 segments** (was "two-segment");
  JSDoc updated, `/ds/segmented-toggle` gained a "Variants" section (two vs three).

**New generic survey engine + demo survey:**
- `src/lib/demo-survey.ts` — typed question union + `SURVEYS` registry +
  `surveyById()`. Question kinds: `emoji` (statement bubble + RatingScale),
  `single` (MultipleChoice), `tiles` (TileChoice), `pillGroup` (a screen of
  several 2–3 option SegmentedToggle quick-fire questions), `scale` (Slider w/
  green→orange `distress` fill), `numeric` (RatingScale numbers), `rank`
  (RankList).
- `src/routes/survey.$id.tsx` — generic runner. Mirrors the starting-point
  interaction grammar (one question/pane, register-beat auto-advance on
  tap-types, Continue on scale/rank/pillGroup, directional pane slides, sounds via
  `survey-sound.ts`, confetti). **Progress bar at TOP**, survey title centered in
  `PageHeader` `center` slot, back disabled on step 0. **Conclusion pane** =
  Yuna avatar (no glow) + reflection lines tying answers to "what you're working
  on" + 2 "new activity" `HomeCard`s (reuses `PlacedForYou` from
  `SessionReflection`).
- The demo survey lives at **`/survey/discover-your-style`** and is registered in
  `src/lib/screen-catalog.ts` (gallery group "Demo Survey", deep-links per type).

**New CSS** in `src/styles.css` (survey animation block): `.survey-cascade-item`
(+ `survey-cascade` keyframe), `.rank-dragging`.

**Open Part-2 flags (user may revisit):**
- Q1 back arrow is *disabled/greyed* on step 0 (PageHeader pattern), not hidden.
- Completion CTA is "Back to home" (no real goal flow wired yet).
- `pillGroup` SegmentedToggle pill widths on narrow frames — keep labels short.

---

## Part 1 — the spec (decisions already made with the user)

### Decisions locked in
1. **Coverage radar, NOT a wellbeing-score radar.** Axes = life dimensions Yuna
   *understands*; fill = how much she knows. An empty radar must read as "there's
   more to discover," never "you're failing at life." This is the engagement
   engine that pulls users to disclose more (chat + take surveys).
2. **One library, no shelves.** A single list of survey/assessment cards. The
   thing that distinguishes clinical from discovery is a **cadence tag**, not a
   section header:
   - Discovery/personality quizzes → tag **"One-time"**.
   - Clinical measures → tag **"Every 2 weeks"** (or similar).
   - Plus a **"Suggested for you"** badge when relevant.
3. **Clinical framing is plain/casual.** Title clinical measures like
   *"Measure your anxiety," "Measure your mood"* — no clinical labels; the cadence
   tag quietly signals they repeat.
4. **Relocate.** Remove "Track your progress" from the **Tools** tab; its content
   (the check-ins/assessments) moves into **You**.

### What "You" should become (proposed structure, top→bottom)
1. Yuna + a "how well I know you" moment (ties to the radar).
2. **The coverage radar** — centerpiece; tappable axes; visibly incomplete to
   pull the user forward.
3. **What Yuna holds about you** — the existing Basics/Beliefs/Breakthroughs
   insights, ideally linked to radar axes.
4. **Suggested for you + Explore library** — quiz/measure cards with cadence tags
   + "Suggested" badges; taken ones show their trend + a **schedule follow-up**
   with an editable suggested cadence; not-taken ones show the
   baseline/empty-state framing ("take it to set a baseline to measure").

### Open decisions to resolve at start of Part 1
- **Radar axes** — exact set + count. User referenced the "inner garden" 5 layers
  and a PERMA-ish 8 but left the choice to us. Proposed default: **6 life
  dimensions** (e.g. Work, Relationships, Health, Emotions, Habits, Purpose) —
  could align to a subset of `FOCUS_AREAS` in `questionnaire-data.ts`. Confirm
  before building.
- **Is the radar a DS primitive** (→ `/ds/<name>` page, both surfaces) **or a
  screen-level viz?** Recommend a DS primitive (`CoverageRadar`/`InnerMap`) so it
  reads as system, with a `surface` prop; it's reusable enough to earn a page.
- **Library card** — reuse the content/feed-card pattern (`Card`/`CardSuggestion`)
  or a new primitive? Cards carry: plain title, description, `Nq · M min`, cadence
  `Tag`, optional `Suggested` `Badge`, taken-state mini-trend + "schedule
  follow-up."
- **Follow-up cadence editing UI** — suggested cadence + edit. Check
  `CalendarPicker` and `src/lib/schedule-prompt.ts` for reusable pieces.
- **How the library relates to existing `/check-ins` + `/assessment/$id`** —
  likely the You-tab library *replaces* `/check-ins` as the hub and deep-links
  into `/assessment/$id` for history; decide whether to delete `/check-ins` or
  keep it as the assessment-history surface.

---

## Current state of the surfaces Part 1 touches

**You tab — `src/routes/you.tsx`**
- `ScreenChrome` `hideHeader` `surface="dark"`. Sections: `ProgressRing` hero;
  stats row (Conversations / Messages / Insights) in `Surface` cards; **Focus
  Areas** (two `FocusAreaBentoCard`); **Breakthroughs / Beliefs & Behaviors /
  Basics** (`InsightCard` lists, with "More" buttons); footer "Something feel
  off?" reflection CTA.
- Data: `getProfileData(userType)` from `src/lib/profile-data.ts` (`ProfileData`:
  counts, 2 focus areas + tasks, insight arrays, progress fraction). Keyed by
  user type (new vs returning).

**Tools tab — `src/routes/tools.tsx`**
- Grid of ~8 feature cards (bg image + text overlay). The **"Track your progress"**
  card → `/check-ins`. (This card is what gets removed.)

**Check-ins hub — `src/routes/check-ins.tsx`**
- `PhoneFrame themed`, `PageHeader` "Track your progress". Intro copy. One trend
  card per `Assessment` (GAD-7, PHQ-9, Rosenberg self-esteem): domain, instrument,
  question count, duration. New user → "Take assessment" + empty chart →
  `/questionnaire/your-starting-point`. Returning → latest score, delta, inline
  trend chart, opens `/assessment/$id`. `YunaExplains` below.

**Assessment detail — `src/routes/assessment.$id.tsx`**
- Full history chart (severity bands, area fill, tappable dots, provenance
  "What Yuna noticed"), `YunaExplains`, cadence footnote.

**Assessment data — `src/lib/assessment-data.ts`**
- `ASSESSMENTS: Assessment[]` (3 instruments). `Assessment = { id, domain,
  instrument, questionCount, max, bands: Band[], higherIsWorse, description,
  reflection, cadenceNote, history: AssessmentEntry[] }`.

**Surveys (entry points the library will list)**
- Discovery: `/survey/discover-your-style` (demo, generic engine, `SURVEYS` in
  `demo-survey.ts`). Onboarding: `/questionnaire/your-starting-point` (bespoke
  branching flow in `questionnaire.$id.tsx`; data in `questionnaire-data.ts`).
- Completion state recorded in `src/lib/questionnaire-state.ts`
  (`setQuestionnaireResult`).

**Home cards — `src/lib/home-cards.ts`**
- `HomeCard` union incl. `self-discovery` ({title, description, duration}).
  `KIND_META`/`KIND_PLURAL`/`KIND_MENU`. `HOME_CARDS` demo array (some `isNew`).

**Visualizations that exist (reference, none are radar):** `ProgressRing`,
`RadialProgress`, `EmotionDonut` (all SVG). **No radar/octagon/spider chart
exists** — building one is net-new.

---

## Suggested Part 1 implementation order
1. Confirm radar axes + whether radar is a DS primitive. (AskUserQuestion.)
2. Build the radar component (+ `/ds` page if primitive). Coverage fill model:
   per-axis 0–1 "known-ness," driven by demo data for now.
3. Build the unified survey-library data model + card(s): plain titles, cadence
   `Tag`, `Suggested` `Badge`, taken-state mini-trend + schedule-follow-up.
   Fold in the 3 clinical `ASSESSMENTS` + the discovery surveys.
4. Rework `you.tsx` to compose: identity moment → radar → insights (linked to
   axes) → suggested/library. Keep `ScreenChrome surface="dark"`, body `px-6`
   (tab-screen padding rule).
5. Relocate: remove "Track your progress" from `tools.tsx`; decide fate of
   `/check-ins` (likely demote to history surface or remove; deep-link
   `/assessment/$id`). Flag dead components/variants per DS rules.
6. Follow-up scheduling UI (suggested cadence + edit).
7. `npm run build`, preview all four mode/platform combos, then update this doc /
   close the task.

## Part 1 — progress (this session)

**Decisions locked** (via AskUserQuestion): radar = **6 life dimensions**
(Work, Relationships, Health, Emotions, Habits, Purpose), built **screen-level**
(not a DS primitive); library cards reuse the existing **Card "Questionnaire"
type** (green tile + Yuna watermark); **`/check-ins` removed entirely**.

**Done:**
- `src/lib/survey-library.ts` — unified `SURVEY_LIBRARY` (no shelves). Discovery
  entries (`your-starting-point`, `discover-your-style`, cadence "One-time") +
  clinical entries derived from `ASSESSMENTS` (plain titles "Measure your
  anxiety/mood/self-esteem", cadence "Every 2 weeks", `assessmentId` backing).
  `suggested` flag drives the "Suggested for you" group.
- `src/lib/profile-data.ts` — added `coverage: Record<string, number>` per user
  (priya low, james high) → radar fill.
- `src/routes/you.tsx` — reworked: identity moment → **CoverageRadar** (local SVG
  hexagon, mode-aware stroke/label colours, green coverage fill) → stats → focus
  areas → insights → **survey library** ("Suggested for you" + "Explore",
  `SurveyLibraryCard` = Card + cadence `Tag` + Suggested `Badge`; taken clinical
  measures show a `MiniTrend` sparkline + "See your history" → `/assessment/$id`).
- Relocate: removed "Track your progress" tool from `tools.tsx`; deleted
  `src/routes/check-ins.tsx` (route tree regenerated); repointed `/check-ins`
  nav in `assessment.$id.tsx`, `questionnaire.$id.tsx`, and `screen-catalog.ts`
  to `/you`.

**Not done / flags:**
- **Follow-up cadence editing UI** (step 6) — not built. Taken cards show a
  static "Repeats every 2 weeks"; no editable schedule yet.
- **Insights linked to radar axes** — insights still render as before, not yet
  tied to the 6 axes.
- **Tappable radar axes** — labels are static (no drill-down). Kept inert to
  avoid dead controls; wire up when the axis→survey/insight target is decided.
- **`ProgressRing` is now orphaned** — you.tsx was its only call site. Flagged,
  not deleted (lives in `components/profile-components.tsx`). Decide: delete or
  repurpose.
- **Visual preview pending** — build is green but the 4 mode×platform combos
  haven't been eyeballed yet (radar colours, square card stack length).

## DS / process reminders
- New screen → register in `PAGES` (`screen-catalog.ts`). New DS primitive →
  `/ds/<name>` page (doc kit in `src/ds-docs/surface.tsx`, both surfaces,
  Variants/Sizes/States/Props) + `DS_PAGES` in `AdminSidebar.tsx`.
- `surface` defaults: photo-cluster primitives default `"dark"`; flip a
  dark-cluster screen's components to `"light"` in light mode
  (`effectiveSurface` pattern).
- No hardcoded hex / inline color-spacing-type; tokens only. No `hover:` (mobile,
  `active:` only). Fonts: Fraunces headings / Stara everything else.
- Yuna's voice: no em dashes, no fortune-telling (reflect what the user said).
