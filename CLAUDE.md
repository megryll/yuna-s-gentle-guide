# Yuna Prototype — Design System & Coding Rules

A React + TanStack Router phone-frame simulator for the Yuna wellness app. Every screen renders inside `PhoneFrame` (photo-bg cluster) or `ScreenChrome` (light app-tab cluster). Tech: React 19, TanStack Start, Tailwind v4, TypeScript, shadcn/Radix primitives.

## Golden rules

1. **Design system first.** Before adding or changing UI, check the DS pages under `/ds/*` (linked in `AdminSidebar.tsx`). If a component, variant, size, or token already exists, use it. Don't reinvent.

2. **Reference, don't reproduce.** Use DS components with props rather than copy-pasting their Tailwind classes into a new `<button>`/`<input>`/etc. This is what makes global edits possible later. If you find yourself writing `rounded-full px-6 py-3.5 bg-foreground text-background` by hand, you should be using `<Button variant="primary" />` instead.

   **This includes the small structural primitives, not just buttons and inputs.** Before hand-rolling any visual element with raw markup, check whether a DS component already covers it and use it:
   - A labeled or plain separator → `<Divider label="…" surface=… />`, never a hand-built `flex items-center gap-3` + `h-px` + label. (A "Completed Today" / "or" style centered-label rule is exactly `<Divider label>`.)
   - A status pill or completion check → `<Badge>` (text) / `<Badge icon>` (icon-only), never a hand-built rounded-full chip.
   - The same goes for tags, toggles, avatars, chat bubbles, etc. If you're about to write the classes a DS component already encapsulates, stop and use the component.

3. **Source-of-truth workflow for DS changes.** When the user asks for a DS-level change (e.g., "change primary button font", "add a destructive variant", "make secondary buttons larger"):
   1. Update the source component (e.g. `src/components/Button.tsx`).
   2. Update the matching DS page (e.g. `src/routes/ds.buttons.tsx`) — variants, sizes, states, the Props reference block, and JSDoc all reflect the new state.
   3. Then propagate to call sites — and do it via the prop, not by editing each file's classes.

   Never propagate before updating the source. Never let the DS page drift from reality.

   **DS-page parity is mandatory and part of the same change — not a follow-up.** Every variant, size, and state a component supports must be rendered on its `/ds/*` page. When you add or change one (a new prop, a new variant like a list row's 3-dot-menu layout, a new state like "completed"), you MUST add a row/example for it on the DS page in the *same* edit — add it to the right section (`Variants` / `Sizes` / `States`) and to the Props block. Classify it correctly: a *variant* is a distinct form the component takes (with-menu vs. plain row); a *state* is a condition the same form can be in (completed, disabled, pressed). Shipping a component capability that isn't visible on its DS page is an incomplete change. If a capability has a meaningfully different layout in another form of the component (e.g. the list-row vs. tile form of a card), show that form too.

4. **Padding conventions.** These are the agreed values — don't pick new ones without justification:
   - **Photo-bg hero screens, short / no-scroll** (Welcome, Auth, Intro): `px-8 pt-14 pb-10` — every section (header, scroll area, footer) shares the same `px-8` so the back arrow + CTAs sit on a single vertical edge.
   - **Photo-bg scrolling screens** (Focus area, Wrap-up, returning You): horizontal padding follows the cluster (`px-8` or `px-6`), but **don't** add hero-style `pt-14` / `pb-10` to the scroll wrapper — that gutter eats viewport and clips content. Put `pt-14` on a back-arrow header if one exists; let scroll content own its own vertical padding (`pb-6` inside the scroll area is enough for end-of-scroll breathing room).
   - **Tab screens** (Home, You, Progress, Activities): body `px-6`
   - **Header bars** for light app screens (chat, call, ScreenChrome): `px-5 pt-14 pb-2`
   - **Chat conversational scroll**: `px-5` (chat is in the light cluster, denser than hero)
   - **Call body**: `px-8` (heroic centered layout)

5. **No hover states — this is a mobile prototype.** Use `active:` for pressed feedback (already in DS Button). Only `focus-visible:` (keyboard a11y) and `disabled:` are allowed beyond `active:`.

6. **Fonts — two families only.**
   - Body copy + button labels: Stara (set on `body`; Buttons inherit it)
   - Headings (`h1`–`h6`): Fraunces — applied by global selector, also available as `.font-display`. Use `font-display`, never Tailwind's `font-serif` (that's a generic serif stack, not Fraunces).
   - Tracked-uppercase labels, eyebrows, and numerics stay in Stara — don't reach for a system sans.
   - `font-sans-ui` (system sans) is **not** a third design font. It's reserved exclusively for simulated device/OS chrome — keyboard keys, push-notification banners, the iOS permission dialog. Never use it for app content.
   - Don't add a new font without explicit DS approval.
   - Drawer titles are `text-3xl` (30px) — the one drawer-title size in the DS scale. Don't introduce per-drawer sizes.

