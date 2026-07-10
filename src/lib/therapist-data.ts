import type { HomeCard } from "@/lib/home-cards";
import type { Appointment } from "@/lib/therapist-prefs";

// ─── Therapist Recommendations — data model ──────────────────────────────────
// Ported from the reference prototype's therapistData.js, retyped for this
// codebase. Each therapist has a headshot photo under /public/therapists/ (the
// matching ids lifted from the reference prototype, the rest sourced portraits).
// Everything below is static prototype content.

export type Therapist = {
  id: string;
  name: string;
  credentials: string;
  location: string;
  /** Headshot image path under /public/therapists/. */
  photo: string;
  tags: string[];
  bio: string;
  /** Yuna's voice — why she surfaced this match (no em dashes, no fortune-telling). */
  yunaMatch: string;
  specialties: { emoji: string; title: string; body: string }[];
  yearsInPractice: number;
  sessionFormats: string[];
  languages: string[];
  issues: string[];
  modalities: string[];
  ageGroups: string[];
  communities: string[];
  fee: { range: string; slidingScale: boolean };
  insurance: string[];
  education: { degree: string; school: string; year: number; license: string };
};

export const THERAPISTS: Record<string, Therapist> = {
  kerstin: {
    id: "kerstin",
    name: "Kerstin Hustchings",
    credentials: "Marriage & Family Therapist, MA, LMFT",
    location: "Newport Beach, CA",
    photo: "/therapists/kerstin.jpg",
    tags: ["Relationships", "CBT", "EMDR", "Couples", "Anxiety", "Family conflict", "Self-worth"],
    bio: "Marriage & Family Therapist specializing in children, teens, young adults, and new/expecting mothers. Kerstin uses evidence-based approaches like CBT and EMDR to help clients build confidence, resilience, and emotional balance.",
    yunaMatch: "Kerstin could be a great fit because she specializes in both relationship dynamics and practices CBT.",
    specialties: [
      { emoji: "💔", title: "Working Through a Breakup", body: "Kerstin specializes in relationships and can help you heal and move forward with strength." },
      { emoji: "👫", title: "Strengthening Relationships", body: "Kerstin helps couples rebuild trust and create deeper, lasting connections." },
      { emoji: "💪", title: "Finding Balance Again", body: "Kerstin supports you in building resilience and regaining a stronger sense of control." },
    ],
    yearsInPractice: 14,
    sessionFormats: ["Video", "In-person"],
    languages: ["English"],
    issues: ["Relationships", "Couples", "Anxiety", "Family conflict", "Self-esteem", "Life transitions", "Parenting", "Postpartum"],
    modalities: ["CBT", "EMDR", "Solution-Focused", "Family Systems"],
    ageGroups: ["Adults", "Young adults", "Teens (14+)"],
    communities: ["New & expecting parents", "Couples"],
    fee: { range: "$180–$220", slidingScale: true },
    insurance: ["Aetna", "Cigna", "United Healthcare", "Out-of-network"],
    education: { degree: "MA, Marriage & Family Therapy", school: "Pepperdine University", year: 2010, license: "LMFT #98432, California" },
  },
  mira: {
    id: "mira",
    name: "Mira Sokolova",
    credentials: "Licensed Clinical Psychologist, PhD",
    location: "San Francisco, CA",
    photo: "/therapists/mira.jpg",
    tags: ["Anxiety", "Mindfulness", "ACT", "Perfectionism", "Life transitions", "Stress", "Self-compassion"],
    bio: "Licensed Clinical Psychologist with 12 years of experience using Acceptance & Commitment Therapy (ACT) to help clients navigate anxiety, perfectionism, and life transitions.",
    yunaMatch: "Mira could be a great fit because she works with anxiety and perfectionism using ACT and mindfulness.",
    specialties: [
      { emoji: "😟", title: "Working With Anxiety", body: "Mira helps you understand the patterns behind anxiety and build practical tools to settle your nervous system." },
      { emoji: "🌿", title: "Mindfulness in Daily Life", body: "Mira teaches mindfulness practices that fit your real life, not generic routines." },
      { emoji: "🧭", title: "Values-Based Living", body: "Mira uses ACT to help you align your actions with what genuinely matters to you." },
    ],
    yearsInPractice: 12,
    sessionFormats: ["Video", "In-person"],
    languages: ["English", "Russian"],
    issues: ["Anxiety", "Perfectionism", "Stress", "Life transitions", "Self-compassion", "Burnout", "Career stress"],
    modalities: ["ACT", "Mindfulness-Based", "CBT"],
    ageGroups: ["Adults", "Young adults"],
    communities: ["High-achievers", "First-gen professionals"],
    fee: { range: "$200–$250", slidingScale: true },
    insurance: ["Aetna", "Anthem", "Out-of-network"],
    education: { degree: "PhD, Clinical Psychology", school: "UC Berkeley", year: 2012, license: "PSY #28814, California" },
  },
  leo: {
    id: "leo",
    name: "Leo Brennan",
    credentials: "Licensed Professional Counselor, LPC",
    location: "Austin, TX",
    photo: "/therapists/leo.jpg",
    tags: ["Depression", "Self-worth", "IFS", "Inner work", "Self-compassion", "Identity", "Anxiety"],
    bio: "Licensed Professional Counselor using Internal Family Systems (IFS) to help clients build self-compassion, work through depression, and develop a clearer sense of who they are.",
    yunaMatch: "Leo could be a great fit because he uses IFS to support work on depression and self-worth.",
    specialties: [
      { emoji: "🌧️", title: "Working With Depression", body: "Leo helps you understand the parts of you that have shut down, and gently invite them back." },
      { emoji: "💗", title: "Building Self-Worth", body: "Leo supports you in untangling old self-criticism and rebuilding a more compassionate inner voice." },
      { emoji: "🌱", title: "IFS & Inner Work", body: "Leo uses Internal Family Systems to help you understand the different parts of yourself." },
    ],
    yearsInPractice: 7,
    sessionFormats: ["Video", "In-person"],
    languages: ["English"],
    issues: ["Depression", "Self-esteem", "Anxiety", "Identity", "Self-compassion"],
    modalities: ["Internal Family Systems (IFS)", "CBT", "Compassion-Focused Therapy"],
    ageGroups: ["Adults", "Young adults"],
    communities: ["LGBTQ+ allied", "Young adults navigating change"],
    fee: { range: "$140–$180", slidingScale: true },
    insurance: ["Aetna", "Cigna", "United Healthcare"],
    education: { degree: "MA, Counseling Psychology", school: "St. Edward's University", year: 2017, license: "LPC #76321, Texas" },
  },
  aisha: {
    id: "aisha",
    name: "Aisha Patel",
    credentials: "Licensed Marriage & Family Therapist, LMFT",
    location: "Seattle, WA",
    photo: "/therapists/aisha.jpg",
    tags: ["Burnout", "Boundaries", "Career stress", "IFS", "Somatic", "Perfectionism", "Identity"],
    bio: "LMFT with a focus on high-achievers facing burnout, perfectionism, and identity questions. Aisha draws from IFS and somatic therapy to help clients reconnect with rest, play, and a sustainable pace.",
    yunaMatch: "Aisha could be a great fit because she helps high-achievers recover from burnout using IFS and somatic work.",
    specialties: [
      { emoji: "🔥", title: "Recovering from Burnout", body: "Aisha helps you recognize burnout patterns early and rebuild a sustainable relationship with work." },
      { emoji: "🚧", title: "Setting Boundaries", body: "Aisha works with you on the practical and emotional work of saying no without guilt." },
      { emoji: "✨", title: "Reconnecting with Yourself", body: "Aisha helps you find what matters when achievement is no longer the only signal." },
    ],
    yearsInPractice: 9,
    sessionFormats: ["Video"],
    languages: ["English", "Hindi", "Gujarati"],
    issues: ["Burnout", "Career stress", "Perfectionism", "Boundaries", "Identity", "Anxiety"],
    modalities: ["Internal Family Systems (IFS)", "Somatic Therapy", "Mindfulness-Based"],
    ageGroups: ["Adults", "Young adults"],
    communities: ["South Asian", "High-achievers", "First-gen professionals"],
    fee: { range: "$190–$230", slidingScale: false },
    insurance: ["Premera", "Out-of-network"],
    education: { degree: "MA, Couple & Family Therapy", school: "Antioch University Seattle", year: 2015, license: "LMFT #LF60892891, Washington" },
  },
  "priya-s": {
    id: "priya-s",
    name: "Dr. Priya Shah",
    credentials: "Clinical Psychologist, PsyD",
    location: "Boston, MA",
    photo: "/therapists/priya-s.jpg",
    tags: ["Trauma", "EMDR", "Attachment", "Somatic", "Intimacy", "Nervous system", "PTSD"],
    bio: "Clinical Psychologist specializing in trauma recovery and attachment work. Priya combines EMDR with somatic and attachment-based approaches to help clients heal from early wounds and build secure connection.",
    yunaMatch: "Priya could be a great fit because she pairs EMDR with attachment-focused work for trauma recovery.",
    specialties: [
      { emoji: "🧠", title: "Trauma Recovery", body: "Priya uses EMDR to help your nervous system process what your story already understands." },
      { emoji: "🤝", title: "Attachment Work", body: "Priya helps you understand how early relational patterns shape current intimacy and trust." },
      { emoji: "🌊", title: "Somatic Therapy", body: "Priya brings the body into the work, because trauma lives there too." },
    ],
    yearsInPractice: 18,
    sessionFormats: ["Video", "In-person"],
    languages: ["English", "Hindi"],
    issues: ["Trauma", "PTSD", "Attachment", "Intimacy", "Anxiety", "Complex trauma"],
    modalities: ["EMDR", "Somatic Therapy", "Attachment-Based"],
    ageGroups: ["Adults"],
    communities: ["Trauma survivors", "BIPOC-affirming"],
    fee: { range: "$240–$280", slidingScale: false },
    insurance: ["Out-of-network only"],
    education: { degree: "PsyD, Clinical Psychology", school: "Harvard Medical School", year: 2006, license: "PSY #9821, Massachusetts" },
  },
  "sara-k": {
    id: "sara-k",
    name: "Sara Kim",
    credentials: "Licensed Marriage & Family Therapist, LMFT",
    location: "Los Angeles, CA",
    photo: "/therapists/sara-k.jpg",
    tags: ["Mindfulness", "Stress", "Body-based therapy", "Somatic", "Overwhelm", "Anxiety", "Nervous system"],
    bio: "LMFT combining mindfulness and somatic techniques to help clients regulate stress, reconnect with their bodies, and build a more settled nervous system.",
    yunaMatch: "Sara could be a great fit because she combines mindfulness with somatic work to help you regulate stress.",
    specialties: [
      { emoji: "🌿", title: "Mindfulness-Based Stress Reduction", body: "Sara helps you build a mindfulness practice that meets you where you actually are." },
      { emoji: "🫁", title: "Somatic Regulation", body: "Sara uses body-based work to help your nervous system find safety again." },
      { emoji: "🌊", title: "Working With Overwhelm", body: "Sara helps you slow down enough to actually feel what's underneath the busy." },
    ],
    yearsInPractice: 10,
    sessionFormats: ["Video", "In-person"],
    languages: ["English", "Korean"],
    issues: ["Stress", "Anxiety", "Overwhelm", "Burnout", "Sleep", "Body image"],
    modalities: ["Mindfulness-Based (MBSR)", "Somatic Therapy", "Polyvagal-Informed"],
    ageGroups: ["Adults", "Young adults"],
    communities: ["Asian American", "Caregivers"],
    fee: { range: "$185–$215", slidingScale: true },
    insurance: ["Cigna", "Anthem", "Out-of-network"],
    education: { degree: "MA, Marriage & Family Therapy", school: "USC", year: 2014, license: "LMFT #112488, California" },
  },
  "james-d": {
    id: "james-d",
    name: "James Dupont",
    credentials: "Licensed Clinical Social Worker, LCSW",
    location: "Brooklyn, NY",
    photo: "/therapists/james-d.jpg",
    tags: ["Grief", "Trauma", "Men's Mental Health", "Loss", "Bereavement", "Somatic", "Narrative therapy"],
    bio: "Licensed Clinical Social Worker focused on grief, trauma, and men's mental health. James works with clients navigating loss, parental bereavement, and major life transitions using a blend of somatic and narrative approaches.",
    yunaMatch: "James could be a great fit because he supports men through grief and loss with somatic and narrative work.",
    specialties: [
      { emoji: "🌊", title: "Processing Grief", body: "James gives you space to sit with loss without the pressure to move on before you're ready." },
      { emoji: "🧠", title: "Trauma Recovery", body: "James uses somatic and narrative work to help clients reintegrate after difficult experiences." },
      { emoji: "🛡️", title: "Men's Mental Health", body: "James works with men untangling the cultural expectations that get in the way of feeling." },
    ],
    yearsInPractice: 16,
    sessionFormats: ["Video", "In-person"],
    languages: ["English", "French"],
    issues: ["Grief", "Trauma", "PTSD", "Bereavement", "Loss", "Men's mental health", "Life transitions"],
    modalities: ["Somatic Therapy", "Narrative Therapy", "EMDR"],
    ageGroups: ["Adults", "Seniors"],
    communities: ["Men", "Bereaved parents", "Veterans"],
    fee: { range: "$170–$210", slidingScale: true },
    insurance: ["Blue Cross Blue Shield", "Cigna", "Out-of-network"],
    education: { degree: "MSW, Clinical Social Work", school: "Columbia University", year: 2008, license: "LCSW #084392, New York" },
  },
  "sofia-r": {
    id: "sofia-r",
    name: "Sofia Reyes",
    credentials: "Licensed Mental Health Counselor, LMHC",
    location: "Miami, FL",
    photo: "/therapists/sofia-r.jpg",
    tags: ["Latinx affirming", "Bicultural identity", "Family dynamics", "Anxiety", "Bilingual"],
    bio: "Bilingual LMHC working with Latinx clients on bicultural identity, family dynamics, and anxiety. Sofia holds space for the unspoken expectations that shape so many first- and second-generation lives.",
    yunaMatch: "Sofia could be a great fit because she works with Latinx clients on bicultural identity and family dynamics in English or Spanish.",
    specialties: [
      { emoji: "🌎", title: "Bicultural Identity", body: "Sofia helps you navigate the in-between space of two cultures, two languages, and two sets of expectations." },
      { emoji: "👨‍👩‍👧", title: "Family Dynamics", body: "Sofia works with the loyalty, love, and friction inside Latinx families." },
      { emoji: "🌊", title: "Anxiety in Context", body: "Sofia treats anxiety with awareness of the cultural and immigration histories that shape it." },
    ],
    yearsInPractice: 8,
    sessionFormats: ["Video", "In-person"],
    languages: ["English", "Spanish"],
    issues: ["Anxiety", "Family conflict", "Identity", "Acculturation", "Self-esteem", "Life transitions"],
    modalities: ["CBT", "Narrative Therapy", "Family Systems"],
    ageGroups: ["Adults", "Young adults", "Teens (14+)"],
    communities: ["Latinx", "First-gen Americans", "Immigrants"],
    fee: { range: "$140–$180", slidingScale: true },
    insurance: ["Aetna", "Cigna", "Florida Blue", "Out-of-network"],
    education: { degree: "MS, Mental Health Counseling", school: "University of Miami", year: 2016, license: "LMHC #MH18472, Florida" },
  },
  "olivia-b": {
    id: "olivia-b",
    name: "Dr. Olivia Bennett",
    credentials: "Clinical Psychologist, PhD",
    location: "New York, NY",
    photo: "/therapists/olivia-b.jpg",
    tags: ["Anxiety", "OCD", "ERP", "Intrusive thoughts", "CBT"],
    bio: "Clinical Psychologist with deep specialization in OCD, anxiety, and intrusive thoughts. Olivia uses Exposure & Response Prevention (ERP), the gold standard for OCD, alongside CBT for related anxiety patterns.",
    yunaMatch: "Olivia could be a great fit because she specializes in OCD and intrusive thoughts using ERP.",
    specialties: [
      { emoji: "🌀", title: "OCD Treatment", body: "Olivia uses ERP to help your brain learn that the loop doesn't need to keep running." },
      { emoji: "🧠", title: "Intrusive Thoughts", body: "Olivia normalizes the thoughts and gives you a different way to relate to them." },
      { emoji: "😟", title: "Anxiety Disorders", body: "Olivia helps you face anxiety with structure, not just willpower." },
    ],
    yearsInPractice: 17,
    sessionFormats: ["Video", "In-person"],
    languages: ["English"],
    issues: ["OCD", "Anxiety", "Intrusive thoughts", "Health anxiety", "Panic", "Phobias"],
    modalities: ["ERP (Exposure & Response Prevention)", "CBT", "ACT"],
    ageGroups: ["Adults", "Young adults"],
    communities: ["OCD community", "Anxiety specialists"],
    fee: { range: "$260–$310", slidingScale: false },
    insurance: ["Out-of-network only"],
    education: { degree: "PhD, Clinical Psychology", school: "NYU", year: 2007, license: "PSY #023891, New York" },
  },
  "carmen-v": {
    id: "carmen-v",
    name: "Carmen Vega",
    credentials: "Licensed Clinical Social Worker, LCSW",
    location: "Oakland, CA",
    photo: "/therapists/carmen-v.jpg",
    tags: ["LGBTQ+ affirming", "Queer identity", "Gender identity", "Trauma", "Liberation"],
    bio: "LCSW providing queer- and trans-affirming care from a liberation lens. Carmen works with clients on gender, identity, relational trauma, and the daily work of living as oneself in a world that doesn't always make room.",
    yunaMatch: "Carmen could be a great fit because she offers queer- and trans-affirming care with a liberation-oriented approach.",
    specialties: [
      { emoji: "🏳️‍🌈", title: "Queer Identity Work", body: "Carmen creates a space where being queer isn't the topic, it's the foundation." },
      { emoji: "🏳️‍⚧️", title: "Gender Affirming Care", body: "Carmen supports trans and nonbinary clients across exploration, transition, and beyond." },
      { emoji: "✊", title: "Liberation & Trauma", body: "Carmen does trauma work that names systems, not just symptoms." },
    ],
    yearsInPractice: 10,
    sessionFormats: ["Video", "In-person"],
    languages: ["English", "Spanish"],
    issues: ["Gender identity", "Sexual orientation", "Trauma", "Minority stress", "Family of origin", "Relationships"],
    modalities: ["Relational Therapy", "Liberation Psychology", "Somatic Therapy"],
    ageGroups: ["Adults", "Young adults"],
    communities: ["LGBTQ+", "Trans & nonbinary", "Queer BIPOC"],
    fee: { range: "$160–$200", slidingScale: true },
    insurance: ["Kaiser", "Anthem", "Out-of-network"],
    education: { degree: "MSW, Clinical Social Work", school: "UC Berkeley", year: 2014, license: "LCSW #82931, California" },
  },
  "rebecca-f": {
    id: "rebecca-f",
    name: "Rebecca Foster",
    credentials: "Licensed Marriage & Family Therapist, LMFT",
    location: "Nashville, TN",
    photo: "/therapists/rebecca-f.jpg",
    tags: ["Couples", "EFT", "Communication", "Intimacy", "Attachment"],
    bio: "LMFT specializing in couples work. Rebecca uses Emotionally Focused Therapy (EFT) to help partners understand the cycle they get stuck in and build a more secure bond underneath the conflict.",
    yunaMatch: "Rebecca could be a great fit for couples work, using EFT to help partners move past the cycle they keep landing in.",
    specialties: [
      { emoji: "💞", title: "Couples Therapy", body: "Rebecca helps you fight less by understanding what you're actually fighting about." },
      { emoji: "🔗", title: "Attachment Work", body: "Rebecca uses EFT to help partners build a more secure bond." },
      { emoji: "💬", title: "Communication Patterns", body: "Rebecca works with the pattern, not just the words, that keeps tripping you up." },
    ],
    yearsInPractice: 11,
    sessionFormats: ["Video", "In-person"],
    languages: ["English"],
    issues: ["Couples", "Communication", "Intimacy", "Attachment", "Conflict", "Premarital"],
    modalities: ["EFT (Emotionally Focused)", "Gottman Method", "Attachment-Based"],
    ageGroups: ["Adults", "Couples"],
    communities: ["Couples", "Engaged & newly married"],
    fee: { range: "$190–$230", slidingScale: false },
    insurance: ["Blue Cross Blue Shield", "Cigna", "Out-of-network"],
    education: { degree: "MA, Marriage & Family Therapy", school: "Lipscomb University", year: 2013, license: "LMFT #1842, Tennessee" },
  },
  "imani-a": {
    id: "imani-a",
    name: "Imani Adekunle",
    credentials: "Licensed Independent Clinical Social Worker, LICSW",
    location: "Washington, DC",
    photo: "/therapists/imani-a.jpg",
    tags: ["Black women", "Identity", "Racial trauma", "Self-trust", "Boundaries"],
    bio: "LICSW working primarily with Black women on identity, racial trauma, self-trust, and boundaries. Imani helps clients reclaim space to feel softly in a world that asks them to be strong.",
    yunaMatch: "Imani could be a great fit because she works with Black women on identity, racial trauma, and self-trust.",
    specialties: [
      { emoji: "👑", title: "Black Women's Inner Work", body: "Imani makes space for the softness, rage, and rest that often get postponed." },
      { emoji: "🧬", title: "Racial Trauma", body: "Imani works with the cumulative weight of racial stress, named, not minimized." },
      { emoji: "🚧", title: "Self-Trust & Boundaries", body: "Imani helps you hear yourself again under everyone else's voice." },
    ],
    yearsInPractice: 13,
    sessionFormats: ["Video", "In-person"],
    languages: ["English"],
    issues: ["Identity", "Racial trauma", "Self-worth", "Boundaries", "Career stress", "Relationships"],
    modalities: ["Liberation Psychology", "Narrative Therapy", "Somatic Therapy"],
    ageGroups: ["Adults", "Young adults"],
    communities: ["Black women", "BIPOC professionals", "First-gen"],
    fee: { range: "$180–$220", slidingScale: true },
    insurance: ["CareFirst", "Aetna", "Out-of-network"],
    education: { degree: "MSW, Clinical Social Work", school: "Howard University", year: 2011, license: "LICSW #LC50091872, DC" },
  },
};

