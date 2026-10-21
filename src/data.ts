import { validateQuestionBank } from './interview';
import { lookupCar, validateCatalog } from './catalog';

async function readJson(name: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`, { signal });
  if (!response.ok) throw new Error(`Не удалось загрузить ${name}.json. Проверь подключение и попробуй ещё раз.`);
  return response.json();
}

export async function loadQuestionBank(signal: AbortSignal) {
  return validateQuestionBank(await readJson('questions', signal));
}

export async function loadResult(bits: string, signal: AbortSignal) {
  const names = ['structure', 'placements', 'vehicles', 'descriptions', 'photos'];
  const entries = await Promise.all(names.map(async name => [name, await readJson(name, signal)]));
  const result = lookupCar(bits, validateCatalog(Object.fromEntries(entries)));
  return { ...result, photo: `${import.meta.env.BASE_URL}${result.photo}` };
}
