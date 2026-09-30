/**
 * ZENITH PRO · views
 * ---------------------------------------------------------------------------
 * Pure render functions. They take a context object built by app.js and return
 * HTML strings. They never touch storage or state directly — every interaction
 * is expressed as a `data-act` attribute that app.js dispatches on. That keeps
 * this file free of side effects and free of import cycles.
 *
 * Information design, in one paragraph: each screen answers ONE question first
 * (Today: what do I eat now, and did I? · Plan: what is on this week? · Meals:
 * what can I cook? · Shopping: what do I buy?) and puts the number-heavy detail
 * behind it, so a family member can act without reading a chart.
 */

import {
  esc, icon, ring, macroBar, meter, stat, pill, pillDot, kpi, sectionHead, emptyState,
  lineChart, heatmap, barChart, avatar, illustration, glassIcon,
  num, num1, pct, mlToText, longDate, shortDate, dayName, greeting, timeNow,
  kitchenAmount, shopAmount, parseStepTimers, clockText, weekdayIndex,
  GREEK_DAYS_SHORT, cycleWeek
} from './ui.js';
import {
  SLOTS, SLOT_LABEL, SLOT_TIME, AISLES, SOURCES, METHOD, SAFETY, GLOSSARY, APP,
  RECIPE_ART, FUELING, DATA_FACTS
} from './data.js';
import { FOODS, qtyOf } from './foods.js';
import {
  mealMacros, canUseAdultBmi, bmi, adultBmiLabel, isMinor, scaledIngredients,
  householdPlate, householdRoleServings, nutritionBadges, referenceValues, saltGrams,
  PLATE_MAX
} from './nutrition-engine.js';

/* ── Small shared pieces ───────────────────────────────────────────────── */

const SLOT_ICON = { breakfast: 'sun', lunch: 'utensils', snack: 'leaf', dinner: 'moon' };

function slotTag(slot) {
  return `<span class="slot-tag slot-${slot}">${icon(SLOT_ICON[slot] || 'utensils', 13)}${esc(SLOT_LABEL[slot])}</span>`;
}

/** Recipe illustration on a slot-tinted tile. */
function artTile(recipeId, slot, size = 64) {
  return `<span class="art-tile slot-${slot}" style="--sz:${size}px">${illustration(RECIPE_ART[recipeId], Math.round(size * 0.86))}</span>`;
}

function macroChips(m) {
  return `<div class="macro-chips">
    <span class="mchip kcal">${icon('flame', 12)}<b>${num(m.kcal)}</b> kcal</span>
    <span class="mchip p"><i></i>Π <b>${num(m.p)}</b> g</span>
    <span class="mchip c"><i></i>Υ <b>${num(m.c)}</b> g</span>
    <span class="mchip f"><i></i>Λ <b>${num(m.f)}</b> g</span>
  </div>`;
}

function badgeRow(recipe) {
  const badges = nutritionBadges(recipe).slice(0, 3);
  return badges.length
    ? `<div class="badge-row">${badges.map(b => `<span class="pill pill-${b.tone === 'accent' ? 'accent' : b.tone}">${esc(b.label)}</span>`).join('')}</div>`
    : '';
}

/** «σε 25′» / «σε 1 ώρα 30′» / «τώρα» / «πριν 40′» */
function whenText(min) {
  if (min == null || !Number.isFinite(min)) return '';
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60), m = abs % 60;
  // Past a few hours the minutes are noise: «πριν 6 ώρες», not «πριν 6 ώρες 20′».
  const span = h ? `${h} ${h === 1 ? 'ώρα' : 'ώρες'}${m && h < 3 ? ` ${m}′` : ''}` : `${m}′`;
  if (abs <= 5) return 'τώρα';
  return min > 0 ? `σε ${span}` : `πριν ${span}`;
}

/**
 * «Στο πιάτο σου» — the member's own plate in kitchen units: the heaviest three
 * energy-carrying ingredients, e.g. «κοτόπουλο 220 g · πατάτες 290 g · ελαιόλαδο 15 ml».
 * Straight from the same calculation as the macros, so the grams and the numbers agree.
 */
function plateLines(recipe, member, load, limit = 3) {
  const lines = scaledIngredients(recipe, member, load, 1)
    .map(({ ing, food, g }) => ({ ing, food, g, weight: g * (food.per100.p * 4 + food.per100.c * 4 + food.per100.f * 9) / 100 }))
    .filter(l => l.g >= 1)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
  return lines.map(l => {
    const qty = qtyOf(l.ing, l.g);
    const piece = l.ing.u === 'τεμ';
    const name = (piece && qty > 1.01 ? l.food.plural : l.food.name).toLowerCase();
    const amount = kitchenAmount(qty, l.ing.u);
    return `${name} ${piece ? amount.replace(' τεμ', '') : amount}`;
  });
}

function portionButtons(slot, entry, recipeId) {
  const done = entry?.status === 'done';
  const p = entry?.portion;
  const btn = (val, label) => `<button type="button" class="chip ${done && p === val ? 'active' : ''}"
    data-act="meal" data-slot="${slot}" data-portion="${val}" data-recipe="${esc(recipeId)}"
    aria-pressed="${done && p === val}">${label}</button>`;
  return `<div class="meal-actions">
    ${btn(0.75, 'Μικρότερη')}
    ${btn(1, 'Όπως το πλάνο')}
    ${btn(1.25, 'Μεγαλύτερη')}
    <button type="button" class="chip" data-act="skip" data-slot="${slot}" data-recipe="${esc(recipeId)}"
      aria-pressed="${entry?.status === 'skipped'}">${entry?.status === 'skipped' ? '✓ Παραλείφθηκε' : 'Παράλειψη'}</button>
  </div>`;
}

/* ── Persona brief ─────────────────────────────────────────────────────────
 * "What actually matters for you today." The framing comes from PERSONA_FOCUS
 * and the numbers from the engine, so the copy and the maths stay separate.
 */
function personaCard(ctx) {
  const { profile, persona, personaFocus } = ctx;
  if (!personaFocus || !persona?.length) return '';
  return `
  <section class="card card-lg persona" style="--pa:${esc(profile.accent || 'var(--member)')}">
    <div class="persona-head">
      ${avatar(profile, 48)}
      <div class="persona-titles">
        <div class="eyebrow">${esc(profile.name)} · Τι μετράει για σένα</div>
        <h2 class="persona-title">${esc(personaFocus.title)}</h2>
      </div>
      <span class="pill pill-accent persona-tag">${esc(personaFocus.eyebrow)}</span>
    </div>
    <p class="persona-lead">${esc(personaFocus.lead)}</p>
    <div class="persona-points">
      ${persona.map(p => `<article class="ppoint tone-${esc(p.tone)}">
        <span class="ppoint-ic">${icon(p.icon, 18)}</span>
        <div>
          <div class="ppoint-top">
            <span class="ppoint-label">${esc(p.label)}</span>
            <span class="ppoint-value">${esc(p.value)}</span>
          </div>
          <p class="ppoint-note">${esc(p.body)}</p>
        </div>
      </article>`).join('')}
    </div>
  </section>`;
}

/* ── Athlete fuelling ──────────────────────────────────────────────────────
 * Only ever rendered for an athlete profile. Numbers are per kg, from the
 * engine; the sentences come from FUELING in data.js.
 */
function fuelCard(ctx) {
  const { profile, fueling } = ctx;
  if (!profile?.athlete || !fueling) return '';
  const blocks = [
    { ...FUELING.pre, value: `${num(fueling.preCarbs.min)}–${num(fueling.preCarbs.max)} g` },
    { ...FUELING.post, value: `${num(fueling.postProtein)} g πρωτεΐνη + ${num(fueling.postCarbs)} g υδατ.` },
    { ...FUELING.fluid, value: ctx.targets?.hydration?.ml ? `${mlToText(ctx.targets.hydration.ml)} την ημέρα` : '—' }
  ];
  return `
  <section class="card card-lg fuel">
    <div class="card-head">
      <div>
        <div class="eyebrow">${icon('zap', 14)} Πρωτόκολλο ημέρας · ${esc(ctx.loadLabel)}</div>
        <h2 class="card-title">Καύσιμο γύρω από την προπόνηση</h2>
      </div>
      ${fueling.heavy
        ? `<span class="pill pill-gold">${icon('flame', 13)} Μέρα υψηλών απαιτήσεων</span>`
        : `<span class="pill pill-accent">${icon('check', 13)} Κανονικό φορτίο</span>`}
    </div>
    <div class="filters fuel-loads" role="group" aria-label="Φορτίο προπόνησης">
      ${ctx.trainingLoads.map(([id, label]) => `<button type="button" class="chip ${id === ctx.load ? 'active' : ''}"
        data-act="load" data-load="${id}" aria-pressed="${id === ctx.load}">${esc(label)}</button>`).join('')}
    </div>
    <div class="fuel-grid">
      ${blocks.map(b => `<article class="fuel-block">
        <span class="fuel-ic">${icon(b.icon, 18)}</span>
        <div>
          <div class="fuel-top"><span>${esc(b.title)}</span><b>${esc(b.value)}</b></div>
          <p class="tiny muted">${esc(b.body)}</p>
        </div>
      </article>`).join('')}
    </div>
    <p class="tiny muted fuel-foot">${icon('info', 13)}<span>Γενικές οδηγίες αθλητικής διατροφής ανά κιλό σωματικού βάρους. Δεν αντικαθιστούν αθλητικό γιατρό ή διαιτολόγο.</span></p>
  </section>`;
}

/* ── Cook Mode ─────────────────────────────────────────────────────────────
 * One step at a time, large enough to read from across a kitchen, with a real
 * timer pulled out of the step text, the ingredients weighed out FOR THE WHOLE
 * FAMILY, and each person's plate.
 */
