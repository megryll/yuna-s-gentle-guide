# Design-System & Consistency Audit — 2026-06-10

> **Progress (resume marker).** Build is green after each batch.
> - ✅ **Bugs (#1, #2)** — `sessions_.$id` + `SessionReflection` Share + `SchedulePrioritizeDrawer` now derive `surface` from `useAppMode()` (SchedulePrioritizeDrawer also adopts `<Surface>`).
> - ✅ **Normalizations (#11–13)** — eyebrow `text-[11px]`→`text-uppercase` token across therapist screens + rename label; `pb-16→pb-6`, `pt-6/pt-5/pt-2→pt-4`; `text-[2rem]`/`text-4xl`→`text-3xl`; drawer header `pt-3 pb-2`; emotion colors now `var(--rose/--pink/--aqua/--blue/--purple-soft)` (new tokens added to `styles.css`).
> - ✅ **DS parity & reuse (#7–10)** — MultipleChoice `indicator="check"` demo added; Badge reuse in therapist-profile bullets; new **TextArea** primitive (`field`+`display`, ds.text-area, migrated email + rename) and **Checkbox** primitive (ds.checkbox, replaced `UnderstandCheck` ×2); both registered in the sidebar.
> - ⏳ **Systemic refactors (#3, #4, #5, #6) — NOT STARTED.** Resume here:
>   - **#3 PageHeader**: add a `trailing` slot (+ optional center override) so therapist/sessions headers can adopt it; add `/ds/page-header` page + sidebar entry; migrate the 5+ hand-rolled headers.
>   - **#4 Toast**: collapse `lib/session-toast.ts` + `lib/settings-saved-toast.ts` + `lib/schedule-prompt.ts` into one `createOneShot` factory; add a `useTransientToast()` hook (one default duration); migrate the 5 screens.
>   - **#5 surface default**: document the house rule (photo-cluster primitives default `dark`; Switch/Button default `light`) and give SegmentedToggle/RatingScale a default instead of requiring `surface`.
>   - **#6 CTA verb**: standardize "Continue" (hero/onboarding) vs "Next" (survey pagination); `intro` currently mixes both.
> - Build gate: `npm run build`. Uncommitted — consider committing batches 1–4 before resuming.


Scope: the ~15 screens and DS components added/changed on 2026-06-10 (therapist
flow, design-your-trial, splash, session detail, settings sub-pages, the new DS
primitives) plus the screens they touched. Five parallel auditors covered DS
reuse, spacing, typography/copy, color/theming, and UX patterns.

**Overall health: good.** No em dashes or fortune-telling in Yuna's voice, no
`font-serif`/`font-sans-ui` misuse, no sub-floor contrast, no Android
blur-alone surfaces. New primitives mostly carry correct `surface` props. Most
findings are *consistency* opportunities, not breakage.

Severity: 🔴 renders wrong · 🟠 systemic consistency · 🟡 DS parity/reuse · 🟢 mechanical.

---

## 🔴 Real bugs (light-mode breakage)

1. **`src/routes/sessions_.$id.tsx`** — wraps in `PhoneFrame themed` (follows the
   Light/Dark toggle) but pins 5 Buttons to `surface="dark"`, so dark controls
   sit on the light photo in light mode. Lines `101, 115, 130, 301, 309`. Fix:
   derive `effectiveSurface` like `ScreenChrome.tsx:40`
   (`useAppMode() === "light" ? "light" : "dark"`) and pass to every Button.
   The `HeroKeepsakeCard` Share button (`SessionReflection.tsx:54`) is the same
   issue — make it mode-aware or accept a `surface` prop from the themed caller.
2. **`src/components/SchedulePrioritizeDrawer.tsx`** — only new drawer that
   ignores app mode: hardcoded `text-white` (`45,53,56`), fixed
   `surface="light"`/`"dark"` on its controls, hand-rolled `border-white/15
   bg-white/5` panel (`51`). Breaks in light mode. Fix: thread `useAppMode()`
   like `TherapistFiltersDrawer`.

---

## 🟠 Systemic consistency (highest leverage)

3. **PageHeader is an undocumented de-facto primitive.** 8 call sites (goals,
   gratitude, meditation, 4 settings sub-pages) but **no `/ds/page-header`
   page and no sidebar entry** (rule 3 violation), AND 5+ screens hand-roll
   their own back-arrow headers instead of adopting it:
   - `therapist-recommendations.tsx:96-127` (back + saved + preferences)
   - `therapist-preferences.tsx:85-106` (back + close)
   - `therapist-profile.$id.tsx:53-67` (back + bookmark)
   - `therapist-schedule.$id.tsx:56, 106-116` (two different headers)
   - `sessions_.$id.tsx:99-110` (centered back arrow)
   - `goals.tsx:412-417` hand-rolls a header even though the same file uses
     PageHeader at `:298`.
   Fix: give PageHeader a `trailing` slot (+ optional center override) so
   trailing-action headers can adopt it, then add its DS page + sidebar entry.

4. **Toast sprawl.** 3 byte-identical one-shot modules — `lib/session-toast.ts`,
   `lib/settings-saved-toast.ts`, `lib/schedule-prompt.ts` — plus 5 screens each
   re-implementing a transient-toast timer with 4 different durations
   (3500 / 4000 / 2800 / 3200 ms): `therapist-recommendations.tsx:53,83`,
   `therapist-profile.$id.tsx:38,196`, `settings.tsx:84`,
   `SchedulePrioritizeDrawer.tsx:100`, `sessions.tsx`. Fix: one `createOneShot`
   factory + a `useTransientToast()` hook with one default duration.

5. **`surface` default convention split.** New primitives default `"dark"`
   (MultipleChoice, StepDots, CalendarPicker, ProgressBar, TherapistCard,
   YunaExplains); Switch/Button default `"light"`; SegmentedToggle/RatingScale
   require it. Three conventions for one prop. Fix: document a house rule
   (photo-cluster primitives default `dark`; light form controls default
   `light`) and align the outliers to a documented default rather than required.

6. **CTA forward-verb drift.** `intro` uses both "Continue" and "Next" within one
   flow. Standardize the forward verb ("Continue" for hero/onboarding, "Next"
   only for explicit survey pagination).

---

## 🟡 DS parity & reuse gaps

7. **MultipleChoice `indicator="check"`** is a shipped capability with a distinct
   layout but is never rendered on `ds.multiple-choice.tsx` (rule-3 parity break).
   Add a single-select `indicator="check"` row + Props coverage.
8. **A `TextArea` primitive is now earned** (rule 10, ≥2 sites): two hand-rolled
   `<textarea>`s — email draft `therapist-profile.$id.tsx:280-290`, rename sheet
   `sessions_.$id.tsx:290-297` — both already self-flagged in comments. Build the
   primitive (+ DS page) and migrate both.
9. **A `Checkbox` gap.** `UnderstandCheck` (`settings_.account.tsx:148-177`)
   hand-rolls a checkbox used across 2 confirmation drawers. Build a `Checkbox`
   primitive (+ DS page).
10. **Badge under-reused.** `therapist-profile.$id.tsx:127` hand-rolls a
    secondary-green check circle that is exactly `<Badge icon size="sm">`. The
    schedule success mark (`therapist-schedule.$id.tsx:61`, 72px) is the same
    token at a size Badge doesn't offer — consider a Badge `lg` size or accept as
    bespoke hero ornament.

---

## 🟢 Mechanical normalizations

### Spacing (rule 4)
- `sessions_.$id.tsx:91` scroll wrapper `pb-16` → `pb-6` (matches its twin
  `wrap-up.tsx:118`).
- `therapist-schedule.$id.tsx:55` (confirmed branch) puts hero `pt-14 pb-10` on a
  scroll wrapper — forbidden; move `pt-14` to a `shrink-0` header, body `pt-4 pb-6`.
- Scroll-body top padding canonical = `pt-4` (6 call sites). Outliers:
  `therapist-preferences.tsx:120` `pt-6`, `therapist-recommendations.tsx:232`
  (Saved) `pt-5`, `gratitude.tsx:57` `pt-2`.
- Section-stack gaps: reconcile `therapist-profile.$id.tsx:80` `gap-7` vs
  `therapist-schedule.$id.tsx:118` `gap-6`; and the two reflection screens
  (`sessions_.$id.tsx:144` `gap-6` vs `wrap-up.tsx:203` `gap-9`) which share
  `SessionReflection`. Standardize on `gap-6`.
- Drawer header canonical = `px-6 pt-3 pb-2`; migrate `design-your-trial.tsx:177`
  (`pt-2`) and the `intro.tsx` `pt-3 pb-3` headers. DrawerTitle size is correctly
  centralized at `text-3xl` — no title-size violations.

### Typography (rule 6)
- `therapist-recommendations.tsx:191` `text-[2rem]` → `text-3xl` (lone hero
  outlier; every other therapist-flow hero is `text-3xl`).
- `design-your-trial.tsx:79` `text-4xl` — decide: drop to `text-3xl` for role
  parity, or document a `text-4xl` "page-hero emphasis" step in `ds.typography.tsx`.
- Tracked-uppercase eyebrow role is rendered 3 ways (`text-[11px]
  font-semibold tracking-[0.12em]`, `text-xs font-medium tracking-[0.12em]`,
  `text-uppercase tracking-[0.32em]`). Standardize on the named `text-uppercase`
  token (11px) with one tracking + one weight; replace the `text-[11px]`
  arbitraries.

### Color tokens (rule 8)
- `lib/sessions.ts` `useSessionEmotionColors` mixes `var(--token)` and raw hex.
  Two hex duplicate existing tokens (`#A7C7E7` = `--blue`, `#C5B6E0` =
  `--purple-soft`) → reference the tokens. Three with no token (`#F7A7A7`,
  `#F2B4D3`, `#B5DEDB`) → promote to secondary-palette tokens in `styles.css`.

---

## Verified clean (no action)
- Copy voice: no em dashes / no fortune-telling in any Yuna line, chip, or TTS.
- Fonts: no `font-serif`; all `font-sans-ui` is simulated OS chrome (sanctioned).
- Contrast: no readable text below the rule-11 floor (only placeholders at /40).
- Platform: every `backdrop-blur` is paired with a shim-liftable fill — no
  Android blur-alone surfaces.
- New primitives (Calendar, MultipleChoice, ProgressBar, StepDots, TherapistCard,
  YunaExplains) all have `/ds/*` pages + sidebar entries and correct `surface`
  branching.
