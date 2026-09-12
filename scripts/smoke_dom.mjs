/**
 * ZENITH PRO · DOM smoke test
 * ---------------------------------------------------------------------------
 * Boots the real index.html in jsdom, imports the real app module, and drives
 * the real UI through every view and every primary interaction.
 *
 * Usage:
 *   node scripts/smoke_dom.mjs           # localStorage fallback path
 *   node scripts/smoke_dom.mjs --idb     # IndexedDB primary path (fake-indexeddb)
 *
 * Requires jsdom (and fake-indexeddb for --idb) to be resolvable. Exits
 * non-zero on the first failed assertion.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const useIdb = process.argv.includes('--idb');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ── Test-only dependency resolution ───────────────────────────────────── */

/**
 * Resolve a test-only dependency. Tries the normal resolution first (CI installs
 * devDependencies), then falls back to ZENITH_TEST_MODULES for sandboxed runs
 * where node_modules lives outside the project.
 */
async function loadDep(name) {
  const bases = [path.join(root, 'noop.js')];
  if (process.env.ZENITH_TEST_MODULES) bases.push(path.join(process.env.ZENITH_TEST_MODULES, 'noop.js'));
  for (const base of bases) {
    try {
      const resolved = createRequire(base).resolve(name);
      return await import(pathToFileURL(resolved).href);
    } catch { /* try the next base */ }
  }
  throw new Error(
    `Cannot resolve "${name}". Run \`npm install\` in the project, or set ` +
    `ZENITH_TEST_MODULES to a directory whose node_modules contains it.`
  );
}

if (useIdb) {
  const { indexedDB, IDBKeyRange } = await loadDep('fake-indexeddb');
  globalThis.indexedDB = indexedDB;
  globalThis.IDBKeyRange = IDBKeyRange;
}

const { JSDOM } = await loadDep('jsdom');

/* ── Boot the real document ────────────────────────────────────────────── */

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dom = new JSDOM(html, {
  url: 'https://example.test/?view=today',
  pretendToBeVisual: true
});
const { window } = dom;

// Wire jsdom's DOM into Node's global scope so the app module can use it.
const GLOBALS = [
  'window', 'document', 'location', 'history', 'localStorage', 'sessionStorage',
  'HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'Event', 'CustomEvent',
  'MouseEvent', 'KeyboardEvent', 'FormData', 'File', 'FileReader', 'Blob',
  'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  'matchMedia', 'Notification', 'CSS', 'DOMParser', 'MutationObserver'
];

for (const key of GLOBALS) {
  const value = key === 'window' ? window : window[key];
  if (value === undefined) continue;
  try {
    globalThis[key] = value;
  } catch {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
}

// `navigator` is a read-only getter in modern Node — override carefully.
try {
  Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true, writable: true });
} catch { /* keep Node's own navigator */ }

// jsdom does not implement these; the app calls them defensively.
window.scrollTo = () => {};
window.Element.prototype.scrollIntoView = () => {};
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}
  });
}

// The app registers a service worker only when `'serviceWorker' in navigator`.
// jsdom does not implement it, so the block is skipped naturally — but if a
// future jsdom adds a stub, make sure it is fully absent rather than undefined.
if (window.navigator.serviceWorker === undefined) {
  try { delete window.navigator.serviceWorker; } catch { /* not configurable */ }
}

/* ── Console capture ───────────────────────────────────────────────────── */

const consoleErrors = [];
const originalError = console.error;
console.error = (...args) => {
  consoleErrors.push(args.map(a => (a && a.stack) || String(a)).join(' '));
  originalError(...args);
};

/* ── Assertion helpers ─────────────────────────────────────────────────── */

let failures = 0;
let checks = 0;

function ok(condition, label) {
  checks++;
  if (condition) return true;
  failures++;
  originalError(`  ✗ ${label}`);
  return false;
}

function section(title) {
  process.stdout.write(`\n── ${title} ──\n`);
}

const tick = (ms = 40) => new Promise(resolve => setTimeout(resolve, ms));

/** Dispatch a real bubbling click and let the async dispatcher settle. */
async function click(el, ms = 40) {
  if (!el) return false;
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  await tick(ms);
  return true;
}

/** Click the first element matching a selector (optionally scoped). */
async function clickSel(selector, scopedRoot = window.document, ms = 40) {
  return click(scopedRoot.querySelector(selector), ms);
}

