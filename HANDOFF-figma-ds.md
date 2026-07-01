# HANDOFF — Design System → Figma (via Figma MCP)

**Goal:** Port the Yuna prototype's design system from code into real Figma components/variables using the Figma MCP (`figma-use` + `figma-generate-library` skills). Started 2026-06-29.

**Status:** Phase 1–2 (foundations) **done**; token/codebase cleanup pass **done and committed** (`fbdbb05` on `main`, 2026-06-29). **Phase 3 — all 27 original in-scope primitives drawn (2026-06-30) AND the composite instancing rework is COMPLETE (2026-06-30).** (Icons page intentionally OUT of scope per user.) The library is now real: composites reference DS component instances, not inline copies. **Later additions (2026-06-30): Button Size axis completed to full code parity (6 sizes / 45 variants); Tooltip primitive added (28th component, page `85:2`).** Remaining: optional Phase 4 QA + the parity gaps flagged at the bottom of the rework section.

## ✅ TOP-PRIORITY REWORK — DONE (2026-06-30)

**Was:** several composites re-drew their sub-primitives inline (hand-drawn circle, hand-built pill+chevron, hand-built badge) instead of instancing the real DS component — the Figma-side violation of "Reference, don't reproduce." **Now fixed:** every listed inline sub-element was replaced with a real component instance and the inline node deleted.

**Two blocking decisions (resolved by user 2026-06-30):**
1. **Button icon/full-width form → (a) add Size axis + (b) FILL for full-width** (both recommended options chosen). Discovery: the **code** Button (`src/components/Button.tsx`) *already* has `size` (md/sm/xs/icon/icon-sm/icon-lg), `fullWidth`, and `label` props — so the Figma Button was *behind* code, not bound by a "no-size-axis rule." Adding them = parity, not rule-breaking.
2. **Expose a `Label` TEXT property → yes.** Added to Button.

