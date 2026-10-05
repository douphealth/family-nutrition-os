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


const CONTENT = new Map([
  /* Daily dashboard / family flow */
  ["Υπάρχει νέα έκδοση της εφαρμογής.","A new app version is available."],
  ["Ανανέωση τώρα","Update now"],
  ["Τα σημερινά γεύματα","Today’s meals"],
  ["καταγράφηκαν","are logged"],
  ["Δεν υπάρχει άλλο γεύμα για σήμερα. Κράτα την ενυδάτωση ενημερωμένη και δες το αυριανό πλάνο.","There are no more meals today. Keep hydration updated and check tomorrow’s plan."],
  ["Δες το πλάνο","View plan"],
  ["Η ημέρα με μια ματιά","Day at a glance"],
  ["Καταγεγραμμένη ενέργεια","Logged energy"],
  ["Γεύματα","Meals"],
  ["Ενυδάτωση","Hydration"],
  ["Ολοκληρώθηκαν όλα","All completed"],
  ["Το πλάνο της ημέρας","Today’s plan"],
  ["Τα τέσσερα γεύματα","Four meals"],
  ["ολοκληρώθηκαν","completed"],
  ["Πρόσθετα σήμερα","Extras today"],
  ["Αφαίρεση","Remove"],
  ["Θρεπτικά της ημέρας","Daily nutrition"],
  ["Τι δίνει το σημερινό πλάνο","What today’s plan provides"],
  ["Φυτικές ίνες","Fibre"],
  ["Σίδηρος","Iron"],
  ["Ασβέστιο","Calcium"],
  ["Αλάτι από τα τρόφιμα","Salt from food"],
  ["Καταγεγραμμένα","Logged"],
  ["Υδατάνθρακες","Carbohydrates"],
  ["Λιπαρά","Fat"],
  ["Γιατί αυτό σήμερα","Why this today"],
  ["Στο πιάτο σου:","On your plate:"],
  ["Μηδέν","Zero"],
  ["1 ποτήρι = 250 ml","1 glass = 250 ml"],
  ["Ώρα για φαγητό","Time to eat"],
  ["Εκκρεμεί","Overdue"],
  ["Γρήγορες ενέργειες γεύματος","Quick meal actions"],
  ["Η μέρα είναι τακτοποιημένη","The day is on track"],
  ["Όλα τα γεύματα","All meals"],
  ["γεύματα","meals"],
  ["νερό","water"],
  ["Πάτησε ένα πρόσωπο για να δεις αμέσως το δικό του πλάνο και τη δική του μερίδα.","Tap a person to instantly see their plan and portion."],
  ["Μικρότερη","Smaller"],
  ["Όπως το πλάνο","As planned"],
  ["Μεγαλύτερη","Larger"],
  ["Παραλείφθηκε","Skipped"],
  ["Άλλη μερίδα","Different portion"],
  ["Έγινε","Done"],
  ["Καλώς ήρθες","Welcome"],
  ["Τρία βήματα και είσαι έτοιμος","Three steps and you’re ready"],
  ["Απόκρυψη","Dismiss"],
  ["Διάλεξε ποιος είσαι","Choose who you are"],
  ["Πάτησε «Το έφαγα»","Tap “I ate it”"],
  ["Δες τη Λίστα αγορών","Open the Shopping list"],
  ["Λίγο ακόμα για σήμερα","A little more for today"],
  ["Μέγεθος πιάτου","Plate size"],

  /* Roles / relations */
  ["Μητέρα","Mother"],["Πατέρας","Father"],["Κόρη","Daughter"],["Γιος","Son"],
  ["Υγεία & σταδιακή απώλεια λίπους","Health & gradual fat loss"],
  ["Συντήρηση & καρδιομεταβολική υγεία","Maintenance & cardiometabolic health"],
  ["Ανάπτυξη & ενέργεια","Growth & energy"],
  ["Basketball · απόδοση & αποκατάσταση","Basketball · performance & recovery"],

  /* Food names so recipes + shopping are actually bilingual */
  ["Γιαούρτι στραγγιστό 2%","Greek yogurt 2%"],
  ["Φέτα","Feta"],
  ["Τυρί τριμμένο (κεφαλοτύρι)","Grated hard cheese (kefalotyri)"],
  ["Γάλα ημιαποβουτυρωμένο","Semi-skimmed milk"],
  ["Αυγό","Egg"],["Αυγά","Eggs"],
  ["Στήθος κοτόπουλου","Chicken breast"],
  ["Κιμάς μοσχαρίσιος","Lean ground beef"],
  ["Φιλέτο ψαριού (τσιπούρα/λαβράκι)","Fish fillet (sea bream/sea bass)"],
  ["Φακές ξηρές","Dry lentils"],["Γίγαντες ξηροί","Dry giant beans"],["Φασόλια ξηρά","Dry beans"],["Ρεβίθια ξηρά","Dry chickpeas"],
  ["Βρώμη","Oats"],["Ρύζι","Rice"],["Ζυμαρικά ολικής","Wholegrain pasta"],["Τραχανάς","Trahana"],
  ["Παξιμάδι κριθαρένιο","Barley rusk"],["Παξιμάδια κριθαρένια","Barley rusks"],
  ["Ψωμί ολικής","Wholegrain bread"],["Πίτα ολικής","Wholegrain pita"],["Πίτες ολικής","Wholegrain pitas"],
  ["Ελαιόλαδο","Olive oil"],["Καρύδια","Walnuts"],["Ταχίνι","Tahini"],["Ελιές","Olives"],["Μέλι","Honey"],
  ["Ντομάτα κονκασέ (κονσέρβα)","Crushed canned tomato"],
  ["Μπανάνα","Banana"],["Μπανάνες","Bananas"],["Φρούτα εποχής","Seasonal fruit"],
  ["Ντομάτα","Tomato"],["Ντομάτες","Tomatoes"],["Αγγούρι","Cucumber"],["Αγγούρια","Cucumbers"],
  ["Πιπεριά","Pepper"],["Πιπεριές","Peppers"],["Κολοκύθι","Zucchini"],["Κολοκυθάκια","Zucchini"],
  ["Κρεμμύδι","Onion"],["Κρεμμύδια","Onions"],["Καρότο","Carrot"],["Καρότα","Carrots"],["Σέλινο","Celery"],
  ["Πατάτες","Potatoes"],["Σπανάκι","Spinach"],["Μανιτάρια","Mushrooms"],["Μαρούλι","Romaine lettuce"],
  ["Χόρτα εποχής","Seasonal greens"],["Μαϊντανός & δυόσμος","Parsley & mint"],["Λεμόνι","Lemon"],["Λεμόνια","Lemons"],

  /* Recipe method + tips */
  ["Βάλε τη βρώμη στο γιαούρτι και άστην 5′ να μαλακώσει.","Stir the oats into the yogurt and leave for 5 min to soften."],
  ["Κόψε το φρούτο από πάνω.","Slice the fruit on top."],
  ["Πρόσθεσε τους ξηρούς καρπούς τελευταία για να μείνουν τραγανιστοί.","Add the nuts last so they stay crunchy."],
  ["Ιδανικό πρωινό πριν από πρωινή προπόνηση: υδατάνθρακες + πρωτεΐνη σε ένα μπολ.","Ideal before a morning training session: carbohydrate + protein in one bowl."],
  ["Ψήσε τα αυγά στο ελαιόλαδο σε μέτρια φωτιά.","Cook the eggs in olive oil over medium heat."],
  ["Σέρβιρε με ψωμί ολικής και φρέσκια ντομάτα.","Serve with wholegrain bread and fresh tomato."],
  ["Οι ελιές μπαίνουν στο τέλος, χωρίς επιπλέον αλάτι.","Add the olives at the end, with no extra salt."],
  ["Πρόσθεσε ένα φρούτο εποχής στο πλάι.","Add seasonal fruit on the side."],
  ["Το αλάτι στις ελιές αρκεί — μη προσθέτεις επιπλέον στο πιάτο.","The salt in the olives is enough — do not add extra to the plate."],
  ["Βράσε τη βρώμη με το γάλα σε χαμηλή φωτιά ~6′, ανακατεύοντας.","Simmer the oats with the milk over low heat for about 6 min, stirring."],
  ["Πρόσθεσε το μήλο κομμένο σε κύβους και λίγη κανέλα.","Add diced apple and a little cinnamon."],
  ["Τα καρύδια μπαίνουν τελευταία, για να μείνουν τραγανά.","Add the walnuts last so they stay crunchy."],
  ["Ζεστό και χορταστικό για κρύα πρωινά — η βρώμη κρατά τον κορεσμό ώς το μεσημέρι.","Warm and filling for cold mornings — oats help keep you satisfied until lunch."],
  ["Σόταρε το σπανάκι στο ελαιόλαδο 2′ μέχρι να μαραθεί.","Sauté the spinach in olive oil for 2 min until wilted."],
  ["Πρόσθεσε τα χτυπημένα αυγά και ανακάτευε σε χαμηλή φωτιά ~3′.","Add the beaten eggs and stir over low heat for about 3 min."],
  ["Θρυμμάτισε τη φέτα από πάνω και σέρβιρε με ψωμί ολικής και ένα φρούτο εποχής.","Crumble feta on top and serve with wholegrain bread and seasonal fruit."],
  ["Η φέτα αλατίζει το πιάτο — δεν χρειάζεται επιπλέον αλάτι.","Feta already seasons the dish — no extra salt is needed."],
  ["Φρυγάνισε το ψωμί.","Toast the bread."],
  ["Στρώσε τη φέτα και πρόσθεσε φέτες ντομάτα και αγγούρι.","Add the feta, then tomato and cucumber slices."],
  ["Ελαιόλαδο και ρίγανη από πάνω, και ένα φρούτο εποχής στο πλάι.","Finish with olive oil and oregano, with seasonal fruit on the side."],
  ["Πρωινό χωρίς μαγείρεμα — ταιριάζει όταν βιάζεστε για το σχολείο.","A no-cook breakfast for busy school mornings."],
  ["Βράσε τις φακές με καρότο και κρεμμύδι ~25′.","Simmer the lentils with carrot and onion for about 25 min."],
  ["Άφησε να τραβήξουν και πρόσθεσε ελαιόλαδο εκτός φωτιάς.","Let them absorb the liquid, then add olive oil off the heat."],
  ["Σέρβιρε με ντομάτα, αγγούρι, φέτα και μία φέτα ψωμί.","Serve with tomato, cucumber, feta and a slice of bread."],
  ["Μαγείρεψε διπλή ποσότητα: κρατά 3 ημέρες στο ψυγείο και μπαίνει σε ταπεράκι.","Cook a double batch: it keeps for 3 days in the fridge and packs well for lunch."],
  ["Σε ταψί: κοτόπουλο, πατάτες, λεμόνι, ελαιόλαδο, ρίγανη.","Place chicken, potatoes, lemon, olive oil and oregano in a roasting tray."],
  ["Ψήσε 40′ στους 200°C.","Bake for 40 min at 200°C."],
  ["Σέρβιρε με φρέσκια σαλάτα στο πλάι.","Serve with a fresh salad."],
  ["Ένα ταψί = δύο γεύματα. Το δεύτερο κρυώνει και μπαίνει σε ταπεράκι για αύριο.","One tray = two meals. Cool the second portion and pack it for tomorrow."],
  ["Σε ταψί: ρύζι, πιπεριά, ντομάτα, κρεμμύδι, ελαιόλαδο και ζεστό νερό — το νερό να καλύπτει το ρύζι.","In a tray combine rice, pepper, tomato, onion, olive oil and hot water; the water should cover the rice."],
  ["Ακούμπησε από πάνω το κοτόπουλο και ψήσε 45′ στους 190°C.","Place the chicken on top and bake for 45 min at 190°C."],
  ["Άφησέ το 5′ να ξεκουραστεί πριν το σερβίρεις.","Rest for 5 min before serving."],
  ["Όλο το γεύμα σε ένα ταψί — λίγη δουλειά, λίγα πιάτα.","The whole meal in one tray — less work and fewer dishes."],
  ["Βράσε το ρύζι και τα χόρτα χωριστά.","Cook the rice and greens separately."],
  ["Ψήσε το ψάρι στο τηγάνι ή στο φούρνο ~12′.","Cook the fish in a pan or oven for about 12 min."],
  ["Λεμόνι και ελαιόλαδο από πάνω, όχι μέσα στο μαγείρεμα.","Add lemon and olive oil after cooking."],
  ["Στόχος: ψάρι 2 φορές την εβδομάδα, με ποικιλία ειδών.","Aim for fish twice a week, using a variety of species."],
  ["Μούλιασε τους γίγαντες από το προηγούμενο βράδυ.","Soak the giant beans overnight."],
  ["Ψήσε με ντομάτα, κρεμμύδι, ελαιόλαδο ~45′ στους 180°C.","Bake with tomato, onion and olive oil for about 45 min at 180°C."],
  ["Σέρβιρε με χωριάτικη σαλάτα και ψωμί.","Serve with Greek salad and bread."],
  ["Τα όσπρια είναι το φθηνότερο και πιο χορταστικό πιάτο της εβδομάδας.","Legumes are one of the most affordable and filling meals of the week."],
  ["Μούλιασε τα ρεβίθια από το βράδυ.","Soak the chickpeas overnight."],
  ["Ψήσε με κρεμμύδι και λεμόνι ~50′.","Bake with onion and lemon for about 50 min."],
  ["Σέρβιρε με χόρτα και ψωμί στο πλάι.","Serve with greens and bread on the side."],
  ["Ψήσε σε μεγάλο ταψί — τρώγεται ζεστό ή κρύο την επόμενη μέρα.","Bake a large tray — it is good hot or cold the next day."],
  ["Μούλιασε τα φασόλια από το βράδυ.","Soak the beans overnight."],
  ["Βράσε με καρότο και σέλινο ~40′.","Simmer with carrot and celery for about 40 min."],
  ["Πρόσθεσε ντομάτα και ελαιόλαδο στο τέλος.","Add tomato and olive oil at the end."],
  ["Κλασικό ελληνικό χειμωνιάτικο πιάτο — χορταστικό και οικονομικό.","A classic Greek winter dish — filling and economical."],
  ["Άδειασε τα λαχανικά και κράτησε τη σάρκα.","Hollow out the vegetables and keep the flesh."],
  ["Ανακάτεψε ρύζι, κρεμμύδι, μυρωδικά, ελαιόλαδο.","Mix rice, onion, herbs and olive oil."],
  ["Γέμισε, σκέπασε και ψήσε 60′ στους 180°C.","Stuff, cover and bake for 60 min at 180°C."],
  ["Τρώγονται και κρύα — ιδανικά για ταπεράκι στο σχολείο.","Also good cold — ideal for a school lunchbox."],
  ["Ζύμωσε κιμά, κρεμμύδι, αυγό και μυρωδικά.","Mix the beef with onion, egg and herbs."],
  ["Πλάσε μπιφτέκια, βάλε σε ταψί με πατάτες.","Shape into patties and place in a tray with potatoes."],
  ["Ψήσε 35′ στους 200°C.","Bake for 35 min at 200°C."],
  ["Ψήσιμο στο φούρνο αντί τηγάνι: ίδια γεύση, λιγότερο λάδι.","Bake instead of frying: similar flavour with less oil."],
  ["Σέρβιρε το γιαούρτι σε μπολ.","Serve the yogurt in a bowl."],
  ["Το πιο εύκολο σνακ του σπιτιού — μηδέν προετοιμασία.","The easiest snack in the house — zero preparation."],
  ["Άλειψε το ταχίνι στο ψωμί.","Spread tahini on the bread."],
  ["Κόψε τη μπανάνα από πάνω.","Slice the banana on top."],
  ["Γρήγορος υδατάνθρακας πριν από προπόνηση — το ταχίνι προσθέτει σίδηρο και ασβέστιο.","Quick carbohydrate before training; tahini adds iron and calcium."],
  ["Χτύπησε όλα τα υλικά στο μπλέντερ.","Blend all ingredients."],
  ["Πιες μέσα σε 60′ από την προπόνηση.","Drink within 60 min after training."],
  ["Υδατάνθρακες + πρωτεΐνη + υγρά σε ένα ποτήρι, για τις ημέρες με διπλή προπόνηση.","Carbohydrate + protein + fluids in one glass for double-training days."],
  ["Κόψε τα λαχανικά σε χοντρά κομμάτια.","Cut the vegetables into chunky pieces."],
  ["Πρόσθεσε φέτα, ελιές και ελαιόλαδο.","Add feta, olives and olive oil."],
  ["Ρίγανη και ψωμί στο πλάι.","Add oregano and serve with bread."],
  ["Το ελαιόλαδο μετριέται — μία κουταλιά της σούπας είναι 15 ml, όχι «ένα αυλάκι».","Measure the olive oil — one tablespoon is 15 ml."],
  ["Κόψε τα φρούτα σε μπολ.","Cut the fruit into a bowl."],
  ["Λίγο λεμόνι για να μη μαυρίσουν.","Add a little lemon to prevent browning."],
  ["Χτύπησε όλα τα υλικά στο μπλέντερ με λίγο παγωμένο νερό.","Blend all ingredients with a little cold water."],
  ["Πιες αμέσως, κρύο.","Drink immediately, chilled."],
  ["Εύκολος τρόπος να φας πρωινό ή σνακ όταν δεν πεινάς — και χωρίς ζάχαρη.","An easy breakfast or snack when appetite is low, without added sugar."],
  ["Σέρβιρε το γιαούρτι.","Serve the yogurt."],
  ["Κόψε ένα φρούτο εποχής από πάνω.","Slice seasonal fruit on top."],
  ["Μέλι και καρύδια στο τέλος.","Finish with honey and walnuts."],
  ["Σόταρε τα λαχανικά 3′.","Sauté the vegetables for 3 min."],
  ["Ρίξε τα χτυπημένα αυγά και άφησε να δέσουν σε χαμηλή φωτιά.","Add the beaten eggs and cook gently over low heat."],
  ["Σέρβιρε με ψωμί ολικής.","Serve with wholegrain bread."],
  ["Γρήγορο βραδινό όταν γυρίζετε αργά — έτοιμο σε 12 λεπτά.","A quick dinner for late evenings — ready in 12 min."],
  ["Βρέξε ελαφρά το παξιμάδι.","Lightly moisten the rusk."],
  ["Τρίψε τη ντομάτα από πάνω.","Grate the tomato over it."],
  ["Πρόσθεσε φέτα (ή ξινομυζήθρα), ελιές και ελαιόλαδο — χωρίς επιπλέον αλάτι.","Add feta (or xinomyzithra), olives and olive oil — no extra salt."],
  ["Πλήρες βραδινό σε 6 λεπτά, χωρίς μαγείρεμα.","A complete no-cook dinner in 6 min."],
  ["Βράσε τα ζυμαρικά al dente.","Cook the pasta al dente."],
  ["Σόταρε τα λαχανικά, πρόσθεσε την ντομάτα.","Sauté the vegetables and add the tomato."],
  ["Ένωσε, πασπάλισε τυρί και σέρβιρε.","Combine, sprinkle with cheese and serve."],
  ["Ιδανικό βραδινό πριν από αγώνα την επόμενη μέρα — υδατάνθρακες για τα αποθέματα.","Ideal the night before a game — carbohydrate to support glycogen stores."],
  ["Μαρινάρε το κοτόπουλο με λεμόνι, ελαιόλαδο και ρίγανη.","Marinate the chicken with lemon, olive oil and oregano."],
  ["Ψήσε σε δυνατή φωτιά 8′ ανά πλευρά.","Cook over high heat for 8 min per side."],
  ["Τύλιξε σε πίτα με ντομάτα, κρεμμύδι και γιαούρτι αντί για έτοιμη σάλτσα.","Wrap in pita with tomato, onion and yogurt instead of bottled sauce."],
  ["Γιαούρτι αντί για έτοιμη σάλτσα: κρεμώδες, με πρωτεΐνη και χωρίς πρόσθετη ζάχαρη.","Yogurt instead of bottled sauce: creamy, protein-rich and without added sugar."],
  ["Στρώσε τα λαχανικά και τις πατάτες σε ταψί.","Arrange the vegetables and potatoes in a tray."],
  ["Βάλε το ψάρι από πάνω με λεμόνι και ελαιόλαδο.","Place the fish on top with lemon and olive oil."],
  ["Ψήσε 30′ στους 190°C.","Bake for 30 min at 190°C."],
  ["Ελαφρύ και εύπεπτο βραδινό, πλούσιο σε πρωτεΐνη — καλή επιλογή για όλη την οικογένεια.","A light, protein-rich dinner that works well for the whole family."],
  ["Σόταρε το κρεμμύδι, πρόσθεσε το σπανάκι να μαραθεί.","Sauté the onion and add spinach until wilted."],
  ["Ρίξε το ρύζι και νερό, σιγόβρασε 18′.","Add rice and water and simmer for 18 min."],
  ["Φέτα και λεμόνι στο σερβίρισμα.","Add feta and lemon when serving."],
  ["Πηγή φυλλικού οξέος και σιδήρου. Λίγο λεμόνι στο πιάτο βοηθά την απορρόφηση του σιδήρου από φυτικές τροφές.","A source of folate and iron. Lemon can help absorption of non-haem iron from plant foods."],
  ["Βράσε τον τραχανά σε νερό ή ζωμό ~12′.","Simmer the trahana in water or stock for about 12 min."],
  ["Πρόσθεσε τριμμένη ντομάτα.","Add grated tomato."],
  ["Φέτα και ελαιόλαδο στο σερβίρισμα.","Add feta and olive oil when serving."],
  ["Ζεστό, εύπεπτο βραδινό — καλό για κρύες μέρες. Ο τραχανάς είναι ήδη αλατισμένος: όχι επιπλέον αλάτι.","A warm, easy dinner for cold days. Trahana is already salted, so do not add extra salt."]
]);

