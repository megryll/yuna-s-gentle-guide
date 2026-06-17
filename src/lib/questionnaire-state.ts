// In-memory questionnaire results, so a completed check-in carries across
// screens within a visit: Home folds the card under its "Completed Today"
// divider and the Progress check-in rows show their completed state.
// Deliberately not persisted — a hard refresh resets the prototype to the
// not-yet-completed state. Read on the client only (callers merge after mount
// so the server and first client render agree).

export type QuestionnaireResult = {
  completedAt: string; // ISO date
  priorities: string[]; // focus-area ids in priority order
  answers: Record<string, string | number>;
};

const results: Record<string, QuestionnaireResult> = {};

export function getQuestionnaireResult(id: string): QuestionnaireResult | null {
  return results[id] ?? null;
}

export function setQuestionnaireResult(id: string, result: QuestionnaireResult) {
  results[id] = result;
}

export function isQuestionnaireCompleted(id: string): boolean {
  return id in results;
}

export function getCompletedQuestionnaireIds(): string[] {
  return Object.keys(results);
}