export function cookBody(ctx, recipe) {
  const cook = ctx.cook || { step: 0, done: {} };
  const total = recipe.steps.length;
  const step = Math.max(0, Math.min(Number(cook.step) || 0, total - 1));
  const { timers, ovenC } = parseStepTimers(recipe.steps[step]);
  const done = cook.done || {};
  const plate = householdPlate(recipe, ctx.sizedProfiles || ctx.profiles, p => (p.athlete ? ctx.state?.trainingLoad || 'normal' : 'normal'));
  const last = step === total - 1;

  return `
  <div class="cook">
    <div class="cook-head slot-${recipe.slot}">
      ${artTile(recipe.id, recipe.slot, 68)}
      <div>
        <h3 class="cook-name">${esc(recipe.name)}</h3>
        <p class="tiny muted">${recipe.time}′ σύνολο · ${esc(SLOT_LABEL[recipe.slot])} · για ${num(ctx.profiles.length)} άτομα${ovenC ? ` · φούρνος ${ovenC}°C` : ''}</p>
      </div>
    </div>

    <div class="cook-cols">
      <div class="cook-main">
        <div class="cook-stepper">
          <button type="button" class="icon-btn" data-act="cookStep" data-to="${step - 1}"
            ${step === 0 ? 'disabled' : ''} aria-label="Προηγούμενο βήμα">${icon('chevronLeft', 20)}</button>
          <span class="cook-counter">Βήμα <b>${step + 1}</b> από ${total}</span>
          <button type="button" class="icon-btn" data-act="cookStep" data-to="${step + 1}"
            ${last ? 'disabled' : ''} aria-label="Επόμενο βήμα">${icon('chevronRight', 20)}</button>
        </div>

        <div class="cook-bar"><i style="width:${(((step + 1) / total) * 100).toFixed(1)}%"></i></div>

        <p class="cook-step">${esc(recipe.steps[step])}</p>

        ${timers.length ? `<div class="cook-timerbox">
          <div class="cook-timer">
            <span class="cook-timer-text" id="cookTimerText">${clockText(timers[0].seconds)}</span>
            <div class="cook-timer-actions">
              <button type="button" class="btn btn-primary" data-act="timerStart" data-sec="${timers[0].seconds}">${icon('clock', 16)} Έναρξη</button>
              <button type="button" class="btn" data-act="timerPause">Παύση</button>
              <button type="button" class="btn btn-ghost" data-act="timerReset">Μηδέν</button>
            </div>
          </div>
          ${timers.length > 1 ? `<div class="cook-timer-presets">${timers.map(t => `<button type="button" class="chip" data-act="timerStart" data-sec="${t.seconds}">${t.minutes}′</button>`).join('')}</div>` : ''}
        </div>` : ''}

        ${ovenC ? `<div class="notice notice-warn cook-oven">${icon('flame', 17)}<span>Προθέρμανση φούρνου στους <b>${ovenC}°C</b></span></div>` : ''}

        <ol class="cook-steplist">
          ${recipe.steps.map((s, i) => `<li class="${i === step ? 'is-current' : ''}${i < step ? ' is-done' : ''}">
            <button type="button" class="cook-steplink" data-act="cookStep" data-to="${i}">
              <b>${i + 1}</b><span>${esc(s)}</span>
            </button>
          </li>`).join('')}
        </ol>
      </div>

      <div class="cook-side">
        <div class="cook-block">
          <h4>${icon('package', 16)} Υλικά για όλη την οικογένεια</h4>
          <ul class="cook-ings">
            ${plate.lines.map((l, i) => `<li>
              <button type="button" class="cook-ing${done[i] ? ' is-done' : ''}" data-act="cookIng" data-i="${i}" aria-pressed="${!!done[i]}">
                <span class="cook-check">${done[i] ? icon('check', 12) : ''}</span>
                <span class="cook-ing-name">${esc(l.ing.n)}</span>
                <span class="cook-ing-qty">${esc(kitchenAmount(qtyOf(l.ing, l.totalG), l.ing.u))}</span>
              </button>
            </li>`).join('')}
          </ul>
        </div>

        <div class="cook-block">
          <h4>${icon('users', 16)} Στο πιάτο του καθενός</h4>
          <ul class="cook-portions">
            ${plate.members.map(m => {
              const p = (ctx.sizedProfiles || ctx.profiles).find(x => x.id === m.id);
              const lines = plateLines(recipe, p, p.athlete ? ctx.state?.trainingLoad || 'normal' : 'normal', 2);
              return `<li>${avatar(p, 30)}<span class="cp-body"><span class="cp-name">${esc(m.name)}</span><span class="cp-lines">${esc(lines.join(' · '))}</span></span><span class="cp-kcal">${num(m.kcal)} kcal</span></li>`;
            }).join('')}
          </ul>
          <p class="tiny muted">Οι ποσότητες κλιμακώνονται ανά μέλος: μέγεθος πιάτου και σύνθεση (περισσότερα λαχανικά, λιγότερο ρύζι κ.λπ.).</p>
        </div>
      </div>
    </div>
  </div>`;
}

/** Cook Mode's navigation lives in the sheet's footer, outside the scrolling body,
 *  so it is always under the thumb and never covers a step it should not. */
export function cookFooter(ctx, recipe) {
  const total = recipe.steps.length;
  const step = Math.max(0, Math.min(Number(ctx.cook?.step) || 0, total - 1));
  const last = step === total - 1;
  return `<div class="cook-nav">
    <button type="button" class="btn btn-ghost" data-act="closeSheet">${icon('x', 18)} Κλείσιμο</button>
    <button type="button" class="btn btn-primary btn-lg" data-act="cookStep" data-to="${step + 1}" ${last ? 'disabled' : ''}>
      ${last ? 'Τελευταίο βήμα' : 'Επόμενο βήμα'} ${icon('arrowRight', 18)}
    </button>
  </div>`;
}

/* ── Today ─────────────────────────────────────────────────────────────── */

