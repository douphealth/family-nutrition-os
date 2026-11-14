/**
 * ZENITH PRO / UNIFIED FAMILY WORKSPACE
 *
 * Presentation-only navigation and contextual shortcuts. Every displayed count
 * is sourced from the active family context, never demo content.
 * Buttons use existing, permission-preserving app actions.
 */
import { esc, icon } from './ui.js?v=18.1.0';

export const WORKSPACE_SECTIONS=Object.freeze({
  today:{el:'Σήμερα',en:'Today',ic:'sun',descEl:'Το επόμενο χρήσιμο βήμα',descEn:'Your next useful action'},
  plan:{el:'Πλάνο',en:'Planner',ic:'calendar',descEl:'Το πραγματικό πρόγραμμα γευμάτων',descEn:'The real family meal schedule'},
  meals:{el:'Συνταγές',en:'Recipes',ic:'utensils',descEl:'Βρες τι να μαγειρέψεις',descEn:'Find the next meal to cook'},
  shopping:{el:'Αγορές',en:'Shopping',ic:'cart',descEl:'Αγόρασε μόνο όσα χρειάζονται',descEn:'Buy only what you need'},
  fitness:{el:'Προπόνηση',en:'Training',ic:'zap',descEl:'Προπόνηση με έλεγχο αποκατάστασης',descEn:'Training with recovery checks'},
  progress:{el:'Πρόοδος',en:'Progress',ic:'chart',descEl:'Πραγματικές καταγραφές και τάσεις',descEn:'Real logs and trends'},
  family:{el:'Οικογένεια',en:'Family',ic:'users',descEl:'Προσωπικό πρόγραμμα για κάθε μέλος',descEn:'A personal plan for each member'},
  guide:{el:'Πηγές',en:'Evidence',ic:'book',descEl:'Πώς υπολογίζονται τα δεδομένα',descEn:'How the calculations work'}
});
export const WORKSPACE_GROUPS=Object.freeze([
  {id:'daily',el:'ΚΑΘΗΜΕΡΙΝΑ',en:'DAILY WORKSPACE',views:['today','plan','meals','shopping']},
  {id:'health',el:'ΥΓΕΙΑ & ΑΠΟΔΟΣΗ',en:'HEALTH & PERFORMANCE',views:['fitness','progress']},
  {id:'system',el:'ΟΙΚΟΓΕΝΕΙΑ & ΕΦΑΡΜΟΓΗ',en:'FAMILY & APPLICATION',views:['family','guide']}
]);
const T=(en,el,english)=>en?english:el;
const navAction=(view,label,ic,variant='')=>
  '<button type="button" class="zn-context-button '+variant+'" data-act="nav" data-view="'+view+'">'
  +icon(ic,17)+'<span>'+label+'</span></button>';