const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
const viewEl = () => window.document.getElementById('view');
const viewText = () => text(viewEl());
/**
 * A render error notice, specifically. Note that `.notice-danger` is also used
 * for legitimate warnings (e.g. the "delete all data" warning in the guide
 * view), so match on the error copy rather than the class alone.
 */
const hasRenderError = () => /Κάτι πήγε στραβά|Δεν ήταν δυνατή η φόρτωση/.test(viewText());

/* ── Import the application ────────────────────────────────────────────── */

const appUrl = pathToFileURL(path.join(root, 'src/app.js')).href;
await import(appUrl);
await tick(400); // let boot() finish its async storage reads

const storage = await import(pathToFileURL(path.join(root, 'src/storage.js')).href);

/** Read a whole object store from whichever backend the app actually chose. */
async function readStore(store) {
  return storage.all(store);
}

section(`ZENITH PRO DOM smoke · backend = ${useIdb ? 'IndexedDB' : 'localStorage fallback'}`);

/* ── 1. Boot ───────────────────────────────────────────────────────────── */

section('Boot');
ok(viewText().length > 40, 'view renders content on boot');
ok(!viewText().includes('Φόρτωση τοπικών δεδομένων'), 'splash has been replaced');
ok(!hasRenderError(), 'no error notice on boot');
ok(window.document.documentElement.getAttribute('data-theme') !== null
  || window.document.documentElement.dataset.theme !== undefined,
  'theme attribute is set on <html>');

/* ── 2. Shell: navigation, member strip, tab bar ───────────────────────── */

section('Shell');

const sideNavButtons = window.document.querySelectorAll('#sideNav [data-act="nav"]');
ok(sideNavButtons.length === 7, `sidebar exposes 7 views (found ${sideNavButtons.length})`);

const tabButtons = window.document.querySelectorAll('#tabbar [data-act="nav"]');
ok(tabButtons.length >= 5, `tab bar exposes >=5 tabs (found ${tabButtons.length})`);

const memberButtons = window.document.querySelectorAll('#memberStrip [data-act="member"]');
ok(memberButtons.length === 4, `member strip exposes 4 family members (found ${memberButtons.length})`);

ok(!!window.document.getElementById('themeBtn'), 'theme button exists');
ok(!!window.document.getElementById('paletteBtn'), 'palette button exists');

/* ── 3. Every view renders ─────────────────────────────────────────────── */

section('Views');

const VIEWS = ['today', 'plan', 'meals', 'shopping', 'progress', 'family', 'guide'];

for (const id of VIEWS) {
  await clickSel(`#sideNav [data-act="nav"][data-view="${id}"]`, window.document, 60);
  const len = viewText().length;
  ok(len > 200, `view "${id}" renders substantial content (${len} chars)`);
  ok(!hasRenderError(), `view "${id}" renders without an error notice`);
  ok(window.location.search.includes(`view=${id}`), `view "${id}" is reflected in the URL`);
}

/* ── 4. Theme toggle ───────────────────────────────────────────────────── */

section('Theme');

await clickSel('#sideNav [data-act="nav"][data-view="today"]');
const themeBefore = window.document.documentElement.dataset.theme;
await clickSel('#themeBtn', window.document, 80);
const themeAfter = window.document.documentElement.dataset.theme;
ok(themeBefore !== themeAfter, `theme toggles (${themeBefore} -> ${themeAfter})`);
await clickSel('#themeBtn', window.document, 80);
ok(window.document.documentElement.dataset.theme === themeBefore, 'theme toggles back');

const settingsRow = (await readStore('settings')).find(r => r.id === 'app');
ok(!!settingsRow, 'settings row is persisted after theme toggle');
ok(settingsRow?.theme === themeBefore, 'persisted theme matches the DOM');

/* ── 5. Member switching ───────────────────────────────────────────────── */

section('Member switching');

const secondMember = window.document.querySelectorAll('#memberStrip [data-act="member"]')[1];
const secondId = secondMember?.dataset.id;
await click(secondMember, 80);
const afterSwitch = (await readStore('settings')).find(r => r.id === 'app');
ok(afterSwitch?.member === secondId, `switching member persists selection (${secondId})`);
ok(!hasRenderError(), 'member switch re-renders cleanly');
ok(viewText().length > 200, 'view still renders after member switch');

