# DS Compliance Audit — Progress Handoff

_Last updated: 2026-06-03 (session 3 — Home)_

## What this is

Screen-by-screen audit of the Yuna prototype against the design system in
`CLAUDE.md` + the `/ds/*` pages. Working through the **onboarding flow up to
Intro**. Rules of engagement:

- **Audit-first.** Present findings per screen, get approval, then fix.
- **Build is the gate** — `npm run build` (lint/tsc are noisy at baseline, ignore).
- **Source-of-truth workflow** for DS changes: update component → update its
  `/ds/*` page → propagate to call sites via props (never copy classes).
- Preview new/changed UI in dark × light and iOS × Android via admin toggles.

## Git state

- Branch: `main`. Last commit: `a5a9a58`.
- **Everything below is UNCOMMITTED.** Build passes. `.claude/` (a local lock)
  is untracked — do **not** commit it.
- Suggested next step: commit this session's work before continuing.

## ⏯ Resume here (session 3 — Home, in progress)

Home audit done; Card primitive + AppBar/SuggestionChip/Cards DS pages built
(details under "Done — session 3" below). **Open question waiting on the user:**
delete the now-orphaned `accent` field + 8 hex values from `lib/home-cards.ts`
(nothing reads them since the gradient fallback was removed)? Then: resolve the
held Card type-scale decision, and move to Waveform. See "Next".

## Done this session

### Screens audited + fixed (onboarding flow)
- **Welcome** (`routes/index.tsx`) — re-checked, already DS-clean (no changes).
- **Login** (`routes/login.tsx`) — "Forgot password?" raw `<button>` → `Button variant="link"`; hero `text-[32px]` → `text-3xl`; email-echo `/70` → `/75`; "or" → new `Divider`.
- **Create account** (`routes/auth.tsx`) — same hero/contrast fixes; "or" → `Divider`.
- **Employer access** (`routes/employer-access.tsx`) — hero `text-[30px]` → `text-3xl`; "Get Help" raw `<button>` → `Button variant="link"`; contrast `/80`→`/85`, `/70`→`/75`. `PassCard` + its bespoke gradients intentionally left as a one-off (excluded by user).
- **Accept terms** (`routes/accept-terms.tsx`) — "Read more"/"I agree" dropped `uppercase tracking-[0.14em] font-bold` className override → plain `size="sm"`; local `CheckBadge` (hardcoded `#66BA24`) → new `CheckBadge` primitive.

### New DS primitives (component + `/ds` page + sidebar entry)
- **`Divider`** (`components/Divider.tsx`, `routes/ds.divider.tsx`) — surface-aware hairline, optional centered `label`.
- **`CheckBadge`** (`components/CheckBadge.tsx`, `routes/ds.check-badge.tsx`) — green circle + white check, `size` "sm"|"md", token `bg-yuna-green`. Migrated accept-terms + employer-access to it.
- **`Drawer`** DS page (`routes/ds.drawer.tsx`) — documents the existing `ui/drawer.tsx` primitive.

### Source-of-truth fix: DrawerTitle
- `ui/drawer.tsx` `DrawerTitle` default was leftover shadcn (`text-lg font-semibold`); every call site overrode it and they'd drifted. Baked in the DS style `font-display font-normal text-3xl tracking-tight text-white` and **stripped all 8 call sites** (intro ×2, employer-access ×2, YunaSettingsDrawer, SchedulePrioritizeDrawer [kept `mt-6`], FirstSessionDisclaimers, VoiceSession).

### New doc-kit capability: device-frame previews
- `ds-docs/surface.tsx` added **`DeviceFrame`** + **`DevicePair`** — a simulated phone that provides `PhoneFrameContext` (exported from `PhoneFrame.tsx`) so a real `Drawer` portals INTO the frame; used for position-dependent overlays. Also added **`Bar`** (surface-aware skeleton placeholder).
- `/ds/drawer` shows the real drawer open + bottom-pinned in dark/light frames.
- `/ds/toasts` gained a **Position** section showing the toast top-pinned.
- Per user: the **device-frame mockups show no text** (skeleton bars / green pill placeholder) — only relative size/position. All other text (Variants/Options matrices etc.) is unchanged.

### Sidebar (`components/AdminSidebar.tsx`)
- Added DS entries: Divider, Check Badge, Drawer.