export function workspaceDock(ctx,view){
  if(view==='today'||!WORKSPACE_SECTIONS[view])return '';
  const en=ctx.lang==='en',info=WORKSPACE_SECTIONS[view],member=esc(ctx.profile?.name||'');
  let value='',label='',actions=[];
  switch(view){
    case 'plan':
      value=String(ctx.profiles?.length||0);
      label=T(en,'μέλη στο πρόγραμμα','people in the plan');
      actions=[navAction('shopping',T(en,'Λίστα αγορών','Shopping list'),'cart','primary'),
        navAction('meals',T(en,'Συνταγές','Recipes'),'utensils'),
        '<button type="button" class="zn-context-button" data-act="print">'+icon('printer',17)
          +'<span>'+T(en,'Εκτύπωση','Print')+'</span></button>'];
      break;
    case 'meals':
      value=String(ctx.recipes?.length||0);
      label=T(en,'πραγματικές συνταγές','recipes');
      actions=['<button type="button" class="zn-context-button primary" data-act="focusRecipes">'
        +icon('search',17)+'<span>'+T(en,'Βρες συνταγή','Search recipes')+'</span></button>',
        navAction('plan',T(en,'Πλάνο εβδομάδας','Weekly plan'),'calendar'),
        navAction('shopping',T(en,'Αγορές','Shopping'),'cart')];
      break;
    case 'shopping':
      value=String(ctx.shopStats?.remaining??0);
      label=T(en,'προϊόντα απομένουν','items remaining');
      actions=['<button type="button" class="zn-context-button primary" data-act="print">'+icon('printer',17)
        +'<span>'+T(en,'Εκτύπωση λίστας','Print list')+'</span></button>',
        navAction('plan',T(en,'Δες το πλάνο','See plan'),'calendar')];
      break;
    case 'fitness': {
      const p=ctx.supplementaryProgram;
      value=p?.available?String(p.plannedMinutes)+'′':'—';
      label=p?.available?T(en,'προτεινόμενη προσωπική άσκηση','requested personal training')
        :T(en,'σχεδιασμός προπόνησης','training planner');
      actions=[
        ...(ctx.profile?.id==='son'?
          ['<button type="button" class="zn-context-button primary" data-act="fitnessCalendarEdit">'
            +icon('calendar',17)+'<span>'+T(en,'Ώρες ομάδας','Team timetable')+'</span></button>']:[]),
        navAction('progress',T(en,'Καταγραφές','Progress'),'chart'),
        navAction('today',T(en,'Σήμερα','Today'),'sun')];
      break;
    }
    case 'progress':
      value=String(ctx.loggedDays||0);
      label=T(en,'ημέρες καταγραφής','days logged');
      actions=[navAction('today',T(en,'Σημερινά δεδομένα','Today’s data'),'sun','primary'),
        navAction('family',T(en,'Προφίλ','Profiles'),'users')];
      break;
    case 'family':
      value=String(ctx.profiles?.length||0);
      label=T(en,'προφίλ στην οικογένεια','family profiles');
      actions=[navAction('plan',T(en,'Οικογενειακό πλάνο','Family plan'),'calendar','primary'),
        navAction('today',T(en,'Σήμερα','Today'),'sun')];
      break;
    case 'guide':
      value='USDA';
      label=T(en,'τεκμηριωμένες πηγές τροφίμων','food data provenance');
      actions=[navAction('family',T(en,'Προφίλ','Profiles'),'users','primary'),
        navAction('plan',T(en,'Πλάνο','Plan'),'calendar')];
      break;
  }
  const title=esc(en?info.en:info.el),desc=esc(en?info.descEn:info.descEl);
  return '<section class="zn-workspace-dock" aria-label="'+T(en,'Συντομεύσεις ενότητας','Section shortcuts')+'">'
    +'<div class="zn-context-ident"><span class="zn-context-icon">'+icon(info.ic,19)+'</span>'
    +'<span class="zn-context-copy"><small>ZENITH / '+title.toUpperCase()+'</small>'
    +'<strong>'+desc+'</strong></span></div>'
    +'<div class="zn-context-meta"><b>'+esc(value)+'</b><span>'+esc(label)+'</span>'
    +'<small>'+T(en,'Μέλος','Member')+': '+member+'</small></div>'
    +'<div class="zn-context-actions">'+actions.join('')+'</div></section>';
}

export function moreMenu(nav,ctx){
  const en=ctx.lang==='en';
  const viewButtons=nav.map(([id,,ic])=>{
    const info=WORKSPACE_SECTIONS[id];
    const title=en?info.en:info.el;
    const sub=en?info.descEn:info.descEl;
    return '<button type="button" class="zn-menu-tile '+(ctx.state.view===id?'is-current':'')
      +'" data-act="nav" data-view="'+id+'" '+(ctx.state.view===id?'aria-current="page"':'')+'>'
      +'<span class="zn-menu-icon">'+icon(ic,21)+'</span>'
      +'<span><strong>'+esc(title)+'</strong><small>'+esc(sub)+'</small></span>'
      +icon('arrowRight',17)+'</button>';
  }).join('');
  return '<div class="zn-more-sheet">'
    +'<p class="zn-more-lead">'+T(en,'Όλες οι ενότητες, χωρίς κρυμμένες επιλογές.','Every section, no hidden destinations.')+'</p>'
    +'<div class="zn-menu-grid">'+viewButtons+'</div>'
    +'<div class="zn-more-separator"><span>'+T(en,'Εργαλεία','Tools')+'</span></div>'
    +'<div class="zn-menu-tools">'
    +'<button type="button" data-act="palette">'+icon('search',18)+' '+T(en,'Γρήγορες εντολές','Quick commands')+'</button>'
    +'<button type="button" data-act="theme">'+icon('sun',18)+' '+T(en,'Αλλαγή θέματος','Change theme')+'</button>'
    +'<button type="button" data-act="density" aria-pressed="'+String(ctx.state.density==='compact')+'">'+icon('monitor',18)+' '+(ctx.state.density==='compact'?T(en,'Άνετη προβολή','Comfortable spacing'):T(en,'Συμπαγής προβολή','Compact spacing'))+'</button>'
    +'<button type="button" data-act="print">'+icon('printer',18)+' '+T(en,'Εκτύπωση','Print')+'</button>'
    +'<button type="button" data-act="export">'+icon('download',18)+' '+T(en,'Αντίγραφο δεδομένων','Export backup')+'</button>'
    +'<button type="button" data-act="import">'+icon('upload',18)+' '+T(en,'Εισαγωγή αντιγράφου','Import backup')+'</button>'
    +'</div><p class="zn-more-privacy">'+icon('lock',15)+' '
    +T(en,'Χωρίς λογαριασμό ή cloud συγχρονισμό. Τα δεδομένα παραμένουν τοπικά.',
      'No account or cloud sync. Data remains on this device.')+'</p></div>';
}
/**
 * Member-first, one-tap daily actions.
 * Every button reuses the app's existing delegated meal/water/nav handlers.
 * Nothing is inferred from another family member's log or persisted here.
 */
