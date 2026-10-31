// Run: node tests/docs-consistency.test.js
// Keeps documentation claims tied to what the code actually produces.
// Every assertion here fails on a real drift, never on formatting taste.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../src/core.js');
const buildGolden = require('./fixture-golden.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const failures = [];
const check = (label, fn) => { try { fn(); } catch (error) { failures.push(label + ': ' + error.message); } };

// ---------- 1. code.js must be the current core, not a stale assembly ----------
check('code.js is assembled from src/core.js', () => {
  const code = read('code.js').trimEnd(), coreSrc = read('src/core.js').trimEnd();
  assert.ok(code.endsWith(coreSrc), 'run `node scripts/build.mjs --assemble-only` (or `npm run build`) to reassemble code.js');
});

// ---------- 2. documented core test count ----------
const coreTestCount = (read('tests/core.test.js').match(/^t\(/gm) || []).length;
check('core test count is documented exactly', () => {
  assert.ok(coreTestCount > 0, 'no tests found in tests/core.test.js');
  assert.match(read('docs/v2.0-acceptance-checklist.md'), new RegExp('\\| Core \\| ✅ \\| [۰-۹0-9]+ تست \\|'));
  const fa = read('docs/v2.0-acceptance-checklist.md').match(/\| Core \| ✅ \| ([۰-۹0-9]+) تست \|/)[1];
  assert.equal(Number(fa.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))), coreTestCount,
    'checklist says ' + fa + ' core tests, the file contains ' + coreTestCount);
});

// ---------- 3. documented file counts come from the generator ----------
const generated = {};
['minimal', 'standard', 'full', 'agent'].forEach(mode => {
  const files = core.gen(buildGolden(), mode, [], []);
  generated[mode] = files.map(file => file.path).sort();
});
const goldenFiles = generated.standard.length;
const agentFiles = generated.agent.length;

check('golden file count matches the generated standard package', () => {
  const onDisk = (function walk(dir, prefix) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const rel = prefix ? prefix + '/' + entry.name : entry.name;
      return entry.isDirectory() ? walk(path.join(dir, entry.name), rel) : [rel];
    });
  })(path.join(__dirname, 'fixtures', 'golden-package'), '').sort();
  assert.deepEqual(onDisk, generated.standard, 'fixtures/golden-package drifted from the generator; run `npm run golden` after reviewing the diff');
  assert.match(read('docs/v2.0-acceptance-checklist.md'), new RegExp('\\| Golden \\| ✅ \\| [۰-۹0-9]+ فایل \\|'));
  const fa = read('docs/v2.0-acceptance-checklist.md').match(/\| Golden \| ✅ \| ([۰-۹0-9]+) فایل \|/)[1];
  assert.equal(Number(fa.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))), goldenFiles, 'checklist golden count is stale');
});

check('ZIP round-trip file count matches its full package plus binary assets', () => {
  const fa = read('docs/v2.0-acceptance-checklist.md').match(/\| ZIP Round-trip \| ✅ \| ([۰-۹0-9]+) فایل/);
  assert.ok(fa, 'the ZIP round-trip row lost its file count');
  assert.equal(Number(fa[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))), generated.full.length + 2, 'ZIP fixture is full mode plus two binary reference assets');
});

// ---------- 4. package contract lists exactly what is generated ----------
const contract = read('docs/package-contract.md');
check('package contract names every generated file of every mode', () => {
  const documented = new Set([...contract.matchAll(/`([^`\n]+\.(?:md|css|json|html))`/g)].map(m => m[1]));
  const dynamic = /^(?:reference\/(?!index\.json$)[^/]+\.html|reference\/assets\/[^/]+|components\/(?!index\.json$)[^/]+\.html)$/;
  Object.keys(generated).forEach(mode => generated[mode].forEach(file => {
    if (dynamic.test(file)) return;
    assert.ok(documented.has(file), 'docs/package-contract.md never mentions ' + file + ' (mode ' + mode + ')');
  }));
});

check('package contract records the real per-mode file totals', () => {
  const table = contract.match(/<!-- FILE-COUNTS:START -->([\s\S]*?)<!-- FILE-COUNTS:END -->/);
  assert.ok(table, 'the generated file-count block is missing');
  const claimed = Object.fromEntries([...table[1].matchAll(/\| `(minimal|standard|full|agent)` \| (\d+) \|/g)].map(m => [m[1], Number(m[2])]));
  Object.keys(generated).forEach(mode => assert.equal(claimed[mode], generated[mode].length,
    mode + ' mode generates ' + generated[mode].length + ' files, the table says ' + claimed[mode]));
});

// ---------- 5. documented paths exist ----------
check('every repository path mentioned in backticks exists', () => {
  const docs = new Set();
  const addDoc = rel => { docs.add(rel); };
  addDoc('README.md');
  fs.readdirSync(path.join(ROOT, 'docs')).filter(f => f.endsWith('.md')).forEach(f => addDoc('docs/' + f));
  ['benchmark/ai/README.md', 'tests/fixtures/README.md', 'engines/fig-engine/README.md'].forEach(addDoc);

  const skip = /^(?:reference\/|components\/|metadata\/|assets\/|fonts\/|rules\/|tokens|manifest\.json$|metadata\.json$|validation-report\.json$|icons\.json$|SKILL\.md$|design\.md$|ai-control\.md$|components\.md$|components\.css$|fonts\.css$|content\.md$|validation\.md$|run\.json$|usage\.json$|human-review\.json$|model-review\.json$|\.\.\/|<|\$)/;
  [...docs].forEach(rel => {
    const text = read(rel);
    [...text.matchAll(/`([^`\n]+)`/g)].map(m => m[1]).forEach(token => {
      if (!/^[\w./-]+\.(?:js|mjs|md|json|html|css|ts|txt)$/.test(token)) return;
      if (skip.test(token) || token.includes('<') || token.includes('*')) return;
      const direct = path.join(ROOT, token);
      if (fs.existsSync(direct)) return;
      if (['tests', 'scripts', 'schemas', 'docs', 'benchmark/ai', 'src', 'engines/fig-engine'].some(dir => fs.existsSync(path.join(ROOT, dir, token)))) return;
      throw new Error(rel + ' references `' + token + '`, which does not exist in the repository');
    });
  });
});

