# Handoff — Home feed card redesign

**Goal:** the "Created For You" home feed felt monotonous (every card a tinted
photo) and low-contrast. This pass introduces a solid/photo mix, fixes the
cards to one look across light/dark, refreshes colors, and reworks the home
hero. All changes are inline-styles/Tailwind-token compliant per `CLAUDE.md`.

Build passes (`npm run build`). Verified in dark × light and iOS × Android via
Playwright screenshots (Playwright was installed only for verification and
uninstalled — not in `package.json`).

## What changed

### 1. Solid vs. photo card mix
Card backgrounds are now split by type (`src/lib/home-cards.ts`, `KIND_META`):
- **Solid fill** (`solidBg`): gratitude, book, learn-skill, self-discovery.
- **Photo** (`naturePath`): meditation, affirmation, guided-session, accountability.

Colors live in the data layer alongside the existing `accent` precedent:
| type | solidBg | tone |
|---|---|---|
| gratitude | `#B4C6D6` (muted dusty blue) | light (dark ink) |
| book | `#F2E7C9` (warm cream) | light (dark ink) |
| learn-skill | `#2C5C3D` (forest green) | dark (white ink) |
| self-discovery | `#6E5A6B` (muted plum) | dark (white ink) |

### 2. Cards are mode-independent (FIXED look in light AND dark)
This is the key structural decision.
- **Photo cards always use the dark cluster** — black wash (`rgba(0,0,0,0.35)`,
  reduced from 0.55) + white ink — in both app modes. So a photo card looks
  identical whether the app toggle is light or dark.
- **Solid cards** carry a fixed fill; pale fills use tone `light` (token-based
  ink text, survives both modes natively), deep fills use tone `dark`.

Because `PhoneFrame` never applies `.dark` (tokens always resolve to `:root`
ink) but DOES apply `.theme-light` in light mode, any **white-ink** card needs
its ink pinned against that shim. That's the `.card-fixed-dark` class
(`src/styles.css`, formerly `.card-solid-dark`) — applied to every tone `dark`
card (all photo cards + the two dark solids). It re-asserts `text-white*`,
`border-white*`, `bg-white*` at higher specificity than `.theme-light .*`.

Consequence: the `surface` prop on `<Card>` became dead and was **removed**.
`cardSurface()` no longer takes `isLight` (always dark wash).

### 3. Colors / shape polish
- Reduced photo tint (contrast complaint): dark `0.55 → 0.35`.
- Card-view tiles `rounded-2xl → rounded-[2.5rem]` (40px).
- Past-session + tools cards `rounded-2xl → rounded-3xl`.
- List-row cards `rounded-xl → rounded-2xl`, and now **match the solid/photo
  split** (solid rows for solid types, photo rows otherwise).
- Solid-card border (ring) now echoes the button/text ink at a soft alpha:
  `ring-white/20` (dark fills) / `ring-foreground/20` (pale fills).
- **Removed emojis** from card-type labels (dropped the `emoji` field from
  `CardKindMeta`/`CardChromeMeta` + all data + render sites). The guided-session
  Yuna avatar leading glyph stays (it's not an emoji).

### 4. Home hero (`src/components/HomeScreen.tsx`)
- **Chat Now** button: narrower (`fullWidth={false}`), centered, with the Yuna
  avatar on the leading edge (falls back to the brand mark when no avatar set).
  Title/subtitle centered above it.
- **Rotating greeting**: `RETURNING_GREETINGS` (6 on-brand variants, no em
  dashes / no fortune-telling) picked on mount, so each reload shows a fresh
  one. Resolved client-side (like name/identity) → no hydration mismatch.

### 5. Design-system sync (rule 3)
- `SuggestionChip` gained a `leading?` slot (documented + demo row in
  `src/routes/ds.suggestion-chip.tsx`).
- `ds.cards.tsx`: added a Variants section (Photo / Solid-light / Solid-dark),
  updated Props block, removed `surface`, removed emoji from demos.

## Files touched
- `src/components/Card.tsx` — solidFill, always-dark photo, card-fixed-dark, radius, ring
- `src/components/HomeCards.tsx` — solid cards, light-tone gratitude/book, solid rows, no emoji
- `src/components/HomeScreen.tsx` — rotating greeting, centered hero, Chat Now + avatar
- `src/components/SuggestionChip.tsx` — `leading` slot
- `src/components/PastSessionCard.tsx` — radius
- `src/lib/home-cards.ts` — solidBg + tones, removed emoji field, colors
- `src/styles.css` — `.card-fixed-dark` pin block (renamed/generalized)
- `src/routes/ds.cards.tsx`, `src/routes/ds.suggestion-chip.tsx`, `src/routes/tools.tsx`

## Open items / flags for next session
- **Dark solids in dark mode**: forest skill + plum questionnaire sit fairly
  close in value to the dark forest page bg. Readable (ring + hue), but could
  lift the fills slightly if more pop is wanted.
- Greeting flash: on mount the greeting briefly shows index 0 before the random
  pick (same pattern as name resolving). Imperceptible in practice; revisit if
  it bothers.
- `.claude/` is untracked local settings — intentionally not committed.
