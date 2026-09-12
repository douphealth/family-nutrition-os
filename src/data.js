/**
 * ZENITH PRO · data layer
 * ---------------------------------------------------------------------------
 * All content lives here so the app ships with zero network dependencies and
 * works fully offline. Nothing in this file performs I/O.
 *
 * Macro convention
 *   `base` describes ONE reference adult serving of the recipe.
 *   kcal is always derived from macros with Atwater factors (4/4/9) by
 *   `nutrition-engine.js`, never stored separately, so the numbers can never
 *   disagree with each other. See METHOD for the citation.
 */

export const APP = {
  name: 'ZENITH PRO',
  subtitle: 'Οικογενειακό Σύστημα Διατροφής',
  version: '4.2.0',
  updated: '2026-09-12',
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
  { id:'mother',   name:'Αναστασία',  relation:'Μητέρα',  role:'Υγεία & σταδιακή απώλεια λίπους', sex:'f', age:51, height:167, weight:87, activityFactor:1.35, goal:'gradual_fat_loss', athlete:false, accent:'#0E9F6E', notes:'Στόχος ρυθμού, όχι ταχύτητας.' },
  { id:'father',   name:'Αλέξης',     relation:'Πατέρας', role:'Συντήρηση & καρδιομεταβολική υγεία', sex:'m', age:54, height:178, weight:78, activityFactor:1.40, goal:'maintain',         athlete:false, accent:'#2F6FED', notes:'Προσοχή στο αλάτι.' },
  { id:'daughter', name:'Αλεξάνδρα',  relation:'Κόρη',    role:'Ανάπτυξη & ενέργεια',              sex:'f', age:17, height:165, weight:52, activityFactor:1.55, goal:'growth',            athlete:false, accent:'#D9457A', notes:'Ποικιλία & σίδηρος.' },
  { id:'son',      name:'Δημήτρης',   relation:'Γιος',    role:'Basketball · απόδοση & αποκατάσταση', sex:'m', age:15, height:179, weight:67, activityFactor:1.80, goal:'performance', athlete:true,  accent:'#D98A16', notes:'Διπλές προπονήσεις Τρ/Πε.' }
];

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
  { id:'produce', label:'Οπωροπωλείο',      icon:'leaf' },
  { id:'protein', label:'Κρεοπωλείο & Ψάρια', icon:'drumstick' },
  { id:'dairy',   label:'Γαλακτοκομικά',    icon:'milk' },
  { id:'pantry',  label:'Ξηρά & Κονσέρβες', icon:'jar' },
  { id:'bakery',  label:'Αρτοποιείο',       icon:'bread' },
  { id:'frozen',  label:'Κατεψυγμένα',      icon:'snowflake' }
];

/* ── Recipes ───────────────────────────────────────────────────────────────
 * a = aisle, q = quantity, u = unit, n = name
 * tags: batch = cooks well in bulk · fast = under 15 min · athlete = recovery
 *       legume · fish · veg · highprotein
 */