## Verify before declaring fully done
- **Drawer titles in LIGHT mode** for `intro` (Language/Pace), `VoiceSession`, `YunaSettingsDrawer` — these previously had no explicit title color and now inherit the baked `text-white` (relies on `.theme-light` inverting white→ink). Eyeball each in light mode.

## Flagged, deferred (decided "leave for now")
- **Dead actions:** "Referral Code" (Welcome) and "Forgot password?" (Login) have no `onClick` / no flow behind them. No email-verification step after create-account.
- **Broader `#66BA24` sweep:** raw hex check-circles still in `intro.tsx`, `tools.tsx`, `HomeCards.tsx`, plus `GREEN_ACCENT` const in `profile-components.tsx` and `AppBar.tsx` — candidates to migrate to `CheckBadge` / `bg-yuna-green` token.

## Done — session 2 (Intro)

Audited `routes/intro.tsx` against the DS. Build passes; previewed steps 1/3/5 +
`/ds/chat-bubbles` + `/ds/drawer` (iOS, dark — Intro is mode-locked to the dark
photo via `useDarkBlurImage`, so no light-mode pass needed for the screen).

### DS source-of-truth changes
- **`ChatBubble` gained an `attachment` slot** (`components/ChatBubble.tsx` +
  `routes/ds.chat-bubbles.tsx`). Text padding moved to an inner wrapper, added
  `whitespace-pre-line`, and the root gets `overflow-hidden` when an attachment
  is present so a full-bleed footer (stat card / chart / OS push preview) clips
  to the rounded shape. No-attachment path is byte-identical to before (Welcome
  unaffected). DS page got an "Attachment" variant row + the new prop line.
- **`DrawerContent` default radius** `rounded-t-[10px]` → `rounded-t-[1.5rem]`
  (`components/ui/drawer.tsx`). Leftover shadcn default that **all 9 call sites**
  overrode. Stripped the override everywhere (intro ×2, employer-access ×2,
  YunaSettingsDrawer, SchedulePrioritizeDrawer, FirstSessionDisclaimers,
  VoiceSession, ds.drawer). Same pattern as session 1's `DrawerTitle` fix.

### Intro fixes (`routes/intro.tsx`)
- Hand-rolled `Bubble` + `TypingBubble` → DS `ChatBubble` (`size="lg"`,
  `frostedImage={darkBg}` like Welcome). Fixes: `backdrop-blur-sm`→`-md` drift,
  missing Android frost fallback, bespoke `text-[18px]`/`px-4 py-3` sizing.
  Card-bearing bubbles pass their footer via `attachment`; privacy renders an
  inline link inside `children`. **Note:** user (sent) bubbles went 18px→20px —
  the DS only has `md`(14)/`lg`(20); the 18px was the drift. Looks consistent
  with Welcome; flag if it reads too large.
- Token: push-preview icon `#66BA24` → `bg-yuna-green`; mood-stats wrapper inline
  `#FFFFFF` → `bg-white`.
- Contrast (rule 11): privacy link `/70`→`/85`; stats labels `/70`→`/75`;
  ControlPill labels `/70`→`/75`.

### Intro — flagged, left as one-off (decide later)
- **mood-stats SVG chart palette** (`#5FA85C`/`#A6D957`/`#9CC36D`/`#C5E97D`/ink) —
  bespoke data-viz, not tokenized. Precedent: employer-access `PassCard`.
- **`StarRow` `#7FB6FF`** app-store star blue — isolated one-off.
- **Permission modals + push-preview** (`font-sans-ui`, `rgba(40,40,44,.92)`) —
  sanctioned simulated OS chrome (rule 6 carve-out). Kept as-is.

## Done — session 3 (Home)

Audited the Home screen (`components/HomeScreen.tsx`) + its building blocks
(`AppBar.tsx`, `HomeCards.tsx`, `SuggestionChip.tsx`). Build passes; previewed
`/ds/app-bar` + `/ds/suggestion-chip` in dark/light.

### Audit findings (Home)
**Missing DS components**
1. **App bar** — real shared component, no `/ds` page, not in `DS_PAGES`.
   Carries bespoke complexity (SVG bulge-mask backdrop, 60px Chat circle +
   `translateY(-12px)` align hack). → documented this session.
