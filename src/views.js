/**
 * ZENITH PRO · views
 * ---------------------------------------------------------------------------
 * Pure render functions. They take a context object built by app.js and return
 * HTML strings. They never touch storage or state directly — every interaction
 * is expressed as a `data-act` attribute that app.js dispatches on. That keeps
 * this file free of side effects and free of import cycles.
 */

import {
  esc, icon, ring, macroBar, stat, pill, sectionHead, emptyState,
  lineChart, heatmap, barChart, avatar, logo,
  num, num1, pct, mlToText, longDate, shortDate, dayName, greeting, timeNow,
  GREEK_DAYS_SHORT, cycleWeek
} from './ui.js';
import { SLOTS, SLOT_LABEL, SLOT_TIME, AISLES, SOURCES, METHOD, SAFETY, GLOSSARY, APP } from './data.js';
import { mealMacros, planCoverage, canUseAdultBmi, bmi, adultBmiLabel, isMinor } from './nutrition-engine.js';

/* ── Small shared pieces ───────────────────────────────────────────────── */

function slotTag(slot) {
  return `<span class="recipe-slot ${slot}">${icon(slotIcon(slot), 12)}${esc(SLOT_LABEL[slot])}</span>`;
}
function slotIcon(slot) {
  return { breakfast: 'sun', lunch: 'utensils', snack: 'leaf', dinner: 'moon' }[slot] || 'utensils';
}

function macroChips(m, { compact = false } = {}) {
  return `<div class="meal-macros">
    <span class="meal-macro kcal">${icon('flame', 12)}<b>${num(m.kcal)}</b> kcal</span>
    <span class="meal-macro">P <b>${num(m.p)}</b>g</span>
    <span class="meal-macro">C <b>${num(m.c)}</b>g</span>
    <span class="meal-macro">F <b>${num(m.f)}</b>g</span>
    ${compact ? '' : `<span class="meal-macro">${esc(SLOT_LABEL[m.slot] || '')}</span>`}
  </div>`;
}

function portionButtons(slot, entry, recipeId) {
  const done = entry?.status === 'done';
  const p = entry?.portion;
  const btn = (val, label) => `<button type="button" class="chip ${done && p === val ? 'active' : ''}"
    data-act="meal" data-slot="${slot}" data-portion="${val}" data-recipe="${esc(recipeId)}"
    aria-pressed="${done && p === val}">${label}</button>`;
  return `<div class="meal-actions">
    ${btn(0.75, 'Μικρότερη')}
    ${btn(1, done && p === 1 ? '✓ Έγινε' : 'Όπως το πλάνο')}
    ${btn(1.25, 'Μεγαλύτερη')}
    <button type="button" class="chip" data-act="skip" data-slot="${slot}" data-recipe="${esc(recipeId)}"
      aria-pressed="${entry?.status === 'skipped'}">${entry?.status === 'skipped' ? '✓ Παραλείφθηκε' : 'Παράλειψη'}</button>
  </div>`;
}

/* ── Today ─────────────────────────────────────────────────────────────── */

