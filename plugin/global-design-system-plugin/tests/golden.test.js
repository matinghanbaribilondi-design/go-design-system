// Run: node tests/golden.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../src/core.js');
const build = require('./fixture-golden.js');
const expectedDir = path.join(__dirname, 'fixtures', 'golden-package');

function tree(dir, prefix) {
  const out = {};
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const rel = prefix ? prefix + '/' + entry.name : entry.name, full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, tree(full, rel));
    else out[rel] = fs.readFileSync(full, 'utf8');
  });
  return out;
}

const generated = files => Object.fromEntries(files.filter(f => !f.binary).map(f => [f.path, f.content]));
const expected = tree(expectedDir), first = generated(core.gen(build(), 'standard', [], [])), second = generated(core.gen(build(), 'standard', [], []));
assert.deepEqual(Object.keys(first).sort(), Object.keys(expected).sort(), 'golden package file set changed; run node scripts/update-golden.mjs after reviewing');
Object.keys(expected).sort().forEach(file => assert.equal(first[file], expected[file], 'golden output changed: ' + file));
assert.deepEqual(second, first, 'the same model must produce byte-identical output');
assert.ok(!Object.values(first).some(x => /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(x)), 'deterministic package files carry no generation timestamp');
assert.match(first['validation.md'], /Package self-check: 100 \/ 100/);
const fullA = generated(core.gen(build(), 'full', [], [])), fullB = generated(core.gen(build(), 'full', [], [])), manifest = JSON.parse(fullA['manifest.json']);
assert.equal(fullA['manifest.json'], fullB['manifest.json'], 'manifest is stable even though metadata.json carries generatedAt');
assert.ok(manifest.outputs.files.every(file => file.path !== 'metadata.json' && file.path !== 'manifest.json'));
assert.deepEqual(manifest.outputs.excluded.map(file => file.path), ['manifest.json', 'metadata.json']);
console.log('golden tests passed: ' + Object.keys(expected).length + ' files');