7. **Don't inline-style for color, spacing, or typography.** If you reach for `style={{ backgroundColor: ... }}` on a button, that's a sign to add a variant or token instead. Inline styles are OK only for runtime layout math (keyboard offset, animation transforms, etc.).

8. **Don't hardcode hex colors.** Use Tailwind tokens (`foreground`, `background`, `muted`, `border`, `accent`, etc.) defined in `src/styles.css` `@theme inline`.

9. **Two different "card" things — don't conflate them.**
   - **List-row option cards** — a full-width selectable row (title + optional subtitle + trailing chevron, e.g. Welcome's sign-up choices) — are `<Button variant="card">`. Use the prop (`subtitle`, `trailing`), never hand-rolled `rounded-2xl border` markup.
   - **Content / feed cards** — the `rounded-2xl hairline` tappable content tiles on Home/You/Progress/Activities — remain their own pattern. Don't force them into the DS Button; they may become their own primitive later.

10. **Keep things tight.** No new abstractions, helpers, or wrappers unless they're earned by ≥2 call sites. Prefer editing existing files over creating new ones. Don't write comments that just narrate the code; only comment when the *why* isn't obvious.

11. **Minimum text contrast (light + dark mode).** Both photo backgrounds are noisy, so all body copy and labels must clear the floor below. The token shims in `src/styles.css` (`.overlay-on-dark` + `.theme-light` blocks) enforce these floors — call sites should use these tokens, not pick lower opacities ad-hoc.

   | Role | Dark cluster | Light cluster |
   |---|---|---|
   | Primary text | `text-white` (1.00) | `text-white` / `text-foreground` (inverts to ink, 1.00) |
   | Body / secondary | `text-white/85` | `text-white/85` (→ ink 0.85) |
   | Meta / value | `text-white/75` (min) | `text-white/75` (→ ink 0.75, min) |
   | Hint / disabled | `text-white/60` (min) | `text-white/60` (→ ink 0.60, min) |

   The same opacity holds across clusters — the light cluster inverts white to ink at the *same* alpha, so a token reads identically whichever photo it sits on.

   Don't reach for `text-white/40` or `text-foreground/55` for any text the user is meant to read — the design needs more weight (heavier icon, fill, layout), not lower ink. Inline-style colors (`#cdebb5` on a pale-green chip, hardcoded green gradients, etc.) must be mode-aware via `useAppMode()` or they fail this rule in the opposite mode.

## Theming: three axes

Every pixel is decided by three independent axes. Thread them through **props and tokens** — never branch on them with hardcoded styles. The shims in `styles.css` do the heavy lifting; your job is to use the vocabulary they recognize.

**1. Cluster — which background a thing sits on.** Carried by the `surface` prop:
- `surface="dark"` — photo-bg cluster (Welcome, Auth, Intro; Home/You/Progress while in dark mode).
- `surface="light"` — light app-tab cluster.

DS components take `surface` — pass it, don't restyle. **House default rule:** photo-cluster primitives (MultipleChoice, StepDots, CalendarPicker, ProgressBar, TherapistCard, YunaExplains, SegmentedToggle, RatingScale, …) default `surface="dark"`; light form controls (`Button`, `Switch`) default `surface="light"`. No DS component should *require* `surface` — give it the default for its cluster.

**2. App mode — the user's Light/Dark toggle** (`useAppMode()` → `"dark" | "light"`). Drives the photo and inverts ink:
- `PhoneFrame themed` swaps the photo (`/dark4-blur.png` ↔ `/light-blur-bg.png`) and adds `.theme-light` in light mode. `.theme-light` remaps every `text-white/*` → ink and `border-white/*` → dark — so **a dark-cluster screen authored with `text-white/85` reads correctly in light mode automatically. Author once, in white-on-dark vocabulary.**
- A `surface="dark"` screen must drop its DS components to `surface="light"` when the app is in light mode. `ScreenChrome` already derives this (`effectiveSurface`); copy that pattern on bespoke screens — don't leave dark-styled controls on the light photo.
- **Mode lock:** onboarding routes (auth, login, accept-terms, intro, employer-access) stay on the dark photo regardless of the toggle via `useDarkBlurImage()`; Welcome uses the lush `useWelcomeImage()`. In-app screens follow the toggle (`themed`).
- **Overlays** (drawer, dialog) add `.overlay-on-dark` in dark mode to repoint `bg-background`/`bg-card` → white-alpha. Reuse the `mode === "dark" && "overlay-on-dark"` pattern from `ui/drawer.tsx`; don't hand-pick overlay fills.
- **Inline / arbitrary colors are invisible to `.theme-light`.** Any non-token color (a green chip, a gradient) must branch on `useAppMode()` itself, or it breaks in the opposite mode (rule 11).

**3. Platform — simulated device** (`usePlatform()` → `"ios" | "android"`). `PhoneFrame` adds `.platform-android`, which **kills all backdrop blur** and lifts white-alpha / off-white surface opacities so frosted cards stay defined without it:
- Never let `backdrop-blur` be the *only* thing separating a surface from its background — it vanishes on Android. Pair it with a fill the shim can lift.
- Use standard Tailwind alpha stops (`bg-white/10`, `bg-background/60`, …) so the Android remaps apply; a one-off arbitrary alpha won't be covered.
- The only place iOS/Android diverges in type is `font-sans-ui`, and that's reserved for simulated OS chrome (keyboard, notification banners, permission dialog) — never app content (rule 6).

**Always preview a new/changed screen in all four combinations — dark × light, iOS × Android — via the admin toggles before calling it done.**

## Source of truth — file map

| Concern | File |
|---|---|
| Buttons (incl. `card` + `link` variants) | `src/components/Button.tsx` + `src/routes/ds.buttons.tsx` |
| Avatars (+ glow aura) | `src/components/YunaAvatar.tsx` + `src/routes/ds.avatars.tsx` |
| Chat bubbles | `src/components/ChatBubble.tsx` + `src/routes/ds.chat-bubbles.tsx` |
| Tokens (color, radius) | `src/styles.css` (`:root`, `.dark`, `@theme inline`) |
| Fonts | `src/styles.css` (`@font-face`, `body`, `.font-display`, `.font-sans-ui`) |
| Phone frame | `src/components/PhoneFrame.tsx` |
| App-tab chrome (header + AppBar) | `src/components/ScreenChrome.tsx` |
| Light/dark mode (toggle, photo, ink inversion) | `src/lib/theme-prefs.ts` + `.theme-light` / `.overlay-on-dark` in `src/styles.css` |
| iOS/Android platform (blur kill, surface lift) | `src/lib/platform.ts` + `.platform-android` in `src/styles.css` |
| DS-page doc kit (DSPage / Section / SurfaceMatrix / PropsBlock) | `src/ds-docs/surface.tsx` |
| Sidebar (page index) | `src/components/AdminSidebar.tsx` |

## Adding a new screen

1. Pick the cluster: photo-bg (welcome/auth/intro) or light app-tab (home/you/etc.).
2. Wrap in `PhoneFrame` (photo-bg) or `ScreenChrome` (light cluster). For in-app screens that follow the user's toggle, pass `themed`; onboarding routes lock to the dark photo (see Theming).
3. Apply the cluster's padding rule (rule 4 above).
4. Build the UI by composing existing DS components and adjusting their **props** — don't hand-roll a button / input / toggle / tag (rule 2). Pass `surface="dark"` on the photo cluster and `surface="light"` on the light cluster, and flip a dark-cluster screen's components to `surface="light"` when the app is in light mode.
5. For anything the DS doesn't cover, check whether it's a missing variant (extend the source + DS page, rule 3) before writing one-off markup.
6. Register the page under "Pages" (`PAGES`) in `AdminSidebar.tsx`.
7. Preview in dark × light and iOS × Android before declaring done.

## Adding a new design-system primitive

1. Build the component in `src/components/<Name>.tsx`. Give it a `surface` prop if it can ever sit on the dark cluster, and a JSDoc header documenting every prop (this is the source the DS page mirrors).
2. Build a `/ds/<name>` route with the doc kit in `src/ds-docs/surface.tsx` (`ds-docs/` is doc-only — the app never imports it). The house anatomy is strict, so the DS reads as one reusable system rather than per-app pages:
   - **Sections are only `Variants`, `Sizes`, `States`** (include the ones that apply), then `Props` last. Never invent app-specific section names ("From", "Glow", "Onboarding"). Row labels name the variant/size/state itself (`Primary`, `md`, `Disabled`), never where it's used.
   - **App-agnostic — no prose tying a component to a screen or call site.** Drop "used on Home", "the rightmost one", usage history, px-where-used. No section subtitles unless one genuinely prevents misuse; let the examples speak.
   - Render every row on **both** photo surfaces with `<SurfaceMatrix rows={…}>` (labelled rows × dark + light columns) — or `<SurfacePair>` for free-form layouts. Never document on one surface only.
   - Close with `<Section title="Props"><PropsBlock>{…}</PropsBlock></Section>` — a plain-text prop signature with types + defaults mirroring the real API. Keep it, the JSDoc, and the component in sync (rule 3).
3. Register it under "Design System" (`DS_PAGES`) in `AdminSidebar.tsx`.
4. Migrate call sites — via the prop, not by copying classes.

## Flag, don't silently fix

- Inconsistent padding/styling that pre-dates the change — propose a standardization, don't quietly rewrite.
- Unused props/types after a refactor — surface them, ask before deleting.
- A component or variant with no remaining call sites — once a change removes the last real usage of a DS component, variant, size, or prop, flag it and propose deleting it (component + its DS page entry + sidebar registration) rather than leaving dead code. "Real usage" excludes the component's own `/ds/*` page and `ds-docs/` — a primitive referenced only by its own showcase is orphaned. Don't delete without surfacing it first.
- A DS-shaped need that doesn't fit an existing variant — propose adding it instead of working around it with `className` overrides.
- Build break or TS error encountered during a sweep — stop and report, don't paper over.

## Workflow checklist before declaring a UI task done

- [ ] Build passes (`npm run build`)
- [ ] DS page reflects any source-component changes
- [ ] No new hardcoded button/input/card markup that should be DS-driven
- [ ] No `font-sans-ui` outside simulated OS chrome (Stara wins for all app content)
- [ ] No `hover:` states added (active: only)
- [ ] Padding matches the cluster rules
- [ ] `surface` matches the cluster, and flips to `light` when the app is in light mode
- [ ] Reads correctly in dark **and** light mode (no sub-floor contrast; inline/arbitrary colors are mode-aware)
- [ ] Reads correctly on iOS **and** Android (no surface relies on blur alone)
