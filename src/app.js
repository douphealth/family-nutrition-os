/**
 * ZENITH PRO · application shell
 * ---------------------------------------------------------------------------
 * Owns state, persistence, routing and the single delegated event dispatcher.
 * Views are pure functions (views.js); this file is the only place that
 * mutates anything.
 *
 * Persistence model: the whole dataset is a family's worth of records — small
 * enough to hold in memory — so it is loaded once at boot into `cache` and
 * every view renders synchronously from it. Writes update the cache and the
 * backing store together.
 */

import {
  APP, FAMILY, RECIPES, PLAN_28, TRAINING_LOADS, SLOTS, SLOT_LABEL, AISLES,
  PERSONA_FOCUS, IRON_RICH, LEGACY_MEMBER_NAMES
} from './data.js';
import {
  isMinor, targetsFor, dayMacros, planCoverage, mealMacros, weightTrend,
  loggingStreak, hydrationTarget, contextualGuidance, energyRange,
  personaPoints, trainingFueling, ironMeals, householdServings, upgradeMemberNames
} from './nutrition-engine.js';
import {
  get, put, all, del, clearAll, exportBackup, importBackup, migrateLog,
  storageInfo, requestPersistence, activeBackend
} from './storage.js';
import {
  esc, icon, logo, byId, $, $$, avatar,
  localDateKey, addDays, mondayOf, cycleDayIndex, cycleWeek, dateFromKey,
  num, num1, pct, mlToText, bytesToText, longDate, shortDate, GREEK_DAYS_SHORT,
  toast, openSheet, closeSheet, isSheetOpen, clockText
} from './ui.js';
import {
  todayView, planView, mealsView, shoppingView, progressView, familyView,
  guideView, recipeDetail, memberForm, dayDetail, paletteView, cookBody
} from './views.js';

/* ── Constants ─────────────────────────────────────────────────────────── */

const NAV = [
  ['today', 'Σήμερα', 'sun'],
  ['plan', 'Πλάνο', 'calendar'],
  ['meals', 'Γεύματα', 'utensils'],
  ['shopping', 'Αγορές', 'cart'],
  ['progress', 'Πρόοδος', 'chart'],
  ['family', 'Οικογένεια', 'users'],
  ['guide', 'Γνώση', 'book']
];
const PRIMARY_TABS = ['today', 'plan', 'meals', 'shopping', 'progress'];
const ACCENTS = ['#0E9F6E', '#2F6FED', '#D9457A', '#D98A16', '#7C5CD6', '#0E8F9F'];

/* ── State ─────────────────────────────────────────────────────────────── */

let state = {
  view: 'today',
  member: 'mother',
  theme: 'light',
  trainingLoad: 'normal',
  weekOffset: 0,
  onboarded: false,
  filters: { q: '', slot: '', tag: '', sort: 'slot' },
  shopFilter: 'all',
  shopChecked: {},
  version: APP.version
};

const cache = {
  profiles: structuredClone(FAMILY),
  logs: [],
  measurements: [],
  plans: [],
  checklists: []
};

let updateReady = false;
let paletteItems = [];
let paletteIndex = 0;

/* Cook Mode. Kept out of `state` because it is transient UI, not a preference:
 * it should never be persisted or restored. The timer is runtime-only too. */
let cook = { open: false, recipeId: null, step: 0, done: {} };
let cookTimer = { id: null, remaining: 0, total: 0, running: false };

/* ── Derived helpers ───────────────────────────────────────────────────── */

const recipeById = id => RECIPES.find(r => r.id === id) || null;
const currentProfile = () => cache.profiles.find(p => p.id === state.member) || cache.profiles[0];
/** Today's meals that are meaningful iron sources — used by the growth profile. */
const ironTodayFor = planDay => ironMeals(planDay, recipeById, IRON_RICH);
const currentLoad = p => (p?.athlete ? state.trainingLoad : 'normal');

function planForDate(date) {
  return PLAN_28[cycleDayIndex(dateFromKey(date)) - 1];
}

function emptyLog(memberId, date) {
  return { id: `${date}:${memberId}`, date, memberId, meals: {}, waterMl: 0, waterLog: [], extras: [], schema: 2 };
}

function logFor(memberId, date) {
  return cache.logs.find(l => l.memberId === memberId && l.date === date) || emptyLog(memberId, date);
}

function dayMacrosFor(planDay, profile, load, log) {
  return dayMacros(planDay, profile, load, log, recipeById);
}

function measurementsFor(memberId) {
  return cache.measurements
    .filter(m => m.memberId === memberId)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function loggedDateKeys(memberId) {
  return cache.logs
    .filter(l => l.memberId === memberId && Object.values(l.meals || {}).some(m => m?.status === 'done' || m?.status === 'skipped'))
    .map(l => l.date);
}

function heatCellsFor(memberId) {
  const start = addDays(mondayOf(), -21);
  const today = localDateKey();
  const out = [];
  for (let i = 0; i < 28; i++) {
    const date = addDays(start, i);
    const log = logFor(memberId, date);
    const meals = Object.values(log.meals || {}).filter(m => m?.status === 'done').length;
    const skipped = Object.values(log.meals || {}).filter(m => m?.status === 'skipped').length;
    out.push({ date, meals, skipped, logged: meals > 0 || skipped > 0 });
  }
  return out;
}

function weekDaysFor(offset) {
  const monday = addDays(mondayOf(), offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { date, dateObj: dateFromKey(date), plan: planForDate(date), recipeById };
  });
}

