/**
 * ZENITH PRO · data layer
 * ---------------------------------------------------------------------------
 * All content lives here so the app ships with zero network dependencies and
 * works fully offline. Nothing in this file performs I/O.
 *
 * Where the numbers come from
 *   • What is IN the food lives in foods.js (USDA FoodData Central, per 100 g).
 *   • Recipes (recipes.js) are quantified lines of those foods; their macros and
 *     micronutrients are DERIVED from grams, never typed.
 *   • Energy is always derived from macros with the EU labelling factors (protein 4,
 *     available carbohydrate 4, fat 9, fibre 2 kcal/g) by `nutrition-engine.js`, never
 *     stored separately, so the numbers can never disagree with each other. See
 *     METHOD for the citations.
 */

import { FOODS } from './foods.js?v=15.0.1';

export const APP = {
  name: 'ZENITH PRO',
  subtitle: 'Οικογενειακό Σύστημα Διατροφής',
  version: '15.0.1',
  updated: '2026-10-05',
  schema: 2
};

/* ── Household ─────────────────────────────────────────────────────────────
 * accent drives the per-member colour system across the whole UI.
 * `athlete:true` unlocks training-load logic. Minors are protected from
 * deficit and adult-BMI logic by the nutrition engine, not by the UI.
 */
/* The four real people this app is built for. `relation` is the family role,
 * `name` is what each of them is actually called — the member strip, avatars and
 * persona briefs all key off `name`. Renaming a member in the UI never touches
 * `id`, so portions, plans and history stay attached to the right person. */
export const FAMILY = [
  { id:'mother',   name:'Αναστασία',  relation:'Μητέρα',  role:'Υγεία & σταδιακή απώλεια λίπους', sex:'f', age:51, height:167, weight:87, activityFactor:1.40, goal:'gradual_fat_loss', athlete:false, accent:'#0E9F6E', notes:'Στόχος ρυθμού, όχι ταχύτητας.' },
  { id:'father',   name:'Αλέξης',     relation:'Πατέρας', role:'Συντήρηση & καρδιομεταβολική υγεία', sex:'m', age:54, height:178, weight:78, activityFactor:1.40, goal:'maintain',         athlete:false, accent:'#2F6FED', notes:'Προσοχή στο αλάτι.' },
  { id:'daughter', name:'Αλεξάνδρα',  relation:'Κόρη',    role:'Ανάπτυξη & ενέργεια',              sex:'f', age:17, height:165, weight:52, activityFactor:1.60, goal:'growth',            athlete:false, accent:'#D9457A', notes:'Ποικιλία & σίδηρος.' },
  { id:'son',      name:'Δημήτρης',   relation:'Γιος',    role:'Basketball · απόδοση & αποκατάσταση', sex:'m', age:15, height:179, weight:67, activityFactor:1.80, goal:'performance', athlete:true,  accent:'#D98A16', notes:'Διπλές προπονήσεις Τρ/Πε.' }
];

/* Activity levels shipped before v13 that sat below EFSA/FAO's lowest free-living
 * level (PAL 1.4) or off the EFSA ladder (1.4 · 1.6 · 1.8 · 2.0), as [old, new].
 * A stored profile is only migrated while it still equals the old shipped value. */
export const LEGACY_ACTIVITY = { mother: [1.35, 1.4], daughter: [1.55, 1.6] };

/* Names shipped before v4.1. An install that still carries one of these was
 * never customised by the user, so it is safe to upgrade it to the real name.
 * A member the user has renamed is left alone. */
export const LEGACY_MEMBER_NAMES = {
  mother: 'Μητέρα',
  father: 'Πατέρας',
  daughter: 'Κόρη',
  son: 'Γιος'
};

export const TRAINING_LOADS = [
  ['rest',       'Ξεκούραση'],
  ['light',      'Ελαφριά'],
  ['normal',     'Κανονική'],
  ['hard',       'Σκληρή'],
  ['game',       'Αγώνας'],
  ['tournament', 'Τουρνουά / διπλή']
];

export const GOALS = [
  ['maintain',          'Συντήρηση'],
  ['gradual_fat_loss',  'Σταδιακή απώλεια λίπους (μόνο ενήλικες)'],
  ['growth',            'Ανάπτυξη'],
  ['performance',       'Απόδοση']
];

export const SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];
export const SLOT_LABEL = { breakfast:'Πρωινό', lunch:'Μεσημεριανό', snack:'Σνακ', dinner:'Βραδινό' };
export const SLOT_TIME  = { breakfast:'07:30', lunch:'13:30', snack:'17:30', dinner:'20:30' };

