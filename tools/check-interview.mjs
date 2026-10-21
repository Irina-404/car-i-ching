import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const bank = JSON.parse(readFileSync('data/questions.json', 'utf8'));
const descriptions = JSON.parse(readFileSync('data/descriptions.json', 'utf8'));
const url = process.argv[2] || process.env.TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const next = () => page.getByRole('button', { name: 'Далее', exact: true });
const back = () => page.getByRole('button', { name: 'Назад', exact: true });
const choice = code => page.locator('.interview-choice').nth(['A', 'B', 'C'].indexOf(code));
async function start() {
  await page.goto(url);
  assert.equal(await page.locator('.prototype-bar, .palette-picker, .screen-picker').count(), 0);
  await page.getByRole('button', { name: 'Начать игру', exact: true }).click();
  await page.locator('.interview-choice').first().waitFor();
}
async function question(id) {
  const [axis, ordinal] = id.split('.').map(Number);
  const q = bank.axes[axis - 1].questions[ordinal - 1];
  const expected = q.role === 'forced' ? q.prompt : q.prompt.slice(q.situation.length).trim();
  await page.getByRole('heading', { name: expected, exact: true }).waitFor();
  assert.equal(await page.locator('.interview-choice').count(), q.options.length);
  assert.equal(await page.locator('.interview-hint').count(), q.role === 'forced' ? 0 : 1);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${id}`);
}
async function answer(id, code) {
  await question(id);
  await choice(code).click();
  await next().click();
}
async function result(bits) {
  const code = `${bits.slice(0, 3)}-${bits.slice(3)}`;
  await page.getByRole('heading', { name: descriptions.results[code].personTitle, exact: true }).waitFor();
  await page.locator('.result-photo').evaluate(img => img.decode());
  await page.getByRole('button', { name: 'Открыть описание гексаграммы' }).click();
  await page.getByRole('dialog').waitFor();
  const traits = await page.locator('.hex-trait').evaluateAll(rows => rows.map(row => ({ axis: row.dataset.axis, bit: row.dataset.bit })));
  assert.deepEqual(traits, [...bits].reverse().map((bit, i) => ({ axis: String(6 - i), bit })));
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog').count(), 0);
}

try {
  await start();
  assert.ok(await next().isDisabled());
  await choice('A').click();
  await next().dblclick();
  await question('1.2'); // a double click must not skip question 2
  await back().click();
  assert.equal(await choice('A').getAttribute('aria-pressed'), 'true');
  await back().click();
  await page.getByRole('alertdialog').waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Остаться');
  await page.keyboard.press('Escape');
  assert.equal(await choice('A').getAttribute('aria-pressed'), 'true');
  await back().click();
  await page.getByRole('button', { name: 'Выйти', exact: true }).click();
  await page.getByRole('button', { name: 'Начать игру', exact: true }).click();
  assert.ok(await next().isDisabled());
  console.log('PASS: clean start, double click, back/selection, exit confirmation/cancel/reset.');

  for (let axis = 1; axis <= 6; axis++) for (let ordinal = 1; ordinal <= 2; ordinal++) await answer(`${axis}.${ordinal}`, 'A');
  await result('000000');
  await page.getByRole('button', { name: 'Вернуться на главную', exact: false }).click();
  await page.getByRole('button', { name: 'Начать игру', exact: true }).click();
  assert.ok(await next().isDisabled());
  console.log('PASS: 12-question route to computed 000-000 result and new game.');

  await start();
  for (let axis = 1; axis <= 6; axis++) for (let ordinal = 1; ordinal <= 2; ordinal++) await answer(`${axis}.${ordinal}`, 'C');
  assert.equal(await page.locator('.interview-count').count(), 0);
  let extra = 0;
  for (let axis = 1; axis <= 6; axis++) {
    await question(`${axis}.3`);
    assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), String(++extra));
    await answer(`${axis}.3`, 'C');
    await question(`${axis}.4`);
    assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), String(++extra));
    await answer(`${axis}.4`, 'B');
  }
  await result('111111');
  console.log('PASS: maximum 24 questions, combined clarification progress, forced questions, computed 111-111 result.');

  await start();
  for (let axis = 1; axis <= 6; axis++) for (let ordinal = 1; ordinal <= 2; ordinal++) await answer(`${axis}.${ordinal}`, axis === 1 ? 'C' : 'A');
  await answer('1.3', 'C');
  await question('1.4');
  await choice('B').click();
  await back().click();
  await back().click(); // core question 12
  for (let i = 0; i < 10; i++) await back().click(); // core question 2
  await question('1.2'); await choice('A').click();
  await back().click(); await question('1.1'); await choice('A').click();
  await next().click(); await question('1.2'); await choice('C').click();
  for (let n = 2; n <= 12; n++) await next().click();
  await question('1.3'); assert.ok(await next().isDisabled());
  await answer('1.3', 'C');
  await question('1.4'); assert.ok(await next().isDisabled());
  await choice('B').click(); await back().click();
  await question('1.3'); await choice('C').click(); // same answer preserves needed direct answer
  await next().click(); assert.equal(await choice('B').getAttribute('aria-pressed'), 'true');
  await back().click(); await choice('A').click(); // core A/C + clarifier A excludes direct
  await choice('C').click(); // direct returns, but its old answer must be gone
  await next().click(); await question('1.4'); assert.ok(await next().isDisabled());
  await back().click(); await choice('A').click(); await next().click();
  await result('000000');
  console.log('PASS: changing early answers removes obsolete clarifier/direct answers; reintroduced questions have no selection.');

  // Failure and retry without losing a completed interview.
  await start();
  let fail = true;
  await page.route('**/data/placements.json', route => fail ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.continue());
  for (let axis = 1; axis <= 6; axis++) for (let ordinal = 1; ordinal <= 2; ordinal++) await answer(`${axis}.${ordinal}`, 'B');
  await page.getByRole('heading', { name: 'Карточка не загрузилась' }).waitFor();
  fail = false;
  await page.getByRole('button', { name: 'Попробовать ещё раз' }).click();
  await result('111111');
  await page.unroute('**/data/placements.json');
  await page.route('**/data/questions.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"axes":[]}' }));
  await page.goto(url);
  await page.getByRole('button', { name: 'Начать игру', exact: true }).click();
  await page.getByRole('heading', { name: 'Вопросы не загрузились' }).waitFor();
  await page.unroute('**/data/questions.json');
  await page.getByRole('button', { name: 'Попробовать ещё раз' }).click();
  await question('1.1');
  console.log('PASS: catalog request failure/retry and invalid question bank/retry.');

  // All 24 actual questions at mobile and desktop sizes through the normal route.
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 }); await start();
    for (let axis = 1; axis <= 6; axis++) for (let ordinal = 1; ordinal <= 2; ordinal++) await answer(`${axis}.${ordinal}`, 'C');
    for (let axis = 1; axis <= 6; axis++) { await answer(`${axis}.3`, 'C'); await answer(`${axis}.4`, 'A'); }
    await result('000000');
  }
  mkdirSync('artifacts', { recursive: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({ path: 'artifacts/m2-result-360.png', fullPage: true });
  await start();
  await page.screenshot({ path: 'artifacts/m2-question-360.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: all 24 questions at 320/360/390/768/1440px; no horizontal overflow or browser exceptions.');
} finally {
  await browser.close();
}
