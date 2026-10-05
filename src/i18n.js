/**
 * ZENITH PRO · lightweight bilingual presentation layer
 * Greek remains the canonical authored content. English is applied at render time
 * so calculations, ids, persistence and nutrition data stay language-neutral.
 */

const EXACT = new Map(Object.entries({
  'Σήμερα':'Today','Πλάνο':'Plan','Γεύματα':'Meals','Αγορές':'Shopping','Πρόοδος':'Progress','Οικογένεια':'Family','Γνώση':'Guide',
  'Περισσότερα':'More','Γρήγορη αναζήτηση':'Quick search','Οικογένεια & προφίλ':'Family & profiles','Μεθοδολογία & πηγές':'Method & sources',
  'Φωτεινό θέμα':'Light theme','Σκούρο θέμα':'Dark theme','Θέμα: ακολούθησε τη συσκευή':'Theme: follow device',
  'Εκτύπωση':'Print','Export δεδομένων':'Export data','Import δεδομένων':'Import data',
  'Καλημέρα':'Good morning','Καλησπέρα':'Good afternoon','Καλό βράδυ':'Good evening',
  'Πρωινό':'Breakfast','Μεσημεριανό':'Lunch','Σνακ':'Snack','Βραδινό':'Dinner',
  'Το έφαγα':'I ate it','Μαγείρεμα':'Cook mode','Συνταγή':'Recipe','Γρήγορη εναλλακτική':'Quick alternative',
  'Το έφαγε η οικογένεια':'Family ate this','Οικογένεια τώρα':'Family now','Προφίλ':'Profiles',
  'Νερό':'Water','Ενέργεια':'Energy','Πρωτεΐνη':'Protein','Υγρά':'Fluids','Ίνες':'Fibre','Αλάτι':'Salt',
  'Σήμερα στο πιάτο':'Today on your plate','Επόμενο γεύμα':'Next meal','Ημέρα ολοκληρωμένη':'Day complete',
  'Πλάνο ημέρας':'Day plan','Σημερινά γεύματα':'Today’s meals','Λεπτομέρειες ημέρας':'Day details',
  'Λεπτομέρειες':'Details','Παράλειψη':'Skip','Καταγράφηκε':'Logged','Αναίρεση':'Undo',
  'Βιβλιοθήκη συνταγών':'Recipe library','Αναζήτηση συνταγής ή υλικού…':'Search recipe or ingredient…',
  'Ταξινόμηση':'Sort','Τυπική σειρά':'Default order','Πιο γρήγορα':'Fastest','Λιγότερες kcal':'Lowest kcal','Αλφαβητικά':'Alphabetical',
  'Όλα τα γεύματα':'All meals','Όλα':'All','Γρήγορα':'Fast','Μαζικό μαγείρεμα':'Batch cooking','Όσπρια':'Legumes','Ψάρι':'Fish',
  'Λαχανικά':'Vegetables','Υψηλή πρωτεΐνη':'High protein','Πλούσιο σε σίδηρο':'High iron','Πλούσιο σε ίνες':'High fibre','Αθλητής':'Athlete',
  'Καμία συνταγή δεν ταιριάζει':'No recipes match','Δοκίμασε άλλη λέξη ή καθάρισε τα φίλτρα.':'Try another search or clear the filters.',
  'Καθαρισμός φίλτρων':'Clear filters','Υλικά για όλη την οικογένεια':'Ingredients for the whole family','Πόσο για τον καθένα':'Amount for each person',
  'Βήματα':'Steps','Συμβουλή':'Tip','Θρεπτικά':'Nutrition','Αναφορές':'References',
  'Λίστα αγορών':'Shopping list','Ό,τι απομένει':'Remaining','Αγορασμένα':'Bought','Καθαρισμός':'Clear','Αντιγραφή':'Copy',
  'Οπωροπωλείο':'Produce','Κρέας & ψάρι':'Meat & fish','Γαλακτοκομικά & αυγά':'Dairy & eggs','Παντοπωλείο':'Pantry','Κατεψυγμένα':'Frozen',
  'Πρόοδος':'Progress','Καταγραφή':'Logging','Μετρήσεις':'Measurements','Τάση':'Trend','Συνέπεια':'Consistency',
  'Νέα μέτρηση':'New measurement','Βάρος':'Weight','Αποθήκευση':'Save','Άκυρο':'Cancel','Διαγραφή':'Delete','Επεξεργασία':'Edit',
  'Νέο μέλος':'New member','Δημιουργία':'Create','Στόχος':'Goal','Ηλικία':'Age','Ύψος':'Height','Δραστηριότητα':'Activity',
  'Συντήρηση':'Maintain','Ανάπτυξη':'Growth','Απόδοση':'Performance','Σταδιακή απώλεια λίπους (μόνο ενήλικες)':'Gradual fat loss (adults only)',
  'Μεθοδολογία':'Method','Πηγές':'Sources','Ασφάλεια':'Safety','Γλωσσάρι':'Glossary','Ιδιωτικότητα':'Privacy',
  'Τοπικά δεδομένα':'Local data','Μόνιμη αποθήκευση':'Persistent storage','Διαγραφή όλων των δεδομένων':'Delete all data',
  'Κλείσιμο':'Close','Πίσω':'Back','Επόμενο':'Next','Προηγούμενο':'Previous','Αυτή η εβδομάδα':'This week',
  'Επιστροφή':'Back to current','Προετοιμασία':'Preparation','Έλεγχος':'Check','Προσαρμοσμένο':'Customized',
  'Όλη η οικογένεια':'Whole family','Οικογένεια':'Family','Εβδομάδα':'Week','4 εβδομάδες':'4 weeks',
  'Αλλαγή':'Change','Επαναφορά ημέρας':'Reset day','Αντιγραφή οικογενειακής εβδομάδας στο μέλος':'Copy family week to this member'
}));

