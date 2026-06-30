# HANDOFF — Design System → Claude Design (`/design-sync`)

**Goal:** Import the Yuna prototype's design system into **Claude Design** (claude.ai/design) via the `/design-sync` skill, so the design agent there builds with the real Yuna components. A parallel track to the Figma port (see `HANDOFF-figma-ds.md`). Started 2026-06-29.

**Status:** **Full 31-primitive library uploaded and live.** 30 components have authored preview cards; AppBar is a floor card by design. Real prop contracts on all 31. Everything committed on `main`.

---

## ⏭️ RESUME HERE — pending work

1. **User review fixes (TOP PRIORITY):** On final review the user said "pretty much everything looks good, except a couple things." **Those couple things were NOT yet specified — ask the user which components/cards look off**, then fix the relevant `.design-sync/previews/<Name>.tsx` → rebuild → re-upload (see commands below).
2. Optional later: author **AppBar** (needs a TanStack Router `cfg.provider` or stub — currently a floor card on purpose).
3. Optional later: ship real **public image assets** (avatars/photos) so YunaAvatar / HomeCards / CardSuggestion / YunaExplains show real images instead of gradient stand-ins.
4. The local review server (`http-serve.mjs`) was running in the background — it dies when context clears. Re-serve with the command below.

---

## The project
- **Claude Design project:** `f23f94e4-bd2e-4ac0-af19-50f18ebbd79a` → https://claude.ai/design/p/f23f94e4-bd2e-4ac0-af19-50f18ebbd79a
- **31 components** (the DS primitives documented under `src/routes/ds.*`): Accordion, AppBar, Badge, Button, CalendarPicker, Card, CardSuggestion, ChatBubble, Checkbox, DictationField, DictationTextArea, Divider, HomeCards, IconMedallion, MultipleChoice, PageHeader, ProgressBar, RadialProgress, RatingScale, SegmentedToggle, Slider, StepDots, Surface, Switch, Tag, TextArea, TextField, Toast, Waveform, YunaAvatar, YunaExplains.
- **30 authored previews** (`.design-sync/previews/*.tsx`) + **AppBar floor card**. Real prop contracts on all 31.

## How it's set up (all under `.design-sync/`, committed)
- `config.json` — the sync config. Key fields: `pkg`, `globalName: YunaDS`, `projectId`, `shape: package`, `entry: .design-sync/pilot-entry.tsx`, `tsconfig`, `cssEntry` (⚠️ hashed — see risks), `extraFonts`, `readmeHeader`, `overrides` (cardMode), `dtsPropsFor` (9 hand-written + the rest auto), `componentSrcMap` (31 pins).
- `pilot-entry.tsx` — re-exports all 31 (HomeCards is `HomeCardRow as HomeCards`). Widen this + `componentSrcMap` together to add components.
- `previews/*.tsx` — authored preview cards (each named export = one card cell). House style: import from `"yuna-design-system"`, dark-panel wrapper `linear-gradient(155deg,#3a4a40,#1d2a22)` for photo-cluster components, gradient/glyph stand-in for unshipped `<img>` (see `YunaAvatar.tsx`). Yuna voice: no em dashes, no fortune-telling.
- `fonts.css` — resolvable `@font-face` (Stara + Fraunces) wired via `extraFonts` (compiled CSS's `/fonts/` abs paths don't resolve on their own).
- `conventions.md` — the README header fed into the design agent's system prompt.
- `NOTES.md` — detailed gotchas + re-sync risks. **Read it first on resume.**

## Reproducible commands (run from repo root)
```bash
# 1. staged scripts (gitignored — recreate if missing)
mkdir -p .ds-sync && cp -r "<design-sync-skill-base>"/{package-build.mjs,package-validate.mjs,package-capture.mjs,resync.mjs,lib,storybook} .ds-sync/
echo '{"name":"ds-sync-deps","private":true}' > .ds-sync/package.json
(cd .ds-sync && npm i esbuild ts-morph @types/react)

# 2. real prop contracts: emit declarations to repo-root ds-types/ (converter ts-morph scans it; skips dot-dirs so it MUST be non-dot)
rm -rf ds-types && npx tsc -p tsconfig.dts.json   # exits 2 on unrelated pre-existing type errors but still emits — fine

# 3. build + validate (cssEntry must point at a CURRENT dist/client/assets/styles-*.css — see risks)
node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle --no-render-check   # expect exit 0 + 3 benign warnings

# 4. local review page
node .ds-sync/storybook/http-serve.mjs ./ds-bundle   # prints http://127.0.0.1:<port>/.review.html
```
`tsconfig.dts.json` (repo root, gitignored): extends `./tsconfig.json` with `{noEmit:false, declaration:true, emitDeclarationOnly:true, declarationDir:"./ds-types", allowImportingTsExtensions:false}`, includes `src/components/**` + `src/lib/**`.

## Re-upload sequence (incremental, via the `DesignSync` tool)
The upload plan from this session is session-bound — **a fresh session must `finalize_plan` again** (one approval), then:
1. `write_files` sentinel `_ds_needs_recompile` first.
2. `write_files` content (≤256/call; the 158-file list is everything under `ds-bundle/` except dotfiles, `_screenshots/`, `_ds_needs_recompile`, `_ds_sync.json`; fonts/`_vendor` only if changed). Generate the list with: `find ds-bundle -type f ! -path '*/_screenshots/*' | sed 's|ds-bundle/||' ...`
3. `list_files` → delete any orphans (none expected).
4. `write_files` sentinel re-arm, then `_ds_sync.json` **absolutely last**.
- `finalize_plan` writes globs: `["components/**","tokens/**","fonts/**","_vendor/**","_preview/**","guidelines/**","_ds_bundle.js","_ds_bundle.css","styles.css","README.md","_ds_sync.json","_ds_needs_recompile"]`; deletes: same dir globs. localDir `./ds-bundle`.

## Known limitations / risks (also in NOTES.md)
- **`cssEntry` is content-hashed** (`dist/client/assets/styles-Ccw_3Itu.css`) — drifts every `npm run build`. Confirm it exists before building; update `config.json` if the hash changed.
- **No Chromium** → render check skipped; verification is human review of `.review.html`. The 26 wave-authored previews were never machine-verified.
- **AppBar** floor-cards (needs router provider). **Public `<img>` assets** don't ship (gradient stand-ins used). **Waveform / Dictation\*** show static resting states only.
- **`dtsPropsFor`** for 9 components is hand-maintained; if their real props change, update config.

## Commits on `main` (this track)
- `cfe281b` pilot (5 components) · `52220e4` expand to 31 + real props · `d163ba4` author 30 previews
- All `.design-sync/` durable inputs committed. `ds-bundle/`, `ds-types/`, `.ds-sync/`, `tsconfig.dts.json` are gitignored.

## Decision still open
User is evaluating **Claude Design vs the Figma port** ("decide after import"). The full library is now live in Claude Design for that comparison.
