export type Bilingual = { el: string; en: string };
const text = (el: string, en: string): Bilingual => ({ el, en });
export type VideoLevel = 'foundation' | 'advanced';
const video = (id: string, title: string, channel = 'Jr. NBA Jr. WNBA', level: VideoLevel = 'foundation') => ({ url: `https://www.youtube.com/watch?v=${id}`, title, channel, level, checkedAt: '2026-11-15', verification: 'metadata-only' as const });
const BT = 'BreakthroughBBall';

// Learning resources, not additional prescribed sessions or clearance.
export const BASKETBALL_SKILLS = [
  {
    id: 'handling', title: text('Έλεγχος μπάλας', 'Ball handling'),
    goal: text('Λιγότερη βιασύνη, καλύτερος έλεγχος και με τα δύο χέρια.', 'Less rushing; controlled handling with either hand.'),
    cues: [text('Δάχτυλα ανοιχτά, έλεγχος με τα δάχτυλα και όχι χτύπημα με την παλάμη.', 'Spread fingers; control with finger pads rather than slapping with the palm.'), text('Άνετα λυγισμένα γόνατα· σήκωσε το βλέμμα όσο διατηρείς τον έλεγχο.', 'Comfortably bend knees; raise your eyes while maintaining control.'), text('Το μη κυρίαρχο χέρι παίρνει εξίσου προσεκτική δουλειά, όχι μεγαλύτερη ταχύτητα.', 'Give the non-dominant hand equally careful work, not more speed.')],
    correction: text('Αν χάνεις την μπάλα, μείωσε ταχύτητα και ύψος πριν προσθέσεις κίνηση.', 'If you lose the ball, reduce speed and dribble height before adding movement.'),
    easier: text('Στατική ντρίμπλα με ένα χέρι σε ασφαλή, επίπεδη επιφάνεια.', 'Stationary one-hand dribbling on a safe, level surface.'),
    next: text('Με τον προπονητή: βλέμμα σε στόχο, έπειτα αργή κίνηση και απλή αλλαγή χεριού.', 'With your coach: eyes on a target, then slow movement and a simple hand change.'),
    observe: text('Ο προπονητής μετρά απώλειες ελέγχου σε ίδιο χρόνο, επιφάνεια και ρυθμό· όχι μόνο ταχύτητα.', 'Your coach can compare lost-control events over the same time, surface and pace; not speed alone.'),
    equipment: text('Μπάλα · επίπεδος χώρος', 'Ball · level space'),
    videos: [video('v_jqSQswdbU', 'Jr. NBA at Home: 100 Dribble Drill'), video('BnvGa0I8bMc', 'Fundamentals of Dribbling'), video('2_Nqc7eXkBM', 'Stationary Crossover (Low/Middle/High)'), video('y11vH_H7uWo', 'Chris Paul on Ball Handling', undefined, 'advanced'), video('wJK-BT1GBIc', '3 Two-Ball Drills for ELITE Handles', BT, 'advanced')],
  },
  {
    id: 'shooting', title: text('Σουτ & σταθερή ρουτίνα', 'Shooting & repeatable routine'),
    goal: text('Ισορροπημένο σουτ από απόσταση που δεν αλλοιώνει την τεχνική.', 'Balanced shooting from a distance that preserves your technique.'),
    cues: [text('Ξεκίνα κοντά· άνετη βάση στήριξης και σταθερό βλέμμα στον στόχο.', 'Start close; use a comfortable base and keep eyes on the target.'), text('Το χέρι υποστήριξης βοηθά τη σταθερότητα, χωρίς να σπρώχνει την απελευθέρωση.', 'The guide hand stabilizes without pushing the release.'), text('Ομαλή κίνηση και ισορροπημένη προσγείωση· η στάση ποδιών προσαρμόζεται με τον προπονητή.', 'Use a smooth motion and balanced landing; agree foot alignment with your coach.')],
    correction: text('Αν πιέζεις για απόσταση ή χάνεις ισορροπία, πλησίασε· άλλαξε μόνο ένα στοιχείο κάθε φορά.', 'If you strain for distance or lose balance, move closer; change only one element at a time.'),
    easier: text('Κοντινό σουτ χωρίς πίεση χρόνου, στη δόση που ορίζει ο προπονητής.', 'Close-range shots without time pressure, within your coach’s assigned dose.'),
    next: text('Πρώτα σταθερή τεχνική, έπειτα μικρή αλλαγή απόστασης ή υποδοχή πάσας — όχι και τα δύο μαζί.', 'Establish repeatable form, then slightly change distance or add a catch; not both at once.'),
    observe: text('Σύγκρινε εύστοχα/προσπάθειες από ίδια θέση· ένα μικρό δείγμα δεν αποδεικνύει βελτίωση.', 'Compare makes/attempts from the same spot; a small sample does not establish improvement.'),
    equipment: text('Μπάλα · καλάθι', 'Ball · hoop'),
    videos: [video('Ftj7lAdgY1k', '7 Spot Shooting | Fun Youth Basketball Drills from the Jr. NBA available in the MOJO App'), video('2hY6fQmPJQ8', '10 Best Basketball Form Shooting Drills You Need To Know', BT), video('1N01NH1h0ds', 'Fix Your Arc With The Stop Shooting Drill', BT, 'advanced'), video('JqR-SLQDMwI', '"The Shot Doctor" - How to Fix Bad Shooting Form – 12 Common Problems Solved', BT, 'advanced')],
  },
  {
    id: 'finishing', title: text('Lay-up & βηματισμός', 'Layups & footwork'),
    goal: text('Καθαρή ακολουθία βημάτων και έλεγχος και στις δύο πλευρές.', 'Clear footwork sequence and control on either side.'),
    cues: [text('Για κλασικό δεξί lay-up: δεξί–αριστερό, ώθηση από αριστερό, τελείωμα με δεξί· αντίστροφα αριστερά.', 'For a conventional right layup: right–left, take off left, finish right; reverse on the left.'), text('Μάθε πότε μαζεύεις την μπάλα μαζί με τον προπονητή ώστε να αποφεύγεις βήματα.', 'Agree the gather timing with your coach to avoid traveling.'), text('Κοίτα τον στόχο στο ταμπλό και προσγειώσου με έλεγχο σε ελεύθερο χώρο.', 'Look at your backboard target and land under control in clear space.')],
    correction: text('Αν μπερδεύονται τα βήματα, εξάσκησε πρώτα την ακολουθία περπατώντας χωρίς άλμα.', 'If the sequence breaks down, rehearse walking footwork without a jump first.'),
    easier: text('Βηματισμός χωρίς μπάλα· έπειτα κοντινό τελείωμα χωρίς επαφή.', 'Footwork without a ball, then a close finish without contact.'),
    next: text('Ο προπονητής προσθέτει αργή προσέγγιση· επαφή και ταχύτητα μόνο μέσα σε εγκεκριμένη ομαδική δουλειά.', 'Your coach can add a slow approach; contact and speed belong in approved team work.'),
    observe: text('Έλεγξε τη σωστή ακολουθία ξεχωριστά από την ευστοχία· δούλεψε και τις δύο πλευρές.', 'Assess correct footwork separately from shot accuracy; work on both sides.'),
    equipment: text('Μπάλα · καλάθι · ελεύθερη προσγείωση', 'Ball · hoop · clear landing space'),
    videos: [video('3noGvqHdoRE', 'Fundamentals of Lay-Ups'), video('9z6NtAuiB4U', 'Layup Skip Drill'), video('YFe1g5F4apY', 'The Mikan Drill - Jr. Wizards Instructional Series', 'Jr. Wizards', 'advanced')],
  },
  {
    id: 'passing', title: text('Πάσα & αποφάσεις', 'Passing & decisions'),
    goal: text('Ακρίβεια στον στόχο και έγκαιρη επιλογή, όχι εντυπωσιακές πάσες.', 'Accurate targets and timely choices, not flashy passes.'),
    cues: [text('Δες συμπαίκτη και διάδρομο πάσας πριν αφήσεις την μπάλα.', 'See your teammate and the passing lane before releasing.'), text('Στόχευσε εκεί που μπορεί να υποδεχτεί ο συμπαίκτης· προσάρμοσε δύναμη στην απόσταση.', 'Aim where your teammate can receive; match force to distance.'), text('Υποδοχή με έτοιμα χέρια και ισορροπία· μετά πάσα ή κίνηση με βάση την άμυνα.', 'Receive with ready hands and balance; then pass or move based on the defense.')],
    correction: text('Αν οι πάσες φεύγουν ψηλά ή χαμηλά, μείωσε απόσταση και ονόμασε τον στόχο πριν πασάρεις.', 'If passes miss high or low, shorten the distance and identify the target before passing.'),
    easier: text('Στατική πάσα σε συνεργάτη, χωρίς αμυντικό.', 'Stationary partner passing without a defender.'),
    next: text('Πάσα και μετακίνηση, έπειτα ένας αμυντικός στην ομάδα· όχι νέος αγώνας στην ημέρα ανάπαυσης.', 'Pass and move, then add a defender in team practice; not an extra game on your rest day.'),
    observe: text('Σημείωσε πάσες που φτάνουν στον στόχο και σωστές επιλογές, όχι μόνο το σύνολο πασών.', 'Observe passes reaching the target and good choices, not pass count alone.'),
    equipment: text('Μπάλα · συνεργάτες · χώρος', 'Ball · partners · space'),
    videos: [video('HiYPbqKyeLs', 'Circle Passing | Fun Youth Basketball Drills from the Jr. NBA available in the MOJO App'), video('H_RY_RrYdX4', 'Diamond Passing | Fun Youth Basketball Drills from the Jr. NBA available in the MOJO App'), video('NPDt1oHK4aI', 'Passing Tag | Fun Youth Basketball Drills from the Jr. NBA available in the MOJO App')],
  },
  {
    id: 'defense', title: text('Άμυνα & έλεγχος σώματος', 'Defense & body control'),
    goal: text('Ισορροπία και σωστή απόσταση χωρίς άσκοπα φάουλ.', 'Balance and appropriate spacing without unnecessary fouls.'),
    cues: [text('Άνετη κάμψη ισχίων/γονάτων και βάρος ισορροπημένο· όχι υπερβολικά χαμηλά.', 'Comfortably flex hips and knees with balanced weight; avoid forcing an excessively low stance.'), text('Διάβασε τον κορμό του αντιπάλου και κράτα ενεργά χέρια χωρίς επαφή.', 'Read the opponent’s torso and keep hands active without contact.'), text('Μικρά ελεγχόμενα βήματα για μικρή πλάγια απόσταση· γύρισε και τρέξε όταν χρειάζεται στην ομάδα.', 'Use controlled steps for short lateral distances; turn and run when needed in team play.')],
    correction: text('Αν χάνεις ισορροπία ή φτάνεις με τα χέρια, μείωσε ταχύτητα και επανέφερε τη βάση στήριξης.', 'If you lose balance or reach, slow down and reset your base.'),
    easier: text('Στατική στάση και αργά βήματα χωρίς αντίπαλο.', 'Static stance and slow steps without an opponent.'),
    next: text('Αργός καθρέφτης με συνεργάτη, μετά αποφάσεις στην ομάδα· όχι έξτρα εξαντλητικά slides.', 'Slow partner mirroring, then decisions in team practice; not extra exhausting slide drills.'),
    observe: text('Ζήτησε έλεγχο ισορροπίας, απόστασης και αποφυγής φάουλ· όχι μόνο κλεψίματα.', 'Ask for feedback on balance, spacing and foul avoidance; not steals alone.'),
    equipment: text('Επίπεδο γήπεδο · κατάλληλα παπούτσια', 'Level court · suitable shoes'),
    videos: [video('4A6KqSJX8Ek', 'Fundamentals of A Defensive Stance'), video('PggPs5r-iJY', '3-Touch Defensive Drill'), video('aSvFDJcIzys', 'Closeout, Slide, & Backpedal Drill', undefined, 'advanced'), video('380WaSj2DxE', '2-Person Closeout Drill', undefined, 'advanced')],
  },
  {
    id: 'footwork', title: text('Πόδια, pivot & jab step', 'Footwork, pivots & jab step'),
    goal: text('Νόμιμος άξονας, ισορροπία και απειλή πριν από ντρίμπλα ή σουτ.', 'A legal pivot foot, balance and a threat before you dribble or shoot.'),
    cues: [text('Διάλεξε πόδι-άξονα και κράτα το στο πάτωμα μέχρι να φύγει η μπάλα από το χέρι για ντρίμπλα.', 'Choose a pivot foot and keep it down until the ball leaves your hand on the dribble.'), text('Triple threat: μπάλα κοντά στο σώμα, γόνατα λυγισμένα, βλέμμα στο καλάθι.', 'Triple threat: ball close to the body, knees flexed, eyes on the rim.'), text('Το jab step είναι μικρό και γρήγορο· το σώμα μένει ισορροπημένο πάνω από τη βάση.', 'Keep the jab step short and quick, with your body balanced over your base.')],
    correction: text('Αν σέρνεται ή σηκώνεται το πόδι-άξονας, κάνε το αργά χωρίς μπάλα μέχρι να είναι αυτόματο.', 'If the pivot foot slides or lifts, rehearse slowly without the ball until it is automatic.'),
    easier: text('Μπροστινό και πίσω pivot χωρίς άμυνα, με σταθερή μπάλα.', 'Front and reverse pivots without a defender, ball held firmly.'),
    next: text('Με τον προπονητή: jab, ψεύτικο σουτ και μία επιλογή (σουτ ή drive) απέναντι σε παθητικό αμυντικό.', 'With your coach: jab, shot fake and one read (shoot or drive) against a passive defender.'),
    observe: text('Ο προπονητής ελέγχει παραβάσεις βημάτων και ισορροπία, όχι μόνο αν πέτυχε το καλάθι.', 'Your coach checks travels and balance, not only whether the shot went in.'),
    equipment: text('Μπάλα · καλάθι · επίπεδο γήπεδο', 'Ball · hoop · level court'),
    videos: [video('5DgXrx7ZkHU', 'Reverse Pivot Drill'), video('WM90iRaOZ3w', 'Fundamentals Of The Jab Step'), video('Ggg1unQOFfY', 'The Jab Step Breakdown Drill', undefined, 'advanced'), video('izfKUPxZboc', 'Pivot, Shot Fake, Jab Step (Advanced Footwork)', 'Atlanta Hawks', 'advanced')],
  },
] as const;

export type BasketballSkillId = typeof BASKETBALL_SKILLS[number]['id'];
export const BASKETBALL_VIDEO_COUNT = BASKETBALL_SKILLS.reduce((n, s) => n + s.videos.length, 0);
export function basketballSkill(id: unknown) { return BASKETBALL_SKILLS.find(skill => skill.id === id); }