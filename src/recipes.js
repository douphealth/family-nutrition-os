/**
 * ZENITH PRO · recipes & the 28-day rotation
 * ---------------------------------------------------------------------------
 * Recipes are AUTHORED here as quantified lines of canonical foods
 * ({ f: foodId, q, u }) and DERIVED into the shape the app reads by
 * `deriveRecipe` (foods.js): grams, aisle, display name, and the macros and
 * micronutrients of one reference adult serving. Nothing nutritional is typed
 * next to a recipe, so a recipe can never disagree with its own ingredients.
 *
 * Quantities are RAW weights for ONE reference adult serving — the same unit the
 * shopping list and the per-member portion scaling use.
 *
 * tags: batch = cooks well in bulk · fast = under 15 min · athlete = recovery
 *       legume · fish · veg · highprotein
 */

import { deriveRecipe } from './foods.js?v=16.0.0';

const RAW_RECIPES = [
  /* ── Breakfast ──────────────────────────────────────────────────────── */
  { id: 'oats', name: 'Γιαούρτι, βρώμη & φρούτο', slot: 'breakfast', time: 5, tags: ['fast', 'highprotein'],
    ingredients: [
      { f: 'yogurt', q: 200, u: 'g' }, { f: 'oats', q: 55, u: 'g' },
      { f: 'banana', q: 1, u: 'τεμ' }, { f: 'walnuts', q: 15, u: 'g' }
    ],
    steps: ['Βάλε τη βρώμη στο γιαούρτι και άστην 5′ να μαλακώσει.', 'Κόψε το φρούτο από πάνω.', 'Πρόσθεσε τους ξηρούς καρπούς τελευταία για να μείνουν τραγανιστοί.'],
    tip: 'Ιδανικό πρωινό πριν από πρωινή προπόνηση: υδατάνθρακες + πρωτεΐνη σε ένα μπολ.' },

  { id: 'eggs', name: 'Αυγά, ψωμί ολικής & ντομάτα', slot: 'breakfast', time: 10, tags: ['highprotein'],
    ingredients: [
      { f: 'egg', q: 2, u: 'τεμ' }, { f: 'bread', q: 70, u: 'g' }, { f: 'tomato', q: 100, u: 'g' },
      { f: 'olives', q: 15, u: 'g' }, { f: 'oliveOil', q: 5, u: 'ml' },
      { f: 'fruit', q: 150, u: 'g' }
    ],
    steps: ['Ψήσε τα αυγά στο ελαιόλαδο σε μέτρια φωτιά.', 'Σέρβιρε με ψωμί ολικής και φρέσκια ντομάτα.', 'Οι ελιές μπαίνουν στο τέλος, χωρίς επιπλέον αλάτι.', 'Πρόσθεσε ένα φρούτο εποχής στο πλάι.'],
    tip: 'Το αλάτι στις ελιές αρκεί — μη προσθέτεις επιπλέον στο πιάτο.' },

  { id: 'porridge', name: 'Χυλός βρώμης με μήλο & καρύδια', slot: 'breakfast', time: 10, tags: ['fast', 'veg'],
    ingredients: [
      { f: 'oats', q: 60, u: 'g' }, { f: 'milk', q: 200, u: 'ml' },
      { f: 'fruit', q: 150, u: 'g' }, { f: 'walnuts', q: 15, u: 'g' }
    ],
    steps: ['Βράσε τη βρώμη με το γάλα σε χαμηλή φωτιά ~6′, ανακατεύοντας.', 'Πρόσθεσε το μήλο κομμένο σε κύβους και λίγη κανέλα.', 'Τα καρύδια μπαίνουν τελευταία, για να μείνουν τραγανά.'],
    tip: 'Ζεστό και χορταστικό για κρύα πρωινά — η βρώμη κρατά τον κορεσμό ώς το μεσημέρι.' },

  { id: 'scramble', name: 'Αυγά με σπανάκι & φέτα', slot: 'breakfast', time: 10, tags: ['fast', 'highprotein', 'veg'],
    ingredients: [
      { f: 'egg', q: 2, u: 'τεμ' }, { f: 'spinach', q: 80, u: 'g' }, { f: 'feta', q: 25, u: 'g' },
      { f: 'bread', q: 60, u: 'g' }, { f: 'oliveOil', q: 5, u: 'ml' },
      { f: 'fruit', q: 150, u: 'g' }
    ],
    steps: ['Σόταρε το σπανάκι στο ελαιόλαδο 2′ μέχρι να μαραθεί.', 'Πρόσθεσε τα χτυπημένα αυγά και ανακάτευε σε χαμηλή φωτιά ~3′.', 'Θρυμμάτισε τη φέτα από πάνω και σέρβιρε με ψωμί ολικής και ένα φρούτο εποχής.'],
    tip: 'Η φέτα αλατίζει το πιάτο — δεν χρειάζεται επιπλέον αλάτι.' },

  { id: 'fetaToast', name: 'Τοστ ολικής με φέτα, ντομάτα & αγγούρι', slot: 'breakfast', time: 5, tags: ['fast', 'veg'],
    ingredients: [
      { f: 'bread', q: 80, u: 'g' }, { f: 'feta', q: 35, u: 'g' }, { f: 'tomato', q: 100, u: 'g' },
      { f: 'cucumber', q: 60, u: 'g' }, { f: 'olives', q: 10, u: 'g' }, { f: 'oliveOil', q: 5, u: 'ml' },
      { f: 'fruit', q: 150, u: 'g' }
    ],
    steps: ['Φρυγάνισε το ψωμί.', 'Στρώσε τη φέτα και πρόσθεσε φέτες ντομάτα και αγγούρι.', 'Ελαιόλαδο και ρίγανη από πάνω, και ένα φρούτο εποχής στο πλάι.'],
    tip: 'Πρωινό χωρίς μαγείρεμα — ταιριάζει όταν βιάζεστε για το σχολείο.' },

  /* ── Lunch ──────────────────────────────────────────────────────────── */
  { id: 'lentils', name: 'Φακές, σαλάτα & φέτα', slot: 'lunch', time: 35, tags: ['legume', 'batch', 'veg'],
    ingredients: [
      { f: 'lentils', q: 95, u: 'g' }, { f: 'carrot', q: 40, u: 'g' }, { f: 'onion', q: 30, u: 'g' },
      { f: 'oliveOil', q: 12, u: 'ml' }, { f: 'tomato', q: 120, u: 'g' }, { f: 'cucumber', q: 60, u: 'g' },
      { f: 'feta', q: 30, u: 'g' }, { f: 'bread', q: 60, u: 'g' }
    ],
    steps: ['Βράσε τις φακές με καρότο και κρεμμύδι ~25′.', 'Άφησε να τραβήξουν και πρόσθεσε ελαιόλαδο εκτός φωτιάς.', 'Σέρβιρε με ντομάτα, αγγούρι, φέτα και μία φέτα ψωμί.'],
    tip: 'Μαγείρεψε διπλή ποσότητα: κρατά 3 ημέρες στο ψυγείο και μπαίνει σε ταπεράκι.' },

  { id: 'chickenTray', name: 'Κοτόπουλο λεμονάτο, πατάτα & σαλάτα', slot: 'lunch', time: 45, tags: ['highprotein', 'batch'],
    ingredients: [
      { f: 'chicken', q: 200, u: 'g' }, { f: 'potato', q: 250, u: 'g' }, { f: 'lemon', q: 0.25, u: 'τεμ' },
      { f: 'oliveOil', q: 12, u: 'ml' }, { f: 'lettuce', q: 80, u: 'g' }, { f: 'cucumber', q: 80, u: 'g' }
    ],
    steps: ['Σε ταψί: κοτόπουλο, πατάτες, λεμόνι, ελαιόλαδο, ρίγανη.', 'Ψήσε 40′ στους 200°C.', 'Σέρβιρε με φρέσκια σαλάτα στο πλάι.'],
    tip: 'Ένα ταψί = δύο γεύματα. Το δεύτερο κρυώνει και μπαίνει σε ταπεράκι για αύριο.' },

  { id: 'chickenRice', name: 'Κοτόπουλο με ρύζι & λαχανικά στο φούρνο', slot: 'lunch', time: 50, tags: ['highprotein', 'batch'],
    ingredients: [
      { f: 'chicken', q: 180, u: 'g' }, { f: 'rice', q: 85, u: 'g' }, { f: 'pepper', q: 0.5, u: 'τεμ' },
      { f: 'tomato', q: 100, u: 'g' }, { f: 'onion', q: 30, u: 'g' }, { f: 'oliveOil', q: 12, u: 'ml' }
    ],
    steps: ['Σε ταψί: ρύζι, πιπεριά, ντομάτα, κρεμμύδι, ελαιόλαδο και ζεστό νερό — το νερό να καλύπτει το ρύζι.', 'Ακούμπησε από πάνω το κοτόπουλο και ψήσε 45′ στους 190°C.', 'Άφησέ το 5′ να ξεκουραστεί πριν το σερβίρεις.'],
    tip: 'Όλο το γεύμα σε ένα ταψί — λίγη δουλειά, λίγα πιάτα.' },

  { id: 'fishRice', name: 'Ψάρι, ρύζι & χόρτα', slot: 'lunch', time: 30, tags: ['fish', 'highprotein'],
    ingredients: [
      { f: 'fish', q: 180, u: 'g' }, { f: 'rice', q: 85, u: 'g' }, { f: 'greens', q: 200, u: 'g' },
      { f: 'oliveOil', q: 12, u: 'ml' }, { f: 'lemon', q: 0.25, u: 'τεμ' }
    ],
    steps: ['Βράσε το ρύζι και τα χόρτα χωριστά.', 'Ψήσε το ψάρι στο τηγάνι ή στο φούρνο ~12′.', 'Λεμόνι και ελαιόλαδο από πάνω, όχι μέσα στο μαγείρεμα.'],
    tip: 'Στόχος: ψάρι 2 φορές την εβδομάδα, με ποικιλία ειδών.' },

  { id: 'gigantes', name: 'Γίγαντες & χωριάτικη', slot: 'lunch', time: 50, tags: ['legume', 'batch', 'veg'],
    ingredients: [
      { f: 'giantBeans', q: 95, u: 'g' }, { f: 'tomato', q: 180, u: 'g' }, { f: 'onion', q: 30, u: 'g' },
      { f: 'oliveOil', q: 16, u: 'ml' }, { f: 'cucumber', q: 80, u: 'g' }, { f: 'feta', q: 30, u: 'g' },
      { f: 'bread', q: 60, u: 'g' }
    ],
    steps: ['Μούλιασε τους γίγαντες από το προηγούμενο βράδυ.', 'Ψήσε με ντομάτα, κρεμμύδι, ελαιόλαδο ~45′ στους 180°C.', 'Σέρβιρε με χωριάτικη σαλάτα και ψωμί.'],
    tip: 'Τα όσπρια είναι το φθηνότερο και πιο χορταστικό πιάτο της εβδομάδας.' },

  { id: 'revithia', name: 'Ρεβίθια λεμονάτα στο φούρνο', slot: 'lunch', time: 55, tags: ['legume', 'batch', 'veg'],
    ingredients: [
      { f: 'chickpeas', q: 95, u: 'g' }, { f: 'onion', q: 35, u: 'g' }, { f: 'lemon', q: 0.25, u: 'τεμ' },
      { f: 'oliveOil', q: 15, u: 'ml' }, { f: 'greens', q: 150, u: 'g' }, { f: 'bread', q: 60, u: 'g' }
    ],
    steps: ['Μούλιασε τα ρεβίθια από το βράδυ.', 'Ψήσε με κρεμμύδι και λεμόνι ~50′.', 'Σέρβιρε με χόρτα και ψωμί στο πλάι.'],
    tip: 'Ψήσε σε μεγάλο ταψί — τρώγεται ζεστό ή κρύο την επόμενη μέρα.' },

  { id: 'fasolada', name: 'Φασολάδα με ελαιόλαδο', slot: 'lunch', time: 50, tags: ['legume', 'batch'],
    ingredients: [
      { f: 'whiteBeans', q: 95, u: 'g' }, { f: 'carrot', q: 40, u: 'g' }, { f: 'celery', q: 50, u: 'g' },
      { f: 'tomatoCanned', q: 100, u: 'g' }, { f: 'onion', q: 30, u: 'g' }, { f: 'oliveOil', q: 12, u: 'ml' },
      { f: 'bread', q: 60, u: 'g' }
    ],
    steps: ['Μούλιασε τα φασόλια από το βράδυ.', 'Βράσε με καρότο και σέλινο ~40′.', 'Πρόσθεσε ντομάτα και ελαιόλαδο στο τέλος.'],
    tip: 'Κλασικό ελληνικό χειμωνιάτικο πιάτο — χορταστικό και οικονομικό.' },

  { id: 'gemista', name: 'Γεμιστά με ρύζι & μυρωδικά', slot: 'lunch', time: 70, tags: ['veg', 'batch'],
    ingredients: [
      { f: 'tomato', q: 2, u: 'τεμ' }, { f: 'pepper', q: 1, u: 'τεμ' }, { f: 'rice', q: 75, u: 'g' },
      { f: 'onion', q: 40, u: 'g' }, { f: 'herbs', q: 10, u: 'g' }, { f: 'oliveOil', q: 16, u: 'ml' },
      { f: 'bread', q: 60, u: 'g' }
    ],
    steps: ['Άδειασε τα λαχανικά και κράτησε τη σάρκα.', 'Ανακάτεψε ρύζι, κρεμμύδι, μυρωδικά, ελαιόλαδο.', 'Γέμισε, σκέπασε και ψήσε 60′ στους 180°C.'],
    tip: 'Τρώγονται και κρύα — ιδανικά για ταπεράκι στο σχολείο.' },

  { id: 'meatballs', name: 'Μπιφτέκια φούρνου με πατάτες', slot: 'lunch', time: 45, tags: ['highprotein', 'batch'],
    ingredients: [
      { f: 'beef', q: 160, u: 'g' }, { f: 'potato', q: 300, u: 'g' }, { f: 'onion', q: 30, u: 'g' },
      { f: 'egg', q: 0.5, u: 'τεμ' }, { f: 'oliveOil', q: 10, u: 'ml' }, { f: 'tomato', q: 80, u: 'g' }
    ],
    steps: ['Ζύμωσε κιμά, κρεμμύδι, αυγό και μυρωδικά.', 'Πλάσε μπιφτέκια, βάλε σε ταψί με πατάτες.', 'Ψήσε 35′ στους 200°C.'],
    tip: 'Ψήσιμο στο φούρνο αντί τηγάνι: ίδια γεύση, λιγότερο λάδι.' },

  /* ── Snack ──────────────────────────────────────────────────────────── */
  { id: 'yogSnack', name: 'Γιαούρτι & φρούτο', slot: 'snack', time: 2, tags: ['fast', 'highprotein'],
    ingredients: [{ f: 'yogurt', q: 170, u: 'g' }, { f: 'fruit', q: 200, u: 'g' }],
    steps: ['Σέρβιρε το γιαούρτι σε μπολ.', 'Κόψε το φρούτο από πάνω.'],
    tip: 'Το πιο εύκολο σνακ του σπιτιού — μηδέν προετοιμασία.' },

  { id: 'bananaToast', name: 'Μπανάνα & ψωμί με ταχίνι', slot: 'snack', time: 3, tags: ['fast', 'athlete'],
    ingredients: [{ f: 'banana', q: 1, u: 'τεμ' }, { f: 'bread', q: 60, u: 'g' }, { f: 'tahini', q: 15, u: 'g' }],
    steps: ['Άλειψε το ταχίνι στο ψωμί.', 'Κόψε τη μπανάνα από πάνω.'],
    tip: 'Γρήγορος υδατάνθρακας πριν από προπόνηση — το ταχίνι προσθέτει σίδηρο και ασβέστιο.' },

  { id: 'milkRecovery', name: 'Αποκατάσταση: γάλα, μπανάνα & βρώμη', slot: 'snack', time: 3, tags: ['athlete', 'fast'],
    ingredients: [{ f: 'milk', q: 300, u: 'ml' }, { f: 'banana', q: 1, u: 'τεμ' }, { f: 'oats', q: 50, u: 'g' }],
    steps: ['Χτύπησε όλα τα υλικά στο μπλέντερ.', 'Πιες μέσα σε 60′ από την προπόνηση.'],
    tip: 'Υδατάνθρακες + πρωτεΐνη + υγρά σε ένα ποτήρι, για τις ημέρες με διπλή προπόνηση.' },

  { id: 'greekSalad', name: 'Χωριάτικη με φέτα', slot: 'snack', time: 7, tags: ['fast', 'veg'],
    ingredients: [
      { f: 'tomato', q: 150, u: 'g' }, { f: 'cucumber', q: 80, u: 'g' }, { f: 'pepper', q: 50, u: 'g' },
      { f: 'onion', q: 20, u: 'g' }, { f: 'feta', q: 35, u: 'g' }, { f: 'olives', q: 15, u: 'g' },
      { f: 'oliveOil', q: 10, u: 'ml' }, { f: 'bread', q: 50, u: 'g' }
    ],
    steps: ['Κόψε τα λαχανικά σε χοντρά κομμάτια.', 'Πρόσθεσε φέτα, ελιές και ελαιόλαδο.', 'Ρίγανη και ψωμί στο πλάι.'],
    tip: 'Το ελαιόλαδο μετριέται — μία κουταλιά της σούπας είναι 15 ml, όχι «ένα αυλάκι».' },

  { id: 'fruitSalad', name: 'Φρουτοσαλάτα εποχής', slot: 'snack', time: 5, tags: ['fast', 'veg'],
    ingredients: [{ f: 'fruit', q: 300, u: 'g' }, { f: 'lemon', q: 0.25, u: 'τεμ' }],
    steps: ['Κόψε τα φρούτα σε μπολ.', 'Λίγο λεμόνι για να μη μαυρίσουν.'],
    tip: 'Στόχος: τουλάχιστον 400 g φρούτων και λαχανικών την ημέρα (5 μερίδες) — ο ελάχιστος στόχος του ΠΟΥ.' },

  { id: 'smoothie', name: 'Smoothie γιαουρτιού, φρούτου & βρώμης', slot: 'snack', time: 3, tags: ['fast', 'highprotein'],
    ingredients: [
      { f: 'yogurt', q: 150, u: 'g' }, { f: 'fruit', q: 150, u: 'g' }, { f: 'oats', q: 40, u: 'g' },
      { f: 'honey', q: 10, u: 'g' }
    ],
    steps: ['Χτύπησε όλα τα υλικά στο μπλέντερ με λίγο παγωμένο νερό.', 'Πιες αμέσως, κρύο.'],
    tip: 'Εύκολος τρόπος να φας πρωινό ή σνακ όταν δεν πεινάς — και χωρίς ζάχαρη.' },

  { id: 'yogHoney', name: 'Γιαούρτι με μέλι, καρύδια & φρούτο', slot: 'snack', time: 2, tags: ['fast', 'highprotein'],
    ingredients: [{ f: 'yogurt', q: 200, u: 'g' }, { f: 'honey', q: 10, u: 'g' }, { f: 'walnuts', q: 15, u: 'g' }, { f: 'fruit', q: 150, u: 'g' }],
    steps: ['Σέρβιρε το γιαούρτι.', 'Κόψε ένα φρούτο εποχής από πάνω.', 'Μέλι και καρύδια στο τέλος.'],
    tip: 'Το μέλι μετριέται: 10 g είναι περίπου ενάμισι κουταλάκι του γλυκού, όχι ελεύθερη ροή.' },

  /* ── Dinner ─────────────────────────────────────────────────────────── */
  { id: 'omelet', name: 'Ομελέτα λαχανικών & ψωμί', slot: 'dinner', time: 12, tags: ['fast', 'highprotein', 'veg'],
    ingredients: [
      { f: 'egg', q: 3, u: 'τεμ' }, { f: 'spinach', q: 80, u: 'g' }, { f: 'mushroom', q: 80, u: 'g' },
      { f: 'bread', q: 80, u: 'g' }, { f: 'oliveOil', q: 10, u: 'ml' }
    ],
    steps: ['Σόταρε τα λαχανικά 3′.', 'Ρίξε τα χτυπημένα αυγά και άφησε να δέσουν σε χαμηλή φωτιά.', 'Σέρβιρε με ψωμί ολικής.'],
    tip: 'Γρήγορο βραδινό όταν γυρίζετε αργά — έτοιμο σε 12 λεπτά.' },

  { id: 'dakos', name: 'Ντάκος ολικής', slot: 'dinner', time: 6, tags: ['fast', 'veg'],
    ingredients: [
      { f: 'paximadi', q: 1, u: 'τεμ' }, { f: 'tomato', q: 200, u: 'g' }, { f: 'feta', q: 40, u: 'g' },
      { f: 'olives', q: 20, u: 'g' }, { f: 'oliveOil', q: 10, u: 'ml' }
    ],
    steps: ['Βρέξε ελαφρά το παξιμάδι.', 'Τρίψε τη ντομάτα από πάνω.', 'Πρόσθεσε φέτα (ή ξινομυζήθρα), ελιές και ελαιόλαδο — χωρίς επιπλέον αλάτι.'],
    tip: 'Πλήρες βραδινό σε 6 λεπτά, χωρίς μαγείρεμα.' },

  { id: 'pastaVeg', name: 'Ζυμαρικά ολικής, ντομάτα & λαχανικά', slot: 'dinner', time: 20, tags: ['veg', 'fast'],
    ingredients: [
      { f: 'pasta', q: 95, u: 'g' }, { f: 'tomatoCanned', q: 150, u: 'g' }, { f: 'zucchini', q: 100, u: 'g' },
      { f: 'pepper', q: 50, u: 'g' }, { f: 'hardcheese', q: 20, u: 'g' }, { f: 'oliveOil', q: 10, u: 'ml' }
    ],
    steps: ['Βράσε τα ζυμαρικά al dente.', 'Σόταρε τα λαχανικά, πρόσθεσε την ντομάτα.', 'Ένωσε, πασπάλισε τυρί και σέρβιρε.'],
    tip: 'Ιδανικό βραδινό πριν από αγώνα την επόμενη μέρα — υδατάνθρακες για τα αποθέματα.' },

  { id: 'chickenSouvlaki', name: 'Σουβλάκι κοτόπουλο με πίτα ολικής', slot: 'dinner', time: 25, tags: ['highprotein'],
    ingredients: [
      { f: 'chicken', q: 170, u: 'g' }, { f: 'pita', q: 1, u: 'τεμ' }, { f: 'tomato', q: 80, u: 'g' },
      { f: 'onion', q: 25, u: 'g' }, { f: 'yogurt', q: 60, u: 'g' }, { f: 'lemon', q: 0.25, u: 'τεμ' },
      { f: 'oliveOil', q: 8, u: 'ml' }
    ],
    steps: ['Μαρινάρε το κοτόπουλο με λεμόνι, ελαιόλαδο και ρίγανη.', 'Ψήσε σε δυνατή φωτιά 8′ ανά πλευρά.', 'Τύλιξε σε πίτα με ντομάτα, κρεμμύδι και γιαούρτι αντί για έτοιμη σάλτσα.'],
    tip: 'Γιαούρτι αντί για έτοιμη σάλτσα: κρεμώδες, με πρωτεΐνη και χωρίς πρόσθετη ζάχαρη.' },

  { id: 'bakedFish', name: 'Ψάρι πλακί με λαχανικά', slot: 'dinner', time: 35, tags: ['fish', 'highprotein', 'veg'],
    ingredients: [
      { f: 'fish', q: 180, u: 'g' }, { f: 'tomato', q: 120, u: 'g' }, { f: 'pepper', q: 60, u: 'g' },
      { f: 'onion', q: 40, u: 'g' }, { f: 'potato', q: 200, u: 'g' }, { f: 'oliveOil', q: 12, u: 'ml' },
      { f: 'lemon', q: 0.25, u: 'τεμ' }
    ],
    steps: ['Στρώσε τα λαχανικά και τις πατάτες σε ταψί.', 'Βάλε το ψάρι από πάνω με λεμόνι και ελαιόλαδο.', 'Ψήσε 30′ στους 190°C.'],
    tip: 'Ελαφρύ και εύπεπτο βραδινό, πλούσιο σε πρωτεΐνη — καλή επιλογή για όλη την οικογένεια.' },

  { id: 'spinachRice', name: 'Σπανακόρυζο με φέτα', slot: 'dinner', time: 30, tags: ['veg', 'fast'],
    ingredients: [
      { f: 'spinach', q: 300, u: 'g' }, { f: 'rice', q: 75, u: 'g' }, { f: 'onion', q: 35, u: 'g' },
      { f: 'feta', q: 30, u: 'g' }, { f: 'oliveOil', q: 12, u: 'ml' }, { f: 'lemon', q: 0.25, u: 'τεμ' }
    ],
    steps: ['Σόταρε το κρεμμύδι, πρόσθεσε το σπανάκι να μαραθεί.', 'Ρίξε το ρύζι και νερό, σιγόβρασε 18′.', 'Φέτα και λεμόνι στο σερβίρισμα.'],
    tip: 'Πηγή φυλλικού οξέος και σιδήρου. Λίγο λεμόνι στο πιάτο βοηθά την απορρόφηση του σιδήρου από φυτικές τροφές.' },

  { id: 'trahana', name: 'Τραχανάς με φέτα', slot: 'dinner', time: 20, tags: ['fast', 'veg'],
    ingredients: [
      { f: 'trahana', q: 80, u: 'g' }, { f: 'tomato', q: 100, u: 'g' }, { f: 'feta', q: 30, u: 'g' },
      { f: 'oliveOil', q: 10, u: 'ml' }
    ],
    steps: ['Βράσε τον τραχανά σε νερό ή ζωμό ~12′.', 'Πρόσθεσε τριμμένη ντομάτα.', 'Φέτα και ελαιόλαδο στο σερβίρισμα.'],
    tip: 'Ζεστό, εύπεπτο βραδινό — καλό για κρύες μέρες. Ο τραχανάς είναι ήδη αλατισμένος: όχι επιπλέον αλάτι.' }
];

