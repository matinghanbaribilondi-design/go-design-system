#!/usr/bin/env node
// Standalone verification for a downloaded package. It rebuilds no model: every
// cross-file claim it checks is stated by the package itself.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_DIR = path.join(ROOT, 'schemas');
const TEXT = /\.(?:md|html|css|json)$/i;

function finding(code, severity, file, location, message) {
  return { code, severity, file, location: location || 'root', message };
}

function kindOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function equalJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function nameHash(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36);
}

function contentFingerprint(value) {
  const text = String(value || '');
  return 'fnv1a32-dual:' + nameHash(text) + '-' + nameHash('\u0000' + text) + '-' + text.length.toString(36);
}

export function validateSchema(schema, value, at = '$', out = []) {
  if (!schema || typeof schema !== 'object') return out;
  const actual = kindOf(value), types = schema.type === undefined ? [] : [].concat(schema.type);
  if (types.length && !types.some(t => t === actual || (t === 'number' && actual === 'integer'))) {
    out.push({ path: at, message: 'expected ' + types.join('|') + ', got ' + actual });
    return out;
  }
  if (schema.const !== undefined && !equalJson(schema.const, value)) out.push({ path: at, message: 'must equal ' + JSON.stringify(schema.const) });
  if (Array.isArray(schema.enum) && !schema.enum.some(x => equalJson(x, value))) out.push({ path: at, message: 'is not one of ' + JSON.stringify(schema.enum) });
  if (actual === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) out.push({ path: at, message: 'is shorter than ' + schema.minLength });
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) out.push({ path: at, message: 'does not match ' + schema.pattern });
  }
  if (actual === 'integer' || actual === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) out.push({ path: at, message: 'is less than ' + schema.minimum });
  }
  if (actual === 'array') {
    if (schema.minItems !== undefined && value.length < schema.minItems) out.push({ path: at, message: 'has fewer than ' + schema.minItems + ' item(s)' });
    if (schema.items) value.forEach((item, i) => validateSchema(schema.items, item, at + '[' + i + ']', out));
  }
  if (actual === 'object') {
    (schema.required || []).forEach(key => { if (!Object.prototype.hasOwnProperty.call(value, key)) out.push({ path: at, message: 'is missing required ' + key }); });
    Object.entries(schema.properties || {}).forEach(([key, sub]) => { if (Object.prototype.hasOwnProperty.call(value, key)) validateSchema(sub, value[key], at + '.' + key, out); });
  }
  return out;
}

function readPackage(root) {
  const files = new Map();
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const full = path.join(dir, entry.name), rel = path.relative(root, full).split(path.sep).join('/');
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) files.set(rel, TEXT.test(rel) ? fs.readFileSync(full, 'utf8') : null);
  });
  walk(root);
  return files;
}

function resolveLocal(from, raw) {
  let value = String(raw || '').trim();
  if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return null;
  const hash = value.indexOf('#'), anchor = hash >= 0 ? value.slice(hash + 1) : '';
  value = value.slice(0, hash >= 0 ? hash : undefined).split('?')[0];
  try { value = decodeURIComponent(value); } catch { return { invalid: true, anchor }; }
  const parts = (value.startsWith('/') ? [] : from.split('/').slice(0, -1)).concat(value.split('/')), normalized = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') { if (!normalized.length) return { invalid: true, anchor }; normalized.pop(); }
    else normalized.push(part);
  }
  return { path: normalized.join('/'), anchor };
}

