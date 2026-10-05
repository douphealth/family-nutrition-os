/**
 * ZENITH PRO · UI toolkit
 * ---------------------------------------------------------------------------
 * Rendering primitives: escaping, icons, progress rings, meters, charts, sheets,
 * toasts. Everything returns HTML strings so views stay declarative, except the
 * few things that genuinely need DOM events (toasts, sheets).
 *
 * Design rules that live here:
 *   • no SVG <defs>/id references — an id-referenced gradient breaks when its first
 *     copy sits inside a `display:none` container (a closed sheet). Charts and art
 *     use flat fills and CSS custom properties instead;
 *   • every number goes through `num`/`num1` so Greek grouping and decimal commas
 *     are applied in exactly one place.
 */

import { dateFromKey, weekdayIndex } from './dates.js?v=15.0.0';

/* ── Escaping & DOM ────────────────────────────────────────────────────── */

export const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]
));

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const byId = id => document.getElementById(id);

/* ── Dates & numbers ───────────────────────────────────────────────────── */

// Calendar maths lives in dates.js (pure, timezone-tested). Re-exported here so
// views and the app shell keep a single import site for presentation helpers.
export {
  localDateKey, dateFromKey, addDays, mondayOf, weekdayIndex, dayNumber,
  cycleDayIndex, cycleWeek
} from './dates.js?v=15.0.0';

export const GREEK_DAYS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
export const GREEK_DAYS_SHORT = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
export const GREEK_MONTHS = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];

export function longDate(key) {
  const d = dateFromKey(key);
  return `${GREEK_DAYS[weekdayIndex(d)]}, ${d.getDate()} ${GREEK_MONTHS[d.getMonth()]}`;
}
export function shortDate(key) {
  const d = dateFromKey(key);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
export function dayName(key) { return GREEK_DAYS[weekdayIndex(dateFromKey(key))]; }

/** Time-of-day greeting. Greek uses «Καλημέρα» until early afternoon, «Καλησπέρα» after. */
export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 13) return 'Καλημέρα';
  if (h >= 13 && h < 21) return 'Καλησπέρα';
  return 'Καλό βράδυ';
}

