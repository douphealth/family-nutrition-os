/**
 * ZENITH PRO · curated technique library for 15-year-old basketball athlete.
 * Every YouTube URL was resolved to an identifiable video title and creator
 * on 2026-11-08. An example video is for MOVEMENT TECHNIQUE, not a prescription
 * for exercise intensity, loads, repetitions or injury treatment.
 *
 * NO autoplay, third-party scripts, YouTube API or embedded tracking.
 * Only user-initiated, noreferrer YouTube links are exposed by the view.
 */
const v=(id,channel,topic,start=0)=>Object.freeze({
  url:'https://www.youtube.com/watch?v='+id+(start?'&t='+start+'s':''),
  channel,topic,verifiedAt:'2026-11-08'
});
export const TECHNIQUE_VIDEOS=Object.freeze({
  hip:v('fPaF3oro6hE','E3 Rehab','Hip mobility and controlled range',314),
  ankle:v('S5xKokqeOb4','E3 Rehab','Foot and ankle mobility and control',783),
  squat:v('yzL1543i1-o','E3 Rehab Exercise Library','Bodyweight squat'),
  split:v('4bNQITw0VdY','E3 Rehab','Supported split-squat technique',69),
  hinge:v('oSfNnSJWlMw','E3 Rehab Exercise Library','Unloaded hip hinge'),
  push:v('3H3R9RU3PRk','E3 Rehab','Push-up progressions including easier options'),
  row:v('RrcocPwM_-U','C.E.S Physio & Rehab','Resistance band rowing'),
  deadbug:v('BZYaCzbP09M','E3 Rehab Exercise Library','Dead bug'),
  sideplank:v('eRygfYEe1hs','E3 Rehab Exercise Library','Side plank'),
  calf:v('zvZp4FJjME4','E3 Rehab Exercise Library','Heel raises'),
  balance:v('nLHy38nxMmY','E3 Rehab Exercise Library','Single leg balance'),
  stepup:v('wfhXnLILqdk','Cornerstone Physiotherapy','Low step-up technique'),
  march:v('hsO_dSeRBFY','Jr. NBA / Jr. WNBA','Forward/backward/lateral marching'),
  breathe:v('ewYg7iyayE8','Cleveland Clinic','Diaphragmatic breathing basics',35)
});
const copy=(el,en)=>Object.freeze({el,en});
const exercise=(title,dose,cue,avoid,easier,equipment,goal,video)=>Object.freeze({
  title:copy(...title),dose:copy(...dose),cue:copy(...cue),
  avoid:copy(...avoid),easier:copy(...easier),
  equipment:copy(...equipment),goal:copy(...goal),video:video?TECHNIQUE_VIDEOS[video]:null
});
export const EXERCISE_LIBRARY=Object.freeze({
  'hip-mobility':exercise(
    ['Κινητικότητα ισχίων','Controlled hip mobility'],
    ['2–3 ήπιες κινήσεις × 5/πλευρά · μέσα στο διαθέσιμο εύρος','2–3 easy movements × 5/side · comfortable range'],
    ['Αργός ρυθμός, σταθερή λεκάνη και ομαλή αναπνοή.','Move slowly; keep the pelvis controlled and breathe normally.'],
    ['Όχι πίεση στο τελικό εύρος ή πόνο.','Never force range or work through pain.'],
    ['Μικρότερο εύρος, στήριξη σε τοίχο.','Reduce range or use wall support.'],
    ['Στρωματάκι προαιρετικά','Optional mat'],
    ['Προετοιμασία ισχίων πριν από τεχνική δύναμης','Prepare hips before strength technique'],
    'hip'),
  'ankle-mobility':exercise(
    ['Ήπια κινητοποίηση αστραγάλου','Gentle ankle mobility'],
    ['2 × 6 αργές μεταφορές γονάτου προς τοίχο/πόδι','2 × 6 slow knee-over-foot movements'],
    ['Η φτέρνα παραμένει κάτω, το γόνατο ακολουθεί τα δάχτυλα.','Keep heel down; let knee track over toes.'],
    ['Μην ξεκολλάς τη φτέρνα ή πιέζεις σε πόνο.','Do not lift heel or force a painful stretch.'],
    ['Στάσου πιο κοντά στον τοίχο και μείωσε εύρος.','Stand closer to the wall; decrease range.'],
    ['Τοίχος προαιρετικά','Optional wall'],
    ['Έλεγχος ποδοκνημικής και προετοιμασία προσγείωσης','Ankle control for safe basketball movement'],
    'ankle'),
  squat:exercise(
    ['Κάθισμα με το βάρος του σώματος','Bodyweight squat'],
    ['2 × 8 · 45–60″ διάλειμμα · 2″ κάθοδος','2 × 8 · 45–60s rest · 2s lowering'],
    ['Πέλματα κάτω, γόνατα στην κατεύθυνση των δαχτύλων, άνετο βάθος.','Feet planted, knees track over toes, comfortable depth.'],
    ['Όχι βιαστική κάθοδος, ανασήκωμα φτέρνας ή πόνος.','Avoid collapsing, raised heels or pain.'],
    ['Κάθισμα προς καρέκλα με έλεγχο.','Sit-to-stand from a stable chair.'],
    ['Καρέκλα προαιρετικά','Optional chair'],
    ['Βασικό μοτίβο δύναμης κάτω άκρων','Foundational lower-body strength pattern'],
    'squat'),
  split:exercise(
    ['Split squat με στήριξη','Supported split squat'],
    ['2 × 6 ανά πόδι · 60″ διάλειμμα','2 × 6 each leg · 60s rest'],
    ['Σταθερό βήμα εμπρός/πίσω, και τα δύο πόδια ακίνητα, ελεγχόμενη κάθοδος.','Staggered stance, both feet stay planted, lower with control.'],
    ['Μην πέφτεις απότομα ή χάνεις την ισορροπία.','Do not drop or lose balance.'],
    ['Πιάσου σε σταθερό πάγκο· μικρότερο βάθος.','Use stable support and reduce depth.'],
    ['Σταθερό στήριγμα','Stable support'],
    ['Μονόπλευρος έλεγχος για αλλαγές κατεύθυνσης','Single-leg control for basketball movement'],
    'split'),
  hinge:exercise(
    ['Hip hinge χωρίς φορτίο','Unloaded hip hinge'],
    ['2 × 8 αργές επαναλήψεις · 45″ ανάπαυση','2 × 8 slow reps · 45s rest'],
    ['Στείλε τη λεκάνη πίσω, λύγισε λίγο τα γόνατα και κράτα φυσικές καμπύλες.','Push hips backward, soften knees, maintain natural spine shape.'],
    ['Μην καμπουριάζεις ή μετατρέπεις την κίνηση σε βαθύ κάθισμα.','Do not round excessively or turn it into a deep squat.'],
    ['Εξάσκηση μπροστά σε τοίχο χωρίς φορτίο.','Practice wall-touch hip hinge without load.'],
    ['Χωρίς εξοπλισμό','None'],
    ['Βάση οπίσθιας αλυσίδας χωρίς βαριά βάρη','Posterior chain pattern without heavy loading'],
    'hinge'),
  push:exercise(
    ['Push-up σε σταθερό πάγκο','Hands-elevated push-up'],
    ['2 × 6–8 · 45–60″ διάλειμμα','2 × 6–8 · 45–60s rest'],
    ['Χέρια σε σταθερή υπερυψωμένη επιφάνεια, κορμός ενιαίος και αργός ρυθμός.','Hands on stable raised surface; keep trunk aligned and move slowly.'],
    ['Μην αφήνεις τη λεκάνη να πέφτει ή τους αγκώνες να ανοίγουν υπερβολικά.','Avoid sagging hips or excessive elbow flare.'],
    ['Μεγαλύτερο ύψος χεριών ή push-up στον τοίχο.','Use higher hand support or wall push-ups.'],
    ['Σταθερός πάγκος ή τοίχος','Stable bench or wall'],
    ['Ασφαλής βασική ώθηση του άνω σώματος','Basic upper-body pushing strength'],
    'push'),
  row:exercise(
    ['Κωπηλατική με ελαφρύ λάστιχο','Light resistance-band row'],
    ['2 × 8 · 45–60″ διάλειμμα','2 × 8 · 45–60s rest'],
    ['Το λάστιχο αγκυρωμένο με ασφάλεια, τράβηξε αγκώνες πίσω χωρίς ανασήκωμα ώμων.','Anchor band securely, draw elbows back without shrugging.'],
    ['Όχι απότομο τίναγμα, χαλαρή αγκύρωση ή υπερέκταση.','No jerks, loose band anchoring or over-leaning.'],
    ['Ελαφρύτερο λάστιχο ή κίνηση χωρίς αντίσταση.','Use lighter band or practice without resistance.'],
    ['Λάστιχο και ασφαλής αγκύρωση','Band and secure anchor'],
    ['Ισορροπία έλξεων/ωθήσεων, έλεγχος ωμοπλάτης','Balanced pulling and shoulder control'],
    'row'),
  deadbug:exercise(
    ['Dead bug · έλεγχος κορμού','Dead bug · trunk control'],
    ['2 × 6 ανά πλευρά · αργά','2 × 6 per side · slow'],
    ['Εναλλαγή αντίθετου χεριού/ποδιού με σταθερό κορμό και φυσιολογική αναπνοή.','Alternate opposite arm and leg while keeping trunk controlled and breathing.'],
    ['Μην αυξάνεις εύρος αν χάνεται η θέση κορμού ή κρατάς την αναπνοή.','Do not reach farther if trunk position or breathing is lost.'],
    ['Μετακίνησε μόνο ένα πόδι κάθε φορά.','Move one leg at a time.'],
    ['Στρωματάκι','Mat'],
    ['Σταθερότητα κορμού και συντονισμός','Core control and coordination'],
    'deadbug'),
  sideplank:exercise(
    ['Πλάγια σανίδα','Side plank'],
    ['2 × 15–20″ ανά πλευρά · πλήρης ανάπαυση','2 × 15–20s per side · ample rest'],
    ['Αγκώνας κάτω από ώμο, ισχία σε ευθεία με κορμό, χωρίς πόνο.','Elbow beneath shoulder, hips aligned, pain-free hold.'],
    ['Μην αφήνεις τον ώμο να βυθιστεί ή κρατάς την αναπνοή.','Avoid sinking shoulder or breath-holding.'],
    ['Λυγισμένα γόνατα στο πάτωμα.','Keep knees bent and supported.'],
    ['Στρωματάκι','Mat'],
    ['Πλευρική σταθερότητα κορμού','Lateral trunk stability'],
    'sideplank'),
  balance:exercise(
    ['Ισορροπία στο ένα πόδι','Single-leg balance'],
    ['2 × 20″ ανά πλευρά · στήριξη δίπλα σου','2 × 20s each leg · support nearby'],
    ['Μαλακό γόνατο, ευθεία λεκάνη, σταθερό βλέμμα.','Soft knee, level pelvis, fixed gaze.'],
    ['Μη στέκεσαι σε ασταθές σημείο ούτε με κλειστά μάτια.','Do not use unstable surfaces or close eyes.'],
    ['Άκρες δαχτύλων σε τοίχο.','Fingertip wall support.'],
    ['Τοίχος/καρέκλα για ασφάλεια','Wall/chair support'],
    ['Ιδιοδεκτικότητα ποδοκνημικής','Ankle proprioception'],
    'balance'),
  calf:exercise(
    ['Αργές άρσεις γάμπας','Controlled calf raises'],
    ['2 × 10 · 2″ άνοδος / 2″ κάθοδος','2 × 10 · 2s up / 2s down'],
    ['Βάρος και στα δύο πόδια, ήπια στήριξη σε καρέκλα, χωρίς αναπήδηση.','Even weight, chair support, no bouncing.'],
    ['Μην αφήνεις τους αστραγάλους να γέρνουν πλάγια.','Avoid ankles rolling out or in.'],
    ['Μικρότερη άνοδος με σταθερή στήριξη.','Use smaller rise with steady support.'],
    ['Σταθερή καρέκλα','Stable chair'],
    ['Γάμπες και σταθερότητα ποδοκνημικής','Calf control and ankle stability'],
    'calf'),
  stepup:exercise(
    ['Step-up σε χαμηλό σταθερό σκαλί','Controlled low step-up'],
    ['2 × 5 ανά πόδι · 45″ ανάπαυση','2 × 5 each leg · 45s rest'],
    ['Όλο το πέλμα στο σκαλί, αργή άνοδος/κάθοδος, σταθερό γόνατο.','Whole foot on step, slow ascent/descent and steady knee.'],
    ['Όχι ψηλό σκαλί ή απότομη ώθηση από το πίσω πόδι.','Avoid high step or pushing forcefully with trailing leg.'],
    ['Χαμηλότερο σκαλί και κουπαστή.','Use shorter step and handrail.'],
    ['Χαμηλό σκαλί και κουπαστή','Low step and rail'],
    ['Έλεγχος μονόπλευρης φόρτισης','Unilateral control'],
    'stepup'),
  march:exercise(
    ['Marching τεχνικής μπάσκετ','Basketball movement marching'],
    ['3 × 20″ αργά · 50–60″ διάλειμμα','3 × 20s slow · 50–60s recovery'],
    ['Ήρεμη εναλλαγή ποδιών, κορμός ψηλά, αντίθετο χέρι/γόνατο.','Slow alternate steps, tall posture, opposite arm and knee.'],
    ['Όχι σπριντ, άλματα ή γρήγορες επαφές στο έδαφος.','No sprints, hops or fast ground contacts.'],
    ['March επί τόπου κοντά σε τοίχο.','March in place near a wall.'],
    ['Χωρίς εξοπλισμό','None'],
    ['Μηχανική κίνησης χωρίς νέο εξαντλητικό φορτίο','Movement mechanics without conditioning fatigue'],
    'march'),
  breathing:exercise(
    ['Ήρεμη διαφραγματική αναπνοή','Gentle diaphragmatic breathing'],
    ['2–4 λεπτά άνετα · χωρίς κράτημα αναπνοής','2–4 minutes comfortably · no breath-holds'],
    ['Χαλάρωσε τους ώμους, ανάπνευσε ήσυχα και φυσικά.','Relax shoulders and breathe slowly and comfortably.'],
    ['Όχι αναγκαστικά βαθιά αναπνοή, ζάλη ή υπεραερισμός.','Avoid forced deep breaths or dizziness.'],
    ['Κανονική ήρεμη αναπνοή.','Just breathe normally.'],
    ['Χωρίς εξοπλισμό','None'],
    ['Μετάβαση σε ξεκούραση','Transition to rest'],
    'breathe'),
  walk:exercise(
    ['Χαλαρό περπάτημα','Easy walking'],
    ['Άνετη ένταση συνομιλίας, χωρίς τρέξιμο','Comfortable talking pace, no running'],
    ['Ίσια χαλαρή στάση και ομαλή αναπνοή.','Relaxed tall posture and comfortable breathing.'],
    ['Όχι διαλειμματική ένταση ή προπόνηση αντοχής.','Not intervals or endurance conditioning.'],
    ['Πλήρης ανάπαυση όταν υπάρχει κόπωση.','Full rest if fatigued.'],
    ['Ασφαλής επίπεδη διαδρομή','Safe level surface'],
    ['Πολύ χαμηλής έντασης αποκατάσταση','Very low-intensity recovery'],
    null)
});
export function exerciseFor(id){return EXERCISE_LIBRARY[id]||null;}
export function isVerifiedYouTube(url){
  if(typeof url!=='string')return false;
  try{
    const u=new URL(url);
    return u.protocol==='https:'&&u.hostname==='www.youtube.com'
      &&u.pathname==='/watch'&&/^[A-Za-z0-9_-]{11}$/.test(u.searchParams.get('v')||'');
  }catch{return false;}
}
