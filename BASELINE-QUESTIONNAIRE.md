# Baseline questionnaire — extracted reference

Source of truth for the "Your starting point" onboarding questionnaire, extracted
from the live prototype at https://yuna-onboarding-experiments.vercel.app/test-intro
(production bundle `assets/index-rImwxu7w.js`, mined 2026-06-11 — no local checkout
of that project exists). This backs the questionnaire cards on Home and History;
we'll build the flow out in this repo from this spec.

## Flow shape

Five quiz steps at `/onboarding/quiz/1..5` (entered after voice selection; exits
to a feedback screen). Steps 3–5 are adaptive — three items drawn from the bank
below based on the user's **top priority** from step 1.

| Step | Content |
|---|---|
| 1 | Focus-area picker (multi-select, max 3, ordered by priority) |
| 2 | Work-impact scale, framed against the top priority |
| 3–5 | Three branch items from the top priority's question set |

## Step 1 — focus areas

Heading: **"What would you like support with right now?"**
Subcopy: *"Pick up to 3, starting with what matters most to you."*

| id | emoji | label |
|---|---|---|
| stress | 😰 | Stress |
| burnout | 🔥 | Burnout |
| mood | 🌊 | Mood & Emotions |
| sleep | 😴 | Sleep & Energy |
| relationships | ❤️ | Relationships |
| lifeChanges | 🔄 | Life Changes |
| confidence | 💪 | Confidence & Self-Worth |
| career | 💼 | Career & Performance |
| grief | 🕊️ | Grief & Loss |
| substance | 🍷 | Substance Use (alcohol, smoking) |
| habits | 🌱 | Building Better Habits |
| purpose | 🧭 | Finding Purpose & Direction |
| other | — | Something Else |

## Step 2 — impact

**"How much has this been affecting your ability to work?"**
Scale 0–8: `Not at all impaired` · `Moderately impaired` (mid) · `Very severely impaired`.
(The chosen top-priority label is shown as a chip above the question.)

## Question bank

Two item types: `likert` (button list, one per option) and `scale` (slider with
min/max labels).

### Shared items

**globalMentalHealth** (likert)
"In general, how would you rate your mental health, including your mood and your ability to think?"
1 Poor · 2 Fair · 3 Good · 4 Very good · 5 Excellent

**anxiety** (likert — GAD-2 style)
"Over the last two weeks, how often have you been bothered by feeling nervous, anxious, or on edge?"
0 Not at all · 1 Several days · 2 More than half the days · 3 Nearly every day

**stressLevel** (scale 0–10)
"On a scale of 0–10, how would you rate your stress level in the past week?"
`No stress` → `Worst possible`

**loneliness** (scale 0–10)
"How lonely have you been feeling?"
`None` → `Extremely`

**perceivedControl** (likert)
"Regardless of what happens to me, I believe I can control my reaction to it."
1 Does not describe me at all · 2 Does not describe me · 3 Neutral · 4 Describes me · 5 Describes me very well

**selfEsteem** (likert)
"I have high self-esteem."
1 Not very true of me · 2 Mostly not true of me · 3 Somewhat true of me · 4 Mostly true of me · 5 Very true of me

**burnoutSingleItem** (likert — single-item burnout measure)
"Which best describes how you feel about your work right now?"
1 "I enjoy my work. I have no symptoms of burnout."
2 "Occasionally I am under stress, and I don't always have as much energy as I once did, but I don't feel burned out."
3 "I am definitely burning out and have one or more symptoms of burnout, such as physical and emotional exhaustion."
4 "The symptoms of burnout that I'm experiencing won't go away. I think about frustration at work a lot."
5 "I feel completely burned out and often wonder if I can go on. I am at the point where I may need some changes or may need to seek some sort of help."

**fatigue** (scale 0–10)
"In the past 7 days, how would you rate your fatigue on average?"
`No fatigue` → `Worst possible`

### Topic-specific items

**emotionallyDrained** (likert — burnout)
"How often do you feel emotionally drained by your work?"
1 Never or almost never · 2 Seldom · 3 Sometimes · 4 Often · 5 Always

**positiveSpirits** (likert — mood, WHO-5 style)
"In the past week, I felt positive and in good spirits."
1 Never · 2 Rarely · 3 Sometimes · 4 Often · 5 Always

**sleepQuality** (likert — sleep)
"My sleep quality was…"
1 Very poor · 2 Poor · 3 Fair · 4 Good · 5 Very good

**relationshipSatisfaction** (likert — relationships)
"How satisfied are you with your personal relationships?"
1 Very dissatisfied · 2 Dissatisfied · 3 Neither satisfied nor dissatisfied · 4 Satisfied · 5 Very satisfied

**workLifeBalance** (scale 0–10 — career)
"How satisfied are you with the balance between your work and personal life?"
`Very dissatisfied` → `Very satisfied`

**griefInterference** (likert — grief)
"My grief has interfered with my ability to function in daily life."
0 Not at all · 1 A little · 2 Somewhat · 3 Quite a bit · 4 Extremely

**substanceConfidence** (scale 0–10 — substance)
"How confident are you that you could resist the urge to use substances when you feel stressed?"
`Not at all confident` → `Completely confident`

**lifeMeaning** (likert — purpose)
"My life has meaning."
1 Never · 2 Rarely · 3 Sometimes · 4 Often · 5 Always

**cantrilLadder** (scale 0–10 — purpose)
"Imagine a ladder with steps numbered 0 at the bottom to 10 at the top. The top represents the best possible life for you; the bottom, the worst. On which step do you feel you stand at this time?"
`Worst possible life` → `Best possible life`

## Branch map (steps 3–5 per top priority)

| Top priority | Item 1 | Item 2 | Item 3 |
|---|---|---|---|
| stress | stressLevel | anxiety | globalMentalHealth |
| burnout | burnoutSingleItem | emotionallyDrained | globalMentalHealth |
| mood | globalMentalHealth | anxiety | positiveSpirits |
| sleep | sleepQuality | fatigue | globalMentalHealth |
| relationships | relationshipSatisfaction | loneliness | stressLevel |
| lifeChanges | perceivedControl | anxiety | stressLevel |
| confidence | selfEsteem | globalMentalHealth | loneliness |
| career | workLifeBalance | selfEsteem | burnoutSingleItem |
| grief | griefInterference | globalMentalHealth | perceivedControl |
| substance | substanceConfidence | globalMentalHealth | stressLevel |
| habits | globalMentalHealth | stressLevel | perceivedControl |
| purpose | lifeMeaning | fatigue | cantrilLadder |
| other | globalMentalHealth | anxiety | perceivedControl |
