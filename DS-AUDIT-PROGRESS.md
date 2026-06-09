# DS Compliance Audit — Progress Handoff

_Last updated: 2026-06-08 (session 4 — Creating Your Space)_

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

## ⏯ Resume here — SCREEN SWEEP COMPLETE

**Every screen in `AdminSidebar` PAGES is audited** (see "✅ SWEEP COMPLETE" below
for coverage + the 7 cross-cutting themes). All findings only — nothing changed.

**Next is a decision, not more auditing:** pick a cross-cutting theme to fix
source-first (the **type-scale decision** unblocks the most), get approval, then
propagate via props. Remaining audit work is **building blocks**, not screens:
`profile-components.tsx`, `PastSessionCard`, `Waveform`.

**Still-open from session 3 (carried, not blocking the sweep):** ~~delete the
orphaned `accent` field + 8 hexes in `lib/home-cards.ts`?~~ ✅ done 2026-06-08.
~~Resolve the held Card title type-scale decision~~ ✅ done. Waveform primitive
lacks a `/ds` page. See "Next".

**Git note:** this doc's "Last commit `a5a9a58`" is stale — HEAD is now `f24484d`
and there's a fresh batch of uncommitted Home-feed work. Don't trust the SHA below.

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
- **~~FLAG — orphaned `accent`~~ ✅ RESOLVED 2026-06-08:** `CardKindMeta.accent`
  + the 8 `accent` hexes in `lib/home-cards.ts` were read by nothing (dead since
  the gradient fallback was removed). Deleted the field + 8 entries + tidied the
  stale "accent-tinted" comment. Build passes.
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
- **~~`CardCTA` override~~ ✅ RESOLVED 2026-06-08 — keep as card-local preset.**
  The off-scale font is gone (type-scale fix already moved it to `text-xs`). What
  remains (`h-10 px-5 uppercase tracking-[0.1em]`) is an editorial content-card
  treatment (matches `DailyTag`), not a Button size — and the DS has been
  *removing* uppercase-tracking from generic Buttons (session 1 accept-terms).
  Single wrapper (1 consumer) → a new Button size fails rule 10. Left as-is.
- **Gradient fallback hex** — `#F4ECDE`/`#EFE3CC`/`rgba(15,18,24…)` in
  `cardSurface` (no-photo path). Bespoke, like employer-access `PassCard` / the
  intro chart. Only hit when a card has no `naturePath` (rare).
- **Light-tone neutrals** (`text-neutral-900/700/600`) — preserved; they're the
  `tone==="light"` branch, which never fires (all `KIND_META` tones are "dark").
  Effectively dead; not a live token break.
- **Empty-state card** (`HomeScreen.tsx`, dashed `rounded-2xl`) — not migrated
  to `Card` (different shape). Minor; left as-is.

## Done — session 4 (Creating Your Space)

Audited `routes/creating-your-space.tsx` — the full-bleed centered loader/
transition screen that sits between Intro and Home (PAGES order). Mode-locked to
dark via `useDarkBlurImage()` (correct for onboarding, like Intro — no light pass
needed). **Audit only, nothing changed.**

**Compliant**
- Rule 6 (fonts): label is Stara body (`text-sm tracking-[0.04em]`), no `font-sans-ui`.
- Rule 11 (contrast): label `text-white/95` (clears the 0.85 body floor); spinner
  ring (`border-white/25` + `border-t-white`) is decorative, not text.
- Rule 5 (no hover): none. Inline styles are animation (`yuna-spin`) + asset-URL
  composition — allowed runtime math under rule 7.
- Platform: no `backdrop-blur` anywhere, so no Android blur-kill risk.
- No DS components reproduced (no button/input/card markup).

**Findings (flagged, not fixed)**
- **Rule 8 + redundancy (minor):** the `z-50 inset-0` overlay re-composites
  `darkBg` with a hardcoded `linear-gradient(rgba(0,0,0,0.42) …)` scrim *on top of*
  the image `PhoneFrame` already renders — the same asset is loaded twice. Cleaner
  as a single `bg-black/40` overlay div (Tailwind alpha = token-friendly, no second
  fetch). Low priority.