export function timeNow(d = new Date()) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const nf0 = new Intl.NumberFormat('el-GR');
const nf1 = new Intl.NumberFormat('el-GR', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('el-GR', { maximumFractionDigits: 2 });
export const num = n => nf0.format(Math.round(Number(n) || 0));
export const num1 = n => nf1.format(Number(n) || 0);
export const num2 = n => nf2.format(Number(n) || 0);
export const pct = n => `${Math.round((Number(n) || 0) * 100)}%`;

export function mlToText(ml) {
  const v = Number(ml) || 0;
  return v >= 1000 ? `${num1(v / 1000)} L` : `${num(v)} ml`;
}

export function bytesToText(b) {
  if (b == null) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0, v = Number(b);
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${num1(v)} ${units[i]}`;
}

/* ── Kitchen quantities ────────────────────────────────────────────────────
 * Weighing 187.4 g of rice is not a thing a person does. Household amounts are
 * rounded to the steps a kitchen scale and a measuring jug actually show, and
 * pieces to quarters with the vulgar fractions Greek recipes use (½ egg, 1¼).
 */
const roundTo = (v, step) => Math.round(v / step) * step;
const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

/** A weight or volume rounded to a kitchen-scale step, as text. */
export function kitchenAmount(value, unit) {
  const v = Number(value) || 0;
  if (unit === 'τεμ') {
    const q = Math.max(0.25, roundTo(v, 0.25));
    const whole = Math.floor(q + 1e-9);
    const frac = FRACTIONS[Math.round((q - whole) * 100) / 100] || '';
    return `${whole || ''}${frac} τεμ`.trim();
  }
  const r = v < 20 ? roundTo(v, 1) : v < 100 ? roundTo(v, 5) : v < 1000 ? roundTo(v, 10) : roundTo(v, 50);
  if (r >= 1000) return `${num2(r / 1000)} ${unit === 'ml' ? 'L' : 'kg'}`;
  return `${num(r)} ${unit}`;
}

/** An already-rounded shopping quantity as text: 2250 g → «2,25 kg», 6 → «6 τεμ». */
export function shopAmount(qty, unit) {
  const v = Number(qty) || 0;
  if (unit === 'τεμ') return `${num(v)} τεμ`;
  if (v >= 1000) return `${num2(v / 1000)} ${unit === 'ml' ? 'L' : 'kg'}`;
  return `${num(v)} ${unit}`;
}

/* ── Icons ─────────────────────────────────────────────────────────────── */

const PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>',
  scale: '<path d="M6.5 8h11l1.4 11.1A2 2 0 0 1 16.9 21.3H7.1a2 2 0 0 1-2-2.2L6.5 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  alert: '<path d="m10.29 3.86-8.47 14.14A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  printer: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/>',
  sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="m19 15 .7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7L19 15z"/>',
  command: '<path d="M15 6a3 3 0 1 1 3 3h-3V6zM9 6a3 3 0 1 0-3 3h3V6zM15 18a3 3 0 1 0 3-3h-3v3zM9 18a3 3 0 1 1-3-3h3v3zM9 9h6v6H9z"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  arrowUpRight: '<path d="M7 17 17 7M9 7h8v8"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
  more: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="19" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-4"/>',
  trend: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  utensils: '<path d="M7 2v20M4 2v6a3 3 0 0 0 6 0V2"/><path d="M17 2c1.5 1.5 2.5 3.5 2.5 6S18.5 12 17 12v10"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  wheat: '<path d="M12 22V9"/><path d="M12 9c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4zM12 9c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 15c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4zM12 15c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 21c-2.2 0-3.5-1.3-3.5-3.5C10.7 17.5 12 18.8 12 21zM12 21c2.2 0 3.5-1.3 3.5-3.5-2.2 0-3.5 1.3-3.5 3.5z"/>',
  bone: '<path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/>',
  shaker: '<path d="M8 3h8l1 5H7z"/><path d="M7 8h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/><path d="M10 12h.01M14 12h.01M12 15h.01M10 18h.01M14 18h.01"/>',
  drumstick: '<path d="M15.4 15.63a7.88 7.88 0 0 0 6.23-6.23 3.5 3.5 0 0 0-6.23-2.63 3.5 3.5 0 0 0-2.63-6.23 7.88 7.88 0 0 0-6.23 6.23 3.5 3.5 0 0 0 2.63 6.23 3.5 3.5 0 0 0 6.23 2.63z"/><path d="M11 11 2.5 19.5"/>',
  milk: '<path d="M8 2h8M9 2v2.8a4 4 0 0 1-.67 2.2L7 9v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9l-1.33-2A4 4 0 0 1 15 4.8V2"/><path d="M7 13h10"/>',
  jar: '<path d="M6 3h12v4H6z"/><path d="M7 7h10v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/><path d="M10 11h4"/>',
  bread: '<path d="M4 9a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4 3 3 0 0 1-2 2.83V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7.17A3 3 0 0 1 4 9z"/><path d="M9 13v3M15 13v3"/>',
  snowflake: '<path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5 4.2 17.5"/>',
  bed: '<path d="M2 4v16M2 9h16a4 4 0 0 1 4 4v7M2 17h20"/><path d="M6 9V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  undo: '<path d="M3 7v6h6"/><path d="M3.51 13a9 9 0 1 0 2.13-9.36L3 7"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  history: '<path d="M3 3v6h6"/><path d="M3.5 9a9 9 0 1 0 2-5.7L3 9"/><path d="M12 7v5l4 2"/>',
  package: '<path d="m21 8-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v9"/>',
  swap: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  wifiOff: '<path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 3.5-2.3M1.4 9.5a15 15 0 0 1 4.6-2.9M22.6 9.5a15 15 0 0 0-6.7-3.4M19 12.9a10 10 0 0 0-2.4-1.9"/><path d="M12 20h.01"/>'
};

export function icon(name, size = 18, extraClass = '') {
  const d = PATHS[name] || PATHS.info;
  return `<svg class="ic icon-${name} ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}

/** The brand mark: a sun over a peak — the zenith — on the brand colour. */
export function logo(size = 34) {
  return `<svg class="logo-mark" width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
    <rect x="1" y="1" width="46" height="46" rx="14" fill="var(--brand)"/>
    <path d="M1 17C1 8 8 1 17 1h14c9 0 16 7 16 16-12-6-33-6-46 0z" fill="#fff" opacity=".16"/>
    <circle cx="24" cy="15.5" r="4.2" fill="var(--brand-ink)"/>
    <path d="M11.5 36 24 23l12.5 13" stroke="var(--brand-ink)" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/** Icon for the three-way theme control (auto follows the device). */
export const themeIcon = pref => (pref === 'light' ? 'sun' : pref === 'dark' ? 'moon' : 'monitor');

/* ── Avatar ────────────────────────────────────────────────────────────── */

const MAX_INITIALS = 3;
let memberInitials = new Map();

const foldMemberText = value => String(value || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .trim()
  .toUpperCase();

function uniquePrefixLen(name, profiles) {
  for (let n = 2; n <= MAX_INITIALS; n++) {
    const prefix = foldMemberText(name).slice(0, n);
    if (profiles.filter(p => foldMemberText(p?.name).slice(0, n) === prefix).length === 1) return n;
  }
  return null;
}

/** Register the active household so avatar labels remain distinct without relying on colour. */
export function registerMembers(profiles = []) {
  const list = Array.isArray(profiles) ? profiles.filter(Boolean) : [];
  memberInitials = new Map();

  for (const member of list) {
    const foldedName = foldMemberText(member.name) || '?';
    const prefix2 = foldedName.slice(0, 2);
    const clashes = list.filter(p => foldMemberText(p?.name).slice(0, 2) === prefix2).length > 1;

    let label = prefix2;
    if (clashes) {
      const uniqueLen = uniquePrefixLen(member.name, list);
      if (uniqueLen) label = foldedName.slice(0, uniqueLen);
      else {
        const relationInitial = foldMemberText(member.relation).slice(0, 1);
        label = foldedName.slice(0, 1) + (relationInitial || foldedName.slice(1, 2));
      }
    }
    memberInitials.set(member.id, label);
  }

  return Object.fromEntries(memberInitials);
}

export function avatar(profile, size = 40) {
  const initials = memberInitials.get(profile?.id)
    || foldMemberText(profile?.name || '?').slice(0, 2);
  return `<span class="avatar" style="--av:${esc(profile?.accent || 'var(--member)')};width:${size}px;height:${size}px;font-size:${Math.max(11, Math.round(size * 0.36))}px" aria-hidden="true">${esc(initials)}</span>`;
}

/* ── Recipe illustrations ──────────────────────────────────────────────── */

export { illustration } from './art.js?v=15.0.0';

/* ── Step timing ───────────────────────────────────────────────────────────
 * Pull timing cues out of a recipe step so Cook Mode can offer a real timer
 * instead of making someone re-read the sentence. Handles the prime sign the
 * recipe data uses ("~25′"), a plain apostrophe, and oven temperatures.
 */
export function parseStepTimers(text) {
  const s = String(text || '');
  const timers = [];
  const minuteRe = /(\d{1,3})\s*[′']/g;
  let match;
  while ((match = minuteRe.exec(s)) !== null) {
    const minutes = Number(match[1]);
    if (minutes > 0 && minutes <= 600) timers.push({ minutes, seconds: minutes * 60 });
  }
  const oven = s.match(/(\d{2,3})\s*°C/);
  return { timers, ovenC: oven ? Number(oven[1]) : null };
}

/** Seconds → "12:30" for the Cook Mode timer display. */
export function clockText(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/* ── Progress ring ─────────────────────────────────────────────────────── */

/**
 * `ghost` draws a second, lighter arc showing what the PLAN would provide, so
 * confirmed intake is always visually distinct from planned intake.
 */
export function ring({
  value = 0, max = 1, size = 190, stroke = 15, ghost = null,
  tone = 'accent', main = '', sub = '', caption = ''
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamp = v => Math.max(0, Math.min(1, max > 0 ? v / max : 0));
  const vFrac = clamp(value);
  const gFrac = ghost == null ? null : clamp(ghost);
  const mid = size / 2;

  return `<svg class="ring ring-${tone}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(caption || `${main} ${sub}`)}">
    <circle class="ring-track" cx="${mid}" cy="${mid}" r="${r}" stroke-width="${stroke}" fill="none"/>
    ${gFrac != null ? `<circle class="ring-ghost" cx="${mid}" cy="${mid}" r="${r}" stroke-width="${stroke}" fill="none"
      stroke-dasharray="${(c * gFrac).toFixed(2)} ${c.toFixed(2)}" stroke-linecap="round"
      transform="rotate(-90 ${mid} ${mid})"/>` : ''}
    <circle class="ring-value" cx="${mid}" cy="${mid}" r="${r}" stroke-width="${stroke}" fill="none"
      stroke-dasharray="${vFrac > 0 ? (c * vFrac).toFixed(2) : 0} ${c.toFixed(2)}" stroke-linecap="round"
      transform="rotate(-90 ${mid} ${mid})"/>
    ${main ? `<text class="ring-main" x="${mid}" y="${mid - (sub ? 4 : -6)}" text-anchor="middle" dominant-baseline="middle">${esc(main)}</text>` : ''}
    ${sub ? `<text class="ring-sub" x="${mid}" y="${mid + size * 0.13}" text-anchor="middle" dominant-baseline="middle">${esc(sub)}</text>` : ''}
  </svg>`;
}

/* ── Bars & meters ─────────────────────────────────────────────────────── */

export function macroBar({ label, value, target, unit = 'g', tone = 'accent', iconName = null, note = '' }) {
  const pctVal = target > 0 ? Math.min(1, value / target) : 0;
  return `<div class="mb tone-${tone}">
    <div class="mb-head">
      <span class="mb-label">${iconName ? icon(iconName, 15) : ''}${esc(label)}</span>
      <span class="mb-val"><b>${num(value)}</b><span class="mb-unit">/ ${num(target)} ${esc(unit)}</span></span>
    </div>
    <div class="mb-track" role="progressbar" aria-valuenow="${Math.round(pctVal * 100)}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(label)}">
      <div class="mb-fill" style="width:${(pctVal * 100).toFixed(1)}%"></div>
    </div>
    ${note ? `<div class="mb-note">${esc(note)}</div>` : ''}
  </div>`;
}

/**
 * A reference meter: how far a day's amount is towards an intake to reach
 * (`kind: 'goal'`) or how close it is to a ceiling to stay under (`kind: 'limit'`).
 * The two read differently on purpose — a full goal bar is good news, a full limit
 * bar is not — so the colour, the wording and the tick mark all follow `kind`.
 */
export function meter({ label, value, target, unit = '', kind = 'goal', tone = 'accent', iconName = null, valueText = null, targetText = null, note = '' }) {
  const ratio = target > 0 ? value / target : 0;
  const over = kind === 'limit' && ratio > 1;
  const width = Math.min(1, ratio);
  const state = kind === 'limit' ? (ratio > 1 ? 'over' : ratio > 0.8 ? 'near' : 'ok') : (ratio >= 1 ? 'met' : 'part');
  return `<div class="meter tone-${over ? 'warn' : tone} is-${kind} is-${state}">
    <div class="meter-head">
      <span class="meter-label">${iconName ? icon(iconName, 15) : ''}${esc(label)}</span>
      <span class="meter-val"><b>${esc(valueText ?? num1(value))}</b><span>${kind === 'limit' ? ' · όριο ' : ' / '}${esc(targetText ?? num1(target))} ${esc(unit)}</span></span>
    </div>
    <div class="meter-track" role="progressbar" aria-valuenow="${Math.round(Math.min(ratio, 1.5) * 100)}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(label)}">
      <i style="width:${(width * 100).toFixed(1)}%"></i>
    </div>
    ${note ? `<div class="meter-note">${esc(note)}</div>` : ''}
  </div>`;
}

/* ── Water glass ───────────────────────────────────────────────────────── */

export function glassIcon(filled) {
  return `<svg class="glass-ic${filled ? ' is-filled' : ''}" viewBox="0 0 32 40" width="26" height="32" aria-hidden="true" focusable="false">
    <path class="glass-body" d="M5 3h22l-2.6 32.2a3 3 0 0 1-3 2.8H10.6a3 3 0 0 1-3-2.8z"/>
    <path class="glass-water" d="M6.4 16h19.2l-1.7 19.2a3 3 0 0 1-3 2.8H11.1a3 3 0 0 1-3-2.8z"/>
    <path class="glass-shine" d="M9.5 7.5l1.2 22"/>
  </svg>`;
}

/* ── Charts ────────────────────────────────────────────────────────────── */

/** Line + area chart. `points` = [{x:label, y:number}] */
export function lineChart(points, { height = 170, tone = 'accent', unit = '', goalLow = null, goalHigh = null } = {}) {
  if (!points || points.length < 2) return '';
  const w = 600, h = height, pad = { t: 14, r: 14, b: 26, l: 40 };
  const ys = points.map(p => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (goalLow != null) lo = Math.min(lo, goalLow);
  if (goalHigh != null) hi = Math.max(hi, goalHigh);
  if (hi - lo < 1) { hi += 0.5; lo -= 0.5; }
  const span = hi - lo;
  lo -= span * 0.12; hi += span * 0.12;

  const xAt = i => pad.l + (i * (w - pad.l - pad.r)) / (points.length - 1);
  const yAt = v => pad.t + (1 - (v - lo) / (hi - lo)) * (h - pad.t - pad.b);

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)},${yAt(p.y).toFixed(1)}`).join(' ');
  const area = `${line} L${xAt(points.length - 1).toFixed(1)},${(h - pad.b).toFixed(1)} L${xAt(0).toFixed(1)},${(h - pad.b).toFixed(1)} Z`;

  const ticks = [hi, (hi + lo) / 2, lo];
  const goalBand = (goalLow != null && goalHigh != null)
    ? `<rect class="lc-goal" x="${pad.l}" y="${yAt(goalHigh).toFixed(1)}" width="${w - pad.l - pad.r}" height="${Math.max(1, yAt(goalLow) - yAt(goalHigh)).toFixed(1)}" rx="4"/>`
    : '';

  return `<svg class="lc tone-${tone}" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" role="img" aria-label="Γράφημα τάσης">
    ${goalBand}
    ${ticks.map(t => `<line class="lc-grid" x1="${pad.l}" y1="${yAt(t).toFixed(1)}" x2="${w - pad.r}" y2="${yAt(t).toFixed(1)}"/>
      <text class="lc-tick" x="${pad.l - 8}" y="${yAt(t).toFixed(1)}" text-anchor="end" dominant-baseline="middle">${num1(t)}</text>`).join('')}
    <path class="lc-area" d="${area}"/>
    <path class="lc-line" d="${line}"/>
    ${points.map((p, i) => `<circle class="lc-dot" cx="${xAt(i).toFixed(1)}" cy="${yAt(p.y).toFixed(1)}" r="4"><title>${esc(p.x)}: ${num1(p.y)} ${esc(unit)}</title></circle>`).join('')}
    ${points.map((p, i) => (i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2))
      ? `<text class="lc-xlabel" x="${xAt(i).toFixed(1)}" y="${h - 7}" text-anchor="middle">${esc(p.x)}</text>` : '').join('')}
  </svg>`;
}

/** 4×7 completion heatmap. `cells` = [{date, meals, skipped, logged}] */
export function heatmap(cells, { todayKey = '' } = {}) {
  const intensity = c => {
    if (!c.logged) return 0;
    return Math.max(1, Math.min(4, c.meals + (c.skipped ? 0.5 : 0)));
  };
  return `<div class="hm" role="group" aria-label="Ημερολόγιο καταγραφής 28 ημερών">
    ${GREEK_DAYS_SHORT.map(d => `<span class="hm-dow" aria-hidden="true">${d}</span>`).join('')}
    ${cells.map(c => {
      const lvl = intensity(c);
      const label = `${shortDate(c.date)}: ${c.meals} γεύματα${c.skipped ? `, ${c.skipped} παράλειψη` : ''}`;
      return `<button type="button" class="hm-cell hm-${Math.round(lvl)} ${c.date === todayKey ? 'is-today' : ''}"
        data-hm="${esc(c.date)}" title="${esc(label)}" aria-label="${esc(label)}">${lvl ? icon('check', 11) : ''}</button>`;
    }).join('')}
  </div>`;
}

/** Simple bar chart. `items` = [{label, value, tone}] */
export function barChart(items, { unit = '', max = null } = {}) {
  const top = max ?? Math.max(1, ...items.map(i => i.value));
  return `<div class="bc" role="img" aria-label="Ραβδόγραμμα">
    ${items.map(i => `<div class="bc-row">
      <span class="bc-label">${esc(i.label)}</span>
      <span class="bc-track"><span class="bc-fill tone-${i.tone || 'accent'}" style="width:${((i.value / top) * 100).toFixed(1)}%"></span></span>
      <span class="bc-val">${num(i.value)}${esc(unit)}</span>
    </div>`).join('')}
  </div>`;
}

/* ── Small building blocks ─────────────────────────────────────────────── */

export function stat({ label, value, unit = '', iconName = null, tone = 'accent', note = '' }) {
  return `<div class="stat">
    <div class="stat-top">${iconName ? `<span class="stat-ic tone-${tone}">${icon(iconName, 15)}</span>` : ''}<span class="stat-label">${esc(label)}</span></div>
    <div class="stat-val">${value}${unit ? `<small> ${esc(unit)}</small>` : ''}</div>
    ${note ? `<div class="stat-note">${esc(note)}</div>` : ''}
  </div>`;
}

export function pill(text, tone = 'neutral', iconName = null) {
  return `<span class="pill pill-${tone}">${iconName ? icon(iconName, 13) : ''}${esc(text)}</span>`;
}

/** A pill with a leading status dot — the visual language for meal states. */
export function pillDot(text, tone = 'accent') {
  return `<span class="pill pill-${tone} pill-dot"><i aria-hidden="true"></i>${esc(text)}</span>`;
}

/* ── Dashboard KPI card ───────────────────────────────────────────────────
 * A small icon chip, one big tabular number, a label and a single line of
 * context. Exactly one card per row may be `hero` — that is what makes it read
 * as the headline number rather than as one of four interchangeable tiles.
 */
export function kpi({
  label, value, unit = '', iconName = 'target', tone = 'accent',
  note = '', trend = null, hero = false, progress = null
}) {
  const trendIc = trend === 'up' ? 'arrowUp' : trend === 'down' ? 'arrowDown' : trend === 'flat' ? 'minus' : null;
  const pctv = progress == null ? null : Math.max(0, Math.min(1, Number(progress) || 0));
  const foot = [
    pctv == null ? '' : `<div class="kpi-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"
      aria-valuenow="${Math.round(pctv * 100)}" aria-label="${esc(label)}"><i style="width:${(pctv * 100).toFixed(1)}%"></i></div>`,
    note ? `<div class="kpi-note">${trendIc ? icon(trendIc, 12) : ''}<span>${esc(note)}</span></div>` : ''
  ].join('');
  return `<article class="kpi tone-${tone}${hero ? ' is-hero' : ''}">
    <div class="kpi-top"><span class="kpi-ic">${icon(iconName, 17)}</span></div>
    <div class="kpi-val">${value}${unit ? `<small>${esc(unit)}</small>` : ''}</div>
    <div class="kpi-label">${esc(label)}</div>
    ${foot ? `<div class="kpi-foot">${foot}</div>` : ''}
  </article>`;
}

export function sectionHead({ eyebrow = '', title = '', sub = '', action = '' }) {
  return `<div class="sec-head">
    <div>
      ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
      ${title ? `<h2>${esc(title)}</h2>` : ''}
      ${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}
    </div>
    ${action ? `<div class="sec-action">${action}</div>` : ''}
  </div>`;
}

export function emptyState({ iconName = 'info', title, body, action = '' }) {
  return `<div class="empty">
    <span class="empty-ic">${icon(iconName, 28)}</span>
    <h3>${esc(title)}</h3>
    <p>${esc(body)}</p>
    ${action}
  </div>`;
}

/* ── Toasts (with undo) ────────────────────────────────────────────────── */

let toastTimer = null;
export function toast(message, { actionLabel = '', onAction = null, tone = 'default', duration = 4200 } = {}) {
  const host = byId('toast');
  if (!host) return;
  host.innerHTML = `<div class="toast-card tone-${tone}">
    <span class="toast-msg">${esc(message)}</span>
    ${actionLabel ? `<button type="button" class="toast-action" id="toastAction">${esc(actionLabel)}</button>` : ''}
    <button type="button" class="toast-close" id="toastClose" aria-label="Κλείσιμο">${icon('x', 15)}</button>
  </div>`;
  host.classList.remove('hidden');
  host.setAttribute('aria-live', 'polite');

  const dismiss = () => { host.classList.add('hidden'); host.innerHTML = ''; };
  byId('toastClose')?.addEventListener('click', dismiss);
  if (actionLabel && onAction) {
    byId('toastAction')?.addEventListener('click', () => { dismiss(); onAction(); });
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(dismiss, duration);
}

/* ── Sheet / modal ─────────────────────────────────────────────────────── */

let lastFocused = null;
let sheetOnClose = null;

export function openSheet({ title, body, footer = '', size = 'md', onMount = null, onClose = null }) {
  const host = byId('sheet');
  if (!host) return;
  lastFocused = document.activeElement;
  sheetOnClose = typeof onClose === 'function' ? onClose : null;
  host.innerHTML = `<div class="sheet-backdrop" data-sheet-close></div>
    <div class="sheet-panel sheet-${size}" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
      <div class="sheet-head">
        <h2 id="sheetTitle">${esc(title)}</h2>
        <button type="button" class="icon-btn sm" data-sheet-close aria-label="Κλείσιμο">${icon('x', 18)}</button>
      </div>
      <div class="sheet-body">${body}</div>
      ${footer ? `<div class="sheet-foot">${footer}</div>` : ''}
    </div>`;
  host.classList.remove('hidden');
  document.body.classList.add('no-scroll');
  $$('[data-sheet-close]', host).forEach(n => n.addEventListener('click', closeSheet));
  const panel = $('.sheet-panel', host);
  // Sheet content lives outside #view, so view-level input binding never sees
  // it. onMount is how a caller wires up forms it just injected.
  if (typeof onMount === 'function') { try { onMount(panel); } catch (err) { console.error('[ZENITH] sheet onMount failed', err); } }
  panel?.querySelector('.sheet-body button, .sheet-body a, .sheet-body input, .sheet-body select, .sheet-body textarea, [data-sheet-close]')?.focus();
  host.onkeydown = e => {
    if (e.key === 'Escape') { e.stopPropagation(); closeSheet(); return; }
    if (e.key !== 'Tab' || !panel) return;
    const focusables = $$('button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])', panel)
      .filter(n => !n.disabled && n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
}

export function closeSheet() {
  const host = byId('sheet');
  if (!host) return;
  host.classList.add('hidden');
  host.innerHTML = '';
  host.onkeydown = null;
  document.body.classList.remove('no-scroll');
  lastFocused?.focus?.();
  // Fire the caller's cleanup AFTER the sheet is gone, so a callback that opens
  // another sheet is not immediately torn down by this one.
  const callback = sheetOnClose;
  sheetOnClose = null;
  if (callback) { try { callback(); } catch (err) { console.error('[ZENITH] sheet onClose failed', err); } }
}

export function isSheetOpen() {
  const host = byId('sheet');
  return host && !host.classList.contains('hidden');
}