export function todayView(ctx) {
  const { profile, load, planDay, log, targets, totals, coverage, dateKey, streak, updateReady, onboarded } = ctx;
  const completeness = ctx.completeness;
  const nextSlot = SLOTS.find(s => log?.meals?.[s]?.status !== 'done' && log?.meals?.[s]?.status !== 'skipped') || 'dinner';
  const nextRecipe = ctx.recipeById(planDay[nextSlot]);
  const guidance = ctx.guidance;
  const ringValue = totals.confirmed.kcal;
  const ringMax = coverage.center;

  return `
  ${updateReady ? `<div class="update-banner">${icon('refresh', 17)}
    <span>Υπάρχει νέα έκδοση της εφαρμογής.</span>
    <button type="button" class="btn btn-sm btn-primary" data-act="reload">Ανανέωση τώρα</button></div>` : ''}

  ${!onboarded ? onboardingCard() : ''}

  <section class="hero">
    <div class="eyebrow">${esc(profile.role)}</div>
    <h1>${esc(greeting())}, <em>${esc(profile.name)}</em>.</h1>
    <p>${esc(longDate(dateKey))} · ${esc(timeNow())} · Όλα τα νούμερα είναι εκτιμήσεις προγραμματισμού, όχι μετρήσεις.</p>
  </section>

  ${coverage.status === 'under' && coverage.extras.length ? coverageCard(ctx, coverage) : ''}

  <section class="card card-lg hero-panel">
    <div class="hero-ring">
      ${ring({
        value: ringValue, max: ringMax, ghost: totals.planned.kcal, size: 190, stroke: 15,
        main: num(ringValue), sub: 'kcal σήμερα',
        caption: `Καταγεγραμμένες ${num(ringValue)} από εκτιμώμενες ${num(coverage.center)} kcal`
      })}
      <div class="hero-ring-caption">
        <b>${num(ringValue)}</b> καταγεγραμμένες<br>
        <span style="opacity:.8">γκρι τόξο = πλάνο ${num(totals.planned.kcal)} kcal</span>
      </div>
    </div>
    <div class="stack" style="width:100%">
      <div class="grid g2">
        ${macroBar({ label: 'Πρωτεΐνη', value: totals.confirmed.p, target: targets.protein.min, tone: 'blue', iconName: 'drumstick', note: `Εκτιμώμενο εύρος ${num(targets.protein.min)}–${num(targets.protein.max)} g` })}
        ${macroBar({ label: 'Υδατάνθρακες', value: totals.confirmed.c, target: Math.round(totals.planned.c), tone: 'gold', iconName: 'bread', note: 'Στόχος = το σημερινό πλάνο' })}
        ${macroBar({ label: 'Λιπαρά', value: totals.confirmed.f, target: Math.round(totals.planned.f), tone: 'rose', iconName: 'droplet', note: 'Κυρίως ελαιόλαδο, ξηροί καρποί, τυρί' })}
        ${macroBar({ label: 'Ενυδάτωση', value: log?.waterMl || 0, target: targets.hydration.ml, unit: 'ml', tone: 'accent', iconName: 'droplet', note: `Αρχική εκτίμηση ${mlToText(targets.hydration.ml)} · ${targets.hydration.glasses} ποτήρια` })}
      </div>
      <div class="grid g3" style="margin-top:4px">
        ${stat({ label: 'Γεύματα', value: `${completeness.mealsDone}<small>/${completeness.mealsTotal}</small>`, iconName: 'checkCircle', tone: 'accent' })}
        ${stat({ label: 'Σειρά ημερών', value: num(streak), unit: streak === 1 ? 'ημέρα' : 'ημέρες', iconName: 'flame', tone: 'gold' })}
        ${stat({ label: 'Εκτίμηση πλάνου', value: `${Math.round(coverage.pct * 100)}<small>%</small>`, iconName: 'target', tone: coverage.status === 'under' ? 'rose' : 'accent', note: `της εκτιμώμενης ανάγκης (${num(coverage.center)} kcal)` })}
      </div>
    </div>
  </section>

  <section class="card card-lg" style="margin-top:16px">
    <div class="card-head">
      <div>
        <div class="eyebrow">Επόμενο</div>
        <div class="card-title" style="font-size:1.15rem">${esc(nextRecipe.name)}</div>
        <p class="muted tiny">${esc(SLOT_LABEL[nextSlot])} · ${esc(SLOT_TIME[nextSlot])} · ${nextRecipe.time}′ προετοιμασία
          ${profile.athlete ? ` · ${esc(ctx.loadLabel)}` : ''}</p>
      </div>
      <button type="button" class="btn btn-primary" data-act="meal" data-slot="${nextSlot}" data-portion="1" data-recipe="${esc(nextRecipe.id)}">
        ${icon('check', 17)} Το έφαγα
      </button>
    </div>
    <div class="grid g2">
      <div>
        ${macroChips({ ...mealMacros(nextRecipe, profile, load, 1), slot: nextSlot })}
        <div class="portion-note">${icon('target', 14)} Μερίδα για ${esc(profile.name)}: ${esc(targets.portions.label)}</div>
      </div>
      <div class="meal-actions" style="align-content:start">
        <button type="button" class="chip" data-act="meal" data-slot="${nextSlot}" data-portion="0.75" data-recipe="${esc(nextRecipe.id)}">Μικρότερη μερίδα</button>
        <button type="button" class="chip" data-act="meal" data-slot="${nextSlot}" data-portion="1.25" data-recipe="${esc(nextRecipe.id)}">Μεγαλύτερη μερίδα</button>
        <button type="button" class="chip" data-act="skip" data-slot="${nextSlot}" data-recipe="${esc(nextRecipe.id)}">Παράλειψη σήμερα</button>
        <button type="button" class="chip" data-act="recipe" data-id="${esc(nextRecipe.id)}">${icon('book', 14)} Δες τη συνταγή</button>
      </div>
    </div>
  </section>

  <section class="card" style="margin-top:16px">
    <div class="card-head"><span class="card-title">Νερό</span>
      <span class="muted tiny">${mlToText(log?.waterMl || 0)} από ${mlToText(targets.hydration.ml)}</span></div>
    <div class="water-tracker">
      ${Array.from({ length: Math.max(6, targets.hydration.glasses) }, (_, i) => {
        const filled = (log?.waterMl || 0) >= (i + 1) * 250;
        return `<button type="button" class="glass ${filled ? 'filled' : ''}" data-act="water" data-set="${(i + 1) * 250}"
          aria-label="${i + 1} ποτήρια (${(i + 1) * 250} ml)"></button>`;
      }).join('')}
    </div>
    <div class="meal-actions" style="margin-top:12px">
      <button type="button" class="chip" data-act="water" data-delta="-250">${icon('minus', 14)} 250 ml</button>
      <button type="button" class="chip" data-act="water" data-delta="250">${icon('plus', 14)} 250 ml</button>
      <button type="button" class="chip" data-act="water" data-set="0">Μηδέν</button>
    </div>
  </section>

  ${profile.athlete ? athleteCard(ctx) : ''}

  <section style="margin-top:22px">
    ${sectionHead({ eyebrow: 'Το πλάνο της ημέρας', title: 'Τα τέσσερα γεύματα', sub: 'Οι μερίδες είναι προσαρμοσμένες στο προφίλ. Πάτησε για να καταγράψεις τι έγινε πραγματικά.' })}
    <div class="meal-grid">
      ${SLOTS.map(slot => {
        const r = ctx.recipeById(planDay[slot]);
        const entry = log?.meals?.[slot];
        const done = entry?.status === 'done';
        const skipped = entry?.status === 'skipped';
        const m = mealMacros(r, profile, load, entry?.portion ?? 1);
        return `<article class="meal ${done ? 'is-done' : ''} ${skipped ? 'is-skipped' : ''}">
          <div class="meal-slot">${slotTag(slot)}
            <span class="meal-time">${icon('clock', 12)}${esc(SLOT_TIME[slot])}</span></div>
          <h3>${esc(r.name)}</h3>
          ${macroChips({ ...m, slot })}
          <div class="portion-note">
            ${done ? `${icon('checkCircle', 14)} Καταγράφηκε ${entry.portion}×` : skipped ? `${icon('x', 14)} Παραλείφθηκε` : `${icon('info', 14)} ${r.time}′ · δεν έχει καταγραφεί`}
            <button type="button" class="meal-link" data-act="recipe" data-id="${esc(r.id)}">Συνταγή ${icon('chevronRight', 13)}</button>
          </div>
          ${portionButtons(slot, entry, r.id)}
        </article>`;
      }).join('')}
    </div>
  </section>

  ${log?.extras?.length ? `<section class="card" style="margin-top:16px">
    <div class="card-head"><span class="card-title">Πρόσθετα σήμερα</span>
      <button type="button" class="chip" data-act="clearExtras">Καθαρισμός</button></div>
    <div class="stack">
      ${log.extras.map(ex => {
        const r = ctx.recipeById(ex.recipeId);
        if (!r) return '';
        const m = mealMacros(r, profile, load, ex.portion ?? 1);
        return `<div class="shop-item"><span class="shop-check" style="color:var(--accent);background:var(--accent);border-color:var(--accent)">${icon('check', 13)}</span>
          <span><span class="shop-name">${esc(r.name)}</span><span class="shop-src"> · ${esc(ex.portion)}× · ${num(m.kcal)} kcal</span></span>
          <button type="button" class="icon-btn sm" data-act="delExtra" data-id="${esc(ex.id)}" aria-label="Αφαίρεση">${icon('trash', 15)}</button></div>`;
      }).join('')}
    </div>
  </section>` : ''}

  <div class="grid g2" style="margin-top:16px">
    <section class="card">
      <h3>Χρονολόγιο</h3>
      <div class="timeline" style="margin-top:12px">
        ${SLOTS.map(slot => {
          const r = ctx.recipeById(planDay[slot]);
          const entry = log?.meals?.[slot];
          const state2 = entry?.status === 'done' ? 'done' : slot === nextSlot ? 'current' : '';
          return `<div class="tl-item ${state2}">
            <span class="tl-time">${esc(SLOT_TIME[slot])}</span>
            <span class="tl-rail"><i class="tl-dot"></i></span>
            <span class="tl-body">
              <span class="tl-title">${esc(r.name)}</span>
              <span class="tl-meta">${esc(SLOT_LABEL[slot])}${entry?.portion ? ` · ${entry.portion}×` : ''}${entry?.status === 'skipped' ? ' · παραλείφθηκε' : ''}</span>
            </span></div>`;
        }).join('')}
      </div>
    </section>
    <section class="card">
      <h3>Γιατί αυτό σήμερα</h3>
      <div class="stack" style="margin-top:12px">
        ${guidance.length ? guidance.map(t => `<div class="notice">${icon('info', 16)}<span>${esc(t)}</span></div>`).join('')
          : `<p class="muted tiny">Δεν υπάρχουν ειδικές σημειώσεις για σήμερα. Ακολούθησε το πλάνο και κατέγραψε ό,τι έγινε.</p>`}
      </div>
      <div class="portion-note" style="margin-top:12px">
        ${icon('target', 14)} Μερίδες: ${esc(targets.portions.label)} · Λαχανικά ×${targets.portions.vegetables} · Πρωτεΐνη ×${num1(targets.portions.protein)} · Υδατάνθρακες ×${num1(targets.portions.carbs)} · Λιπαρά ×${num1(targets.portions.fats)}
      </div>
    </section>
  </div>`;
}