export const RECIPES = RAW_RECIPES.map(deriveRecipe);

/* ── 28-day rotation ───────────────────────────────────────────────────────
 * One shared family meal per slot; portions differ per member. Aligned to
 * Monday–Sunday so the cycle matches real weeks (see dates.js: day 1 = a Monday).
 *
 * Built to a weekly pattern rather than at random:
 *   • fish twice a week (one lunch, one dinner — Friday is always fish);
 *   • legumes three lunches a week, never the same one twice in a week;
 *   • eggs in exactly three meals a week (one plain, one scrambled, one omelette);
 *   • the recovery snack on Tuesday and Thursday, the two double-training days;
 *   • souvlaki on Saturday, so the week ends the way a Greek week does.
 * tests/data-integrity.test.mjs asserts every one of these.
 */
const ROTATION = [
  [ // Week 1
    ['oats',      'lentils',     'yogSnack',     'pastaVeg'],
    ['eggs',      'chickenTray', 'milkRecovery', 'dakos'],
    ['porridge',  'fishRice',    'bananaToast',  'spinachRice'],
    ['fetaToast', 'revithia',    'milkRecovery', 'omelet'],
    ['oats',      'gigantes',    'fruitSalad',   'bakedFish'],
    ['scramble',  'gemista',     'smoothie',     'chickenSouvlaki'],
    ['oats',      'meatballs',   'yogHoney',     'trahana']
  ],
  [ // Week 2
    ['porridge',  'fasolada',    'greekSalad',   'omelet'],
    ['oats',      'chickenRice', 'milkRecovery', 'spinachRice'],
    ['fetaToast', 'fishRice',    'bananaToast',  'pastaVeg'],
    ['eggs',      'gemista',     'milkRecovery', 'trahana'],
    ['oats',      'revithia',    'fruitSalad',   'bakedFish'],
    ['scramble',  'meatballs',   'smoothie',     'chickenSouvlaki'],
    ['porridge',  'gigantes',    'yogHoney',     'dakos']
  ],
  [ // Week 3
    ['oats',      'lentils',     'yogSnack',     'trahana'],
    ['scramble',  'chickenTray', 'milkRecovery', 'pastaVeg'],
    ['oats',      'fasolada',    'greekSalad',   'omelet'],
    ['porridge',  'fishRice',    'milkRecovery', 'spinachRice'],
    ['fetaToast', 'gemista',     'bananaToast',  'bakedFish'],
    ['eggs',      'meatballs',   'smoothie',     'chickenSouvlaki'],
    ['oats',      'gigantes',    'yogHoney',     'dakos']
  ],
  [ // Week 4
    ['fetaToast', 'fasolada',    'yogSnack',     'spinachRice'],
    ['scramble',  'chickenRice', 'milkRecovery', 'pastaVeg'],
    ['oats',      'revithia',    'greekSalad',   'trahana'],
    ['eggs',      'fishRice',    'milkRecovery', 'dakos'],
    ['porridge',  'gemista',     'fruitSalad',   'bakedFish'],
    ['oats',      'meatballs',   'smoothie',     'chickenSouvlaki'],
    ['fetaToast', 'lentils',     'yogHoney',     'omelet']
  ]
];