// back to the first member
await click(window.document.querySelectorAll('#memberStrip [data-act="member"]')[0], 80);

/* ── 6. Meal logging + portion scaling ─────────────────────────────────── */

section('Meal logging');

await clickSel('#sideNav [data-act="nav"][data-view="today"]', window.document, 80);

const mealBtn = window.document.querySelector('[data-act="meal"][data-portion]');
ok(!!mealBtn, 'today view offers a meal confirmation button');

if (mealBtn) {
  const slot = mealBtn.dataset.slot;
  const portion = Number(mealBtn.dataset.portion) || 1;
  await click(mealBtn, 120);

  const logs = await readStore('logs');
  ok(logs.length >= 1, 'logging a meal writes a log record');

  const entry = logs[0];
  ok(!!entry?.meals?.[slot], `log contains the confirmed slot "${slot}"`);
  ok(entry?.meals?.[slot]?.status === 'done', 'confirmed slot is marked done');
  ok(Math.abs((entry?.meals?.[slot]?.portion ?? 0) - portion) < 1e-9,
    `confirmed portion is preserved (${portion})`);
  ok(!!window.document.getElementById('toast')?.textContent?.trim(), 'a toast is shown after logging');
}

/* ── 7. Water logging ──────────────────────────────────────────────────── */

section('Water');

const waterBtn = window.document.querySelector('[data-act="water"][data-delta="250"], [data-act="water"][data-set]');
ok(!!waterBtn, 'today view offers a water control');

if (waterBtn) {
  await click(waterBtn, 120);
  const logs = await readStore('logs');
  const total = logs.reduce((sum, l) => sum + (Number(l.waterMl) || 0), 0);
  ok(total > 0, `water logging records intake (${total} ml)`);
  ok(logs.some(l => Array.isArray(l.waterLog) && l.waterLog.length > 0),
    'water log keeps an audit trail of individual entries');
}

/* ── 8. Plan / week navigation ─────────────────────────────────────────── */

section('Plan');

await clickSel('#sideNav [data-act="nav"][data-view="plan"]', window.document, 80);
const planBefore = viewText();

await clickSel('[data-act="week"][data-delta="1"]', window.document, 80);
const planAfter = viewText();
ok(planBefore !== planAfter, 'advancing a week changes the plan view');

const todayCardsAfterNav = viewEl().querySelectorAll('.day-card.is-today').length;
ok(todayCardsAfterNav === 0, 'no "today" card is highlighted while viewing a future week');

await clickSel('[data-act="week"][data-reset="1"]', window.document, 80);
ok(viewEl().querySelectorAll('.day-card.is-today').length >= 1, 'reset returns to the current week with today marked');

/* ── 9. Recipe detail sheet ────────────────────────────────────────────── */

section('Recipe sheet');

await clickSel('#sideNav [data-act="nav"][data-view="meals"]', window.document, 80);
const recipeBtn = window.document.querySelector('[data-act="recipe"][data-id]');
ok(!!recipeBtn, 'meals view exposes a recipe button');

if (recipeBtn) {
  await click(recipeBtn, 120);
  const sheet = window.document.getElementById('sheet');
  ok(sheet?.classList.contains('is-open') || sheet?.getAttribute('aria-hidden') === 'false' || text(sheet).length > 0,
    'clicking a recipe opens the sheet');
  ok(text(sheet).length > 100, 'recipe sheet renders recipe content');
  ok(text(sheet).includes('Υλικά') || text(sheet).includes('Εκτέλεση') || text(sheet).includes('g'),
    'recipe sheet shows ingredients or steps');

  const closeBtn = sheet.querySelector('[data-act="closeSheet"]');
  await click(closeBtn, 80);
  ok(!(sheet?.classList.contains('is-open')), 'sheet closes again');
}

/* ── 10. Shopping check-off persists ───────────────────────────────────── */

section('Shopping');

await clickSel('#sideNav [data-act="nav"][data-view="shopping"]', window.document, 80);
const shopBtn = window.document.querySelector('[data-act="shop"][data-key]');
ok(!!shopBtn, 'shopping view exposes checkable items');