function buildShopping(weekDays) {
  const servings = householdServings(cache.profiles);
  const map = new Map();
  for (const day of weekDays) {
    for (const slot of SLOTS) {
      const r = recipeById(day.plan[slot]);
      if (!r) continue;
      for (const ing of r.ingredients) {
        const key = `${ing.a}::${ing.n}`;
        const cur = map.get(key) || { key, name: ing.n, aisle: ing.a, unit: ing.u, qty: 0, count: 0, perServing: ing.q };
        cur.qty += ing.q * servings;
        cur.count += 1;
        map.set(key, cur);
      }
    }
  }
  return [...map.values()]
    .map(i => ({ ...i, qty: roundQty(i.qty, i.unit) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'el'));
}

function roundQty(q, unit) {
  if (unit === 'τεμ') return Math.round(q);
  if (q >= 1000) return Math.round(q / 100) * 100;
  if (q >= 100) return Math.round(q / 10) * 10;
  if (q >= 20) return Math.round(q / 5) * 5;
  return Math.round(q);
}

/* ── Context for views ─────────────────────────────────────────────────── */

function buildCtx() {
  const profile = currentProfile();
  const load = currentLoad(profile);
  const dateKey = localDateKey();
  const planDay = planForDate(dateKey);
  const log = logFor(profile.id, dateKey);
  const targets = targetsFor(profile, load);
  const totals = dayMacrosFor(planDay, profile, load, log);
  const snackPool = RECIPES.filter(r => r.slot === 'snack');
  const coverage = planCoverage(profile, load, totals, targets, snackPool);
  const completeness = {
    mealsDone: Object.values(log.meals || {}).filter(m => m?.status === 'done').length,
    mealsTotal: SLOTS.filter(s => planDay[s]).length
  };
  const streak = loggingStreak(loggedDateKeys(profile.id), dateKey);
  const measurements = measurementsFor(profile.id);
  const trend = weightTrend(measurements);
  const weekDays = weekDaysFor(state.weekOffset);
  const shopList = buildShopping(weekDays);
  const shopChecked = state.shopChecked[shopKey(weekDays)] || {};

  return {
    state, profiles: cache.profiles, profile, load, loadLabel: TRAINING_LOADS.find(l => l[0] === load)?.[1] || 'Κανονική',
    dateKey, planDay, log, targets, totals, coverage, completeness, streak, updateReady,
    onboarded: state.onboarded, trainingLoads: TRAINING_LOADS, guidance: contextualGuidance({ profile, trainingLoad: load, today: log, plannedMeal: recipeById(planDay[SLOTS.find(s => log.meals?.[s]?.status !== 'done') || 'dinner']) }),
    recipeById, planForDate, logFor, dayMacrosFor, recipes: RECIPES, filters: state.filters,
    weekDays, weekOffset: state.weekOffset, shopList, shopChecked,
    shopFilter: state.shopFilter,
    shopMembers: cache.profiles.length,
    shopServings: householdServings(cache.profiles),
    shopStats: (() => {
      const checked = shopList.filter(i => shopChecked[i.key]).length;
      return {
        total: shopList.length, checked, remaining: shopList.length - checked,
        pct: shopList.length ? checked / shopList.length : 0
      };
    })(),
    measurements, trend, heatCells: heatCellsFor(profile.id),
    loggedDays: loggedDateKeys(profile.id).length,
    loggedDays28: heatCellsFor(profile.id).filter(c => c.logged).length,
    weekAdherence: weekDays.map(d => {
      const l = logFor(profile.id, d.date);
      return { date: d.date, meals: Object.values(l.meals || {}).filter(m => m?.status === 'done').length };
    }),
    coverageByMember: cache.profiles.map(p => {
      const l = p.athlete ? state.trainingLoad : 'normal';
      const t = targetsFor(p, l);
      const tot = dayMacrosFor(planDay, p, l, emptyLog(p.id, dateKey));
      const c = planCoverage(p, l, tot, t, snackPool);
      return { id: p.id, name: p.name, pct: c.pct, status: c.status, gap: c.gapKcal };
    }),
    targetsByMember: Object.fromEntries(cache.profiles.map(p => [p.id, targetsFor(p, p.athlete ? state.trainingLoad : 'normal')])),
    persona: personaPoints(profile, {
      trainingLoad: load,
      targets,
      totals,
      coverage,
      streak,
      ironToday: ironTodayFor(planDay),
      hydrationMl: Number(log?.waterMl) || 0,
      measurements: measurements.length
    }),
    personaFocus: PERSONA_FOCUS[profile.goal] || null,
    fueling: trainingFueling(profile, load),
    ironToday: ironTodayFor(planDay),
    cook,
    diagnostics: diagnosticsCache
  };
}

let diagnosticsCache = { backend: 'idb', persisted: false, usageText: '—', quotaText: '—', sw: '—', online: navigator.onLine };

const shopKey = weekDays => weekDays.length ? `w:${weekDays[0].date}` : 'w:none';

/* ── Shell rendering ───────────────────────────────────────────────────── */

function renderShell() {
  const profile = currentProfile();
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.setProperty('--accent', profile?.accent || '#0E9F6E');
  document.documentElement.style.setProperty('--accent-2', profile?.accent || '#0E9F6E');

  byId('brandMark').innerHTML = logo(38);
  byId('paletteBtn').innerHTML = icon('search', 18);
  byId('sideVer').innerHTML = `${icon('shield', 13)}<span>v${esc(APP.version)} · τοπικά δεδομένα</span>`;

  byId('sideNav').innerHTML = NAV.map(([id, label, ic]) =>
    `<button type="button" class="nav-btn ${state.view === id ? 'active' : ''}" data-act="nav" data-view="${id}" ${state.view === id ? 'aria-current="page"' : ''}>
      ${icon(ic, 18)}<span>${esc(label)}</span></button>`).join('');

  const strip = byId('memberStrip');
  strip.innerHTML = cache.profiles.map(p =>
    `<button type="button" class="member-chip ${p.id === state.member ? 'active' : ''}" data-act="member" data-id="${esc(p.id)}" aria-pressed="${p.id === state.member}">
      ${avatar(p, 30)}<span>${esc(p.name)}</span></button>`).join('');
  // On a phone the strip scrolls horizontally, so a member selected from the
  // command palette — or restored on load — can sit off-screen and the switcher
  // then looks like it belongs to someone else. Centre it, but only when the
  // strip is genuinely scrollable, so desktop never shifts.
  const activeChip = strip.querySelector('.member-chip.active');
  if (activeChip && strip.scrollWidth > strip.clientWidth) {
    strip.scrollLeft = activeChip.offsetLeft - (strip.clientWidth - activeChip.offsetWidth) / 2;
  }

  byId('tabbar').innerHTML = PRIMARY_TABS.map(id => {
    const entry = NAV.find(n => n[0] === id);
    return `<button type="button" class="tab-btn ${state.view === id ? 'active' : ''}" data-act="nav" data-view="${id}">
      ${icon(entry[2], 20)}<span>${esc(entry[1])}</span></button>`;
  }).join('') + `<button type="button" class="tab-btn" data-act="more">${icon('more', 20)}<span>Περισσότερα</span></button>`;

  byId('themeBtn').innerHTML = icon(state.theme === 'light' ? 'moon' : 'sun', 18);
  byId('themeBtn').setAttribute('aria-label', state.theme === 'light' ? 'Σκούρο θέμα' : 'Φωτεινό θέμα');
}

function render() {
  const view = byId('view');
  try {
    const ctx = buildCtx();
    let html;
    if (state.view === 'today') html = todayView(ctx);
    else if (state.view === 'plan') html = planView(ctx);
    else if (state.view === 'meals') html = mealsView(ctx);
    else if (state.view === 'shopping') html = shoppingView(ctx);
    else if (state.view === 'progress') html = progressView(ctx);
    else if (state.view === 'family') html = familyView(ctx);
    else if (state.view === 'guide') html = guideView(ctx);
    else html = todayView(ctx);

    view.innerHTML = html;
    view.classList.remove('view-enter');
    void view.offsetWidth;
    view.classList.add('view-enter');
    bindViewInputs();
  } catch (err) {
    console.error('[ZENITH] render failed', err);
    view.innerHTML = `<section class="notice notice-danger">${icon('alert', 18)}
      <span><b>Κάτι πήγε στραβά στην προβολή.</b> Τα δεδομένα σου είναι ασφαλή. Δοκίμασε να αλλάξεις προβολή ή να φορτώσεις ξανά.</span></section>`;
  }
}

function renderAll() { renderShell(); render(); }

/* ── View-local input bindings (not delegated) ─────────────────────────── */

function bindViewInputs() {
  const search = byId('recipeSearch');
  if (search) {
    search.addEventListener('input', debounce(() => {
      state.filters.q = search.value;
      const pos = search.selectionStart;
      render();
      const next = byId('recipeSearch');
      if (next) { next.focus(); next.setSelectionRange(pos, pos); }
    }, 220));
  }
  byId('recipeSort')?.addEventListener('change', e => { state.filters.sort = e.target.value; render(); });

  byId('measureForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const date = String(fd.get('date') || '');
    const weight = Number(fd.get('weight'));
    const note = String(fd.get('note') || '').trim().slice(0, 80);
    if (!date || !Number.isFinite(weight) || weight < 20 || weight > 300) { toast('Μη έγκυρη μέτρηση.', { tone: 'danger' }); return; }
    const profile = currentProfile();
    const record = { id: `${profile.id}:${date}`, memberId: profile.id, date, weight, note };
    await put('measurements', record);
    cache.measurements = cache.measurements.filter(m => m.id !== record.id).concat(record);
    profile.weight = weight;
    await persistProfiles();
    render();
    toast('Η μέτρηση αποθηκεύτηκε.', { actionLabel: 'Αναίρεση', onAction: async () => {
      await del('measurements', record.id);
      cache.measurements = cache.measurements.filter(m => m.id !== record.id);
      render(); toast('Η μέτρηση αφαιρέθηκε.');
    } });
  });
}

