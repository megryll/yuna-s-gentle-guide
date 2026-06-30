# HANDOFF — Design System → Figma (via Figma MCP)

**Goal:** Port the Yuna prototype's design system from code into real Figma components/variables using the Figma MCP (`figma-use` + `figma-generate-library` skills). Started 2026-06-29.

**Status:** Phase 1–2 (foundations) **done**; token/codebase cleanup pass **done and committed** (`fbdbb05` on `main`, 2026-06-29). **Phase 3 (components) STARTED 2026-06-30 — Button done.**

## ⏭️ RESUME — Phase 3 in progress

- **Modeling decision (locked by user 2026-06-30):** components are built **Variants × States, DARK SURFACE ONLY** — no light mode, and size is **not** a variant axis. This is the template for all primitives.
- **Button done** on a new `Button` page:
  - `Button` (component set `16:2`) — `Variant`(Primary, Destructive, Secondary, Plain, Link) × `State`(Default, Pressed, Disabled) = 15 variants.
  - `Button / Card` (component set `18:22`) — `State`(Default, Selected, Pressed, Disabled) = 4 variants (card is the structurally distinct full-width row).
  - Each set frame carries a dark fill (`r0.11 g0.16 b0.13`) so white-on-dark variants read. Destructive binds `alert-orange`/`neutral`; card radius → `radius/2xl`; paddings/gaps → spacing tokens. White / neutral-900 stay literal (no white token). Plain glyph + chevron + check are drawn vectors. Text = Inter (Stara not installed); headings = Fraunces. Set descriptions written for Dev Mode.
- **Build recipe that worked:** create components individually (config-driven builder loop) → `combineAsVariants(nodes, page)` → set `layoutMode="NONE"` and grid-position children by parsing `Variant=/State=` from names → resize set + dark fill → screenshot. Validate one variant on a temp dark frame before replicating (white-on-white is invisible otherwise).
- **Next:** remaining ~30 primitives, same template, one `<Name>` page each. Start from the [[project_ds_audit]] roster (Badge, Tag, Divider are easy next atoms).

---

## Figma file