function anchorOf(value) {
  return String(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
}

function checkReference(files, from, raw, location, out) {
  const target = resolveLocal(from, raw);
  if (!target) return;
  if (target.invalid) { out.push(finding('VERIFY_INVALID_REFERENCE', 'error', from, location, 'Invalid package-relative reference "' + raw + '".')); return; }
  const targetPath = target.path || from, content = files.get(targetPath);
  if (!files.has(targetPath)) { out.push(finding('VERIFY_BROKEN_REFERENCE', 'error', from, location, 'Target "' + raw + '" does not exist.')); return; }
  if (!target.anchor || typeof content !== 'string') return;
  const anchor = decodeURIComponent(target.anchor), found = /\.md$/i.test(targetPath)
    ? (content.match(/^#{1,6}\s+.+$/gm) || []).some(h => anchorOf(h.replace(/^#{1,6}\s+/, '')) === anchor)
    : new RegExp('\\bid=["\\\']' + anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\\\']').test(content);
  if (!found) out.push(finding('VERIFY_BROKEN_ANCHOR', 'error', from, location, 'Anchor "' + anchor + '" does not exist in ' + targetPath + '.'));
}

export function verifyPackage(packageDir) {
  const root = path.resolve(packageDir);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error('Package directory does not exist: ' + root);
  const files = readPackage(root), findings = [], parsed = {};
  ['SKILL.md', 'design.md', 'tokens.css'].forEach(name => { if (!files.has(name)) findings.push(finding('VERIFY_REQUIRED_FILE', 'error', name, 'root', 'Required package file is missing.')); });

  const schemaFor = {
    'manifest.json': 'manifest.schema.json',
    'metadata/token-map.json': 'token-map.schema.json',
    'components/index.json': 'components-index.schema.json',
    'reference/index.json': 'reference-index.schema.json',
    'metadata.json': 'metadata.schema.json',
    'validation-report.json': 'validation-report.schema.json',
    'icons.json': 'icons.schema.json'
  };
  Object.entries(schemaFor).forEach(([file, schemaName]) => {
    if (!files.has(file)) return;
    try { parsed[file] = JSON.parse(files.get(file)); }
    catch (e) { findings.push(finding('VERIFY_JSON_INVALID', 'error', file, 'root', e.message)); return; }
    try {
      const schema = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, schemaName), 'utf8'));
      validateSchema(schema, parsed[file]).forEach(e => findings.push(finding('VERIFY_SCHEMA_INVALID', 'error', file, e.path, e.message)));
    } catch (e) {
      findings.push(finding('VERIFY_SCHEMA_UNREADABLE', 'error', file, 'root', 'Could not load ' + schemaName + ': ' + e.message));
    }
  });

  files.forEach((content, file) => {
    if (content === null) return;
    if (/\.md$/i.test(file)) {
      const re = /!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)/g, at = () => 'line ' + content.slice(0, re.lastIndex).split('\n').length;
      let m; while ((m = re.exec(content))) checkReference(files, file, m[1] || m[2], at(), findings);
    }
    if (/\.html$/i.test(file)) {
      const re = /\b(?:href|src|data-go)\s*=\s*["']([^"']+)["']/g, at = () => 'line ' + content.slice(0, re.lastIndex).split('\n').length;
      let m; while ((m = re.exec(content))) checkReference(files, file, m[1], at(), findings);
      if (file.startsWith('reference/') && /<script\b/i.test(content)) findings.push(finding('VERIFY_REFERENCE_SCRIPT', 'error', file, 'root', 'A standalone reference must not contain a script.'));
    }
    if (/\.(?:css|html)$/i.test(file)) {
      const re = /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g, at = () => 'line ' + content.slice(0, re.lastIndex).split('\n').length;
      let m; while ((m = re.exec(content))) checkReference(files, file, m[2], at(), findings);
      const im = /@import\s+(?:url\()?\s*["']([^"']+)["']/g; while ((m = im.exec(content))) checkReference(files, file, m[1], 'line ' + content.slice(0, im.lastIndex).split('\n').length, findings);
    }
    if (/\.css$/i.test(file)) {
      const opens = (content.match(/\{/g) || []).length, closes = (content.match(/\}/g) || []).length;
      if (opens !== closes) findings.push(finding('VERIFY_CSS_BLOCK', 'error', file, 'root', 'CSS has ' + opens + ' opening and ' + closes + ' closing braces.'));
    }
  });

  const manifest = parsed['manifest.json'], tokenMap = parsed['metadata/token-map.json'], index = parsed['components/index.json'], referenceIndex = parsed['reference/index.json'], report = parsed['validation-report.json'], metadata = parsed['metadata.json'];
  if (manifest && tokenMap) {
    if (manifest.inventory.tokens !== tokenMap.stats.sourceTokens) findings.push(finding('VERIFY_TOKEN_COUNT', 'error', 'manifest.json', 'inventory.tokens', 'Manifest token count differs from token-map sourceTokens.'));
    if (!equalJson(manifest.stats.tokens, tokenMap.stats)) findings.push(finding('VERIFY_TOKEN_STATS', 'error', 'manifest.json', 'stats.tokens', 'Manifest token statistics differ from token-map statistics.'));
  }
  if (manifest && index) {
    if (manifest.inventory.componentVariants !== index.components.length || manifest.inventory.components !== index.graph.families.length) findings.push(finding('VERIFY_COMPONENT_COUNT', 'error', 'manifest.json', 'inventory', 'Manifest component counts differ from the component index.'));
    const referenceCount = referenceIndex ? referenceIndex.entries.length : index.references && index.references.stats ? index.references.stats.references : 0;
    if (manifest.inventory.references !== referenceCount || manifest.inventory.patterns !== index.patterns.stats.patterns) findings.push(finding('VERIFY_REFERENCE_COUNT', 'error', 'manifest.json', 'inventory', 'Manifest reference or pattern count differs from the reference index.'));
    if (!equalJson(manifest.stats.patterns, index.patterns.stats) || !equalJson(manifest.stats.references, index.references.stats)) findings.push(finding('VERIFY_SHARED_STATS', 'error', 'manifest.json', 'stats', 'Manifest and index statistics were not generated from the same calculation.'));
    if (index.coverage.exportedVariants !== index.components.length || index.coverage.failedVariants !== index.failed.length) findings.push(finding('VERIFY_COMPONENT_COVERAGE', 'error', 'components/index.json', 'coverage', 'Component coverage does not match exported and failed rows.'));
    if (index.graph.stats.exportedVariants !== index.components.length || index.graph.stats.failedVariants !== index.failed.length) findings.push(finding('VERIFY_GRAPH_STATS', 'error', 'components/index.json', 'graph.stats', 'Graph statistics disagree with component rows.'));
    if (index.patterns.stats.references !== index.patterns.patterns.reduce((n, p) => n + p.occurrences.length, 0)) findings.push(finding('VERIFY_PATTERN_COUNT', 'error', 'components/index.json', 'patterns.stats', 'Pattern statistics do not match their occurrence evidence.'));
    index.components.forEach(row => { if (row.file && !files.has(row.file)) findings.push(finding('VERIFY_COMPONENT_FILE', 'error', 'components/index.json', 'components.' + row.id, 'Component HTML is missing: ' + row.file)); });
    index.patterns.patterns.forEach(p => p.occurrences.forEach(o => { if (!files.has(o.file)) findings.push(finding('VERIFY_PATTERN_EVIDENCE', 'error', 'components/index.json', 'patterns.' + p.id, 'Pattern evidence file is missing: ' + o.file)); }));
    const pointer = index.references;
    if (pointer) {
      if ((referenceIndex || (manifest && manifest.inventory.references > 0) || pointer.index) && pointer.index !== 'reference/index.json') findings.push(finding('VERIFY_REFERENCE_INDEX_PATH', 'error', 'components/index.json', 'references.index', 'Reference index must point to reference/index.json.'));
      if (referenceIndex && !equalJson(pointer.stats, referenceIndex.stats)) findings.push(finding('VERIFY_REFERENCE_INDEX_STATS', 'error', 'components/index.json', 'references.stats', 'Reference pointer statistics differ from reference/index.json.'));
    }
  }
  if (referenceIndex) {
    if (manifest && manifest.inventory.references !== referenceIndex.entries.length) findings.push(finding('VERIFY_REFERENCE_COUNT', 'error', 'reference/index.json', 'entries', 'Manifest reference count differs from the Reference Index.'));
    referenceIndex.entries.forEach(e => {
      if (!files.has(e.file)) findings.push(finding('VERIFY_REFERENCE_FILE', 'error', 'reference/index.json', 'entries.' + e.id, 'Reference HTML is missing: ' + e.file));
      if (!(referenceIndex.classification.sourceEvidence || []).includes(e.file)) findings.push(finding('VERIFY_REFERENCE_CLASSIFICATION', 'error', 'reference/index.json', 'classification.sourceEvidence', 'Reference HTML is missing from source-evidence classification: ' + e.file));
      (e.links || []).forEach(link => {
        if (link.status === 'resolved' && !files.has(link.file)) findings.push(finding('VERIFY_REFERENCE_LINK', 'error', 'reference/index.json', 'entries.' + e.id + '.links', 'Resolved link target is missing: ' + link.file));
        if (link.status !== 'resolved' && link.file) findings.push(finding('VERIFY_REFERENCE_LINK', 'error', 'reference/index.json', 'entries.' + e.id + '.links', 'An unresolved link claims a target file.'));
      });
    });
    if (referenceIndex.cssMode.active) {
      if (!files.has('tokens.css')) findings.push(finding('VERIFY_SHARED_CSS', 'error', 'reference/index.json', 'cssMode', 'Shared Reference mode requires tokens.css.'));
      referenceIndex.entries.forEach(entry => { const html = files.get(entry.file); if (typeof html === 'string' && !html.includes('href="../tokens.css"')) findings.push(finding('VERIFY_SHARED_CSS', 'error', entry.file, 'head', 'Shared Reference does not link ../tokens.css.')); });
    } else {
      referenceIndex.entries.forEach(entry => { const html = files.get(entry.file); if (typeof html === 'string' && html.includes('href="../tokens.css"')) findings.push(finding('VERIFY_STANDALONE_CSS', 'error', entry.file, 'head', 'Standalone Reference unexpectedly links shared tokens.css.')); });
    }
  }
  if (manifest) {
    if (!files.has(manifest.validation.reportPath)) findings.push(finding('VERIFY_VALIDATION_REPORT', 'error', 'manifest.json', 'validation.reportPath', 'Validation report is missing.'));
    if (report && (manifest.validation.errorCount !== report.errors + report.packageErrorCount || manifest.validation.warningCount !== report.warnings + report.packageWarningCount)) findings.push(finding('VERIFY_VALIDATION_COUNTS', 'error', 'manifest.json', 'validation', 'Manifest validation counts differ from the complete validation report.'));
    if (manifest.source.fileKeyStatus === 'available' ? !manifest.source.fileKey : !!manifest.source.fileKey) findings.push(finding('VERIFY_SOURCE_ID', 'error', 'manifest.json', 'source', 'source.fileKey and source.fileKeyStatus disagree.'));
    if (metadata && metadata.generatorVersion !== manifest.generatorVersion) findings.push(finding('VERIFY_GENERATOR_VERSION', 'error', 'manifest.json', 'generatorVersion', 'Manifest and metadata generator versions differ.'));
    (manifest.dependencies && manifest.dependencies.bundledAssets || []).forEach(asset => { if (!files.has(asset.path)) findings.push(finding('VERIFY_MANIFEST_ASSET', 'error', 'manifest.json', 'dependencies.bundledAssets', 'Bundled asset is missing: ' + asset.path)); });
    if (manifest.outputs && Array.isArray(manifest.outputs.files)) {
      const listed = new Map(manifest.outputs.files.map(file => [file.path, file])), excluded = new Set((manifest.outputs.excluded || []).map(file => file.path));
      manifest.outputs.files.forEach(file => {
        if (!files.has(file.path)) { findings.push(finding('VERIFY_OUTPUT_MISSING', 'error', 'manifest.json', 'outputs.files.' + file.path, 'Fingerprinted output is missing: ' + file.path)); return; }
        const content = files.get(file.path);
        if (file.binary) return;
        if (typeof content !== 'string' || content.length !== file.length || contentFingerprint(content) !== file.fingerprint) findings.push(finding('VERIFY_OUTPUT_FINGERPRINT', 'error', 'manifest.json', 'outputs.files.' + file.path, 'Output content does not match its recorded fingerprint.'));
      });
      files.forEach((_, file) => { if (!listed.has(file) && !excluded.has(file)) findings.push(finding('VERIFY_UNEXPECTED_FILE', 'warning', file, 'root', 'File is not declared in manifest.outputs.')); });
    }
  }
  return { mode: 'package', root, files: files.size, errors: findings.filter(f => f.severity === 'error').length, warnings: findings.filter(f => f.severity === 'warning').length, findings };
}