/** Sheet forms live outside #view, so they are bound on mount instead. */
function bindMemberForm() {
  const form = byId('memberForm');
  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';
  form.addEventListener('submit', submitMemberForm);
}

async function submitMemberForm(e) {
  e.preventDefault();
  const id = e.target.dataset.id;
  const profile = cache.profiles.find(p => p.id === id);
  if (!profile) return;
  const fd = new FormData(e.target);
  const age = Number(fd.get('age'));
  const height = Number(fd.get('height'));
  const weight = Number(fd.get('weight'));
  if (![age, height, weight].every(Number.isFinite)) { toast('Έλεγξε τα αριθμητικά πεδία.', { tone: 'danger' }); return; }
  profile.name = String(fd.get('name') || '').trim().slice(0, 24) || profile.name;
  profile.relation = String(fd.get('relation') || '').trim().slice(0, 16);
  profile.role = String(fd.get('role') || '').trim().slice(0, 60) || profile.role;
  profile.age = Math.round(age);
  profile.sex = fd.get('sex') === 'm' ? 'm' : 'f';
  profile.height = height;
  profile.weight = weight;
  profile.activityFactor = Number(fd.get('activityFactor')) || 1.4;
  profile.athlete = fd.get('athlete') === 'on';
  profile.accent = String(fd.get('accent') || profile.accent);
  profile.notes = String(fd.get('notes') || '').trim().slice(0, 90);
  // Minors can never hold a deficit goal — enforced here, not just disabled in the UI.
  if (isMinor(profile)) profile.goal = profile.athlete ? 'performance' : 'growth';
  else profile.goal = String(fd.get('goal') || 'maintain');

  await persistProfiles();
  closeSheet();
  renderAll();
  toast(`Το προφίλ «${profile.name}» ενημερώθηκε.`);
}

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* ── Persistence ───────────────────────────────────────────────────────── */