export function todayView(ctx) {
  const { profile, sized, load, planDay, log, targets, totals, coverage, dateKey, streak, updateReady, onboarded, refs } = ctx;
  const completeness = ctx.completeness;
  const nudge = ctx.nudge;
  const nextSlot = nudge?.slot || SLOTS.find(s => log?.meals?.[s]?.status !== 'done' && log?.meals?.[s]?.status !== 'skipped') || null;
  const nextRecipe = nextSlot ? ctx.recipeById(planDay[nextSlot]) : null;
  const guidance = ctx.guidance;
  const ringValue = totals.confirmed.kcal;
  const water = log?.waterMl || 0;
  const glasses = Math.max(8, targets.hydration.glasses);

  return `
  <div class="page today">
  ${updateReady ? `<div class="update-banner">${icon('refresh', 18)}
    <span>Υπάρχει νέα έκδοση της εφαρμογής.</span>
    <button type="button" class="btn btn-sm btn-primary" data-act="reload">Ανανέωση τώρα</button></div>` : ''}

  ${!onboarded ? onboardingCard() : ''}

  <section class="dash-head">
    <div class="dash-greet">
      <div class="eyebrow">${esc(profile.role)}</div>
      <h1>${esc(greeting())}, <em>${esc(profile.name)}</em></h1>
    </div>
    <div class="dash-meta">
      <span class="date-chip">${icon('calendar', 16)}${esc(longDate(dateKey))} · ${esc(timeNow())}</span>
      ${streak > 0 ? `<span class="date-chip is-streak">${icon('flame', 16)}${num(streak)} ${streak === 1 ? 'ημέρα' : 'ημέρες'} σε σειρά</span>` : ''}
    </div>
  </section>

  <div class="today-grid">
  ${nextRecipe ? nextMealCard(ctx, nextSlot, nextRecipe) : `
  <section class="next-card next-done" aria-label="Ημέρα ολοκληρωμένη">
    <div class="next-copy">
      <span class="pill pill-accent pill-dot"><i></i> Ημέρα ολοκληρωμένη</span>
      <h2 class="next-title">Τα σημερινά γεύματα <em>καταγράφηκαν</em></h2>
      <p class="next-sub">Δεν υπάρχει άλλο γεύμα για σήμερα. Κράτα την ενυδάτωση ενημερωμένη και δες το αυριανό πλάνο.</p>
      <div class="next-actions">
        <button type="button" class="btn btn-primary btn-lg" data-act="nav" data-view="plan">${icon('calendar', 18)} Δες το πλάνο</button>
      </div>
    </div>
    <div class="next-art next-art-done">${icon('sparkles', 84)}</div>
  </section>`}

  <section class="card water-card tone-aqua" aria-label="Νερό">
    <div class="card-head">
      <div>
        <div class="eyebrow">${icon('droplet', 14)} Νερό</div>
        <div class="water-total"><b>${esc(mlToText(water))}</b><span class="muted"> από ${esc(mlToText(targets.hydration.ml))}</span></div>
      </div>
      <button type="button" class="btn btn-soft btn-sm water-add" data-act="water" data-delta="250">${icon('plus', 15)} 250 ml</button>
    </div>
    <div class="water-tracker">
      ${Array.from({ length: glasses }, (_, i) => `<button type="button" class="glass" data-act="water" data-set="${(i + 1) * 250}"
        aria-label="${i + 1} ποτήρια (${(i + 1) * 250} ml)" aria-pressed="${water >= (i + 1) * 250}">${glassIcon(water >= (i + 1) * 250)}</button>`).join('')}
    </div>
    <div class="water-actions">
      <button type="button" class="chip" data-act="water" data-delta="-250">${icon('minus', 14)} 250 ml</button>
      <button type="button" class="chip" data-act="water" data-set="0">Μηδέν</button>
      <span class="tiny muted">1 ποτήρι = 250 ml</span>
    </div>
  </section>

  <section class="kpi-row" aria-label="Η ημέρα με μια ματιά">
    ${kpi({
      label: 'Καταγεγραμμένη ενέργεια', value: num(ringValue), unit: 'kcal', iconName: 'flame', tone: 'accent',
      hero: true, trend: ringValue >= totals.planned.kcal * 0.9 && ringValue > 0 ? 'up' : null,
      progress: ringValue / Math.max(1, coverage.center),
      note: `Από εκτιμώμενες ${num(coverage.center)} kcal`
    })}
    ${kpi({
      label: 'Γεύματα', value: `${completeness.mealsDone}<small>/${completeness.mealsTotal}</small>`,
      iconName: 'checkCircle', tone: 'blue',
      progress: completeness.mealsTotal ? completeness.mealsDone / completeness.mealsTotal : 0,
      note: completeness.mealsTotal <= completeness.mealsDone
        ? 'Ολοκληρώθηκαν όλα'
        : (nudge?.state === 'overdue' && nudge?.label ? `Εκκρεμεί: ${nudge.label}` : `${completeness.mealsTotal - completeness.mealsDone} ακόμη σήμερα`)
    })}
    ${kpi({
      label: 'Ενυδάτωση', value: num(water), unit: 'ml', iconName: 'droplet', tone: 'aqua',
      progress: water / Math.max(1, targets.hydration.ml),
      note: `Στόχος ${mlToText(targets.hydration.ml)}`
    })}
    ${kpi({
      label: 'Πρωτεΐνη', value: num(totals.confirmed.p), unit: 'g', iconName: 'drumstick', tone: 'violet',
      progress: totals.confirmed.p / Math.max(1, targets.protein.min),
      note: `Εύρος ${num(targets.protein.min)}–${num(targets.protein.max)} g`
    })}
  </section>

  <section class="card card-lg meals-card" aria-label="Τα γεύματα της ημέρας">
    <div class="card-head">
      <div>
        <div class="eyebrow">Το πλάνο της ημέρας</div>
        <h2 class="card-title">Τα τέσσερα γεύματα</h2>
      </div>
      <span class="pill pill-neutral">${completeness.mealsDone}/${completeness.mealsTotal}<span class="hide-sm">&nbsp;ολοκληρώθηκαν</span></span>
    </div>
    <p class="tiny muted meals-note">Οι μερίδες είναι προσαρμοσμένες στο προφίλ σου${ctx.plate > 1 ? ` — μέγεθος πιάτου ×${num1(ctx.plate)}` : ''}. Πάτησε «Το έφαγα» όταν φας.</p>
    <div class="meal-list">
      ${SLOTS.map(slot => mealRow(ctx, slot, nextSlot)).join('')}
    </div>
    ${log?.extras?.length ? `<div class="extras">
      <div class="extras-head"><span class="card-title">Πρόσθετα σήμερα</span>
        <button type="button" class="chip" data-act="clearExtras">Καθαρισμός</button></div>
      ${log.extras.map(ex => {
        const r = ctx.recipeById(ex.recipeId);
        if (!r) return '';
        const m = mealMacros(r, sized, load, ex.portion ?? 1);
        return `<div class="extra-row"><span class="extra-check">${icon('check', 13)}</span>
          <span class="extra-name">${esc(r.name)}<span class="muted"> · ${esc(ex.portion)}× · ${num(m.kcal)} kcal</span></span>
          <button type="button" class="icon-btn sm" data-act="delExtra" data-id="${esc(ex.id)}" aria-label="Αφαίρεση">${icon('trash', 15)}</button></div>`;
      }).join('')}
    </div>` : ''}
  </section>

  ${personaCard(ctx)}
  ${fuelCard(ctx)}

  ${coverage.status === 'under' && coverage.extras.length ? coverageCard(ctx, coverage) : ''}

  <details class="disclosure day-details">
    <summary>${icon('chart', 18)} Λεπτομέρειες ημέρας: θρεπτικά, μακροθρεπτικά, γιατί αυτό σήμερα</summary>
    <div class="disclosure-body">
      <div class="detail-grid">
        <section class="card card-inset signals" aria-label="Θρεπτικά της ημέρας">
          <div class="card-head">
            <div>
              <div class="eyebrow">${icon('leaf', 14)} Θρεπτικά</div>
              <h3 class="card-title">Τι δίνει το σημερινό πλάνο</h3>
            </div>
          </div>
          <div class="stack signal-list">
            ${meter({ label: 'Φυτικές ίνες', value: totals.planned.fib, target: refs.fibre.g, unit: 'g', kind: 'goal', tone: 'accent', iconName: 'wheat', targetText: num(refs.fibre.g) })}
            ${meter({ label: 'Σίδηρος', value: totals.planned.fe, target: refs.iron.mg, unit: 'mg', kind: 'goal', tone: 'rose', iconName: 'drumstick', targetText: refs.iron.min !== refs.iron.max ? `${refs.iron.min}–${refs.iron.max}` : num(refs.iron.mg) })}
            ${meter({ label: 'Ασβέστιο', value: totals.planned.ca, target: refs.calcium.mg, unit: 'mg', kind: 'goal', tone: 'gold', iconName: 'bone', valueText: num(totals.planned.ca), targetText: num(refs.calcium.mg) })}
            ${meter({ label: 'Αλάτι από τα τρόφιμα', value: saltGrams(totals.planned.na), target: refs.sodium.saltG, unit: 'g', kind: 'limit', tone: 'blue', iconName: 'shaker', targetText: num1(refs.sodium.saltG) })}
          </div>
          <p class="tiny muted signal-note">${icon('info', 13)}<span>Εκτίμηση από τα υλικά του πλάνου. Δεν περιλαμβάνει αλάτι που προσθέτεις στο μαγείρεμα ή στο τραπέζι. Τιμές αναφοράς: EFSA (ίνες, σίδηρος, ασβέστιο) και ΠΟΥ (αλάτι).</span></p>
        </section>

        <section class="card card-inset macro-card">
          <div class="macro-ring">
            ${ring({
              value: ringValue, max: coverage.center, ghost: totals.planned.kcal, size: 168, stroke: 14,
              main: num(ringValue), sub: 'kcal σήμερα', tone: 'accent',
              caption: `Καταγεγραμμένες ${num(ringValue)} από εκτιμώμενες ${num(coverage.center)} kcal`
            })}
            <div class="legend legend-center">
              <span class="legend-item"><i></i>Καταγεγραμμένα</span>
              <span class="legend-item is-muted"><i></i>Πλάνο ${num(totals.planned.kcal)} kcal</span>
            </div>
          </div>
          <div class="stack">
            ${macroBar({ label: 'Πρωτεΐνη', value: totals.confirmed.p, target: targets.protein.min, tone: 'blue', iconName: 'drumstick', note: `Εύρος ${num(targets.protein.min)}–${num(targets.protein.max)} g` })}
            ${macroBar({ label: 'Υδατάνθρακες', value: totals.confirmed.c, target: Math.round(totals.planned.c), tone: 'gold', iconName: 'bread', note: 'Στόχος = το σημερινό πλάνο' })}
            ${macroBar({ label: 'Λιπαρά', value: totals.confirmed.f, target: Math.round(totals.planned.f), tone: 'rose', iconName: 'droplet', note: 'Κυρίως ελαιόλαδο, ξηροί καρποί, τυρί' })}
          </div>
        </section>
      </div>

      <section class="card card-inset why-today">
        <h3 class="card-title">Γιατί αυτό σήμερα</h3>
        <div class="stack">
          ${guidance.length ? guidance.map(t => `<div class="notice">${icon('info', 17)}<span>${esc(t)}</span></div>`).join('')
            : `<p class="muted tiny">Δεν υπάρχουν ειδικές σημειώσεις για σήμερα. Ακολούθησε το πλάνο και κατέγραψε ό,τι έγινε.</p>`}
        </div>
        <p class="tiny muted portion-note">${icon('target', 14)}<span>Σύνθεση πιάτου: ${esc(targets.portions.label)} · Λαχανικά ×${num1(targets.portions.vegetables)} · Πρωτεΐνη ×${num1(targets.portions.protein)} · Υδατάνθρακες ×${num1(targets.portions.carbs)} · Λιπαρά ×${num1(targets.portions.fats)}${ctx.plate > 1 ? ` · Μέγεθος πιάτου ×${num1(ctx.plate)}` : ''}</span></p>
      </section>
    </div>
  </details>
  </div>
  </div>`;
}

/** The one thing to do next: a big, friendly card. */
function nextMealCard(ctx, slot, recipe) {
  const { sized, load, nudge, targets } = ctx;
  const m = mealMacros(recipe, sized, load, 1);
  const state = nudge?.state;
  const kicker = state === 'overdue' ? 'Εκκρεμεί' : state === 'due' ? 'Ώρα για φαγητό' : 'Επόμενο γεύμα';
  const tone = state === 'overdue' ? 'warn' : 'accent';
  const when = nudge?.minutesUntil != null ? whenText(nudge.minutesUntil) : '';
  const lines = plateLines(recipe, sized, load, 3);
  return `
  <section class="next-card slot-${slot}" aria-label="Επόμενο γεύμα">
    <div class="next-copy">
      <div class="next-kicker">
        <span class="pill pill-${tone} pill-dot"><i></i>${esc(kicker)}${when ? ` · ${esc(when)}` : ''}</span>
        <span class="next-slot">${icon(SLOT_ICON[slot], 14)} ${esc(SLOT_LABEL[slot])} · ${esc(SLOT_TIME[slot])}</span>
      </div>
      <h2 class="next-title">${esc(recipe.name)}</h2>
      <p class="next-sub">Η μερίδα σου: <b>${num(m.kcal)} kcal</b> · πρωτεΐνη ${num(m.p)} g · ${recipe.time}′ προετοιμασία</p>
      ${lines.length ? `<p class="next-plate">${icon('bowl', 15)}<span><b>Στο πιάτο σου:</b> ${esc(lines.join(' · '))}</span></p>` : ''}
      <div class="next-actions">
        <button type="button" class="btn btn-primary btn-lg" data-act="meal" data-slot="${slot}" data-portion="1" data-recipe="${esc(recipe.id)}">${icon('check', 20)} Το έφαγα</button>
        <button type="button" class="btn btn-lg btn-quiet" data-act="cook" data-id="${esc(recipe.id)}">${icon('utensils', 18)} Μαγείρεμα</button>
        <button type="button" class="btn btn-ghost" data-act="recipe" data-id="${esc(recipe.id)}">Συνταγή ${icon('chevronRight', 15)}</button>
      </div>
    </div>
    <div class="next-art" aria-hidden="true">${illustration(RECIPE_ART[recipe.id], 200)}</div>
  </section>`;
}