/** Curated order Yuna surfaces matches in (the recommendation deck). */
export const MATCH_ORDER = [
  "kerstin", "mira", "leo", "aisha", "priya-s", "sara-k",
  "james-d", "sofia-r", "carmen-v", "rebecca-f", "olivia-b", "imani-a",
];

export const ALL_THERAPIST_IDS = Object.keys(THERAPISTS);

export function getTherapist(id: string | undefined): Therapist | null {
  return id ? THERAPISTS[id] ?? null : null;
}

export function matchedTherapists(): Therapist[] {
  return MATCH_ORDER.map((id) => THERAPISTS[id]).filter(Boolean);
}

// ─── Preferences survey ──────────────────────────────────────────────────────

export type SurveyQuestion =
  | { id: string; type: "freeText"; title: string; prompt: string; placeholder: string }
  | { id: string; type: "pillGroup"; title: string; prompt: string; items: PillGroupItem[] }
  | { id: string; type: "location"; title: string; prompt: string }
  | { id: string; type: "single"; title: string; prompt: string; options: ChoiceOption[] }
  | { id: string; type: "multi"; title: string; prompt: string; options: ChoiceOption[] }
  | { id: string; type: "chips"; title: string; prompt: string; placeholder: string; suggestions: string[] }
  | {
      id: string;
      type: "insurance";
      title: string;
      prompt: string;
      placeholder: string;
      suggestions: string[];
      /** The exclusive "paying out of pocket" choice shown above the search. */
      none: { value: string; label: string; subtitle: string };
      /** Follow-up revealed while `none` is selected: per-session budget. */
      budget: { id: string; label: string; options: string[] };
    };