2. **Content card** — `HomeCards.tsx` (~670 lines: `CardShell`/`CardHeader`/
   `CardFooter`/`CardCTA`/`DailyTag`/`ActionCircle` + 8 type cards + `HomeCardRow`)
   is a real primitive parked by CLAUDE.md rule 9. No `/ds` page. → **TODO: extract
   `Card` primitive + DS page** (biggest job; fold in the style fixes below).
3. **Borderless icon button** — hand-rolled naked icon buttons at multiple call
   sites instead of `Button`: `SavedToggle` (`HomeScreen.tsx:319`), card
   `More`/bookmark/share (`HomeCards.tsx:544,578,596`). `ghost` is borderless but
   applies an active bg box. → **TODO: add a `plain`/naked icon treatment to
   `Button` + ds.buttons, migrate call sites.**

**Undocumented existing DS component**
- **SuggestionChip** — fully built, surface-aware, used for "Chat Now", but no
  `/ds` page. → documented this session.

**Style breaks (against existing tokens/components) — TODO, fold into Card work**
- Hardcoded `#66BA24` (token `bg-yuna-green` exists): `HomeCards.tsx:77,489`,
  `AppBar.tsx:224` (+ rgba glow boxShadow).
- `CardCTA` overrides Button typography via className (`HomeCards.tsx:631`,
  `text-[12.5px]`) — signals a missing button size.
- Off-scale font sizes: `text-[24px]`/`text-[22px]` (not on the type scale),
  `text-[20px]`/`text-[14px]` → should be `text-2xl`/`text-xl`/`text-sm`.
- Raw Tailwind neutrals (`text-neutral-900/700/600`, `bg-white`) instead of
  semantic tokens; cards self-manage light/dark via `tone`+`useAppMode` rather
  than leaning on `.theme-light`.
- Hardcoded gradient hex in `CardShell` (`#F4ECDE`/`#EFE3CC`/`rgba(15,18,24…)`).
- Bespoke dashed empty-state card (`HomeScreen.tsx:202`).

**Decided: leave outside DS** — `ExperienceFeedback` emoji rating
(`HomeScreen.tsx:233`) stays a one-off (per user).

**Good citizens to copy** — Home's `ViewToggle` (uses `SegmentedToggle` w/
surface-flip) and the top-bar Upgrade/Menu (`Button`).

### New DS pages (doc-only — components documented as-is)
- **App Bar** (`routes/ds.app-bar.tsx`) — real AppBar pinned to the bottom of
  `DeviceFrame`s (dark + light) so the edge anchoring + frosted bulge cradle
  read in context. Variants / Anatomy / Props.
- **Suggestion Chip** (`routes/ds.suggestion-chip.tsx`) — `SurfaceMatrix` for
  Variants (filled/primary), Sizes (sm/md/lg), States (disabled) + Props.
- Sidebar (`AdminSidebar.tsx`): added "Suggestion Chip" + "App Bar" to `DS_PAGES`.
### New Button variant: `plain` (source-of-truth change)
- **`Button` gained `variant="plain"`** (`components/Button.tsx` +
  `routes/ds.buttons.tsx`) — naked icon glyph: no border, no fill, no active-bg
  box (presses via opacity only); distinct from `ghost` which keeps an active
  bg box. `pressed` flips it to the filled primary circle. Dark + light compound
  variants added; JSDoc + Props union + a "Plain" matrix row updated.
- **Migrated `SavedToggle`** (`HomeScreen.tsx`) from a hand-rolled `<button>`
  (border-white/25 off, bg-white on) → `<Button variant="secondary"
  size="icon-sm" pressed={on}>` with surface following `useAppMode()` (same
  family as `ViewToggle`). Kept as an **enclosed round** button per user: off =
  bordered circle, on = filled circle (white-on-dark / ink-on-light — now
  mode-correct, was always white). (Initially tried `plain`/naked; user wanted
  the enclosed circle retained here.)
- **Card glyph buttons deferred** (`HomeCards.tsx` More/bookmark/share,
  `:544/578/596`): they're currently box-less inline 20px icons; the existing
  icon sizes add a 32–36px tap box that would shift the card header/footer
  spacing. Since the Card primitive extraction reworks that markup anyway,
  migrate them there (intentional box placement, no double-churn). The `plain`
  variant is ready for them.