function onboardingCard() {
  return `<section class="card card-lg" style="margin-bottom:18px;background:linear-gradient(150deg,var(--accent-soft),transparent 65%),var(--surface)">
    <div class="card-head">
      <div>
        <div class="eyebrow">${icon('sparkles', 12)} Ξεκίνα εδώ</div>
        <div class="card-title" style="font-size:1.15rem">Τρεις κινήσεις για να δουλέψει σωστά</div>
      </div>
      <button type="button" class="icon-btn" data-act="dismissOnboarding" aria-label="Απόκρυψη">${icon('x', 17)}</button>
    </div>
    <div class="grid g3">
      <div class="notice">${icon('users', 17)}<span><b>1.</b> Διάλεξε μέλος πάνω δεξιά — οι μερίδες και οι κανόνες αλλάζουν ανά προφίλ.</span></div>
      <div class="notice">${icon('checkCircle', 17)}<span><b>2.</b> Πάτησε «Το έφαγα» σε κάθε γεύμα. Χωρίς καταγραφή, κανένα νούμερο δεν θεωρείται κατανάλωση.</span></div>
      <div class="notice">${icon('printer', 17)}<span><b>3.</b> Δες τη <b>Λίστα αγορών</b> και τύπωσε το πλάνο της εβδομάδας.</span></div>
    </div>
  </section>`;
}

function coverageCard(ctx, coverage) {
  const { profile, load } = ctx;
  return `<section class="card" style="margin-bottom:16px;border-color:color-mix(in srgb,var(--gold) 30%,transparent);background:linear-gradient(150deg,var(--tint-gold),transparent 70%),var(--surface)">
    <div class="card-head">
      <div>
        <div class="eyebrow" style="color:var(--gold)">${icon('alert', 12)} Κενό ενέργειας</div>
        <div class="card-title">Το κοινό οικογενειακό πλάνο καλύπτει το ${pct(coverage.pct)} της εκτίμησης</div>
        <p class="muted tiny">Εκτιμώμενη ανάγκη ~${num(coverage.center)} kcal · το πλάνο δίνει ~${num(coverage.planned)} kcal · διαφορά ~${num(coverage.gapKcal)} kcal${coverage.proteinGap ? ` · και ~${num(coverage.proteinGap)} g πρωτεΐνης` : ''}.</p>
      </div>
    </div>
    <div class="notice notice-warn">${icon('info', 17)}<span>Ένα οικογενειακό μενού δεν μπορεί να καλύψει όλους. Πρόσθεσε ό,τι λείπει — η εφαρμογή προτείνει <b>μόνο προσθήκες</b>, ποτέ μείωση, και ποτέ περιορισμό για ανήλικο.</span></div>
    <div class="meal-actions" style="margin-top:12px">
      ${coverage.extras.map(r => {
        const m = mealMacros(r, profile, load, 1);
        return `<button type="button" class="chip" data-act="addExtra" data-recipe="${esc(r.id)}">
          ${icon('plus', 14)} ${esc(r.name)} <span class="muted">· ${num(m.kcal)} kcal</span></button>`;
      }).join('')}
    </div>
  </section>`;
}

function athleteCard(ctx) {
  const { profile, load, loadLabel } = ctx;
  return `<section class="card" style="margin-top:16px">
    <div class="card-head">
      <div><div class="eyebrow">${icon('zap', 12)} Λειτουργία αθλητή</div>
        <div class="card-title">Φορτίο προπόνησης: ${esc(loadLabel)}</div></div>
    </div>
    <div class="filters">
      ${ctx.trainingLoads.map(([id, label]) => `<button type="button" class="chip ${id === load ? 'active' : ''}"
        data-act="load" data-load="${id}" aria-pressed="${id === load}">${esc(label)}</button>`).join('')}
    </div>
    <div class="notice" style="margin-top:14px">${icon('shield', 17)}<span>Το φορτίο αλλάζει <b>υδατάνθρακες και υγρά</b>. Δεν δημιουργεί ποτέ στόχο απώλειας βάρους για ανήλικο προφίλ.</span></div>
  </section>`;
}

/* ── Plan ──────────────────────────────────────────────────────────────── */

