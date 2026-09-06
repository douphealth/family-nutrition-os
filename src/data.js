export const FAMILY = [
  { id:'mother', name:'Μητέρα', role:'Υγεία & σταδιακή απώλεια λίπους', sex:'f', age:51, height:167, weight:87, activityFactor:1.35, goal:'gradual_fat_loss', athlete:false, accent:'#55d6a7' },
  { id:'father', name:'Πατέρας', role:'Συντήρηση & καρδιομεταβολική υγεία', sex:'m', age:54, height:178, weight:78, activityFactor:1.4, goal:'maintain', athlete:false, accent:'#6fc3ff' },
  { id:'daughter', name:'Κόρη', role:'Ανάπτυξη & ενέργεια', sex:'f', age:17, height:165, weight:52, activityFactor:1.55, goal:'growth', athlete:false, accent:'#ff8da1' },
  { id:'son', name:'Γιος', role:'Basketball performance & recovery', sex:'m', age:15, height:179, weight:67, activityFactor:1.8, goal:'performance', athlete:true, accent:'#ffc75b' }
];

export const TRAINING_LOADS = [
  ['rest','Rest / recovery'],['light','Light'],['normal','Normal training'],['hard','Hard training'],['game','Game day'],['tournament','Tournament / double session']
];

export const RECIPES = [
  {id:'oats',name:'Γιαούρτι, βρώμη & φρούτο',slot:'breakfast',time:5,tags:['breakfast','fast'],ingredients:['Γιαούρτι 2%','Βρώμη','Μπανάνα/μήλο','Καρύδια'],base:{kcal:440,p:24,c:58,f:13}},
  {id:'eggs',name:'Αυγά, ψωμί ολικής & ντομάτα',slot:'breakfast',time:10,tags:['breakfast'],ingredients:['2 αυγά','Ψωμί ολικής','Ντομάτα','Φρούτο'],base:{kcal:430,p:23,c:47,f:17}},
  {id:'lentils',name:'Φακές, σαλάτα & φέτα',slot:'lunch',time:35,tags:['legumes','batch'],ingredients:['Φακές','Καρότο','Κρεμμύδι','Ελαιόλαδο','Σαλάτα','Φέτα'],base:{kcal:560,p:28,c:76,f:17}},
  {id:'chickenTray',name:'Κοτόπουλο λεμονάτο, πατάτα & σαλάτα',slot:'lunch',time:45,tags:['protein','batch'],ingredients:['Κοτόπουλο','Πατάτες','Λεμόνι','Ελαιόλαδο','Σαλάτα'],base:{kcal:650,p:48,c:72,f:20}},
  {id:'fishRice',name:'Ψάρι, ρύζι & χόρτα',slot:'lunch',time:30,tags:['fish'],ingredients:['Ψάρι','Ρύζι','Χόρτα','Ελαιόλαδο'],base:{kcal:610,p:42,c:68,f:19}},
  {id:'gigantes',name:'Γίγαντες & χωριάτικη',slot:'lunch',time:50,tags:['legumes','batch'],ingredients:['Γίγαντες','Ντομάτα','Κρεμμύδι','Ελαιόλαδο','Χωριάτικη'],base:{kcal:590,p:25,c:79,f:18}},
  {id:'omelet',name:'Ομελέτα λαχανικών & ψωμί',slot:'dinner',time:12,tags:['fast'],ingredients:['Αυγά','Σπανάκι','Μανιτάρια','Ψωμί ολικής'],base:{kcal:470,p:30,c:38,f:22}},
  {id:'dakos',name:'Ντάκος ολικής',slot:'dinner',time:6,tags:['fast'],ingredients:['Κριθαρένιο παξιμάδι','Ντομάτα','Ξινομυζήθρα/φέτα','Ελιές','Ελαιόλαδο'],base:{kcal:480,p:18,c:52,f:23}},
  {id:'yogSnack',name:'Γιαούρτι & φρούτο',slot:'snack',time:2,tags:['snack','fast'],ingredients:['Γιαούρτι','Φρούτο'],base:{kcal:220,p:15,c:30,f:4}},
  {id:'bananaToast',name:'Μπανάνα + ψωμί με ταχίνι',slot:'snack',time:3,tags:['snack','athlete'],ingredients:['Μπανάνα','Ψωμί','Ταχίνι'],base:{kcal:330,p:10,c:52,f:10}},
  {id:'milkRecovery',name:'Recovery: γάλα/γιαούρτι, μπανάνα & βρώμη',slot:'snack',time:3,tags:['athlete','recovery'],ingredients:['Γάλα ή γιαούρτι','Μπανάνα','Βρώμη'],base:{kcal:390,p:22,c:60,f:8}},
  {id:'pastaVeg',name:'Ζυμαρικά ολικής, ντομάτα & λαχανικά',slot:'dinner',time:20,tags:['fast'],ingredients:['Ζυμαρικά ολικής','Ντομάτα','Λαχανικά','Τυρί'],base:{kcal:590,p:24,c:86,f:17}}
];

const weeks = [
  [['oats','lentils','yogSnack','omelet'],['eggs','chickenTray','yogSnack','dakos'],['oats','fishRice','bananaToast','gigantes'],['eggs','pastaVeg','yogSnack','omelet'],['oats','gigantes','yogSnack','pastaVeg'],['eggs','fishRice','bananaToast','omelet'],['oats','chickenTray','yogSnack','dakos']],
  [['eggs','gigantes','yogSnack','omelet'],['oats','chickenTray','yogSnack','dakos'],['eggs','fishRice','bananaToast','lentils'],['oats','lentils','yogSnack','omelet'],['eggs','gigantes','yogSnack','pastaVeg'],['oats','fishRice','bananaToast','omelet'],['eggs','chickenTray','yogSnack','dakos']],
  [['oats','lentils','yogSnack','omelet'],['eggs','chickenTray','yogSnack','dakos'],['oats','fishRice','bananaToast','gigantes'],['eggs','gigantes','yogSnack','omelet'],['oats','lentils','yogSnack','pastaVeg'],['eggs','fishRice','bananaToast','omelet'],['oats','chickenTray','yogSnack','dakos']],
  [['eggs','gigantes','yogSnack','omelet'],['oats','chickenTray','yogSnack','dakos'],['eggs','fishRice','bananaToast','lentils'],['oats','pastaVeg','yogSnack','omelet'],['eggs','lentils','yogSnack','pastaVeg'],['oats','fishRice','bananaToast','omelet'],['eggs','chickenTray','yogSnack','dakos']]
];
export const PLAN_28 = weeks.flatMap((week,wi)=>week.map((slots,di)=>({day:wi*7+di+1,week:wi+1,dow:['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'][di],breakfast:slots[0],lunch:slots[1],snack:slots[2],dinner:slots[3]})));

export const SOURCES = [
  {label:'WHO — Healthy diet',url:'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'},
  {label:'CDC — Child & teen BMI',url:'https://www.cdc.gov/bmi/child-teen-calculator/bmi-categories.html'},
  {label:'IOC RED-S consensus',url:'https://bjsm.bmj.com/content/57/17/1073'},
  {label:'Greek Ministry of Health — Dietary guidance',url:'https://www.moh.gov.gr/'}
];
