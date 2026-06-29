# design-sync notes — Yuna prototype

Repo-specific gotchas for future `/design-sync` runs.

## Shape & build

- **Not a component library** — this is a TanStack Start app. There is no built component `dist/` entry, so we use a hand-written **`entry`** (`.design-sync/pilot-entry.tsx`) that re-exports the synced components. Widen that file (or move to synth-entry) when scaling past the pilot.
- **Package manager: npm.** Both `bun.lockb` and `package-lock.json` exist; the repo is operated with **npm** (`npm run build`). Auto-detect would wrongly pick bun.
- **CSS = the compiled Tailwind output**, not `src/styles.css` (which is just `@import "tailwindcss"` + `@theme` tokens — utilities are generated at build time). `cfg.cssEntry` points at `dist/client/assets/styles-*.css`. ⚠️ **The filename is content-hashed** — re-run `npm run build` and update `cssEntry` to the new hash before each sync (or stabilize this later).
- **No provider needed.** `useAppMode`/`usePlatform` (theme/platform) use `useSyncExternalStore` over localStorage with safe defaults (`dark` / `ios`) — components render unwrapped.
- **`@/` alias** → `src/*` (tsconfig `paths`, Bundler resolution, no baseUrl).

## Fonts

- Brand fonts (Stara body, Fraunces headings) live in `public/fonts/` and are referenced by the compiled CSS as absolute `/fonts/*.{otf,ttf}`. If the converter flags `[FONT_MISSING]`/`[FONT_DANGLING]`, wire `cfg.extraFonts` at `public/fonts/`.

## Scope (this run)

- **Pilot: 5 components** — Button, Badge, Divider, YunaAvatar, ChatBubble. The full DS is ~60 primitives in `src/components/*.tsx` with `/ds/*` doc routes as the spec.

## Accepted warnings (not failures)

- `[FONT_MISSING] "Inter"` — only in the `font-sans-ui` fallback stack (reserved for simulated OS chrome, never app content). System substitute is fine; none of the synced components use it.
- `[TOKENS_MISSING] --frame-w/-h/--dx/--fall/--cr` — runtime CSS vars set inline by PhoneFrame/Confetti, not by any synced component.
- `[RENDER_SKIPPED]` — no Playwright/Chromium on this machine; verification was **human review** of `.review.html`, by choice. A future run can install chromium for machine grading.

## Asset limitation (important)

- **`<img src="/...">` public assets do NOT ship.** YunaAvatar's photos (`/avatars/*.png`, `/avatar.png`) render transparent in the bundle. The pilot preview hides the broken img (`.ya-stand img{opacity:0}`) and lays a brand-green gradient + lucide image glyph behind it as a stand-in — faithful shape/size/glow, but NOT the real photo. Lucide icons are fine (they bundle as React). To ship real avatars, the public assets would need to be uploaded and the component's absolute paths served at the project root.

## This run (2026-06-29) — first sync

- Uploaded 5 components (Button, Badge, Divider, YunaAvatar, ChatBubble) → project `f23f94e4-bd2e-4ac0-af19-50f18ebbd79a` ("Yuna Design System"), incremental path, 44 files + anchor. Real prop contracts via `dtsPropsFor` (the bundle ships no `.d.ts`, so ts-morph extracted nothing — these are hand-maintained). Conventions header authored at `conventions.md`.

## Re-sync risks

- `cssEntry` hash drifts every build (see above) — the #1 thing to refresh.
- Pilot entry is a manual list — adding components to the sync means editing `pilot-entry.tsx` + `componentSrcMap` together.
- `dtsPropsFor` is hand-maintained (no shipped `.d.ts`). If a component's real props change, update its entry or the design agent codes against a stale contract.
- Scaling past the pilot: widen `pilot-entry.tsx` + `componentSrcMap` + `dtsPropsFor` together; watch for components that pull heavy deps (drawers, MeditationPlayer, CommentLayer/Supabase) into the esbuild bundle, and image-dependent components (asset limitation above).