if (shopBtn) {
  const key = shopBtn.dataset.key;
  await click(shopBtn, 120);
  const settings = (await readStore('settings')).find(r => r.id === 'app');
  // shopChecked is nested one level deeper: { [weekKey]: { [itemKey]: {...} } }
  const bags = Object.values(settings?.shopChecked || {});
  ok(bags.some(bag => bag && bag[key]), `checked shopping item "${key}" is persisted in settings`);
}

// Filter chips: Όλα / Απομένουν / Στο καλάθι
// Each click re-renders the view, so chips must be re-queried every time.
const chip = value => [...window.document.querySelectorAll('[data-act="shopFilter"]')]
  .find(c => c.dataset.value === value);

ok(window.document.querySelectorAll('[data-act="shopFilter"]').length === 3,
  'shopping view exposes three filter chips');

const shopItemCount = () => window.document.querySelectorAll('[data-act="shop"][data-key]').length;
const allCount = shopItemCount();

if (chip('todo') && chip('all') && chip('done')) {
  await click(chip('todo'), 90);
  const todoCount = shopItemCount();
  ok(todoCount < allCount, `"Απομένουν" hides the checked items (${todoCount} < ${allCount})`);
  ok(chip('todo')?.classList.contains('is-on'), 'active chip is marked');

  await click(chip('done'), 90);
  const doneCount = shopItemCount();
  ok(doneCount >= 1 && doneCount < allCount, `"Στο καλάθι" shows only checked items (${doneCount})`);

  await click(chip('all'), 90);
  ok(shopItemCount() === allCount, '"Όλα" restores the full list');
}

// Per-aisle counters
const aisleCounts = [...window.document.querySelectorAll('.shop-aisle-count')];
ok(aisleCounts.length > 0, 'each aisle shows a done/total counter');

// Transparency block: the "why these quantities" disclosure must exist and must
// state the household share, so the shopping maths is auditable by the user.
const why = window.document.querySelector('.why');
ok(!!why, 'shopping view explains how quantities are derived');
ok(/μερίδες/.test(text(why)), 'the explanation mentions the household serving share');
ok(!/BMI/.test(text(why)), 'the shopping explanation never surfaces adult BMI');

// The copy is truthful: the shopping maths uses per-member portion shares, so the
// explanation must name the reference-serving model and the real member count.
ok(/μερίδες αναφοράς/.test(text(why)), 'the explanation names the reference-serving model');
ok(/4 μέλη/.test(text(why)), 'the explanation states the real member count');

/* ── 11. Command palette ───────────────────────────────────────────────── */

section('Command palette');

await clickSel('#paletteBtn', window.document, 100);
const palette = window.document.getElementById('palette');
ok(palette?.classList.contains('is-open') || text(palette).length > 0, 'palette opens');
const firstPick = palette?.querySelector('[data-act="palettePick"], [data-act="nav"]');
if (firstPick) {
  await click(firstPick, 100);
  ok(viewText().length > 200, 'picking from the palette navigates and renders');
}

/* ── 12. Member edit form (the sheet-bound form) ───────────────────────── */

section('Member form (sheet-bound)');

await clickSel('#sideNav [data-act="nav"][data-view="family"]', window.document, 80);
const editBtn = window.document.querySelector('[data-act="editMember"]');
ok(!!editBtn, 'family view exposes an edit-member button');

if (editBtn) {
  await click(editBtn, 150);
  const form = window.document.getElementById('memberForm');
  ok(!!form, 'edit-member opens a form inside the sheet');

  if (form) {
    const id = form.dataset.id;
    const nameInput = form.querySelector('[name="name"]');
    const relInput = form.querySelector('[name="relation"]');
    // Remember the real values: this test renames a real family member, so it
    // must put everything back before later sections assert on the names.
    const originalName = nameInput?.value || '';
    const originalRelation = relInput?.value || '';
    const newName = 'Δοκιμή Σμόουκ';

    ok(!!relInput, 'the member form exposes the family relation field');

    if (nameInput) {
      nameInput.value = newName;
      if (relInput) relInput.value = 'Δοκιμή';
      form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
      await tick(250);

      const profiles = await readStore('profiles');
      const saved = profiles.find(p => p.id === id);
      ok(!!saved, 'submitting the member form persists a profile record');
      ok(saved?.name === newName, `edited name is saved (got "${saved?.name}")`);
      ok(saved?.relation === 'Δοκιμή', `edited relation is saved (got "${saved?.relation}")`);
      ok(!window.document.getElementById('sheet')?.classList.contains('is-open'), 'sheet closes after submit');

      // ── Restore the member's real name and relation ──
      await clickSel('#sideNav [data-act="nav"][data-view="family"]', window.document, 90);
      const editAgain = window.document.querySelector(`[data-act="editMember"][data-id="${id}"]`);
      if (editAgain) {
        await click(editAgain, 150);
        const f2 = window.document.getElementById('memberForm');
        const n2 = f2?.querySelector('[name="name"]');
        const r2 = f2?.querySelector('[name="relation"]');
        if (n2) {
          n2.value = originalName;
          if (r2) r2.value = originalRelation;
          f2.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
          await tick(250);
        }
      }
      const restored = (await readStore('profiles')).find(p => p.id === id);
      ok(restored?.name === originalName, `member name restored to "${originalName}" after the edit test`);
    }
  }
}

