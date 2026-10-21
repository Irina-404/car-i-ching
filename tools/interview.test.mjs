import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validateQuestionBank, resolveAxis, resolveProfile, getRoute, getNextQuestion, setAnswer } from '../src/interview.ts';
import { validateCatalog, lookupCar } from '../src/catalog.ts';

const json = name => JSON.parse(readFileSync(`data/${name}.json`, 'utf8'));
const bank = validateQuestionBank(json('questions'));
const catalogData = Object.fromEntries(['structure', 'placements', 'vehicles', 'photos', 'descriptions'].map(name => [name, json(name)]));
const catalog = validateCatalog(catalogData);
const coreAnswers = (answer = 'A') => Object.fromEntries(bank.axes.flatMap(axis => axis.questions.slice(0, 2).map(q => [q.id, answer])));

test('bank rejects missing axes, duplicated IDs, roles, empty text, wrong votes and direct neutral options', () => {
  for (const mutate of [
    b => b.axes.pop(), b => b.axes[0].questions[1].id = '1.1',
    b => b.axes[0].questions[2].role = 'core1', b => b.axes[0].questions[0].prompt = '',
    b => b.axes[1].questions[0].options[0].value = 1,
    b => b.axes[0].questions[3].options.push({ code: 'C', value: null, text: 'N' }),
  ]) {
    const copy = structuredClone(bank); mutate(copy);
    assert.throws(() => validateQuestionBank(copy));
  }
});

test('all vote combinations on all six axes, including neutral and final override', () => {
  const bit = { A: 0, B: 1, C: null };
  for (let axis = 1; axis <= 6; axis++) for (const a of ['A', 'B', 'C']) for (const b of ['A', 'B', 'C']) {
    const base = { [`${axis}.1`]: a, [`${axis}.2`]: b };
    const initial = a === b && a !== 'C' ? bit[a] : undefined;
    assert.equal(resolveAxis(axis, base, bank), initial);
    for (const c of ['A', 'B', 'C']) for (const direct of ['A', 'B']) {
      const votes = [a, b, c];
      const majority = votes.filter(v => v === 'A').length >= 2 ? 0 : votes.filter(v => v === 'B').length >= 2 ? 1 : undefined;
      const expected = initial ?? majority;
      const three = { ...base, [`${axis}.3`]: c };
      assert.equal(resolveAxis(axis, three, bank), expected);
      assert.equal(resolveAxis(axis, { ...three, [`${axis}.4`]: direct }, bank), expected ?? bit[direct]);
    }
  }
});

test('all 64 profiles, unique catalog mappings, real text/photo/preference links and repeatability', () => {
  const vehicles = new Set();
  for (let i = 0; i < 64; i++) {
    const bits = i.toString(2).padStart(6, '0');
    let answers = {};
    for (let n = 0; n < 12; n++) {
      const q = getNextQuestion(answers, bank);
      assert.equal(q.id, `${Math.floor(n / 2) + 1}.${n % 2 + 1}`);
      answers = setAnswer(answers, q.id, bits[Math.floor(n / 2)] === '0' ? 'A' : 'B', bank);
    }
    assert.equal(getNextQuestion(answers, bank), null);
    assert.equal(resolveProfile(answers, bank), bits);
    assert.equal(resolveProfile({ ...answers }, bank), bits);
    const result = lookupCar(bits, catalog);
    const placement = catalogData.placements.cells[result.code];
    assert.equal(result.carName, catalogData.vehicles.items[placement.vehicleId].name);
    assert.equal(result.personTitle, catalogData.descriptions.results[result.code].personTitle);
    assert.equal(result.photo, catalogData.photos.items[placement.photoId].full);
    assert.ok(existsSync(result.photo));
    const wording = [...catalogData.descriptions.axisWording.row, ...catalogData.descriptions.axisWording.column];
    assert.deepEqual(result.preferences, [...bits].map((bit, axis) => wording[axis][Number(bit)]));
    vehicles.add(placement.vehicleId);
  }
  assert.equal(vehicles.size, 64);
});

