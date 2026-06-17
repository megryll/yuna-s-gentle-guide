# Your Starting Point — survey UX approach

How we make a clinically-validated baseline questionnaire feel like a two-minute
conversation worth having, not a form. Backed by `BASELINE-QUESTIONNAIRE.md`
(the flow + question bank) and a research pass over Typeform, Apple State of
Mind, How We Feel, Duolingo's reward mechanics, and PROM-compliance literature.

## Why people abandon these surveys (and our counters)

| Burden | Counter |
|---|---|
| Feels clinical and impersonal | One question per screen, Yuna-voiced framing around verbatim instrument text; the user's own top priority piped into eyebrows and chips ("About your stress") |
| No payoff for the effort | Completion moment plants today's answers as **day one on a real chart**; copy sells the longitudinal + AI angle ("the more Yuna knows, the more precisely she can support you") |
| Feels long | Bottom-anchored progress that starts **partially filled** (endowed progress), no "Question 3 of 27" framing, fast directional transitions that read as forward motion |
| Hard to self-rate honestly | Expressive scale UI (live numeral + warming glow) makes rating feel like expression, not measurement; acknowledgment beats after heavy sections |
| Boring to tap through | A consistent "register beat": every answer gives a settle animation + soft synthesized pop, then the flow advances itself |

## The interaction grammar

Every question follows the same loop, so the flow builds a rhythm:

1. **Arrive** — question pane slides up into place (280ms, house `cubic-bezier(0.2, 0.8, 0.2, 1)`), eyebrow → heading → control staggered.
2. **Answer** — tap (likert) or drag (scale). The control gives instant feedback: settle pulse on the chosen row, or live numeral + glow shift on the rail. A soft WebAudio pop/tick marks it (simulated haptic: scale micro-pulse, since real haptics don't exist in a web prototype).
3. **Register beat** — ~450ms hold so the choice visibly lands. Tapping again within the beat re-picks (no stolen second thoughts).
4. **Advance** — single-choice questions auto-advance (no button); multi-select and scales keep an explicit Continue. Outgoing pane exits up (200ms ease-in), incoming enters from below. Back always available; back reverses the motion direction.
5. **Progress rewards** — the bottom bar eases forward on every advance.

Timing values follow NN/g guidance: exits shorter than entrances, everything
≤ 300ms, nothing blocks input.

## Flow map (5 steps + completion)

| Step | Treatment |
|---|---|
| 1 · Focus picker | `MultipleChoice multiple` with emoji medallions; selection order = priority, shown as small 1/2/3 numerals on selected rows. Explicit Continue (multi-select never auto-advances). One purpose line up front: choosing here shapes the rest ("Yuna starts with what matters most to you"). |
| 2 · Work impact | Expressive 0–8 scale, top-priority chip above the question. |
| 3–5 · Branch items | Likert → `MultipleChoice` single, auto-advance. 0–10 scales → expressive Slider. Instrument text stays **verbatim** (validity); warmth lives in the chrome around it. |
| Completion | The dopamine payoff: checkmark beat → an empty trend chart draws in → today's dot drops onto it ("This is day one of your baseline"), then the AI line: future check-ins sharpen both the chart *and* Yuna's understanding. Single confetti/celebration moment of the whole flow (reward scarcity). CTA returns to Progress where the ghost sparklines now carry a first real point. |

## Sound design (`src/lib/survey-sound.ts`)

Synthesized WebAudio, same idiom as `bubble-sound.ts`; honors the global
prototype mute. Quiet (gain ≤ 0.16), short, major-feeling:

- **Select pop** — C5→G5 sine sweep, ~180ms. Fires on likert/option pick.
- **Slider tick** — 35ms triangle blip per step, very quiet (scroll-wheel feel).
- **Completion swell** — reserved for the final screen (next pass).

## DS changes

**Adapted (this pass):**
- `MultipleChoice` — selection "settle" micro-animation on the row that becomes
  selected (scale 1 → 1.015 → 1, 220ms). Behavior polish to the existing
  selected state; benefits all call sites (therapist preferences too).
- `Slider` — linear variant gains `leftLabel`/`rightLabel` end labels (same
  props the bipolar form already has) and `stepCount` for discrete ranges that
  shouldn't render 11 per-step labels. This is what 0–10 instrument scales need.

**Screen-level for now (promote later):**
- The question-pane transition machinery and the expressive numeral + glow live
  in the questionnaire route. When "Sleep, Stress & Burnout" gets built it
  becomes the second call site → promote to a shared primitive then.

**Flagged, not changed:**
- `/therapist-preferences` still uses top progress + "N of M" + Previous/Next.
  Once this grammar is approved it should back-port (bottom progress, register
  beat, auto-advance on singles).
- `RatingScale` works for short emoji/word scales but not 4–5 option clinical
  likerts with sentence-length labels; those stay `MultipleChoice`. No change.

## Differentiators beyond Typeform

1. **The relationship is the progress.** Progress framed as Yuna understanding
   you, not form completion; completion copy makes the AI-context explicit.
2. **Priority piping.** Step 1's top choice visibly shapes steps 2–5 (chip +
   adaptive question set already in the spec) — proof the answers are heard.
3. **Day-one chart planting.** Ending on the user's first real data point
   converts completion into anticipation of the next check-in.
4. **Expressive scales.** The interface *feels* the rating (glow warms with the
   value) — Apple State of Mind's trick, absent from every survey tool.
5. **Acknowledgment beats.** Sparse Yuna lines at section boundaries; softened
   wording after high-distress answers (reflective, never fortune-telling).

## This pass vs next

**Built now:** route `/questionnaire/your-starting-point` wired from the Home
card and the Progress check-in row; full transition/sound/progress machinery;
two live branch questions (stress 0–10 expressive scale, GAD-2 anxiety likert);
preview-end stub.

**Next pass:** step 1 focus picker with priority numerals, step 2 impact chip,
full branch logic from the bank, the completion chart moment, acknowledgment
beats, answer persistence feeding Progress.