export const RECIPES = [
  { id:'oats', name:'Γιαούρτι, βρώμη & φρούτο', slot:'breakfast', time:5, tags:['fast','highprotein'],
    base:{ p:24, c:58, f:13 },
    ingredients:[
      { n:'Γιαούρτι στραγγιστό 2%', q:200, u:'g', a:'dairy' },
      { n:'Βρώμη',                  q:50,  u:'g', a:'pantry' },
      { n:'Μπανάνα',                q:1,   u:'τεμ', a:'produce' },
      { n:'Καρύδια',                q:15,  u:'g', a:'pantry' }
    ],
    steps:['Βάλε τη βρώμη στο γιαούρτι και άστην 5′ να μαλακώσει.','Κόψε το φρούτο από πάνω.','Πρόσθεσε τους ξηρούς καρπούς τελευταία για να μείνουν τραγανιστοί.'],
    tip:'Ιδανικό πρωινό πριν από πρωινή προπόνηση: υδατάνθρακες + πρωτεΐνη σε ένα μπολ.' },

  { id:'eggs', name:'Αυγά, ψωμί ολικής & ντομάτα', slot:'breakfast', time:10, tags:['highprotein'],
    base:{ p:23, c:47, f:17 },
    ingredients:[
      { n:'Αυγά',            q:2,  u:'τεμ', a:'dairy' },
      { n:'Ψωμί ολικής',     q:70, u:'g',  a:'bakery' },
      { n:'Ντομάτα',         q:1,  u:'τεμ', a:'produce' },
      { n:'Ελιές',           q:15, u:'g',  a:'pantry' },
      { n:'Ελαιόλαδο',       q:5,  u:'ml', a:'pantry' }
    ],
    steps:['Ψήσε τα αυγά στο ελαιόλαδο σε μέτρια φωτιά.','Σέρβιρε με ψωμί ολικής και φρέσκια ντομάτα.','Οι ελιές μπαίνουν στο τέλος, χωρίς επιπλέον αλάτι.'],
    tip:'Το αλάτι στις ελιές αρκεί — μη προσθέτεις επιπλέον στο πιάτο.' },

  { id:'lentils', name:'Φακές, σαλάτα & φέτα', slot:'lunch', time:35, tags:['legume','batch','veg'],
    base:{ p:28, c:76, f:17 },
    ingredients:[
      { n:'Φακές ξηρές',   q:80,  u:'g',  a:'pantry' },
      { n:'Καρότο',        q:1,   u:'τεμ', a:'produce' },
      { n:'Κρεμμύδι',      q:1,   u:'τεμ', a:'produce' },
      { n:'Ελαιόλαδο',     q:15,  u:'ml', a:'pantry' },
      { n:'Ντομάτα',       q:2,   u:'τεμ', a:'produce' },
      { n:'Φέτα',          q:40,  u:'g',  a:'dairy' }
    ],
    steps:['Βράσε τις φακές με καρότο και κρεμμύδι ~25′.','Άφησε να τραβήξουν και πρόσθεσε ελαιόλαδο εκτός φωτιάς.','Σέρβιρε με ντομάτα και φέτα.'],
    tip:'Μαγείρεψε διπλή ποσότητα: κρατά 3 ημέρες στο ψυγείο και μπαίνει σε ταπεράκι.' },

  { id:'chickenTray', name:'Κοτόπουλο λεμονάτο, πατάτα & σαλάτα', slot:'lunch', time:45, tags:['highprotein','batch'],
    base:{ p:48, c:72, f:20 },
    ingredients:[
      { n:'Στήθος κοτόπουλου', q:200, u:'g',  a:'protein' },
      { n:'Πατάτες',           q:250, u:'g',  a:'produce' },
      { n:'Λεμόνι',            q:1,   u:'τεμ', a:'produce' },
      { n:'Ελαιόλαδο',         q:15,  u:'ml', a:'pantry' },
      { n:'Μαρούλι & αγγούρι', q:150, u:'g',  a:'produce' }
    ],
    steps:['Σε ταψί: κοτόπουλο, πατάτες, λεμόνι, ελαιόλαδο, ρίγανη.','Ψήσε 40′ στους 200°C.','Σέρβιρε με φρέσκια σαλάτα στο πλάι.'],
    tip:'Ένα ταψί = δύο γεύματα. Το δεύτερο κρυώνει και μπαίνει σε ταπεράκι για αύριο.' },

  { id:'fishRice', name:'Ψάρι, ρύζι & χόρτα', slot:'lunch', time:30, tags:['fish','highprotein'],
    base:{ p:42, c:68, f:19 },
    ingredients:[
      { n:'Φιλέτο ψαριού', q:180, u:'g',  a:'protein' },
      { n:'Ρύζι',          q:80,  u:'g',  a:'pantry' },
      { n:'Χόρτα εποχής',  q:200, u:'g',  a:'produce' },
      { n:'Ελαιόλαδο',     q:15,  u:'ml', a:'pantry' },
      { n:'Λεμόνι',        q:1,   u:'τεμ', a:'produce' }
    ],
    steps:['Βράσε το ρύζι και τα χόρτα χωριστά.','Ψήσε το ψάρι στο τηγάνι ή στο φούρνο ~12′.','Λεμόνι και ελαιόλαδο από πάνω, όχι μέσα στο μαγείρεμα.'],
    tip:'Στόχος: ψάρι 2 φορές την εβδομάδα, με ποικιλία ειδών.' },

  { id:'gigantes', name:'Γίγαντες & χωριάτικη', slot:'lunch', time:50, tags:['legume','batch','veg'],
    base:{ p:25, c:79, f:18 },
    ingredients:[
      { n:'Γίγαντες ξηροί', q:80,  u:'g',  a:'pantry' },
      { n:'Ντομάτα',        q:3,   u:'τεμ', a:'produce' },
      { n:'Κρεμμύδι',       q:1,   u:'τεμ', a:'produce' },
      { n:'Ελαιόλαδο',      q:20,  u:'ml', a:'pantry' },
      { n:'Αγγούρι',        q:1,   u:'τεμ', a:'produce' },
      { n:'Φέτα',           q:40,  u:'g',  a:'dairy' }
    ],
    steps:['Μούλιασε τους γίγαντες από το προηγούμενο βράδυ.','Ψήσε με ντομάτα, κρεμμύδι, ελαιόλαδο ~45′ στους 180°C.','Σέρβιρε με χωριάτικη σαλάτα.'],
    tip:'Τα όσπρια είναι το φθηνότερο και πιο χορταστικό πιάτο της εβδομάδας.' },

  { id:'omelet', name:'Ομελέτα λαχανικών & ψωμί', slot:'dinner', time:12, tags:['fast','highprotein','veg'],
    base:{ p:30, c:38, f:22 },
    ingredients:[
      { n:'Αυγά',        q:3,   u:'τεμ', a:'dairy' },
      { n:'Σπανάκι',     q:100, u:'g',  a:'produce' },
      { n:'Μανιτάρια',   q:100, u:'g',  a:'produce' },
      { n:'Ψωμί ολικής', q:50,  u:'g',  a:'bakery' },
      { n:'Ελαιόλαδο',   q:10,  u:'ml', a:'pantry' }
    ],
    steps:['Σόταρε τα λαχανικά 3′.','Ρίξε τα χτυπημένα αυγά και άφησε να δέσουν σε χαμηλή φωτιά.','Σέρβιρε με ψωμί ολικής.'],
    tip:'Γρήγορο βραδινό όταν γυρίζετε αργά — έτοιμο σε 12 λεπτά.' },

  { id:'dakos', name:'Ντάκος ολικής', slot:'dinner', time:6, tags:['fast','veg'],
    base:{ p:18, c:52, f:23 },
    ingredients:[
      { n:'Παξιμάδι κριθαρένιο', q:1,  u:'τεμ', a:'bakery' },
      { n:'Ντομάτα',             q:2,  u:'τεμ', a:'produce' },
      { n:'Ξινομυζήθρα ή φέτα',  q:60, u:'g',  a:'dairy' },
      { n:'Ελιές',               q:20, u:'g',  a:'pantry' },
      { n:'Ελαιόλαδο',           q:10, u:'ml', a:'pantry' }
    ],
    steps:['Βρέξε ελαφρά το παξιμάδι.','Τρίψε τη ντομάτα από πάνω με λίγο αλάτι.','Πρόσθεσε τυρί, ελιές και ελαιόλαδο.'],
    tip:'Πλήρες βραδινό σε 6 λεπτά, χωρίς μαγείρεμα.' },

  { id:'yogSnack', name:'Γιαούρτι & φρούτο', slot:'snack', time:2, tags:['fast','highprotein'],
    base:{ p:15, c:30, f:4 },
    ingredients:[
      { n:'Γιαούρτι στραγγιστό 2%', q:170, u:'g', a:'dairy' },
      { n:'Φρούτο εποχής',          q:150, u:'g', a:'produce' }
    ],
    steps:['Σέρβιρε το γιαούρτι σε μπολ.','Κόψε το φρούτο από πάνω.'],
    tip:'Το πιο εύκολο σνακ του σπιτιού — μηδέν προετοιμασία.' },

  { id:'bananaToast', name:'Μπανάνα & ψωμί με ταχίνι', slot:'snack', time:3, tags:['fast','athlete'],
    base:{ p:10, c:52, f:10 },
    ingredients:[
      { n:'Μπανάνα',     q:1,  u:'τεμ', a:'produce' },
      { n:'Ψωμί ολικής', q:50, u:'g',  a:'bakery' },
      { n:'Ταχίνι',      q:15, u:'g',  a:'pantry' }
    ],
    steps:['Άλειψε το ταχίνι στο ψωμί.','Κόψε τη μπανάνα από πάνω.'],
    tip:'Γρήγορος υδατάνθρακας πριν από προπόνηση.' },

  { id:'milkRecovery', name:'Αποκατάσταση: γάλα, μπανάνα & βρώμη', slot:'snack', time:3, tags:['athlete','fast'],
    base:{ p:22, c:60, f:8 },
    ingredients:[
      { n:'Γάλα ή γιαούρτι', q:300, u:'ml', a:'dairy' },
      { n:'Μπανάνα',         q:1,   u:'τεμ', a:'produce' },
      { n:'Βρώμη',           q:40,  u:'g',  a:'pantry' }
    ],
    steps:['Χτύπησε όλα τα υλικά στο μπλέντερ.','Πιες μέσα σε 60′ από την προπόνηση.'],
    tip:'Υδατάνθρακες + πρωτεΐνη + υγρά σε ένα ποτήρι, για τις ημέρες με διπλή προπόνηση.' },

  { id:'pastaVeg', name:'Ζυμαρικά ολικής, ντομάτα & λαχανικά', slot:'dinner', time:20, tags:['veg','fast'],
    base:{ p:24, c:86, f:17 },
    ingredients:[
      { n:'Ζυμαρικά ολικής', q:90,  u:'g',  a:'pantry' },
      { n:'Ντομάτα κονκασέ', q:200, u:'g',  a:'pantry' },
      { n:'Κολοκύθι & πιπεριά', q:200, u:'g', a:'produce' },
      { n:'Τυρί τριμμένο',   q:30,  u:'g',  a:'dairy' },
      { n:'Ελαιόλαδο',       q:10,  u:'ml', a:'pantry' }
    ],
    steps:['Βράσε τα ζυμαρικά al dente.','Σόταρε τα λαχανικά, πρόσθεσε την ντομάτα.','Ένωσε, πασπάλισε τυρί και σέρβιρε.'],
    tip:'Ιδανικό βραδινό πριν από αγώνα την επόμενη μέρα.' },

  { id:'greekSalad', name:'Χωριάτικη με φέτα', slot:'snack', time:7, tags:['fast','veg'],
    base:{ p:9, c:14, f:16 },
    ingredients:[
      { n:'Ντομάτα', q:2,  u:'τεμ', a:'produce' },
      { n:'Αγγούρι', q:1,  u:'τεμ', a:'produce' },
      { n:'Πιπεριά', q:1,  u:'τεμ', a:'produce' },
      { n:'Κρεμμύδι', q:1, u:'τεμ', a:'produce' },
      { n:'Φέτα',    q:50, u:'g',  a:'dairy' },
      { n:'Ελιές',   q:20, u:'g',  a:'pantry' },
      { n:'Ελαιόλαδο', q:12, u:'ml', a:'pantry' }
    ],
    steps:['Κόψε τα λαχανικά σε χοντρά κομμάτια.','Πρόσθεσε φέτα, ελιές και ελαιόλαδο.','Ρίγανη και έτοιμο.'],
    tip:'Το ελαιόλαδο μετριέται — μία κουταλιά είναι ~10 ml, όχι "ένα αυλάκι".' },

  { id:'chickenSouvlaki', name:'Σουβλάκι κοτόπουλο με πίτα ολικής', slot:'dinner', time:25, tags:['highprotein'],
    base:{ p:42, c:58, f:16 },
    ingredients:[
      { n:'Κοτόπουλο φιλέτο', q:180, u:'g', a:'protein' },
      { n:'Πίτα ολικής',      q:1,   u:'τεμ', a:'bakery' },
      { n:'Ντομάτα',          q:1,   u:'τεμ', a:'produce' },
      { n:'Κρεμμύδι',         q:1,   u:'τεμ', a:'produce' },
      { n:'Γιαούρτι στραγγιστό', q:60, u:'g', a:'dairy' }
    ],
    steps:['Μαρινάρε το κοτόπουλο με λεμόνι και ρίγανη.','Ψήσε σε δυνατή φωτιά 8′ ανά πλευρά.','Τύλιξε σε πίτα με ντομάτα, κρεμμύδι και γιαούρτι αντί για σάλτσα.'],
    tip:'Το γιαούρτι αντί για έτοιμη σάλτσα κόβει ζάχαρη και αλάτι χωρίς να χάνει γεύση.' },

  { id:'revithia', name:'Ρεβίθια λεμονάτα στο φούρνο', slot:'lunch', time:55, tags:['legume','batch','veg'],
    base:{ p:24, c:74, f:16 },
    ingredients:[
      { n:'Ρεβίθια ξηρά', q:80,  u:'g',  a:'pantry' },
      { n:'Κρεμμύδι',     q:1,   u:'τεμ', a:'produce' },
      { n:'Λεμόνι',       q:1,   u:'τεμ', a:'produce' },
      { n:'Ελαιόλαδο',    q:18,  u:'ml', a:'pantry' },
      { n:'Χόρτα εποχής', q:200, u:'g',  a:'produce' }
    ],
    steps:['Μούλιασε τα ρεβίθια από το βράδυ.','Ψήσε με κρεμμύδι και λεμόνι ~50′.','Σέρβιρε με χόρτα στο πλάι.'],
    tip:'Ψήσε σε μεγάλο ταψί — τρώγεται ζεστό ή κρύο την επόμενη μέρα.' },

  { id:'fasolada', name:'Φασολάδα με ελαιόλαδο', slot:'lunch', time:50, tags:['legume','batch'],
    base:{ p:23, c:72, f:15 },
    ingredients:[
      { n:'Φασόλια ξηρά', q:80,  u:'g',  a:'pantry' },
      { n:'Καρότο',       q:1,   u:'τεμ', a:'produce' },
      { n:'Σέλινο',       q:100, u:'g',  a:'produce' },
      { n:'Ντομάτα κονκασέ', q:200, u:'g', a:'pantry' },
      { n:'Ελαιόλαδο',    q:15,  u:'ml', a:'pantry' }
    ],
    steps:['Μούλιασε τα φασόλια από το βράδυ.','Βράσε με καρότο και σέλινο ~40′.','Πρόσθεσε ντομάτα και ελαιόλαδο στο τέλος.'],
    tip:'Κλασικό ελληνικό χειμωνιάτικο πιάτο — χορταστικό και οικονομικό.' },

  { id:'bakedFish', name:'Ψάρι πλακί με λαχανικά', slot:'dinner', time:35, tags:['fish','highprotein','veg'],
    base:{ p:40, c:22, f:18 },
    ingredients:[
      { n:'Φιλέτο ψαριού', q:180, u:'g',  a:'protein' },
      { n:'Ντομάτα',       q:2,   u:'τεμ', a:'produce' },
      { n:'Πιπεριά',       q:1,   u:'τεμ', a:'produce' },
      { n:'Κρεμμύδι',      q:1,   u:'τεμ', a:'produce' },
      { n:'Ελαιόλαδο',     q:15,  u:'ml', a:'pantry' },
      { n:'Λεμόνι',        q:1,   u:'τεμ', a:'produce' }
    ],
    steps:['Στρώσε τα λαχανικά σε ταψί.','Βάλε το ψάρι από πάνω με λεμόνι και ελαιόλαδο.','Ψήσε 30′ στους 190°C.'],
    tip:'Ελαφρύ βραδινό — καλή επιλογή την ημέρα πριν από αγώνα.' },

  { id:'gemista', name:'Γεμιστά με ρύζι & μυρωδικά', slot:'lunch', time:70, tags:['veg','batch'],
    base:{ p:18, c:82, f:16 },
    ingredients:[
      { n:'Πιπεριές & ντομάτες', q:4,  u:'τεμ', a:'produce' },
      { n:'Ρύζι',                q:70, u:'g',   a:'pantry' },
      { n:'Κρεμμύδι',            q:1,  u:'τεμ', a:'produce' },
      { n:'Μαϊντανός & δυόσμος', q:20, u:'g',   a:'produce' },
      { n:'Ελαιόλαδο',           q:20, u:'ml',  a:'pantry' }
    ],
    steps:['Άδειασε τα λαχανικά και κράτησε τη σάρκα.','Ανακάτεψε ρύζι, κρεμμύδι, μυρωδικά, ελαιόλαδο.','Γέμισε, σκέπασε και ψήσε 60′ στους 180°C.'],
    tip:'Τρώγονται και κρύα — ιδανικά για ταπεράκι στο σχολείο.' },

  { id:'spinachRice', name:'Σπανακόρυζο με φέτα', slot:'dinner', time:30, tags:['veg','fast'],
    base:{ p:20, c:64, f:16 },
    ingredients:[
      { n:'Σπανάκι',  q:400, u:'g', a:'produce' },
      { n:'Ρύζι',     q:70,  u:'g', a:'pantry' },
      { n:'Κρεμμύδι', q:1,   u:'τεμ', a:'produce' },
      { n:'Φέτα',     q:40,  u:'g', a:'dairy' },
      { n:'Ελαιόλαδο', q:15, u:'ml', a:'pantry' }
    ],
    steps:['Σόταρε το κρεμμύδι, πρόσθεσε το σπανάκι να μαραθεί.','Ρίξε το ρύζι και νερό, σιγόβρασε 18′.','Φέτα στο τέλος.'],
    tip:'Πολύ σίδηρος και φυλλικό οξύ — χρήσιμο για εφήβους σε ανάπτυξη.' },

  { id:'yogHoney', name:'Γιαούρτι με μέλι & καρύδια', slot:'snack', time:2, tags:['fast','highprotein'],
    base:{ p:17, c:22, f:12 },
    ingredients:[
      { n:'Γιαούρτι στραγγιστό 2%', q:200, u:'g', a:'dairy' },
      { n:'Μέλι',                   q:10,  u:'g', a:'pantry' },
      { n:'Καρύδια',                q:15,  u:'g', a:'pantry' }
    ],
    steps:['Σέρβιρε το γιαούρτι.','Μέλι και καρύδια από πάνω.'],
    tip:'Το μέλι μετριέται με κουταλάκι — μία κουταλιά, όχι ελεύθερη ροή.' },

  { id:'fruitSalad', name:'Φρουτοσαλάτα εποχής', slot:'snack', time:5, tags:['fast','veg'],
    base:{ p:2, c:30, f:1 },
    ingredients:[
      { n:'Φρούτα εποχής', q:300, u:'g', a:'produce' },
      { n:'Λεμόνι',        q:1,   u:'τεμ', a:'produce' }
    ],
    steps:['Κόψε τα φρούτα σε μπολ.','Λίγο λεμόνι για να μη μαυρίσουν.'],
    tip:'Στόχος: 5 μερίδες φρούτων & λαχανικών την ημέρα για όλη την οικογένεια.' },

  { id:'trahana', name:'Τραχανάς με φέτα', slot:'dinner', time:20, tags:['fast','veg'],
    base:{ p:18, c:58, f:12 },
    ingredients:[
      { n:'Τραχανάς', q:70,  u:'g',  a:'pantry' },
      { n:'Ντομάτα',  q:2,   u:'τεμ', a:'produce' },
      { n:'Φέτα',     q:40,  u:'g',  a:'dairy' },
      { n:'Ελαιόλαδο', q:10, u:'ml', a:'pantry' }
    ],
    steps:['Βράσε τον τραχανά σε νερό ή ζωμό.','Πρόσθεσε τριμμένη ντομάτα.','Φέτα και ελαιόλαδο στο σερβίρισμα.'],
    tip:'Ζεστό, εύπεπτο βραδινό — καλό για κρύες μέρες.' },

  { id:'meatballs', name:'Μπιφτέκια φούρνου με πατάτες', slot:'lunch', time:45, tags:['highprotein','batch'],
    base:{ p:38, c:56, f:22 },
    ingredients:[
      { n:'Κιμάς μοσχαρίσιος', q:180, u:'g',  a:'protein' },
      { n:'Πατάτες',           q:250, u:'g',  a:'produce' },
      { n:'Κρεμμύδι',          q:1,   u:'τεμ', a:'produce' },
      { n:'Αυγό',              q:1,   u:'τεμ', a:'dairy' },
      { n:'Ελαιόλαδο',         q:12,  u:'ml', a:'pantry' }
    ],
    steps:['Ζύμωσε κιμά, κρεμμύδι, αυγό και μυρωδικά.','Πλάσε μπιφτέκια, βάλε σε ταψί με πατάτες.','Ψήσε 35′ στους 200°C.'],
    tip:'Ψήσιμο στο φούρνο αντί τηγάνι: ίδια γεύση, λιγότερο λάδι.' },

  { id:'smoothie', name:'Smoothie μπανάνα-γάλα-βρώμη', slot:'snack', time:3, tags:['athlete','fast'],
    base:{ p:18, c:48, f:6 },
    ingredients:[
      { n:'Γάλα',   q:250, u:'ml',  a:'dairy' },
      { n:'Μπανάνα', q:1,  u:'τεμ', a:'produce' },
      { n:'Βρώμη',  q:35,  u:'g',   a:'pantry' }
    ],
    steps:['Χτύπησε τα υλικά στο μπλέντερ.','Πιες αμέσως, κρύο.'],
    tip:'Εύκολος τρόπος να φας πρωινό όταν δεν πεινάς πριν από πρωινή προπόνηση.' }
];