- **No DS spinner/loader primitive:** the ring is a hand-rolled border-spinner.
  Only **1 call site**, so it doesn't clear rule 10's "≥2 sites" bar — note as a
  candidate only, don't extract yet. (If a second loader appears, revisit.)

**Verdict:** essentially DS-clean. One minor scrim cleanup; no blocking breaks.

## Session (`/chat`) — covered by separate thread (reconciled)

Not re-audited here. **Session/Chat was audited AND implemented** in
`HANDOFF-chat-schedule-ds.md` (Part A): verdict was clean on padding/fonts/color/
theming; the one gap was bypassing DS `ChatBubble` ×3, which was fixed (migrated +
added `typing` state + card `selected` state, source-first). `chat.tsx` is not in
the uncommitted set, so that work landed. **Treated as covered** for this sweep —
see that doc for detail and its remaining low-pri items.

## Done — session 4 cont. (Wrap-up)

Audited `routes/wrap-up.tsx` — `themed` photo-bg **scrolling** screen (follows the
light/dark toggle), post-session reflection. **Audit only, nothing changed.**

**Findings (flagged, not fixed)**
- **[Med] Rule 4 (padding):** scroll wrapper (`:110`) carries hero `pt-14 pb-10`.
  Rule 4 explicitly lists **Wrap-up as a photo-bg scrolling screen** that must NOT
  put hero `pt-14/pb-10` on the scroll wrapper (eats viewport / clips). Convention:
  X-close header carries `pt-14`; scroll content owns `pb-6`. Propose standardizing.
- **[Low] Off-scale type:** `text-[15px]` ×3 (`:140` subcopy, `:289` emotion name,
  `:330` quote) — not on the scale (14/16). Recurring app-wide; needs a DS call
  (→ `text-sm` or `text-base`). Same family as the held Card type-scale decision.
- **[Note] `EmotionRow` raw `<button>`** (`:278`) — accordion/disclosure toggle;
  no DS accordion primitive exists, so acceptable bespoke. Note only.
- **[Note] HeroCard `font-display italic text-2xl`** keepsake quote (`:176`) —
  editorial Fraunces italic. Schedule-drawer demoted a similar *label* to Stara,
  but this is a hero keepsake line, not a UI label → likely sanctioned editorial.
  Confirm intentional.

**Compliant**
- DS components throughout: `Button`, `Surface`, `IconMedallion`, `YunaAvatar`,
  `HomeCardRow` (`interactive={false}`). Good citizen — no hand-rolled button/card.
- **Color is token-based + mode-aware:** emotion donut/dots use `var(--emotion-*)`
  via `style` — the correct SVG workaround (CSS vars don't resolve through SVG
  presentation attrs), documented inline; donut track branches on `useAppMode()`.
- Contrast (rule 11): body `/85`, secondary `/90`/`/75`, hint `/55` — all clear
  floors. The `text-white/40` quote glyph (`:327`) is `aria-hidden` decoration.
- Rule 5: `active:` only, no hover. Rule 6: no `font-sans-ui`. No em-dash (the
  `HERO_MESSAGE` comment calls out the comma choice).

**Verify in preview (not blocking the sweep)**
- Light mode (themed screen) — heading drop-shadow is correctly gated to dark.
- `Surface` frosted cards carry an Android fill (not blur-only) — `Surface` is a
  DS primitive w/ `/ds/surface`, so likely handled; confirm.

## Done — session 4 cont. (Profile / `you`)

Audited `routes/you.tsx` — tab screen on `ScreenChrome surface="dark"` (dark tab,
inverts via `.theme-light` in light). Populated state + `new`-user empty state.
**Audit only, nothing changed.** More substantive than Wrap-up.