/** One row of the day's meals: state at a glance, action one tap away. */
function mealRow(ctx, slot, nextSlot) {
  const { sized, load, planDay, log } = ctx;
  const plannedRecipe = ctx.recipeById(planDay[slot]);
  const entry = log?.meals?.[slot];
  const done = entry?.status === 'done';
  const skipped = entry?.status === 'skipped';
  const r = done && entry?.recipeId ? (ctx.recipeById(entry.recipeId) || plannedRecipe) : plannedRecipe;
  const swapped = !!(done && entry?.recipeId && r?.id !== plannedRecipe?.id);
  const m = mealMacros(r, sized, load, entry?.portion ?? 1);
  const state = done ? 'done' : skipped ? 'skipped' : slot === nextSlot ? 'next' : 'todo';

  const control = done
    ? `<span class="pill pill-accent">${icon('check', 13)} ${swapped ? 'Άλλο πιάτο · ' : ''}Έγινε ×${num1(entry.portion)}</span>`
    : skipped
      ? `<span class="pill pill-neutral">${icon('x', 13)} Παραλείφθηκε</span>`
      : `<button type="button" class="btn btn-sm ${state === 'next' ? 'btn-primary' : 'btn-soft'}" data-act="meal" data-slot="${slot}" data-portion="1" data-recipe="${esc(r.id)}">${icon('check', 15)} Το έφαγα</button>`;

  return `<article class="meal-row is-${state} slot-${slot}">
    <span class="meal-when"><span class="meal-slot-name">${esc(SLOT_LABEL[slot])}</span><span class="meal-time">${icon('clock', 12)}${esc(SLOT_TIME[slot])}</span></span>
    ${artTile(r.id, slot, 56)}
    <div class="meal-info">
      <button type="button" class="meal-name" data-act="recipe" data-id="${esc(r.id)}">${esc(r.name)}</button>
      <div class="meal-facts"><b>${num(m.kcal)}</b> kcal · Π ${num(m.p)} g · Υ ${num(m.c)} g · Λ ${num(m.f)} g</div>
      <details class="meal-more">
        <summary>${done || skipped ? 'Αλλαγή' : 'Άλλη μερίδα'}</summary>
        ${portionButtons(slot, entry, r.id)}
      </details>
    </div>
    <div class="meal-control">${control}</div>
  </article>`;
}

function onboardingCard() {
  return `<section class="card card-lg onboarding">
    <div class="card-head">
      <div>
        <div class="eyebrow">${icon('sparkles', 14)} Καλώς ήρθες</div>
        <h2 class="card-title">Τρία βήματα και είσαι έτοιμος</h2>
      </div>
      <button type="button" class="icon-btn sm" data-act="dismissOnboarding" aria-label="Απόκρυψη">${icon('x', 17)}</button>
    </div>
    <ol class="onboard-steps">
      <li><span class="onboard-n">1</span><span><b>Διάλεξε ποιος είσαι</b> από τα πρόσωπα πάνω. Οι μερίδες και οι κανόνες αλλάζουν ανά μέλος.</span></li>
      <li><span class="onboard-n">2</span><span><b>Πάτησε «Το έφαγα»</b> σε κάθε γεύμα. Χωρίς καταγραφή, τίποτα δεν θεωρείται κατανάλωση.</span></li>
      <li><span class="onboard-n">3</span><span><b>Δες τη Λίστα αγορών</b> — φτιάχνεται μόνη της από το πλάνο της εβδομάδας για όλη την οικογένεια.</span></li>
    </ol>
  </section>`;
}

function coverageCard(ctx, coverage) {
  const { sized, load } = ctx;
  return `<section class="card card-lg coverage tone-warn">
    <div class="card-head">
      <div>
        <div class="eyebrow">${icon('info', 14)} Λίγο ακόμα για σήμερα</div>
        <h2 class="card-title">Το πλάνο δίνει το ${pct(coverage.pct)} της ενέργειας που εκτιμάται για σένα</h2>
        <p class="muted tiny">Εκτιμώμενη ανάγκη ~${num(coverage.center)} kcal · το πλάνο δίνει ~${num(coverage.planned)} kcal · διαφορά ~${num(coverage.gapKcal)} kcal${coverage.proteinGap ? ` · και ~${num(coverage.proteinGap)} g πρωτεΐνης` : ''}.</p>
      </div>
    </div>
    <div class="notice notice-warn">${icon('info', 18)}<span>Ένα οικογενειακό μενού δεν μπορεί να καλύψει όλους. Πρόσθεσε ό,τι λείπει — η εφαρμογή προτείνει <b>μόνο προσθήκες</b>, ποτέ μείωση, και ποτέ περιορισμό για ανήλικο.</span></div>
    <div class="meal-actions extras-suggest">
      ${coverage.extras.map(r => {
        const m = mealMacros(r, sized, load, 1);
        return `<button type="button" class="chip" data-act="addExtra" data-recipe="${esc(r.id)}">
          ${icon('plus', 14)} ${esc(r.name)} <span class="muted">· ${num(m.kcal)} kcal</span></button>`;
      }).join('')}
    </div>
  </section>`;
}

/* ── Plan ──────────────────────────────────────────────────────────────── */

export function planView(ctx) {
  const { weekDays, weekOffset, dateKey, sized, load } = ctx;
  const thisWeek = cycleWeek();
  const shownWeek = ((thisWeek - 1 + weekOffset) % 4 + 4) % 4 + 1;

  return `
  <div class="page plan">
  <section class="page-head">
    <div class="eyebrow">Κύκλος 28 ημερών</div>
    <h1>Εβδομάδα ${shownWeek} <em>από τις 4</em></h1>
    <p>Ένας κοινός κύκλος Δευτέρα–Κυριακή. Οι μερίδες αλλάζουν ανά μέλος, το μενού όχι.</p>
  </section>

  <div class="card toolbar">
    <div class="week-nav">
      <button type="button" class="icon-btn" data-act="week" data-delta="-1" aria-label="Προηγούμενη εβδομάδα">${icon('chevronLeft', 18)}</button>
      <button type="button" class="icon-btn" data-act="week" data-delta="1" aria-label="Επόμενη εβδομάδα">${icon('chevronRight', 18)}</button>
      <span class="muted week-label">${weekOffset === 0 ? 'Αυτή η εβδομάδα' : weekOffset < 0 ? `${Math.abs(weekOffset)} ${Math.abs(weekOffset) === 1 ? 'εβδομάδα' : 'εβδομάδες'} πριν` : `${weekOffset} ${weekOffset === 1 ? 'εβδομάδα' : 'εβδομάδες'} μετά`}</span>
      ${weekOffset !== 0 ? `<button type="button" class="chip" data-act="week" data-reset="1">Επιστροφή</button>` : ''}
    </div>
    <div class="sec-action">
      <button type="button" class="btn btn-sm btn-soft" data-act="nav" data-view="shopping">${icon('cart', 16)} Λίστα αγορών</button>
      <button type="button" class="btn btn-sm btn-ghost" data-act="print">${icon('printer', 16)} Εκτύπωση</button>
    </div>
  </div>

  <div class="week-strip">
    ${weekDays.map(d => {
      const kcal = SLOTS.reduce((sum, slot) => sum + mealMacros(d.recipeById(d.plan[slot]), sized, load, 1).kcal, 0);
      const isToday = d.date === dateKey;
      return `<article class="day-card ${isToday ? 'is-today' : ''}">
        <div class="day-head">
          <div>
            <div class="day-dow">${isToday ? 'Σήμερα' : esc(GREEK_DAYS_SHORT[weekdayIndex(d.dateObj)])}</div>
            <h2>${esc(shortDate(d.date))}</h2>
          </div>
          <span class="day-kcal">${num(kcal)}<small> kcal</small></span>
        </div>
        <div class="day-slots">
        ${SLOTS.map(slot => {
          const r = d.recipeById(d.plan[slot]);
          return `<div class="day-slot slot-${slot}"><i aria-hidden="true"></i><span class="day-slot-label">${esc(SLOT_LABEL[slot])}</span><b>${esc(r.name)}</b></div>`;
        }).join('')}
        </div>
        <button type="button" class="btn btn-sm btn-ghost btn-block" data-act="day" data-date="${esc(d.date)}">${icon('eye', 15)} Λεπτομέρειες</button>
      </article>`;
    }).join('')}
  </div>

  <div class="grid g2 plan-lower">
    <section class="card card-lg">
      ${sectionHead({ eyebrow: 'Προετοιμασία', title: 'Μαγείρεψε μία φορά, φάε όλη την εβδομάδα', sub: 'Τέσσερις κινήσεις που καλύπτουν το μεγαλύτερο μέρος της εβδομάδας.' })}
      <div class="batch-list">
        ${[
          ['Ένα όσπριο σε μεγάλη κατσαρόλα', 'Φακές, ρεβίθια ή φασόλια — κρατούν 3–4 ημέρες στο ψυγείο.'],
          ['Ένα ταψί πρωτεΐνης', 'Κοτόπουλο ή μπιφτέκια. Κόβεται σε μερίδες και μπαίνει σε ταπεράκια.'],
          ['Ένα μαγειρεμένο δημητριακό', 'Ρύζι ή ζυμαρικά ολικής. Γίνεται βάση για δύο διαφορετικά βραδινά.'],
          ['Πλυμένα & κομμένα λαχανικά', 'Σε δοχείο στο ψυγείο — γλιτώνεις 20 λεπτά κάθε βράδυ.']
        ].map(([t, s]) => `<div class="batch-item">${icon('checkCircle', 20)}<span><b>${esc(t)}</b><span class="muted">${esc(s)}</span></span></div>`).join('')}
      </div>
    </section>

    <section class="card card-lg">
      ${sectionHead({ eyebrow: 'Έλεγχος', title: 'Πόσο καλύπτει το πλάνο κάθε μέλος', sub: 'Το ίδιο μενού, διαφορετικές ανάγκες — με το μέγεθος πιάτου του καθενός.' })}
      <div class="bc">
        ${ctx.coverageByMember.map(c => `<div class="bc-row">
          <span class="bc-label">${esc(c.name)}</span>
          <span class="bc-track"><span class="bc-fill tone-${c.status === 'under' ? 'gold' : 'accent'}" style="width:${Math.min(100, c.pct * 100).toFixed(1)}%"></span></span>
          <span class="bc-val">${pct(c.pct)}</span>
        </div>`).join('')}
      </div>
      <p class="muted tiny plan-note">Ποσοστό κάλυψης της εκτιμώμενης ενεργειακής ανάγκης από το κοινό μενού, στη μερίδα του καθενός.</p>
    </section>
  </div>
  </div>`;
}

