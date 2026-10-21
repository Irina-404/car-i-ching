import { readFileSync, writeFileSync } from 'node:fs';

// Extract the approved wording, including the original split for the UI.
export function extractQuestions(spec) {
  const section = spec.split('## 5. Утверждённый банк вопросов')[1].split('## 6.')[0];
  const keys = ['taskScale', 'temperament', 'environment', 'approach', 'priority', 'expression'];
  const axes = keys.map((key, index) => ({ id: index + 1, key, questions: [] }));
  const blocks = [...section.matchAll(/\*\*(\d)\.(\d) — (?:основной|уточняющий|прямой)\.\*\* ([^\r\n]+)\r?\n([\s\S]*?)(?=\r?\n\*\*\d|\r?\n###|$)/g)];
  for (const [, axis, ordinal, wording, optionsText] of blocks) {
    const emphasis = wording.indexOf('**');
    const situation = wording.slice(0, emphasis).trim();
    const prompt = wording.slice(emphasis).replaceAll('**', '').trim();
    const options = [...optionsText.matchAll(/^- \*\*([АБВ])\.\*\* (.+)$/gm)].map(([, code, text], index) => ({
      code: ['A', 'B', 'C'][index], value: [0, 1, null][index], text: text.trim(),
    }));
    axes[Number(axis) - 1].questions.push({
      id: `${axis}.${ordinal}`, role: ['core1', 'core2', 'clarifier', 'forced'][Number(ordinal) - 1], situation, prompt, options,
    });
  }
  if (blocks.length !== 24) throw new Error('Expected 24 approved questions');
  return { schemaVersion: 2, language: 'ru', axes };
}

const expected = JSON.stringify(extractQuestions(readFileSync('automotive_book_of_changes_spec.md', 'utf8')), null, 2) + '\n';
if (process.argv.includes('--write')) writeFileSync('data/questions.json', expected);
else if (JSON.stringify(JSON.parse(readFileSync('data/questions.json', 'utf8'))) !== JSON.stringify(JSON.parse(expected))) throw new Error('Question bank differs from specification; JSON may contain newer editorial changes. Do not use --write unless replacing them is intended.');
console.log('All 24 questions match the approved specification.');