const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|\b(?:black|white|red|blue|green|gray|grey|yellow|orange|purple|pink|brown|cyan|magenta)\b/i;
const LENGTH_LITERAL = /(?<![\w-])-?\d*\.?\d+(?:px|rem|em|%|pt|pc|vw|vh|vmin|vmax|ch|ex)\b/gi;
const ASSET_EXT = /\.(?:png|jpe?g|gif|webp|svg|avif|ico|woff2?|ttf|otf|eot|mp4|webm|pdf)$/i;
const CSS_WIDE = /^(?:inherit|initial|unset|revert|revert-layer)$/i;

function lineAt(content, index) {
  const before = String(content).slice(0, Math.max(0, index));
  return 'line ' + before.split('\n').length + ', column ' + (index - before.lastIndexOf('\n'));
}

function addUiFinding(out, seen, code, file, location, message) {
  const key = [code, file, location, message].join('|');
  if (seen.has(key)) return;
  seen.add(key); out.push(finding(code, 'error', file, location, message));
}

function scanCssDeclarations(content, file, base, state, add) {
  const masked = String(content).replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
  const blocks = /([^{}]+)\{([^{}]*)\}/g;
  let block;
  while ((block = blocks.exec(masked))) {
    const body = block[2], start = base + block.index + block[0].indexOf(body);
    const declarations = /([-\w]+)\s*:\s*([^;]+)/g;
    let declaration;
    while ((declaration = declarations.exec(body))) {
      const property = declaration[1].toLowerCase(), value = declaration[2].trim(), location = lineAt(state.full[file], start + declaration.index + declaration[0].indexOf(declaration[2]));
      state.declarations++;
      scanDeclaration(property, value, file, location, state, add);
    }
  }
}

