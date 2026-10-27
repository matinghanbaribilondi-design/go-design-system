#!/usr/bin/env node
/**
 * Vendors the rendering half of fig-engine into engines/fig-engine/vendor/.
 *
 * fig-engine (the .fig parser) renders through the sibling html-generator
 * project. The Figma plugin already runs inside a file, so it only needs that
 * renderer: SceneNode -> IR -> HTML/CSS. This script walks the import graph of
 * the renderer entry points and copies exactly that closure, preserving the
 * relative layout so the copied imports keep resolving.
 *
 *   node scripts/sync-fig-engine.mjs                 refresh vendor/ + ENGINE.json
 *   node scripts/sync-fig-engine.mjs --dry           print the report only
 *   node scripts/sync-fig-engine.mjs --build         sync, then rebuild code.js
 *   node scripts/sync-fig-engine.mjs --source <dir> --html <dir>
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engineDir = path.join(root, 'engines', 'fig-engine');
const vendorDir = path.join(engineDir, 'vendor');
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const opt = (f, fallback) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const defaultFig = 'C:/Users/matin.ghanbari/Desktop/git hub/figma-ai/fig-engine';
const figRoot = path.resolve(opt('--source', process.env.FIG_ENGINE_DIR || defaultFig));
const htmlRoot = path.resolve(
  opt('--html', process.env.FIG_ENGINE_HTML_GENERATOR || path.join(path.dirname(figRoot), 'html-generator'))
);

/** Entry files the adapter depends on, as paths relative to each project root. */
const ENTRIES = [
  { project: 'html-generator', file: 'src/plugin/converter/index.ts' },
  { project: 'html-generator', file: 'src/plugin/converter/utils.ts' },
  { project: 'html-generator', file: 'src/plugin/variables/variable-collector.ts' },
  { project: 'html-generator', file: 'src/generator/html-generator.ts' },
  { project: 'html-generator', file: 'src/generator/css-generator.ts' },
  { project: 'html-generator', file: 'src/shared/component-registry.ts' },
];

const PROJECTS = {
  'fig-engine': { root: figRoot, vendor: path.join(vendorDir, 'fig-engine') },
  'html-generator': { root: htmlRoot, vendor: path.join(vendorDir, 'html-generator') },
};

const IMPORT_RE =
  /(?:^|[^.\w])(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function readVersion(projectRoot) {
  try {
    return JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function readCommit(projectRoot) {
  try {
    return execFileSync('git', ['-C', projectRoot, 'rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function resolveFile(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      /* next candidate */
    }
  }
  return null;
}

function projectOf(file) {
  const rel = path.relative(figRoot, file);
  if (!rel.startsWith('..') && !path.isAbsolute(rel)) return 'fig-engine';
  const relHtml = path.relative(htmlRoot, file);
  if (!relHtml.startsWith('..') && !path.isAbsolute(relHtml)) return 'html-generator';
  return null;
}

function collect() {
  const files = new Map(); // project -> Map(absPath -> contents)
  const externals = new Map();
  const missing = [];
  const queue = [];

  const add = (absPath) => {
    const project = projectOf(absPath);
    if (!project) return false;
    const bucket = files.get(project) || new Map();
    files.set(project, bucket);
    if (bucket.has(absPath)) return true;
    const source = fs.readFileSync(absPath, 'utf8');
    bucket.set(absPath, source);
    queue.push(absPath);
    return true;
  };

  for (const entry of ENTRIES) {
    const abs = path.join(PROJECTS[entry.project].root, entry.file);
    if (!fs.existsSync(abs)) {
      missing.push(entry.file);
      continue;
    }
    add(abs);
  }

  while (queue.length) {
    const file = queue.shift();
    const source = files.get(projectOf(file)).get(file);
    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(source))) {
      const spec = m[1] || m[2];
      if (!spec || spec.startsWith('node:') || spec === 'figma') continue;
      if (spec.startsWith('.')) {
        const resolved = resolveFile(file, spec);
        if (!resolved) {
          missing.push(`${path.relative(process.cwd(), file)} -> ${spec}`);
          continue;
        }
        if (!add(resolved)) {
          const ext = { project: 'external', spec, from: path.relative(root, file) };
          externals.set(spec, ext);
        }
      } else if (!spec.startsWith('/')) {
        if (!externals.has(spec)) externals.set(spec, { project: 'external', spec, from: path.relative(root, file) });
      }
    }
  }

  return { files, externals, missing };
}

function hashFiles(files) {
  const h = crypto.createHash('sha1');
  const rows = [];
  for (const project of [...files.keys()].sort()) {
    const bucket = files.get(project);
    for (const abs of [...bucket.keys()].sort()) {
      const rel = path.relative(PROJECTS[project].root, abs).split(path.sep).join('/');
      const digest = crypto.createHash('sha1').update(bucket.get(abs)).digest('hex').slice(0, 10);
      rows.push(`${project}/${rel} ${digest}`);
      h.update(`${project}/${rel}\0${digest}\0`);
    }
  }
  return { hash: h.digest('hex').slice(0, 12), rows };
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|json|md)$/.test(name)) out.push(p);
  }
  return out;
}