**Findings (flagged, not fixed)**
- **[Med] Rule 7 (inline-style typography):** stat value `style={{ fontSize: 26,
  lineHeight: "30px" }}` (`:50`) — typography via inline style is disallowed; use
  a scale class.
- **[Med] Hand-rolled frosted cards + Android risk:** stat cards (`:44`),
  `PreviewRow` (`:214`), empty-hero inner circle (`:199`) hand-roll `rounded-2xl
  border bg-white/[…] backdrop-blur-sm` — chrome the new **`Surface`** primitive
  now owns (Wrap-up already uses it). Fills are **arbitrary alphas**
  (`bg-white/[0.06]`, `bg-white/[0.04]`) the Android blur-kill shim **won't lift**
  (platform rule: use standard stops), and they separate via blur alone → may
  vanish on Android. → migrate to `Surface`, or standard stops + `blur-md`.
- **[Low-Med] Rule 11 (contrast):** `PreviewRow` heading + body `text-white/65`
  (`:215,218`) — below the readable floor (meta /75, body /85). Empty-state preview
  copy is meant to be read; bump.
- **[Low] Blur drift:** `backdrop-blur-sm` (`:46,199,214`) vs DS `md`.
- **[Low] Off-scale type:** `text-[20px]`→`text-xl`, `text-[14px]`→`text-sm` (clean
  maps); off-scale `text-[26px]`/`text-[11px]`. Same thread as Home/Wrap-up.
- **[Note] EmptyHeroGlow** (`:180`) — inline radial-gradient + breathe animation is
  acceptable decorative runtime math (cf. avatar aura); inner `h-20 w-20` frosted
  circle is an `IconMedallion`-shaped candidate (larger size).

**Compliant:** `Button` correct (`surface="dark"`, variants); tab padding `px-6`
(rule 4); `font-display` headings, no `font-sans-ui`; no hover.

**Sub-target — `profile-components.tsx` not audited here.** `ProgressRing`,
`InsightCard`, `FocusAreaBentoCard`, `EmptyStateCard`, `MoreButton` are the card
primitives this screen composes (+ the `GREEN_ACCENT` const flagged in session 3).
Warrants its own building-block pass, like AppBar/HomeCards got.

## Done — session 4 cont. (Focus area / `focus-area.$num`)

Audited `routes/focus-area.$num.tsx` — `themed` photo-bg scrolling screen, two
variants (num 1/2). **Audit only.** Notably the cleanest padding of the sweep.

**Compliant — reference pattern**
- **Rule 4 (padding) done right:** back-arrow header carries `px-6 pt-14 pb-2`,
  the scroll wrapper has NO hero gutter, scroll content owns its padding (`pb-12`).
  **This is the correct pattern Wrap-up violated** — cite it when fixing Wrap-up.
- `Button` (back, `surface="dark"`) + `HomeCardRow` reused; `active:` only;
  `font-display`/Stara, no `font-sans-ui`; theming mode-aware (`themed` /
  `useModeImage` / `overlay-on-dark` gated on mode).

**Findings (flagged, not fixed)**
- **[Med] Rule 7 (inline-style typography):** title `style={{ fontSize: 28,
  lineHeight: "38px", … }}` (`:49`) — same pattern as Profile. (The
  `fontVariationSettings: 'SOFT' 0,'WONK' 1` Fraunces-axis fragment has no token →
  arguably OK inline; fontSize/lineHeight should be a scale class.)
- **[Low-Med] Bespoke info popover** (`:90`) — hand-rolled frosted tooltip
  (image-bg + `overlay-on-dark`) with raw `text-neutral-900` (not semantic; relies
  on the surface always reading light). No DS popover/tooltip primitive → bespoke
  OK, but ink should be `text-foreground`.
- **[Low] Naked icon button:** `Info` toggle (`:72`) is a hand-rolled `<button>` —
  the `plain` variant (session 3) exists for this.