- **File key:** `mUDthz3gYZb8HVL6FpsnJX` — "Yuna Design System"
- **Foundations page node:** `6:2` → https://www.figma.com/design/mUDthz3gYZb8HVL6FpsnJX/Yuna-Design-System?node-id=6-2
- ⚠️ The earlier file `DrzowPoQIYvQ0Txg9UMc4K` is **view-only** for `megan@yuna.io` (it's in the starter "Megan Whelen's team", not the pro "Yuna Health, inc." team). The MCP can't write to it. Use the editable file above.
- To resume MCP work: load the `figma-use` AND `figma-generate-library` skills before any `use_figma` call; pass `skillNames: "figma-use,figma-generate-library"`.

### What's built in Figma
Three variable collections + a Foundations doc page:

| Collection | Modes | Count | Notes |
|---|---|---|---|
| **Color** | Light · Dark | **29** | 7 live semantic + 9 brand + 13 palette (see below) |
| **Radius** | Value | 7 | `radius/sm 16 → radius/4xl 36` (base 20) |
| **Spacing** | Value | 12 | `spacing/1 4px → spacing/20 80px` (Tailwind 4px base) |

All variables have role-appropriate **scopes** (no `ALL_SCOPES`) and **WEB code syntax** (`var(--token)`).

**Color = 29 vars** (sourced 1:1 from `src/styles.css`):
- Semantic (Light/Dark): `background, foreground, popover, popover-foreground, muted, muted-foreground, border`
- `color/brand/*` (mode-stable): `primary-green, neutral, beige, secondary-green(+pressed), alert-red(+pressed), alert-orange(+pressed)`
- `color/palette/*` (mode-stable): `blue(+soft), purple(+soft), amber(+soft), peach(+soft), teal(+soft), rose, pink, aqua`

Foundations page (`6:2`) has: Color swatches (Light + Dark columns, mode-locked, fills bound to live variables), Type scale, Radius tiles, Spacing bars.

### Figma gotchas learned
- **oklch → sRGB** conversion done in-script (Björn Ottosson matrix) — code colors are oklch, Figma needs RGB 0–1.
- Figma **rejects `.` in variable names** → `spacing/1.5` is named `spacing/1-5`.
- **Stara font is NOT installed in Figma** (Fraunces IS). Type specimens render Stara in an Inter fallback (labeled). Install Stara for true specimens.
- To show a variable in both modes on one page: set `node.setExplicitVariableModeForCollection(colorCollection, modeId)` on each column frame; swatches bound to the var then resolve per mode.

---

## Cleanup pass (done this session) — uncommitted on `main`

The shadcn/ui **stock semantic tokens** were dead scaffolding in this app and were removed from **both code and Figma**.

**Key finding:** of 39 `src/components/ui/*` shadcn primitives, **only `drawer.tsx` is imported by the app**. The other 38 were dead code.

**Removed tokens** (code + Figma): `primary(+fg)`, `secondary(+fg)`, `card(+fg)`, `accent(+fg)`, `destructive(+fg)`, `input`, `ring`, plus dead `chart-*` / `sidebar-*`.

**Live-usage migrations made** (so nothing broke):
- `text-destructive` / `bg-destructive` → `alert-red` — `AppMenuDrawer.tsx` (Delete row), `router.tsx` + `__root.tsx` (error/404 pages). The `.overlay-on-dark .text-destructive` shim was repointed to `.text-alert-red`.
- `hover/active:bg-accent` → `bg-muted` — `AdminSidebar.tsx`, `EngineerSidebar.tsx` (dev chrome only; not product).
- `bg-primary/text-primary-foreground` → `bg-foreground/text-background` — router error/404 buttons.

**`styles.css` pruned:** `@theme inline` mappings, `:root` + `.dark` values, and the orphaned `overlay-on-dark`/`platform-android` shims for removed tokens.

**Verification:** `npm run build` passes (the project's only green gate — lint/tsc are noisy at baseline, ignore).

### Uncommitted changes (git status)
- **Modified:** `src/styles.css`, `src/components/AdminSidebar.tsx`, `src/components/AppMenuDrawer.tsx`, `src/components/EngineerSidebar.tsx`, `src/router.tsx`, `src/routes/__root.tsx`
- **Deleted:** 38 files in `src/components/ui/` (everything except `drawer.tsx`)
- ⚠️ `src/routes/accept-terms.tsx` was already modified **before** this work — unrelated, leave it / handle separately.
- Untracked `.agents/`, `agent/`, `skills-lock.json` are unrelated tooling artifacts.

**Decision pending:** whether to commit. Held off per "commit only when asked." Suggested message scope: "chore: remove dead shadcn ui primitives + unused semantic color tokens."

---

## Next steps (when resuming)

1. ~~**Commit** the cleanup above.~~ ✅ done — `fbdbb05` (not yet pushed).
2. **(optional follow-up) Prune radix deps** from `package.json` — the deleted `ui/` primitives were the only consumers. Doesn't affect build/bundle (tree-shaken), so low priority.
3. **Phase 3 — components in Figma.** Build the DS primitives as real Figma component sets (one per page, variants via `combineAsVariants`, bind to the variables above). Start with **Button** (`src/components/Button.tsx` + `src/routes/ds.buttons.tsx` is the spec). The `/ds/*` routes are the per-component spec for ~35 primitives.
4. Code Connect (Figma↔code mapping) was deliberately deferred — optional later phase.

## Source-of-truth files
- Tokens: `src/styles.css` (`@theme inline`, `:root`, `.dark`, `.overlay-on-dark`, `.platform-android`)
- DS doc pages: `src/routes/ds.colors.tsx`, `ds.typography.tsx`, `ds.spacing.tsx` (these document the **brand** palette; they never listed the removed shadcn tokens)
- Project rules: `CLAUDE.md` (golden rules, theming axes, file map). Memory: `memory/project_figma_ds_foundations.md`.