// ---------- 6. verify rule catalogue is complete ----------
check('verify-rules.md documents every verify.mjs rule ID', () => {
  const source = read('scripts/verify.mjs');
  const codes = new Set([...source.matchAll(/finding\(\s*'([A-Z_]+)'/g)].map(m => m[1]));
  codes.delete('code');
  const doc = read('docs/verify-rules.md');
  [...codes].sort().forEach(code => assert.ok(doc.includes('`' + code + '`'), 'docs/verify-rules.md is missing ' + code));
});

check('verify-rules.md documents every UI rule ID', () => {
  const source = read('scripts/verify.mjs');
  const codes = new Set([...source.matchAll(/'(UI_[A-Z_]+)'/g)].map(m => m[1]));
  const doc = read('docs/verify-rules.md');
  [...codes].sort().forEach(code => assert.ok(doc.includes('`' + code + '`'), 'docs/verify-rules.md is missing ' + code));
});

check('verify-rules.md documents every package lint rule ID', () => {
  const source = read('src/core.js');
  const codes = new Set([...source.matchAll(/\badd\(\s*'([A-Z][A-Z0-9_]{4,})'/g)].map(m => m[1]));
  const doc = read('docs/verify-rules.md');
  [...codes].sort().forEach(code => assert.ok(doc.includes('`' + code + '`'), 'docs/verify-rules.md is missing lint rule ' + code));
});

// ---------- 7. the docs index covers every document ----------
check('docs/README.md links every document in docs/', () => {
  const index = read('docs/README.md');
  const walk = (dir, prefix) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const rel = prefix ? prefix + '/' + entry.name : entry.name;
    return entry.isDirectory() ? walk(path.join(dir, entry.name), rel) : [rel];
  });
  walk(path.join(ROOT, 'docs'), '')
    .filter(file => file.endsWith('.md') && file !== 'README.md')
    .forEach(file => assert.ok(index.includes('](' + file + ')'), 'docs/README.md does not link docs/' + file));
});

// ---------- 8. no two documents claim different states for one decision ----------
check('approved decisions are not still described as proposed', () => {
  const decisions = read('docs/v2-architecture-decisions.md');
  const checklist = read('docs/v2.0-acceptance-checklist.md');
  ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'].forEach(id => {
    assert.match(decisions, new RegExp('\\| ' + id + ' \\| (Approved|مسیر Approved)[^|]* \\|'), id + ' is not marked approved in the decision report');
    assert.match(checklist, new RegExp('\\| ' + id + ' [^|]+\\| ✅'), id + ' is not marked ✅ in the acceptance checklist');
  });
  assert.match(decisions, /\| D7 \| Proposed \|/, 'D7 must still be Proposed until the licence contract is approved');
});

// ---------- 9. no personal absolute paths in documentation ----------
check('documentation contains no absolute personal paths', () => {
  const files = ['README.md', 'engines/fig-engine/README.md'].concat(
    fs.readdirSync(path.join(ROOT, 'docs')).filter(f => f.endsWith('.md')).map(f => 'docs/' + f));
  files.forEach(rel => {
    const text = read(rel);
    assert.ok(!/[A-Za-z]:[\\/]Users[\\/]/.test(text), rel + ' hard-codes an absolute personal path');
  });
});

// ---------- 10. documented benchmark exit codes match the script ----------
check('benchmark README documents every exit code the evaluator uses', () => {
  const source = read('scripts/benchmark-ai.mjs');
  const codes = new Set([...source.matchAll(/process\.exit\(\s*(?:output\.status === 'complete' \? )?(\d)/g)].map(m => Number(m[1])).concat([0]));
  const doc = read('benchmark/ai/README.md');
  [...codes].sort().forEach(code => assert.ok(new RegExp('`' + code + '`').test(doc), 'benchmark/ai/README.md does not document exit code ' + code));
});

if (failures.length) {
  console.error(failures.map(f => 'FAIL ' + f).join('\n'));
  process.exit(1);
}
console.log('docs consistency tests passed: ' + coreTestCount + ' core tests, ' + goldenFiles + ' golden files, ' + agentFiles + ' ZIP files');