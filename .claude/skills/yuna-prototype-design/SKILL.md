---
name: yuna-prototype-design
description: >-
  How to design and build screens in the Yuna wellness prototype's UI style —
  this React 19 + TanStack Start + Tailwind v4 phone-frame simulator. Use this
  skill whenever the work is shaping how a screen looks or flows: creating,
  laying out, styling, or polishing any screen, flow, drawer, modal, empty /
  loading / error state, or onboarding step in src/routes/*; and whenever the
  ask is visual or UX in nature — "add a screen", "design the X flow", "make
  this look right / on-brand / calmer", "lay this out", "what should this feel
  like", spacing, typography, visual hierarchy, the calm nature-wellness
  aesthetic. Trigger it for any new or restyled Yuna screen even when the user
  doesn't say "design". Works in conjunction with yuna-design-system (the
  component/DS mechanics and consistency rules that back every screen — load it
  too whenever you touch a shared component or token), yuna-visual-design (Yuna
  brand identity, logo, marketing) and yuna-copywriting (Yuna's voice). If you
  are deciding what a Yuna screen looks like or how its flow moves, load this.
  Prefer this over the generic ui-designer, ux-designer, design-system, or
  frontend-design skills for anything inside this prototype. Not for backend
  logic, data/CSV export, build/dependency, or brand/marketing-asset work.
---

# Designing screens in the Yuna prototype

Yuna is a mental-wellness app; its product UI should feel **calm, grounded,
close to nature, and trustworthy** — warm and human, never clinical-cold or
busy. Whitespace is intentional; nothing is crowded. Screens sit on soft nature
photography with frosted-glass surfaces layered over it. You're designing for a
phone simulator, so think in one-thumb reach, short scrolls, and a single clear
action per screen.

This skill covers the *design craft* — composition, rhythm, type, color, flow.
The component mechanics that make it real (which primitive, how props/theming/
parity work) live in **`yuna-design-system`** — load that whenever you touch a
shared component or token. For brand identity (logo, palette names, marketing)
see `yuna-visual-design`; for copy see `yuna-copywriting`.

## Design by composing the system

You almost never style raw markup here. You **assemble documented primitives and
set their props.** Before placing any visual element, assume a component already
exists for it — a button, list-row, divider, badge, tag, chat bubble, toggle,
avatar, text field, calendar, progress bar, rating scale, segmented toggle. (The
full catalog and the rule that enforces this live in `yuna-design-system`.) If
you're about to hand-write `rounded-full px-6 py-3.5 …`, stop — that's a
`<Button>`. Designing *through* the system is what keeps every screen coherent
and lets one edit restyle the whole app.

## Pick the cluster first

Every screen belongs to one of two visual worlds. This decides the wrapper, the
padding, and the default surface.

- **Photo-bg cluster** (`PhoneFrame`) — Welcome, Auth, Intro, the therapist
  flow, session detail. Full-bleed nature photo; frosted surfaces float over it;
  content is white-on-dark. Heroic, spacious, one focal action.
- **Light app-tab cluster** (`ScreenChrome`) — Home, You, Progress, Activities,
  chat, settings. Lighter app surface with a header + bottom AppBar; denser,
  more utilitarian.

In-app screens follow the user's Light/Dark toggle (`themed`); onboarding routes
lock to the dark photo. Match the cluster a screen belongs to — don't mix a
light-cluster pattern onto the photo bg.

## Spatial rhythm (padding)

Generous, consistent spacing is the brand. Use the agreed values — don't invent
new ones:

- **Photo-bg hero, short / no scroll** (Welcome, Auth, Intro): `px-8 pt-14 pb-10`
  — header, scroll area, and footer share `px-8` so the back arrow and CTAs sit
  on one vertical edge.
- **Photo-bg scrolling** (Focus area, Wrap-up, returning You): horizontal
  follows the cluster (`px-8`/`px-6`); **don't** put hero `pt-14`/`pb-10` on a
  scroll wrapper — it eats viewport and clips content. Put `pt-14` on a
  back-arrow header; let scroll content own its vertical padding (`pb-6` at the
  end is enough breathing room).
- **Tab screens** (Home, You, Progress, Activities): body `px-6`.
- **Light app header bars** (chat, call, ScreenChrome): `px-5 pt-14 pb-2`.
- **Chat scroll**: `px-5` (denser). **Call body**: `px-8` (heroic, centered).

## Type

Two families, no exceptions:
- **Fraunces** — headings/display (`h1`–`h6` or `.font-display`). Warm, literary,
  thoughtful. Never Tailwind's `font-serif`. Drawer titles are `text-3xl` — one
  size, don't invent per-drawer sizes.
- **Stara** — body, button labels, UI, tracked-uppercase eyebrows, numerics.
  Clean and functional.
- `font-sans-ui` (system sans) is **only** for simulated OS chrome (keyboard,
  push banners, the iOS permission dialog) — never app content.

## Color & contrast

Color comes from **tokens**, never raw hex (the token system + how to add one
lives in `yuna-design-system`). Design intent:
- Calm, low-saturation surfaces; accents (Yuna green, emotion colors) used
  sparingly for emphasis and success, never as large fills.
- **Respect the contrast floor** — both photos are noisy. For text the user is
  meant to read, stay at or above: primary `text-white`, body `text-white/85`,
  meta `text-white/75`, hint `text-white/60`. If something feels weak, add
  weight (heavier icon, fill, layout) — don't drop to `text-white/40`.

## Theming outcome (author once)

Author every dark-cluster screen in **white-on-dark vocabulary** (`text-white/85`,
`border-white/15`, `bg-white/10`). The `.theme-light` shim inverts it for light
mode automatically, so you design once and it reads in both. Two things you owe
the design: flip a screen's components to `surface="light"` when the app is in
light mode, and make any non-token color mode-aware. **Always preview a new or
changed screen in all four combinations — dark × light, iOS × Android — via the
admin toggles before calling it done.** (The shim machinery and the
`effectiveSurface` pattern are documented in `yuna-design-system`.)

## Interaction & flow

- **No hover — this is a mobile prototype.** Use `active:` for pressed feedback;
  only `focus-visible:` and `disabled:` beyond that. Hover states read as a bug
  on a phone.
- **Forward verb:** onboarding/hero flows advance with **"Continue"**; reserve
  **"Next"** for explicit survey pagination. Don't mix them in one flow.
- **One clear action per screen.** Primary CTA is unmistakable; secondary
  actions recede (link/secondary variants).
- App UI copy is **sentence case**.

## Yuna's voice (in-screen copy)

For depth use `yuna-copywriting`. Two guardrails that are easy to trip:
- **No em dashes** in any Yuna line — bubbles, TTS, chips, character copy. Period
  or rewrite.
- **No fortune-telling.** Yuna reflects what the user *said*; she never claims to
  "read", "sense", or know their inner state.

## Working rhythm

Build the screen by composing primitives → run `npm run build` → preview the
four mode/platform combos → polish spacing and contrast → only then call it done.
When you need a component that doesn't exist yet, or you're changing a shared one,
hand off to **`yuna-design-system`** (extend the source + its DS page first, then
use it) rather than one-off styling. When something pre-existing is inconsistent,
flag it rather than silently reworking it (a "reskin" is visual polish on the
existing structure, not a restructure).
