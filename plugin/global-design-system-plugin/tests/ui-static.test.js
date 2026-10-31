// Run: node tests/ui-static.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ui = fs.readFileSync(path.join(__dirname, '..', 'ui.html'), 'utf8'), harness = fs.readFileSync(path.join(__dirname, 'preview-harness.html'), 'utf8');

assert.match(ui, /aria-valuemin="0" aria-valuemax="5" aria-valuenow="0"/, 'slider advertises six positions');
assert.match(ui, /Hard design-system constraints enforced/);
assert.match(ui, /creative freedom/);
assert.ok(!/Rule Adherence/.test(ui), 'creativity is never presented as a rule-probability');
assert.match(ui, /id="refCssMode"[\s\S]*Reference CSS: Standalone[\s\S]*Reference CSS: Shared tokens\.css/, 'Reference CSS mode is explicit');
assert.match(ui, /refCss: S\.refCss/); assert.ok(!/send\(['"]build['"]/.test(ui), 'UI exposes no unsupported import workflow');
['Strict', 'Conservative', 'Balanced', 'Creative', 'Advanced Creative', 'Open'].forEach(label => assert.match(harness, new RegExp("label: '" + label + "'")));
assert.equal((harness.match(/position: [0-9]/g) || []).length, 6, 'preview harness carries six steps');
console.log('UI static contract tests passed');