const DOW = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
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

/* ── Iron-rich recipes ─────────────────────────────────────────────────────
 * Derived, not curated: a recipe is listed when one reference serving carries at
 * least 30 % of the EU nutrient reference value for iron (14 mg → 4.2 mg), the
 * "high in" threshold of Regulation (EC) 1924/2006 (twice the 15 % "source of" level). (At the 15 %
 * "source of" level nearly every dish here qualifies, which would make the list
 * meaningless.) Used by the growth profile, where iron and variety matter more
 * than any calorie number. Most of it is non-haem iron, which vitamin C (tomato,
 * lemon) helps absorb.
 */
export const IRON_HIGH_MG = 4.2;
export const IRON_RICH = RECIPES.filter(r => r.micro.fe >= IRON_HIGH_MG).map(r => r.id);

/* ── Illustration motifs ───────────────────────────────────────────────────
 * Every recipe maps to one inline-SVG motif drawn by art.js. Kept offline and
 * vector so the app stays dependency-free and sharp on any screen.
 */
export const RECIPE_ART = {
  oats: 'oats',        eggs: 'egg',            porridge: 'oats',      scramble: 'egg',
  fetaToast: 'toast',  lentils: 'soup',        chickenTray: 'tray',   chickenRice: 'tray',
  fishRice: 'fish',    gigantes: 'beans',      revithia: 'beans',     fasolada: 'soup',
  gemista: 'stuffed',  meatballs: 'meatball',  yogSnack: 'yogurt',    bananaToast: 'toast',
  milkRecovery: 'glass', greekSalad: 'salad',  fruitSalad: 'fruit',   smoothie: 'glass',
  yogHoney: 'yogurt',  omelet: 'omelet',       dakos: 'dakos',        pastaVeg: 'pasta',
  chickenSouvlaki: 'wrap', bakedFish: 'fish',  spinachRice: 'rice',   trahana: 'trahana'
};