export function dailyFocus(ctx) {
  const en = ctx.lang === 'en';
  const copy = (el, english) => en ? english : el;
  const profile = ctx.profile || {};
  const plan = ctx.planDay || {};
  const log = ctx.log || {};
  const slots = ['breakfast', 'lunch', 'snack', 'dinner'];
  const pending = slots.filter(slot => plan[slot] && !['done', 'skipped'].includes(log.meals?.[slot]?.status));
  const slot = pending.includes(ctx.nudge?.slot) ? ctx.nudge.slot : (pending[0] || null);
  const recipe = slot && typeof ctx.recipeById === 'function' ? ctx.recipeById(plan[slot]) : null;
  const total = slots.filter(s => plan[s]).length;
  const done = slots.filter(s => plan[s] && log.meals?.[s]?.status === 'done').length;
  const water = Math.max(0, Number(log.waterMl) || 0);
  const goal = Math.max(0, Number(ctx.targets?.hydration?.ml) || 0);
  const completed = total > 0 && !pending.length;
  const slotNames = en
    ? { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }
    : { breakfast: 'Πρωινό', lunch: 'Μεσημεριανό', snack: 'Σνακ', dinner: 'Βραδινό' };
  const title = recipe?.name || (completed
    ? copy('Τα γεύματα ολοκληρώθηκαν', 'Meals completed')
    : copy('Δες το σημερινό πλάνο', 'See today’s meal plan'));
  const step = slot && recipe ? slotNames[slot] : copy('Ημέρα σε εξέλιξη', 'Your day in progress');
  const primary = slot && recipe
    ? '<button type="button" class="zn-daily-primary" data-act="meal" data-slot="' + esc(slot)
      + '" data-recipe="' + esc(recipe.id) + '" data-portion="1" aria-label="'
      + esc(copy('Καταγραφή γεύματος ', 'Log meal ') + recipe.name + copy(' για ', ' for ') + (profile.name || ''))
      + '">' + icon('check', 19) + copy('Το έφαγα', 'Log this meal') + '</button>'
    : '<button type="button" class="zn-daily-primary" data-act="nav" data-view="plan">'
      + icon('calendar', 19) + copy('Άνοιγμα πλάνου', 'Open meal plan') + '</button>';
  return '<section class="zn-daily-focus" aria-labelledby="zn-daily-focus-title">'
    + '<div class="zn-daily-copy"><div class="zn-daily-eyebrow">'
    + icon('sparkles', 15) + copy('ΣΗΜΕΡΑ ΓΙΑ', 'TODAY FOR') + ' ' + esc(profile.name || '') + '</div>'
    + '<span class="zn-daily-step">' + esc(step) + '</span>'
    + '<h2 id="zn-daily-focus-title">' + esc(title) + '</h2>'
    + '<p>' + copy('Μία ενέργεια τη φορά. Όσα καταγράφεις αφορούν μόνο το επιλεγμένο μέλος.',
      'One action at a time. Records belong only to the selected family member.') + '</p></div>'
    + '<div class="zn-daily-metrics" aria-label="' + copy('Σημερινές καταγραφές', 'Today’s logs') + '">'
    + '<span>' + icon('checkCircle', 16) + copy('Γεύματα', 'Meals') + ' <b>' + done + '/' + total + '</b></span>'
    + '<span>' + icon('droplet', 16) + copy('Νερό', 'Water') + ' <b>' + Math.round(water)
    + (goal ? '/' + Math.round(goal) : '') + ' ml</b></span></div>'
    + '<div class="zn-daily-actions" role="group" aria-label="'
    + copy('Γρήγορες ενέργειες για το μέλος', 'Quick actions for this member') + '">'
    + primary
    + '<button type="button" class="zn-daily-secondary" data-act="water" data-delta="250" aria-label="'
    + copy('Προσθήκη 250 ml νερού', 'Add 250 ml of water') + '">' + icon('droplet', 17)
    + copy('+250 ml νερό', '+250 ml water') + '</button>'
    + '<button type="button" class="zn-daily-secondary" data-act="nav" data-view="plan">'
    + icon('calendar', 17) + copy('Πλάνο εβδομάδας', 'Weekly plan') + '</button>'
    + '<button type="button" class="zn-daily-secondary" data-act="nav" data-view="fitness">'
    + icon('zap', 17) + copy('Προπόνηση', 'Training') + '</button>'
    + '</div></section>';
}