/* ── Aisles ────────────────────────────────────────────────────────────── */
export const AISLES = [
  { id:'produce', label:'Οπωροπωλείο',             icon:'leaf' },
  { id:'protein', label:'Κρεοπωλείο & ψάρια',      icon:'drumstick' },
  { id:'dairy',   label:'Γαλακτοκομικά & αυγά',    icon:'milk' },
  { id:'pantry',  label:'Ξηρά, λάδια & κονσέρβες', icon:'jar' },
  { id:'bakery',  label:'Αρτοποιείο',              icon:'bread' },
  { id:'frozen',  label:'Κατεψυγμένα',             icon:'snowflake' }
];

/* ── Menu ──────────────────────────────────────────────────────────────────
 * Recipes, the 28-day rotation, the iron-source list and the illustration map
 * live in recipes.js (authored on the canonical food table in foods.js) and are
 * re-exported here so the rest of the app keeps one import site for content.
 */
export { RECIPES, PLAN_28, RECIPE_ART, IRON_RICH, IRON_HIGH_MG } from './recipes.js?v=15.0.1';

/* ── Evidence ──────────────────────────────────────────────────────────────
 * Every claim the app makes traces back to one of these, and nothing is listed
 * that is not actually relied on. `verified` is the date each link was opened and
 * its content checked against the claim in `used`. Journal articles link to their
 * PubMed record, which is stable and opens everywhere; some publishers block
 * automated requests but open fine in a browser.
 */