/* ── Meals library ─────────────────────────────────────────────────────── */

export function mealsView(ctx) {
  const { recipes, filters, sized, load } = ctx;
  const q = filters.q.trim().toLowerCase();
  const tagsOf = r => [...r.tags, ...nutritionBadges(r).map(b => `b:${b.id}`)];
  let list = recipes.filter(r => {
    if (filters.slot && r.slot !== filters.slot) return false;
    if (filters.tag && !tagsOf(r).includes(filters.tag)) return false;
    if (!q) return true;
    return r.name.toLowerCase().includes(q)
      || r.ingredients.some(i => i.n.toLowerCase().includes(q))
      || r.tags.some(t => t.toLowerCase().includes(q));
  });
  const kcalOf = r => mealMacros(r, sized, load, 1).kcal;
  if (filters.sort === 'time') list = [...list].sort((a, b) => a.time - b.time);
  if (filters.sort === 'kcal') list = [...list].sort((a, b) => kcalOf(a) - kcalOf(b));
  if (filters.sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'el'));

  const tags = [['', 'Όλα'], ['fast', 'Γρήγορα'], ['batch', 'Μαζικό μαγείρεμα'], ['legume', 'Όσπρια'], ['fish', 'Ψάρι'], ['veg', 'Λαχανικά'], ['b:protein', 'Υψηλή πρωτεΐνη'], ['b:iron', 'Πλούσιο σε σίδηρο'], ['b:fibre', 'Πλούσιο σε ίνες'], ['athlete', 'Αθλητής']];

  return `
  <div class="page meals">
  <section class="page-head">
    <div class="eyebrow">Βιβλιοθήκη συνταγών</div>
    <h1>${recipes.length} συνταγές, <em>μετρημένες</em></h1>
    <p>Κάθε συνταγή έχει ακριβείς ποσότητες, θρεπτικά υπολογισμένα από τα υλικά της και μερίδες για όλη την οικογένεια.</p>
  </section>

  <div class="card filter-card">
    <div class="filters">
      <span class="search-wrap">${icon('search', 18)}
        <input type="search" id="recipeSearch" placeholder="Αναζήτηση συνταγής ή υλικού…" value="${esc(filters.q)}" aria-label="Αναζήτηση συνταγών">
      </span>
      <select id="recipeSort" aria-label="Ταξινόμηση" class="sort-select">
        <option value="slot" ${filters.sort === 'slot' ? 'selected' : ''}>Τυπική σειρά</option>
        <option value="time" ${filters.sort === 'time' ? 'selected' : ''}>Πιο γρήγορα</option>
        <option value="kcal" ${filters.sort === 'kcal' ? 'selected' : ''}>Λιγότερες kcal</option>
        <option value="name" ${filters.sort === 'name' ? 'selected' : ''}>Αλφαβητικά</option>
      </select>
    </div>
    <div class="filters scroll">
      ${[['', 'Όλα τα γεύματα'], ['breakfast', 'Πρωινό'], ['lunch', 'Μεσημεριανό'], ['snack', 'Σνακ'], ['dinner', 'Βραδινό']]
        .map(([v, l]) => `<button type="button" class="chip ${filters.slot === v ? 'active' : ''}" data-act="filter" data-key="slot" data-value="${v}">${esc(l)}</button>`).join('')}
    </div>
    <div class="filters scroll">
      ${tags.map(([v, l]) => `<button type="button" class="chip ${filters.tag === v ? 'active' : ''}" data-act="filter" data-key="tag" data-value="${v}">${esc(l)}</button>`).join('')}
    </div>
  </div>

  ${list.length ? `<div class="recipe-grid">
    ${list.map(r => {
      const m = mealMacros(r, sized, load, 1);
      return `<button type="button" class="recipe-card slot-${r.slot}" data-act="recipe" data-id="${esc(r.id)}">
        <span class="recipe-art">${illustration(RECIPE_ART[r.id], 108)}
          <span class="recipe-time">${icon('clock', 12)} ${r.time}′</span></span>
        <span class="recipe-body">
          ${slotTag(r.slot)}
          <span class="recipe-title">${esc(r.name)}</span>
          <span class="recipe-ing">${r.ingredients.slice(0, 4).map(i => esc(i.n)).join(' · ')}${r.ingredients.length > 4 ? ' …' : ''}</span>
          ${badgeRow(r)}
          <span class="recipe-foot"><b>${num(m.kcal)}</b> kcal · Π ${num(m.p)} g<span class="recipe-go">Για ${esc(ctx.profile.name)} ${icon('chevronRight', 14)}</span></span>
        </span>
      </button>`;
    }).join('')}
  </div>` : emptyState({
    iconName: 'search', title: 'Καμία συνταγή δεν ταιριάζει',
    body: 'Δοκίμασε άλλη λέξη ή καθάρισε τα φίλτρα.',
    action: `<button type="button" class="btn btn-sm" data-act="filter" data-key="reset" data-value="1">Καθαρισμός φίλτρων</button>`
  })}
  </div>`;
}

/* ── Recipe detail (rendered inside a sheet) ───────────────────────────── */

