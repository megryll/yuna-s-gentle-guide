# Yuna design system — conventions

A calm, nature-wellness mobile UI. Components are shipped from the real prototype and render via `window.YunaDS.*` (e.g. `window.YunaDS.Button`). The bundle loads from the root `_ds_bundle.js`; styling comes from the root `styles.css`.

## Setup — no wrapper required

Components are self-contained. There is **no provider to wrap** — light/dark is handled per-component by a `surface` prop, not React context:

- `surface="light"` (default) — light backgrounds.
- `surface="dark"` — dark or photo backgrounds. On a dark/photo panel, pass `surface="dark"` to every component that takes it (`Button`, `Divider`, …).

`ChatBubble` and `Badge` need no `surface` — they are authored white-on-dark and are meant to sit on a dark/photo background (the frosted `ChatBubble` especially — place it on a dark panel, never a white card).

## Styling idiom — Tailwind utilities + semantic tokens

Style your own layout glue with **Tailwind utility classes**, using the design system's **semantic color tokens** (never raw hex). The tokens are real Tailwind colors defined in `styles.css`:

| Token (use as `text-`/`bg-`/`border-`) | Role |
|---|---|
| `foreground` / `background` | primary ink / page surface |
| `muted` / `muted-foreground` | subtle fills / secondary text |
| `border` | hairline borders |
| `popover` / `popover-foreground` | overlay surfaces |
| `primary-green` · `secondary-green` · `primary-beige` · `neutral` | brand palette |
| `alert-orange` (`-pressed`) | warm "destructive" tone (Yuna never uses red for primary destructive) |
| `alert-red` (`-pressed`) | true error / delete |

On dark/photo surfaces, author text in white-alpha (`text-white`, `text-white/85`, `text-white/75` — keep readable, never below `/60`); the app's light-mode shim inverts these to ink automatically at the same alpha.

## Fonts — two families, both ship

- **Body + button/label text: Stara** — set on `body`, inherited everywhere. This is the default; do not reach for a system sans for content.
- **Headings: Fraunces** — apply with the `.font-display` class (or an `h1`–`h6`).

## Where the truth lives

- Tokens, fonts, and the theme shims: **`styles.css`** (read it before styling).
- Each component's exact API: its **`<Name>.d.ts`** (the `<Name>Props` interface) and **`<Name>.prompt.md`**.

## Idiomatic example

```jsx
const { Button, ChatBubble } = window.YunaDS;

// Light tab screen
<div className="bg-background px-6 py-8 flex flex-col gap-4">
  <h1 className="font-display text-2xl text-foreground">Good morning</h1>
  <p className="text-muted-foreground">A few quiet minutes to land before the day.</p>
  <Button variant="primary" fullWidth>Start a session</Button>
  <Button variant="secondary">Maybe later</Button>
</div>

// Dark / photo cluster (e.g. chat)
<div className="px-5 py-6 flex flex-col gap-3" style={{ background: "linear-gradient(155deg,#3a4a40,#1d2a22)" }}>
  <ChatBubble from="yuna" className="max-w-[78%]">What feels heaviest right now?</ChatBubble>
  <div className="flex justify-end">
    <ChatBubble from="user" className="max-w-[78%]">Work has been relentless this week.</ChatBubble>
  </div>
</div>
```