/** Scripted two-exchange opener: Yuna greets, the user answers, Yuna asks one
 *  follow-up, the user answers again, Yuna wraps up. */
export type SurveyChatScript = { greeting: string[]; followUp: string; wrapUp: string };

export type PillGroupItem = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  /** Multi-select row — renders as wrapping tag chips instead of a single-pick
   *  segmented rail (which only fits a few short, mutually exclusive labels). */
  multi?: true;
};

export type ChoiceOption = { value: string; label: string; emoji?: string };

// Shared between the survey chip questions and the filters drawer.
export const SPECIALTY_OPTIONS = [
  "Anxiety", "Depression", "Relationships", "Trauma", "Grief", "Burnout",
  "Self-esteem", "Stress", "Life transitions", "Identity", "ADHD", "OCD",
  "Couples", "Eating disorders", "Boundaries", "Parenting", "Perfectionism",
];
export const APPROACH_OPTIONS = [
  "CBT", "ACT", "EMDR", "Somatic Therapy",
  "Mindfulness-Based", "Narrative Therapy", "EFT (Emotionally Focused)",
  "Compassion-Focused Therapy", "Family Systems", "DBT", "Psychodynamic",
];
export const INSURANCE_OPTIONS = [
  "Aetna", "BlueCross BlueShield", "Cigna", "United Healthcare", "Kaiser",
  "Anthem", "Premera", "Florida Blue", "CareFirst", "Out-of-network",
];

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "matters",
    type: "freeText",
    title: "What matters most to you in a therapist?",
    prompt: "In your own words. A sentence or two is plenty.",
    placeholder: "Type or record your answer",
  },
  {
    id: "avoid",
    type: "freeText",
    title: "Anything you'd want to avoid?",
    prompt: "Maybe something that hasn't worked for you before. It's okay to skip this.",
    placeholder: "Type or record your answer",
  },
  {
    id: "quickOnes",
    type: "pillGroup",
    title: "A few quick ones",
    prompt: "Tap what fits. Skip anything you like.",
    items: [
      {
        id: "format",
        label: "How would you like to meet?",
        options: [
          { value: "In Person", label: "In person" },
          { value: "Online", label: "Online" },
          { value: "Either", label: "Either" },
        ],
      },
      {
        id: "gender",
        label: "Therapist gender preference?",
        options: [
          { value: "Female", label: "Female" },
          { value: "Male", label: "Male" },
          { value: "Non-binary", label: "Non-binary" },
          { value: "No preference", label: "Any" },
        ],
      },
      {
        id: "identity",
        label: "Identity and background preferences?",
        multi: true,
        options: [
          { value: "LGBTQ+ affirming", label: "LGBTQ+ affirming" },
          { value: "Culturally sensitive", label: "Culturally sensitive" },
          { value: "Faith-informed", label: "Faith-informed" },
          { value: "Indigenous Peoples", label: "Indigenous Peoples" },
          { value: "Newcomer or immigrant experience", label: "Newcomer or immigrant" },
        ],
      },
    ],
  },
  {
    id: "location",
    type: "location",
    title: "Let's confirm your location",
    prompt: "Therapists are only licensed to practice in certain states. We'll use this to match you with ones who can see you.",
  },
  {
    id: "insurance",
    type: "insurance",
    title: "Do you have insurance coverage?",
    prompt: "Search for your provider, or let me know if you're paying out of pocket.",
    placeholder: "Search insurance providers",
    suggestions: INSURANCE_OPTIONS,
    none: {
      value: "No insurance coverage",
      label: "No insurance coverage",
      subtitle: "I am paying out of pocket",
    },
    budget: {
      id: "sessionBudget",
      label: "What feels comfortable per session?",
      options: ["Under $100", "$100–$150", "$150+"],
    },
  },
];

