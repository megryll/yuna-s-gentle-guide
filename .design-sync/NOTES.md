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

## This run (2026-06-29) — widened to full 31-component roster

- **Roster (31):** Accordion, AppBar, Badge, Button, CalendarPicker, Card, CardSuggestion, ChatBubble, Checkbox, DictationField, DictationTextArea, Divider, HomeCards, IconMedallion, MultipleChoice, PageHeader, ProgressBar, RadialProgress, RatingScale, SegmentedToggle, Slider, StepDots, Surface, Switch, Tag, TextArea, TextField, Toast, Waveform, YunaAvatar, YunaExplains. All 31 src-matched, bundle built + validated (exit 0). No exclusions.
- **`HomeCards` is an alias.** `HomeCards.tsx` exports `HomeCardItem` + `HomeCardRow` — no `HomeCards` symbol. The DS-documented primitive (ds.cards) is `HomeCardRow`, so the entry re-exports `HomeCardRow as HomeCards`. componentSrcMap maps `HomeCards → src/components/HomeCards.tsx`.
- Waveform / YunaExplains / IconMedallion all live in same-named files with same-named exports — no special handling needed (only HomeCards diverged).
- **Props = REAL for all 31 components** (no stubs). 22 are extracted automatically from emitted `.d.ts`; 9 come from hand-authored `dtsPropsFor`; the 5 pilot keep their curated `dtsPropsFor` (unchanged). See the tsc-declarations procedure below.
- **tsc-declarations approach WORKS — from a repo-ROOT `declarationDir` (not under `.design-sync/`).**
  - Why the earlier `.design-sync/.dts/` attempt failed: PKG_DIR for this path-entry config walks up from `.design-sync/pilot-entry.tsx` to the first package.json with a `name` → the **repo root**. `findTypesRoot(repoRoot)` finds no `types`/dist-`.d.ts`, so it returns the repo root, and the ts-morph scan glob is `<repoRoot>/**/*.d.ts` (excluding `**/node_modules/**`). A `declarationDir` UNDER `.design-sync/` (or any dot-dir) is **invisible** to that glob, because ts-morph fast-glob ignores dot-directories by default (`dot:false`). That's the real reason `[DTS] parsed 0` — not a `.design-sync` exclusion.
  - **Working procedure (regenerates real props on every re-sync):**
    1. `tsconfig.dts.json` at the **repo root** — extends `./tsconfig.json` with `{noEmit:false, declaration:true, emitDeclarationOnly:true, declarationDir:"./ds-types", allowImportingTsExtensions:false}` and `include: ["src/components/**/*.tsx","src/components/**/*.ts","src/lib/**/*.ts"]`. (`allowImportingTsExtensions` MUST be turned off — it's incompatible with emit; the root tsconfig sets it true for the app build.)
    2. `rm -rf ds-types && npx tsc -p tsconfig.dts.json` — emits to repo-root **`./ds-types/`** (a NON-dot dir, so the converter's glob sees it). tsc **exits 2** on pre-existing type errors in unrelated files (HomeScreen.tsx, lib/profile-data.ts) but **still emits** all `.d.ts` — that exit code is expected; proceed as long as `ds-types/components/*.d.ts` appear (105 files).
    3. Rebuild — the build's first line should read `[DTS] parsed 105 .d.ts files from <repoRoot>` (NOT `parsed 0`). The build `rm -rf`s `ds-bundle/` before the scan, so its own prior stub `.d.ts` can't shadow `ds-types/`.
  - **9 components still need `dtsPropsFor` even with emitted `.d.ts`**: AppBar, Card, PageHeader, YunaExplains, SegmentedToggle, RatingScale, DictationField, DictationTextArea, HomeCards. The extractor only resolves a `<Name>Props` interface (or a clean single-param call signature); these declare props **inline / via a generic `<V>` / via a local `type Props` / a different export name** (HomeCards → `HomeCardRow`), so the heuristic stubs them. Their `dtsPropsFor` bodies were copied verbatim from the emitted `ds-types/*.d.ts` (the high-quality source of truth) — re-copy from there if their props change. `HomeCards` keeps a `HomeCard` named type-ref in its contract (parses clean; it's a hint for the design agent).
  - `tsconfig.dts.json` + `ds-types/` are gitignored (regenerated each sync).
- **No floor-card preview authoring** for the 26 new ones (this phase ships them as honest floor cards). 5 authored previews in `.design-sync/previews/` preserved.
- **Did NOT run `npm run build`** — reused existing `cssEntry` (`dist/client/assets/styles-Ccw_3Itu.css`, confirmed present). No cssEntry change.
- All 31 components compiled into the esbuild bundle with **zero un-bundleable imports** — no provider was required to import any of them (consistent with the localStorage-hook note above). Floor cards may render visually empty without context, but that's a non-blocking render-time concern, not a compile failure.

## This run (2026-06-29) — authoring wave

- **30 of 31 components now have authored previews** (`.design-sync/previews/*.tsx`), fanned out across 3 subagents. Realistic Yuna-voice copy, dark-panel backdrop for photo-cluster components, image stand-ins where needed.
- **AppBar floor-cards by design** — it calls `useStartChat()` → TanStack Router `useNavigate()`/`useLocation()`, which throw without a `RouterProvider` (none in the design host). Authoring it would ship a broken card. To author it later, add a router `cfg.provider` or a stub. Its preview file was removed so it floor-cards gracefully.
- **`cfg.overrides` cardMode applied:** single → Toast, Accordion, CardSuggestion (overlay/tall); column → Slider, MultipleChoice, Card, HomeCards, PageHeader, ProgressBar, CalendarPicker, Waveform, YunaExplains, DictationField, DictationTextArea (full-width).
- **Image stand-ins** (public `<img>` don't ship): HomeCards / CardSuggestion / YunaAvatar / YunaExplains hide broken imgs via scoped `<style>` + gradient/glyph fallback.
- **Static-only states:** Waveform renders its resting state (bars are audio/ref-driven); DictationField/DictationTextArea show empty + has-text states (not the live mic/recording state).
- Renders were NOT machine-checked (no chromium) — verified by human review.

## Re-sync risks

- `cssEntry` hash drifts every build (see above) — the #1 thing to refresh.
- Pilot entry is a manual list — adding components to the sync means editing `pilot-entry.tsx` + `componentSrcMap` together.
- Props now come from emitted `.d.ts` (see the tsc-declarations procedure above) — regenerate `ds-types/` before each sync so contracts track the source. The 9 `dtsPropsFor` overrides (+ 5 pilot) are still hand-maintained: if those components' props change, re-copy from the freshly emitted `ds-types/*.d.ts`.
- Scaling past the pilot: widen `pilot-entry.tsx` + `componentSrcMap` + `dtsPropsFor` together; watch for components that pull heavy deps (drawers, MeditationPlayer, CommentLayer/Supabase) into the esbuild bundle, and image-dependent components (asset limitation above).