export function planView(ctx) {
  const { weekDays, weekOffset, dateKey } = ctx;
  const thisWeek = cycleWeek();
  const shownWeek = ((thisWeek - 1 + weekOffset) % 4 + 4) % 4 + 1;

  return `
  <section class="hero">
    <div class="eyebrow">Κύκλος 28 ημερών</div>
    <h1>Εβδομάδα ${shownWeek} <em>από τις 4</em></h1>
    <p>Ένας κοινός κύκλος Δευτέρα–Κυριακή. Οι μερίδες αλλάζουν ανά μέλος, το μενού όχι.</p>
  </section>

  <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
    <div class="week-nav">
      <button type="button" class="icon-btn" data-act="week" data-delta="-1" aria-label="Προηγούμενη εβδομάδα">${icon('chevronLeft', 18)}</button>
      <button type="button" class="icon-btn" data-act="week" data-delta="1" aria-label="Επόμενη εβδομάδα">${icon('chevronRight', 18)}</button>
      <span class="muted tiny">${weekOffset === 0 ? 'Αυτή η εβδομάδα' : weekOffset < 0 ? `${Math.abs(weekOffset)} εβδομάδες πριν` : `${weekOffset} εβδομάδες μετά`}</span>
      ${weekOffset !== 0 ? `<button type="button" class="chip" data-act="week" data-reset="1">Επιστροφή</button>` : ''}
    </div>
    <div class="sec-action">
      <button type="button" class="btn btn-sm" data-act="nav" data-view="shopping">${icon('cart', 16)} Λίστα αγορών</button>
      <button type="button" class="btn btn-sm btn-ghost" data-act="print">${icon('printer', 16)} Εκτύπωση</button>
    </div>
  </div>

  <div class="week-strip" style="margin-top:16px">
    ${weekDays.map(d => `<article class="day-card ${d.date === dateKey ? 'is-today' : ''}">
      <div>
        <div class="eyebrow" style="margin-bottom:2px">${d.date === dateKey ? 'Σήμερα' : esc(GREEK_DAYS_SHORT[(d.dateObj.getDay() + 6) % 7])}</div>
        <h3>${esc(shortDate(d.date))}</h3>
      </div>
      ${SLOTS.map(slot => `<div class="day-slot"><span>${esc(SLOT_LABEL[slot])}</span><b>${esc(d.recipeById(d.plan[slot]).name)}</b></div>`).join('')}
      <button type="button" class="btn btn-sm btn-ghost" data-act="day" data-date="${esc(d.date)}">${icon('eye', 15)} Λεπτομέρειες</button>
    </article>`).join('')}
  </div>

  <section class="card" style="margin-top:16px">
    ${sectionHead({ eyebrow: 'Προετοιμασία', title: 'Μαγείρεψε μία φορά, φάε όλη την εβδομάδα', sub: 'Τέσσερις κινήσεις που καλύπτουν το 80% της εβδομάδας.' })}
    <div class="batch-list">
      ${[
        ['Ένα όσπριο σε μεγάλη κατσαρόλα', 'Φακές, ρεβίθια ή φασόλια — κρατούν 3–4 ημέρες στο ψυγείο.'],
        ['Ένα ταψί πρωτεΐνης', 'Κοτόπουλο ή μπιφτέκια. Κόβεται σε μερίδες και μπαίνει σε ταπεράκια.'],
        ['Ένα μαγειρεμένο δημητριακό', 'Ρύζι ή ζυμαρικά ολικής. Γίνεται βάση για δύο διαφορετικά βραδινά.'],
        ['Πλυμένα & κομμένα λαχανικά', 'Σε δοχείο με νερό στο ψυγείο — γλιτώνεις 20 λεπτά κάθε βράδυ.']
      ].map(([t, s]) => `<div class="batch-item">${icon('checkCircle', 17)}<span><b>${esc(t)}</b><br><span class="muted tiny">${esc(s)}</span></span></div>`).join('')}
    </div>
  </section>

  <section class="card" style="margin-top:16px">
    ${sectionHead({ eyebrow: 'Έλεγχος', title: 'Πόσο καλύπτει το πλάνο κάθε μέλος', sub: 'Το ίδιο μενού, διαφορετικές ανάγκες. Εδώ φαίνεται πού χρειάζεται προσθήκη.' })}
    <div class="bc">
      ${ctx.coverageByMember.map(c => `<div class="bc-row">
        <span class="bc-label">${esc(c.name)}</span>
        <span class="bc-track"><span class="bc-fill tone-${c.status === 'under' ? 'gold' : 'accent'}" style="width:${Math.min(100, c.pct * 100).toFixed(1)}%"></span></span>
        <span class="bc-val">${pct(c.pct)}</span>
      </div>`).join('')}
    </div>
    <p class="muted tiny" style="margin-top:12px">Ποσοστό κάλυψης της εκτιμώμενης ανάγκης από το κοινό μενού, στις μερίδες του καθενός.</p>
  </section>`;
}

/* ── Meals library ─────────────────────────────────────────────────────── */

export function mealsView(ctx) {
  const { recipes, filters } = ctx;
  const q = filters.q.trim().toLowerCase();
  let list = recipes.filter(r => {
    if (filters.slot && r.slot !== filters.slot) return false;
    if (filters.tag && !r.tags.includes(filters.tag)) return false;
    if (!q) return true;
    return r.name.toLowerCase().includes(q)
      || r.ingredients.some(i => i.n.toLowerCase().includes(q))
      || r.tags.some(t => t.toLowerCase().includes(q));
  });
  if (filters.sort === 'time') list = [...list].sort((a, b) => a.time - b.time);
  if (filters.sort === 'kcal') list = [...list].sort((a, b) => mealMacros(a, ctx.profile, ctx.load, 1).kcal - mealMacros(b, ctx.profile, ctx.load, 1).kcal);
  if (filters.sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'el'));

  const tags = [['', 'Όλα'], ['batch', 'Μαζικό μαγείρεμα'], ['fast', 'Γρήγορα'], ['highprotein', 'Πρωτεΐνη'], ['legume', 'Όσπρια'], ['fish', 'Ψάρι'], ['veg', 'Λαχανικά'], ['athlete', 'Αθλητής']];

  return `
  <section class="hero">
    <div class="eyebrow">Βιβλιοθήκη συνταγών</div>
    <h1>${recipes.length} συνταγές, <em>μετρημένες</em></h1>
    <p>Κάθε συνταγή έχει ποσότητες για ψώνια και macros που κλιμακώνονται στο προφίλ του καθενός.</p>
  </section>

  <div class="card" style="display:grid;gap:14px">
    <div class="filters">
      <span class="search-wrap">${icon('search', 17)}
        <input type="search" id="recipeSearch" placeholder="Αναζήτηση συνταγής ή υλικού…" value="${esc(filters.q)}" aria-label="Αναζήτηση συνταγών">
      </span>
      <select id="recipeSort" aria-label="Ταξινόμηση" style="width:auto">
        <option value="slot" ${filters.sort === 'slot' ? 'selected' : ''}>Τυπική σειρά</option>
        <option value="time" ${filters.sort === 'time' ? 'selected' : ''}>Πιο γρήγορα</option>
        <option value="kcal" ${filters.sort === 'kcal' ? 'selected' : ''}>Λιγότερες kcal</option>
        <option value="name" ${filters.sort === 'name' ? 'selected' : ''}>Αλφαβητικά</option>
      </select>
    </div>
    <div class="filters">
      ${[['', 'Όλα τα γεύματα'], ['breakfast', 'Πρωινό'], ['lunch', 'Μεσημεριανό'], ['snack', 'Σνακ'], ['dinner', 'Βραδινό']]
        .map(([v, l]) => `<button type="button" class="chip ${filters.slot === v ? 'active' : ''}" data-act="filter" data-key="slot" data-value="${v}">${esc(l)}</button>`).join('')}
    </div>
    <div class="filters">
      ${tags.map(([v, l]) => `<button type="button" class="chip ${filters.tag === v ? 'active' : ''}" data-act="filter" data-key="tag" data-value="${v}">${esc(l)}</button>`).join('')}
    </div>
  </div>

  ${list.length ? `<div class="recipe-grid" style="margin-top:16px">
    ${list.map(r => {
      const m = mealMacros(r, ctx.profile, ctx.load, 1);
      return `<button type="button" class="recipe-card" data-act="recipe" data-id="${esc(r.id)}">
        <span class="recipe-top">
          ${slotTag(r.slot)}
          <span class="pill pill-neutral">${icon('clock', 12)} ${r.time}′</span>
        </span>
        <h3>${esc(r.name)}</h3>
        ${macroChips({ ...m, slot: r.slot })}
        <span class="recipe-ing">${r.ingredients.slice(0, 4).map(i => esc(i.n)).join(' · ')}${r.ingredients.length > 4 ? ' …' : ''}</span>
        <span class="recipe-ing" style="color:var(--accent);font-weight:650">Για ${esc(ctx.profile.name)} · ${esc(ctx.targets.portions.label)} ${icon('chevronRight', 12)}</span>
      </button>`;
    }).join('')}
  </div>` : emptyState({
    iconName: 'search', title: 'Καμία συνταγή δεν ταιριάζει',
    body: 'Δοκίμασε άλλη λέξη ή καθάρισε τα φίλτρα.',
    action: `<button type="button" class="btn btn-sm" data-act="filter" data-key="reset" data-value="1">Καθαρισμός φίλτρων</button>`
  })}`;
}

