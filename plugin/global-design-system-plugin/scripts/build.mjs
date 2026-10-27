#!/usr/bin/env node
/**
 * Builds the plugin entry `code.js` from two independent parts:
 *   1. engines/fig-engine/ -> bundled by esbuild into engines/fig-engine/dist/fig-engine.bundle.js
 *   2. src/core.js         -> the compiler (no build step needed)
 * and concatenates them. Updating the HTML/component engine never touches core.js.
 *
 *   node scripts/build.mjs                  rebuild the engine bundle, then assemble code.js
 *   node scripts/build.mjs --assemble-only  reuse the prebuilt bundle (no esbuild needed)
 *   node scripts/build.mjs --no-engine      assemble core only (built-in simple reference renderer)
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const engineDir = path.join(root, 'engines', 'fig-engine');
const bundlePath = path.join(engineDir, 'dist', 'fig-engine.bundle.js');

async function buildEngine() {
  const req = createRequire(path.join(root, 'package.json'));
  let esbuild;
  for (const id of ['esbuild', process.env.ESBUILD_PATH].filter(Boolean)) { try { esbuild = req(id); break; } catch { /* try next */ } }
  if (!esbuild) { console.error('esbuild not found. Run `npm install` (or set ESBUILD_PATH), or use --assemble-only.'); process.exit(1); }
  const r = await esbuild.build({ entryPoints: [path.join(engineDir, 'adapter.ts')], bundle: true, format: 'iife', globalName: 'FigEngine', target: 'es2019', write: false, loader: { '.json': 'json' }, logLevel: 'warning' });
  fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
  fs.writeFileSync(bundlePath, r.outputFiles[0].text);
  console.log('engine bundle:', path.relative(root, bundlePath), r.outputFiles[0].text.length, 'bytes');
}

function assemble() {
  const core = fs.readFileSync(path.join(root, 'src', 'core.js'), 'utf8');
  let out = '// GENERATED FILE — do not edit. Sources: engines/fig-engine/ (module) + src/core.js. Build: node scripts/build.mjs\n';
  if (!args.has('--no-engine')) {
    if (!fs.existsSync(bundlePath)) { console.error('Missing', bundlePath, '— run without --assemble-only first.'); process.exit(1); }
    const meta = JSON.parse(fs.readFileSync(path.join(engineDir, 'ENGINE.json'), 'utf8')), b = fs.readFileSync(bundlePath, 'utf8');
    out += '// ===== HTML engine: ' + meta.id + ' v' + meta.version + ' (contract ' + meta.contract + ', sha1 ' + crypto.createHash('sha1').update(b).digest('hex').slice(0, 10) + ') =====\n' + b + '\n';
  }
  out += '// ===== Core =====\n' + core;
  fs.writeFileSync(path.join(root, 'code.js'), out);
  console.log('code.js assembled:', out.length, 'bytes', args.has('--no-engine') ? '(no engine)' : '(with engine)');
}

if (!args.has('--assemble-only') && !args.has('--no-engine')) await buildEngine();
assemble();
