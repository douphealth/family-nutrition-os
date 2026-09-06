import { FAMILY, PLAN_28, RECIPES, TRAINING_LOADS, SOURCES } from './data.js';
import { isMinor, bmi, adultBmiLabel, energyRange, proteinRange, hydrationTarget, portionProfile, contextualGuidance } from './nutrition-engine.js';
import { get, put, all, exportBackup, importBackup } from './storage.js';

const slots = ['breakfast','lunch','snack','dinner'];
const slotLabel = {breakfast:'Πρωινό',lunch:'Μεσημεριανό',snack:'Σνακ',dinner:'Βραδινό'};
const nav = [ ['today','Σήμερα'],['plan','Πλάνο'],['meals','Γεύματα'],['progress','Πρόοδος'],['family','Οικογένεια'] ];
let state = { view:'today', member:'mother', theme:'dark', trainingLoad:'normal', profiles: structuredClone(FAMILY), today:{} };

function el(id){return document.getElementById(id)}
function recipe(id){return RECIPES.find(r=>r.id===id)}
function profile(){return state.profiles.find(p=>p.id===state.member) || state.profiles[0]}
function cycleDay(){const start=new Date(new Date().getFullYear(),0,1);return ((Math.floor((new Date()-start)/86400000))%28)+1}
function planForToday(){return PLAN_28[cycleDay()-1]}
function toast(msg){const t=el('toast');t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}

async function load(){
  const settings = await get('settings','app');
  if(settings) state = {...state,...settings};
  const profiles = await all('profiles'); if(profiles.length) state.profiles = profiles;
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.setProperty('--accent',profile().accent);
  const log = await get('logs',`${new Date().toISOString().slice(0,10)}:${state.member}`);
  if(log) state.today[state.member] = log;
  renderShell(); render();
}
async function persist(){await put('settings',{id:'app',view:state.view,member:state.member,theme:state.theme,trainingLoad:state.trainingLoad}); for(const p of state.profiles) await put('profiles',p);}

function renderShell(){
  const navHtml = nav.map(([id,label])=>`<button data-view="${id}" class="${state.view===id?'active':''}">${label}</button>`).join('');
  el('sideNav').innerHTML=navHtml; el('mobileNav').innerHTML=navHtml;
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=async()=>{state.view=b.dataset.view;await persist();renderShell();render();});
  el('memberSwitch').innerHTML=state.profiles.map(p=>`<button class="chip ${p.id===state.member?'active':''}" data-member="${p.id}">${p.name}</button>`).join('');
  document.querySelectorAll('[data-member]').forEach(b=>b.onclick=async()=>{state.member=b.dataset.member;document.documentElement.style.setProperty('--accent',profile().accent);const log=await get('logs',`${new Date().toISOString().slice(0,10)}:${state.member}`);if(log)state.today[state.member]=log;await persist();renderShell();render();});
  el('themeBtn').onclick=async()=>{state.theme=state.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=state.theme;await persist();};
}

function todayPlanHtml(p){
  const day = planForToday(); const log = state.today[p.id] || {};
  return `<div class="meal-grid">${slots.map(s=>{const r=recipe(day[s]);const done=log[s]?.status==='done';return `<article class="meal"><div class="slot">${slotLabel[s]}</div><h3>${r.name}</h3><div class="muted">${r.time}′ · ~${r.base.kcal} kcal base recipe</div><div class="meal-actions"><button class="chip" data-meal="${s}" data-portion="0.75">Μικρότερη</button><button class="chip ${done?'active':''}" data-meal="${s}" data-portion="1">${done?'✓ Έγινε':'Όπως το πλάνο'}</button><button class="chip" data-meal="${s}" data-portion="1.25">Μεγαλύτερη</button></div></article>`}).join('')}</div>`;
}

