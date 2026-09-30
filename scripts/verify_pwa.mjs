#!/usr/bin/env node
/**
 * ZENITH PRO · PWA integrity check
 * ---------------------------------------------------------------------------
 * A service worker that precaches a file that does not exist, or forgets one the
 * app imports, only fails in the field — offline, on somebody's phone. This makes
 * those mistakes fail in CI instead:
 *
 *   • every file in sw.js CORE exists, with no duplicates;
 *   • every module reachable from src/app.js, every stylesheet, every font, and
 *     every local file index.html references is precached;
 *   • package.json, APP.version and the cache name agree on the major version;
 *   • the manifest is complete, its icons exist and are the size they claim, and
 *     one of them is maskable;
 *   • the social-card image the page advertises exists at the size it advertises;
 *   • the Content-Security-Policy is present and does not allow inline script.
 *
 * Run: node scripts/verify_pwa.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const problems = [];
const fail = message => problems.push(message);
const pngSize = p => { const b = fs.readFileSync(path.join(root, p)); return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`; };

/* ── 1 · the precache list ─────────────────────────────────────────────── */
const sw = read('sw.js');
const cacheName = /const CACHE = '([^']+)'/.exec(sw)?.[1];
const core = [...(/const CORE = \[([\s\S]*?)\];/.exec(sw)?.[1] ?? '').matchAll(/'([^']+)'/g)].map(m => m[1]);
if (!cacheName) fail('sw.js: no CACHE constant');
if (!core.length) fail('sw.js: no CORE list');
if (new Set(core).size !== core.length) fail('sw.js CORE has duplicate entries');
const precached = new Set(core.map(c => (c === './' ? './index.html' : c)));
for (const c of core) if (c !== './' && !exists(c.replace(/^\.\//, ''))) fail(`sw.js precaches ${c}, which does not exist`);
if (!/req\.mode === 'navigate'/.test(sw) || !/caches\.open\(CACHE\)/.test(sw)) fail('sw.js: navigation must be network-first with a cache fallback');

/* ── 2 · versions agree ────────────────────────────────────────────────── */
const pkg = JSON.parse(read('package.json'));
const appVersion = /version:\s*'(\d+\.\d+\.\d+)'/.exec(read('src/data.js'))?.[1];
if (pkg.version !== appVersion) fail(`package.json ${pkg.version} ≠ APP.version ${appVersion}`);
const major = String(pkg.version).split('.')[0];
if (!new RegExp(`^zenith-v${major}-\\d{4}-\\d{2}-\\d{2}-\\d+$`).test(cacheName ?? '')) fail(`CACHE «${cacheName}» should look like zenith-v${major}-YYYY-MM-DD-N`);

/* ── 3 · every module the app can import is precached ──────────────────── */
const modules = new Set();
const walk = file => {
  if (modules.has(file)) return;
  modules.add(file);
  for (const m of read(file).matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), m[1]));
    if (!exists(target)) fail(`${file} imports ${m[1]}, which does not exist`);
    else walk(target);
  }
};
walk('src/app.js');
for (const f of modules) if (!precached.has(`./${f}`)) fail(`${f} is imported by the app but not precached — it would be missing offline`);

/* ── 4 · everything index.html loads, and every stylesheet's fonts ─────── */
const html = read('index.html');
for (const [, url] of html.matchAll(/(?:href|src)="([^"#?]+)"/g)) {
  if (/^(https?:|data:|mailto:)/.test(url)) continue;
  if (!exists(url)) fail(`index.html references ${url}, which does not exist`);
  else if (!precached.has(`./${path.posix.normalize(url)}`)) fail(`index.html loads ${url}, which is not precached`);
}
const sheets = fs.readdirSync(path.join(root, 'styles')).filter(f => f.endsWith('.css'));
for (const css of sheets) {
  if (!precached.has(`./styles/${css}`)) fail(`styles/${css} exists but is not precached`);
  for (const [, url] of read(`styles/${css}`).matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    if (/^(data:|https?:|#)/.test(url)) continue;
    const target = path.posix.normalize(path.posix.join('styles', url));
    if (!exists(target)) fail(`styles/${css} uses ${url}, which does not exist`);
    else if (!precached.has(`./${target}`)) fail(`styles/${css} uses ${target}, which is not precached`);
  }
}

/* ── 5 · the manifest ──────────────────────────────────────────────────── */
const manifest = JSON.parse(read('manifest.webmanifest'));
for (const key of ['name', 'short_name', 'start_url', 'scope', 'display', 'theme_color', 'background_color', 'lang', 'icons']) {
  if (!manifest[key]) fail(`manifest is missing "${key}"`);
}
const declared = [...(manifest.icons ?? []), ...(manifest.screenshots ?? []), ...(manifest.shortcuts ?? []).flatMap(s => s.icons ?? [])];
for (const icon of declared) {
  if (!exists(icon.src)) { fail(`manifest references ${icon.src}, which does not exist`); continue; }
  if (/\.png$/.test(icon.src) && icon.sizes && icon.sizes !== 'any' && pngSize(icon.src) !== icon.sizes) {
    fail(`manifest says ${icon.src} is ${icon.sizes}, but the file is ${pngSize(icon.src)}`);
  }
}
if (!(manifest.icons ?? []).some(i => String(i.purpose).includes('maskable'))) fail('manifest has no maskable icon');
for (const s of manifest.shortcuts ?? []) {
  const view = new URL(s.url, 'https://example.test/').searchParams.get('view');
  if (view && !new RegExp(`['"]${view}['"]`).test(read('src/app.js'))) fail(`manifest shortcut «${s.name}» opens ?view=${view}, which the app does not know`);
}

/* ── 6 · the social card ───────────────────────────────────────────────── */
const og = /property="og:image" content="([^"]+)"/.exec(html)?.[1];
const ogLocal = og && og.replace(/^https:\/\/[^/]+\/family-nutrition-os\//, '');
if (!og) fail('index.html has no og:image');
else if (!exists(ogLocal)) fail(`og:image points to ${og}, but ${ogLocal} is not in the repository`);
else if (pngSize(ogLocal) !== '1200x630') fail(`${ogLocal} is ${pngSize(ogLocal)}; index.html advertises 1200x630`);

/* ── 7 · the Content-Security-Policy ───────────────────────────────────── */
const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1] ?? '';
if (!csp) fail('index.html has no Content-Security-Policy');
const scriptSrc = /script-src([^;]*)/.exec(csp)?.[1] ?? '';
if (/unsafe-inline|unsafe-eval|https?:/.test(scriptSrc)) fail(`script-src is too permissive: «${scriptSrc.trim()}»`);
if (/<script(?![^>]*\bsrc=)[^>]*>[^<]/.test(html)) fail('index.html contains inline script, which the policy forbids');

if (problems.length) {
  console.log(`PWA INTEGRITY: FAIL\n${problems.map(p => `  ✗ ${p}`).join('\n')}`);
  process.exit(1);
}
console.log(`PWA integrity: PASS — ${core.length} precached files, ${modules.size} modules, ${sheets.length} stylesheets, ${declared.length} manifest images, cache ${cacheName}`);
