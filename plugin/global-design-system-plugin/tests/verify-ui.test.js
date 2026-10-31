// Run: node tests/verify-ui.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

(async () => {
  const verifyScript = path.join(__dirname, '..', 'scripts', 'verify.mjs');
  const { verifyUI, verifyPackage } = await import(pathToFileURL(verifyScript).href);
  const fixture = name => path.join(__dirname, 'fixtures', name), pkg = fixture('golden-package');

  const pass = verifyUI(fixture('ui-pass'), pkg);
  assert.equal(pass.errors, 0, JSON.stringify(pass.findings));
  assert.equal(pass.metrics.componentMarkers, 1); assert.ok(pass.metrics.declarations >= 10);
  assert.match(pass.limitations[0], /cannot prove visual similarity/);

  const fail = verifyUI(fixture('ui-fail'), pkg), codes = new Set(fail.findings.map(f => f.code));
  ['UI_LITERAL_COLOR', 'UI_LITERAL_SPACING', 'UI_LITERAL_FONT', 'UI_LITERAL_SHADOW', 'UI_TOKEN_UNDEFINED', 'UI_COMPONENT_UNKNOWN', 'UI_VARIANT_INVALID', 'UI_MODE_UNSUPPORTED', 'UI_ASSET_MISSING', 'UI_LOCAL_REFERENCE'].forEach(code => assert.ok(codes.has(code), 'missing ' + code));
  assert.ok(fail.findings.filter(f => f.code === 'UI_VARIANT_INVALID').length >= 2, 'unknown IDs and invalid axis values are separate failures');
  assert.ok(fail.findings.every(f => f.severity === 'error' && f.file && f.location !== 'root' && f.message));
  assert.ok(fail.errors >= 10);

  const malformed = verifyUI(fixture('ui-malformed'), pkg);
  assert.ok(malformed.findings.some(f => f.code === 'UI_CSS_MALFORMED'), 'unbalanced CSS is diagnosed without crashing');
  assert.equal(verifyUI(fixture('ui-empty'), pkg).findings.some(f => f.code === 'UI_SOURCE_MISSING'), true);

  const temp = path.join(os.tmpdir(), 'gds-ui-verify-' + process.pid);
  fs.rmSync(temp, { recursive: true, force: true }); fs.mkdirSync(temp, { recursive: true });
  const noContext = verifyUI(fixture('ui-pass'), temp);
  assert.ok(noContext.findings.some(f => f.code === 'UI_PACKAGE_CONTEXT_MISSING'));
  fs.writeFileSync(path.join(temp, 'tokens.css'), fs.readFileSync(path.join(pkg, 'tokens.css'))); fs.mkdirSync(path.join(temp, 'components'));
  fs.writeFileSync(path.join(temp, 'components', 'index.json'), '{invalid');
  assert.ok(verifyUI(fixture('ui-pass'), temp).findings.some(f => f.code === 'UI_PACKAGE_INVALID'));
  fs.rmSync(temp, { recursive: true, force: true });

  const cli = spawnSync(process.execPath, [verifyScript, 'ui', fixture('ui-fail'), '--package', pkg, '--json'], { encoding: 'utf8' });
  assert.equal(cli.status, 1, cli.stderr); const output = JSON.parse(cli.stdout);
  assert.equal(output.mode, 'ui'); assert.ok(output.findings.some(f => f.code === 'UI_LITERAL_COLOR'));
  assert.equal(verifyPackage(pkg).errors, 0, 'package mode still works independently');
  console.log('verify UI tests passed: ' + codes.size + ' rule families');
})().catch(e => { console.error(e); process.exit(1); });
