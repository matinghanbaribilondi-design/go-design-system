#!/usr/bin/env node
// Evaluates supplied AI benchmark artifacts. It never generates or invents results.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_PATH = path.join(ROOT, 'benchmark', 'ai', 'tasks.json');
const { verifyUI } = await import(pathToFileURL(path.join(ROOT, 'scripts', 'verify.mjs')).href);

const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function loadSpec(file = SPEC_PATH) {
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (spec.schemaVersion !== '1.0.0') throw new Error('Unsupported benchmark spec version');
  if (!Array.isArray(spec.conditions) || spec.conditions.length !== 3 || !Array.isArray(spec.tasks) || spec.tasks.length < 5) throw new Error('Benchmark requires three conditions and at least five tasks');
  const ids = new Set(spec.tasks.map(task => task.id)); if (ids.size !== spec.tasks.length) throw new Error('Task IDs must be unique');
  return spec;
}

function packageEvidence(packageDir) {
  const read = file => { try { return fs.readFileSync(path.join(packageDir, file), 'utf8'); } catch { return ''; } };
  const tokensCss = read('tokens.css'), tokens = new Map();
  let tokenMap = null; try { tokenMap = JSON.parse(read('metadata/token-map.json')); } catch { /* optional */ }
  (tokenMap && tokenMap.tokens || []).forEach(token => tokens.set(token.cssVar, token.category || 'other'));
  (tokensCss.match(/--[\w-]+(?=\s*:)/g) || []).forEach(cssVar => { if (!tokens.has(cssVar)) tokens.set(cssVar, /^--(?:color|paint)/.test(cssVar) ? 'color' : /^--(?:space|spacing)/.test(cssVar) ? 'spacing' : /^--(?:radius)/.test(cssVar) ? 'radius' : /^--text/.test(cssVar) ? 'typography' : 'other'); });
  let index = null; try { index = JSON.parse(read('components/index.json')); } catch { /* optional */ }
  let referenceIndex = null; try { referenceIndex = JSON.parse(read('reference/index.json')); } catch { /* optional */ }
  const families = new Map(); ((index && index.graph && index.graph.families) || []).forEach(family => families.set(family.id, family));
  const patterns = new Set(((index && index.patterns && index.patterns.patterns) || []).map(pattern => pattern.id));
  const references = new Set(((referenceIndex || (index && index.references) || {}).entries || []).map(entry => entry.file));
  const modes = new Set((tokensCss.match(/\[data-theme=["']([^"']+)["']\]/g) || []).map(x => x.replace(/^\[data-theme=["']|["']\]$/g, '')));
  return { tokens, families, patterns, references, modes, tokenMap };
}

function parseEvidence(value) {
  const separator = String(value).indexOf(':'); if (separator < 1) return null;
  return { kind: value.slice(0, separator), value: value.slice(separator + 1) };
}

function evidenceStatus(value, evidence) {
  const parsed = parseEvidence(value); if (!parsed) return 'invalid';
  if (parsed.kind === 'token') return evidence.tokens.has(parsed.value) ? 'valid' : 'invalid';
  if (parsed.kind === 'component') return evidence.families.has(parsed.value) || [...evidence.families.values()].some(f => f.name === parsed.value) ? 'valid' : 'invalid';
  if (parsed.kind === 'pattern') return evidence.patterns.has(parsed.value) ? 'valid' : 'invalid';
  if (parsed.kind === 'reference') return evidence.references.has(parsed.value) || evidence.references.has(parsed.value.replace(/^\.?\//, '')) ? 'valid' : 'invalid';
  if (parsed.kind === 'mode') return evidence.modes.has(slug(parsed.value)) ? 'valid' : 'invalid';
  return 'invalid';
}

const tokenRaw = value => { const parsed = parseEvidence(value); return parsed && parsed.kind === 'token' ? parsed.value : null; };
const componentRaw = value => { const parsed = parseEvidence(value); return parsed && parsed.kind === 'component' ? parsed.value : null; };
const familyFor = (raw, evidence) => evidence.families.get(raw) || [...evidence.families.values()].find(f => f.name === raw);

function requiredMatched(requirement, values, evidence) {
  return values.some(value => {
    const parsed = parseEvidence(value); if (!parsed) return false;
    if (requirement.kind !== parsed.kind) return false;
    if (requirement.kind === 'token') return requirement.category ? evidence.tokens.get(parsed.value) === requirement.category : true;
    if (requirement.kind === 'component') {
      if (requirement.wildcard) return true;
      const family = familyFor(parsed.value, evidence); return family && (!requirement.familyPattern || new RegExp(requirement.familyPattern, 'i').test(family.name + ' ' + family.id));
    }
    if (requirement.kind === 'pattern' || requirement.kind === 'reference') return true;
    if (requirement.kind === 'mode') return requirement.name ? slug(parsed.value) === slug(requirement.name) : true;
    return false;
  });
}

function outputMatches(requirement, html, evidence) {
  if (requirement.kind === 'token') return [...evidence.tokens.entries()].filter(([, category]) => !requirement.category || category === requirement.category).some(([cssVar]) => html.includes('var(' + cssVar));
  if (requirement.kind === 'component') return [...evidence.families.values()].some(family => (!requirement.familyPattern || new RegExp(requirement.familyPattern, 'i').test(family.name + ' ' + family.id)) && (html.includes('data-component-family-id="' + family.id + '"') || html.includes('data-component-family="' + family.name + '"')));
  if (requirement.kind === 'mode') return new RegExp('data-theme=["\']' + String(requirement.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']', 'i').test(html);
  return null;
}

function readTree(root) {
  const files = {};
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const full = path.join(dir, entry.name), rel = path.relative(root, full).split(path.sep).join('/');
    if (entry.isDirectory()) walk(full); else if (/\.(?:html?|css|md)$/i.test(entry.name)) files[rel] = fs.readFileSync(full, 'utf8');
  });
  walk(root); return files;
}

export function evaluateTask(task, outputDir, packageDir, condition) {
  const evidence = packageEvidence(packageDir), findings = [], missing = [];
  const required = task.requiredEvidence || [], uiFindings = [];
  let usage = null, html = '', answer = '';
  if (!fs.existsSync(outputDir)) return { taskId: task.id, condition, status: 'blocked', findings: [{ code: 'BENCHMARK_MISSING_TASK_OUTPUT', severity: 'error', file: task.id, location: 'root', message: 'Task output directory is missing.' }], metrics: null };
  const tree = readTree(outputDir); html = Object.entries(tree).filter(([file]) => /\.html?$/i.test(file)).map(([, content]) => content).join('\n'); answer = Object.entries(tree).filter(([file]) => /answer\.md$/i.test(file)).map(([, content]) => content).join('\n');
  const outputText = Object.values(tree).join('\n');
  try { usage = JSON.parse(fs.readFileSync(path.join(outputDir, 'usage.json'), 'utf8')); }
  catch (e) { findings.push({ code: 'BENCHMARK_USAGE_INVALID', severity: 'error', file: 'usage.json', location: 'root', message: 'Usage evidence is missing or invalid JSON: ' + e.message }); }
  const contextTokens = usage && Number.isFinite(usage.contextTokens) && usage.contextTokens >= 0 ? usage.contextTokens : null;
  if (!usage || contextTokens === null) findings.push({ code: 'BENCHMARK_CONTEXT_INVALID', severity: 'error', file: 'usage.json', location: 'contextTokens', message: 'A non-negative contextTokens value is required.' });
  const retrieval = usage && Array.isArray(usage.retrievedEvidence) ? usage.retrievedEvidence : [];
  const invalidEvidence = retrieval.filter(value => evidenceStatus(value, evidence) === 'invalid');
  invalidEvidence.forEach(value => findings.push({ code: 'BENCHMARK_EVIDENCE_INVALID', severity: 'error', file: 'usage.json', location: 'retrievedEvidence', message: 'Retrieved evidence does not exist in the grading package: ' + value }));
  const retrieved = required.filter(requirement => requiredMatched(requirement, retrieval, evidence)).length;
  required.filter(requirement => !requiredMatched(requirement, retrieval, evidence)).forEach(requirement => findings.push({ code: 'BENCHMARK_EVIDENCE_MISSING', severity: 'error', file: 'usage.json', location: 'retrievedEvidence', message: 'Required retrieval evidence is missing: ' + JSON.stringify(requirement) }));
  const outputApplicable = required.map(requirement => outputMatches(requirement, outputText, evidence)).filter(value => value !== null), outputMatched = outputApplicable.filter(Boolean).length;
  if (task.kind === 'report') {
    (task.requiredPhrases || []).forEach(phrase => { if (!answer.includes(phrase)) findings.push({ code: 'BENCHMARK_ANSWER_INCOMPLETE', severity: 'error', file: 'answer.md', location: 'root', message: 'Required answer phrase is missing: ' + phrase }); });
  } else {
    if (!html) findings.push({ code: 'BENCHMARK_MISSING_OUTPUT', severity: 'error', file: 'output.html', location: 'root', message: 'UI task has no HTML output.' });
    else {
      const verified = verifyUI(outputDir, packageDir); uiFindings.push(...verified.findings);
      verified.findings.forEach(item => findings.push(item));
    }
  }
  const count = code => findings.filter(item => item.code === code).length, literal = findings.filter(item => /^UI_LITERAL_/.test(item.code)).length;
  return {
    taskId: task.id, condition, status: 'evaluated', findings,
    metrics: {
      verifyErrors: uiFindings.length, literalCount: literal,
      missingTokens: count('UI_TOKEN_UNDEFINED'), invalidVariants: count('UI_VARIANT_INVALID'),
      unsupportedModes: count('UI_MODE_UNSUPPORTED'), missingAssets: count('UI_ASSET_MISSING'),
      contextTokens, requiredEvidence: required.length, retrievedEvidence: retrieved,
      retrievalMissing: required.length - retrieved, invalidEvidence: invalidEvidence.length,
      outputEvidenceApplicable: outputApplicable.length, outputEvidenceMatched: outputMatched
    }
  };
}

export function evaluateRun(resultsDir) {
  const spec = loadSpec(), runFile = path.join(resultsDir, 'run.json');
  if (!fs.existsSync(runFile)) return { schemaVersion: '1.0.0', status: 'blocked', reason: 'No run.json artifact bundle exists. Generate outputs for all conditions and tasks before evaluating.', spec };
  const run = JSON.parse(fs.readFileSync(runFile, 'utf8')), gradingPackage = path.resolve(resultsDir, run.gradingPackage || '../package');
  if (!fs.existsSync(path.join(gradingPackage, 'tokens.css'))) return { schemaVersion: '1.0.0', status: 'blocked', reason: 'gradingPackage does not exist or is not a package.', spec };
  const results = [], missing = [];
  spec.conditions.forEach(condition => spec.tasks.forEach(task => {
    const outputDir = path.join(resultsDir, condition.id, task.id);
    if (!fs.existsSync(outputDir)) missing.push(condition.id + '/' + task.id); else results.push(evaluateTask(task, outputDir, gradingPackage, condition.id));
  }));
  if (missing.length) return { schemaVersion: '1.0.0', status: 'blocked', reason: 'Benchmark artifacts are incomplete.', missing, spec, results };
  const humanFile = path.join(resultsDir, 'human-review.json'), modelFile = path.join(resultsDir, 'model-review.json');
  const human = fs.existsSync(humanFile) ? JSON.parse(fs.readFileSync(humanFile, 'utf8')) : null, model = fs.existsSync(modelFile) ? JSON.parse(fs.readFileSync(modelFile, 'utf8')) : null;
  return { schemaVersion: '1.0.0', status: human ? 'complete' : 'partial', reason: human ? 'Automated and declared human evidence are present.' : 'Automated metrics are complete; required human visual reviews are missing.', spec, results, humanReview: human, modelAssistedReview: model };
}

function summary(result) {
  if (!result.results || !result.results.length) return result;
  const byCondition = {};
  result.spec.conditions.forEach(condition => {
    const rows = result.results.filter(row => row.condition === condition.id), metric = key => rows.reduce((sum, row) => sum + ((row.metrics && row.metrics[key]) || 0), 0);
    byCondition[condition.id] = { tasks: rows.length, literalCount: metric('literalCount'), missingTokens: metric('missingTokens'), invalidVariants: metric('invalidVariants'), contextTokens: metric('contextTokens'), requiredEvidence: metric('requiredEvidence'), retrievedEvidence: metric('retrievedEvidence') };
  });
  return Object.assign({}, result, { summary: byCondition });
}

function main() {
  const args = process.argv.slice(2), resultsIndex = args.indexOf('--results'), results = resultsIndex >= 0 ? args[resultsIndex + 1] : null;
  try {
    const output = results ? summary(evaluateRun(results)) : { schemaVersion: '1.0.0', status: 'blocked', reason: 'Benchmark execution is blocked: no generated UI artifacts exist for the three conditions and six tasks.', spec: loadSpec() };
    console.log(JSON.stringify(output, null, 2));
    process.exit(output.status === 'complete' ? 0 : 2);
  } catch (error) { console.error(error.message); process.exit(2); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