### New DS primitive: `Card` (content tile)
- **`components/Card.tsx`** — extracted the shared content-tile chrome from
  `HomeCards.tsx`: `Card` (shell), `CardHeader`, `CardFooter`, `CardCTA`,
  `DailyTag`, plus `cardSurface()` helper + `NewBadge` (shared by tile + row).
  Visuals preserved byte-for-byte; class strings copied verbatim. Added an
  optional `surface` prop (overrides `useAppMode()` for the tint) so the tile is
  documentable on both DS surfaces — on Home, `surface` is omitted so behavior
  is unchanged (tint still follows app mode; content still inverts via
  `.theme-light`).
- **`HomeCards.tsx`** now composes the primitive — the 8 type cards + `HomeCardRow`
  stay (app content), local chrome defs deleted, `HomeCardRow` refactored onto
  `cardSurface()` + `NewBadge`. `ActionCircle` kept local (row-only, 1 site).
- **`routes/ds.cards.tsx`** — States (Default / New), Props. Light column
  wrapped in `.theme-light` to match Home's light mode (matrix panels don't add
  it). Registered "Cards" in `DS_PAGES`.
- **Per user: dropped the gradient fallback + Saved variant.** Cards always
  carry a photo, so the no-photo accent-gradient branch was dead — removed it
  from `cardSurface`/`Card` (and the `accent` prop + 8 `accent={meta.accent}`
  call sites; `naturePath` is now required). DS page no longer documents a
  Gradient variant or a Saved state.
- **FLAG — orphaned `accent`:** `CardKindMeta.accent` + the 8 `accent` hexes in
  `lib/home-cards.ts` are now read by nothing. Left in place pending an OK to
  delete (per "flag, don't silently delete").
- **Folded in:** `#66BA24` → `bg-yuna-green` (NewBadge, both tile + row); the
  deferred **card glyph buttons** (More, bookmark) → `<Button variant="plain"
  size="icon-sm">` with `-mt/-mr/-ml` nudges to hold their corner positions.
  Share stays a decorative `<span>` (it was never a button).
- Verified: build passes; Home pixel-identical pre/post; `/ds/cards` reads
  correctly dark + light.

### Card style breaks — held for a decision (NOT changed this pass)
These each change the look or need a new DS token/size, so flagged rather than
silently applied:
- **Title type scale** — cards still use `text-[24px]` (guided hero) /
  `text-[22px]` (standard, off-scale) / `text-[20px]`. DS scale has text-2xl(24),
  text-xl(20); 22 isn't on it. Standardizing (e.g. 22→text-xl) shrinks every
  card title — a real visual change. Awaiting a call.
- **`CardCTA` override** — still `className="h-10 px-5 text-[12.5px] uppercase
  tracking-[0.1em]"` on a secondary Button. Kept as a card-local preset; could
  become a proper Button size instead.
- **Gradient fallback hex** — `#F4ECDE`/`#EFE3CC`/`rgba(15,18,24…)` in
  `cardSurface` (no-photo path). Bespoke, like employer-access `PassCard` / the
  intro chart. Only hit when a card has no `naturePath` (rare).
- **Light-tone neutrals** (`text-neutral-900/700/600`) — preserved; they're the
  `tone==="light"` branch, which never fires (all `KIND_META` tones are "dark").
  Effectively dead; not a live token break.
- **Empty-state card** (`HomeScreen.tsx`, dashed `rounded-2xl`) — not migrated
  to `Card` (different shape). Minor; left as-is.

## Next
1. **Resolve the held Card decisions above** (title type scale is the main one).
2. **Waveform** — reusable primitive lacking a `/ds` page (chat/voice screens).
3. Outstanding `#66BA24` sweep: still `tools.tsx`, `AppBar.tsx` (notification
   dot), `GREEN_ACCENT` in `profile-components.tsx`. (HomeCards now done.)

## Useful
- Dev server: `npm run dev` (lands on `:8081` when 8080 is taken). Stop by exact
  PID via `lsof -ti tcp:<port>` — never broad-kill.
- Screenshot a `/ds/*` page: headless Chrome
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=/tmp/x.png --window-size=1500,1200 --virtual-time-budget=5000 "http://localhost:8081/ds/drawer"`.