**Button source upgrade (`16:2`, page `14:2`) — done:**
- Added **`Size` variant axis**: `md` (the existing 15 text variants), `icon` (new 36px Secondary circle ×3 states; Plain's existing 36px glyph relabelled Size=icon), `icon-sm` (new 32px Secondary circle ×3 states). 21 variants total. New circles: transparent fill + white/40 border, pressed=white/15 fill, disabled=0.5 opacity, centered chevron-left glyph (createNodeFromSvg) at 18/16px.
- Added **`Label` TEXT property** (`Label#60:0`, default "Continue"), bound to the 6 Primary+Secondary md text nodes. Destructive ("Delete account") + Link ("Login") were **unbound** to keep their demo labels (rarely instanced).
- **Font fix:** all Button text nodes were stored as **Stara** (not installed in Figma → uneditable → `setProperties(Label)` failed). Converted Stara→**Inter Medium** (the fallback already rendering). Same fix applied to the **Badge** Label text node (Stara→Inter Semi Bold) so "15 min"/durations are settable. `textCase=UPPER` preserved.
- Updated the Button Doc/Header description (removed "icon/size axes out of scope").

**Composites reworked (all instance real components now):**
| Composite (node) | Inline element removed | Now instances |
|---|---|---|
| **Yuna Explains** `48:85` | green-gradient ellipse | **Yuna Avatar / Mark** `53:7` (green Yuna mark), resized 32px |
| **Page Header** `49:29` (3 variants) | 48px frosted back circles | **Button** Secondary `icon` (36px) `59:2` |
| **Calendar Picker** `51:3` | two 34px nav circles | **Button** Secondary `icon-sm` (32px) `59:11`; right instance rotated 180° for the › chevron (nested-icon rotation is blocked, but rotating the whole instance works + auto-layout preserves it) |
| **Drawer** `52:3` | footer white pill | **Button** Primary `15:2`, `layoutSizing=FILL`, Label="Confirm" |
| **Card** `54:103` | NEW pills + completion checks | **Badge** Label `22:2` + Icon `22:4`. ⚠️ The "3 MIN" pill was **left as-is (deviation from original plan)** — in code it's bespoke content-card chrome supplied as `children` (CLAUDE.md rule 9: content cards are NOT DS Buttons), not a `<Button>`. Flagged, not forced. |
| **Card Suggestion** `56:16` | every `btn()` + completion check | **Button** Primary/Secondary (FILL) + **Link** ("Find a therapist", nested-text override) + **Badge** Icon. Variants mapped 1:1 to `CardSuggestion.tsx`. |
| **Multiple Choice** `45:51` (Detail ×3) | trailing green "15 MIN" pill | **Badge** Label `22:2`, text overridden to "15 min" |

**Instancing recipe that worked:**
```js
const comp = await figma.getNodeByIdAsync('15:2');   // a specific variant COMPONENT (not the set)
const inst = comp.createInstance();
parent.insertChild(idx, inst);                        // keep original flow position
inst.setProperties({ 'Label#60:0': 'Confirm' });      // TEXT prop by id (needs an installed font!)
inst.layoutSizingHorizontal = 'FILL';                 // full-width — set AFTER appending
// Link/unbound text: inst.findOne(n=>n.type==='TEXT').characters = '...' (load Inter first)
// directional glyph: rotate the whole INSTANCE (inst.rotation=180), NOT a nested node
```
Cross-page instances work fine (composites on `45/48/49/51/52/54/55` instance sources on `14/22/53`).

**✅ Badge size axis — DONE (2026-06-30).** Added `Size` axis to Badge set `22:7`: `Variant[Label, Icon] × Size[md, sm]` (sparse — Label only md, since code's `size` applies to the icon form only). Icon/md = existing 28px; new **Icon/sm** `71:2` = 18px box, 11px white check (createNodeFromSvg, stroke 3), green fill bound to `secondary-green` (var 4:24). Switched the 2 Card completion-check instances (`65:6` Tile, `65:8` Row) to `Size=sm` to match code (`<Badge icon size="sm">`); Card Suggestion's completion stays `md`. Badge Doc/Header updated.

**✅ Button Size axis completed to full code parity — DONE (2026-06-30).** Added `sm`, `xs`, `icon-lg` to set `16:2` (page `14:2`). Size axis is now `md`/`sm`/`xs`/`icon`/`icon-sm`/`icon-lg` = 6 values, matching `src/components/Button.tsx` exactly. 45 variants total (was 21). Built by **cloning** the matching md/icon variant (preserves fills/border/state styling + keeps the Stara text node intact, no font load needed) and adjusting only frame structure:
- `sm` (9 variants: Primary/Destructive/Secondary × 3 states): padL/R rebound → `spacing/4` (16), padT/B rebound → `spacing/2` (8). itemSpacing stays `spacing/2`.
- `xs` (9 variants: same set): padL/R → `spacing/3` (12), padT/B = 0, fixed 26px height (resize→height then `primaryAxisSizingMode='AUTO'` so width still hugs), content center-aligned.
- `icon-lg` (6 variants: Secondary + Plain × 3 states): cloned the 36px icon variants, `glyph.rescale(44/36)` then `resize(44,44)`, center-aligned. Secondary chevron → 22px; Plain dots → ~18px (proportional).
- Doc/Header description (`19:4`, Inter) updated to enumerate all 6 sizes.
- **Link excluded from `sm`/`xs` (deviation from the handoff's parenthetical list, on purpose):** code's `link` variant hard-codes `text-sm` and ignores the `size` prop, so `link/sm` and `link/xs` would be visually identical to `link/md` — adding them would be fake fidelity. Link stays md-only; Plain stays icon-sizes-only. Sparse matrix, matches code.
- **⚠️ 👉 USER TO DO IN DESKTOP (FONT RULE): set `sm` + `xs` label text to 12px (`text-xs`).** The MCP can't load Stara, so all cloned labels are still 14px (they inherited md's size). Structurally the pills are correct (padding/height shrank); only the font SIZE needs setting. Also for `xs` only: set label `letterSpacing` to 0 (code `xs` drops `tracking-wide`; sm keeps it). These are the only remaining text-side deltas.
- **🅵 FONT RULE (locked by user 2026-06-30, Option 1): never edit text via the MCP.** Stara is installed **locally on the user's Mac only** (Figma Professional plan) — it is NOT in Figma's server/shared font set, so the MCP runtime can't see it (`listAvailableFontsAsync()` → 0 Stara; `loadFontAsync({family:'Stara'})` throws "does not exist"). The MCP can only write Inter, so any text node it touches reverts the user's Stara. **Going forward: structural work only via MCP (variants, layout, instances, bindings, sizing); flag any label/text change for the user to do in desktop.** The Button `Label` TEXT prop still works for the user in desktop.
  - **Cleanup the user is doing in desktop:** re-set the nodes the rework converted Stara→Inter — Button set's 12 label nodes + Badge's "New" text. Fixing the SOURCE component propagates to instances (Drawer "Confirm", Card Suggestion buttons via the Label prop). Direct instance overrides made in Inter — Card Suggestion "Find a therapist" link + the 3 Multiple-Choice Detail "15 min" badges — may need their font re-set individually if they don't follow the source.
  - Real fix (deferred): upload Stara as an **Org/Enterprise shared font** so servers/MCP/teammates all get it. Team is on Professional → not available yet.

---

## ⏭️ RESUME — Phase 3 in progress

- **Modeling decision (locked by user 2026-06-30):** components are built **Variants × States, DARK SURFACE ONLY** — no light mode, and size is **not** a variant axis. This is the template for all primitives. **A non-interactive form does NOT carry an interactive State axis** — split it into its own standalone component / set rather than padding it into a shared State matrix (Tag/Informational, Button/Card precedent). Only the property axes a form actually has. Each set frame carries a dark fill (`r0.11 g0.16 b0.13`, cornerRadius 24) so white-on-dark variants read, and a `Doc / Header` frame (Fraunces Black 48px title + Inter Regular 16px description, fixed 720 wide, at `y=-160`) sits above. Text = Inter (Stara not installed); headings = Fraunces Black.
- **Build recipe that worked:** create components individually (config-driven builder loop) → `combineAsVariants(nodes, page)` → set `layoutMode="NONE"` and grid-position children by parsing `Variant=/State=` from names → resize set + dark fill → screenshot. Sparse variant matrices are fine (Tag's Informational has only State=Default). For doc headers: set `primaryAxisSizingMode="AUTO"` AND don't `resize()` after, or the height stays fixed and clips the description — re-hug if needed.
- **Components built (one page each):**
  - **Button** — page `14:2`. `Button` set `16:2` (Variant[Primary/Destructive/Secondary/Plain/Link] × State[Default/Pressed/Disabled] = 15) + `Button / Card` set `18:22` (State[Default/Selected/Pressed/Disabled] = 4). Destructive binds `alert-orange`/`neutral`; card radius → `radius/2xl`; paddings/gaps → spacing tokens.
  - **Badge** — page `22:6`, set `22:7`. Variant[Label, Icon] = 2. `secondary-green` fill (var `4:24`); Label = uppercase pill (Inter Semi Bold 11px, tracking 20%, padding spacing/3 + spacing/1-5); Icon = 28px circle with a drawn white check vector. White text literal.
  - **Tag** — page `23:12`. Two objects, mirroring Button/Button-Card: the `Tag` set `23:13` = State[Default/Selected/Pressed/Disabled] = 4 (all tappable — there's only one tappable form, so no Variant axis); and a standalone `Tag / Informational` component `23:10` (no variant props — informational is static, so it carries NO state axis) in its own dark display frame `27:2`. White-alpha literals on dark: off = white/10 + white/30 border; selected = solid white + neutral-900 text; pressed = white/20; disabled = off @ 50% opacity; informational = white/12, borderless. h-8, px-14, text 14px, gap spacing/1-5.
  - **Divider** — page `23:23`, set `23:24`. Variant[Plain, Labeled] = 2. White/25 hairline rects (FILL-width); Labeled = two hairlines flanking an uppercase Inter Semi Bold 10px white/60 "or", gap spacing/3.
  - **Step Dots** — page `29:17`, set `29:18`. State[First, Midway, Last] = 3 (count=4 rows). Dots = rounded-full rects h6; reached/current = white, upcoming = white/30, current = elongated 20px pill. gap spacing/1-5.
  - **Progress Bar** — page `29:28`, set `29:29`. State[Start(0.12), Midway(0.5), Complete(1)] = 3. 280px track h6 rounded-full white/20, clipped, with a white fill rect at frac width.
  - **Segmented Toggle** — page `30:52`, set `31:52`. Variant[Text, Icon, Both] × State[First, Second] = 6 (size fixed at md per the no-size-axis rule). Rail = black/15 fill + white/25 border, p-0.5, rounded-full; active segment = solid white pill w/ neutral-900 content, inactive = white on rail. Labeled segments hug width (resize to lock h32 → then primaryAxisSizingMode AUTO), icon-only = 32×32. **Icons (Mic, MessageCircle) drawn via `figma.createNodeFromSvg(<lucide svg>)`** — the reliable way to get arc-bearing glyphs; Figma `vectorPaths` data does NOT parse SVG `A` arc commands, so don't hand-build arcs.
  - **Checkbox** — page `33:21`, set `33:22`. Variant[Labeled, Bare] × State[Unchecked, Checked, Disabled] = 6. 20px circular box, border-2; checked = white fill + neutral-900 check (lucide via createNodeFromSvg); disabled = whole component opacity 0.5. Label = Inter Regular 14px white/85, gap spacing/3.
  - **Switch** — page `34:8`, set `34:9`. State[On, Off, Disabled] = 3. 51×31 track rounded-full; On = secondary-green, Off = white/25, Disabled = on-state @ opacity 0.4. 27px white thumb (ellipse + drop shadows) at x2 (off) / x22 (on). (Label/settings-row are compositions, not the primitive.)
  - **Rating Scale** — page `35:25`, set `35:26`. Variant[Emoji, Icon, Number, Word] = 4 (size fixed per no-size-axis rule). One option rendered larger (selected scale 1.5 → bigger font/icon size) and the rest smaller (0.9) — selection conveyed by scale, not fill. Emoji render in color via plain text nodes; thumbs via createNodeFromSvg. White ink.
  - **Slider** — page `36:2`, set `37:17`. Variant[Linear, Linear end labels, Linear sentiment fill, Bipolar, Bipolar neutral] = 5. Track = 12px rail white/15 + white/12 border, green/orange fill (bound secondary-green / alert-orange), 24px white thumb (overhangs rail, in a non-clipped Track frame; rail clips the fill). Bipolar adds a center notch + center-out fill; neutral is the horizontal MUSIC↔VOICE layout with ink fill.
  - **Radial Progress** — page `40:17`, set `40:18`. State[0%, 40%, 100%] = 3 (size fixed at 120 per no-size-axis rule). SVG ring (track white/15 + white arc, `stroke-dasharray`/`stroke-dashoffset`, `rotate(-90)` from 12 o'clock) via createNodeFromSvg + a centered Inter Semi Bold % label.
  - **Text Field** — page `41:17`, set `41:18`. State[Default, Active, Error] = 3 (md size). Pill = rounded-full, black/20 fill, border white/30 (default) → white (active) → alert-orange (error, bound). Error variant includes the `FieldError` companion line (CircleAlert + alert-orange text) below the pill.
  - **Text Area** — page `42:19`, set `42:20`. Variant[Field, Display] × State (sparse: Field has Default/Error/Disabled, Display has Default) = 4. Field = rounded-2xl (bound radius/2xl) black/20 box, border white/30→alert-orange(error); Disabled = opacity 0.5; Error pairs the FieldError line. Display = borderless transparent Fraunces 30px (in-place title editing).
  - **Chat Bubble** — page `44:2`, set `44:22`. Sparse From[Yuna,User] × State[Default,Tailless,Typing,Menu] = 6 (Typing/Menu are Yuna-only). Yuna = frosted white/10 + white/25 border, white text, tail squares bottom-LEFT; User = solid white, ink text, tail squares bottom-RIGHT. Corners bound: round corners→radius/2xl(28), tail corner→radius/sm(16); padding L/R→spacing/4, py=10 literal (off-scale). Typing = 3×6px white dots; Menu = absolute 3-dot trigger top-right. Size fixed at md (no size axis). Attachment is a caller-styled composition — noted, not built.
  - **Multiple Choice** — page `45:2`, set `45:51`. Variant[Plain,Emoji,Detail] × State[Default,Selected,Disabled] = 9. Models the selectable **option row** (the reusable primitive), not the whole group. rounded-2xl border row; Selected = solid white border + white/10 fill + trailing lucide check; Disabled = opacity 0.5. Emoji = 36px frosted medallion; Detail = label+subtitle col + trailing green Badge (fill bound secondary-green). Bound: radii→radius/2xl, padding→spacing/4, gap→spacing/3.
  - **Toast** — page `46:2`, set `46:72`. Variant[Error,Neutral,Success] × State[Message,Title,Dismiss] = 9. Solid pill fill per tone (Error→alert-orange, Success→secondary-green bound; Neutral=white literal), bare glyph + copy in **neutral** ink (text/icon strokes bound to color/brand/neutral). Icons (CircleAlert/Info/Check/X) via createNodeFromSvg. Bound: radii→radius/2xl, padding→spacing/4, gap→spacing/3.
  - **Accordion** — page `47:2`, set `47:15`. State[Collapsed,Expanded] = 2 (no variant axis — bare disclosure mechanics; chrome is caller's). Trigger row (header label FILL + chevron, down/up via swapped lucide svg) + body paragraph on Expanded. Bound: trigger/body padding→spacing/4, gap→spacing/3. No radius (component is borderless).
  - **Waveform** — page `48:2`, set `48:79`. State[Idle,Active] = 2. 36 white 2px rounded bars, space-between in a fixed row; Idle rests at ~12% flat noise floor, Active = deterministic sine-pattern heights simulating speech. Decorative; caller owns row size + bar color. No tokens (geometry is fixed/literal).
  - **Yuna Explains** — page `48:83`. Single COMPONENT `48:85` (no variants — one look everywhere) in a dark Display frame. Frosted white/8 rounded-2xl row, p-4, gap-3, items-start: avatar + white/85 body copy. **Avatar is a green-gradient circle STAND-IN** (real avatars are photo assets not uploaded — see Avatar note). Bound: radii→radius/2xl, padding→spacing/4, gap→spacing/3.
  - **Page Header** — page `49:2`, set `49:29`. Variant[Stacked,Inline,Bare] = 3. 48px frosted back button (white/30 border + chevron-left svg) on a space-between row; Stacked drops a centered Fraunces 30px title BELOW the row, Inline rides the title in the centered slot, Bare shows a trailing "Skip" action and no title. Title uses Fraunces **Black** (only Fraunces weight installed). Bound: padding L/R→spacing/6, pt→spacing/4, pb→spacing/2, gap→spacing/6.
  - **App Bar** — page `50:2`. Single COMPONENT `50:3` in a dark Display frame (active tab is runtime, surface collapses to dark-only — no variant axis). 5 tabs (Home/You/Chat/Tools/Sessions); the emphasized Chat tab is a raised 60px white circle (drop shadow) sitting in a **bulge cradle** drawn from the real AppBar mask path (`createNodeFromSvg`, fill white/10 frosted). Home shown active (white + Semi Bold), rest white/60. Lucide icons via createNodeFromSvg. Geometry literal (bulge path, raised circle) — no token binding.
  - **Calendar Picker** — page `51:2`. Single COMPONENT `51:3` in a dark Display frame (surface dark-only — no variant axis). Month-nav header (Fraunces 18 "June 2026" + two frosted nav buttons), weekday row (S M T W T F S, white/75), and a 5×7 day grid. Past days dim to white/30 (no dot); selectable days carry a secondary-green dot (bound); day 12 = today (white/70 ring); day 18 = selected (white fill + ink, Semi Bold + dim dot). Day-cell radii bound to radius/xl(24); green dots bound to secondary-green.
  - **Drawer** — page `52:2`. Single COMPONENT `52:3` in a dark Display frame that doubles as the dimmed scrim. Bottom-anchored frosted sheet (white/12 fill + white/12 hairline), top corners bound to radius/3xl(32), bottom square. Grabber handle (white/35 pill), padded DrawerHeader with the one drawer-title size (Fraunces text-3xl=30 white), body copy (white/85), DrawerFooter with a white primary button + ink "Confirm". Header/body/footer L/R padding bound to spacing/6. Shown in dark mode (overlay-on-dark frosting represented by the white-alpha sheet fill).
  - **Yuna Avatar** — page `53:2`, set `53:8`. Variant[Maya, Kai, Arun, Vivian, Mark] = 5, 64px circular crops. **Real photos uploaded via `upload_assets` (nodeId targeting each component frame, scaleMode FILL)**: Maya=avatar-2.png, Kai=avatar-3.png, Arun=avatar-4.png, Vivian=avatar-13.png, Mark=avatar.png (the green Yuna brand mark, FIT). Plus a standalone **`Yuna Avatar / Glow` `53:13`** in its own dark frame — static representation of the presence aura (radial white halo gradient + thin white ring + Maya avatar via reused imageHash). Size axis omitted (no-size-axis rule).
  - **Card** — page `54:2`, set `54:103`. Variant[Tile, Row] × State[Default, New, Completed] = 6 (shows both the tile form AND the list-row form per the DS "different layout = show it" rule). Tile = rounded-[2.5rem](40, literal — no full-40 token) photo tile with eyebrow+More header, Fraunces body title, save/share + outlined CTA footer; Row = rounded-2xl (bound radius/2xl) horizontal row with title+meta + 36px ActionCircle. **One nature photo uploaded once (Background-3.png → imageHash `da170d…`) and reused as an IMAGE fill + black/0.35 SOLID wash on all 6 backgrounds.** New = green "NEW" flag (bound secondary-green); Completed = opacity-0.6 tile + green check badge. Wrapper components are non-clipping so the corner badge overhangs the clipped tile.
  - **Tooltip** — page `85:2`, set `86:43` (added 2026-06-30, mirrors new code `src/components/Tooltip.tsx` + `ds.tooltip.tsx`). `Arrow`[None, Top, Bottom, Left, Right] = 5. Opaque `primary-green` panel (bound fill), rounded-2xl (bound radius/2xl per-corner), p-4 (bound spacing/4), `border` hairline (bound), shadow-xl effect. **Pointer** = 10px rounded-[2px] square, `rotation=-45` (CSS `rotate-45` CW = Figma −45), per-side hairline on only the 2 OUTWARD edges (Top→strokeTop+Left, Bottom→Bottom+Right, Left→Bottom+Left, Right→Top+Right), `layoutPositioning='ABSOLUTE'` + measure-and-center on the panel edge (`ptr.x += target - currentVisualCenter` via absoluteBoundingBox); its opaque fill hides the panel border segment beneath so it reads as a seamless point. None = no pointer. **Dark-only** per modeling rule; light mode swaps the opaque fill to `primary-beige` via the `mode` prop (noted in Doc/Header) — this is a real two-color swap, NOT a `.theme-light` auto-invert. `mode` + arrow `offset` are consumer overrides, not Figma axes. Set frame carries dark fill + explicit Color mode = Dark. Sample copy is **Inter placeholder** (Stara unloadable — flag for desktop, same as every other component's text).
  - **Card Suggestion** — page `55:2`, set `56:16`. Variant[Reco, Escalation, Completion] × Mode[Text, Voice] (sparse: all three Text + Reco Voice = 4). A composition reusing the Chat Bubble shell + Card tile + Button idioms. Text = left-aligned frosted Yuna bubble (tail bottom-left, bound radius/2xl + radius/sm tail); Voice = centered frosted sheet with a drag-notch (all corners radius/2xl). Reco = nature photo tile (reused imageHash) + No-thanks/Start; Escalation = solid forest tile (fill bound primary-green) + call/visit/find-therapist buttons; Completion = frosted tile + green check badge (bound secondary-green) + summary CTA. Inner tile radii + outer padding bound.
- **Sizing-order gotcha:** an auto-layout frame's `resize(w,h)` forces BOTH axes to FIXED. To hug one axis, set `primaryAxisSizingMode='AUTO'` (or counter) **after** `resize`, never before — otherwise the axis stays locked at the resize value (cost me a Slider overlap pass).
- **Token-fidelity notes (flagged, intentional):** white / white-alpha / neutral-900 are literals (no white token in the DS). Badge horizontal padding bound to spacing/3 (12) both sides — source is pl-3.5/pr-3 (14/12), the 2px asymmetry isn't a DS value. Tag's 14px (px-3.5) and 32px height are literals (off-scale in Tailwind). Radius "full" = literal `cornerRadius 999` (no full-radius token).
- **Next:** 🔴 **FIRST, do the instancing rework** — see the "TOP-PRIORITY REWORK" section near the top (composites must instance Button / Badge / Yuna Avatar, not re-draw them; resolve the Button icon-size / full-width / component-property gaps as part of it). All 27 component pages are drawn, but this rework is what makes them a real library. **Then** Phase 4 (optional) — none of the rest blocks: (a) Phase 4 QA passes from `figma-generate-library` (a11y contrast, naming audit, unresolved-binding audit, final review screenshots); (b) Code Connect mappings (deliberately deferred); (c) the code-side DS-parity gap below. **Asset-upload recipe learned (reusable):** `upload_assets({fileKey, nodeId, count:1, scaleMode})` returns a single-use `submitUrl`; `curl -F "file=@path;type=image/png"` it to get an `imageHash`; that hash can then be reused as an `{type:'IMAGE', scaleMode, imageHash}` fill on *any* number of nodes via `use_figma` (no re-upload). Stack a `{type:'SOLID', color:{r:0,g:0,b:0}, opacity:0.35}` fill above an IMAGE fill to reproduce the card photo wash.
- **⚠️ Code DS-page parity gap to flag:** `src/routes/ds.text-area.tsx` `VARIANT_ROWS` documents only the `Field` variant — the `Display` variant (which `TextArea` supports and which IS built in Figma) is missing from the code DS page. Per the repo's DS-parity rule it should be added there. Surfaced, not fixed (out of scope for the Figma port).

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

## Cleanup pass — committed `fbdbb05` on `main` (2026-06-29, not yet pushed)

_(Historical context for the foundations phase — already done. Skip unless auditing the token cleanup.)_

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

**👉 Active work + the exact next components are in the top "⏭️ RESUME — Phase 3 in progress" section — start there.** TL;DR: 14 primitives built, 13 remain (all molecules/composites). To resume, load `figma-use` + `figma-generate-library`, open file `mUDthz3gYZb8HVL6FpsnJX`, read a built component (e.g. Segmented Toggle `30:52`) as the template, then build the next one (suggested: Chat Bubble or Multiple Choice) on its own page following the modeling rules + build recipe above.

Lower-priority / deferred:
1. **(optional) Prune radix deps** from `package.json` — the deleted `ui/` primitives were the only consumers. Tree-shaken, so no build/bundle impact; low priority.
2. **Code Connect** (Figma↔code mapping) deliberately deferred — optional later phase.
3. **(flagged, not yet done)** Add the missing `Display` variant row to `src/routes/ds.text-area.tsx` (code DS-page parity gap — see ⚠️ note in the RESUME section).
4. The `fbdbb05` cleanup commit is **not yet pushed**.

## Source-of-truth files
- Tokens: `src/styles.css` (`@theme inline`, `:root`, `.dark`, `.overlay-on-dark`, `.platform-android`)
- DS doc pages: `src/routes/ds.colors.tsx`, `ds.typography.tsx`, `ds.spacing.tsx` (these document the **brand** palette; they never listed the removed shadcn tokens)
- Project rules: `CLAUDE.md` (golden rules, theming axes, file map). Memory: `memory/project_figma_ds_foundations.md`.