async function persistSettings() {
  try {
    await put('settings', {
      id: 'app', view: state.view, member: state.member, theme: state.theme,
      trainingLoad: state.trainingLoad, onboarded: state.onboarded,
      filters: state.filters, shopChecked: state.shopChecked,
      shopFilter: state.shopFilter, version: APP.version
    });
  } catch (err) { console.error('[ZENITH] settings save failed', err); }
}

async function persistProfiles() {
  for (const p of cache.profiles) {
    try { await put('profiles', p); } catch (err) { console.error('[ZENITH] profile save failed', err); }
  }
}

async function saveLog(log) {
  cache.logs = cache.logs.filter(l => l.id !== log.id).concat(log);
  try { await put('logs', log); } catch (err) { console.error('[ZENITH] log save failed', err); toast('Δεν αποθηκεύτηκε η καταγραφή.', { tone: 'danger' }); }
}

/* ── Boot ──────────────────────────────────────────────────────────────── */

async function boot() {
  byId('view').innerHTML = splash();
  try {
    const settings = await get('settings', 'app');
    if (settings) {
      state = { ...state, ...settings, filters: { ...state.filters, ...(settings.filters || {}) }, shopChecked: settings.shopChecked || {} };
    }
    const profiles = await all('profiles');
    if (profiles.length) cache.profiles = profiles;
    await applyMemberNameUpgrade();
    cache.logs = (await all('logs')).map(migrateLog);
    cache.measurements = await all('measurements');
    cache.plans = await all('plans');
    cache.checklists = await all('checklists');

    const requested = new URLSearchParams(location.search).get('view');
    if (NAV.some(n => n[0] === requested)) state.view = requested;
    if (!cache.profiles.some(p => p.id === state.member)) state.member = cache.profiles[0]?.id || 'mother';
    if (!NAV.some(n => n[0] === state.view)) state.view = 'today';
    if (state.theme !== 'dark' && state.theme !== 'light') state.theme = 'light';
    if (!TRAINING_LOADS.some(l => l[0] === state.trainingLoad)) state.trainingLoad = 'normal';

    renderAll();
    refreshDiagnostics();
  } catch (err) {
    console.error('[ZENITH] boot failed', err);
    byId('view').innerHTML = `<section class="notice notice-danger">${icon('alert', 18)}
      <span><b>Δεν ήταν δυνατή η φόρτωση των τοπικών δεδομένων.</b> Δοκίμασε επαναφόρτωση. Τα δεδομένα στη συσκευή δεν έχουν αλλάξει.</span></section>`;
  }
}

function splash() {
  return `<div class="splash">${logo(52)}<div><b>${esc(APP.name)}</b><br><span class="tiny">Φόρτωση τοπικών δεδομένων…</span></div></div>`;
}

/**
 * Applies the v4.1 member rename to the persisted profiles. The decision itself
 * lives in the engine (`upgradeMemberNames`) so it is unit-testable; this is only
 * the storage side-effect, and it is skipped entirely when nothing changed.
 */
async function applyMemberNameUpgrade() {
  const { profiles, changed } = upgradeMemberNames(cache.profiles, LEGACY_MEMBER_NAMES, FAMILY);
  if (!changed) return;
  cache.profiles = profiles;
  for (const p of cache.profiles) {
    try { await put('profiles', p); } catch (err) { console.error('[ZENITH] member rename save failed', err); }
  }
}

async function refreshDiagnostics() {
  const info = await storageInfo();
  diagnosticsCache = {
    backend: activeBackend() === 'local' ? 'local' : 'idb',
    persisted: info.persisted,
    usageText: bytesToText(info.usage),
    quotaText: bytesToText(info.quota),
    sw: 'serviceWorker' in navigator ? (navigator.serviceWorker.controller ? 'Ενεργό' : 'Σε αναμονή') : 'Μη διαθέσιμο',
    online: navigator.onLine
  };
}

/* ── Cook Mode ─────────────────────────────────────────────────────────── */

function openCook(recipeId) {
  const recipe = recipeById(recipeId);
  if (!recipe) return;
  cook = { open: true, recipeId, step: 0, done: {} };
  cookTimer = { id: null, remaining: 0, total: 0, running: false };
  renderCookSheet(true);
}