function sync() {
  const { files, externals, missing } = collect();
  const { hash, rows } = hashFiles(files);

  if (missing.length) {
    console.error('Missing imports:');
    for (const m of missing) console.error('  -', m);
    process.exit(1);
  }

  const runtimeExternals = [...externals.keys()].filter((s) => !/^vitest/.test(s));
  if (runtimeExternals.length) {
    console.error('Runtime imports outside the two projects (esbuild would need them installed):');
    for (const s of runtimeExternals) console.error('  -', s, ' from ', externals.get(s).from);
    process.exit(1);
  }

  const plan = [];
  for (const [project, bucket] of files) {
    for (const abs of bucket.keys()) {
      const rel = path.relative(PROJECTS[project].root, abs);
      plan.push({ project, rel, from: abs, to: path.join(PROJECTS[project].vendor, rel) });
    }
  }
  plan.sort((a, b) => (a.project + a.rel).localeCompare(b.project + b.rel));

  const desired = new Set(plan.map((p) => p.to));
  const current = new Set(walk(vendorDir));
  const added = plan.filter((p) => !fs.existsSync(p.to));
  const changed = plan.filter((p) => fs.existsSync(p.to) && fs.readFileSync(p.from, 'utf8') !== fs.readFileSync(p.to, 'utf8'));
  const removed = [...current].filter((f) => !desired.has(f));

  console.log(`fig-engine      : ${figRoot}`);
  console.log(`html-generator  : ${htmlRoot}`);
  console.log(`files           : ${plan.length} vendored, ${added.length} added, ${changed.length} changed, ${removed.length} removed`);
  if (has('--dry')) {
    for (const f of added) console.log('  +', path.relative(root, f.to));
    for (const f of changed) console.log('  ~', path.relative(root, f.to));
    for (const f of removed) console.log('  -', path.relative(root, f));
    return null;
  }

  fs.mkdirSync(vendorDir, { recursive: true });
  for (const f of removed) fs.rmSync(f, { force: true });
  for (const f of plan) {
    fs.mkdirSync(path.dirname(f.to), { recursive: true });
    fs.copyFileSync(f.from, f.to);
  }

  const meta = {
    id: 'fig-engine',
    contract: 1,
    version: readVersion(figRoot),
    renderer: 'html-generator',
    source: {
      figEngine: { path: figRoot, version: readVersion(figRoot), commit: readCommit(figRoot) },
      htmlGenerator: { path: htmlRoot, version: readVersion(htmlRoot), commit: readCommit(htmlRoot) },
    },
    syncedAt: new Date().toISOString(),
    filesHash: hash,
    files: plan.length,
    entries: ENTRIES.map((e) => `${e.project}/${e.file}`),
  };
  fs.writeFileSync(path.join(engineDir, 'ENGINE.json'), JSON.stringify(meta, null, 2) + '\n');
  fs.writeFileSync(
    path.join(engineDir, 'VENDOR-FILES.txt'),
    rows.join('\n') + '\n'
  );
  console.log(`ENGINE.json     : contract ${meta.contract}, fig-engine v${meta.version}, hash ${hash}`);
  return meta;
}

sync();
if (has('--build') && !has('--dry')) {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'build.mjs')], { stdio: 'inherit', cwd: root });
  process.exit(r.status || 0);
}
