export type Bit = 0 | 1;
export type Answer = 'A' | 'B' | 'C';
export type Answers = Record<string, Answer>;
export type Question = {
  id: string;
  role: 'core1' | 'core2' | 'clarifier' | 'forced';
  situation: string;
  prompt: string;
  options: { code: Answer; value: Bit | null; text: string }[];
};
export type QuestionBank = {
  schemaVersion: number; language: string;
  axes: { id: number; key: string; questions: Question[] }[];
};

export function validateQuestionBank(input: unknown): QuestionBank {
  const bank = input as QuestionBank;
  const fail = () => { throw new Error('Банк вопросов повреждён: проверьте оси, номера, роли, тексты и варианты ответов.'); };
  if (!bank || bank.schemaVersion !== 2 || bank.language !== 'ru' || !Array.isArray(bank.axes) || bank.axes.length !== 6) return fail();
  const keys = ['taskScale', 'temperament', 'environment', 'approach', 'priority', 'expression'];
  for (const [i, axis] of bank.axes.entries()) {
    if (!axis || axis.id !== i + 1 || axis.key !== keys[i] || !Array.isArray(axis.questions) || axis.questions.length !== 4) return fail();
    for (const [j, q] of axis.questions.entries()) {
      if (!q || q.id !== `${i + 1}.${j + 1}` || q.role !== ['core1', 'core2', 'clarifier', 'forced'][j]
        || typeof q.prompt !== 'string' || !q.prompt.trim() || typeof q.situation !== 'string'
        || !Array.isArray(q.options) || q.options.length !== (j === 3 ? 2 : 3)) return fail();
      for (const [k, option] of q.options.entries()) {
        if (!option || option.code !== ['A', 'B', 'C'][k] || option.value !== [0, 1, null][k] || typeof option.text !== 'string' || !option.text.trim()) return fail();
      }
    }
  }
  return bank;
}

function value(q: Question, answers: Answers): Bit | null | undefined {
  return q.options.find(option => option.code === answers[q.id])?.value;
}

export function resolveAxis(axisId: number, answers: Answers, bank: QuestionBank): Bit | undefined {
  const axis = bank.axes.find(axis => axis.id === axisId);
  if (!axis) throw new Error('Неизвестная ось интервью.');
  const [first, second, clarifier, forced] = axis.questions;
  const a = value(first, answers), b = value(second, answers);
  if (a === undefined || b === undefined) return undefined;
  if (a !== null && a === b) return a;
  const c = value(clarifier, answers);
  if (c === undefined) return undefined;
  const votes = [a, b, c];
  for (const bit of [0, 1] as const) if (votes.filter(vote => vote === bit).length >= 2) return bit;
  return value(forced, answers) ?? undefined;
}

// Includes all core questions and the currently required additional questions.
// Each axis is independent: changing one axis preserves valid answers on others.
export function getRoute(answers: Answers, bank: QuestionBank): Question[] {
  const core = bank.axes.flatMap(axis => axis.questions.slice(0, 2));
  if (core.some(q => value(q, answers) === undefined)) return core;
  const route = [...core];
  for (const axis of bank.axes) {
    const [first, second, clarifier, forced] = axis.questions;
    const a = value(first, answers), b = value(second, answers);
    if (a !== null && a === b) continue;
    route.push(clarifier);
    if (value(clarifier, answers) === undefined) continue;
    // A direct answer must never make its own question disappear from the route.
    const votes = [a, b, value(clarifier, answers)];
    if ([0, 1].some(bit => votes.filter(vote => vote === bit).length >= 2)) continue;
    route.push(forced);
  }
  return route;
}

export function getNextQuestion(answers: Answers, bank: QuestionBank): Question | null {
  return getRoute(answers, bank).find(q => value(q, answers) === undefined) ?? null;
}

export function resolveProfile(answers: Answers, bank: QuestionBank): string | null {
  if (getNextQuestion(answers, bank)) return null;
  const bits = bank.axes.map(axis => resolveAxis(axis.id, answers, bank));
  return bits.some(bit => bit === undefined) ? null : bits.join('');
}

export function setAnswer(answers: Answers, id: string, answer: Answer, bank: QuestionBank): Answers {
  const current = getRoute(answers, bank).find(q => q.id === id);
  if (!current || !current.options.some(option => option.code === answer)) throw new Error('Недопустимый ответ или вопрос вне маршрута.');
  const updated = { ...answers, [id]: answer };
  const allowed = new Set(getRoute(updated, bank).map(q => q.id));
  return Object.fromEntries(Object.entries(updated).filter(([key]) => allowed.has(key)));
}