/* ── Recipe detail (rendered inside a sheet) ───────────────────────────── */

export function recipeDetail(ctx, recipe) {
  const members = ctx.profiles;
  return `<div class="recipe-detail">
    <div>
      ${slotTag(recipe.slot)}
      <h2 style="font-family:var(--font-display);font-size:1.5rem;margin:8px 0 6px">${esc(recipe.name)}</h2>
      <p class="muted tiny">${recipe.time}′ προετοιμασία · ${recipe.ingredients.length} υλικά · Μερίδα αναφοράς: ${num(mealMacros(recipe, { age: 30, sex: 'm', weight: 75, height: 178, activityFactor: 1.4 }, 'normal', 1).kcal)} kcal</p>
    </div>

    <div class="rd-section">
      <h3>Ποσότητες</h3>
      <div class="ing-table">
        ${recipe.ingredients.map(i => `<div class="ing-row"><span>${esc(i.n)}</span><span class="ing-qty">${num(i.q)} ${esc(i.u)}</span></div>`).join('')}
      </div>
    </div>

    <div class="rd-section">
      <h3>Εκτέλεση</h3>
      <div class="rd-steps">
        ${recipe.steps.map(s => `<div class="rd-step"><span>${esc(s)}</span></div>`).join('')}
      </div>
    </div>

    <div class="rd-section">
      <h3>Μερίδες ανά μέλος</h3>
      <div class="member-scale">
        ${members.map(p => {
          const m = mealMacros(recipe, p, p.athlete ? ctx.state.trainingLoad : 'normal', 1);
          return `<div class="scale-row ${p.id === ctx.profile.id ? 'is-current' : ''}">
            ${avatar(p, 32)}
            <span><span class="scale-name">${esc(p.name)}</span>
              <span class="scale-macros">P ${num(m.p)} · C ${num(m.c)} · F ${num(m.f)} g</span></span>
            <span class="scale-kcal">${num(m.kcal)} <small class="muted">kcal</small></span>
          </div>`;
        }).join('')}
      </div>
      <p class="muted tiny" style="margin-top:9px">Οι θερμίδες υπολογίζονται από τα macros με συντελεστές Atwater 4/4/9 — δεν αποθηκεύονται χωριστά, ώστε να μη μπορούν να διαφωνήσουν.</p>
    </div>

    ${recipe.tip ? `<div class="notice notice-info">${icon('sparkles', 17)}<span>${esc(recipe.tip)}</span></div>` : ''}

    <div class="meal-actions">
      <button type="button" class="btn btn-primary" data-act="meal" data-slot="${esc(recipe.slot)}" data-portion="1" data-recipe="${esc(recipe.id)}">${icon('check', 16)} Το έφαγα τώρα</button>
      <button type="button" class="btn btn-ghost" data-act="addExtra" data-recipe="${esc(recipe.id)}">${icon('plus', 16)} Πρόσθεσέ το σήμερα</button>
    </div>
  </div>`;
}

/* ── Shopping ──────────────────────────────────────────────────────────── */

export function shoppingView(ctx) {
  const { shopList, shopChecked, shopStats, weekOffset } = ctx;
  const thisWeek = cycleWeek();
  const shownWeek = ((thisWeek - 1 + weekOffset) % 4 + 4) % 4 + 1;

  return `
  <section class="hero">
    <div class="eyebrow">Λίστα αγορών</div>
    <h1>Εβδομάδα ${shownWeek}: <em>${shopStats.total}</em> είδη</h1>
    <p>Φτιαγμένη από το πραγματικό εβδομαδιαίο μενού, ομαδοποιημένη όπως είναι τα ράφια του μαγαζιού.</p>
  </section>

  <div class="card">
    <div class="shop-progress">
      ${icon('cart', 20)}
      <div style="flex:1">
        <div class="card-title">${shopStats.checked} από ${shopStats.total} στο καλάθι</div>
        <div class="mb-track" style="margin-top:7px"><div class="mb-fill tone-accent" style="width:${(shopStats.pct * 100).toFixed(1)}%"></div></div>
      </div>
      <div class="sec-action">
        <button type="button" class="btn btn-sm btn-ghost" data-act="shopReset">${icon('refresh', 15)} Καθαρισμός</button>
        <button type="button" class="btn btn-sm btn-ghost" data-act="shopCopy">${icon('clipboard', 15)} Αντιγραφή</button>
        <button type="button" class="btn btn-sm" data-act="print">${icon('printer', 15)} Εκτύπωση</button>
      </div>
    </div>
  </div>

  ${AISLES.map(aisle => {
    const items = shopList.filter(i => i.aisle === aisle.id);
    if (!items.length) return '';
    return `<section>
      <div class="shop-aisle-head">${icon(aisle.icon, 15)}${esc(aisle.label)} <span class="muted">· ${items.length}</span></div>
      <div class="shop-aisle">
        ${items.map(i => `<div class="shop-item ${shopChecked[i.key] ? 'is-checked' : ''}">
          <button type="button" class="shop-check" data-act="shop" data-key="${esc(i.key)}" aria-label="${esc(i.name)}" aria-pressed="${!!shopChecked[i.key]}">${icon('check', 13)}</button>
          <span><span class="shop-name">${esc(i.name)}</span>
            <span class="shop-src"> · σε ${i.count} γεύμα${i.count === 1 ? '' : 'τα'}</span></span>
          <span class="shop-qty">${num(i.qty)} ${esc(i.unit)}</span>
        </div>`).join('')}
      </div>
    </section>`;
  }).join('')}

  <div class="notice" style="margin-top:20px">${icon('info', 17)}
    <span>Οι ποσότητες υπολογίζονται για <b>όλη την οικογένεια</b> με βάση τις μερίδες του καθενός. Έλεγξε το ντουλάπι σου πριν ψωνίσεις — η λίστα δεν ξέρει τι έχεις ήδη.</span></div>`;
}

/* ── Progress ──────────────────────────────────────────────────────────── */