export const SOURCES = [
  { id:'efsa',      verified:'2026-09-30', label:'EFSA — Summary of Dietary Reference Values (2017)',
    url:'https://www.efsa.europa.eu/sites/default/files/assets/DRV_Summary_tables_jan_17.pdf',
    used:'Τιμές αναφοράς ανά ηλικία και φύλο: ίνες, ασβέστιο, σίδηρος, νερό και πρωτεΐνη· μέσες ανάγκες ενέργειας.' },
  { id:'who',       verified:'2026-09-30', label:'WHO — Healthy diet (fact sheet)',
    url:'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    used:'Αλάτι κάτω από 5 g (2 g νατρίου) την ημέρα, τουλάχιστον 400 g φρούτων και λαχανικών, τουλάχιστον 25 g ίνες.' },
  { id:'usda',      verified:'2026-09-30', label:'USDA FoodData Central — SR Legacy',
    url:'https://fdc.nal.usda.gov/',
    used:'Σύσταση κάθε τροφίμου ανά 100 g: πρωτεΐνη, υδατάνθρακες, λίπος, ίνες, νάτριο, σίδηρος, ασβέστιο.' },
  { id:'eu1169',    verified:'2026-09-30', label:'Regulation (EU) No 1169/2011 — energy conversion factors & reference intakes',
    url:'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011R1169',
    used:'Συντελεστές ενέργειας όπως στις ετικέτες (4/4/9 kcal/g, ίνες 2 kcal/g) και τιμές αναφοράς της ΕΕ (σίδηρος 14 mg, ασβέστιο 800 mg) για τα σήματα «πλούσιο σε…».' },
  { id:'mifflin',   verified:'2026-09-30', label:'Mifflin & St Jeor (1990) — resting energy expenditure',
    url:'https://pubmed.ncbi.nlm.nih.gov/2305711/',
    used:'Εξίσωση ενέργειας ηρεμίας για ενήλικες.' },
  { id:'schofield', verified:'2026-09-30', label:'Schofield (1985) · FAO/WHO/UNU — Energy and protein requirements',
    url:'https://www.fao.org/4/aa040e/aa040e00.htm',
    used:'Εξίσωση ενέργειας ηρεμίας για ηλικίες 10–18 ετών.' },
  { id:'cdc',       verified:'2026-09-30', label:'CDC — Child & teen BMI categories',
    url:'https://www.cdc.gov/bmi/child-teen-calculator/bmi-categories.html',
    used:'Γιατί το BMI ενηλίκων δεν ισχύει κάτω των 20 ετών: χρησιμοποιούνται ποσοστιαίες θέσεις BMI ανά ηλικία και φύλο.' },
  { id:'acsm',      verified:'2026-09-30', label:'ACSM/AND/DC (2016) — Nutrition and athletic performance',
    url:'https://pubmed.ncbi.nlm.nih.gov/26891166/',
    used:'Υδατάνθρακες πριν και μετά την προπόνηση (1–4 g/kg πριν), πρωτεΐνη μετά την άσκηση, αναπλήρωση υγρών 125–150%.' },
  { id:'issn',      verified:'2026-09-30', label:'ISSN position stand (2017) — Protein and exercise',
    url:'https://pubmed.ncbi.nlm.nih.gov/28642676/',
    used:'Πρωτεΐνη αθλητών 1,4–2,0 g/kg την ημέρα· η εφαρμογή σχεδιάζει στο 1,4–1,8 g/kg.' },
  { id:'sda',       verified:'2026-09-30', label:'Sports Dietitians Australia (2014) — The adolescent athlete',
    url:'https://pubmed.ncbi.nlm.nih.gov/24668620/',
    used:'Αθλητική διατροφή εφήβων: η επάρκεια ενέργειας προηγείται, όχι ο περιορισμός.' },
  { id:'reds',      verified:'2026-09-30', label:'IOC consensus (2023) — Relative Energy Deficiency in Sport',
    url:'https://pubmed.ncbi.nlm.nih.gov/37752011/',
    used:'Διαθεσιμότητα ενέργειας σε νεαρούς αθλητές.' },
  { id:'hall',      verified:'2026-09-30', label:'Hall et al. (2011) — Effect of energy imbalance on bodyweight',
    url:'https://pubmed.ncbi.nlm.nih.gov/21872751/',
    used:'Το βάρος αλλάζει σταδιακά με το ενεργειακό ισοζύγιο· γι’ αυτό κρίνουμε τάση εβδομάδων και όχι μία μέτρηση.' }
];

/* ── Methodology, shown verbatim in the app ────────────────────────────── */
export const METHOD = [
  { icon:'flame', title:'Ενέργεια ενηλίκων',
    body:'Εξίσωση Mifflin–St Jeor για την ενέργεια ηρεμίας × επίπεδο δραστηριότητας (1,4 · 1,6 · 1,8 · 2,0, όπως στην EFSA). Σταδιακή απώλεια λίπους = −12% της συντήρησης, δηλαδή περίπου 250 kcal την ημέρα. Εμφανίζεται πάντα ως εύρος ±6%, ποτέ ως ένας «μαγικός» αριθμός.' },
  { icon:'users', title:'Ενέργεια εφήβων',
    body:'Εξίσωση Schofield (FAO/WHO/UNU) για ηλικίες 10–18 × επίπεδο δραστηριότητας — για αθλητή, ανάλογα με το φορτίο προπόνησης. Το εύρος είναι ±10% και συμφωνεί με τις Μέσες Ανάγκες της EFSA για την ηλικία. Δεν εφαρμόζεται ποτέ έλλειμμα σε ανήλικο προφίλ και δεν εμφανίζεται κατηγορία BMI ενηλίκων κάτω των 20 ετών.' },
  { icon:'target', title:'Πώς κλιμακώνονται οι μερίδες',
    body:'Κάθε συνταγή είναι γραμμένη σε γραμμάρια υλικών για μία μερίδα αναφοράς. Κάθε υλικό ανήκει σε ομάδα πιάτου (πρωτεΐνη, υδατάνθρακες, λιπαρά, λαχανικά) και κλιμακώνεται με τον συντελεστή του κάθε μέλους — π.χ. λιγότερο ρύζι και περισσότερα λαχανικά για όποιον προσέχει τη ζυγαριά. Το μέγεθος του πιάτου προσαρμόζεται ώστε ο κύκλος των 28 ημερών να πέφτει στο κέντρο της εκτιμώμενης ενεργειακής ανάγκης: ποτέ κάτω από ×1,0, ποτέ για ενήλικα σε πρόγραμμα απώλειας και με ανώτατο ×1,5.' },
  { icon:'leaf', title:'Θρεπτικά από τα υλικά',
    body:'Ενέργεια, macros, ίνες, αλάτι, σίδηρος και ασβέστιο υπολογίζονται από τα γραμμάρια κάθε υλικού × τη σύστασή του (USDA FoodData Central). Η ενέργεια βγαίνει πάντα από τα macros με τους συντελεστές των ετικετών της ΕΕ: πρωτεΐνη και υδατάνθρακες 4, λιπαρά 9, φυτικές ίνες 2 kcal/g (οι υδατάνθρακες δεν περιλαμβάνουν τις ίνες). Συγκρίνονται με τιμές αναφοράς της EFSA (ίνες, σίδηρος, ασβέστιο) και του ΠΟΥ (αλάτι κάτω από 5 g). Το αλάτι που προσθέτεις εσύ στο μαγείρεμα δεν υπολογίζεται.' },
  { icon:'droplet', title:'Ενυδάτωση',
    body:'Ο στόχος ροφημάτων είναι το 80% της Επαρκούς Πρόσληψης νερού της EFSA για την ηλικία και το φύλο (2,0 L για γυναίκες και κορίτσια 14+, 2,5 L για άνδρες και αγόρια 14+) — το υπόλοιπο προέρχεται συνήθως από τα τρόφιμα. Οι αθλητές προσθέτουν υγρά για την προπόνηση. Δεν είναι ιατρική συνταγή: η ανάγκη αλλάζει με τη ζέστη, την εφίδρωση, την ασθένεια και τα φάρμακα.' },
  { icon:'alert', title:'Τι δεν κάνει η εφαρμογή',
    body:'Δεν μετράει κατανάλωση χωρίς επιβεβαίωση, δεν βάζει αυθαίρετο «health score», δεν δίνει στόχο απώλειας βάρους σε ανήλικο και δεν αντικαθιστά ιατρική φροντίδα. Όλα τα νούμερα είναι εκτιμήσεις προγραμματισμού, όχι μετρήσεις.' }
];

export const SAFETY = [
  'Εκπαιδευτικό εργαλείο ευεξίας — δεν αποτελεί ιατρική φροντίδα, διάγνωση ή θεραπεία.',
  'Κανένα έλλειμμα θερμίδων και καμία κατηγορία BMI ενηλίκων σε προφίλ κάτω των 20 ετών.',
  'Το μέγεθος πιάτου ενός μέλους δεν πέφτει ποτέ κάτω από τη μερίδα αναφοράς για να «πιάσει» έναν στόχο.',
  'Οι μετρήσεις αξιολογούνται ως τάση 3–4 εβδομάδων, ποτέ μεμονωμένα.',
  'Τα δεδομένα μένουν στη συσκευή. Δεν υπάρχει λογαριασμός, διακομιστής ή παρακολούθηση.',
  'Σε εγκυμοσύνη, διαβήτη, νεφρική ή καρδιακή νόσο, διατροφική διαταραχή ή φαρμακευτική αγωγή: συμβουλέψου επαγγελματία υγείας πριν αλλάξεις τη διατροφή σου.'
];

export const GLOSSARY = [
  ['Macros', 'Οι τρεις θερμιδογόνες ομάδες: πρωτεΐνη (4 kcal/g), υδατάνθρακες (4 kcal/g, χωρίς τις ίνες) και λιπαρά (9 kcal/g). Οι φυτικές ίνες μετρούν 2 kcal/g.'],
  ['Μερίδα αναφοράς', 'Η ποσότητα ενός υλικού για έναν μέσο ενήλικα, πριν την προσαρμογή στο μέλος.'],
  ['Μέγεθος πιάτου', 'Πόσο μεγάλο είναι το πιάτο κάποιου σε σχέση με τη μερίδα αναφοράς, ώστε το πλάνο να καλύπτει την εκτιμώμενη ενέργειά του (×1,0 έως ×1,5).'],
  ['Φορτίο προπόνησης', 'Πόσο απαιτητική είναι η σημερινή προπόνηση. Αλλάζει υδατάνθρακες και υγρά — ποτέ τις θερμίδες ανήλικου προς τα κάτω.'],
  ['Επίπεδο δραστηριότητας (PAL)', 'Πολλαπλασιαστής της ενέργειας ηρεμίας: 1,4 = χαμηλή δραστηριότητα, 1,6 = μέτρια, 1,8 = δραστήρια, 2,0 = πολύ δραστήρια.'],
  ['Επαρκής Πρόσληψη (AI) · Πρόσληψη Αναφοράς (PRI)', 'Τιμές της EFSA για το τι πρέπει να παίρνει καθημερινά σχεδόν όλος ο πληθυσμός μιας ηλικίας και φύλου. Το «όριο» για το αλάτι είναι αντίστροφο: ό,τι δεν πρέπει να ξεπερνάς.'],
  ['Συντελεστές ενέργειας', 'Πώς τα macros γίνονται θερμίδες, όπως στις ετικέτες των τροφίμων της ΕΕ: 4/4/9 kcal ανά γραμμάριο και 2 για τις ίνες.'],
  ['RED-S', 'Σχετική ανεπάρκεια ενέργειας στον αθλητισμό — κίνδυνος σε νεαρούς αθλητές με χαμηλή ενεργειακή διαθεσιμότητα.']
];

export const QUICK_ACTIONS = [
  { id:'logNextMeal', icon:'check',   label:'Κατέγραψε το επόμενο γεύμα' },
  { id:'addWater',     icon:'droplet', label:'Πρόσθεσε 250 ml νερό' },
  { id:'logWeight',    icon:'scale',   label:'Κατέγραψε βάρος' },
  { id:'shopping',     icon:'cart',    label:'Λίστα αγορών' },
  { id:'print',        icon:'printer', label:'Εκτύπωση ημέρας' }
];

/* ── Persona focus ─────────────────────────────────────────────────────────
 * What each member should actually pay attention to. Keyed by goal, which maps
 * one-to-one onto the household: mother gradual_fat_loss, father maintain,
 * daughter growth, son performance. The engine supplies the live numbers; this
 * is the framing. Deliberately no deficit language on the growth profile.
 */
export const PERSONA_FOCUS = {
  gradual_fat_loss: {
    eyebrow: 'Ο ρυθμός μετράει',
    title: 'Σταθερά, χωρίς να χάνεις μυς',
    lead: 'Στόχος είναι ο ρυθμός, όχι η ταχύτητα. Το μικρό έλλειμμα έρχεται από πιο ελαφρύ πιάτο — λιγότερο ρύζι και ψωμί, περισσότερα λαχανικά — όχι από νηστεία. Ό,τι λείπει το καλύπτεις με προσθήκες.'
  },
  maintain: {
    eyebrow: 'Συντήρηση',
    title: 'Σταθερότητα και καρδιομεταβολική υγεία',
    lead: 'Το πλάνο κρατά σταθερή ενέργεια και πρωτεΐνη. Η προσοχή πάει στην ποιότητα των λιπαρών και στο αλάτι, όχι στην ποσότητα.'
  },
  growth: {
    eyebrow: 'Ανάπτυξη',
    title: 'Ενέργεια και ποικιλία — χωρίς μετρητές',
    lead: 'Σε αυτό το προφίλ δεν εφαρμόζεται ποτέ έλλειμμα θερμίδων και δεν εμφανίζεται κατηγορία BMI ενηλίκων. Δεν υπάρχει «καλό» και «κακό» φαγητό εδώ.'
  },
  performance: {
    eyebrow: 'Απόδοση',
    title: 'Καύσιμο γύρω από την προπόνηση',
    lead: 'Οι υδατάνθρακες ρυθμίζονται ανάλογα με το σημερινό φορτίο. Η ενέργεια και η πρωτεΐνη παραμένουν σταθερές — δεν μπαίνει ποτέ έλλειμμα σε αυτή την ηλικία.'
  }
};

/* ── Training fueling ──────────────────────────────────────────────────────
 * General sports-nutrition guidance (ACSM/AND/DC 2016, SDA 2014), expressed per kg so
 * it scales to the athlete. Ranges, never a single prescription.
 */
export const FUELING = {
  pre: {
    icon: 'clock',
    title: 'Πριν την προπόνηση',
    body: 'Γεύμα με υδατάνθρακες 2–3 ώρες πριν. Αν μένει λιγότερο από 1 ώρα, μικρό εύπεπτο σνακ — μπανάνα, ψωμί με μέλι. Εύρος σχεδιασμού εντός των 1–4 g/kg της ACSM.',
    perKg: [1, 3],
    unit: 'g υδατανθράκων'
  },
  post: {
    icon: 'refresh',
    title: 'Μετά την προπόνηση',
    body: 'Συνδύασε πρωτεΐνη (~0,3 g/kg) με υδατάνθρακες (~1 g/kg) μέσα σε ~2 ώρες. Το επόμενο κανονικό γεύμα της ημέρας καλύπτει συνήθως τον στόχο.',
    proteinPerKg: 0.3,
    carbPerKg: 1.0,
    unit: 'g'
  },
  fluid: {
    icon: 'droplet',
    title: 'Υγρά',
    body: 'Αναπλήρωσε περίπου 125–150% των υγρών που έχασες — δηλαδή 1,25–1,5 L για κάθε κιλό που πέφτει η ζυγαριά μετά την προπόνηση.',
    unit: 'ml'
  }
};

/* ── Provenance summary, shown in the Guide ────────────────────────────────
 * Counted from the food table itself so it can never drift from it. */
const foodList = Object.values(FOODS);
export const DATA_FACTS = {
  foods: foodList.length,
  usda: foodList.filter(f => f.fdc && !f.proxy).length,
  proxy: foodList.filter(f => f.fdc && f.proxy).length,
  approx: foodList.filter(f => f.approx).length
};