/** Re-render the cook sheet in place, or create it on first open. */
function renderCookSheet(create) {
  const recipe = recipeById(cook.recipeId);
  if (!recipe) return;
  const host = byId('sheet');
  const existing = host && !host.classList.contains('hidden') ? host.querySelector('.sheet-body') : null;
  if (create || !existing) {
    openSheet({
      title: `Μαγείρεμα · ${recipe.name}`,
      body: cookBody(buildCtx(), recipe),
      size: 'xl',
      onClose: () => { stopCookTimer(true); cook.open = false; }
    });
  } else {
    existing.innerHTML = cookBody(buildCtx(), recipe);
  }
}

function startCookTimer(seconds) {
  stopCookTimer(false);
  const secs = Math.max(1, Number(seconds) || 300);
  cookTimer.total = secs;
  cookTimer.remaining = secs;
  cookTimer.running = true;
  paintCookTimer();
  cookTimer.id = setInterval(() => {
    cookTimer.remaining = Math.max(0, cookTimer.remaining - 1);
    if (cookTimer.remaining === 0) {
      clearInterval(cookTimer.id);
      cookTimer.id = null;
      cookTimer.running = false;
      paintCookTimer();
      announceTimerDone();
      return;
    }
    paintCookTimer();
  }, 1000);
}

function stopCookTimer(reset) {
  if (cookTimer.id) { clearInterval(cookTimer.id); cookTimer.id = null; }
  cookTimer.running = false;
  if (reset) { cookTimer.remaining = 0; cookTimer.total = 0; }
}

function paintCookTimer() {
  const el = byId('cookTimerText');
  if (!el) return;
  el.textContent = clockText(cookTimer.remaining > 0 ? cookTimer.remaining : cookTimer.total);
  el.classList.toggle('is-running', cookTimer.running);
}

function announceTimerDone() {
  toast('Ο χρόνος τελείωσε.', { tone: 'accent' });
  try {
    if ('Notification' in window && window.Notification?.permission === 'granted') {
      new window.Notification('ZENITH PRO', { body: 'Ο χρόνος τελείωσε.' });
    }
  } catch { /* notifications unavailable */ }
  try { navigator.vibrate?.([220, 110, 220]); } catch { /* no haptics */ }
}

/* ── Action dispatcher ─────────────────────────────────────────────────── */

