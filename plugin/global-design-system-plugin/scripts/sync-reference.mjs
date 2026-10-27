#!/usr/bin/env node
/**
 * Updates ONLY the Reference module from your Pixel-Perfect plugin repository.
 *   node scripts/sync-reference.mjs <path-to-your-plugin-root> [--build] [--dry]
 * Copies converter, types, variables, shared and the HTML/CSS/Tailwind generators into
 * reference-engine/vendor/pixel-perfect/ (tests, UI and code.ts are skipped), reports what changed,
 * checks that the functions the adapter needs still exist, updates ENGINE.json, and optionally rebuilds.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2], flags = new Set(process.argv.slice(3));
if (!src) { console.error('Usage: node scripts/sync-reference.mjs <path-to-your-plugin-root> [--build] [--dry]'); process.exit(1); }
const S = path.resolve(src), V = path.join(root, 'reference-engine', 'vendor', 'pixel-perfect');
for (const need of ['src/plugin/converter/index.ts', 'src/generator/html-generator.ts', 'src/shared/token-resolver.ts']) {
  if (!fs.existsSync(path.join(S, need))) { console.error('Not a Pixel-Perfect plugin root (missing ' + need + ')'); process.exit(1); }
}
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const picks = [];
for (const dir of ['src/plugin/converter', 'src/plugin/types', 'src/plugin/variables', 'src/shared']) for (const f of walk(path.join(S, dir))) if (/\.ts$/.test(f) && !/\.test\.ts$/.test(f)) picks.push(f);
for (const f of ['html-generator.ts', 'css-generator.ts', 'tailwind-generator.ts']) picks.push(path.join(S, 'src', 'generator', f));
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex');
const incoming = new Map(picks.map((f) => [path.relative(path.join(S, 'src'), f).split(path.sep).join('/'), fs.readFileSync(f)]));
const existing = new Map(fs.existsSync(V) ? walk(V).map((f) => [path.relative(V, f).split(path.sep).join('/'), fs.readFileSync(f)]) : []);
const added = [], changed = [], removed = [];
incoming.forEach((b, k) => { if (!existing.has(k)) added.push(k); else if (sha(existing.get(k)) !== sha(b)) changed.push(k); });
existing.forEach((_, k) => { if (!incoming.has(k)) removed.push(k); });
console.log('added:', added.length, '| changed:', changed.length, '| removed:', removed.length);
added.forEach((k) => console.log('  + ' + k)); changed.forEach((k) => console.log('  ~ ' + k)); removed.forEach((k) => console.log('  - ' + k));
// Contract check: the adapter needs these exports.
const need = [['plugin/converter/index.ts', 'convertNodeToIR'], ['generator/html-generator.ts', 'generateHtml'], ['generator/html-generator.ts', 'hasRtlInTree'], ['generator/css-generator.ts', 'generateCss'],
  ['plugin/converter/utils.ts', 'figmaColorToHex'], ['plugin/converter/utils.ts', 'figmaColorToRgba'], ['plugin/variables/variable-collector.ts', 'normalizeColorKey']];
const missing = need.filter(([f, fn]) => !new RegExp('export\\s+(async\\s+)?function\\s+' + fn + '\\b').test((incoming.get(f) || Buffer.from('')).toString('utf8')));
if (missing.length) { console.error('\nADAPTER NEEDS UPDATE: these exports are gone or moved:\n' + missing.map(([f, fn]) => '  ' + fn + ' (' + f + ')').join('\n') + '\nEdit reference-engine/adapter.ts, then re-run.'); process.exit(2); }
if (flags.has('--dry')) { console.log('dry run: nothing written'); process.exit(0); }
removed.forEach((k) => fs.rmSync(path.join(V, k)));
incoming.forEach((b, k) => { const t = path.join(V, k); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.writeFileSync(t, b); });
let ver = '0.0.0'; try { ver = JSON.parse(fs.readFileSync(path.join(S, 'package.json'), 'utf8')).version || ver; } catch { /* keep */ }
const metaPath = path.join(root, 'reference-engine', 'ENGINE.json'), meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
meta.version = ver; meta.syncedAt = new Date().toISOString(); meta.filesHash = sha([...incoming.entries()].sort().map(([k, b]) => k + sha(b)).join('')).slice(0, 12);
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
console.log('synced. engine version', meta.version, 'hash', meta.filesHash);
if (flags.has('--build')) { const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'build.mjs')], { stdio: 'inherit' }); process.exit(r.status || 0); }
else console.log('Next: node scripts/build.mjs');