const ATTRS = ['aria-label','title','placeholder'];

function translated(s) {
  if (EXACT.has(s)) return EXACT.get(s);
  if (RECIPES.has(s)) return RECIPES.get(s);
  if (CONTENT.has(s)) return CONTENT.get(s);
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
    .replace(/^Για (.+)$/,'For $1')
    .replace(/^(\d+) ημέρες? σε σειρά$/,'$1-day streak')
    .replace(/^(\d+) από (\d+) έχουν επόμενο γεύμα$/,'$1 of $2 have a next meal')
    .replace(/^Από εκτιμώμενες (.+)$/,'From estimated $1')
    .replace(/^Στόχος (.+)$/,'Target $1')
    .replace(/^Εύρος (.+)$/,'Range $1')
    .replace(/^(\d+) ακόμη σήμερα$/,'$1 remaining today')
    .replace(/^Εκκρεμεί: (.+)$/,'Overdue: $1')
    .replace(/^Η μερίδα σου:\s*(.+)$/,'Your portion: $1')
    .replace(/^Μερίδες για (.+)$/,'Portions for $1')
    .replace(/\bΔευτέρα\b/g,'Monday').replace(/\bΤρίτη\b/g,'Tuesday').replace(/\bΤετάρτη\b/g,'Wednesday')
    .replace(/\bΠέμπτη\b/g,'Thursday').replace(/\bΠαρασκευή\b/g,'Friday').replace(/\bΣάββατο\b/g,'Saturday').replace(/\bΚυριακή\b/g,'Sunday')
    .replace(/\bΙανουαρίου\b/g,'January').replace(/\bΦεβρουαρίου\b/g,'February').replace(/\bΜαρτίου\b/g,'March')
    .replace(/\bΑπριλίου\b/g,'April').replace(/\bΜαΐου\b/g,'May').replace(/\bΙουνίου\b/g,'June')
    .replace(/\bΙουλίου\b/g,'July').replace(/\bΑυγούστου\b/g,'August').replace(/\bΣεπτεμβρίου\b/g,'September')
    .replace(/\bΟκτωβρίου\b/g,'October').replace(/\bΝοεμβρίου\b/g,'November').replace(/\bΔεκεμβρίου\b/g,'December')
    .replace(/(\d+(?:[.,]\d+)?)\s*τεμ\b/g,'$1 pcs');
}

export function translateTree(root, lang) {
  document.documentElement.lang = lang === 'en' ? 'en' : 'el';
  if (lang !== 'en' || !root) return;
  const doc = root.ownerDocument || document;
  const showText = doc.defaultView?.NodeFilter?.SHOW_TEXT ?? 4;
  const walker = doc.createTreeWalker(root, showText);
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