document.addEventListener('click', async e => {
  const target = e.target.closest('[data-act]');
  if (!target) return;
  const act = target.dataset.act;
  const profile = currentProfile();

  switch (act) {
    case 'nav': {
      state.view = target.dataset.view;
      state.weekOffset = 0;
      history.replaceState(null, '', `${location.pathname}?view=${state.view}`);
      await persistSettings();
      renderAll();
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* not supported in this webview */ }
      break;
    }
    case 'more': {
      openSheet({
        title: 'Περισσότερα',
        size: 'sm',
        body: `<div class="stack">
          <button type="button" class="palette-item" data-act="nav" data-view="family">${icon('users', 18)}<span>Οικογένεια & προφίλ</span></button>
          <button type="button" class="palette-item" data-act="nav" data-view="guide">${icon('book', 18)}<span>Μεθοδολογία & πηγές</span></button>
          <button type="button" class="palette-item" data-act="theme">${icon('moon', 18)}<span>Αλλαγή θέματος</span></button>
          <button type="button" class="palette-item" data-act="print">${icon('printer', 18)}<span>Εκτύπωση</span></button>
          <button type="button" class="palette-item" data-act="export">${icon('download', 18)}<span>Export δεδομένων</span></button>
          <button type="button" class="palette-item" data-act="import">${icon('upload', 18)}<span>Import δεδομένων</span></button>
        </div>`
      });
      break;
    }
    case 'member': {
      state.member = target.dataset.id;
      document.documentElement.style.setProperty('--accent', currentProfile()?.accent || '#0E9F6E');
      await persistSettings();
      renderAll();
      break;
    }
    case 'theme': {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = state.theme;
      await persistSettings();
      renderShell();
      break;
    }
    case 'load': {
      state.trainingLoad = target.dataset.load;
      await persistSettings();
      render();
      break;
    }
    case 'week': {
      state.weekOffset = target.dataset.reset ? 0 : state.weekOffset + Number(target.dataset.delta);
      state.weekOffset = Math.max(-4, Math.min(8, state.weekOffset));
      render();
      break;
    }
    case 'meal': {
      const date = target.dataset.date || localDateKey();
      const slot = target.dataset.slot;
      const portion = Number(target.dataset.portion) || 1;
      const log = logFor(profile.id, date);
      log.meals = { ...(log.meals || {}), [slot]: { status: 'done', portion, at: new Date().toISOString() } };
      await saveLog(log);
      render();
      toast(`Καταγράφηκε: ${SLOT_LABEL[slot]} ${portion}×`, {
        actionLabel: 'Αναίρεση',
        onAction: async () => {
          const l = logFor(profile.id, date);
          delete l.meals[slot];
          await saveLog(l);
          render();
          toast('Η καταγραφή αφαιρέθηκε.');
        }
      });
      break;
    }
    case 'skip': {
      const date = target.dataset.date || localDateKey();
      const slot = target.dataset.slot;
      const log = logFor(profile.id, date);
      const already = log.meals?.[slot]?.status === 'skipped';
      log.meals = { ...(log.meals || {}) };
      if (already) delete log.meals[slot];
      else log.meals[slot] = { status: 'skipped', at: new Date().toISOString() };
      await saveLog(log);
      render();
      toast(already ? 'Η παράλειψη αφαιρέθηκε.' : 'Καταγράφηκε παράλειψη.');
      break;
    }
    case 'water': {
      const date = localDateKey();
      const log = logFor(profile.id, date);
      const cur = Number(log.waterMl) || 0;
      const next = target.dataset.set != null ? Number(target.dataset.set) : Math.max(0, cur + Number(target.dataset.delta));
      log.waterMl = next;
      log.waterLog = Array.isArray(log.waterLog) ? log.waterLog : [];
      log.waterLog.push({ at: new Date().toISOString(), ml: next - cur });
      await saveLog(log);
      render();
      break;
    }
    case 'addExtra': {
      const date = localDateKey();
      const log = logFor(profile.id, date);
      log.extras = Array.isArray(log.extras) ? log.extras : [];
      log.extras.push({ id: `x${Date.now()}`, recipeId: target.dataset.recipe, portion: 1 });
      await saveLog(log);
      render();
      toast('Προστέθηκε στη σημερινή καταγραφή.');
      break;
    }
    case 'delExtra': {
      const log = logFor(profile.id, localDateKey());
      log.extras = (log.extras || []).filter(x => x.id !== target.dataset.id);
      await saveLog(log);
      render();
      break;
    }
    case 'clearExtras': {
      const log = logFor(profile.id, localDateKey());
      log.extras = [];
      await saveLog(log);
      render();
      break;
    }
    case 'recipe': {
      const r = recipeById(target.dataset.id);
      if (!r) break;
      openSheet({ title: r.name, size: 'lg', body: recipeDetail(buildCtx(), r) });
      break;
    }
    case 'cook': {
      openCook(target.dataset.id);
      break;
    }
    case 'cookStep': {
      const recipe = recipeById(cook.recipeId);
      if (!recipe) break;
      const requested = target.dataset.to != null
        ? Number(target.dataset.to)
        : cook.step + Number(target.dataset.delta || 0);
      const next = Math.max(0, Math.min(requested, recipe.steps.length - 1));
      if (next === cook.step) break;
      cook.step = next;
      stopCookTimer(true); // a new step means a new timer
      renderCookSheet(false);
      break;
    }
    case 'cookIng': {
      const i = Number(target.dataset.i);
      cook.done = { ...cook.done, [i]: !cook.done[i] };
      renderCookSheet(false);
      break;
    }
    case 'timerStart': {
      startCookTimer(target.dataset.sec);
      break;
    }
    case 'timerPause': {
      stopCookTimer(false);
      paintCookTimer();
      break;
    }
    case 'timerReset': {
      stopCookTimer(false);
      cookTimer.remaining = cookTimer.total;
      paintCookTimer();
      break;
    }
    case 'day': {
      openSheet({ title: 'Λεπτομέρειες ημέρας', size: 'md', body: dayDetail(buildCtx(), target.dataset.date) });
      break;
    }
    case 'shop': {
      const key = shopKey(weekDaysFor(state.weekOffset));
      const bag = { ...(state.shopChecked[key] || {}) };
      if (bag[target.dataset.key]) delete bag[target.dataset.key];
      else bag[target.dataset.key] = true;
      state.shopChecked = { ...state.shopChecked, [key]: bag };
      await persistSettings();
      render();
      break;
    }
    case 'shopReset': {
      const key = shopKey(weekDaysFor(state.weekOffset));
      state.shopChecked = { ...state.shopChecked, [key]: {} };
      await persistSettings();
      render();
      toast('Η λίστα καθαρίστηκε.');
      break;
    }
    case 'shopFilter': {
      state.shopFilter = target.dataset.value || 'all';
      await persistSettings();
      render();
      break;
    }
    case 'shopCopy': {
      const ctx = buildCtx();
      const onlyTodo = ctx.shopFilter === 'todo';
      const visible = ctx.shopList.filter(i => !onlyTodo || !ctx.shopChecked[i.key]);
      const lines = [];
      for (const aisle of AISLES) {
        const items = visible.filter(i => i.aisle === aisle.id);
        if (!items.length) continue;
        lines.push(`— ${aisle.label} —`);
        for (const i of items) lines.push(`• ${i.name}: ${num(i.qty)} ${i.unit}`);
        lines.push('');
      }
      const head = onlyTodo ? 'Λίστα αγορών · ό,τι απομένει' : 'Λίστα αγορών';
      const text = `ZENITH PRO · ${head} (${ctx.shopMembers} άτομα)\n\n${lines.join('\n')}`;
      try {
        await navigator.clipboard.writeText(text);
        toast(onlyTodo ? 'Αντιγράφηκαν τα υπόλοιπα είδη.' : 'Η λίστα αντιγράφηκε στο πρόχειρο.');
      } catch { toast('Δεν ήταν δυνατή η αντιγραφή.', { tone: 'danger' }); }
      break;
    }
    case 'filter': {
      const { key, value } = target.dataset;
      if (key === 'reset') state.filters = { q: '', slot: '', tag: '', sort: 'slot' };
      else state.filters = { ...state.filters, [key]: state.filters[key] === value ? '' : value };
      render();
      break;
    }
    case 'dismissOnboarding': {
      state.onboarded = true;
      await persistSettings();
      render();
      break;
    }
    case 'editMember': {
      const p = cache.profiles.find(x => x.id === target.dataset.id);
      if (!p) break;
      openSheet({
        title: `Επεξεργασία: ${p.name}`, size: 'lg',
        body: memberForm(buildCtx(), p),
        onMount: bindMemberForm,
        footer: `<button type="button" class="btn btn-ghost" data-act="closeSheet">Άκυρο</button>
                 <button type="submit" form="memberForm" class="btn btn-primary">${icon('check', 16)} Αποθήκευση</button>`
      });
      break;
    }
    case 'addMember': {
      const id = `m${Date.now()}`;
      const p = {
        id, name: 'Νέο μέλος', role: 'Συντήρηση & υγεία', sex: 'f', age: 30, height: 170, weight: 70,
        activityFactor: 1.4, goal: 'maintain', athlete: false,
        accent: ACCENTS[cache.profiles.length % ACCENTS.length], notes: ''
      };
      cache.profiles.push(p);
      await persistProfiles();
      openSheet({
        title: 'Νέο μέλος', size: 'lg',
        body: memberForm(buildCtx(), p),
        onMount: bindMemberForm,
        footer: `<button type="button" class="btn btn-ghost" data-act="closeSheet">Άκυρο</button>
                 <button type="submit" form="memberForm" class="btn btn-primary">${icon('check', 16)} Δημιουργία</button>`
      });
      break;
    }
    case 'delMember': {
      const p = cache.profiles.find(x => x.id === target.dataset.id);
      if (!p || cache.profiles.length <= 1) break;
      openSheet({
        title: `Διαγραφή «${p.name}»`, size: 'sm',
        body: `<div class="notice notice-danger">${icon('alert', 18)}<span>Θα διαγραφεί το προφίλ και <b>όλες οι καταγραφές και μετρήσεις</b> του μέλους. Δεν αναιρείται.</span></div>
               <p class="muted tiny" style="margin-top:12px">Κάνε export πρώτα αν δεν είσαι σίγουρος/η.</p>`,
        footer: `<button type="button" class="btn btn-ghost" data-act="closeSheet">Άκυρο</button>
                 <button type="button" class="btn btn-danger" data-act="confirmDelMember" data-id="${esc(p.id)}">${icon('trash', 16)} Διαγραφή</button>`
      });
      break;
    }
    case 'confirmDelMember': {
      const id = target.dataset.id;
      for (const l of cache.logs.filter(l => l.memberId === id)) { await del('logs', l.id); }
      for (const m of cache.measurements.filter(m => m.memberId === id)) { await del('measurements', m.id); }
      await del('profiles', id);
      cache.logs = cache.logs.filter(l => l.memberId !== id);
      cache.measurements = cache.measurements.filter(m => m.memberId !== id);
      cache.profiles = cache.profiles.filter(p => p.id !== id);
      if (state.member === id) state.member = cache.profiles[0].id;
      await persistSettings();
      closeSheet();
      renderAll();
      toast('Το μέλος διαγράφηκε.');
      break;
    }
    case 'delMeasure': {
      const id = target.dataset.id;
      await del('measurements', id);
      cache.measurements = cache.measurements.filter(m => m.id !== id);
      render();
      toast('Η μέτρηση διαγράφηκε.');
      break;
    }
    case 'export': {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `zenith-backup-${localDateKey()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast('Το backup κατέβηκε.');
      break;
    }
    case 'import': byId('backupImport').click(); break;
    case 'persist': {
      const ok = await requestPersistence();
      await refreshDiagnostics();
      render();
      toast(ok ? 'Η μόνιμη αποθήκευση ενεργοποιήθηκε.' : 'Ο περιηγητής δεν παραχώρησε μόνιμη αποθήκευση.', { tone: ok ? 'default' : 'danger' });
      break;
    }
    case 'wipe': {
      openSheet({
        title: 'Διαγραφή όλων των δεδομένων', size: 'sm',
        body: `<div class="notice notice-danger">${icon('alert', 18)}<span><b>⚠️ Μη αναστρέψιμη ενέργεια.</b> Θα διαγραφούν προφίλ, καταγραφές και μετρήσεις από αυτή τη συσκευή.</span></div>
               <p class="muted tiny" style="margin-top:12px">Αν δεν έχεις κάνει export, δεν θα μπορείς να τα ανακτήσεις.</p>`,
        footer: `<button type="button" class="btn btn-ghost" data-act="closeSheet">Άκυρο</button>
                 <button type="button" class="btn btn-danger" data-act="confirmWipe">${icon('trash', 16)} Διαγραφή όλων</button>`
      });
      break;
    }
    case 'confirmWipe': {
      await clearAll();
      closeSheet();
      toast('Τα δεδομένα διαγράφηκαν. Επαναφόρτωση…');
      setTimeout(() => location.reload(), 900);
      break;
    }
    case 'print': window.print(); break;
    case 'closeSheet': closeSheet(); break;
    case 'reload': location.reload(); break;
    case 'palette': openPalette(); break;
    case 'palettePick': {
      const item = paletteItems[Number(target.dataset.index)];
      closePalette();
      item?.run?.();
      break;
    }
    default: break;
  }
});

/* ── Command palette ───────────────────────────────────────────────────── */

function paletteCommands() {
  const cmds = NAV.map(([id, label, ic]) => ({
    label: `Μετάβαση: ${label}`, icon: ic, hint: `G ${id[0].toUpperCase()}`,
    run: () => { state.view = id; state.weekOffset = 0; persistSettings(); renderAll(); }
  }));
  cmds.push(
    { label: 'Κατέγραψε το επόμενο γεύμα', icon: 'check', run: () => {
        const p = currentProfile(); const date = localDateKey(); const plan = planForDate(date);
        const log = logFor(p.id, date);
        const slot = SLOTS.find(s => log.meals?.[s]?.status !== 'done') || 'dinner';
        log.meals = { ...(log.meals || {}), [slot]: { status: 'done', portion: 1, at: new Date().toISOString() } };
        saveLog(log).then(() => { render(); toast(`Καταγράφηκε: ${SLOT_LABEL[slot]}`); });
      } },
    { label: 'Πρόσθεσε 250 ml νερό', icon: 'droplet', run: () => {
        const p = currentProfile(); const date = localDateKey(); const log = logFor(p.id, date);
        log.waterMl = (Number(log.waterMl) || 0) + 250;
        saveLog(log).then(() => { render(); toast('+250 ml'); });
      } },
    { label: 'Άνοιξε τη λίστα αγορών', icon: 'cart', run: () => { state.view = 'shopping'; renderAll(); } },
    { label: 'Εκτύπωσε', icon: 'printer', run: () => window.print() },
    { label: 'Εναλλαγή θέματος', icon: 'moon', run: () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = state.theme; persistSettings(); renderShell(); } },
    { label: 'Export δεδομένων', icon: 'download', run: () => document.querySelector('[data-act="export"]')?.click() }
  );
  for (const p of cache.profiles) {
    cmds.push({ label: `Μέλος: ${p.name}`, icon: 'users', run: () => { state.member = p.id; persistSettings(); renderAll(); } });
  }
  for (const r of RECIPES) {
    cmds.push({ label: `Συνταγή: ${r.name}`, icon: 'utensils', run: () => openSheet({ title: r.name, size: 'lg', body: recipeDetail(buildCtx(), r) }) });
  }
  return cmds;
}

function openPalette() {
  const host = byId('palette');
  host.innerHTML = `<div class="palette-panel">
    <div class="palette-input">${icon('search', 18)}<input id="paletteInput" type="text" placeholder="Γράψε εντολή, μέλος ή συνταγή…" aria-label="Αναζήτηση εντολών"></div>
    <div id="paletteList"></div>
  </div>`;
  host.classList.remove('hidden');
  const input = byId('paletteInput');
  const all2 = paletteCommands();
  paletteIndex = 0;
  const update = () => {
    const q = input.value.trim().toLowerCase();
    paletteItems = q ? all2.filter(c => c.label.toLowerCase().includes(q)).slice(0, 40) : all2.slice(0, 12);
    paletteIndex = 0;
    byId('paletteList').innerHTML = paletteView(paletteItems, input.value);
  };
  update();
  input.addEventListener('input', update);
  input.addEventListener('keydown', e => {
    const nodes = $$('.palette-item', byId('paletteList'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      paletteIndex = Math.max(0, Math.min(nodes.length - 1, paletteIndex + (e.key === 'ArrowDown' ? 1 : -1)));
      nodes.forEach((n, i) => n.classList.toggle('active', i === paletteIndex));
      nodes[paletteIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = paletteItems[paletteIndex];
      closePalette();
      item?.run?.();
    }
  });
  input.focus();
  host.onclick = e => { if (e.target === host) closePalette(); };
}

function closePalette() {
  const host = byId('palette');
  if (!host) return;
  host.classList.add('hidden');
  host.innerHTML = '';
  host.onclick = null;
}

/* ── Global keyboard ───────────────────────────────────────────────────── */

document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    isSheetOpen() ? closeSheet() : openPalette();
    return;
  }
  if (e.key === 'Escape') { closePalette(); return; }
  if (typing) return;
  if (e.key >= '1' && e.key <= '7') {
    const entry = NAV[Number(e.key) - 1];
    if (entry) { state.view = entry[0]; state.weekOffset = 0; persistSettings(); renderAll(); }
  }
  if (e.key === 't' || e.key === 'T') {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = state.theme;
    persistSettings(); renderShell();
  }
});

/* ── Import file input ─────────────────────────────────────────────────── */

byId('backupImport')?.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await importBackup(JSON.parse(await file.text()));
    toast('Η επαναφορά ολοκληρώθηκε. Επαναφόρτωση…');
    setTimeout(() => location.reload(), 800);
  } catch (err) {
    console.error('[ZENITH] import failed', err);
    toast('Μη έγκυρο backup — δεν άλλαξε τίποτα.', { tone: 'danger', duration: 6000 });
  } finally {
    e.target.value = '';
  }
});

/* ── Error boundary ────────────────────────────────────────────────────── */

window.addEventListener('error', e => console.error('[ZENITH] uncaught', e.error || e.message));
window.addEventListener('unhandledrejection', e => console.error('[ZENITH] unhandled rejection', e.reason));

/* ── Service worker ────────────────────────────────────────────────────── */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then(reg => {
    reg.update().catch(() => {});
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          updateReady = true;
          if (state.view === 'today') render();
        }
      });
    });
  }).catch(err => console.error('[ZENITH] sw registration failed', err));
}

/* ── Go ────────────────────────────────────────────────────────────────── */

boot();