export function progressView(ctx) {
  const { profile, trend, streak, heatCells, measurements, weekAdherence, dateKey } = ctx;
  const adultBmi = canUseAdultBmi(profile);
  const bmiValue = bmi(profile);

  return `
  <section class="hero">
    <div class="eyebrow">Πρόοδος</div>
    <h1>Τάσεις, <em>όχι ενοχές</em></h1>
    <p>Καμία μεμονωμένη μέτρηση δεν κρίνεται. Η εικόνα βγαίνει από την τάση εβδομάδων.</p>
  </section>

  <div class="grid g4">
    ${stat({ label: 'Ημέρες με καταγραφή', value: num(ctx.loggedDays), iconName: 'calendar', tone: 'accent' })}
    ${stat({ label: 'Σειρά ημερών', value: num(streak), unit: streak === 1 ? 'ημέρα' : 'ημέρες', iconName: 'flame', tone: 'gold' })}
    ${stat({ label: 'Μετρήσεις', value: num(measurements.length), iconName: 'scale', tone: 'blue' })}
    ${stat({ label: 'BMI', value: adultBmi && bmiValue ? num1(bmiValue) : '—', iconName: 'heart', tone: 'rose',
      note: adultBmi ? (adultBmiLabel(profile) || '') : 'Απαιτείται αξιολόγηση ανά ηλικία & φύλο' })}
  </div>

  ${!adultBmi ? `<div class="notice notice-info" style="margin-top:16px">${icon('shield', 17)}
    <span><b>Για ηλικίες κάτω των 20</b> το ZENITH δεν εμφανίζει κατηγορίες BMI ενηλίκων. Παιδιά και έφηβοι χρειάζονται αξιολόγηση με καμπύλες ανάπτυξης ανά ηλικία και φύλο — όχι τιμές ενηλίκων.</span></div>` : ''}

  <section class="card" style="margin-top:16px">
    <div class="card-head">
      <div><div class="eyebrow">Τάση βάρους</div>
        <div class="card-title">${trend.count >= 2 ? `${num1(trend.change)} kg σε ${num(trend.spanDays)} ημέρες` : 'Χρειάζονται τουλάχιστον δύο μετρήσεις'}</div></div>
      ${trend.slopePerWeek != null ? pill(`${trend.slopePerWeek > 0 ? '+' : ''}${num1(trend.slopePerWeek)} kg / εβδομάδα`, trend.direction === 'flat' ? 'neutral' : 'accent') : ''}
    </div>
    ${trend.count >= 2
      ? lineChart(trend.points.map(p => ({ x: shortDate(p.date), y: p.weight })), { height: 170, unit: 'kg' })
      : emptyState({ iconName: 'chart', title: 'Δεν υπάρχουν αρκετές μετρήσεις', body: 'Κατέγραψε βάρος μία φορά την εβδομάδα, την ίδια ώρα της ημέρας, για να φανεί τάση.' })}
    ${trend.count >= 2 ? `<p class="muted tiny" style="margin-top:10px">Η γραμμή είναι ευθεία ελαχίστων τετραγώνων πάνω στις καταγραφές σου. Μία μέτρηση είναι θόρυβος — η κλίση εβδομάδων είναι το σήμα.</p>` : ''}
  </section>

  <div class="grid g2" style="margin-top:16px">
    <section class="card">
      <div class="card-head"><span class="card-title">Καταγραφή βάρους</span></div>
      <form class="form" id="measureForm">
        <div class="grid g2">
          <div class="field"><label for="mDate">Ημερομηνία</label><input id="mDate" name="date" type="date" value="${esc(dateKey)}" required></div>
          <div class="field"><label for="mWeight">Βάρος (kg)</label><input id="mWeight" name="weight" type="number" min="20" max="300" step="0.1" value="${measurements.at(-1)?.weight ?? profile.weight}" required></div>
        </div>
        <div class="field"><label for="mNote">Σημείωση (προαιρετικά)</label>
          <input id="mNote" name="note" type="text" maxlength="80" placeholder="π.χ. πρωί, νηστικός"></div>
        <button class="btn btn-primary" type="submit">${icon('check', 16)} Αποθήκευση μέτρησης</button>
      </form>
    </section>

    <section class="card">
      <div class="card-head"><span class="card-title">Καταγραφή τελευταίων 28 ημερών</span>
        <span class="muted tiny">${num(ctx.loggedDays28)} / 28</span></div>
      ${heatmap(heatCells, { todayKey: dateKey })}
      <p class="muted tiny" style="margin-top:12px">Κάθε τετράγωνο είναι μία ημέρα. Όσο πιο σκούρο, τόσο περισσότερα γεύματα καταγράφηκαν.</p>
    </section>
  </div>

  <section class="card" style="margin-top:16px">
    <div class="card-head"><span class="card-title">Αυτή η εβδομάδα</span></div>
    ${barChart(ctx.weekDays.map(d => ({ label: GREEK_DAYS_SHORT[(d.dateObj.getDay() + 6) % 7], value: (weekAdherence.find(w => w.date === d.date)?.meals) || 0, tone: d.date === dateKey ? 'accent' : 'blue' })), { unit: '', max: 4 })}
    <p class="muted tiny" style="margin-top:10px">Γεύματα που επιβεβαιώθηκαν ανά ημέρα (μέγιστο 4).</p>
  </section>

  <section class="card card-flush" style="margin-top:16px">
    <div style="padding:20px 20px 0"><div class="card-title">Ιστορικό μετρήσεων</div></div>
    ${measurements.length ? `<div style="padding:14px 20px 20px">
      <div class="ing-table">
        ${[...measurements].reverse().map(m => `<div class="ing-row">
          <span>${esc(longDate(m.date))}${m.note ? ` <span class="muted tiny">· ${esc(m.note)}</span>` : ''}</span>
          <span style="display:flex;align-items:center;gap:10px">
            <span class="ing-qty">${num1(m.weight)} kg</span>
            <button type="button" class="icon-btn sm" data-act="delMeasure" data-id="${esc(m.id)}" aria-label="Διαγραφή μέτρησης ${esc(m.date)}">${icon('trash', 14)}</button>
          </span></div>`).join('')}
      </div>
    </div>` : `<div style="padding:0 20px 20px"><p class="muted tiny">Δεν υπάρχουν καταγεγραμμένες μετρήσεις ακόμη.</p></div>`}
  </section>`;
}

/* ── Family ────────────────────────────────────────────────────────────── */

