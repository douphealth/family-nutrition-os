/**
 * ZENITH PRO · recipe illustrations
 * ---------------------------------------------------------------------------
 * Nineteen top-down dishes drawn as inline SVG. Offline, dependency-free, sharp
 * at any size, and identical on every device.
 *
 * Style rules (so the set reads as one family):
 *   • one 96 × 96 canvas; the dish sits on a white plate/bowl with a rim and a
 *     soft ground shadow;
 *   • flat colour fills, one lighter "highlight" shape per volume, no outlines;
 *   • natural food colours that are fixed rather than themed — a tomato is red in
 *     both themes; the tile behind it is what the theme tints.
 *
 * No gradients or <defs>: an id-referenced gradient breaks when the first copy
 * lives inside a `display:none` container (a closed sheet), and this art is
 * rendered in sheets. Flat shapes have no such failure mode.
 */

const C = {
  plate: '#FFFFFF', rim: '#E3E8E0', well: '#F4F6F1', shadow: 'rgba(15,35,24,.16)',
  tomato: '#E5484D', tomatoDk: '#C63A40', tomatoHi: '#FF8A8E', sauce: '#D8443A',
  leaf: '#4DA35C', leafDk: '#2F8A4B', herb: '#3E9B55',
  lemon: '#F7D046', lemonDk: '#EDB92B', lemonPale: '#FBE98E',
  eggWhite: '#FFFFFF', yolk: '#F6A21E', yolkHi: '#FFC14D',
  toast: '#E2A85B', crust: '#C98A3D', toastHi: '#F0C382',
  olive: '#3A3B2B', oliveHi: '#6A6B4D',
  feta: '#FFFDF4', fetaShade: '#EDE8D6',
  onion: '#B764A8', onionHi: '#D58BC6',
  cucumber: '#8CCB6B', cucumberDk: '#5FAE47', cucumberPale: '#C5E8B0',
  potato: '#EBC26A', potatoDk: '#D3A03F',
  chicken: '#C87A32', chickenHi: '#E29B4E',
  fish: '#B4C3D6', fishDk: '#8FA4BD', fishHi: '#DCE5F0',
  lentil: '#8A5A2F', lentilHi: '#A9743F', broth: '#C67632',
  carrot: '#F08A24', bean: '#F4EEDC', beanShade: '#E2D8BC',
  banana: '#F6DC6B', bananaDk: '#E7C445',
  walnut: '#A67846', walnutDk: '#7E5729',
  honey: '#E9A21B', oats: '#E8D3A8', oatsDk: '#CDAE76',
  yogurt: '#FBF9F0', yogurtShade: '#EEEAD8',
  strawberry: '#E23D5A', blueberry: '#4A5DB0', grape: '#7C4F9E', orange: '#F49A2A', orangePale: '#FFC66E',
  kiwi: '#7FBF4D', kiwiPale: '#D5EBA8', apple: '#E45B4E', applePale: '#F7E7BB',
  pasta: '#F1D58A', pastaDk: '#DDB964', cheese: '#FFF7DD',
  rice: '#FFFFFF', riceShade: '#E9ECE4', spinach: '#2F8F4E', spinachHi: '#5CB877',
  pita: '#EFCF95', pitaDk: '#D9AE62', meat: '#8A4B2A', meatHi: '#AD6A40', mushroom: '#CDBBA4', mushroomDk: '#A99479',
  zucchini: '#7AB55C', pepperG: '#58A14A', pepperR: '#DA3B3B', pepperY: '#F2B632',
  rusk: '#B98545', ruskHi: '#D5A468', cream: '#F2E6C9', creamDk: '#E2D2A8',
  glass: 'rgba(255,255,255,.55)', glassEdge: '#C9D4CD', milk: '#F7EFE2', smoothie: '#F3B6B0', smoothieHi: '#F9D2CE',
  steel: '#C4CCC8', steelDk: '#A5AFAB', dish: '#F0EEE6', dishRim: '#DDD8C8'
};