function todayView(){
  const p=profile(), day=planForToday(), portions=portionProfile(p,state.trainingLoad), er=energyRange(p,state.trainingLoad), pr=proteinRange(p), hyd=hydrationTarget(p,state.trainingLoad), log=state.today[p.id]||{};
  const nextSlot = slots.find(s=>log[s]?.status!=='done') || 'dinner'; const next=recipe(day[nextSlot]);
  const guidance=contextualGuidance({profile:p,trainingLoad:state.trainingLoad,today:log,plannedMeal:next});
  return `<section class="hero"><div class="eyebrow">${p.role}</div><h1>${p.name}: τι χρειάζεται τώρα</h1><p>Action-first ημερήσια προβολή. Το ZENITH αποφεύγει adult BMI labels και calorie-deficit logic για ανηλίκους.</p></section>
  <section class="card next"><div class="eyebrow">NEXT</div><div class="name">${next.name}</div><p class="muted">${slotLabel[nextSlot]} · ${p.athlete?TRAINING_LOADS.find(x=>x[0]===state.trainingLoad)[1]:'Οικογενειακό πλάνο'}</p></section>
  <div class="grid g3" style="margin-top:16px"><section class="card"><div class="muted">Estimated energy planning range</div><div class="metric">${er.lower}–${er.upper}<small> kcal/day</small></div><p class="muted">${er.note}</p></section><section class="card"><div class="muted">Protein planning range</div><div class="metric">${pr.min}–${pr.max}<small> g/day</small></div><p class="muted">${pr.note}</p></section><section class="card"><div class="muted">Hydration starting estimate</div><div class="metric">${(hyd.ml/1000).toFixed(1)}<small> L/day</small></div><p class="muted">${hyd.note}</p></section></div>
  ${p.athlete?`<section class="card" style="margin-top:16px"><div class="eyebrow">ATHLETE MODE</div><h2>Training load</h2><div class="member-switch" style="margin-top:12px">${TRAINING_LOADS.map(([id,label])=>`<button class="chip ${id===state.trainingLoad?'active':''}" data-load="${id}">${label}</button>`).join('')}</div><p class="muted">Hard/game/tournament days automatically raise carbohydrate portions and hydration estimates without creating a weight-loss target.</p></section>`:''}
  <section class="card" style="margin-top:16px"><h2>Σήμερα</h2><div class="timeline">${slots.map(s=>`<div class="step ${log[s]?.status==='done'?'done':s===nextSlot?'current':''}"><i class="dot"></i><div><b>${slotLabel[s]}</b><div class="muted">${recipe(day[s]).name}${log[s]?.portion?` · ${log[s].portion}×`:''}</div></div></div>`).join('')}</div></section>
  <section style="margin-top:16px">${todayPlanHtml(p)}</section>
  <div class="grid g2" style="margin-top:16px"><section class="card"><h3>Portion profile · ${portions.label}</h3><div class="portion-row" style="margin-top:12px"><div class="portion"><b>${portions.vegetables}×</b><span class="muted">Vegetables</span></div><div class="portion"><b>${portions.protein}×</b><span class="muted">Protein</span></div><div class="portion"><b>${portions.carbs}×</b><span class="muted">Carbs</span></div><div class="portion"><b>${portions.fats}×</b><span class="muted">Fats</span></div></div></section><section class="card"><h3>Context, όχι αυθαίρετο score</h3>${guidance.map(t=>`<div class="status"><span>${t}</span><b class="good">✓</b></div>`).join('')}</section></div>`;
}

function planView(){
  const currentWeek=Math.ceil(cycleDay()/7); const days=PLAN_28.filter(d=>d.week===currentWeek);
  return `<section class="hero"><div class="eyebrow">28-DAY ROTATION</div><h1>Το πλάνο της εβδομάδας</h1><p>Επαναλαμβανόμενος τετραβδομαδιαίος κύκλος, με κοινό οικογενειακό φαγητό και member-specific portions.</p></section><div class="plan-week">${days.map(d=>`<section class="card day"><div class="eyebrow">W${d.week}</div><h3>${d.dow}</h3>${slots.map(s=>`<div class="tiny-meal"><span>${slotLabel[s]}</span>${recipe(d[s]).name}</div>`).join('')}</section>`).join('')}</div><section class="card" style="margin-top:16px"><h2>Batch-cook priority</h2><p class="muted">Μαγείρεψε 1 όσπριο, 1 tray-bake πρωτεΐνη, 1 cooked grain και πλύνε σαλάτες. Αυτό μειώνει περισσότερο το καθημερινό friction από το να προσθέσουμε δεκάδες νέες συνταγές.</p><button class="btn" id="shoppingBtn">Δημιουργία λίστας αγορών εβδομάδας</button><div id="shoppingOut"></div></section>`;
}

function mealsView(){return `<section class="hero"><div class="eyebrow">MEAL LIBRARY</div><h1>Λιγότερες, καλύτερες συνταγές</h1><p>Κάθε συνταγή είναι συνδεδεμένη με το 28-day plan. Τα macros είναι recipe estimates — όχι δήλωση ότι καταναλώθηκαν αν ο χρήστης δεν το επιβεβαιώσει.</p></section><div class="recipe-list">${RECIPES.map(r=>`<article class="recipe"><div class="eyebrow">${slotLabel[r.slot]||r.slot}</div><h3>${r.name}</h3><p class="meta">${r.time}′ · ${r.base.kcal} kcal · P ${r.base.p}g · C ${r.base.c}g · F ${r.base.f}g</p><p class="muted">${r.ingredients.join(' · ')}</p></article>`).join('')}</div>`}

async function progressView(){
  const p=profile(); const logs=(await all('logs')).filter(x=>x.memberId===p.id); const measurements=(await all('measurements')).filter(x=>x.memberId===p.id);
  const bmiValue=bmi(p); const label=adultBmiLabel(p);
  return `<section class="hero"><div class="eyebrow">PROGRESS</div><h1>Τάσεις, όχι ενοχές</h1><p>Δεν υπάρχει arbitrary “health score”. Εμφανίζονται διαφανείς συμπεριφορές και trends.</p></section><div class="grid g3"><section class="card"><div class="muted">Logged days</div><div class="metric">${logs.length}</div></section><section class="card"><div class="muted">Measurements</div><div class="metric">${measurements.length}</div></section><section class="card"><div class="muted">BMI</div><div class="metric">${isMinor(p)?'—':bmiValue}<small>${isMinor(p)?' hidden for minor primary UI':` · ${label}`}</small></div></section></div>${isMinor(p)?'<div class="notice" style="margin-top:16px">Για ανηλίκους το ZENITH δεν εφαρμόζει adult BMI κατηγορίες ούτε weight-loss στόχους.</div>':''}`;
}