- **[Low] Contrast:** eyebrow `text-white/65` (`:44`) sub-floor (meta min /75);
  info icon `text-white/50` (`:79`).
- **[Low] Cross-screen consistency:** photo-bg scrolling gutter — Focus-area `px-6`
  vs Wrap-up `px-8`. Rule 4 permits either, but the two disagree; pick one.

**Recurring theme across Wrap-up + Profile + Focus-area:** off-scale `text-[Npx]`
and **inline-style `fontSize` on headings** (Profile `:50`, Focus-area `:49`). Worth
a single DS type-scale resolution (ties into the held Card title decision).

## Done — session 4 cont. (Tools / `tools`)

Audited `routes/tools.tsx` — tab screen, `ScreenChrome surface="dark"`,
display-only photo-card list. **Audit only.**

**Findings (flagged, not fixed)**
- **[Med] Rule 8 + 7 (hardcoded hex):** New badge `style={{ backgroundColor:
  "#66BA24" }}` (`:83`) — **the outstanding `#66BA24` sweep item** from session 3's
  Next list. Token `bg-yuna-green` + the shared `NewBadge` (session 3) both exist.
  Currently latent (no tool sets `isNew`), but a real break when one does.
- **[Med] Rule 9 (hand-rolled content cards):** each tool hand-rolls `rounded-3xl`
  photo-tile chrome (gradient overlay + bottom title/caption) — overlaps the new
  `Card`/`cardSurface` primitive. No DS components besides `ScreenChrome`. Evaluate
  composing `Card` (content tiles get their own pattern by rule 9, but a primitive
  now exists).
- **[Low] Off-scale type:** `text-[13px]` caption (`:94`).

**Compliant — notably good mode handling**
- Gradient overlay **branches on `useAppMode()`** (white wash light / black dark)
  per rule 11's "inline/arbitrary colors must be mode-aware" — done right. Title/
  caption contrast mode-branched (`text-foreground` vs `text-white`, above floor).
- Tab padding `px-6` (rule 4); `font-display`/Stara, no `font-sans-ui`; no hover.
- [Note] manual `text-foreground`/`text-white` branch is mildly redundant with
  `.theme-light` ("author once") but justified — coupled to the bespoke flipping
  gradient overlay `.theme-light` can't see.

## Done — session 4 cont. (Sessions / `sessions`)

Audited `routes/sessions.tsx` — tab screen, `ScreenChrome surface="dark"`, empty +
returning states. **Audit only.** Thin route; list cards delegated to
`PastSessionCard`.