/** Ground shadow + white plate (or bowl) + inner well. */
const plate = (r = 36, cx = 48, cy = 46) => `
  <ellipse cx="${cx}" cy="${cy + r - 1}" rx="${r * 0.82}" ry="${r * 0.13}" fill="${C.shadow}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.plate}"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 0.75}" fill="none" stroke="${C.rim}" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.76}" fill="${C.well}"/>`;

const dots = (list, r, fill, opacity = 1) => list.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`).join('');

/** A slice: circle + lighter inner circle. */
const slice = (x, y, r, outer, inner, ir = 0.62) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${outer}"/><circle cx="${x}" cy="${y}" r="${r * ir}" fill="${inner}"/>`;

const MOTIFS = {
  /* Yogurt bowl with strawberries, blueberries, walnut and a honey swirl */
  yogurt: () => `${plate()}
    <circle cx="48" cy="46" r="26" fill="${C.yogurt}"/>
    <path d="M27 42c8-4 16 4 24 0s12-4 18-1" fill="none" stroke="${C.yogurtShade}" stroke-width="3" stroke-linecap="round" opacity=".9"/>
    <path d="M32 52c7 5 13-2 19 1s9 3 13-1" fill="none" stroke="${C.honey}" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M40 34c3-3 8-3 11 0 2 3 0 8-5 9-6-1-8-5-6-9z" fill="${C.strawberry}"/>
    <path d="M44 33l2-3 2 3z" fill="${C.leafDk}"/>
    ${dots([[58, 40], [62, 47], [54, 49], [36, 45]], 3.6, C.blueberry)}
    ${dots([[57, 39], [61, 46], [53, 48], [35, 44]], 1.1, '#8496DD')}
    <ellipse cx="60" cy="56" rx="5" ry="3.6" fill="${C.walnut}" transform="rotate(-25 60 56)"/>
    <ellipse cx="59" cy="55" rx="2.4" ry="1.4" fill="${C.walnutDk}" transform="rotate(-25 59 55)"/>`,

  /* Oat bowl: granola, banana coins, walnuts */
  oats: () => `${plate()}
    <circle cx="48" cy="46" r="26" fill="${C.oats}"/>
    ${dots([[34, 38], [40, 32], [52, 31], [60, 36], [64, 46], [58, 57], [46, 61], [35, 55], [30, 46], [44, 40], [55, 44], [47, 51]], 2, C.oatsDk)}
    ${slice(40, 44, 7, C.banana, C.bananaDk, 0.52)}
    ${slice(53, 40, 6.4, C.banana, C.bananaDk, 0.52)}
    ${slice(53, 54, 6.6, C.banana, C.bananaDk, 0.52)}
    <ellipse cx="64" cy="52" rx="5" ry="3.6" fill="${C.walnut}" transform="rotate(35 64 52)"/>
    <ellipse cx="32" cy="56" rx="4.6" ry="3.4" fill="${C.walnut}" transform="rotate(-30 32 56)"/>
    <ellipse cx="46" cy="30" rx="4.2" ry="3" fill="${C.walnutDk}" transform="rotate(10 46 30)"/>`,

  /* Fried eggs, toast, tomato, olive */
  egg: () => `${plate()}
    <path d="M25 42c-2-9 7-15 15-12 6-5 17-3 19 5 8 0 12 8 6 14-3 6-11 6-16 4-8 5-19 3-22-4-3-2-3-4-2-7z" fill="${C.eggWhite}" stroke="${C.rim}" stroke-width="1"/>
    <circle cx="44" cy="42" r="8.4" fill="${C.yolk}"/><circle cx="41.4" cy="39.4" r="2.6" fill="${C.yolkHi}"/>
    <rect x="52" y="52" width="20" height="17" rx="4.5" fill="${C.crust}" transform="rotate(-14 62 60)"/>
    <rect x="54" y="53.5" width="16" height="13" rx="3" fill="${C.toast}" transform="rotate(-14 62 60)"/>
    ${slice(31, 61, 8.5, C.tomato, C.tomatoHi, 0.42)}
    <path d="M25 61h12M31 55v12" stroke="${C.tomatoDk}" stroke-width="1.3" opacity=".55"/>
    <ellipse cx="66" cy="34" rx="4.2" ry="3.2" fill="${C.olive}"/><circle cx="65" cy="33" r="1" fill="${C.oliveHi}"/>`,

  /* Vegetable omelette with mushroom, spinach and toast */
  omelet: () => `${plate()}
    <path d="M22 50c0-16 13-24 27-24s25 8 25 24c0 4-2 6-5 6H27c-3 0-5-2-5-6z" fill="${C.yolkHi}"/>
    <path d="M22 50c0-16 13-24 27-24 8 0 15 2 20 8-6-2-14-2-22 2-10 5-17 8-25 14z" fill="${C.yolk}" opacity=".55"/>
    ${dots([[36, 44], [45, 38], [55, 42], [62, 48], [40, 52], [52, 50]], 2.4, C.spinach)}
    ${dots([[48, 45], [58, 52]], 2, C.spinachHi)}
    <ellipse cx="34" cy="60" rx="7" ry="5" fill="${C.mushroom}"/><ellipse cx="34" cy="60" rx="3.6" ry="2.4" fill="${C.mushroomDk}"/>
    <ellipse cx="46" cy="66" rx="6.4" ry="4.6" fill="${C.mushroom}" transform="rotate(20 46 66)"/><ellipse cx="46" cy="66" rx="3.2" ry="2.2" fill="${C.mushroomDk}" transform="rotate(20 46 66)"/>
    <path d="M60 60l12 4-3 11-12-4z" fill="${C.crust}"/><path d="M61 62l9 3-2 7-9-3z" fill="${C.toast}"/>`,

  /* Lentil / bean soup in a bowl */
  soup: () => `${plate()}
    <circle cx="48" cy="46" r="26" fill="${C.broth}"/>
    <circle cx="48" cy="46" r="26" fill="none" stroke="${C.lentilHi}" stroke-width="2" opacity=".5"/>
    ${dots([[34, 40], [41, 35], [50, 33], [58, 38], [63, 46], [56, 54], [46, 58], [37, 54], [32, 47], [45, 44], [54, 46], [48, 50], [41, 49], [58, 44]], 2.7, C.lentil)}
    ${dots([[36, 41], [51, 34], [64, 47], [47, 59], [46, 45]], 1.2, C.lentilHi)}
    ${slice(40, 44, 4.4, C.carrot, '#F9B45E', 0.5)}${slice(56, 51, 4, C.carrot, '#F9B45E', 0.5)}${slice(50, 41, 3.6, C.carrot, '#F9B45E', 0.5)}
    ${dots([[44, 52], [60, 42], [38, 35]], 1.6, C.herb)}
    <path d="M30 30c-2-4 1-7 3-9M38 27c-2-4 1-7 3-9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".0"/>`,

  /* Giant beans baked in tomato sauce, in an oval dish */
  beans: () => `
    <ellipse cx="48" cy="80" rx="32" ry="5" fill="${C.shadow}"/>
    <ellipse cx="48" cy="48" rx="38" ry="31" fill="${C.dish}"/><ellipse cx="48" cy="48" rx="37" ry="30" fill="none" stroke="${C.dishRim}" stroke-width="1.5"/>
    <ellipse cx="48" cy="48" rx="30" ry="23.5" fill="${C.sauce}"/><ellipse cx="48" cy="48" rx="30" ry="23.5" fill="none" stroke="${C.tomatoDk}" stroke-width="2" opacity=".5"/>
    ${[[34, 42, -20], [46, 36, 10], [58, 42, 25], [40, 52, 15], [54, 53, -15], [66, 52, 30], [29, 54, -30]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="7.4" ry="4.9" fill="${C.bean}" transform="rotate(${a} ${x} ${y})"/><ellipse cx="${x - 1.2}" cy="${y - 1.2}" rx="3.4" ry="1.5" fill="#fff" opacity=".65" transform="rotate(${a} ${x} ${y})"/>`).join('')}
    ${slice(46, 46, 4, C.carrot, '#F9B45E', 0.5)}${slice(60, 34, 3.6, C.carrot, '#F9B45E', 0.5)}
    ${dots([[38, 34], [52, 62], [30, 46], [68, 44], [47, 45]], 1.7, C.herb)}`,

  /* Roasting tray: chicken, potato wedges, lemon */
  tray: () => `
    <ellipse cx="48" cy="80" rx="34" ry="5" fill="${C.shadow}"/>
    <rect x="8" y="16" width="80" height="62" rx="12" fill="${C.steelDk}"/>
    <rect x="11" y="19" width="74" height="56" rx="10" fill="${C.steel}"/>
    <rect x="15" y="23" width="66" height="48" rx="8" fill="#DCE2DE"/>
    ${[[30, 36, -25], [46, 30, 15], [64, 38, 40]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="7.6" fill="${C.chicken}" transform="rotate(${a} ${x} ${y})"/><ellipse cx="${x - 2}" cy="${y - 2.2}" rx="6.4" ry="3.1" fill="${C.chickenHi}" transform="rotate(${a} ${x} ${y})"/>`).join('')}
    ${[[26, 58, 20], [40, 54, -15], [55, 58, 25], [70, 56, -20], [34, 64, 5], [60, 65, -10]].map(([x, y, a]) => `<rect x="${x - 7}" y="${y - 3.6}" width="14" height="7.2" rx="3.4" fill="${C.potato}" transform="rotate(${a} ${x} ${y})"/><rect x="${x - 5}" y="${y - 2}" width="8" height="2.2" rx="1.1" fill="${C.potatoDk}" opacity=".55" transform="rotate(${a} ${x} ${y})"/>`).join('')}
    ${slice(70, 30, 8.4, C.lemonDk, C.lemon, 0.8)}<path d="M70 22v16M62 30h16M64 24l12 12M76 24L64 36" stroke="${C.lemonPale}" stroke-width="1.2"/>
    ${dots([[24, 44], [50, 46], [36, 50], [76, 46], [46, 66], [64, 48]], 1.6, C.herb)}`,

  /* Fish fillet with lemon wedge and herbs */
  fish: () => `${plate()}
    <path d="M18 46c8-13 26-17 40-10 6 3 10 7 12 10-2 3-6 7-12 10-14 7-32 3-40-10z" fill="${C.fish}"/>
    <path d="M18 46c8-13 26-17 40-10 3 1 5 3 8 5-14-3-30 0-48 5z" fill="${C.fishHi}" opacity=".8"/>
    <path d="M70 46l14-12v24z" fill="${C.fishDk}"/>
    <path d="M32 36c3 6 3 16 0 22M42 33c3 7 3 19 0 26M52 33c3 7 3 19 0 25" stroke="${C.fishDk}" stroke-width="1.4" fill="none" opacity=".55"/>
    <circle cx="26" cy="43" r="2.6" fill="#2E3B4A"/><circle cx="25.2" cy="42.2" r=".9" fill="#fff"/>
    <path d="M55 62c8 0 14 3 16 9-8 2-15-1-16-9z" fill="${C.lemon}"/><path d="M57 63c5 0 9 2 11 5" stroke="${C.lemonPale}" stroke-width="1.4" fill="none"/>
    ${dots([[36, 65], [44, 68], [30, 62]], 2, C.herb)}`,

  /* Toast with feta, tomato and cucumber (or banana) */
  toast: () => `${plate()}
    <rect x="21" y="27" width="36" height="34" rx="9" fill="${C.crust}" transform="rotate(-8 39 44)"/>
    <rect x="24" y="30" width="30" height="28" rx="6" fill="${C.toast}" transform="rotate(-8 39 44)"/>
    <rect x="24" y="30" width="30" height="9" rx="4.5" fill="${C.toastHi}" opacity=".6" transform="rotate(-8 39 44)"/>
    <rect x="42" y="34" width="34" height="32" rx="9" fill="${C.crust}" transform="rotate(10 59 50)"/>
    <rect x="45" y="37" width="28" height="26" rx="6" fill="${C.toast}" transform="rotate(10 59 50)"/>
    <rect x="30" y="38" width="9" height="9" rx="2" fill="${C.feta}" stroke="${C.fetaShade}" stroke-width="1" transform="rotate(-6 34 42)"/>
    <rect x="41" y="43" width="8" height="8" rx="2" fill="${C.feta}" stroke="${C.fetaShade}" stroke-width="1" transform="rotate(8 45 47)"/>
    ${slice(53, 46, 6, C.tomato, C.tomatoHi, 0.42)}
    ${slice(64, 56, 5.4, C.cucumberDk, C.cucumberPale, 0.66)}
    ${slice(58, 62, 4.8, C.cucumberDk, C.cucumberPale, 0.66)}
    <ellipse cx="34" cy="53" rx="3.6" ry="2.7" fill="${C.olive}"/>`,

  /* Tall glass: smoothie / recovery milk */
  glass: () => `
    <ellipse cx="48" cy="86" rx="22" ry="4.6" fill="${C.shadow}"/>
    <path d="M30 14h36l-4.4 66a5.4 5.4 0 0 1-5.4 5H39.8a5.4 5.4 0 0 1-5.4-5z" fill="${C.glass}" stroke="${C.glassEdge}" stroke-width="1.6"/>
    <path d="M32.6 30h30.8l-3.4 50a4.2 4.2 0 0 1-4.2 3.9H40.2a4.2 4.2 0 0 1-4.2-3.9z" fill="${C.smoothie}"/>
    <path d="M32.6 30h30.8l-.9 12c-6 4-10-3-15.5 0s-9.5-1-14.5 0z" fill="${C.smoothieHi}"/>
    <path d="M36 44l-2.4 34" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
    <rect x="58" y="4" width="4.6" height="52" rx="2.3" fill="${C.tomato}" transform="rotate(12 60 30)"/>
    <rect x="58" y="4" width="4.6" height="8" rx="2.3" fill="#fff" transform="rotate(12 60 30)"/>
    ${dots([[46, 56], [54, 62], [42, 68], [52, 72]], 1.4, C.strawberry, .5)}`,

  /* Whole-wheat pasta with tomato sauce, zucchini and cheese */
  pasta: () => `${plate()}
    <circle cx="48" cy="46" r="26" fill="${C.pasta}"/>
    ${[22, 17, 12, 7].map((r, i) => `<circle cx="${48 + (i % 2 ? 1.5 : -1.5)}" cy="${46 + (i % 2 ? -1 : 1)}" r="${r}" fill="none" stroke="${i % 2 ? C.pastaDk : '#F8E3A6'}" stroke-width="3.6"/>`).join('')}
    <path d="M32 40c6-6 16-8 24-2 6 5 7 12 2 16-8 5-20 3-25-3-3-3-3-8-1-11z" fill="${C.sauce}" opacity=".92"/>
    <path d="M36 42c4-3 10-4 14-1" stroke="${C.tomatoHi}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
    ${slice(60, 38, 4.6, C.zucchini, '#B9DD9B', 0.55)}${slice(38, 56, 4.4, C.zucchini, '#B9DD9B', 0.55)}${slice(58, 56, 4, C.pepperY, '#FFD968', 0.5)}
    ${dots([[47, 44], [53, 49], [43, 50], [50, 40], [56, 46]], 1.5, C.cheese)}
    ${dots([[44, 39], [62, 48]], 1.3, C.herb)}`,

  /* Greek salad: tomato, cucumber, onion, feta, olives */
  salad: () => `${plate()}
    <circle cx="48" cy="46" r="26" fill="#E9F1E0"/>
    ${[[34, 36], [46, 32], [60, 38], [38, 52], [56, 55]].map(([x, y], i) => `<path d="M${x} ${y - 6}a6 6 0 1 1-.1 0z" fill="${C.tomato}" transform="rotate(${i * 55} ${x} ${y})"/><path d="M${x} ${y - 3.6}a3.6 3.6 0 1 1-.1 0z" fill="${C.tomatoHi}" opacity=".55" transform="rotate(${i * 55} ${x} ${y})"/>`).join('')}
    ${slice(46, 46, 5.4, C.cucumberDk, C.cucumberPale, 0.66)}${slice(64, 50, 5, C.cucumberDk, C.cucumberPale, 0.66)}${slice(33, 47, 4.6, C.cucumberDk, C.cucumberPale, 0.66)}
    <path d="M52 62a6 6 0 0 1 10-2M40 30a6 6 0 0 1 9-3" fill="none" stroke="${C.onion}" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="47" y="52" width="11" height="10" rx="2.2" fill="${C.feta}" stroke="${C.fetaShade}" stroke-width="1" transform="rotate(-10 52 57)"/>
    <rect x="58" y="34" width="8" height="7" rx="2" fill="${C.feta}" stroke="${C.fetaShade}" stroke-width="1" transform="rotate(12 62 37)"/>
    ${dots([[40, 43], [58, 46], [42, 60], [68, 42]], 2.6, C.olive)}${dots([[39, 42], [57, 45]], .9, C.oliveHi)}
    ${dots([[50, 40], [36, 43], [55, 62], [66, 56]], 1, C.leafDk)}`,

  /* Souvlaki wrap in pita with a skewer */
  wrap: () => `${plate()}
    <path d="M18 56c0-18 14-30 30-30s30 12 30 30c0 4-3 6-6 6H24c-3 0-6-2-6-6z" fill="${C.pitaDk}"/>
    <path d="M22 54c0-15 11-25 26-25s26 10 26 25c0 2-2 3-4 3H26c-2 0-4-1-4-3z" fill="${C.pita}"/>
    <path d="M26 46c6-9 16-13 26-11 6 1 11 4 15 8-8-3-16-3-24 0-6 2-12 5-17 3z" fill="#F8E2B6" opacity=".7"/>
    ${[[32, 42, -20], [44, 38, 5], [56, 40, 20]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="5" fill="${C.meat}" transform="rotate(${a} ${x} ${y})"/><ellipse cx="${x - 1.5}" cy="${y - 1.5}" rx="4.6" ry="2" fill="${C.meatHi}" transform="rotate(${a} ${x} ${y})"/>`).join('')}
    ${slice(38, 52, 4.6, C.tomato, C.tomatoHi, .4)}${slice(52, 52, 4.4, C.tomato, C.tomatoHi, .4)}
    <path d="M44 46c4-3 9-2 12 1" stroke="${C.onion}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M27 50c4 3 9 4 14 3M55 53c5 1 10 0 14-3" stroke="${C.yogurt}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <rect x="12" y="66" width="72" height="2.8" rx="1.4" fill="${C.steelDk}" transform="rotate(-8 48 67)"/>`,

  /* Oven-baked burger patties with potato wedges */
  meatball: () => `${plate()}
    ${[[36, 38], [56, 36], [46, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10.6" fill="${C.meat}"/><circle cx="${x - 2.4}" cy="${y - 2.6}" r="6.4" fill="${C.meatHi}"/><path d="M${x - 6} ${y + 1}h12M${x - 5} ${y - 3}h10" stroke="#5B2E16" stroke-width="1.2" opacity=".45"/>`).join('')}
    ${[[66, 56, 30], [24, 56, -25], [70, 44, 60]].map(([x, y, a]) => `<rect x="${x - 7}" y="${y - 3.4}" width="14" height="6.8" rx="3.2" fill="${C.potato}" transform="rotate(${a} ${x} ${y})"/><rect x="${x - 5}" y="${y - 1.8}" width="8" height="2" rx="1" fill="${C.potatoDk}" opacity=".55" transform="rotate(${a} ${x} ${y})"/>`).join('')}
    ${dots([[64, 30], [30, 30], [44, 66]], 2, C.herb)}`,

  /* Spinach rice with feta and lemon */
  rice: () => `${plate()}
    <circle cx="48" cy="46" r="26" fill="${C.riceShade}"/>
    ${[[34, 38], [42, 34], [52, 32], [60, 37], [64, 46], [58, 56], [48, 60], [38, 57], [32, 48], [46, 44], [54, 47], [43, 50], [56, 40], [40, 42]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="2" fill="${C.rice}" transform="rotate(${i * 47} ${x} ${y})"/>`).join('')}
    ${[[40, 40], [52, 38], [58, 50], [44, 54], [36, 50], [50, 46]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.2" fill="${i % 2 ? C.spinach : C.spinachHi}" transform="rotate(${i * 60} ${x} ${y})"/>`).join('')}
    <rect x="53" y="52" width="9" height="8" rx="2" fill="${C.feta}" stroke="${C.fetaShade}" stroke-width="1" transform="rotate(14 57 56)"/>
    <path d="M62 64c6 0 10 3 11 8-6 1-11-2-11-8z" fill="${C.lemon}"/><path d="M64 65c4 0 6 1 8 4" stroke="${C.lemonPale}" stroke-width="1.3" fill="none"/>`,

  /* Fruit bowl */
  fruit: () => `${plate()}
    <circle cx="48" cy="46" r="26" fill="#FBF3E1"/>
    ${slice(38, 38, 9.4, C.orange, C.orangePale, 0.72)}<path d="M38 29v18M29 38h18M31 31l14 14M45 31L31 45" stroke="${C.orange}" stroke-width="1" opacity=".55"/>
    ${slice(58, 40, 8.4, C.apple, C.applePale, 0.72)}<circle cx="58" cy="40" r="1.4" fill="${C.walnutDk}"/>
    ${slice(46, 56, 8.6, C.kiwi, C.kiwiPale, 0.6)}${dots([[46, 50], [50, 54], [46, 60], [42, 54]], 1, '#26310F')}
    ${dots([[64, 56], [68, 51], [62, 61], [70, 58], [66, 64]], 3.2, C.grape)}${dots([[63.4, 55], [67.4, 50], [61.4, 60]], 1, '#B08CCF')}
    <path d="M30 56c3-3 8-2 8 2 0 4-6 6-9 2-1-1-1-3 1-4z" fill="${C.strawberry}"/><path d="M32 54l2-2 2 2z" fill="${C.leafDk}"/>`,

  /* Gemista: stuffed tomatoes and peppers in a dish */
  stuffed: () => `
    <ellipse cx="48" cy="80" rx="32" ry="5" fill="${C.shadow}"/>
    <rect x="8" y="14" width="80" height="64" rx="12" fill="${C.dish}"/><rect x="9" y="15" width="78" height="62" rx="11" fill="none" stroke="${C.dishRim}" stroke-width="1.5"/>
    <rect x="15" y="21" width="66" height="50" rx="8" fill="#F8F3E6"/>
    ${[[32, 38, 14, C.tomato, C.tomatoDk], [64, 36, 12.5, C.pepperR, '#B22E2E'], [34, 62, 11, C.pepperY, '#CE9820'], [62, 62, 12.6, C.tomato, C.tomatoDk]].map(([x, y, r, f, d]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${d}"/><circle cx="${x}" cy="${y}" r="${r - 1.6}" fill="${f}"/><circle cx="${x - r * .28}" cy="${y - r * .3}" r="${r * .4}" fill="#fff" opacity=".28"/><circle cx="${x}" cy="${y}" r="${r * .5}" fill="${C.riceShade}"/>${dots([[x - 2, y - 1], [x + 2, y + 1.5], [x, y - 3]], 1.2, C.rice)}${dots([[x + 1, y - 1]], 1, C.spinach)}`).join('')}
    ${dots([[48, 48], [20, 46], [78, 48], [48, 26], [48, 70]], 2, C.herb)}`,

  /* Dakos: barley rusk with grated tomato, feta, olives, oregano */
  dakos: () => `${plate()}
    <circle cx="48" cy="46" r="27" fill="${C.rusk}"/><circle cx="48" cy="46" r="27" fill="none" stroke="#9C6A2F" stroke-width="1.6" opacity=".5"/>
    <circle cx="48" cy="46" r="23" fill="${C.ruskHi}"/>
    <circle cx="48" cy="46" r="20" fill="${C.tomato}"/>
    ${dots([[38, 40], [50, 34], [58, 42], [44, 52], [56, 54], [37, 52], [48, 44]], 4.2, C.tomatoDk, .55)}
    ${dots([[44, 38], [54, 48], [40, 48]], 3, C.tomatoHi, .55)}
    ${[[40, 42, -10], [52, 40, 15], [46, 53, 5], [58, 52, -12]].map(([x, y, a]) => `<rect x="${x - 4.4}" y="${y - 3.8}" width="8.8" height="7.6" rx="2" fill="${C.feta}" stroke="${C.fetaShade}" stroke-width="1" transform="rotate(${a} ${x} ${y})"/>`).join('')}
    ${dots([[36, 50], [60, 44], [48, 36], [52, 58]], 2.8, C.olive)}${dots([[35.2, 49.2], [59.2, 43.2]], .9, C.oliveHi)}
    ${dots([[44, 46], [54, 44], [48, 56], [38, 44], [60, 54], [50, 48]], 1, C.leafDk)}`,

  /* Trahana: creamy soup with feta cubes */
  trahana: () => `${plate()}
    <circle cx="48" cy="46" r="26" fill="${C.cream}"/>
    <circle cx="48" cy="46" r="26" fill="none" stroke="${C.creamDk}" stroke-width="2"/>
    ${dots([[36, 40], [44, 34], [55, 36], [61, 44], [58, 54], [46, 58], [36, 53], [48, 46], [52, 50]], 2.4, C.creamDk, .8)}
    <path d="M32 46c6-8 16-9 22-3s2 12-4 13-14 1-18-10z" fill="${C.tomato}" opacity=".55"/>
    ${[[40, 42, -10], [54, 40, 15], [48, 54, 8], [58, 52, -14]].map(([x, y, a]) => `<rect x="${x - 4.2}" y="${y - 3.6}" width="8.4" height="7.2" rx="2" fill="${C.feta}" stroke="${C.fetaShade}" stroke-width="1" transform="rotate(${a} ${x} ${y})"/>`).join('')}
    ${dots([[46, 46], [60, 46], [36, 50], [50, 36]], 1.3, C.herb)}`
};

/** Every motif key, for tests. */
export const MOTIF_KEYS = Object.keys(MOTIFS);

/**
 * The illustration as an inline SVG string. `size` is the rendered edge in px;
 * the drawing itself is resolution-independent.
 */
export function illustration(motif = 'yogurt', size = 64, className = '') {
  const draw = MOTIFS[motif] || MOTIFS.yogurt;
  const cls = String(className || '').trim();
  return `<svg class="art${cls ? ` ${cls}` : ''}" width="${size}" height="${size}" viewBox="0 0 96 96" fill="none" aria-hidden="true" focusable="false">${draw()}</svg>`;
}
