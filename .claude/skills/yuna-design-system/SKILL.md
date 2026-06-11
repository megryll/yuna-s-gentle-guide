---
name: yuna-design-system
description: >-
  How to manage and extend the Yuna prototype's design system and keep the
  codebase internally consistent (React 19 + TanStack Start + Tailwind v4 phone
  simulator). Use this skill whenever the work is about components, tokens, or
  consistency rather than one screen's look: creating, changing, documenting, or
  propagating a DS component / variant / size / state / token; editing anything
  in src/components/* or src/styles.css; adding a primitive and its /ds/* page;
  "change the button", "add a destructive variant", "make secondary larger";
  DS-page parity; refactors and migrations; "does this follow our rules / audit
  this / is this consistent"; theming machinery (the surface prop, the
  .theme-light / .overlay-on-dark / .platform-android shims, effectiveSurface);
  and build / verify. Trigger it for any shared-component or token change even
  when the user doesn't say "design system". Works in conjunction with
  yuna-prototype-design (designing the screens that consume these components —
  load it too when shaping a screen's look/flow), yuna-visual-design (brand) and
  yuna-copywriting (voice). If you're touching the component system, tokens, DS
  pages, or guarding consistency, load this. Prefer this over the generic
  design-system, ui-designer, or frontend-design skills for this codebase. Not
  for a single screen's look-and-feel alone (use yuna-prototype-design), brand
  assets, copy, or non-UI backend/data/build work.
---

# Managing the Yuna design system

This prototype exists to prove out a **consistent** design system: screens are
composed from a small set of documented primitives, themed through a few axes,
so a single edit propagates everywhere. Your job here is to keep that true — make
components reusable, keep their docs honest, and extend the system deliberately
instead of working around it.

The authoritative rulebook is **`CLAUDE.md`** at the repo root; the live
component reference is the **`/ds/*` pages** (indexed in
`src/components/AdminSidebar.tsx`). This skill is the working manual for the
*system mechanics*. For the design craft of individual screens (composition,
rhythm, type, color feel), use **`yuna-prototype-design`**. When this skill and
`CLAUDE.md`/the source ever disagree, the source wins — flag it.

## The core discipline: reference, don't reproduce

1. **Design system first.** Before adding or changing UI, check `/ds/*`. If a
   component, variant, size, or token already exists, use it. Don't reinvent.

2. **Use props, not copied classes.** Drive DS components through their props
   rather than copy-pasting their Tailwind into fresh markup. This is the single
   thing that makes global edits possible. Hand-writing
   `rounded-full px-6 py-3.5 bg-foreground text-background` means you should be
   using `<Button variant="primary">`. Applies to the small primitives too:
   separators → `<Divider>`, status pills/checks → `<Badge>`/`<Badge icon>`,
   plus tags, toggles, avatars, chat bubbles, checkboxes, text areas. If you're
   about to write the classes a component already encapsulates, stop.

3. **Two different "cards" — don't conflate.** A full-width selectable
   **list-row** (title + optional subtitle + chevron) is `<Button variant="card">`
   (`subtitle`/`trailing` props). The **content/feed tiles** on
   Home/You/Progress are their own `rounded-2xl hairline` pattern — don't force
   them into `Button`.

4. **No inline styles for color, spacing, or typography; no hardcoded hex.**
   Reaching for `style={{ backgroundColor }}` is a signal to add a variant or
   token. Inline style is OK only for runtime layout math (keyboard offset,
   transforms). Colors come from tokens in `src/styles.css` `@theme inline`
   (`foreground`, `background`, `muted`, `border`, `accent`, `secondary-green`,
   the emotion tokens `--rose`/`--aqua`/`--blue`/`--purple-soft`, …). A raw hex
   that duplicates a token is a bug; a needed color with no token gets promoted
   to a token first, then referenced.

5. **Keep it tight.** No new abstraction, helper, or wrapper unless ≥2 real call
   sites earn it. Prefer editing an existing file over creating one. Comment only
   when the *why* isn't obvious.

## Changing a DS component: source-out, never page-first

When the user asks for a DS-level change ("change the primary button font", "add
a destructive variant", "make secondary buttons larger"):

1. **Edit the source component** (`src/components/<Name>.tsx`) and its JSDoc.
2. **Update its `/ds/<name>` page in the same change** — DS-page parity is
   mandatory, not a follow-up. Every variant, size, and state the component
   supports must render on its page, plus the Props block. Shipping a capability
   that isn't on the DS page is an *incomplete change*. Classify correctly: a
   *variant* is a distinct form the component takes (with-menu row vs plain row);
   a *state* is a condition one form can be in (completed, disabled, pressed). If
   a form has a meaningfully different layout, show that form too.
3. **Then propagate to call sites — via the prop**, not by editing each file's
   classes.

Never propagate before updating the source. Never let the DS page drift from
reality.

## Adding a new primitive

1. Build `src/components/<Name>.tsx`. Give it a `surface` prop if it can ever sit
   on the dark cluster, and a JSDoc documenting every prop (the DS page mirrors
   this).
2. Build a `/ds/<name>` route with the doc kit in `src/ds-docs/surface.tsx`
   (`ds-docs/` is doc-only; the app never imports it). House anatomy is strict so
   the DS reads as one system:
   - Sections are only **`Variants`, `Sizes`, `States`** (the ones that apply),
     then **`Props`** last. Never invent app-specific section names. Row labels
     name the variant/size/state itself (`Primary`, `md`, `Disabled`), never
     where it's used.
   - **App-agnostic** — no prose tying a component to a screen or call site.
   - Render every row on **both** photo surfaces with `SurfaceMatrix` (labelled
     rows × dark+light) or `SurfacePair` (free-form). Never one surface only.
   - Close with `<Section title="Props"><PropsBlock>` — a plain-text signature
     with types + defaults mirroring the real API. Keep it, the JSDoc, and the
     component in sync.
3. Register under `DS_PAGES` in `AdminSidebar.tsx`.
4. Migrate call sites via the prop.

## Theming machinery (three axes)

Every pixel is decided by three independent axes. Thread them through **props and
tokens**; never branch on them with hardcoded styles. The shims in `styles.css`
do the work — use the vocabulary they recognize.

1. **Cluster** — the `surface` prop (`"dark"` photo / `"light"` app-tab).
   Components take `surface`; pass it, don't restyle. **House default rule:**
   photo-cluster primitives default `surface="dark"`; light form controls
   (`Button`, `Switch`) default `"light"`. No DS component should *require*
   `surface` — give it the default for its cluster.
2. **App mode** — `useAppMode()`. `PhoneFrame themed` swaps the photo and adds
   `.theme-light`, which remaps every `text-white/*` → ink and `border-white/*`
   → dark. So a screen authored white-on-dark reads in light mode for free. A
   `surface="dark"` screen must drop its components to `surface="light"` in
   light mode — derive `effectiveSurface = useAppMode() === "light" ? "light" :
   "dark"` (copy `ScreenChrome.tsx`). Overlays (drawer/dialog) add
   `.overlay-on-dark` in dark mode to repoint `bg-background`/`bg-card` →
   white-alpha — reuse the `mode === "dark" && "overlay-on-dark"` pattern; don't
   hand-pick fills.
3. **Platform** — `usePlatform()`. `.platform-android` **kills all backdrop
   blur** and lifts white-alpha / off-white opacities. Never let `backdrop-blur`
   be the *only* separation between a surface and its background — pair it with a
   shim-liftable fill. Use standard alpha stops (`bg-white/10`, `bg-background/60`)
   so the Android remaps apply.

**Inline / arbitrary colors are invisible to `.theme-light`** — any non-token
color must branch on `useAppMode()` or it breaks in the opposite mode. The only
type divergence between iOS/Android is `font-sans-ui`, reserved for simulated OS
chrome — never app content.

## Flag, don't silently fix

Surface these to the user instead of quietly rewriting:
- Pre-existing inconsistent padding/styling — propose a standardization.
- Unused props/types after a refactor — ask before deleting.
- A component/variant whose last *real* call site is gone — propose deleting
  component + DS page entry + sidebar registration. "Real usage" **excludes** a
  primitive's own `/ds/*` page and `ds-docs/`; "where is X used" means the
  prototype only.
- A DS-shaped need that doesn't fit an existing variant — propose adding it, not
  a `className` override.
- A build break or TS error during a sweep — stop and report, don't paper over.
- "Reskin" means visual polish on existing structure — never restructure or
  add/remove elements under that label.

## Build is the gate

`npm run build` is the only green check that matters. Lint (Prettier) and `tsc`
are noisy at baseline — **don't chase them**; cleaning unrelated lint/type noise
is wasted motion. Run the build after a change set and before declaring done.

Operational caution: **never `pkill -f` / `killall`** — it has killed the dev
server. Find the exact PID with `lsof` first.

## Patterns worth reusing (not re-implementing)

- Transient in-screen toasts: `useTransientToast()` (`lib/use-transient-toast.ts`,
  one shared duration). One-shot message handoffs between screens:
  `createOneShot` (`lib/one-shot.ts`). Don't hand-roll a per-screen `setTimeout`
  toast.
- Reactive one-shot drawer triggers (topic + active flag) follow
  `lib/schedule-prompt.ts` (`useSyncExternalStore`) — different shape from the
  consume-on-mount one-shots above.
- Resolved DS-audit findings and remaining items live in `AUDIT.md` and
  `DS-AUDIT-PROGRESS.md` — read them before re-auditing the same screens.

## Source-of-truth file map

| Concern | File |
|---|---|
| The full rulebook | `CLAUDE.md` (repo root) |
| Live component reference | `/ds/*` routes, indexed in `src/components/AdminSidebar.tsx` |
| Buttons (incl. `card`/`link`) | `Button.tsx` + `ds.buttons.tsx` |
| Tokens (color, radius) | `src/styles.css` (`:root`, `.dark`, `@theme inline`) |
| Shims: `.theme-light`, `.overlay-on-dark`, `.platform-android`, fonts | `src/styles.css` |
| Phone frame / app chrome | `PhoneFrame.tsx` / `ScreenChrome.tsx` |
| Light/dark mode + photo + ink inversion | `src/lib/theme-prefs.ts` |
| iOS/Android platform | `src/lib/platform.ts` |
| DS-page doc kit | `src/ds-docs/surface.tsx` |
| Page + DS index | `src/components/AdminSidebar.tsx` |

DS primitives (each has a `/ds/<name>` page): Accordion, Avatar, Badge, Button,
CalendarPicker, Card, CardSuggestion, ChatBubble, Checkbox, Divider, Drawer,
Icons, MultipleChoice, PageHeader, ProgressBar, RadialProgress, RatingScale,
SegmentedToggle, Slider, StepDots, Surface, Switch, Tag, TextArea, TextField,
TherapistCard, Toast, YunaExplains.

## Done checklist (DS / consistency work)

- [ ] `npm run build` passes
- [ ] Source component + its `/ds/<name>` page + JSDoc all in sync (variants,
      sizes, states, Props)
- [ ] Call sites migrated via the prop, not copied classes
- [ ] New primitive registered in `DS_PAGES`; new screen in `PAGES`
- [ ] `surface` defaults set (no required `surface`); flips to `light` in light
      mode where consumed
- [ ] No new hardcoded hex / inline color-spacing-type
- [ ] Renders correctly across dark × light and iOS × Android (no blur-alone
      surface; inline colors mode-aware)
- [ ] Any dead component/variant/prop flagged, not left lingering
