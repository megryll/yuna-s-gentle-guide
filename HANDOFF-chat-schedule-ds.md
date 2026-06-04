# Handoff — Chat screen (implemented) + Schedule drawer (findings)

_Last updated: 2026-06-04_

In-app-screen DS audit thread, separate from the onboarding-flow audit in
`DS-AUDIT-PROGRESS.md`. Same rules of engagement:

- **Audit-first.** Present findings per screen, get approval, then fix.
- **Build is the gate** — `npm run build` (lint/tsc noisy at baseline, ignore).
- **Source-of-truth workflow** for DS changes: update component → update its
  `/ds/*` page → propagate to call sites via props (never copy classes).
- Preview new/changed UI in dark × light and iOS × Android via admin toggles.

## Git state

- Branch: `main`. **Part A is committed** as `9b8ed4e` (with this doc).
  Last pushed commit is `8d02434` — `9b8ed4e` is **local, not pushed yet**.
- `.claude/` is untracked (local) — do **not** commit it.
- Next: `git push origin main` when ready; then decide A/B on the Schedule drawer.

---

## Part A — Chat screen audit → IMPLEMENTED (uncommitted)

Audited `src/routes/chat.tsx`. Verdict: padding, fonts, color, theming, and
interaction were already clean; the one real gap was that it **bypassed the DS
`ChatBubble` three times**. Implemented the fixes ("do both" — migrate + add the
two DS states), source-first.

### DS additions (source → /ds page → call sites)
- **`ChatBubble` `typing` state** — `src/components/ChatBubble.tsx`: new
  `typing?: boolean` (renders the 3-dot indicator, `role="status"`); `children`
  now optional; JSDoc updated. DS page `src/routes/ds.chat-bubbles.tsx`: new
  **States** section + Props updated.
- **`Button` card `selected` state** — `src/components/Button.tsx`: new
  `selected?: boolean` (card-only: filled highlight + auto checkmark unless
  `trailing` set + `aria-pressed`); JSDoc updated. DS page
  `src/routes/ds.buttons.tsx`: "Selected" row in card state stack + Props updated.

### Migrations / dedupe
- `src/routes/chat.tsx`: local `Bubble`, `VoicePitchCard`, `TypingBubble` now
  compose `<ChatBubble>` (pitch card uses the `attachment` API for the chart;
  mode-aware chart colors preserved). Removed orphaned `Dot`. `frostedImage`
  fed from `useModeImage()` (Android frost fallback now covered). This also
  fixed the `backdrop-blur-sm` vs DS `backdrop-blur-md` drift.
- `src/routes/intro.tsx`: `TypingBubble` deduped onto the new `typing` prop.
- `src/components/VoiceSession.tsx`: `ModeOption` → `<Button variant="card"
  surface="light" selected …>`; removed now-unused `CheckGlyph`.

### Caveats / not done
- The migrated `VoicePitchCard` SVG block kept its original indentation (now
  nested one level deeper). Valid JSX, compiles. **Prettier intentionally NOT
  run** — baseline isn't prettier-clean, a `--write` would bury the diff.
- **Not visually previewed yet.** Build is green but the 4-combo preview
  (dark×light, iOS×Android) hasn't been done — check typing dots, the
  voice-pitch attachment seam, and the voice-mode drawer in both modes.
- Low-pri chat finding left open: the avatar chip frosted ring
  (`chat.tsx:851`, `h-16 w-16 rounded-full bg-white/15 border …`) — folds into
  the IconMedallion primitive proposal below.

---

## Part B — Schedule drawer audit → FINDINGS ONLY (no code yet)

Audited `src/components/SchedulePrioritizeDrawer.tsx`. Theming verified
mode-correct (white-on-dark vocab inverts via `.theme-light` in light, and the
drawer's `.overlay-on-dark` in dark; the drawer portals into the PhoneFrame so
it inherits `.theme-light`).

**Compliant:** uses `Drawer`/`DrawerContent`/`DrawerTitle` correctly (title left
at DS `text-3xl`, only `mt-6` passed); `surface="light"` Schedule button matches
the overlay-CTA convention; contrast floors met; standard alpha stops; DS
`Button`s; no `font-sans-ui`/`hover:`.

**Findings (severity — file refs):**
1. **[Med] Frosted icon medallion is hand-rolled + duplicated.** `line 52`
   (`h-16 w-16 rounded-full bg-white/10 ring-1 ring-white/15`) is identical in
   `wrap-up.tsx:264` and `wrap-up-2.tsx:123`, near-variant in `chat.tsx:851`.
   → **propose an `IconMedallion`/`IconBadge` primitive (+ /ds page)** and
   migrate. Strongest item.
2. **[Low] Date/Time pills** (`Chip`, lines 94–100) — display-only labeled pill
   with no DS home (`SuggestionChip` is interactive w/ arrow; `SentimentTag` is
   sentiment-colored). Accept as bespoke or add a small metadata Tag/Pill.
   Local name `Chip` shadows the DS chip concept.
3. **[Low] Close button `surface="dark"` (line 42)** — every other overlay
   button uses `surface="light"`. Renders identically; consistency nit.
4. **[Low] Inner info card (line 60)** `rounded-2xl border border-white/15
   bg-white/5 backdrop-blur-sm` — bespoke frosted panel (not the `Card` feed
   tile). OK as one-off; adds to the sm/md blur-radius drift.
5. **[Low] One-off type:** "Commit to a follow-up:" is `font-display` (Fraunces)
   **italic 15px** (line 61), outside the Stara label/eyebrow convention
   (rule 6); topic is bespoke `text-[18px] font-semibold`. Confirm intentional.
6. **[Low] Drawer padding `px-8 pt-12 pb-12`** vs `px-6` elsewhere — drawer
   padding isn't standardized in CLAUDE.md; pin a convention.

**Open decision (waiting on user):** (a) extract `IconMedallion` + migrate, and/or
(b) sweep the low-pri nits (close-button surface, type-scale).

---

## Cross-cutting threads
- **IconMedallion primitive** — covers Schedule #1 + chat avatar chip +
  wrap-up/wrap-up-2. Highest-leverage next DS addition.
- **`backdrop-blur` sm/md drift** across frosted surfaces — DS source is `md`.

## Suggested next steps (priority order)
1. **Push** Part A (`9b8ed4e`) when ready.
2. Decide A/B on the Schedule drawer.
3. Extract `IconMedallion` (resolves Schedule #1 + chat #6 + wrap-ups).
4. Continue in-app audit: VoiceSession voice mode, wrap-up / wrap-up-2.