/** The prototype's stand-in for device geolocation: the location Yuna
 *  "detected", offered as a one-tap pick on the survey's location question. */
export const DETECTED_LOCATION = { city: "San Francisco", state: "CA", zip: "94102" };

/** Location typeahead suggestions for the survey + filters drawer. At least one
 *  city per US state (plus DC), so a search by any state name returns a match. */
export const LOCATIONS = [
  { city: "Birmingham", state: "AL", zip: "35203" },
  { city: "Anchorage", state: "AK", zip: "99501" },
  { city: "Phoenix", state: "AZ", zip: "85003" },
  { city: "Little Rock", state: "AR", zip: "72201" },
  { city: "Los Angeles", state: "CA", zip: "90012" },
  { city: "San Francisco", state: "CA", zip: "94102" },
  { city: "Oakland", state: "CA", zip: "94607" },
  { city: "Denver", state: "CO", zip: "80202" },
  { city: "Hartford", state: "CT", zip: "06103" },
  { city: "Wilmington", state: "DE", zip: "19801" },
  { city: "Washington", state: "DC", zip: "20001" },
  { city: "Miami", state: "FL", zip: "33101" },
  { city: "Atlanta", state: "GA", zip: "30303" },
  { city: "Honolulu", state: "HI", zip: "96813" },
  { city: "Boise", state: "ID", zip: "83702" },
  { city: "Chicago", state: "IL", zip: "60601" },
  { city: "Indianapolis", state: "IN", zip: "46204" },
  { city: "Des Moines", state: "IA", zip: "50309" },
  { city: "Wichita", state: "KS", zip: "67202" },
  { city: "Louisville", state: "KY", zip: "40202" },
  { city: "New Orleans", state: "LA", zip: "70112" },
  { city: "Portland", state: "ME", zip: "04101" },
  { city: "Baltimore", state: "MD", zip: "21201" },
  { city: "Boston", state: "MA", zip: "02108" },
  { city: "Detroit", state: "MI", zip: "48226" },
  { city: "Minneapolis", state: "MN", zip: "55401" },
  { city: "Jackson", state: "MS", zip: "39201" },
  { city: "Kansas City", state: "MO", zip: "64106" },
  { city: "Billings", state: "MT", zip: "59101" },
  { city: "Omaha", state: "NE", zip: "68102" },
  { city: "Las Vegas", state: "NV", zip: "89101" },
  { city: "Manchester", state: "NH", zip: "03101" },
  { city: "Newark", state: "NJ", zip: "07102" },
  { city: "Albuquerque", state: "NM", zip: "87102" },
  { city: "New York", state: "NY", zip: "10001" },
  { city: "Brooklyn", state: "NY", zip: "11201" },
  { city: "Charlotte", state: "NC", zip: "28202" },
  { city: "Fargo", state: "ND", zip: "58102" },
  { city: "Columbus", state: "OH", zip: "43215" },
  { city: "Oklahoma City", state: "OK", zip: "73102" },
  { city: "Portland", state: "OR", zip: "97201" },
  { city: "Philadelphia", state: "PA", zip: "19102" },
  { city: "Providence", state: "RI", zip: "02903" },
  { city: "Charleston", state: "SC", zip: "29401" },
  { city: "Sioux Falls", state: "SD", zip: "57104" },
  { city: "Nashville", state: "TN", zip: "37201" },
  { city: "Austin", state: "TX", zip: "78701" },
  { city: "Salt Lake City", state: "UT", zip: "84101" },
  { city: "Burlington", state: "VT", zip: "05401" },
  { city: "Richmond", state: "VA", zip: "23219" },
  { city: "Seattle", state: "WA", zip: "98101" },
  { city: "Charleston", state: "WV", zip: "25301" },
  { city: "Milwaukee", state: "WI", zip: "53202" },
  { city: "Cheyenne", state: "WY", zip: "82001" },
];