/* ── 28-day rotation ───────────────────────────────────────────────────────
 * One shared family meal per slot; portions differ per member. Aligned to
 * Monday–Sunday so the cycle matches real weeks. Day 1 = Monday of week 1.
 */
const ROTATION = [
  [ // Week 1 — ψάρι Παρασκευή, όσπρια Δευτέρα/Πέμπτη, recovery σνακ Τρίτη
    ['oats','lentils','yogSnack','omelet'],
    ['eggs','chickenTray','milkRecovery','dakos'],
    ['oats','fishRice','bananaToast','spinachRice'],
    ['eggs','revithia','greekSalad','pastaVeg'],
    ['oats','gigantes','fruitSalad','bakedFish'],
    ['eggs','gemista','smoothie','chickenSouvlaki'],
    ['oats','meatballs','yogHoney','trahana']
  ],
  [ // Week 2
    ['eggs','fasolada','greekSalad','omelet'],
    ['oats','chickenTray','milkRecovery','spinachRice'],
    ['eggs','fishRice','bananaToast','pastaVeg'],
    ['oats','gemista','yogSnack','trahana'],
    ['eggs','revithia','fruitSalad','bakedFish'],
    ['oats','meatballs','smoothie','chickenSouvlaki'],
    ['eggs','gigantes','yogHoney','dakos']
  ],
  [ // Week 3
    ['oats','lentils','yogSnack','pastaVeg'],
    ['eggs','chickenTray','bananaToast','omelet'],
    ['oats','revithia','milkRecovery','spinachRice'],
    ['eggs','fishRice','greekSalad','trahana'],
    ['oats','gemista','fruitSalad','bakedFish'],
    ['eggs','meatballs','smoothie','dakos'],
    ['oats','gigantes','yogHoney','chickenSouvlaki']
  ],
  [ // Week 4
    ['eggs','fasolada','yogHoney','omelet'],
    ['oats','chickenTray','fruitSalad','pastaVeg'],
    ['eggs','gigantes','milkRecovery','trahana'],
    ['oats','fishRice','greekSalad','spinachRice'],
    ['eggs','revithia','bananaToast','bakedFish'],
    ['oats','meatballs','smoothie','chickenSouvlaki'],
    ['eggs','lentils','yogSnack','dakos']
  ]
];

