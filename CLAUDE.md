# Yuna Prototype — Design System & Coding Rules

A React + TanStack Router phone-frame simulator for the Yuna wellness app. Every screen renders inside `PhoneFrame` (photo-bg cluster) or `ScreenChrome` (light app-tab cluster). Tech: React 19, TanStack Start, Tailwind v4, TypeScript, shadcn/Radix primitives.

## Golden rules

1. **Design system first.** Before adding or changing UI, check the DS pages under `/ds/*` (linked in `AdminSidebar.tsx`). If a component, variant, size, or token already exists, use it. Don't reinvent.

2. **Reference, don't reproduce.** Use DS components with props rather than copy-pasting their Tailwind classes into a new `<button>`/`<input>`/etc. This is what makes global edits possible later. If you find yourself writing `rounded-full px-6 py-3.5 bg-foreground text-background` by hand, you should be using `<Button variant="primary" />` instead.

3. **Source-of-truth workflow for DS changes.** When the user asks for a DS-level change (e.g., "change primary button font", "add a destructive variant", "make secondary buttons larger"):
   1. Update the source component (e.g. `src/components/Button.tsx`).
   2. Update the matching DS page (e.g. `src/routes/ds.buttons.tsx`) — variants, sizes, states, the Props reference block, and JSDoc all reflect the new state.
   3. Then propagate to call sites — and do it via the prop, not by editing each file's classes.

   Never propagate before updating the source. Never let the DS page drift from reality.

4. **Padding conventions.** These are the agreed values — don't pick new ones without justification:
   - **Photo-bg hero screens** (Welcome, Auth, Intro): `px-8 pt-14 pb-10` — every section (header, scroll area, footer) shares the same `px-8` so the back arrow + CTAs sit on a single vertical edge.
   - **Tab screens** (Home, You, Progress, Activities): body `px-6`
   - **Header bars** for light app screens (chat, call, ScreenChrome): `px-5 pt-14 pb-2`
   - **Chat conversational scroll**: `px-5` (chat is in the light cluster, denser than hero)
   - **Call body**: `px-8` (heroic centered layout)

5. **No hover states — this is a mobile prototype.** Use `active:` for pressed feedback (already in DS Button). Only `focus-visible:` (keyboard a11y) and `disabled:` are allowed beyond `active:`.

6. **Fonts.**
   - Body copy + button labels: Stara (set on `body`; Buttons inherit it)
   - Headings (`h1`–`h6`): Fraunces — applied by global selector, also available as `.font-display`
   - Utility / micro-copy (uppercase tracked labels, numerics): `font-sans-ui`
   - Don't add a new font without explicit DS approval.

7. **Don't inline-style for color, spacing, or typography.** If you reach for `style={{ backgroundColor: ... }}` on a button, that's a sign to add a variant or token instead. Inline styles are OK only for runtime layout math (keyboard offset, animation transforms, etc.).

8. **Don't hardcode hex colors.** Use Tailwind tokens (`foreground`, `background`, `muted`, `border`, `accent`, etc.) defined in `src/styles.css` `@theme inline`.

9. **Card-as-button is its own pattern, not a Button.** The `rounded-2xl hairline` clickable content cards on Home/You/Progress/Activities are intentionally separate. Don't force them into the DS Button — they may become their own primitive later.

10. **Keep things tight.** No new abstractions, helpers, or wrappers unless they're earned by ≥2 call sites. Prefer editing existing files over creating new ones. Don't write comments that just narrate the code; only comment when the *why* isn't obvious.

11. **Minimum text contrast (light + dark mode).** Both photo backgrounds are noisy, so all body copy and labels must clear the floor below. The token shims in `src/styles.css` (`.overlay-on-dark` + `.theme-light` blocks) enforce these floors — call sites should use these tokens, not pick lower opacities ad-hoc.

   | Role | Dark cluster | Light cluster |
   |---|---|---|
   | Primary text | `text-white` (1.00) | `text-white` / `text-foreground` (inverts to ink) |
   | Body / secondary | `text-white/85` | `text-white/85` (→ ink 0.88) |
   | Meta / value | `text-white/75` (min) | `text-white/70` (→ ink 0.75, min) |
   | Hint / disabled | `text-white/55` (min) | `text-white/55` (→ ink 0.6, min) |

   Don't reach for `text-white/40` or `text-foreground/55` for any text the user is meant to read — the design needs more weight (heavier icon, fill, layout), not lower ink. Inline-style colors (`#cdebb5` on a pale-green chip, hardcoded green gradients, etc.) must be mode-aware via `useAppMode()` or they fail this rule in the opposite mode.

## Source of truth — file map

| Concern | File |
|---|---|
| Buttons | `src/components/Button.tsx` + `src/routes/ds.buttons.tsx` |
| Tokens (color, radius) | `src/styles.css` (`:root`, `.dark`, `@theme inline`) |
| Fonts | `src/styles.css` (`@font-face`, `body`, `.font-display`, `.font-sans-ui`) |
| Phone frame | `src/components/PhoneFrame.tsx` |
| App-tab chrome (header + AppBar) | `src/components/ScreenChrome.tsx` |
| Sidebar (page index) | `src/components/AdminSidebar.tsx` |

## Adding a new screen

1. Pick the cluster: photo-bg (welcome/auth/intro) or light app-tab (home/you/etc.).
2. Wrap in `PhoneFrame` (photo-bg) or `ScreenChrome` (light cluster).
3. Apply the cluster's padding rule (rule 4 above).
4. Every CTA goes through `<Button>` from `@/components/Button`. Pass `surface="dark"` for photo-bg, `surface="light"` for light cluster.
5. Register the page under "Pages" in `AdminSidebar.tsx`.

## Adding a new design-system primitive

1. Build the component in `src/components/<Name>.tsx`.
2. Build a `/ds/<name>` route showing all variants × sizes × states + a Props section.
3. Add it under "Design System" in `AdminSidebar.tsx`.
4. Migrate call sites.

## Flag, don't silently fix

- Inconsistent padding/styling that pre-dates the change — propose a standardization, don't quietly rewrite.
- Unused props/types after a refactor — surface them, ask before deleting.
- A DS-shaped need that doesn't fit an existing variant — propose adding it instead of working around it with `className` overrides.
- Build break or TS error encountered during a sweep — stop and report, don't paper over.

## Workflow checklist before declaring a UI task done

- [ ] Build passes (`npm run build`)
- [ ] DS page reflects any source-component changes
- [ ] No new hardcoded button/input/card markup that should be DS-driven
- [ ] No `font-sans-ui` on body-copy elements (Stara should win there)
- [ ] No `hover:` states added (active: only)
- [ ] Padding matches the cluster rules