function scanDeclaration(property, value, file, location, state, add) {
  if (property.startsWith('--')) state.localTokens.add(property);
  const stripped = value.replace(/var\([^)]*\)/g, ' ');
  const pure = stripped.trim(), hasLength = value => (value.match(LENGTH_LITERAL) || []).length > 0;
  const custom = property.startsWith('--') ? property.slice(2) : '';
  const isColor = !custom && /^(?:color|background(?:-color)?|(?:border(?:-(?:top|right|bottom|left|inline|block))?(?:-(?:color|start|end))?)|outline|text-decoration|caret-color|fill|stroke)$/.test(property);
  const isSpacing = !custom && /^(?:margin|padding)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?$|^(?:gap|row-gap|column-gap|border-radius|border-(?:top-left|top-right|bottom-left|bottom-right)-radius|inset|top|right|bottom|left|border(?:-(?:top|right|bottom|left))?(?:-width)?)$/.test(property);
  const isFont = !custom && /^(?:font-size|font-weight|line-height|letter-spacing|word-spacing|font-family)$/.test(property);
  const isShadow = !custom && /^(?:box-shadow|text-shadow)$/.test(property);
  if (custom) {
    if (/font|text|letter|line/i.test(custom) && (hasLength(pure) || /(?:^|\s)\d+(?:\.\d+)?(?:\s|$)/.test(pure))) add('UI_LITERAL_FONT', file, location, 'Custom property --' + custom + ' contains a literal typography value. Use a package typography token.');
    else if (/shadow/i.test(custom) && /(?:\d|#)/.test(pure)) add('UI_LITERAL_SHADOW', file, location, 'Custom property --' + custom + ' contains a literal shadow. Use a shadow token.');
    else if (COLOR_LITERAL.test(pure)) add('UI_LITERAL_COLOR', file, location, 'Custom property --' + custom + ' contains a literal color. Use a package color token.');
    else if (hasLength(pure)) add('UI_LITERAL_SPACING', file, location, 'Custom property --' + custom + ' contains a literal size or spacing value. Use a package token.');
    return;
  }
  const colorValue = pure.replace(/url\([^)]*\)/gi, ' ');
  if (isColor && !CSS_WIDE.test(value) && !/^(?:transparent|currentcolor|none)$/i.test(value) && COLOR_LITERAL.test(colorValue)) add('UI_LITERAL_COLOR', file, location, 'Literal color in ' + property + '. Use var(--token) from the package.');
  if (isSpacing && !CSS_WIDE.test(value)) {
    const lengths = pure.match(LENGTH_LITERAL) || [];
    if (lengths.some(x => Number.parseFloat(x) !== 0)) add('UI_LITERAL_SPACING', file, location, 'Literal spacing or size in ' + property + '. Use a spacing, radius or border token.');
  }
  if (isFont && !CSS_WIDE.test(value)) {
    const literal = hasLength(pure) || (property === 'font-weight' && /\b\d{2,3}\b/.test(pure)) || (property === 'line-height' && /\b\d+(?:\.\d+)?\b/.test(pure)) || (property === 'font-family' && pure && !/^var\(/.test(value));
    if (literal) add('UI_LITERAL_FONT', file, location, 'Literal typography in ' + property + '. Use a .text-* class or typography token.');
  }
  if (isShadow && !/^(?:none|inherit|initial|unset)$/i.test(value) && /(?:\d|#)/.test(pure)) add('UI_LITERAL_SHADOW', file, location, 'Literal shadow in ' + property + '. Use a package shadow token.');
}

function verifyUiAssets(raw, file, state, add, htmlAttr) {
  const target = resolveLocal(file, raw);
  if (!target) return;
  if (target.invalid || (!target.path && !target.anchor)) { add('UI_ASSET_MISSING', file, lineAt(state.full[file], Math.max(0, state.full[file].indexOf(raw))), 'Invalid local path "' + raw + '".'); return; }
  const targetPath = target.path || file;
  if (!state.available.has(targetPath)) add(htmlAttr === 'href' && !ASSET_EXT.test(targetPath) ? 'UI_LOCAL_REFERENCE' : 'UI_ASSET_MISSING', file, lineAt(state.full[file], Math.max(0, state.full[file].indexOf(raw))), 'Local target "' + raw + '" does not exist in the UI or package.');
}

export function verifyUI(uiDir, packageDir) {
  const root = path.resolve(uiDir), packageRoot = path.resolve(packageDir || '');
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error('UI directory does not exist: ' + root);
  if (!fs.existsSync(packageRoot) || !fs.statSync(packageRoot).isDirectory()) throw new Error('Package directory does not exist: ' + packageRoot);
  const uiFiles = readPackage(root), packageFiles = readPackage(packageRoot), findings = [], seen = new Set();
  const add = (code, file, location, message) => addUiFinding(findings, seen, code, file, location, message);
  const available = new Set([...uiFiles.keys(), ...packageFiles.keys()]);
  const tokensCss = packageFiles.get('tokens.css'), packageTokens = new Set((tokensCss || '').match(/--[\w-]+(?=\s*:)/g) || []);
  const allowedThemes = new Set(((tokensCss || '').match(/\[data-theme=["']([^"']+)["']\]/g) || []).map(x => x.replace(/^\[data-theme=["']|["']\]$/g, '')));
  if (!tokensCss) add('UI_PACKAGE_CONTEXT_MISSING', 'tokens.css', 'root', 'UI verification requires the package tokens.css.');
  let index = null;
  if (packageFiles.has('components/index.json')) {
    try { index = JSON.parse(packageFiles.get('components/index.json')); }
    catch (e) { add('UI_PACKAGE_INVALID', 'components/index.json', 'root', 'Component index is invalid JSON: ' + e.message); }
  }
  const families = new Map(), variants = new Map(), familyNames = new Map();
  if (index && Array.isArray(index.graph && index.graph.families)) index.graph.families.forEach(family => {
    families.set(family.id, family); familyNames.set(family.name, family);
    (family.variants || []).forEach(variant => { if (variant.id && variant.status === 'exported') variants.set(variant.id, { variant, family }); });
  });
  const state = { full: {}, uiFiles, packageFiles, available, tokens: new Set([...packageTokens]), localTokens: new Set(), allowedThemes, families, variants, familyNames, index, declarations: 0, componentMarkers: 0, html: 0, css: 0 };
  const htmlFiles = [...uiFiles.keys()].filter(f => /\.html?$/i.test(f));
  if (!htmlFiles.length) add('UI_SOURCE_MISSING', '.', 'root', 'No HTML files were found in the UI directory.');
  [...uiFiles.entries()].forEach(([file, content]) => { if (content !== null) state.full[file] = content; });

  [...uiFiles.entries()].forEach(([file, content]) => {
    if (content === null) return;
    if (/\.css$/i.test(file)) {
      state.css++;
      const opens = (content.match(/\{/g) || []).length, closes = (content.match(/\}/g) || []).length;
      if (opens !== closes) add('UI_CSS_MALFORMED', file, 'root', 'CSS has ' + opens + ' opening and ' + closes + ' closing braces.');
      scanCssDeclarations(content, file, 0, state, add);
      const re = /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g;
      let m; while ((m = re.exec(content))) verifyUiAssets(m[2], file, state, add, 'url');
    }
    if (/\.html?$/i.test(file)) {
      state.html++;
      [...content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].forEach(m => {
        const body = m[1], base = m.index + m[0].indexOf(body);
        if ((body.match(/\{/g) || []).length !== (body.match(/\}/g) || []).length) add('UI_CSS_MALFORMED', file, lineAt(content, m.index), 'Inline style block has unbalanced braces.');
        scanCssDeclarations(body, file, base, state, add);
      });
      const tags = /<([a-zA-Z][\w:-]*)([^>]*)>/g;
      let tag;
      while ((tag = tags.exec(content))) {
        const attrs = {};
        const ar = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
        let a; while ((a = ar.exec(tag[2]))) attrs[a[1].toLowerCase()] = a[2] === undefined ? (a[3] === undefined ? a[4] : a[3]) : a[2];
        if (attrs.style) scanCssDeclarations(attrs.style, file, tag.index, state, add);
        ['src', 'href', 'poster'].forEach(name => { if (attrs[name] && !attrs[name].startsWith('#')) verifyUiAssets(attrs[name], file, state, add, name); });
        ['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color'].forEach(name => { const value = attrs[name]; if (value && !/^(?:none|currentcolor|transparent|inherit|initial|unset)$/i.test(value) && COLOR_LITERAL.test(value.replace(/url\([^)]*\)/gi, ' '))) add('UI_LITERAL_COLOR', file, lineAt(content, tag.index), 'Literal color in the ' + name + ' attribute. Use var(--token) or currentColor.'); });
        if (attrs['data-theme'] && !allowedThemes.has(attrs['data-theme'])) add('UI_MODE_UNSUPPORTED', file, lineAt(content, tag.index), 'Unsupported mode "' + attrs['data-theme'] + '". Package modes: ' + ([...allowedThemes].join(', ') || 'none') + '.');
        const familyId = attrs['data-component-family-id'], familyName = attrs['data-component-family'], componentId = attrs['data-component-id'];
        if (familyId || familyName || componentId) {
          state.componentMarkers++;
          if (!index) { add('UI_PACKAGE_CONTEXT_MISSING', file, lineAt(content, tag.index), 'A component marker cannot be checked without components/index.json.'); continue; }
          const found = componentId && variants.get(componentId), family = familyId ? families.get(familyId) : familyName ? familyNames.get(familyName) : found && found.family;
          if (!family) { add('UI_COMPONENT_UNKNOWN', file, lineAt(content, tag.index), 'Unknown component family "' + (familyId || familyName || componentId) + '".'); continue; }
          if (componentId && !variants.has(componentId)) { add('UI_VARIANT_INVALID', file, lineAt(content, tag.index), 'Component variant "' + componentId + '" is not an exported variant.'); continue; }
          if (found && found.family.id !== family.id) { add('UI_VARIANT_INVALID', file, lineAt(content, tag.index), 'Variant "' + componentId + '" does not belong to family "' + family.name + '".'); continue; }
          const props = Object.entries(attrs).filter(([key]) => key.startsWith('data-variant-')).map(([key, value]) => [key.slice(13), value]);
          const exported = family.variants.filter(v => v.status === 'exported'), axes = new Set();
          exported.forEach(v => Object.keys(v.properties || {}).forEach(key => axes.add(key.toLowerCase())));
          const unknown = props.filter(([axis]) => !axes.has(axis.toLowerCase()));
          if (unknown.length) { add('UI_VARIANT_INVALID', file, lineAt(content, tag.index), 'Unknown variant axis "' + unknown.map(x => x[0]).join(', ') + '" for family "' + family.name + '".'); }
          else if (props.length) {
            const matches = exported.filter(v => props.every(([axis, value]) => Object.entries(v.properties || {}).some(([key, current]) => key.toLowerCase() === axis.toLowerCase() && String(current) === String(value))));
            if (!matches.length) add('UI_VARIANT_INVALID', file, lineAt(content, tag.index), 'No exported "' + family.name + '" variant matches ' + props.map(x => x[0] + '=' + x[1]).join(', ') + '.');
          }
        }
      }
    }
  });

  [...uiFiles.entries()].forEach(([file, content]) => {
    if (content === null) return;
    const vars = /var\(\s*(--[\w-]+)/g;
    let m; while ((m = vars.exec(content))) if (!state.tokens.has(m[1]) && !state.localTokens.has(m[1])) add('UI_TOKEN_UNDEFINED', file, lineAt(content, m.index), 'Token ' + m[1] + ' is not defined in the package or this UI.');
  });
  const errors = findings.filter(f => f.severity === 'error').length, warnings = findings.filter(f => f.severity === 'warning').length;
  return { mode: 'ui', root, packageRoot, files: uiFiles.size, metrics: { html: state.html, css: state.css, declarations: state.declarations, componentMarkers: state.componentMarkers, packageTokens: state.tokens.size }, errors, warnings, findings, limitations: ['Static checks cannot prove visual similarity, usability or UX quality.'] };
}

function main() {
  const args = process.argv.slice(2), usage = 'Usage:\n  node scripts/verify.mjs <package-dir> [--json]\n  node scripts/verify.mjs package <package-dir> [--json]\n  node scripts/verify.mjs ui <ui-dir> --package <package-dir> [--json]';
  const flag = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const first = args[0];
  let result;
  try {
    if (first === 'ui') {
      const ui = args[1], pkg = flag('--package');
      if (!ui || ui.startsWith('--') || !pkg) { console.error(usage); process.exit(2); }
      result = verifyUI(ui, pkg);
    } else {
      const target = first === 'package' ? args[1] : first;
      if (!target || target.startsWith('--')) { console.error(usage); process.exit(2); }
      result = verifyPackage(target);
    }
    if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
    else {
      console.log('Verified ' + result.mode + ' in ' + result.root + ' (' + result.files + ' files)');
      console.log(result.errors + ' error(s), ' + result.warnings + ' warning(s)');
      result.findings.forEach(f => console.log('[' + f.severity + '] ' + f.code + ' ' + f.file + ' (' + f.location + '): ' + f.message));
    }
    process.exit(result.errors ? 1 : 0);
  } catch (e) {
    console.error('verify failed: ' + e.message);
    process.exit(2);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
