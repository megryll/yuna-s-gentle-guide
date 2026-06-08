# Design → Figma Workflow Proposal

**Status:** Draft for engineering review
**Author:** Megan
**Date:** 2026-06-08

## Context

We design the Yuna prototype **in code** (React + Tailwind v4, tokens in `src/styles.css`, DS components in `src/components/*`). Figma is used **downstream** for two things:

1. **Stakeholder review / comments**
2. **QA reference** — QA currently treats Figma as the source of truth

## Problem

When screens are exported to Figma via a generic HTML→Figma plugin, they land as flattened layers: raw hex colors and pixel values, **no linked variables, color names, or spacing tokens**. This is structural — converters read *computed* styles, so by export time `bg-foreground` is just `rgb(...)` and `px-6` is just `24px`. The semantic token is already gone.

**Key principle:** tokens should be **pushed from the code source of truth**, not **recovered from flattened Figma output**. The "plugin auto-detects variables on import" approach can't work and shouldn't be pursued.

**Stack advantage:** because we use Tailwind, the token *names* live in the DOM as class strings (`bg-foreground`, `px-6`, `rounded-2xl`). They're only lost when something computes them to pixels. Any tool that reads `className` (vs. computed style) keeps them.

## Proposed workflow — two tracks

### Track A — Web-tool features (the "good start", build first)

Lightweight additions to the existing admin/prototype shell. High daily value, low risk, no backend.

| Feature | What it does | Effort |
|---|---|---|
| **Viewport switcher** | Toggle phone sizes (SE / 15 / 15 Plus — sizes already exist in `PhoneFrame`) from the admin sidebar | S |
| **All-screens overview** | A route laying out every screen as scaled iframes/thumbnails in a grid — see a whole flow at once (Figma-canvas value, without the canvas) | M |
| **className inspector** | Click an element → show its **token names** (`bg-foreground`, `px-6`) read from the live class string, not pixels | M |

The inspector is uniquely cheap/accurate for us because of Tailwind — no hex→token reverse lookup needed.

### Track B — Honest token bridge to Figma (parallel; needed because QA trusts Figma)

So the Figma artifact QA reads is actually backed by named variables, not flattened pixels.

1. **Export tokens** from `src/styles.css` to a [DTCG](https://design-tokens.github.io/community-group/format/) tokens JSON (one script; code stays source of truth).
2. **Import into Figma via Tokens Studio**, which creates real Figma Variables. Our theming axes map cleanly onto Figma **Variable Modes** (light/dark, and platform iOS/Android).
3. **For screens**, use the **Figma MCP** (`figma-generate-library` to seed components against those variables once, then `figma-generate-design` per screen) instead of the dumb HTML→Figma converter — MCP generation references variables rather than flattening them. Optionally wire **Code Connect** so Figma components ↔ `src/components/*`.

### What we gain

- **Figma becomes an honest source of truth for QA.** Screens land with named variables and components instead of flattened hex/px — what QA inspects in Figma matches what's in the code, so the "Figma says X, build says Y" ambiguity goes away.
- **Tokens stay in sync, automatically.** Code remains the single source; the export keeps Figma variables from drifting. A color or radius change in `styles.css` propagates to Figma instead of being hand-re-entered (and silently going stale).
- **Light/dark and platform "just work" in Figma.** Our theming axes map to Figma Variable Modes, so reviewers and QA can flip modes on a real design rather than us exporting separate flattened copies per mode.
- **Faster, cleaner exports.** MCP generation assembles screens from the existing component/variable library, so a ported screen is editable and on-system — not a pile of detached rectangles a designer has to rebuild before it's usable.
- **Two-way traceability via Code Connect.** A Figma component links back to its `src/components/*` source, so reviewers/QA can see exactly which code a design maps to.
- **Comments land on the right thing.** Stakeholder feedback attaches to real components/variables, making it actionable in code rather than tied to a throwaway flattened layer.

## Open questions for engineering

1. Track A is independent and shippable now — agree it goes first?
2. Track B: is Tokens Studio acceptable, or do we want a different code→Figma-variable sync path?
3. Can the token export run in CI so Figma variables can't drift from `styles.css`?
4. How much MCP-based screen generation do we want vs. keeping Figma as variables + a few key screens?

## Recommendation

Start **Track A** (viewport switch → overview → inspector) for immediate daily value, and scope **Track B Step 1–2** (token export + Tokens Studio import) in parallel since that's what makes the QA/Figma source-of-truth honest. Hold MCP screen-generation and Code Connect until the variable foundation exists.