function familyView(){const p=profile(); return `<section class="hero"><div class="eyebrow">FAMILY</div><h1>Προφίλ & ασφάλεια</h1><p>Οι ρυθμίσεις καθορίζουν ποια nutrition logic επιτρέπεται. Οι ανήλικοι δεν μπορούν να μπουν σε adult fat-loss mode.</p></section><div class="grid g2"><section class="card"><form class="form" id="profileForm"><label>Όνομα<input name="name" value="${p.name}"></label><div class="grid g2"><label>Ηλικία<input name="age" type="number" value="${p.age}"></label><label>Φύλο<select name="sex"><option value="f" ${p.sex==='f'?'selected':''}>Female</option><option value="m" ${p.sex==='m'?'selected':''}>Male</option></select></label><label>Ύψος cm<input name="height" type="number" value="${p.height}"></label><label>Βάρος kg<input name="weight" type="number" step="0.1" value="${p.weight}"></label></div><label>Goal<select name="goal" ${isMinor(p)?'disabled':''}><option value="maintain" ${p.goal==='maintain'?'selected':''}>Maintain</option><option value="gradual_fat_loss" ${p.goal==='gradual_fat_loss'?'selected':''}>Gradual fat loss (adults only)</option><option value="growth" ${p.goal==='growth'?'selected':''}>Growth</option><option value="performance" ${p.goal==='performance'?'selected':''}>Performance</option></select></label><button class="btn" type="submit">Αποθήκευση</button></form></section><section class="card"><h3>Privacy & backup</h3><p class="muted">Primary records live in IndexedDB. Export creates a portable JSON backup; local browser storage is not marketed as a true disaster backup.</p><div class="meal-actions"><button class="btn" id="exportBtn">Export JSON</button><button class="btn" id="importBtn">Import JSON</button></div><h3 style="margin-top:20px">Evidence links</h3><div class="source-list">${SOURCES.map(s=>`<p><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></p>`).join('')}</div></section></div>`}

async function render(){
  const view=el('view');
  if(state.view==='today') view.innerHTML=todayView();
  if(state.view==='plan') view.innerHTML=planView();
  if(state.view==='meals') view.innerHTML=mealsView();
  if(state.view==='progress') view.innerHTML=await progressView();
  if(state.view==='family') view.innerHTML=familyView();
  bind();
}

function bind(){
  document.querySelectorAll('[data-load]').forEach(b=>b.onclick=async()=>{state.trainingLoad=b.dataset.load;await persist();render();});
  document.querySelectorAll('[data-meal]').forEach(b=>b.onclick=async()=>{const p=profile();state.today[p.id]??={};state.today[p.id][b.dataset.meal]={status:'done',portion:Number(b.dataset.portion)};const id=`${new Date().toISOString().slice(0,10)}:${p.id}`;await put('logs',{id,date:new Date().toISOString().slice(0,10),memberId:p.id,...state.today[p.id]});render();toast('Καταγράφηκε χωρίς να υποθέσουμε λάθος μερίδα.');});
  el('shoppingBtn')?.addEventListener('click',()=>{const week=PLAN_28.filter(d=>d.week===Math.ceil(cycleDay()/7));const items=[...new Set(week.flatMap(d=>slots.flatMap(s=>recipe(d[s]).ingredients)))];el('shoppingOut').innerHTML=`<div class="recipe-list" style="margin-top:12px">${items.map(x=>`<div class="recipe">${x}</div>`).join('')}</div>`});
  el('profileForm')?.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.target),p=profile();p.name=fd.get('name');p.age=Number(fd.get('age'));p.sex=fd.get('sex');p.height=Number(fd.get('height'));p.weight=Number(fd.get('weight'));if(!isMinor(p))p.goal=fd.get('goal');else if(!['growth','performance'].includes(p.goal))p.goal=p.athlete?'performance':'growth';await persist();renderShell();render();toast('Το προφίλ ενημερώθηκε.');});
  el('exportBtn')?.addEventListener('click',async()=>{const data=await exportBackup();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`zenith-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);});
  el('importBtn')?.addEventListener('click',()=>el('backupImport').click());
}

el('backupImport').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{await importBackup(JSON.parse(await file.text()));toast('Backup restored. Reloading…');setTimeout(()=>location.reload(),800)}catch(err){toast('Invalid backup file')}});

if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').then(reg=>{reg.addEventListener('updatefound',()=>{const w=reg.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('Νέα έκδοση διαθέσιμη — επανεκκίνησε την εφαρμογή.');});});}).catch(()=>{});}
load();