const RECIPES = new Map(Object.entries({
  'Γιαούρτι, βρώμη & φρούτο':'Yogurt, oats & fruit',
  'Αυγά, ψωμί ολικής & ντομάτα':'Eggs, wholegrain bread & tomato',
  'Χυλός βρώμης με μήλο & καρύδια':'Oat porridge with apple & walnuts',
  'Αυγά με σπανάκι & φέτα':'Eggs with spinach & feta',
  'Τοστ ολικής με φέτα, ντομάτα & αγγούρι':'Wholegrain toast with feta, tomato & cucumber',
  'Φακές, σαλάτα & φέτα':'Lentils, salad & feta',
  'Κοτόπουλο λεμονάτο, πατάτα & σαλάτα':'Lemon chicken, potatoes & salad',
  'Κοτόπουλο με ρύζι & λαχανικά':'Chicken with rice & vegetables',
  'Ψάρι, ρύζι & χόρτα':'Fish, rice & greens',
  'Γίγαντες & χωριάτικη':'Giant beans & Greek salad',
  'Ρεβίθια λεμονάτα στο φούρνο':'Lemon chickpeas baked in the oven',
  'Φασολάδα':'Bean soup',
  'Γεμιστά με ρύζι & μυρωδικά':'Stuffed vegetables with rice & herbs',
  'Μπιφτέκια φούρνου με πατάτες':'Baked meatballs with potatoes',
  'Γιαούρτι & φρούτο':'Yogurt & fruit',
  'Μπανάνα & ψωμί με ταχίνι':'Banana & bread with tahini',
  'Αποκατάσταση: γάλα, μπανάνα & βρώμη':'Recovery: milk, banana & oats',
  'Χωριάτικη σαλάτα με ψωμί':'Greek salad with bread',
  'Φρουτοσαλάτα':'Fruit salad',
  'Smoothie γιαουρτιού, φρούτου & βρώμης':'Yogurt, fruit & oat smoothie',
  'Γιαούρτι με μέλι, καρύδια & φρούτο':'Yogurt with honey, walnuts & fruit',
  'Ομελέτα λαχανικών':'Vegetable omelette',
  'Ντάκος ολικής':'Wholegrain dakos',
  'Ζυμαρικά ολικής, ντομάτα & λαχανικά':'Wholegrain pasta, tomato & vegetables',
  'Σουβλάκι κοτόπουλο με πίτα ολικής':'Chicken souvlaki with wholegrain pita',
  'Ψάρι πλακί με λαχανικά':'Baked fish with vegetables',
  'Σπανακόρυζο με φέτα':'Spinach rice with feta',
  'Τραχανάς με φέτα':'Trahana with feta'
}));

const ATTRS = ['aria-label','title','placeholder'];

function translated(s) {
  if (EXACT.has(s)) return EXACT.get(s);
  if (RECIPES.has(s)) return RECIPES.get(s);
  return s
    .replace(/^Καλημέρα,\s*/,'Good morning, ')
    .replace(/^Καλησπέρα,\s*/,'Good afternoon, ')
    .replace(/^Καλό βράδυ,\s*/,'Good evening, ')
    .replace(/^(\d+) συνταγές,\s*μετρημένες$/,'$1 recipes, calculated')
    .replace(/^Εβδομάδα (\d+) από τις 4$/,'Week $1 of 4')
    .replace(/^σε (\d+)′$/,'in $1 min')
    .replace(/^πριν (\d+)′$/,'$1 min ago')
    .replace(/^σε (\d+) ώρες?$/,'in $1 h')
    .replace(/^πριν (\d+) ώρες?$/,'$1 h ago')
    .replace(/^Για (.+)$/,'For $1');
}

export function translateTree(root, lang) {
  document.documentElement.lang = lang === 'en' ? 'en' : 'el';
  if (lang !== 'en' || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const raw = node.nodeValue || '';
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const next = translated(trimmed);
    if (next !== trimmed) {
      const lead = raw.match(/^\s*/)?.[0] || '';
      const trail = raw.match(/\s*$/)?.[0] || '';
      node.nodeValue = lead + next + trail;
    }
  }
  root.querySelectorAll('*').forEach(el => {
    for (const attr of ATTRS) {
      const v = el.getAttribute(attr);
      if (!v) continue;
      const next = translated(v);
      if (next !== v) el.setAttribute(attr, next);
    }
  });
}
