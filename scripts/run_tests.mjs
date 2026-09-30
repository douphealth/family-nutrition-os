#!/usr/bin/env node
/**
 * ZENITH PRO · test runner
 * ---------------------------------------------------------------------------
 *   node scripts/run_tests.mjs           run every tests/*.test.mjs, one process each
 *   node scripts/run_tests.mjs --check   syntax-check every module, script and test
 *
 * A suite passes when its process exits 0; a failing suite's full output is
 * printed. New test files are picked up automatically — nothing to register.
 */

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const list = (dir, re) => readdirSync(path.join(root, dir)).filter(f => re.test(f)).sort().map(f => path.join(dir, f));

const check = process.argv.includes('--check');
const files = check
  ? [...list('src', /\.js$/), 'sw.js', ...list('scripts', /\.mjs$/), ...list('tests', /\.mjs$/)]
  : list('tests', /\.test\.mjs$/);

let failed = 0;
const started = Date.now();
for (const file of files) {
  const t0 = Date.now();
  const run = spawnSync(process.execPath, check ? ['--check', file] : [file], { cwd: root, encoding: 'utf8', env: process.env });
  const ok = run.status === 0;
  if (!ok) failed++;
  if (check) {
    if (!ok) console.log(`  FAIL ${file}\n${run.stderr}`);
    continue;
  }
  const last = (run.stdout || '').trim().split('\n').filter(Boolean).pop() || '';
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${file.padEnd(38)} ${String(Date.now() - t0).padStart(5)} ms  ${last}`);
  if (!ok) console.log(run.stdout, run.stderr);
}

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\n${check ? 'syntax check' : 'tests'}: ${failed ? `FAIL (${failed} of ${files.length})` : `PASS (${files.length} files, ${seconds} s)`}`);
process.exit(failed ? 1 : 0);