export function familyView(ctx) {
  return `
  <section class="hero">
    <div class="eyebrow">Οικογένεια</div>
    <h1>Προφίλ & <em>κανόνες ασφάλειας</em></h1>
    <p>Οι ρυθμίσεις του προφίλ καθορίζουν ποια διατροφική λογική επιτρέπεται — όχι το αντίστροφο.</p>
  </section>

  <div class="grid g2">
    ${ctx.profiles.map(p => {
      const t = ctx.targetsByMember[p.id];
      return `<section class="card ${p.id === ctx.profile.id ? '' : ''}" style="${p.id === ctx.profile.id ? 'border-color:var(--accent-line);box-shadow:0 0 0 3px var(--accent-soft),var(--shadow-1)' : ''}">
        <div class="card-head">
          <div style="display:flex;gap:12px;align-items:center">
            ${avatar(p, 44)}
            <div>
              <div class="card-title" style="font-size:1.05rem">${esc(p.name)}</div>
              <div class="muted tiny">${esc(p.role)}</div>
            </div>
          </div>
          <div class="sec-action">
            ${p.athlete ? pill('Αθλητής', 'gold', 'zap') : ''}
            ${isMinor(p) ? pill('Ανήλικος', 'blue', 'shield') : ''}
          </div>
        </div>
        <div class="grid g3" style="margin-bottom:14px">
          ${stat({ label: 'Ενέργεια', value: `${num(t.energy.lower)}–${num(t.energy.upper)}`, unit: 'kcal', iconName: 'flame', tone: 'gold' })}
          ${stat({ label: 'Πρωτεΐνη', value: `${num(t.protein.min)}–${num(t.protein.max)}`, unit: 'g', iconName: 'drumstick', tone: 'blue' })}
          ${stat({ label: 'Υγρά', value: mlToText(t.hydration.ml), iconName: 'droplet', tone: 'accent' })}
        </div>
        <div class="meal-actions">
          <button type="button" class="btn btn-sm" data-act="editMember" data-id="${esc(p.id)}">${icon('edit', 15)} Επεξεργασία</button>
          <button type="button" class="btn btn-sm btn-ghost" data-act="member" data-id="${esc(p.id)}">Προβολή</button>
          ${ctx.profiles.length > 1 ? `<button type="button" class="btn btn-sm btn-danger" data-act="delMember" data-id="${esc(p.id)}">${icon('trash', 15)} Διαγραφή</button>` : ''}
        </div>
      </section>`;
    }).join('')}
    <section class="card" style="display:grid;place-content:center;border-style:dashed">
      ${emptyState({ iconName: 'users', title: 'Προσθήκη μέλους', body: 'Νέο προφίλ με δικούς του κανόνες και μερίδες.',
        action: `<button type="button" class="btn btn-primary btn-sm" data-act="addMember">${icon('plus', 16)} Νέο μέλος</button>` })}
    </section>
  </div>

  <section class="card" style="margin-top:16px">
    ${sectionHead({ eyebrow: 'Ασφάλεια', title: 'Τι προστατεύει η εφαρμογή' })}
    <div class="batch-list">
      ${SAFETY.map(s => `<div class="batch-item">${icon('shield', 17)}<span>${esc(s)}</span></div>`).join('')}
    </div>
  </section>`;
}

/* ── Guide / evidence ──────────────────────────────────────────────────── */

export function guideView(ctx) {
  const d = ctx.diagnostics;
  return `
  <section class="hero">
    <div class="eyebrow">Μεθοδολογία & πηγές</div>
    <h1>Πώς βγαίνει <em>κάθε νούμερο</em></h1>
    <p>Κάθε εκτίμηση της εφαρμογής προέρχεται από δημοσιευμένη μέθοδο. Εδώ είναι όλη η αλυσίδα, χωρίς μαύρα κουτιά.</p>
  </section>

  <div class="grid g2">
    ${METHOD.map(m => `<section class="card">
      <div class="card-head" style="justify-content:flex-start;gap:11px">
        <span class="stat-ic tone-accent">${icon(m.icon, 16)}</span>
        <span class="card-title">${esc(m.title)}</span>
      </div>
      <p class="muted" style="font-size:.88rem;line-height:1.65">${esc(m.body)}</p>
    </section>`).join('')}
  </div>

  <section class="card" style="margin-top:16px">
    ${sectionHead({ eyebrow: 'Πηγές', title: 'Βιβλιογραφία', sub: 'Οι σύνδεσμοι ανοίγουν στις επίσημες σελίδες των εκδοτών.' })}
    <div class="stack">
      ${SOURCES.map(s => `<a class="shop-item" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit">
        <span class="shop-check" style="color:var(--accent);background:var(--accent-soft);border-color:var(--accent-line)">${icon('book', 13)}</span>
        <span><span class="shop-name">${esc(s.label)}</span><span class="shop-src"> · ${esc(s.used)}</span></span>
        <span class="shop-qty">${icon('arrowRight', 15)}</span>
      </a>`).join('')}
    </div>
  </section>

  <div class="grid g2" style="margin-top:16px">
    <section class="card">
      ${sectionHead({ eyebrow: 'Λεξικό', title: 'Όροι' })}
      <div class="stack">
        ${GLOSSARY.map(([term, def]) => `<div><b style="font-size:.9rem">${esc(term)}</b><p class="muted tiny" style="margin-top:2px">${esc(def)}</p></div>`).join('')}
      </div>
    </section>

    <section class="card">
      ${sectionHead({ eyebrow: 'Δεδομένα', title: 'Backup & διάγνωση' })}
      <p class="muted tiny" style="margin-bottom:14px">Τα δεδομένα μένουν στη συσκευή σου. Το export είναι πλήρες και φορητό· το restore είναι ατομικό — αν αποτύχει, δεν αλλάζει τίποτα.</p>
      <div class="meal-actions" style="margin-bottom:16px">
        <button type="button" class="btn btn-sm" data-act="export">${icon('download', 15)} Export JSON</button>
        <button type="button" class="btn btn-sm" data-act="import">${icon('upload', 15)} Import JSON</button>
        <button type="button" class="btn btn-sm btn-ghost" data-act="persist">${icon('lock', 15)} Μόνιμη αποθήκευση</button>
      </div>
      <div class="ing-table">
        ${[
          ['Έκδοση', `${APP.version} · ${APP.updated}`],
          ['Μηχανισμός αποθήκευσης', d.backend === 'idb' ? 'IndexedDB' : 'localStorage (εφεδρικός)'],
          ['Μόνιμη αποθήκευση', d.persisted ? 'Ενεργή' : 'Όχι ακόμη'],
          ['Χρήση χώρου', `${d.usageText}${d.quotaText !== '—' ? ` / ${d.quotaText}` : ''}`],
          ['Service worker', d.sw],
          ['Σύνδεση', d.online ? 'Συνδεδεμένο' : 'Εκτός σύνδεσης (η εφαρμογή δουλεύει)']
        ].map(([k, v]) => `<div class="ing-row"><span>${esc(k)}</span><span class="ing-qty">${esc(v)}</span></div>`).join('')}
      </div>
      <div class="notice notice-danger" style="margin-top:16px">${icon('alert', 17)}
        <span><b>Επικίνδυνη ενέργεια.</b> Η διαγραφή όλων των δεδομένων δεν αναιρείται. Κάνε export πρώτα.</span></div>
      <button type="button" class="btn btn-danger btn-sm" style="margin-top:12px" data-act="wipe">${icon('trash', 15)} Διαγραφή όλων των δεδομένων</button>
    </section>
  </div>

  <div class="notice" style="margin-top:16px">${icon('heart', 17)}
    <span>Το ZENITH PRO είναι εκπαιδευτικό εργαλείο ευεξίας. Δεν παρέχει ιατρική συμβουλή, διάγνωση ή θεραπεία και δεν αντικαθιστά επαγγελματία υγείας.</div></div>`;
}