**Findings (flagged, not fixed)**
- **[Med] Hand-rolled `IconMedallion`:** empty-state icon circle (`:27`) is
  `h-20 w-20 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm` —
  the exact `IconMedallion` chrome. Use it. At 80px it exceeds `md`(56)/`lg`(64);
  **Profile's `EmptyHeroGlow` inner circle is also `h-20 w-20`** → two sites want an
  `IconMedallion size="xl"` (clears rule 10's ≥2-site bar). `backdrop-blur-sm`→`md`.
- **[Low] Title-size inconsistency:** empty h1 `text-2xl` (`:33`) vs returning h1
  `text-3xl` (`:53`) — same screen. Likely intentional (centered hero vs list
  header); confirm.

**Compliant:** DS `Button`; tab `px-6` (rule 4); **on-scale type throughout**
(text-2xl/3xl/sm — no `text-[Npx]`, clean vs prior screens); contrast good
(body `/80`, icon `/70`); `bg-white/10` is a standard stop (Android-safe); no
hover; `font-display`/Stara, no `font-sans-ui`.

**Building block:** `PastSessionCard` (returning-state list card) not audited here
— add to the building-block follow-up with `profile-components.tsx`.

## Done — session 4 cont. (Settings / `settings`) — LAST SCREEN

Audited `routes/settings.tsx` — in-app screen on `PhoneFrame`, bespoke theming
(manual `useModeImage` + `overlay-on-dark` + `text-foreground` vocab). **Audit
only.** Strongest DS-citizen screen of the sweep.

**Compliant — reference screen**
- **Exemplary DS usage:** `Button` (surface="light", `secondary`, sizes
  `icon`/`xs`/`sm`), `SegmentedToggle` (surface flips with mode), `Switch` — all via
  props, zero hand-rolled controls. The model for composing the DS.
- **Rule 4 (padding) correct:** back-arrow header `px-6 pt-14 pb-6`, scroll owns
  `px-6 pb-10` (same correct pattern as Focus area).

**Findings (flagged, not fixed)**
- **[Low-Med] Settings link rows** (`SettingsRowItem`, `:214`) hand-rolled
  `<button>` (icon + label + chevron). Rule 9 maps that shape to `Button
  variant="card"` — BUT these are **grouped table rows w/ hairline dividers** in
  `CardGroup`, distinct from the standalone `card` variant. Defensible bespoke
  (locally factored); flag whether a grouped list-row primitive earns its keep.
- **[Low] Off-scale type:** `text-[15px]` row labels (`:206,217`).
- **[Low] Blur drift:** `CardGroup` `backdrop-blur-sm` → DS `md` (`:180`).
- **[Verify] Bespoke theming:** `text-foreground` + `overlay-on-dark` (overlay
  vocab) instead of `PhoneFrame themed` + white-on-dark. Legit, but **dark-mode
  contrast needs the 4-combo preview** — white-alpha `bg-background/40` cards
  carrying `foreground` text is the likeliest sub-floor spot.
- **[Note]** `SegmentedToggle` flips `surface` dark/light while `Button`s stay
  `surface="light"` (overlay-CTA convention) — minor consistency tension.

---

# ✅ SWEEP COMPLETE — every PAGES screen covered (session 4, 2026-06-08)

All app screens in `AdminSidebar` PAGES are now audited. Auto-run via `/loop`,
one screen per iteration. **Nothing was changed — findings only, per audit-first.**

**Coverage:** Welcome · Login · Employer access · Create account · Accept terms ·
Intro (sessions 1–3) · Creating Your Space · Session/Chat (reconciled from
`HANDOFF-chat-schedule-ds.md`) · Wrap-up · Profile · Focus area · Tools · Sessions ·
Settings · Home (session 3).

**Cross-cutting themes (fix once, clears many screens):**
1. ~~**Type scale**~~ ✅ **DONE 2026-06-08** — see "Type-scale fix" below.
   **Audit correction:** `[15px]`/`[13px]`/`[11px]`/`[18px]`/`[17px]`/`[12px]` are
   **sanctioned** DS scale entries (`ds.typography.tsx` SCALE catalogue) — they were
   NOT violations; my earlier per-screen findings wrongly flagged them. Genuinely
   off-scale was only **22/26/28px + inline-`fontSize` on headings**.
2. **`IconMedallion` adoption + an `xl`(80) size** — hand-rolled frosted icon
   circles in Sessions (`:27`) and Profile EmptyHeroGlow, both `h-20 w-20`. Two
   sites → earns the size.
3. **`Surface` adoption** — Profile hand-rolls frosted cards with **arbitrary
   alphas** (`bg-white/[0.06]`/`[0.04]`) that the Android shim won't lift; migrate
   to `Surface` (Wrap-up already uses it).
4. **`backdrop-blur-sm` → `md`** drift — Profile, Settings, Focus-area, plus the
   open Home/Schedule items. DS source is `md`.
5. **`#66BA24` → `bg-yuna-green`/`NewBadge`** — Tools (`:83`, latent) is the last
   route-level hex; `GREEN_ACCENT` in `profile-components.tsx`/`AppBar.tsx` remain.
6. **Sub-floor contrast (rule 11)** — Profile PreviewRow `/65`, Focus-area eyebrow
   `/65`. Bump to /75+.
7. **Padding standardization** — Wrap-up wrongly puts hero `pt-14 pb-10` on its
   scroll wrapper; Focus-area/Settings show the correct header-carries-`pt-14`
   pattern. Also pick one photo-bg-scrolling gutter (Wrap-up `px-8` vs Focus `px-6`).

**Building blocks still un-audited (their own pass, like AppBar/HomeCards got):**
`profile-components.tsx` (ProgressRing/InsightCard/FocusAreaBentoCard/EmptyStateCard/
MoreButton + `GREEN_ACCENT`), `PastSessionCard`, and the `Waveform` primitive
(chat/voice; still lacks a `/ds` page).

**Best-in-class screens (cite as references):** Settings (DS-component usage),
Focus area (rule-4 padding), Tools (mode-aware gradient/contrast), Sessions (type
scale discipline).

**Recommended next step:** none of the above is fixed. Pick the highest-leverage
cross-cutting theme (the **type-scale decision** unblocks the most) and run a
source-first fix pass — get approval, then propagate via props.

## Type-scale fix (2026-06-08) — first cross-cutting theme resolved

**Decision (user):** off-scale **22px card titles → `text-2xl` (24px)** — tighten,
not document. (+2px on standard card titles; guided & standard titles now match.)
Other off-scale by nearest-token/role. Build passes.

**Source-of-truth:** `ds.typography.tsx` SCALE roles updated (text-2xl now names
content-card titles; text-xl re-roled). No new tokens added.

**Changes (all via class tokens — no inline-style typography left on headings):**
- **22px → `text-2xl`** (12 sites): `HomeCards.tsx` ×6 (card titles), `Card`/DS
  `ds.cards.tsx` ×2, `employer-access.tsx`, `intro.tsx` ×2 (`4.7`/`60k` numerics),
  `ds.chat-bubbles.tsx`.
- **26px → `text-2xl`:** `you.tsx` empty-state h1 + the inline `fontSize:26` stat
  numeric (**rule 7 fixed** — moved off `style`).
- **28px → `text-3xl`:** `focus-area.$num.tsx` title — inline `fontSize:28`/
  `lineHeight` moved to `text-3xl leading-tight`; kept only `fontVariationSettings`
  ('SOFT' 0,'WONK' 1) inline (no token exists for the Fraunces axis).
- **Exact bracket→token (zero visual change):** `text-[24px]`→`text-2xl`,
  `text-[20px]`→`text-xl` (`HomeCards`, `HomeScreen`, `ChatBubble`, `you.tsx`).

**Left as-is (correctly out of scope):** SVG chart `fontSize` attrs (intro/chat —
data-viz, like the donut), wrap-up `text-[44px]` decorative quote glyph, HomeScreen
`text-[26px]` emoji glyph, `AdminSidebar` `text-[9px]` (dev chrome), KeyboardSimulator
(OS chrome), `profile-components.tsx` inline `fontSize` (building-block pass).

**⚠️ Verify before final:** card titles grew 22→24px — **preview Home/feed cards +
employer-access in the 4 combos** (dark×light, iOS×Android) to confirm no wrapping/
clipping at the larger size. The `leading-[1.75]` multiplier on card titles now
yields 42px line height (was 38.5) — eyeball title spacing.

## Earlier "Next" (pre-sweep, still open)
1. **Resolve the held Card decisions above** (title type scale is the main one).
2. **Waveform** — reusable primitive lacking a `/ds` page (chat/voice screens).
3. Outstanding `#66BA24` sweep: still `tools.tsx`, `AppBar.tsx` (notification
   dot), `GREEN_ACCENT` in `profile-components.tsx`. (HomeCards now done.)

## Useful
- Dev server: `npm run dev` (lands on `:8081` when 8080 is taken). Stop by exact
  PID via `lsof -ti tcp:<port>` — never broad-kill.
- Screenshot a `/ds/*` page: headless Chrome
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=/tmp/x.png --window-size=1500,1200 --virtual-time-budget=5000 "http://localhost:8081/ds/drawer"`.
