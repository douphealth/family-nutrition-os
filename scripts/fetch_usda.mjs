#!/usr/bin/env node
/**
 * ZENITH PRO · USDA FoodData Central snapshot
 * ---------------------------------------------------------------------------
 * Every entry in src/foods.js that carries an `fdc` id is asserted, by
 * tests/food-provenance.test.mjs, to equal the record in data/usda-fdc.json.
 * This script is how that file is (re)generated, so the numbers in the app can
 * be traced to — and refreshed from — the source, and cannot drift from it
 * unnoticed.
 *
 *   node scripts/fetch_usda.mjs                 official API, batches of 20 (1–2 requests)
 *   node scripts/fetch_usda.mjs --portal        the public FDC website record, one request per food
 *   USDA_API_KEY=… node scripts/fetch_usda.mjs  a personal key instead of the rate-limited DEMO_KEY
 *
 * Nutrient numbers: 203 protein · 204 fat · 205 carbohydrate · 208 energy (kcal)
 *                   291 fibre · 307 sodium · 303 iron · 301 calcium — all per 100 g.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { FOODS } = await import(pathToFileURL(path.join(root, 'src/foods.js')).href);

const KEYS = { 203: 'p', 204: 'f', 205: 'c', 208: 'kcal', 291: 'fib', 307: 'na', 303: 'fe', 301: 'ca' };
const usePortal = process.argv.includes('--portal');
const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
const ids = [...new Set(Object.values(FOODS).map(f => f.fdc).filter(Boolean))];
const sleep = ms => new Promise(r => setTimeout(r, ms));

function pick(nutrients) {
  const per100 = { p: null, c: null, f: null, kcal: null, fib: null, na: null, fe: null, ca: null };
  for (const n of nutrients || []) {
    const number = String(n.nutrient?.number ?? n.number ?? n.nutrientNumber);
    const key = KEYS[number];
    if (!key) continue;
    // The API reports `amount` for foods and `value` on search rows; the portal uses `value`.
    const v = n.amount ?? n.value;
    if (v != null) per100[key] = v;
  }
  return per100;
}

const foods = {};

if (usePortal) {
  for (const id of ids) {
    const res = await fetch(`https://fdc.nal.usda.gov/portal-data/external/${id}`, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`portal ${id}: HTTP ${res.status}`);
    const j = await res.json();
    foods[id] = { description: j.description, ndb: j.ndbNumber != null ? String(j.ndbNumber) : null, per100: pick(j.foodNutrients) };
    process.stdout.write(`  ${id}  ${j.description}\n`);
    await sleep(250);
  }
} else {
  for (let i = 0; i < ids.length; i += 20) {
    const batch = ids.slice(i, i + 20);
    const nutrients = Object.keys(KEYS).map(n => `nutrients=${n}`).join('&');
    const url = `https://api.nal.usda.gov/fdc/v1/foods?fdcIds=${batch.join(',')}&format=abridged&${nutrients}&api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API: HTTP ${res.status} — ${await res.text()}\n(Use --portal, or set USDA_API_KEY.)`);
    for (const f of await res.json()) {
      foods[f.fdcId] = { description: f.description, ndb: f.ndbNumber != null ? String(f.ndbNumber) : null, per100: pick(f.foodNutrients) };
      process.stdout.write(`  ${f.fdcId}  ${f.description}\n`);
    }
  }
}

const missing = ids.filter(id => !foods[id]);
if (missing.length) throw new Error(`no record returned for: ${missing.join(', ')}`);

const out = {
  source: 'USDA FoodData Central — SR Legacy (https://fdc.nal.usda.gov/)',
  retrieved: new Date().toISOString().slice(0, 10),
  via: usePortal ? 'fdc.nal.usda.gov/portal-data' : 'api.nal.usda.gov/fdc/v1/foods',
  units: 'per 100 g edible portion; p/c/f/fib in g, kcal in kcal, na/fe/ca in mg',
  foods: Object.fromEntries(Object.entries(foods).sort(([a], [b]) => Number(a) - Number(b)))
};
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data/usda-fdc.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`\nWrote data/usda-fdc.json (${ids.length} foods, ${out.via}, ${out.retrieved})`);