/* ── Sheets content ────────────────────────────────────────────────────── */

export function memberForm(ctx, p) {
  const minor = isMinor(p);
  return `<form class="form" id="memberForm" data-id="${esc(p.id)}">
    <div class="grid g2">
      <div class="field"><label for="fName">Όνομα</label><input id="fName" name="name" maxlength="24" value="${esc(p.name)}" required></div>
      <div class="field"><label for="fRole">Ρόλος / στόχος σε μια φράση</label><input id="fRole" name="role" maxlength="60" value="${esc(p.role)}"></div>
      <div class="field"><label for="fAge">Ηλικία</label><input id="fAge" name="age" type="number" min="2" max="110" value="${p.age}" required></div>
      <div class="field"><label for="fSex">Φύλο</label><select id="fSex" name="sex">
        <option value="f" ${p.sex === 'f' ? 'selected' : ''}>Γυναίκα</option>
        <option value="m" ${p.sex === 'm' ? 'selected' : ''}>Άνδρας</option></select></div>
      <div class="field"><label for="fHeight">Ύψος (cm)</label><input id="fHeight" name="height" type="number" min="80" max="230" value="${p.height}" required></div>
      <div class="field"><label for="fWeight">Βάρος (kg)</label><input id="fWeight" name="weight" type="number" min="20" max="300" step="0.1" value="${p.weight}" required></div>
      <div class="field"><label for="fActivity">Συντελεστής δραστηριότητας</label>
        <select id="fActivity" name="activityFactor">
          ${[[1.2, 'Καθιστική (1,2)'], [1.35, 'Ελαφριά (1,35)'], [1.5, 'Μέτρια (1,5)'], [1.65, 'Δραστήρια (1,65)'], [1.8, 'Πολύ δραστήρια (1,8)']]
            .map(([v, l]) => `<option value="${v}" ${Number(p.activityFactor) === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}
        </select></div>
      <div class="field"><label for="fGoal">Στόχος</label>
        <select id="fGoal" name="goal" ${minor ? 'disabled' : ''}>
          <option value="maintain" ${p.goal === 'maintain' ? 'selected' : ''}>Συντήρηση</option>
          <option value="gradual_fat_loss" ${p.goal === 'gradual_fat_loss' ? 'selected' : ''}>Σταδιακή απώλεια λίπους</option>
          <option value="growth" ${p.goal === 'growth' ? 'selected' : ''}>Ανάπτυξη</option>
          <option value="performance" ${p.goal === 'performance' ? 'selected' : ''}>Απόδοση</option>
        </select>
        ${minor ? `<span class="field-hint">${icon('shield', 12)} Κλειδωμένο: δεν εφαρμόζεται έλλειμμα σε ανήλικο προφίλ.</span>` : ''}
      </div>
    </div>
    <div class="field"><label class="switch">
      <input type="checkbox" name="athlete" ${p.athlete ? 'checked' : ''}>
      <span class="switch-track"></span>
      <span>Αθλητής — ενεργοποιεί λογική φορτίου προπόνησης</span>
    </label></div>
    <div class="field"><label for="fAccent">Χρώμα μέλους</label>
      <select id="fAccent" name="accent">
        ${[['#0E9F6E', 'Σμαράγδι'], ['#2F6FED', 'Αιγαίο'], ['#D9457A', 'Ροδακινί'], ['#D98A16', 'Κεχριμπάρι'], ['#7C5CD6', 'Βιολετί'], ['#0E8F9F', 'Τυρκουάζ']]
          .map(([v, l]) => `<option value="${v}" ${p.accent === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}
      </select></div>
    <div class="field"><label for="fNotes">Σημειώσεις</label><input id="fNotes" name="notes" maxlength="90" value="${esc(p.notes || '')}"></div>
  </form>`;
}

export function dayDetail(ctx, date) {
  const day = ctx.planForDate(date);
  const profile = ctx.profile;
  const log = ctx.logFor(profile.id, date);
  const totals = ctx.dayMacrosFor(day, profile, ctx.load, log);
  const targets = ctx.targets;
  return `<div class="stack-lg">
    <div>
      <div class="eyebrow">${esc(dayName(date))}</div>
      <h2 style="font-family:var(--font-display);font-size:1.4rem">${esc(longDate(date))}</h2>
      <p class="muted tiny">Εβδομάδα ${day.week} του κύκλου · μερίδες για ${esc(profile.name)}</p>
    </div>
    ${SLOTS.map(slot => {
      const r = ctx.recipeById(day[slot]);
      const m = mealMacros(r, profile, ctx.load, log?.meals?.[slot]?.portion ?? 1);
      const entry = log?.meals?.[slot];
      return `<div class="card" style="box-shadow:none">
        <div class="meal-slot" style="margin-bottom:8px">${slotTag(slot)}
          <span class="meal-time">${icon('clock', 12)}${esc(SLOT_TIME[slot])}</span></div>
        <div class="card-title" style="font-size:1.02rem;margin-bottom:8px">${esc(r.name)}</div>
        ${macroChips({ ...m, slot })}
        <div class="meal-actions" style="margin-top:11px">
          <button type="button" class="chip ${entry?.status === 'done' ? 'active' : ''}" data-act="meal" data-slot="${slot}" data-portion="${entry?.portion ?? 1}" data-recipe="${esc(r.id)}" data-date="${esc(date)}">${entry?.status === 'done' ? '✓ Καταγράφηκε' : 'Καταγραφή'}</button>
          <button type="button" class="chip" data-act="recipe" data-id="${esc(r.id)}">Συνταγή</button>
        </div>
      </div>`;
    }).join('')}
    <div class="card" style="box-shadow:none">
      <div class="card-title" style="margin-bottom:10px">Σύνολο ημέρας</div>
      <div class="grid g3">
        ${stat({ label: 'Πλάνο', value: num(totals.planned.kcal), unit: 'kcal', iconName: 'target', tone: 'blue' })}
        ${stat({ label: 'Καταγεγραμμένα', value: num(totals.confirmed.kcal), unit: 'kcal', iconName: 'checkCircle', tone: 'accent' })}
        ${stat({ label: 'Εκτίμηση ανάγκης', value: `${num(targets.energy.lower)}–${num(targets.energy.upper)}`, unit: 'kcal', iconName: 'flame', tone: 'gold' })}
      </div>
    </div>
  </div>`;
}

export function paletteView(items, query) {
  if (!items.length) {
    return `<div class="palette-list"><div class="palette-item muted">Καμία εντολή για «${esc(query)}»</div></div>`;
  }
  return `<div class="palette-list" role="listbox">
    ${items.map((it, i) => `<button type="button" class="palette-item ${i === 0 ? 'active' : ''}" role="option" data-act="palettePick" data-index="${i}">
      ${icon(it.icon, 17)}<span>${esc(it.label)}</span>${it.hint ? `<kbd>${esc(it.hint)}</kbd>` : ''}
    </button>`).join('')}
  </div>`;
}