export function recipeDetail(ctx, recipe) {
  const members = ctx.sizedProfiles || ctx.profiles;
  const loadFor = p => (p.athlete ? ctx.state.trainingLoad : 'normal');
  const plate = householdPlate(recipe, members, loadFor);
  const me = members.find(p => p.id === ctx.profile.id) || members[0];
  const mine = mealMacros(recipe, me, loadFor(me), 1);
  const refs = referenceValues(ctx.profile);
  const badges = nutritionBadges(recipe);

  const nut = (label, value, unit, ref, ic, tone, kind = 'goal', refText = null) => meter({
    label, value, target: ref, unit, kind, tone, iconName: ic, targetText: refText ?? num1(ref)
  });

  return `<div class="recipe-detail">
    <div class="rd-head slot-${recipe.slot}">
      ${artTile(recipe.id, recipe.slot, 96)}
      <div>
        ${slotTag(recipe.slot)}
        <h2 class="rd-title">${esc(recipe.name)}</h2>
        <p class="muted tiny">${recipe.time}′ προετοιμασία · ${recipe.ingredients.length} υλικά · για ${num(members.length)} άτομα</p>
        ${badges.length ? `<div class="badge-row">${badges.map(b => `<span class="pill pill-${b.tone}">${esc(b.label)}</span>`).join('')}</div>` : ''}
      </div>
    </div>

    <section class="rd-section">
      <h3>Υλικά για όλη την οικογένεια</h3>
      <div class="ing-table">
        ${plate.lines.map(l => `<div class="ing-row"><span>${esc(l.ing.n)}</span><span class="ing-qty">${esc(kitchenAmount(qtyOf(l.ing, l.totalG), l.ing.u))}</span></div>`).join('')}
      </div>
      <details class="rd-more">
        <summary>Πόσο για τον καθένα</summary>
        <div class="plate-table-wrap">
          <table class="plate-table">
            <thead><tr><th scope="col">Υλικό</th>${members.map(p => `<th scope="col">${avatar(p, 26)}<span class="sr-only">${esc(p.name)}</span></th>`).join('')}</tr></thead>
            <tbody>
              ${plate.lines.map(l => `<tr><th scope="row">${esc(l.ing.n)}</th>${l.perMember.map(pm => `<td>${esc(kitchenAmount(qtyOf(l.ing, pm.g), l.ing.u).replace(' τεμ', ''))}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
        <p class="tiny muted">Οι ποσότητες είναι ωμές. Κάθε μέλος έχει δικό του μέγεθος πιάτου και σύνθεση — π.χ. λιγότερο ρύζι και περισσότερα λαχανικά για όποιον προσέχει τη ζυγαριά.</p>
      </details>
    </section>

    <section class="rd-section">
      <h3>Στο πιάτο του καθενός</h3>
      <div class="member-scale">
        ${plate.members.map(m => {
          const p = members.find(x => x.id === m.id);
          const lines = plateLines(recipe, p, loadFor(p), 3);
          return `<div class="scale-row ${p.id === ctx.profile.id ? 'is-current' : ''}">
            ${avatar(p, 38)}
            <span class="scale-body"><span class="scale-name">${esc(m.name)}</span>
              <span class="scale-lines">${esc(lines.join(' · '))}</span>
              <span class="scale-macros">Π ${num(m.p)} · Υ ${num(m.c)} · Λ ${num(m.f)} g</span></span>
            <span class="scale-kcal">${num(m.kcal)} <small class="muted">kcal</small></span>
          </div>`;
        }).join('')}
      </div>
      <p class="muted tiny">Οι θερμίδες υπολογίζονται από τα macros με τους συντελεστές των ετικετών της ΕΕ (4/4/9, ίνες 2) — δεν αποθηκεύονται χωριστά, ώστε να μη μπορούν να διαφωνήσουν. Οι υδατάνθρακες δεν περιλαμβάνουν τις ίνες, όπως στις ετικέτες.</p>
    </section>

    <section class="rd-section">
      <h3>Θρεπτικά για ${esc(ctx.profile.name)}</h3>
      <div class="nut-grid">
        ${nut('Πρωτεΐνη', mine.p, 'g', ctx.targets.protein.min, 'drumstick', 'blue', 'goal', `${ctx.targets.protein.min}+`)}
        ${nut('Φυτικές ίνες', mine.fib, 'g', refs.fibre.g, 'wheat', 'accent')}
        ${nut('Σίδηρος', mine.fe, 'mg', refs.iron.mg, 'drumstick', 'rose')}
        ${nut('Ασβέστιο', mine.ca, 'mg', refs.calcium.mg, 'bone', 'gold', 'goal', num(refs.calcium.mg))}
        ${nut('Αλάτι από τα υλικά', saltGrams(mine.na), 'g', refs.sodium.saltG, 'shaker', 'blue', 'limit')}
      </div>
      <p class="muted tiny">Τα ποσοστά συγκρίνουν αυτό το γεύμα με ολόκληρη την ημερήσια τιμή αναφοράς (EFSA · ΠΟΥ). Ένα γεύμα δεν χρειάζεται να τη γεμίσει — αρκεί η εβδομάδα.</p>
    </section>

    <section class="rd-section">
      <h3>Εκτέλεση</h3>
      <ol class="rd-steps">
        ${recipe.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}
      </ol>
    </section>

    ${recipe.tip ? `<div class="notice notice-info">${icon('sparkles', 18)}<span>${esc(recipe.tip)}</span></div>` : ''}

    <div class="rd-actions">
      <button type="button" class="btn btn-primary btn-lg" data-act="cook" data-id="${esc(recipe.id)}">${icon('utensils', 18)} Μαγείρεψε βήμα-βήμα</button>
      <button type="button" class="btn btn-lg" data-act="meal" data-slot="${esc(recipe.slot)}" data-portion="1" data-recipe="${esc(recipe.id)}">${icon('check', 18)} Το έφαγα τώρα</button>
      <button type="button" class="btn btn-lg btn-ghost" data-act="addExtra" data-recipe="${esc(recipe.id)}">${icon('plus', 18)} Πρόσθεσέ το σήμερα</button>
    </div>
  </div>`;
}

/* ── Shopping ──────────────────────────────────────────────────────────── */

export function shoppingView(ctx) {
  const { shopList, shopChecked, shopStats, weekOffset, shopFilter = 'all', shopMembers = 0, roleServings } = ctx;
  const thisWeek = cycleWeek();
  const shownWeek = ((thisWeek - 1 + weekOffset) % 4 + 4) % 4 + 1;

  const isChecked = i => !!shopChecked[i.key];
  const visible = shopFilter === 'todo' ? shopList.filter(i => !isChecked(i))
    : shopFilter === 'done' ? shopList.filter(isChecked)
    : shopList;

  const chips = [
    ['all', 'Όλα', shopStats.total, 'package'],
    ['todo', 'Απομένουν', shopStats.remaining, 'cart'],
    ['done', 'Στο καλάθι', shopStats.checked, 'check']
  ].map(([value, label, count, ic]) =>
    `<button type="button" class="shop-chip${shopFilter === value ? ' is-on' : ''}"
       data-act="shopFilter" data-value="${value}" aria-pressed="${shopFilter === value}">
      ${icon(ic, 15)}${esc(label)}<span class="shop-chip-n">${num(count)}</span>
    </button>`).join('');

  const done = shopStats.total > 0 && shopStats.remaining === 0;

  const aisleSections = AISLES.map(aisle => {
    const items = visible.filter(i => i.aisle === aisle.id);
    if (!items.length) return '';
    const aisleAll = shopList.filter(i => i.aisle === aisle.id);
    const aisleDone = aisleAll.filter(isChecked).length;
    const complete = aisleDone === aisleAll.length;
    return `<section class="shop-aisle-sec">
      <div class="shop-aisle-head">
        <span class="shop-aisle-ic">${icon(aisle.icon, 17)}</span>
        <span class="shop-aisle-name">${esc(aisle.label)}</span>
        <span class="shop-aisle-count ${complete ? 'is-complete' : ''}">${icon(complete ? 'check' : 'cart', 13)}${aisleDone}/${aisleAll.length}</span>
      </div>
      <div class="shop-aisle">
        ${items.map(i => `<div class="shop-item ${isChecked(i) ? 'is-checked' : ''}">
          <button type="button" class="shop-check" data-act="shop" data-key="${esc(i.key)}" aria-label="${esc(i.name)}" aria-pressed="${isChecked(i)}">${icon('check', 15)}</button>
          <span class="shop-meta"><span class="shop-name">${esc(i.name)}</span>
            <span class="shop-src">σε ${i.meals} ${i.meals === 1 ? 'γεύμα' : 'γεύματα'}</span></span>
          <span class="shop-qty">${esc(shopAmount(i.qty, i.unit))}</span>
        </div>`).join('')}
      </div>
    </section>`;
  }).join('');

  const rs = roleServings || { protein: 0, carbs: 0, fats: 0, vegetables: 0 };

  return `
  <div class="page shopping">
  <section class="page-head">
    <div class="eyebrow">Λίστα αγορών</div>
    <h1>Εβδομάδα ${shownWeek}: <em>${num(done ? shopStats.total : shopStats.remaining)}</em> ${done ? 'είδη — έτοιμη' : (shopStats.remaining === 1 ? 'είδος ακόμη' : 'είδη ακόμη')}</h1>
    <p>Φτιαγμένη από το πραγματικό εβδομαδιαίο μενού για ${num(shopMembers)} άτομα, ομαδοποιημένη όπως είναι τα ράφια του μαγαζιού.</p>
  </section>

  <div class="card shop-head">
    <div class="shop-progress">
      <span class="shop-progress-ic ${done ? 'is-done' : ''}">${icon(done ? 'check' : 'cart', 22)}</span>
      <div class="shop-progress-body">
        <div class="card-title">${done ? 'Τα πήρες όλα' : `${num(shopStats.checked)} από ${num(shopStats.total)} στο καλάθι`}</div>
        <div class="mb-track shop-bar"><div class="mb-fill" style="width:${(shopStats.pct * 100).toFixed(1)}%"></div></div>
      </div>
      <div class="sec-action shop-actions">
        <button type="button" class="btn btn-sm btn-ghost" data-act="shopReset">${icon('refresh', 15)} Καθαρισμός</button>
        <button type="button" class="btn btn-sm btn-ghost" data-act="shopCopy">${icon('clipboard', 15)} Αντιγραφή</button>
        <button type="button" class="btn btn-sm" data-act="print">${icon('printer', 15)} Εκτύπωση</button>
      </div>
    </div>
    <div class="shop-chips" role="group" aria-label="Φίλτρο λίστας">${chips}</div>
  </div>

  ${done ? `<div class="shop-done">${icon('sparkles', 24)}
    <div><b>Έτοιμη.</b> Και τα ${num(shopStats.total)} είδη είναι στο καλάθι. Πάτησε «Καθαρισμός» για να ξαναρχίσεις την επόμενη εβδομάδα.</div></div>` : ''}

  ${visible.length ? `<div class="shop-aisles">${aisleSections}</div>` : emptyState({
    iconName: shopFilter === 'done' ? 'cart' : 'check',
    title: shopFilter === 'done' ? 'Δεν έχεις τσεκάρει ακόμη κάτι' : 'Τίποτα δεν απομένει',
    body: shopFilter === 'done'
      ? 'Μόλις τσεκάρεις ένα είδος στον διάδρομο, θα εμφανιστεί εδώ μαζί με τα υπόλοιπα.'
      : 'Όλα τα είδη της εβδομάδας είναι στο καλάθι. Άλλαξε φίλτρο για να δεις ολόκληρη τη λίστα.'
  })}

  <details class="disclosure why">
    <summary>${icon('info', 18)} Γιατί αυτές οι ποσότητες;</summary>
    <div class="disclosure-body">
      <p>Οι ποσότητες βγαίνουν από τις <b>πραγματικές συνταγές</b> του εβδομαδιαίου πλάνου, όχι από γενικές εκτιμήσεις:</p>
      <ul class="why-list">
        <li>Κάθε υλικό μετριέται με τη <b>μερίδα αναφοράς</b> του (π.χ. γιαούρτι 200 g για έναν ενήλικα) και κλιμακώνεται ξεχωριστά για κάθε μέλος.</li>
        <li>Οι μερίδες δεν είναι ίδιες για όλους: το άθροισμα για τα <b>${num(shopMembers)} μέλη</b> είναι <b>${num1(rs.protein)} μερίδες αναφοράς</b> πρωτεΐνης, ${num1(rs.carbs)} υδατανθράκων, ${num1(rs.fats)} λιπαρών και ${num1(rs.vegetables)} λαχανικών — όχι ${num(shopMembers)} για όλα.</li>
        <li>Τα ίδια υλικά από διαφορετικές συνταγές ενώνονται σε μία γραμμή (π.χ. όλα τα αυγά της εβδομάδας μαζί).</li>
        <li>Οι τελικές ποσότητες <b>στρογγυλοποιούνται προς τα πάνω</b> σε λογικές μονάδες αγοράς (250 g ντομάτες, ένα εξάδι αυγά, 50 ml λάδι), ώστε να μη σου λείψει υλικό.</li>
      </ul>
      <p class="why-note">${icon('shield', 14)}<span>Για ανήλικα μέλη η λίστα <b>δεν εφαρμόζει ποτέ μείωση μερίδας</b>. Για ενήλικα σε πρόγραμμα σταδιακής απώλειας, το πιάτο είναι ελαφρύτερο (λιγότερο ρύζι και ψωμί, περισσότερα λαχανικά) και η λίστα το λαμβάνει υπόψη.</span></p>
    </div>
  </details>
  </div>`;
}

/* ── Progress ──────────────────────────────────────────────────────────── */

export function progressView(ctx) {
  const { profile, trend, streak, heatCells, measurements, weekAdherence, dateKey } = ctx;
  const adultBmi = canUseAdultBmi(profile);
  const bmiValue = bmi(profile);

  return `
  <div class="page progress">
  <section class="page-head">
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

  ${!adultBmi ? `<div class="notice notice-info progress-note">${icon('shield', 18)}
    <span><b>Για ηλικίες κάτω των 20</b> το ZENITH δεν εμφανίζει κατηγορίες BMI ενηλίκων. Παιδιά και έφηβοι χρειάζονται αξιολόγηση με καμπύλες ανάπτυξης ανά ηλικία και φύλο — όχι τιμές ενηλίκων.</span></div>` : ''}

  <section class="card card-lg trend-card">
    <div class="card-head">
      <div><div class="eyebrow">Τάση βάρους</div>
        <h2 class="card-title">${trend.count >= 2 ? `${num1(trend.change)} kg σε ${num(trend.spanDays)} ημέρες` : 'Χρειάζονται τουλάχιστον δύο μετρήσεις'}</h2></div>
      ${trend.slopePerWeek != null ? pill(`${trend.slopePerWeek > 0 ? '+' : ''}${num1(trend.slopePerWeek)} kg / εβδομάδα`, trend.direction === 'flat' ? 'neutral' : 'accent') : ''}
    </div>
    ${trend.count >= 2
      ? lineChart(trend.points.map(p => ({ x: shortDate(p.date), y: p.weight })), { height: 190, unit: 'kg' })
      : emptyState({ iconName: 'trend', title: 'Δεν υπάρχουν αρκετές μετρήσεις', body: 'Κατέγραψε βάρος μία φορά την εβδομάδα, την ίδια ώρα της ημέρας, για να φανεί τάση.' })}
    ${trend.count >= 2 ? `<p class="muted tiny trend-note">Η γραμμή είναι ευθεία ελαχίστων τετραγώνων πάνω στις καταγραφές σου. Μία μέτρηση είναι θόρυβος — η κλίση εβδομάδων είναι το σήμα.</p>` : ''}
  </section>

  <div class="grid g2 progress-mid">
    <section class="card card-lg">
      <div class="card-head"><h2 class="card-title">Καταγραφή βάρους</h2></div>
      <form class="form" id="measureForm">
        <div class="grid g2">
          <div class="field"><label for="mDate">Ημερομηνία</label><input id="mDate" name="date" type="date" value="${esc(dateKey)}" required></div>
          <div class="field"><label for="mWeight">Βάρος (kg)</label><input id="mWeight" name="weight" type="number" min="20" max="300" step="0.1" value="${measurements.at(-1)?.weight ?? profile.weight}" required></div>
        </div>
        <div class="field"><label for="mNote">Σημείωση (προαιρετικά)</label>
          <input id="mNote" name="note" type="text" maxlength="80" placeholder="π.χ. πρωί, νηστικός"></div>
        <button class="btn btn-primary btn-lg" type="submit">${icon('check', 18)} Αποθήκευση μέτρησης</button>
      </form>
    </section>

    <section class="card card-lg">
      <div class="card-head"><h2 class="card-title">Τελευταίες 28 ημέρες</h2>
        <span class="pill pill-neutral">${num(ctx.loggedDays28)} / 28</span></div>
      ${heatmap(heatCells, { todayKey: dateKey })}
      <p class="muted tiny heat-note">Κάθε τετράγωνο είναι μία ημέρα. Όσο πιο σκούρο, τόσο περισσότερα γεύματα καταγράφηκαν.</p>
    </section>
  </div>

  <section class="card card-lg week-card">
    <div class="card-head"><h2 class="card-title">Αυτή η εβδομάδα</h2></div>
    ${barChart(ctx.weekDays.map(d => ({ label: GREEK_DAYS_SHORT[weekdayIndex(d.dateObj)], value: (weekAdherence.find(w => w.date === d.date)?.meals) || 0, tone: d.date === dateKey ? 'accent' : 'blue' })), { unit: '', max: 4 })}
    <p class="muted tiny">Γεύματα που επιβεβαιώθηκαν ανά ημέρα (μέγιστο 4).</p>
  </section>

  <section class="card card-lg card-flush history-card">
    <div class="history-head"><h2 class="card-title">Ιστορικό μετρήσεων</h2></div>
    ${measurements.length ? `<div class="history-body">
      <div class="ing-table">
        ${[...measurements].reverse().map(m => `<div class="ing-row">
          <span>${esc(longDate(m.date))}${m.note ? ` <span class="muted tiny">· ${esc(m.note)}</span>` : ''}</span>
          <span class="history-actions">
            <span class="ing-qty">${num1(m.weight)} kg</span>
            <button type="button" class="icon-btn sm" data-act="delMeasure" data-id="${esc(m.id)}" aria-label="Διαγραφή μέτρησης ${esc(m.date)}">${icon('trash', 15)}</button>
          </span></div>`).join('')}
      </div>
    </div>` : `<div class="history-body"><p class="muted tiny">Δεν υπάρχουν καταγεγραμμένες μετρήσεις ακόμη.</p></div>`}
  </section>
  </div>`;
}

/* ── Family ────────────────────────────────────────────────────────────── */

export function familyView(ctx) {
  return `
  <div class="page family">
  <section class="page-head">
    <div class="eyebrow">Οικογένεια</div>
    <h1>Προφίλ & <em>κανόνες ασφάλειας</em></h1>
    <p>Οι ρυθμίσεις του προφίλ καθορίζουν ποια διατροφική λογική επιτρέπεται — όχι το αντίστροφο.</p>
  </section>

  <div class="grid g2 member-grid">
    ${ctx.profiles.map(p => {
      const t = ctx.targetsByMember[p.id];
      const refs = referenceValues(p);
      const plate = ctx.platesByMember?.[p.id] ?? 1;
      return `<section class="card card-lg family-card ${p.id === ctx.profile.id ? 'is-current' : ''}" style="--pa:${esc(p.accent)}">
        <div class="card-head">
          <div class="family-who">
            ${avatar(p, 52)}
            <div>
              <h2 class="card-title">${esc(p.name)}${p.relation ? ` <span class="rel-tag">${esc(p.relation)}</span>` : ''}</h2>
              <div class="muted tiny">${esc(p.role)}</div>
            </div>
          </div>
          <div class="sec-action">
            ${p.athlete ? pill('Αθλητής', 'gold', 'zap') : ''}
            ${isMinor(p) ? pill('Ανήλικος', 'blue', 'shield') : ''}
          </div>
        </div>
        <div class="grid g3 family-stats">
          ${stat({ label: 'Ενέργεια', value: `${num(t.energy.lower)}–${num(t.energy.upper)}`, unit: 'kcal', iconName: 'flame', tone: 'gold' })}
          ${stat({ label: 'Πρωτεΐνη', value: `${num(t.protein.min)}–${num(t.protein.max)}`, unit: 'g', iconName: 'drumstick', tone: 'blue' })}
          ${stat({ label: 'Υγρά', value: mlToText(t.hydration.ml), iconName: 'droplet', tone: 'aqua' })}
        </div>
        <ul class="family-refs">
          <li><span>${icon('wheat', 15)} Ίνες</span><b>≥ ${num(refs.fibre.g)} g</b></li>
          <li><span>${icon('drumstick', 15)} Σίδηρος</span><b>${refs.iron.min !== refs.iron.max ? `${refs.iron.min}–${refs.iron.max}` : refs.iron.mg} mg</b></li>
          <li><span>${icon('bone', 15)} Ασβέστιο</span><b>${num(refs.calcium.mg)} mg</b></li>
          <li><span>${icon('shaker', 15)} Αλάτι</span><b>&lt; ${num1(refs.sodium.saltG)} g</b></li>
          <li><span>${icon('bowl', 15)} Πιάτο</span><b>×${num1(plate)}${plate >= PLATE_MAX ? ' (μέγιστο)' : ''}</b></li>
        </ul>
        <div class="meal-actions">
          <button type="button" class="btn btn-sm" data-act="editMember" data-id="${esc(p.id)}">${icon('edit', 15)} Επεξεργασία</button>
          <button type="button" class="btn btn-sm btn-ghost" data-act="member" data-id="${esc(p.id)}">Προβολή</button>
          ${ctx.profiles.length > 1 ? `<button type="button" class="btn btn-sm btn-danger" data-act="delMember" data-id="${esc(p.id)}">${icon('trash', 15)} Διαγραφή</button>` : ''}
        </div>
      </section>`;
    }).join('')}
    <section class="card card-lg add-member">
      ${emptyState({ iconName: 'users', title: 'Προσθήκη μέλους', body: 'Νέο προφίλ με δικούς του κανόνες και μερίδες.',
        action: `<button type="button" class="btn btn-primary" data-act="addMember">${icon('plus', 16)} Νέο μέλος</button>` })}
    </section>
  </div>

  <section class="card card-lg family-safety">
    ${sectionHead({ eyebrow: 'Ασφάλεια', title: 'Τι προστατεύει η εφαρμογή' })}
    <div class="batch-list">
      ${SAFETY.map(s => `<div class="batch-item">${icon('shield', 20)}<span>${esc(s)}</span></div>`).join('')}
    </div>
  </section>
  </div>`;
}

/* ── Guide / evidence ──────────────────────────────────────────────────── */

export function guideView(ctx) {
  const d = ctx.diagnostics;
  const facts = DATA_FACTS;
  return `
  <div class="page guide">
  <section class="page-head">
    <div class="eyebrow">Μεθοδολογία & πηγές</div>
    <h1>Πώς βγαίνει <em>κάθε νούμερο</em></h1>
    <p>Κάθε εκτίμηση της εφαρμογής προέρχεται από δημοσιευμένη μέθοδο ή επίσημη τιμή αναφοράς. Εδώ είναι όλη η αλυσίδα, χωρίς μαύρα κουτιά.</p>
  </section>

  <div class="grid g2 method-grid">
    ${METHOD.map(m => `<section class="card">
      <div class="card-head method-head">
        <span class="method-ic tone-accent">${icon(m.icon, 18)}</span>
        <h2 class="card-title">${esc(m.title)}</h2>
      </div>
      <p class="method-body">${esc(m.body)}</p>
    </section>`).join('')}
  </div>

  <section class="card card-lg data-card">
    ${sectionHead({ eyebrow: 'Δεδομένα τροφίμων', title: 'Από πού προέρχονται τα θρεπτικά', sub: 'Τα macros και τα μικροθρεπτικά κάθε συνταγής υπολογίζονται από τα γραμμάρια των υλικών της — δεν είναι πληκτρολογημένα.' })}
    <div class="grid g4 data-facts">
      ${stat({ label: 'Τρόφιμα στον πίνακα', value: num(facts.foods), iconName: 'package', tone: 'accent' })}
      ${stat({ label: 'Με πηγή USDA', value: num(facts.usda), iconName: 'shield', tone: 'blue', note: 'FoodData Central · SR Legacy' })}
      ${stat({ label: 'Αντιπροσωπευτικά', value: num(facts.proxy), iconName: 'info', tone: 'gold', note: 'π.χ. λαβράκι για «ψάρι»' })}
      ${stat({ label: 'Κατά προσέγγιση', value: num(facts.approx), iconName: 'alert', tone: 'rose', note: 'τραχανάς, παξιμάδι' })}
    </div>
    <p class="muted tiny data-note">${icon('info', 13)}<span>Οι τιμές αναφέρονται σε <b>ωμό</b> βρώσιμο τρόφιμο, όπως και οι ποσότητες των συνταγών και της λίστας αγορών· το μαγείρεμα αλλάζει το νερό, όχι τα macros. Ο ίδιος πίνακας τροφοδοτεί μερίδες, θρεπτικά και λίστα αγορών, ώστε να συμφωνούν πάντα.</span></p>
  </section>

  <section class="card card-lg sources-card">
    ${sectionHead({ eyebrow: 'Πηγές', title: 'Βιβλιογραφία', sub: 'Οι σύνδεσμοι ανοίγουν στις επίσημες σελίδες των εκδοτών. Κάποιοι εκδότες μπλοκάρουν αυτόματα εργαλεία αλλά ανοίγουν κανονικά σε περιηγητή.' })}
    <div class="source-list">
      ${SOURCES.map(s => `<a class="source-item" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">
        <span class="source-ic">${icon('book', 16)}</span>
        <span class="source-text"><span class="source-name">${esc(s.label)}</span><span class="source-used">${esc(s.used)}</span></span>
        <span class="source-go">${icon('external', 16)}</span>
      </a>`).join('')}
    </div>
  </section>

  <div class="grid g2 guide-lower">
    <section class="card card-lg">
      ${sectionHead({ eyebrow: 'Λεξικό', title: 'Όροι' })}
      <div class="stack glossary">
        ${GLOSSARY.map(([term, def]) => `<div><b>${esc(term)}</b><p class="muted tiny">${esc(def)}</p></div>`).join('')}
      </div>
    </section>

    <section class="card card-lg">
      ${sectionHead({ eyebrow: 'Δεδομένα', title: 'Backup & διάγνωση' })}
      <p class="muted tiny backup-note">Τα δεδομένα μένουν στη συσκευή σου. Το export είναι πλήρες και φορητό· το restore είναι ατομικό — αν αποτύχει, δεν αλλάζει τίποτα.</p>
      <div class="meal-actions backup-actions">
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
      <div class="notice notice-danger danger-zone">${icon('alert', 18)}
        <span><b>Επικίνδυνη ενέργεια.</b> Η διαγραφή όλων των δεδομένων δεν αναιρείται. Κάνε export πρώτα.</span></div>
      <button type="button" class="btn btn-danger btn-sm" data-act="wipe">${icon('trash', 15)} Διαγραφή όλων των δεδομένων</button>
    </section>
  </div>

  <div class="notice disclaimer">${icon('heart', 18)}
    <span>Το ZENITH PRO είναι εκπαιδευτικό εργαλείο ευεξίας. Δεν παρέχει ιατρική συμβουλή, διάγνωση ή θεραπεία και δεν αντικαθιστά επαγγελματία υγείας.</span></div>
  </div>`;
}

/* ── Sheets content ────────────────────────────────────────────────────── */

const ACTIVITY_LEVELS = [
  [1.4, 'Χαμηλή δραστηριότητα — καθιστική δουλειά (1,4)'],
  [1.6, 'Μέτρια — περπάτημα ή ελαφριά άσκηση (1,6)'],
  [1.8, 'Δραστήρια — τακτική προπόνηση (1,8)'],
  [2.0, 'Πολύ δραστήρια — σκληρή σωματική δουλειά ή αθλητισμός (2,0)']
];

export function memberForm(ctx, p) {
  const minor = isMinor(p);
  const known = ACTIVITY_LEVELS.some(([v]) => v === Number(p.activityFactor));
  const levels = known ? ACTIVITY_LEVELS
    : [[Number(p.activityFactor), `Προσαρμοσμένη τιμή (${num1(p.activityFactor)})`], ...ACTIVITY_LEVELS];
  return `<form class="form" id="memberForm" data-id="${esc(p.id)}">
    <div class="grid g2">
      <div class="field"><label for="fName">Όνομα</label><input id="fName" name="name" maxlength="24" value="${esc(p.name)}" required></div>
      <div class="field"><label for="fRelation">Σχέση στην οικογένεια</label>
        <input id="fRelation" name="relation" maxlength="16" value="${esc(p.relation || '')}" placeholder="π.χ. Μητέρα" list="relationHints">
        <datalist id="relationHints">
          ${['Μητέρα', 'Πατέρας', 'Κόρη', 'Γιος', 'Γιαγιά', 'Παππούς'].map(r => `<option value="${r}"></option>`).join('')}
        </datalist>
      </div>
    </div>
    <div class="field"><label for="fRole">Ρόλος / στόχος σε μια φράση</label><input id="fRole" name="role" maxlength="60" value="${esc(p.role)}"></div>
    <div class="grid g2">
      <div class="field"><label for="fAge">Ηλικία</label><input id="fAge" name="age" type="number" min="10" max="110" value="${p.age}" required>
        <span class="field-hint">${icon('info', 12)} Σχεδιασμένο για ηλικίες από 10 ετών.</span></div>
      <div class="field"><label for="fSex">Φύλο</label><select id="fSex" name="sex">
        <option value="f" ${p.sex === 'f' ? 'selected' : ''}>Γυναίκα</option>
        <option value="m" ${p.sex === 'm' ? 'selected' : ''}>Άνδρας</option></select></div>
      <div class="field"><label for="fHeight">Ύψος (cm)</label><input id="fHeight" name="height" type="number" min="80" max="230" value="${p.height}" required></div>
      <div class="field"><label for="fWeight">Βάρος (kg)</label><input id="fWeight" name="weight" type="number" min="20" max="300" step="0.1" value="${p.weight}" required></div>
      <div class="field"><label for="fActivity">Επίπεδο δραστηριότητας</label>
        <select id="fActivity" name="activityFactor">
          ${levels.map(([v, l]) => `<option value="${v}" ${Number(p.activityFactor) === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}
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
  const totals = ctx.dayMacrosFor(day, ctx.sized, ctx.load, log);
  const targets = ctx.targets;
  return `<div class="stack-lg day-detail">
    <div>
      <div class="eyebrow">${esc(dayName(date))} · εβδομάδα ${day.week} του κύκλου</div>
      <h2 class="dd-title">${esc(longDate(date))}</h2>
      <p class="muted tiny">Μερίδες για ${esc(profile.name)}</p>
    </div>
    ${SLOTS.map(slot => {
      const r = ctx.recipeById(day[slot]);
      const m = mealMacros(r, ctx.sized, ctx.load, log?.meals?.[slot]?.portion ?? 1);
      const entry = log?.meals?.[slot];
      return `<div class="card card-inset dd-meal slot-${slot}">
        <div class="dd-top">${artTile(r.id, slot, 52)}
          <div><div class="dd-slot">${slotTag(slot)}<span class="meal-time">${icon('clock', 12)}${esc(SLOT_TIME[slot])}</span></div>
            <div class="card-title">${esc(r.name)}</div></div></div>
        ${macroChips(m)}
        <div class="meal-actions">
          <button type="button" class="chip ${entry?.status === 'done' ? 'active' : ''}" data-act="meal" data-slot="${slot}" data-portion="${entry?.portion ?? 1}" data-recipe="${esc(r.id)}" data-date="${esc(date)}">${entry?.status === 'done' ? '✓ Καταγράφηκε' : 'Καταγραφή'}</button>
          <button type="button" class="chip" data-act="recipe" data-id="${esc(r.id)}">Συνταγή</button>
        </div>
      </div>`;
    }).join('')}
    <div class="card card-inset">
      <h3 class="card-title dd-total-title">Σύνολο ημέρας</h3>
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
  return `<div class="palette-list" role="listbox" aria-label="Εντολές">
    ${items.map((it, i) => `<button type="button" class="palette-item ${i === 0 ? 'active' : ''}" role="option" data-act="palettePick" data-index="${i}">
      ${icon(it.icon, 18)}<span>${esc(it.label)}</span>${it.hint ? `<kbd>${esc(it.hint)}</kbd>` : ''}
    </button>`).join('')}
  </div>`;
}
