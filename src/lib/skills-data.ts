// The coping skills Yuna teaches, shown on the "Your Skills" library screen as
// compact content-card rows split into completed (learned) and to-do tabs.
// `hasArticle` skills deep-link into their /skill/$id read; the rest are
// display-only placeholders until their article exists.

export type SkillItem = {
  /** Matches /skill/$id when `hasArticle` is set. */
  id: string;
  name: string;
  /** Short therapy-model eyebrow, e.g. "Distress Tolerance". */
  category: string;
  completed: boolean;
  naturePath: string;
  hasArticle?: boolean;
};

export const SKILLS: SkillItem[] = [
  { id: "please-technique", name: "The PLEASE Skill", category: "Emotion Regulation", completed: true, naturePath: "/nature/Background-4.png", hasArticle: true },
  { id: "stop-technique", name: "The STOP Skill", category: "Distress Tolerance", completed: true, naturePath: "/nature/Background-10.png", hasArticle: true },
  { id: "grounding-54321", name: "5-4-3-2-1 Grounding", category: "Anxiety", completed: true, naturePath: "/nature/Background-14.png" },
  { id: "box-breathing", name: "Box Breathing", category: "Calming the Body", completed: true, naturePath: "/nature/Background-7.png" },
  { id: "opposite-action", name: "Opposite Action", category: "Emotion Regulation", completed: false, naturePath: "/nature/Background-2.png" },
  { id: "tipp", name: "The TIPP Skill", category: "Distress Tolerance", completed: false, naturePath: "/nature/Background-9.png" },
  { id: "radical-acceptance", name: "Radical Acceptance", category: "Acceptance", completed: true, naturePath: "/nature/Background-12.png" },
  { id: "cognitive-reframe", name: "Cognitive Reframing", category: "Thinking Patterns", completed: true, naturePath: "/nature/Background-5.png" },
];
