// Run: node tests/runtime-static.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

for (const file of ['code.js', 'ui.html']) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert.ok(!/\bimport\s*\(/.test(source), file + ' contains a dynamic-import-like expression rejected by the Figma sandbox');
  assert.ok(!/\bimport\.meta\b/.test(source), file + ' contains import.meta');
  assert.ok(!/\bexport\s+(?:default|const|let|var|function|class)\b/.test(source), file + ' contains module export syntax');
}
console.log('runtime sandbox contract tests passed');