/* ── 13. Persona brief for every member ────────────────────────────────── */

section('Persona brief');

await clickSel('#sideNav [data-act="nav"][data-view="today"]', window.document, 90);

const memberIds = [...window.document.querySelectorAll('#memberStrip [data-act="member"]')].map(b => b.dataset.id);
let personaSeen = 0;
for (const id of memberIds) {
  await click(window.document.querySelector(`#memberStrip [data-act="member"][data-id="${id}"]`), 110);
  const card = window.document.querySelector('.persona');
  if (card && text(card).length > 80) personaSeen++;
}
ok(memberIds.length === 4, `four members are switchable (found ${memberIds.length})`);
ok(personaSeen === memberIds.length, `persona brief renders for all ${memberIds.length} members (got ${personaSeen})`);

/* The household is named after real people, and the placeholder labels must be
 * gone from the UI entirely — including after the stored-profile upgrade. */
const stripText = text(window.document.getElementById('memberStrip'));
for (const name of ['Αναστασία', 'Αλέξης', 'Αλεξάνδρα', 'Δημήτρης']) {
  ok(stripText.includes(name), `member strip shows "${name}"`);
}
ok(!/Μητέρα|Πατέρας|Κόρη|Γιος/.test(stripText),
  'no placeholder labels remain in the member strip');

/* The fuelling protocol is athlete-only — that is the whole point of it. */
await click(window.document.querySelector('#memberStrip [data-act="member"][data-id="son"]'), 130);
ok(!!window.document.querySelector('.fuel'), 'the athlete profile shows a fuelling protocol');
ok(/πρωτεΐνη/i.test(text(window.document.querySelector('.fuel'))), 'fuelling protocol states a protein target');

await click(window.document.querySelector('#memberStrip [data-act="member"][data-id="mother"]'), 130);
ok(!window.document.querySelector('.fuel'), 'a non-athlete profile shows no fuelling protocol');
ok(!!window.document.querySelector('.persona'), 'the mother still gets a persona brief');

/* The growth profile must state the minor protection on screen, not just in code. */
await click(window.document.querySelector('#memberStrip [data-act="member"][data-id="daughter"]'), 130);
const daughterCard = window.document.querySelector('.persona');
ok(/σίδηρ/i.test(text(daughterCard)), 'the growth profile surfaces iron');
ok(/έλλειμμα/i.test(text(daughterCard)), 'the growth profile states that no deficit is applied');

/* ── 14. Cook Mode ─────────────────────────────────────────────────────── */

section('Cook Mode');

await clickSel('#sideNav [data-act="nav"][data-view="today"]', window.document, 90);
const cookBtn = window.document.querySelector('[data-act="cook"]');
ok(!!cookBtn, 'today view offers a cook button');