// ─── Scheduling ──────────────────────────────────────────────────────────────

export type SessionType = { id: string; label: string; duration: string; body: string };

// One offering only: the standard 45-minute session. (Free intro calls were
// removed from the flow; the id stays "session" so stored appointments match.)
export const SESSION_TYPES: SessionType[] = [
  { id: "session", label: "Therapy session", duration: "45 min", body: "A full session to begin working together." },
];

// Indexed by JS weekday (0 = Sunday). Empty = closed that day.
export const TIME_SLOTS_BY_WEEKDAY: string[][] = [
  [], // Sun
  ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "4:00 PM"], // Mon
  ["9:00 AM", "10:00 AM", "12:00 PM", "1:00 PM", "3:00 PM"], // Tue
  ["10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"], // Wed
  ["9:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "5:00 PM"], // Thu
  ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM"], // Fri
  ["10:00 AM", "11:00 AM"], // Sat
];

export function timesForDate(date: Date): string[] {
  return TIME_SLOTS_BY_WEEKDAY[date.getDay()] ?? [];
}

/** Strip time so date-only comparisons are clean. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export type MonthCell = { date: Date; inMonth: boolean };

/** Build a 6×7 (42-cell) grid covering `month`, padded with adjacent-month days. */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay()); // back up to the Sunday
  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ date, inMonth: date.getMonth() === month });
  }
  return cells;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatMonth(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatLongDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** Short form for tight spots (the Tools tile caption): "Tue, Jul 14". */
export function formatShortDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

// Appointments persist their date as a local "yyyy-mm-dd" string. Round-trip
// through these (not `new Date(iso)`, which parses as UTC midnight and can
// shift a day in western timezones).
export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

// ─── Guided session — Session debrief ────────────────────────────────────────
// After a completed call, the hub (and the Tools tile) offer a short debrief
// chat. Same scripted two-exchange shape as the reco opener; the hand-off card
// offers booking a first full session with the same therapist.

export const GUIDED_DEBRIEF_TITLE = "Session debrief";

export const GUIDED_DEBRIEF_STEPS = ["Share how it went", "Choose your next step"];

export function guidedDebriefScript(therapistFirstName: string): SurveyChatScript {
  const name = therapistFirstName;
  return {
    greeting: [
      `Welcome back. I'd love to hear how your call with ${name} went.`,
      `There's no right or wrong answer here. How did it feel to talk with ${name}?`,
    ],
    followUp:
      "Thank you for sharing that. One more: did you feel like you could open up, or was something missing?",
    wrapUp: `That's helpful to sit with, and whatever you decide is okay. If it felt right, you can book a full session with ${name} below. If it didn't, I can help you keep looking.`,
  };
}

// ─── Home follow-up card ─────────────────────────────────────────────────────
// Once a booked session's time has passed (and it hasn't been debriefed), the
// Home feed pins a guided-session card offering the same debrief chat the hub
// does. Built per-appointment so the copy names the therapist and the date.

export function debriefHomeCard(a: Appointment): HomeCard {
  const t = getTherapist(a.therapistId) ?? matchedTherapists()[0];
  const name = t.name.split(" ")[0];
  return {
    type: "guided-session",
    id: `therapist-debrief-${a.id}`,
    title: `How did your session with ${name} go?`,
    subtitle: `You met with ${name} on ${formatLongDate(fromISODate(a.dateISO))}. Let's take a few minutes to unpack it together.`,
    isNew: true,
  };
}

// ─── Guided session — Session prep ───────────────────────────────────────────
// The hub's "Prepare with Yuna" tile opens a guided conversation ahead of an
// upcoming appointment. Contextual greeting only — after Yuna's opener the
// conversation is a normal open session (no fixed follow-up or hand-off).

export const GUIDED_PREP_TITLE = "Prepare for your therapy session";

export function guidedPrepGreeting(
  therapistFirstName: string,
  dateLabel: string | null,
): string[] {
  const session = dateLabel
    ? `your session with ${therapistFirstName} on ${dateLabel}`
    : `your upcoming session with ${therapistFirstName}`;
  return [
    `I'm glad you're taking a moment to get ready for ${session}.`,
    `What feels most important to bring up with ${therapistFirstName}? We can talk through your goals, or anything you're unsure about.`,
  ];
}

// ─── Share summary with your therapist ───────────────────────────────────────
// The consent-forward pre-session share. Each section is individually
// includable; nothing is shared until the user explicitly sends.

export type ShareSummarySection = { id: string; title: string; body: string };

/** The prototype's stand-in for the generated PDF: a static mock document
 *  (public/mock-summary.html) opened in a new tab, personalized via params. */
export function summaryPdfUrl(t: Therapist): string {
  const params = new URLSearchParams({ therapist: t.name, credentials: t.credentials });
  return `/mock-summary.html?${params}`;
}

export const SHARE_SUMMARY_SECTIONS: ShareSummarySection[] = [
  {
    id: "focus",
    title: "What you've been working on",
    body: "Work stress and setting boundaries with family. You've practiced grounding techniques in your recent conversations with Yuna.",
  },
  {
    id: "sessions",
    title: "Recent conversations",
    body: "A short recap of the past month: six conversations, mostly about workload, sleep, and one hard conversation you've been putting off.",
  },
  {
    id: "checkins",
    title: "Mood check-ins",
    body: "Your anxiety (GAD-7) and mood (PHQ-9) trends from the past three months.",
  },
  {
    id: "goals",
    title: "Your goals",
    body: "Two active goals: building a wind-down routine and speaking up in your weekly team meeting.",
  },
];