test('every length 12–24 is reachable; core first, each clarifier immediately followed by its direct question if necessary', () => {
  for (let extra = 0; extra <= 12; extra++) {
    let answers = coreAnswers();
    for (let axis = 1; axis <= Math.ceil(extra / 2); axis++) answers[`${axis}.2`] = 'C';
    const seen = [];
    let q;
    while ((q = getNextQuestion(answers, bank))) {
      seen.push(q.id);
      answers = setAnswer(answers, q.id, q.role === 'forced' ? 'B' : seen.length <= Math.floor(extra / 2) * 2 ? 'C' : 'A', bank);
    }
    const expected = [];
    for (let axis = 1; axis <= Math.ceil(extra / 2); axis++) {
      expected.push(`${axis}.3`);
      if (axis <= Math.floor(extra / 2)) expected.push(`${axis}.4`);
    }
    assert.deepEqual(seen, expected);
    assert.equal(getRoute(answers, bank).length, 12 + extra);
    assert.match(resolveProfile(answers, bank), /^[01]{6}$/);
  }
});

test('excluding and reintroducing a clarifier/direct question deletes its answer permanently; independent axes retain valid answers', () => {
  let answers = coreAnswers('C');
  for (let axis = 1; axis <= 6; axis++) {
    answers = setAnswer(answers, `${axis}.3`, 'C', bank);
    answers = setAnswer(answers, `${axis}.4`, 'B', bank);
  }
  const original = { ...answers };
  answers = setAnswer(answers, '1.1', 'A', bank);
  answers = setAnswer(answers, '1.2', 'A', bank);
  assert.equal(answers['1.3'], undefined);
  assert.equal(answers['1.4'], undefined);
  assert.equal(original['1.3'], 'C'); // no mutation of caller state
  for (let axis = 2; axis <= 6; axis++) assert.equal(answers[`${axis}.4`], 'B');
  answers = setAnswer(answers, '1.2', 'C', bank);
  assert.equal(getNextQuestion(answers, bank).id, '1.3');
  assert.equal(resolveProfile(answers, bank), null);
  answers = setAnswer(answers, '1.3', 'C', bank);
  assert.equal(getNextQuestion(answers, bank).id, '1.4');
  assert.equal(answers['1.4'], undefined);
  answers = setAnswer(answers, '1.4', 'B', bank);
  answers = setAnswer(answers, '1.3', 'A', bank);
  assert.equal(answers['1.4'], undefined);
  assert.equal(resolveProfile(answers, bank), '011111');
  answers = setAnswer(answers, '1.3', 'C', bank);
  assert.equal(getNextQuestion(answers, bank).id, '1.4');
  assert.equal(answers['1.4'], undefined);
  assert.throws(() => setAnswer(answers, '1.4', 'C', bank));
});

test('deterministic random sessions always end within 12–24 questions, with no repeated questions or unresolved axes', () => {
  let seed = 37;
  const random = n => { seed = (1664525 * seed + 1013904223) >>> 0; return seed % n; };
  for (let run = 0; run < 1000; run++) {
    let answers = {}; const seen = [];
    let q;
    while ((q = getNextQuestion(answers, bank))) {
      assert.ok(seen.length < 24);
      assert.ok(!seen.includes(q.id)); seen.push(q.id);
      answers = setAnswer(answers, q.id, q.options[random(q.options.length)].code, bank);
    }
    assert.ok(seen.length >= 12);
    assert.match(resolveProfile(answers, bank), /^[01]{6}$/);
    assert.ok(lookupCar(resolveProfile(answers, bank), catalog));
  }
});

test('catalog rejects absent records, duplicate placements, wrong axis order, bad photo paths and empty descriptions', () => {
  for (const mutate of [
    d => delete d.placements.cells['000-000'],
    d => d.placements.cells['000-000'].vehicleId = d.placements.cells['111-111'].vehicleId,
    d => d.structure.axes.row.reverse(),
    d => d.photos.items[d.placements.cells['000-000'].photoId].full = 'https://example.com/photo.webp',
    d => d.descriptions.results['000-000'].personPortrait = '',
  ]) {
    const copy = structuredClone(catalogData); mutate(copy);
    assert.throws(() => validateCatalog(copy));
  }
  assert.throws(() => lookupCar('000-000', catalog));
});
