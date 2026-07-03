import { SKILLS } from "./skills-data";
import { LIBRARY } from "./progress-data";

// The unified task feed behind the You tab's tiles (Skills, Questionnaires,
// Meditations, Goals, Days of Gratitude), shown on the All Tasks screen. Skills
// and questionnaires derive from their existing data so the lists stay in sync;
// the rest are authored here. `to` deep-links a task into its feature screen.

export type TaskType = "skill" | "questionnaire" | "meditation" | "goal" | "gratitude";

export type Task = {
  id: string;
  type: TaskType;
  title: string;
  completed: boolean;
  naturePath: string;
  to?: string;
  params?: Record<string, string>;
};

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  skill: "Skills",
  questionnaire: "Questionnaires",
  meditation: "Meditations",
  goal: "Goals",
  gratitude: "Gratitude",
};

// Filter-chip and section order on the All Tasks screen.
export const TASK_TYPES: TaskType[] = ["skill", "questionnaire", "meditation", "goal", "gratitude"];

const skillTasks: Task[] = SKILLS.map((s) => ({
  id: `skill-${s.id}`,
  type: "skill",
  title: s.name,
  completed: s.completed,
  naturePath: s.naturePath,
  ...(s.hasArticle ? { to: "/skill/$id", params: { id: s.id } } : {}),
}));

const Q_BGS = [
  "/nature/Background-1.png",
  "/nature/Background-6.png",
  "/nature/Background-11.png",
  "/nature/Background-16.png",
  "/nature/Background-19.png",
  "/nature/Background-3.png",
  "/nature/Background-8.png",
];

const questionnaireTasks: Task[] = LIBRARY.map((m, i) => ({
  id: `q-${m.id}`,
  type: "questionnaire",
  title: m.domain,
  completed: m.taken > 0,
  naturePath: Q_BGS[i % Q_BGS.length],
  ...(m.taken > 0 && m.assessmentId ? { to: "/assessment/$id", params: { id: m.assessmentId } } : {}),
}));

const meditationTasks: Task[] = [
  { id: "med-evening", type: "meditation", title: "Evening wind-down", completed: true, naturePath: "/nature/Background-6.png", to: "/meditation" },
  { id: "med-morning", type: "meditation", title: "Morning reset", completed: true, naturePath: "/nature/Background-11.png", to: "/meditation" },
  { id: "med-racing", type: "meditation", title: "Breath for a racing mind", completed: false, naturePath: "/nature/Background-15.png", to: "/meditation" },
  { id: "med-bodyscan", type: "meditation", title: "Body scan before sleep", completed: false, naturePath: "/nature/Background-17.png", to: "/meditation" },
];

const goalTasks: Task[] = [
  { id: "goal-book", type: "goal", title: "Read one book this month", completed: true, naturePath: "/nature/Background-2.png", to: "/goals" },
  { id: "goal-agenda", type: "goal", title: "Prepare a daily agenda each morning", completed: false, naturePath: "/nature/Background-8.png", to: "/goals" },
  { id: "goal-cartwheel", type: "goal", title: "Learn how to do a cartwheel", completed: false, naturePath: "/nature/Background-13.png", to: "/goals" },
];

const gratitudeTasks: Task[] = [
  { id: "grat-today", type: "gratitude", title: "Today's gratitude entry", completed: false, naturePath: "/nature/Background-3.png", to: "/gratitude" },
  { id: "grat-jun9", type: "gratitude", title: "Gratitude · Jun 9", completed: true, naturePath: "/nature/Background-18.png", to: "/gratitude" },
  { id: "grat-jun7", type: "gratitude", title: "Gratitude · Jun 7", completed: true, naturePath: "/nature/Background-1.png", to: "/gratitude" },
];

export const TASKS: Task[] = [
  ...skillTasks,
  ...questionnaireTasks,
  ...meditationTasks,
  ...goalTasks,
  ...gratitudeTasks,
];
