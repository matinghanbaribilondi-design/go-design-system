// Run: node tests/verify.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const core = require('../src/core.js');
const build = require('./fixture-golden.js');

(async () => {
  const { verifyPackage, validateSchema } = await import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'verify.mjs')).href);
  const schemas = path.join(__dirname, '..', 'schemas'), manifestSchema = JSON.parse(fs.readFileSync(path.join(schemas, 'manifest.schema.json'), 'utf8'));

  const standard = verifyPackage(path.join(__dirname, 'fixtures', 'golden-package'));
  assert.equal(standard.errors, 0, JSON.stringify(standard.findings));

  const temp = path.join(os.tmpdir(), 'gds-verify-' + process.pid);
  fs.rmSync(temp, { recursive: true, force: true });
  core.gen(build(), 'full', [], []).forEach(file => {
    const target = path.join(temp, file.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.binary ? Buffer.from(file.content, 'base64') : file.content);
  });
  const full = verifyPackage(temp);
  assert.equal(full.errors, 0, JSON.stringify(full.findings));
  ['manifest.json', 'validation-report.json', 'metadata/token-map.json', 'reference/index.json'].forEach(file => assert.ok(fs.existsSync(path.join(temp, file)), 'full package includes ' + file));
  const writePackage = (dir, M) => {
    fs.rmSync(dir, { recursive: true, force: true });
    core.gen(M, 'full', [], []).forEach(file => { const target = path.join(dir, file.path); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, file.binary ? Buffer.from(file.content, 'base64') : file.content); });
  };
  const sharedTemp = path.join(os.tmpdir(), 'gds-verify-shared-' + process.pid), sharedModel = build(); sharedModel.refCss = 'shared'; writePackage(sharedTemp, sharedModel);
  const sharedResult = verifyPackage(sharedTemp), sharedIndex = JSON.parse(fs.readFileSync(path.join(sharedTemp, 'reference/index.json'), 'utf8'));
  assert.equal(sharedResult.errors, 0, JSON.stringify(sharedResult.findings)); assert.equal(sharedIndex.cssMode.active, true); assert.match(fs.readFileSync(path.join(sharedTemp, 'reference/Home.html'), 'utf8'), /href="\.\.\/tokens\.css"/);
  fs.rmSync(path.join(sharedTemp, 'tokens.css')); assert.ok(verifyPackage(sharedTemp).findings.some(f => f.code === 'VERIFY_SHARED_CSS'), 'missing shared stylesheet is explicit'); fs.rmSync(sharedTemp, { recursive: true, force: true });

  assert.equal(validateSchema(manifestSchema, { formatVersion: '3.0.0' }).length > 0, true, 'schemas reject missing required fields');
  assert.equal(manifestSchema.$schema, 'https://json-schema.org/draft/2020-12/schema'); assert.equal(manifestSchema.version, '3.0.0');
  const samples = [['manifest.schema.json', 'manifest.json'], ['token-map.schema.json', 'metadata/token-map.json'], ['components-index.schema.json', 'components/index.json'], ['reference-index.schema.json', 'reference/index.json'], ['metadata.schema.json', 'metadata.json'], ['validation-report.schema.json', 'validation-report.json']];
  samples.forEach(([schemaFile, dataFile]) => {
    const schema = JSON.parse(fs.readFileSync(path.join(schemas, schemaFile), 'utf8')), valid = JSON.parse(fs.readFileSync(path.join(temp, dataFile), 'utf8'));
    assert.deepEqual(validateSchema(schema, valid), [], schemaFile + ' accepts its generated package data'); assert.ok(validateSchema(schema, {}).length > 0, schemaFile + ' rejects an empty object');
  });
  const iconSchema = JSON.parse(fs.readFileSync(path.join(schemas, 'icons.schema.json'), 'utf8')), icon = { name: 'Icon/Arrow', named: true, kind: 'component', size: '24x24', confidence: 0.9, usedIn: ['Home'], figmaId: '1:2' };
  assert.deepEqual(validateSchema(iconSchema, [icon]), []); assert.ok(validateSchema(iconSchema, [{}]).length > 0, 'icons schema rejects a row without required evidence');
  const manifest = JSON.parse(fs.readFileSync(path.join(temp, 'manifest.json'), 'utf8'));
  assert.equal(manifest.generatorVersion, '0.10.0'); assert.equal(manifest.source.fileKey, null); assert.equal(manifest.source.fileKeyStatus, 'unavailable');
  assert.deepEqual(manifest.scope.pages, ['Screens', 'Components']); assert.equal(manifest.capabilities.components.status, 'supported');
  assert.ok(manifest.outputs.files.some(f => f.path === 'tokens.css')); assert.ok(manifest.dependencies.external.some(d => d.kind === 'google-font'));
  assert.ok(manifest.limitations.some(x => /Stable Figma file ID/.test(x)) && manifest.limitations.some(x => /licenses/.test(x)));
  const tokensFile = path.join(temp, 'tokens.css'), originalTokens = fs.readFileSync(tokensFile);
  fs.appendFileSync(tokensFile, '\n/* tampered */\n');
  assert.ok(verifyPackage(temp).findings.some(f => f.code === 'VERIFY_OUTPUT_FINGERPRINT'), 'verify detects altered output');
  fs.writeFileSync(tokensFile, originalTokens); fs.writeFileSync(path.join(temp, 'notes.txt'), 'unexpected');
  assert.ok(verifyPackage(temp).findings.some(f => f.code === 'VERIFY_UNEXPECTED_FILE'), 'verify reports undeclared files');
  fs.rmSync(path.join(temp, 'notes.txt'));
  fs.rmSync(path.join(temp, 'reference', 'Settings.html'));
  const broken = verifyPackage(temp);
  assert.ok(broken.findings.some(f => f.code === 'VERIFY_REFERENCE_FILE'), 'verify detects missing reference evidence');
  fs.rmSync(temp, { recursive: true, force: true });
  console.log('verify tests passed');
})().catch(e => { console.error(e); process.exit(1); });
