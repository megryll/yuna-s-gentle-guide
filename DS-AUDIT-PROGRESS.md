# DS Compliance Audit — Progress Handoff

_Last updated: 2026-06-03_

## What this is

Screen-by-screen audit of the Yuna prototype against the design system in
`CLAUDE.md` + the `/ds/*` pages. Working through the **onboarding flow up to
Intro**. Rules of engagement:

- **Audit-first.** Present findings per screen, get approval, then fix.
- **Build is the gate** — `npm run build` (lint/tsc are noisy at baseline, ignore).
- **Source-of-truth workflow** for DS changes: update component → update its
  `/ds/*` page → propagate to call sites via props (never copy classes).
- Preview new/changed UI in dark × light and iOS × Android via admin toggles.

## Git state

- Branch: `main`. Last commit: `7700a1d` (pre-session).
- **Everything below is UNCOMMITTED.** Build passes. `.claude/` (a local lock)
  is untracked — do **not** commit it.
- Suggested next step: commit this session's work before continuing.

## Done this session

### Screens audited + fixed (onboarding flow)
- **Welcome** (`routes/index.tsx`) — re-checked, already DS-clean (no changes).
- **Login** (`routes/login.tsx`) — "Forgot password?" raw `<button>` → `Button variant="link"`; hero `text-[32px]` → `text-3xl`; email-echo `/70` → `/75`; "or" → new `Divider`.
- **Create account** (`routes/auth.tsx`) — same hero/contrast fixes; "or" → `Divider`.
- **Employer access** (`routes/employer-access.tsx`) — hero `text-[30px]` → `text-3xl`; "Get Help" raw `<button>` → `Button variant="link"`; contrast `/80`→`/85`, `/70`→`/75`. `PassCard` + its bespoke gradients intentionally left as a one-off (excluded by user).
- **Accept terms** (`routes/accept-terms.tsx`) — "Read more"/"I agree" dropped `uppercase tracking-[0.14em] font-bold` className override → plain `size="sm"`; local `CheckBadge` (hardcoded `#66BA24`) → new `CheckBadge` primitive.

### New DS primitives (component + `/ds` page + sidebar entry)
- **`Divider`** (`components/Divider.tsx`, `routes/ds.divider.tsx`) — surface-aware hairline, optional centered `label`.
- **`CheckBadge`** (`components/CheckBadge.tsx`, `routes/ds.check-badge.tsx`) — green circle + white check, `size` "sm"|"md", token `bg-yuna-green`. Migrated accept-terms + employer-access to it.
- **`Drawer`** DS page (`routes/ds.drawer.tsx`) — documents the existing `ui/drawer.tsx` primitive.

### Source-of-truth fix: DrawerTitle
- `ui/drawer.tsx` `DrawerTitle` default was leftover shadcn (`text-lg font-semibold`); every call site overrode it and they'd drifted. Baked in the DS style `font-display font-normal text-3xl tracking-tight text-white` and **stripped all 8 call sites** (intro ×2, employer-access ×2, YunaSettingsDrawer, SchedulePrioritizeDrawer [kept `mt-6`], FirstSessionDisclaimers, VoiceSession).

### New doc-kit capability: device-frame previews
- `ds-docs/surface.tsx` added **`DeviceFrame`** + **`DevicePair`** — a simulated phone that provides `PhoneFrameContext` (exported from `PhoneFrame.tsx`) so a real `Drawer` portals INTO the frame; used for position-dependent overlays. Also added **`Bar`** (surface-aware skeleton placeholder).
- `/ds/drawer` shows the real drawer open + bottom-pinned in dark/light frames.
- `/ds/toasts` gained a **Position** section showing the toast top-pinned.
- Per user: the **device-frame mockups show no text** (skeleton bars / green pill placeholder) — only relative size/position. All other text (Variants/Options matrices etc.) is unchanged.

### Sidebar (`components/AdminSidebar.tsx`)
- Added DS entries: Divider, Check Badge, Drawer.

## Verify before declaring fully done
- **Drawer titles in LIGHT mode** for `intro` (Language/Pace), `VoiceSession`, `YunaSettingsDrawer` — these previously had no explicit title color and now inherit the baked `text-white` (relies on `.theme-light` inverting white→ink). Eyeball each in light mode.

## Flagged, deferred (decided "leave for now")
- **Dead actions:** "Referral Code" (Welcome) and "Forgot password?" (Login) have no `onClick` / no flow behind them. No email-verification step after create-account.
- **Broader `#66BA24` sweep:** raw hex check-circles still in `intro.tsx`, `tools.tsx`, `HomeCards.tsx`, plus `GREEN_ACCENT` const in `profile-components.tsx` and `AppBar.tsx` — candidates to migrate to `CheckBadge` / `bg-yuna-green` token.

## Next
1. **Intro** (`routes/intro.tsx`) — the next screen in the flow (large, multi-step).
2. When chat screens come up: **Suggestion Chips** (`SuggestionChip(s)`) and **Waveform** are the next reusable primitives lacking `/ds` pages.

## Useful
- Dev server: `npm run dev` (lands on `:8081` when 8080 is taken). Stop by exact
  PID via `lsof -ti tcp:<port>` — never broad-kill.
- Screenshot a `/ds/*` page: headless Chrome
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=/tmp/x.png --window-size=1500,1200 --virtual-time-budget=5000 "http://localhost:8081/ds/drawer"`.