if (cookBtn) {
  await click(cookBtn, 180);
  const sheet = window.document.getElementById('sheet');
  const isOpen = () => sheet && !sheet.classList.contains('hidden');

  ok(isOpen(), 'cook mode opens in the sheet');
  ok(!!sheet.querySelector('.cook'), 'cook mode renders its own layout');
  ok(!!sheet.querySelector('.cook-step'), 'cook mode shows the current step');

  const counterBefore = text(sheet.querySelector('.cook-counter'));
  ok(/Βήμα\s*1/.test(counterBefore), `cook mode starts on step 1 (got "${counterBefore}")`);

  await click(sheet.querySelector('[data-act="cookStep"][data-to="1"]'), 150);
  ok(text(sheet.querySelector('.cook-counter')) !== counterBefore, 'advancing moves to the next step');

  await click(sheet.querySelector('[data-act="cookStep"][data-to="0"]'), 150);
  ok(text(sheet.querySelector('.cook-counter')) === counterBefore, 'going back returns to step 1');

  const ing = sheet.querySelector('[data-act="cookIng"]');
  ok(!!ing, 'cook mode lists ingredients to check off');
  if (ing) {
    const wasDone = ing.classList.contains('is-done');
    await click(ing, 140);
    const after = window.document.querySelector('[data-act="cookIng"]');
    ok(after.classList.contains('is-done') !== wasDone, 'tapping an ingredient toggles it');
  }

  const timerStart = sheet.querySelector('[data-act="timerStart"]');
  if (timerStart) {
    await click(timerStart, 80);
    const timerText = window.document.getElementById('cookTimerText');
    ok(!!timerText && /^\d{2}:\d{2}$/.test(text(timerText)), `timer renders as mm:ss (got "${text(timerText)}")`);
    await click(window.document.querySelector('[data-act="timerPause"]'), 60);
    ok(!!window.document.getElementById('cookTimerText'), 'pausing keeps the timer visible');
    await click(window.document.querySelector('[data-act="timerReset"]'), 60);
  } else {
    ok(true, 'this recipe has no timed step (nothing to assert)');
  }

  ok(!!sheet.querySelector('.cook-portions'), 'cook mode lists per-member portions');
  ok(sheet.querySelectorAll('.cook-portions li').length === 4, 'all four members are plated in cook mode');

  await click(sheet.querySelector('[data-act="closeSheet"]'), 150);
  ok(!isOpen(), 'cook mode closes');
}

/* ── 15. Minor safety guardrail survives the UI ────────────────────────── */

section('Minor safety');

const profiles = await readStore('profiles');
if (profiles.length) {
  const minors = profiles.filter(p => Number(p.age) < 20);
  ok(minors.length >= 1, `at least one minor profile is present (${minors.length})`);
  ok(minors.every(p => p.goal !== 'loss' && p.goal !== 'deficit'),
    'no minor profile holds a fat-loss/deficit goal');
  ok(minors.every(p => p.goal !== 'adult-bmi' && p.goal !== 'bmi'), 'no minor profile holds an adult BMI goal');
} else {
  ok(false, 'profiles are readable from the active backend');
}

/* ── 16. Backup export ─────────────────────────────────────────────────── */

section('Backup export');

const backup = await storage.exportBackup();
ok(!!backup && typeof backup === 'object', 'exportBackup returns an object');
ok(backup.schema === storage.BACKUP_SCHEMA, `backup carries the current schema (${backup.schema})`);
ok(!!backup.data && typeof backup.data === 'object', 'backup nests records under .data');
ok(Array.isArray(backup.data?.logs), 'backup contains a logs array');
ok(Array.isArray(backup.data?.profiles), 'backup contains a profiles array');
for (const store of storage.STORES) {
  ok(Array.isArray(backup.data?.[store]), `backup covers the "${store}" store`);
}
// A round-trip through the validator must not throw.
try {
  await storage.importBackup(backup);
  ok(true, 'exported backup re-imports cleanly (round-trip)');
} catch (err) {
  ok(false, `exported backup re-imports cleanly (${err.message})`);
}

/* ── 17. No console errors anywhere ────────────────────────────────────── */

section('Console');

const realErrors = consoleErrors.filter(line =>
  !/Not implemented: window\.scrollTo/.test(line) &&
  !/Not implemented: HTMLCanvasElement/.test(line)
);
ok(realErrors.length === 0,
  `no console errors (${realErrors.length})` + (realErrors.length ? `\n     ${realErrors.slice(0, 5).join('\n     ')}` : ''));

/* ── Summary ───────────────────────────────────────────────────────────── */

process.stdout.write(`\n${checks - failures}/${checks} checks passed\n`);
if (failures > 0) {
  process.stdout.write(`SMOKE TEST: FAIL (${failures} failures)\n`);
  process.exit(1);
}
process.stdout.write('SMOKE TEST: PASS\n');
process.exit(0);