const DOW = ['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
export const PLAN_28 = ROTATION.flatMap((week, wi) =>
  week.map((slots, di) => ({
    day: wi * 7 + di + 1,
    week: wi + 1,
    dow: DOW[di],
    breakfast: slots[0],
    lunch: slots[1],
    snack: slots[2],
    dinner: slots[3]
  }))
);

/* ── Evidence ──────────────────────────────────────────────────────────────
 * Every claim the app makes traces back to one of these. Links are canonical
 * pages; some publishers block automated requests but open fine in a browser.
 */
export const SOURCES = [
  { id:'who',    label:'WHO — Healthy diet (fact sheet)',                    url:'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',              used:'Γενικές αρχές: φρούτα, λαχανικά, όσπρια, αλάτι, ζάχαρη, λιπαρά.' },
  { id:'cdc',    label:'CDC — Child & teen BMI categories',                  url:'https://www.cdc.gov/bmi/child-teen-calculator/bmi-categories.html',          used:'Γιατί το BMI ενηλίκων δεν ισχύει κάτω των 20 ετών.' },
  { id:'reds',   label:'IOC consensus — RED-S (Br J Sports Med 2023)',       url:'https://bjsm.bmj.com/content/57/17/1073',                                    used:'Διαθεσιμότητα ενέργειας σε νεαρούς αθλητές.' },
  { id:'efsa',   label:'EFSA — Dietary reference values for water',          url:'https://www.efsa.europa.eu/en/efsajournal/pub/1459',                          used:'Βάση υπολογισμού ενυδάτωσης.' },
  { id:'mifflin',label:'Mifflin & St Jeor (1990) — resting energy',          url:'https://pubmed.ncbi.nlm.nih.gov/2305711/',                                    used:'Εξίσωση βασικού μεταβολισμού για ενήλικες.' },
  { id:'fao',    label:'FAO/WHO/UNU — Energy & protein requirements',        url:'https://www.fao.org/4/aa040e/aa040e00.htm',                                   used:'Συντελεστές δραστηριότητας & ανάγκες πρωτεΐνης.' },
  { id:'issn',   label:'ISSN position stand — Protein & exercise',           url:'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8',          used:'Εύρος πρωτεΐνης για αθλητές (1,4–1,8 g/kg).' },
  { id:'niddk',  label:'NIH — Body weight planner & energy balance',         url:'https://www.ncbi.nlm.nih.gov/books/NBK545442/',                               used:'Γιατί αξιολογούμε τάση 3–4 εβδομάδων, όχι μία μέρα.' },
  { id:'moh',    label:'Υπουργείο Υγείας (Ελλάδα)',                          url:'https://www.moh.gov.gr/',                                                     used:'Εθνικό πλαίσιο δημόσιας υγείας.' }
];

/* ── Methodology, shown verbatim in the app ────────────────────────────── */
export const METHOD = [
  { icon:'flame', title:'Ενέργεια ενηλίκων',
    body:'Εξίσωση Mifflin–St Jeor για βασικό μεταβολισμό × συντελεστή δραστηριότητας. Σταδιακή απώλεια λίπους = −12% της συντήρησης. Εμφανίζεται πάντα ως εύρος ±6%, ποτέ ως ένας «μαγικός» αριθμός.' },
  { icon:'users', title:'Ενέργεια εφήβων',
    body:'Εκτίμηση τύπου Schofield με ευρύ συντελεστή. Δεν εφαρμόζεται ποτέ έλλειμμα σε ανήλικο προφίλ και δεν εμφανίζεται κατηγορία BMI ενηλίκων κάτω των 20 ετών.' },
  { icon:'target', title:'Πώς κλιμακώνονται οι μερίδες',
    body:'Κάθε συνταγή έχει macros για μία μερίδα αναφοράς. Οι μερίδες του κάθε μέλους κλιμακώνουν χωριστά πρωτεΐνη, υδατάνθρακες και λιπαρά. Οι θερμίδες υπολογίζονται από τα macros με συντελεστές Atwater 4/4/9 — δεν αποθηκεύονται χωριστά, ώστε να μην μπορούν ποτέ να διαφωνήσουν μεταξύ τους.' },
  { icon:'droplet', title:'Ενυδάτωση',
    body:'30 ml/kg βάρος ως αρχική εκτίμηση, με προσαύξηση ανάλογα με το φορτίο προπόνησης. Θερμότητα, εφίδρωση, ασθένεια και φάρμακα αλλάζουν σημαντικά την ανάγκη.' },
  { icon:'alert', title:'Τι δεν κάνει η εφαρμογή',
    body:'Δεν μετράει κατανάλωση χωρίς επιβεβαίωση, δεν βάζει αυθαίρετο «health score», δεν δίνει στόχο απώλειας βάρους σε ανήλικο και δεν αντικαθιστά ιατρική φροντίδα. Όλα τα νούμερα είναι εκτιμήσεις προγραμματισμού, όχι μετρήσεις.' }
];

export const SAFETY = [
  'Εκπαιδευτικό εργαλείο ευεξίας — δεν αποτελεί ιατρική φροντίδα, διάγνωση ή θεραπεία.',
  'Κανένα έλλειμμα θερμίδων και καμία κατηγορία BMI ενηλίκων σε προφίλ κάτω των 20 ετών.',
  'Οι μετρήσεις αξιολογούνται ως τάση 3–4 εβδομάδων, ποτέ μεμονωμένα.',
  'Τα δεδομένα μένουν στη συσκευή. Δεν υπάρχει λογαριασμός, διακομιστής ή παρακολούθηση.',
  'Σε εγκυμοσύνη, διαβήτη, νεφρική ή καρδιακή νόσο, διατροφική διαταραχή ή φαρμακευτική αγωγή: συμβουλέψου επαγγελματία υγείας πριν αλλάξεις τη διατροφή σου.'
];

export const GLOSSARY = [
  ['Macros', 'Οι τρεις θερμιδογόνοι ομάδες: πρωτεΐνη (4 kcal/g), υδατάνθρακες (4 kcal/g), λιπαρά (9 kcal/g).'],
  ['Μερίδα αναφοράς', 'Η ποσότητα της συνταγής στην οποία αναφέρονται τα macros πριν την προσαρμογή στο μέλος.'],
  ['Φορτίο προπόνησης', 'Πόσο απαιτητική είναι η σημερινή προπόνηση. Αλλάζει υδατάνθρακες και υγρά — ποτέ τις θερμίδες ανήλικου.'],
  ['Συντελεστής δραστηριότητας', 'Πολλαπλασιαστής της ενέργειας ηρεμίας (1,2 = καθιστική, 1,8 = πολύ δραστήρια).'],
  ['Atwater', 'Πρότυπο μετατροπής macros σε θερμίδες: 4/4/9 kcal ανά γραμμάριο.'],
  ['RED-S', 'Σχετική ανεπάρκεια ενέργειας στον αθλητισμό — κίνδυνος σε νεαρούς αθλητές με χαμηλή ενεργειακή διαθεσιμότητα.']
];

export const QUICK_ACTIONS = [
  { id:'logNextMeal', icon:'check',   label:'Κατέγραψε το επόμενο γεύμα' },
  { id:'addWater',     icon:'droplet', label:'Πρόσθεσε 250 ml νερό' },
  { id:'logWeight',    icon:'scale',   label:'Κατέγραψε βάρος' },
  { id:'shopping',     icon:'cart',    label:'Λίστα αγορών' },
  { id:'print',        icon:'printer', label:'Εκτύπωση ημέρας' }
];

/* ── Iron-rich recipes ─────────────────────────────────────────────────────
 * Meaningful dietary iron sources in this rotation (legumes, red meat, sesame,
 * dark greens). Used for the growth profile, where iron and variety matter more
 * than any number. Vitamin C alongside non-haem iron aids absorption, which is
 * why most of these already contain tomato or lemon.
 */
export const IRON_RICH = ['lentils', 'gigantes', 'revithia', 'fasolada', 'meatballs', 'spinachRice', 'bananaToast'];

/* ── Illustration motifs ───────────────────────────────────────────────────
 * Every recipe maps to one inline-SVG motif drawn by ui.js. Kept offline and
 * vector so the app stays dependency-free and sharp on any screen.
 */
export const RECIPE_ART = {
  oats: 'bowl',          eggs: 'egg',        lentils: 'legume',   chickenTray: 'tray',
  fishRice: 'fish',      gigantes: 'legume', omelet: 'egg',       dakos: 'bread',
  yogSnack: 'bowl',      bananaToast: 'bread', milkRecovery: 'glass', pastaVeg: 'pasta',
  greekSalad: 'salad',   chickenSouvlaki: 'skewer', revithia: 'legume', fasolada: 'legume',
  bakedFish: 'fish',     gemista: 'tray',   spinachRice: 'leaf',  yogHoney: 'bowl',
  fruitSalad: 'fruit',   trahana: 'bowl',   meatballs: 'meat',    smoothie: 'glass'
};

/* ── Persona focus ─────────────────────────────────────────────────────────
 * What each member should actually pay attention to. Keyed by goal, which maps
 * one-to-one onto the household: mother gradual_fat_loss, father maintain,
 * daughter growth, son performance. The engine supplies the live numbers; this
 * is the framing. Deliberately no deficit language on the growth profile.
 */
export const PERSONA_FOCUS = {
  gradual_fat_loss: {
    eyebrow: 'Ο ΡΥΘΜΟΣ ΜΕΤΡΑΕΙ',
    title: 'Σταθερά, χωρίς να χάνεις μυς',
    lead: 'Στόχος είναι ο ρυθμός, όχι η ταχύτητα. Η εφαρμογή δεν προτείνει ποτέ μικρότερη μερίδα — μόνο προσθήκες εκεί που λείπει κάτι.'
  },
  maintain: {
    eyebrow: 'ΣΥΝΤΗΡΗΣΗ',
    title: 'Σταθερότητα και καρδιομεταβολική υγεία',
    lead: 'Το πλάνο κρατά σταθερή ενέργεια και πρωτεΐνη. Η προσοχή πάει στην ποιότητα των λιπαρών και στο αλάτι, όχι στην ποσότητα.'
  },
  growth: {
    eyebrow: 'ΑΝΑΠΤΥΞΗ',
    title: 'Ενέργεια και ποικιλία — χωρίς μετρητές',
    lead: 'Σε αυτό το προφίλ δεν εφαρμόζεται ποτέ έλλειμμα θερμίδων και δεν εμφανίζεται κατηγορία BMI ενηλίκων. Δεν υπάρχει «καλό» και «κακό» φαγητό εδώ.'
  },
  performance: {
    eyebrow: 'ΑΠΟΔΟΣΗ',
    title: 'Καύσιμο γύρω από την προπόνηση',
    lead: 'Οι υδατάνθρακες ρυθμίζονται ανάλογα με το σημερινό φορτίο. Η ενέργεια και η πρωτεΐνη παραμένουν σταθερές — δεν μπαίνει ποτέ έλλειμμα σε αυτή την ηλικία.'
  }
};

/* ── Training fueling ──────────────────────────────────────────────────────
 * General sports-nutrition guidance (ISSN / IOC consensus), expressed per kg so
 * it scales to the athlete. Ranges, never a single prescription.
 */
export const FUELING = {
  pre: {
    icon: 'clock',
    title: 'Πριν την προπόνηση',
    body: 'Γεύμα με υδατάνθρακες 2–3 ώρες πριν. Αν μένει λιγότερο από 1 ώρα, μικρό εύπεπτο σνακ — μπανάνα, ψωμί με μέλι.',
    perKg: [1, 3],
    unit: 'g υδατανθράκων'
  },
  post: {
    icon: 'refresh',
    title: 'Μετά την προπόνηση',
    body: 'Συνδύασε πρωτεΐνη με υδατάνθρακες μέσα σε ~2 ώρες. Το επόμενο κανονικό γεύμα της ημέρας καλύπτει συνήθως τον στόχο.',
    proteinPerKg: 0.3,
    carbPerKg: 1.0,
    unit: 'g'
  },
  fluid: {
    icon: 'droplet',
    title: 'Υγρά',
    body: 'Αναπλήρωσε περίπου 125–150% των υγρών που έχασες — περίπου 1,25 L για κάθε κιλό που πέφτει η ζυγαριά μετά την προπόνηση.',
    unit: 'ml'
  }
};
