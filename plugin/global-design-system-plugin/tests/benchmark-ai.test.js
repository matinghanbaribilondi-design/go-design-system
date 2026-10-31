// Run: node tests/benchmark-ai.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

(async () => {
  const script = path.join(__dirname, '..', 'scripts', 'benchmark-ai.mjs');
  const { loadSpec, evaluateTask } = await import(pathToFileURL(script).href);
  const spec = loadSpec(), pkg = path.join(__dirname, 'fixtures', 'golden-package'), task1 = spec.tasks.find(task => task.id === 'task-01-primary-action'), task5 = spec.tasks.find(task => task.id === 'task-05-missing-component');
  assert.equal(spec.conditions.length, 3); assert.equal(spec.tasks.length, 6); assert.ok(spec.metrics.separation);

  const temp = path.join(os.tmpdir(), 'gds-ai-bench-' + process.pid); fs.rmSync(temp, { recursive: true, force: true }); fs.mkdirSync(temp, { recursive: true });
  const passDir = path.join(temp, 'pass'); fs.cpSync(path.join(__dirname, 'fixtures', 'ui-pass'), passDir, { recursive: true });
  fs.writeFileSync(path.join(passDir, 'usage.json'), JSON.stringify({ contextTokens: 120, retrievedEvidence: ['token:--color-primary', 'component:set:1'], filesRead: ['tokens.css', 'components/index.json'] }));
  const pass = evaluateTask(task1, passDir, pkg, 'updated');
  assert.equal(pass.status, 'evaluated'); assert.equal(pass.metrics.verifyErrors, 0); assert.equal(pass.metrics.retrievalMissing, 0); assert.equal(pass.metrics.invalidEvidence, 0); assert.equal(pass.metrics.outputEvidenceMatched, 2); assert.equal(pass.metrics.contextTokens, 120);

  const failDir = path.join(temp, 'fail'); fs.cpSync(path.join(__dirname, 'fixtures', 'ui-fail'), failDir, { recursive: true });
  fs.writeFileSync(path.join(failDir, 'usage.json'), JSON.stringify({ contextTokens: -1, retrievedEvidence: ['token:--not-real', 'component:missing'], filesRead: [] }));
  const fail = evaluateTask(task1, failDir, pkg, 'current');
  assert.ok(fail.metrics.literalCount >= 3); assert.ok(fail.metrics.missingTokens >= 1); assert.ok(fail.metrics.invalidVariants >= 1); assert.equal(fail.metrics.retrievalMissing, 2); assert.equal(fail.metrics.invalidEvidence, 2); assert.equal(fail.metrics.contextTokens, null);

  const reportDir = path.join(temp, 'report'); fs.mkdirSync(reportDir);
  fs.writeFileSync(path.join(reportDir, 'answer.md'), 'MISSING COMPONENT: Select. Ask the design-system owner to add it.'); fs.writeFileSync(path.join(reportDir, 'usage.json'), JSON.stringify({ contextTokens: 40, retrievedEvidence: ['component:set:1'], filesRead: ['components/index.json'] }));
  const report = evaluateTask(task5, reportDir, pkg, 'updated'); assert.equal(report.findings.some(f => f.code === 'BENCHMARK_ANSWER_INCOMPLETE'), false); assert.equal(report.metrics.retrievedEvidence, 1);

  const cli = spawnSync(process.execPath, [script, '--results', path.join(temp, 'missing-run')], { encoding: 'utf8' });
  assert.equal(cli.status, 2); const blocked = JSON.parse(cli.stdout); assert.equal(blocked.status, 'blocked'); assert.match(blocked.reason, /artifact bundle/i);
  fs.rmSync(temp, { recursive: true, force: true });
  console.log('AI benchmark evaluator tests passed: contract only, no benchmark result claimed');
})().catch(e => { console.error(e); process.exit(1); });
