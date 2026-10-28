// Run: node tests/core.test.js   (no dependencies)
const assert = require('node:assert/strict');
const { parseContext, buildContext, ctxMd, contentMd, planDependencies, applyPolicy, gen, iconScore, inferFromFrames, buildPrompt, promptData, referenceMd, iconsMd, tokensCss, aiControlMd, levelLine, referenceFiles, refDoc, enrichModel} = require('../src/core.js');
let n = 0; const fails = []; const t = (name, fn) => { try { fn(); n++; console.log('✓ ' + name); } catch (e) { fails.push(name); console.log('✗ ' + name + ': ' + String(e.message).split('\n')[0].slice(0, 200)); } };

// ---- Context
t('context omitted: valid, no fabricated content', () => {
  const C = buildContext({}, ['Selected scope contains 2 page(s) and 5 top-level frame(s).']);
  assert.equal(C.provided, false); assert.equal(C.users.length, 0); assert.equal(C.inferences.length, 0);
  assert.ok(C.facts.every(f => f.source === 'figma')); assert.ok(C.unknown.includes('Users'));
  assert.match(ctxMd(C), /No user-provided context/);
});
t('context provided: user facts carry source=user', () => {
  const C = buildContext({ product: 'Acme', users: 'Designers, Developers', platforms: ['web'], direction: 'rtl' }, []);
  assert.equal(C.provided, true); assert.deepEqual(C.users, ['Designers', 'Developers']);
  assert.ok(C.facts.filter(f => f.source === 'user').length >= 4); assert.equal(C.localization.direction, 'RTL');
});
t('context never creates tokens', () => {
  const C = buildContext({ product: 'Brand: Acme' }, []); assert.equal(C.tokens, undefined); assert.ok(!JSON.stringify(C).includes('brand.acme'));
});
t('pasted context: labeled = user fact, keyword guess = inference with evidence+confidence', () => {
  const P = parseContext('# Product\nAcme Console\n## Users\n- Admins\n- Analysts\nIt ships as a web dashboard.');
  assert.equal(P.fields.product, 'Acme Console'); assert.deepEqual(P.fields.users, ['Admins', 'Analysts']);
  assert.ok(P.unmapped.some(x => /web dashboard/.test(x)));
  const inf = P.inferences.find(i => i.value === 'web'); assert.ok(inf && inf.confidence < 1 && inf.evidence.length);
  const C = buildContext({ pasted: 'Product: Acme\nIt ships as a web dashboard.' }, []);
  assert.ok(C.facts.some(f => f.source === 'user (pasted context)')); assert.equal(C.inferences[0].source, 'inference');
});
t('RTL inference from script, never from user-labeled direction', () => {
  const txt = 'این یک سیستم طراحی برای محصول داخلی است و کاربران آن فارسی زبان هستند';
  assert.equal(parseContext(txt).inferences.some(i => i.field === 'direction'), true);
  assert.equal(buildContext({ pasted: txt, direction: 'ltr' }, []).inferences.some(i => /RTL/.test(i.statement)), false);
});
t('rejected inference is dropped from output', () => {
  const C = buildContext({ pasted: 'a web app' }, []); const id = C.inferences[0].id;
  assert.ok(ctxMd(C).includes('[inference')); assert.ok(!ctxMd(C, [id]).includes('[inference'));
});

// ---- Dependencies
const byId = { a: { name: 'color.primary' }, b: { name: 'color.blue.600' }, c: { name: 'radius.sm' } };
const expand = id => id === 'a' ? ['b'] : [];
const btn = { name: 'Button', _tokenIds: ['a', 'c'], _nested: [{ name: 'Icon', nodeId: '1:1', remote: false }] };
const plan = planDependencies([btn], [], new Set(), byId, expand);
t('token alias dependency is transitive and has reasons', () => {
  assert.deepEqual(plan.tokenDeps.map(d => d.name), ['color.blue.600', 'color.primary', 'radius.sm']);
  assert.deepEqual(plan.tokenDeps[0].requiredBy, [{ by: 'color.primary', reason: 'Alias target' }]);
  assert.equal(plan.tokenDeps[1].requiredBy[0].reason, 'Bound variable');
});
t('nested component dependency detected as missing', () => { assert.equal(plan.missing[0].name, 'Icon'); assert.equal(plan.missing[0].requiredBy[0].reason, 'Nested component instance'); });
t('selection is not a dependency', () => {
  const p = planDependencies([btn], [], new Set(['a']), byId, expand); assert.ok(!p.tokenDeps.some(d => d.id === 'a'));
});
t('auto include', () => { const r = applyPolicy(plan, 'auto_include', {}); assert.equal(r.tokenIds.length, 3); assert.equal(r.components.length, 1); assert.equal(r.warnings.length, 0); });
t('ask before include: only approved items', () => {
  const r = applyPolicy(plan, 'ask', { include: ['token:c'] }); assert.deepEqual(r.tokenIds, ['c']); assert.equal(r.components.length, 0); assert.ok(r.warnings.length >= 2);
});
t('ignore + warning: nothing included, never silent', () => {
  const r = applyPolicy(plan, 'ignore', {}); assert.equal(r.tokenIds.length, 0);
  assert.match(r.warnings.find(w => w.code === 'DEPENDENCY_EXCLUDED').message, /Button depends on 2 token\(s\).*incomplete/);
  assert.match(r.warnings.find(w => w.entityId === 'color.primary').message, /color.primary depends on 1 token/);
});
t('missing component: user can include or continue anyway; remote cannot be included', () => {
  assert.equal(applyPolicy(plan, 'ignore', { components: { Icon: 'include' } }).components.length, 1);
  assert.equal(applyPolicy(plan, 'auto_include', { components: { Icon: 'continue' } }).warnings.some(w => w.code === 'DEPENDENCY_MISSING_COMPONENT'), true);
  const remote = planDependencies([{ name: 'B', _tokenIds: [], _nested: [{ name: 'Lib', nodeId: 'x', remote: true }] }], [], new Set(), byId, expand);
  assert.equal(applyPolicy(remote, 'auto_include', { components: { Lib: 'include' } }).components.length, 0);
});

// ---- Output
t('generator: dependency marked, context rendered, max 6 md files', () => {
  const tok = { id: 'token.color.primary', figmaId: 'a', name: 'color.primary', category: 'color', categorySource: 'type', role: 'primitive', origin: 'dependency', requiredBy: ['Button'], usedBy: [], modes: { Light: { status: 'resolved', value: '#000000', chain: [] } } };
  const M = { fileName: 'f', pages: ['P'], tokens: [tok], styles: { text: [], paint: [], effect: [] }, components: [], screens: [], collections: [], sections: {}, depPolicy: 'auto_include', depSummary: { tokens: 1, components: 0 },
    context: buildContext({ product: 'Acme' }, ['x']), validation: { dims: [], issues: [], overall: null, errors: 0, warnings: 0, info: 0 } };
  const f = gen(M, 'standard', [], []); assert.ok(f.filter(x => x.path.endsWith('.md')).length <= 6);
  assert.ok(!/\(dependency\)/.test(f.find(x => x.path === 'tokens.md').content), 'label dropped when every token is a dependency'); assert.match(f.find(x => x.path === 'design.md').content, /Product: Acme/);
});

// ---- Content modes
const base = () => ({ fileName: 'f', pages: ['P'], tokens: [{ id: 'token.a', figmaId: 'a', name: 'color/primary', category: 'color', categorySource: 'type', role: 'semantic', origin: 'selection', requiredBy: [], usedBy: [], modes: { Light: { status: 'resolved', value: '#000000', chain: [] } } }],
  styles: { text: [{ name: 'H1', family: 'Inter', fstyle: 'Bold', font: 'Inter Bold', size: 32, lineHeight: 'auto', letterSpacing: '0px' }], paint: [], effect: [] },
  components: [{ id: 'component.button', figmaId: '1', name: 'Button', kind: 'component-set', page: 'P', description: '', origin: 'selection', requiredBy: [], variants: 3, properties: [], states: ['Default'], tokens: [], dependencies: [] }],
  screens: [{ name: 'Home', page: 'P', id: '2:1', w: 390 }], collections: [{ name: 'Theme', modes: ['Light'] }], sections: {}, depPolicy: 'auto_include', depSummary: { tokens: 0, components: 0 },
  validation: { dims: [], issues: [], overall: null, errors: 0, warnings: 0, info: 0 } });
t('auto mode: figma facts + marked inference, no user claims', () => {
  const C = buildContext({ notes: 'Internal admin tool' }, ['f'], [{ statement: 'Platform may include mobile', confidence: 0.6, evidence: ['3 of 3 frames are 480px wide or less'] }]);
  assert.equal(C.inferences.length, 1); assert.equal(C.inferences[0].source, 'inference'); assert.deepEqual(C.notes, ['Internal admin tool']); assert.equal(C.users.length, 0);
});
t('content pack: content.md only when requested; unknowns stay unknown; max 7 md files', () => {
  const M = base(); M.context = buildContext({ product: 'Acme' }, ['x']);
  assert.ok(!gen(M, 'standard', [], []).some(f => f.path === 'content.md'));
  M.contentPack = true; const files = gen(M, 'standard', [], []);
  const c = files.find(f => f.path === 'content.md').content;
  assert.match(c, /Name: Acme/); assert.match(c, /## To complete[\s\S]*Users/); assert.match(c, /Guidance for continuing/); assert.ok(!/_Not provided\._\n\n## Goals/.test(c), 'no empty headings');
  assert.ok(files.filter(f => f.path.endsWith('.md')).length <= 7); assert.ok(!files.some(f => f.path === 'typography.md'));
  assert.match(files.find(f => f.path === 'design.md').content, /`\.text-h1`/);
  assert.ok(gen(M, 'minimal', [], []).some(f => f.path === 'content.md'));
});
t('content pack: rejected inference removed', () => {
  const M = base(); M.contentPack = true; M.context = buildContext({}, [], [{ statement: 'Platform may include mobile', confidence: 0.6, evidence: ['e'] }]);
  assert.ok(contentMd(M, []).includes('may include mobile')); assert.ok(!contentMd(M, ['inf:0']).includes('may include mobile'));
});

// ---- Icons
t('icon detection: named, sized vector component is an icon', () => {
  const r = iconScore({ name: 'Icon/Arrow Right', w: 24, h: 24, page: 'Components', path: '', types: ['VECTOR'], hasText: false });
  assert.equal(r.isIcon, true); assert.ok(r.score >= 0.9); assert.ok(r.evidence.length >= 3);
});
t('icon detection: unnamed small vector-only component inside an Icons page', () => {
  assert.equal(iconScore({ name: 'arrow-right', w: 20, h: 20, page: 'Icons', path: '', types: ['VECTOR', 'FRAME'], hasText: false }).isIcon, true);
});
t('icon detection: buttons and big frames are not icons', () => {
  assert.equal(iconScore({ name: 'Button', w: 120, h: 40, page: 'Components', path: '', types: ['TEXT', 'RECTANGLE'], hasText: true }).isIcon, false);
  assert.equal(iconScore({ name: 'Home screen', w: 390, h: 844, page: 'App', path: '', types: ['FRAME'], hasText: false }).isIcon, false);
  assert.equal(iconScore({ name: 'Dot', w: 16, h: 16, page: 'Components', path: '', types: ['RECTANGLE'], hasText: false }).isIcon, false);
});
// ---- Frame inference
t('inference: platform from frame widths, RTL and Persian from names', () => {
  const f = inferFromFrames([{ w: 390 }, { w: 375 }, { w: 414 }], ['صفحه اصلی کاربران', 'ثبت نام و ورود به برنامه']);
  assert.ok(f.some(i => i.value === 'mobile')); assert.ok(f.some(i => i.value === 'RTL')); assert.ok(f.some(i => i.value === 'Persian'));
  assert.equal(inferFromFrames([{ w: 390 }], ['Home']).length, 0);
});
// ---- Prompt generator
const pdata = { name: 'Acme', platforms: ['web'], direction: 'LTR', users: ['Admins'], goals: [], themes: ['Theme [Light, Dark]'], sep: '/', files: ['design.md', 'tokens.md'],
  tokens: [{ name: 'color/primary', category: 'color', role: 'semantic', value: '#3F6FB5' }, { name: 'color/blue/600', category: 'color', role: 'primitive', value: '#3F6FB5' }],
  textStyles: ['Heading — Inter Bold 32px, line auto'], components: [{ name: 'Button', variants: 6, states: ['Default', 'Hover'], props: ['Size'] }], icons: ['Icon/Arrow'] };
t('prompt: complete, ordered structure; model-agnostic markdown', () => {
  const p = buildPrompt({ target: 'A settings screen', format: 'react', states: ['default', 'error'] }, pdata);
  const order = ['# ROLE', '# OBJECTIVE', '# PRODUCT CONTEXT', '# DESIGN SYSTEM', '# REQUIREMENTS', '# OUTPUT FORMAT', '# PROCESS', '# SELF-CHECK'].map(h => p.indexOf(h));
  assert.ok(order.every((x, i) => x >= 0 && (i === 0 || x > order[i - 1]))); assert.match(p, /Design: A settings screen/); assert.match(p, /color\/primary = #3F6FB5/); assert.match(p, /React \+ TypeScript/);
  assert.match(p, /Never invent/); assert.ok(!/<\/?antml|\{\{/.test(p));
});
t('prompt: semantic tokens preferred, missing data says Not provided, never invents', () => {
  const p = buildPrompt({}, { name: '', tokens: [], components: [] });
  assert.match(p, /Product: Not provided/); assert.match(p, /\[describe the screen/); assert.ok(!/color\//.test(p));
  assert.ok(!buildPrompt({ detail: 'standard' }, pdata).includes('color/blue/600'));
  assert.ok(buildPrompt({ detail: 'full' }, pdata).includes('color/blue/600'));
});
t('prompt: RTL adds mirroring requirement; accessibility can be turned off', () => {
  assert.match(buildPrompt({ direction: 'RTL' }, pdata), /RTL: mirror/); assert.ok(!/Accessibility:/.test(buildPrompt({ a11y: false }, pdata)));
});
// ---- Package: styles-only file, reference.md, 6 md files
t('package: styles-only file still produces tokens.md; reference.md only when frames exist; ≤ 7 md files', () => {
  const M = base(); M.tokens = []; M.styles = { text: [], paint: [{ name: 'Brand', value: '#FF0000', origin: 'library' }], effect: [{ name: 'Shadow/1', value: 'DROP_SHADOW 0 4 8 0 #00000040', origin: 'local' }] };
  M.context = buildContext({}, []); M.contentPack = true; M.icons = [{ name: 'Icon/Arrow', kind: 'component', w: 24, h: 24, confidence: 0.9, evidence: ['x'], usedIn: ['Home'], svg: '' }]; M.refs = [];
  let f = gen(M, 'standard', [], []); const tk = f.find(x => x.path === 'tokens.md').content;
  assert.match(tk, /Paint styles/); assert.match(tk, /library/); assert.match(tk, /Effect styles/);
  assert.match(f.find(x => x.path === 'components.md').content, /## Icons/); assert.ok(!f.some(x => x.path.startsWith('reference/')));
  M.refs = [{ id: '1:1', name: 'Home', page: 'P', w: 390, h: 844, nodes: 3, truncated: false, body: '<div data-name="Home" style="width:390px"></div>', links: [], fonts: {}, vars: [] }];
  f = gen(M, 'standard', [], []); const md = f.filter(x => x.path.endsWith('.md')); assert.ok(md.length <= 7); assert.ok(md.some(x => x.path === 'content.md') && md.some(x => x.path === 'ai-control.md'));
  assert.ok(f.some(x => x.path === 'reference/Home.html') && !f.some(x => x.path === 'reference/index.html'), 'one file per frame and no index'); assert.ok(gen(M, 'minimal', [], []).some(x => x.path === 'content.md'));
});
t('auto content: product name comes from file name as figma fact, not a user claim', () => {
  const C = buildContext({}, [], [], { name: 'Acme UI', description: 'Design system file with 3 component(s).' });
  assert.equal(C.product.name, 'Acme UI'); assert.equal(C.provided, false); assert.ok(C.facts.some(f => f.source === 'figma (file name)')); assert.ok(!C.unknown.includes('Product'));
  const U = buildContext({ product: 'Mine' }, [], [], { name: 'Acme UI' }); assert.equal(U.product.name, 'Mine');
  const I = buildContext({ platforms: ['web'] }, [], [{ field: 'platforms', statement: 'Platform may include mobile', confidence: 0.6, evidence: ['e'] }]); assert.equal(I.inferences.length, 0);
});

t('icons: unnamed icons are labeled; pack appears in components.md, content.md and the prompt', () => {
  const M = base(); M.context = buildContext({}, []); M.contentPack = true; M.iconPack = 'Lucide Icons';
  M.icons = [{ name: 'Icon/Arrow', named: true, label: 'Icon', kind: 'component', w: 24, h: 24, confidence: 0.9, evidence: ['name contains an icon keyword'], usedIn: ['Home'], svg: '' },
    { name: 'Unnamed icon 1 (24×24)', named: false, label: 'Icon', kind: 'frame', w: 24, h: 24, confidence: 0.55, evidence: ['has no meaningful name; identified by shape and size'], usedIn: ['Home'], svg: '' }];
  const im = iconsMd(M, enrichModel(M)); assert.match(im, /Icon pack: Lucide Icons \(chosen by you\)/); assert.match(im, /Unnamed icon 1/); assert.match(im, /1 without a meaningful name/);
  const f = gen(M, 'standard', [], []); assert.match(f.find(x => x.path === 'content.md').content, /pack: Lucide Icons/);
  assert.match(buildPrompt({ iconPack: 'Phosphor Icons' }, { icons: ['Icon/Arrow'], tokens: [], components: [] }), /Icon pack: Phosphor Icons/);
  assert.match(buildPrompt({}, {}), /Icon pack: Not provided/); assert.match(buildPrompt({}, {}), /Never draw custom icons/);
});
t('icon detection: unnamed small vector node qualifies from shape alone', () => {
  assert.equal(iconScore({ name: 'Vector 12', w: 24, h: 24, page: 'Home', path: 'Card', types: ['VECTOR'], hasText: false }).isIcon, true);
  assert.equal(iconScore({ name: 'Frame 5', w: 24, h: 24, page: 'Home', path: '', types: ['FRAME', 'VECTOR', 'VECTOR'], hasText: false }).isIcon, true);
  assert.equal(iconScore({ name: 'Frame 6', w: 24, h: 24, page: 'Home', path: '', types: ['FRAME', 'TEXT'], hasText: true }).isIcon, false);
});

// ---- CSS tokens (exact names, aliases, modes, text styles)
const mkTok = (name, cat, type, modes, role) => ({ id: 'token.' + name, figmaId: name, name, category: cat, categorySource: 'type', type, collection: 'Theme', role: role || 'primitive', origin: 'selection', requiredBy: [], usedBy: [], modes });
const R = (value, chain) => ({ status: 'resolved', value, chain: chain || [] });
const cssM = () => { const M = base(); M.fileName = 'Acme';
  M.tokens = [mkTok('Color/Blue/600', 'color', 'COLOR', { Light: R('#3F6FB5'), Dark: R('#6B9BE0') }),
    mkTok('Color/Primary', 'color', 'COLOR', { Light: R('#3F6FB5', ['Color/Blue/600']), Dark: R('#6B9BE0', ['Color/Blue/600']) }, 'semantic'),
    mkTok('Size/Medium', 'size', 'FLOAT', { Light: R('40'), Dark: R('40') }), mkTok('Spacing/16', 'spacing', 'FLOAT', { Light: R('16'), Dark: R('16') }), mkTok('Font/Weight/Bold', 'typography', 'FLOAT', { Light: R('700'), Dark: R('700') }),
    mkTok('Opacity/Disabled', 'opacity', 'FLOAT', { Light: R('40'), Dark: R('40') })];
  M.styles = { text: [{ name: 'Heading/H1', family: 'Inter', fstyle: 'Bold', font: 'Inter Bold', size: 32, lineHeight: '40px', letterSpacing: '-2%', origin: 'local' }], paint: [{ name: 'Brand', css: '#FF0000', value: '#FF0000', origin: 'local' }], effect: [{ name: 'Shadow/1', css: '0px 4px 8px 0px #00000040', value: 'x', origin: 'local' }] };
  M.context = buildContext({}, []); M.collections = [{ name: 'Theme', modes: ['Light', 'Dark'] }]; return M; };
t('tokens.css: exact Figma-derived names, aliases kept as var(), units, modes, text classes', () => {
  const c = tokensCss(cssM()).content;
  assert.match(c, /--color-blue-600: #3F6FB5; \/\* Color\/Blue\/600 \*\//); assert.match(c, /--color-primary: var\(--color-blue-600\);/);
  assert.match(c, /--size-medium: 40px;/); assert.match(c, /--spacing-16: 16px;/); assert.match(c, /--font-weight-bold: 700;/); assert.match(c, /--opacity-disabled: 0\.4;/);
  assert.match(c, /\[data-theme="dark"\][\s\S]*--color-blue-600: #6B9BE0;/); assert.ok(!/--color-primary: var\(--color-blue-600\);\s*\n\}[\s\S]*\[data-theme="dark"\][\s\S]*--color-primary/.test(c));
  assert.match(c, /\.text-heading-h1 \{[\s\S]*font-size: var\(--text-heading-h1-size\)/); assert.match(c, /--text-heading-h1-line-height: 40px;/); assert.match(c, /--text-heading-h1-letter-spacing: -0\.02em;/);
  assert.match(c, /--paint-brand: #FF0000;/); assert.match(c, /--shadow-shadow-1: 0px 4px 8px 0px #00000040;/); assert.match(c, /ai-control\.md/);
  assert.ok(!c.includes('[object Object]'));
});
t('tokens.css: name collisions are disambiguated deterministically, never overwritten', () => {
  const M = cssM(); M.tokens.push(mkTok('color/blue/600', 'color', 'COLOR', { Light: R('#000000') }));
  const N = require('../src/core.js').cssNameMap(M.tokens), a = N.byFigma['Color/Blue/600'], b = N.byFigma['color/blue/600'];
  assert.notEqual(a, b); assert.ok(a.startsWith('--color-blue-600-') && b.startsWith('--color-blue-600-'));
  const c = tokensCss(M).content; assert.ok(c.includes(a + ': #3F6FB5;')); assert.ok(c.includes(b + ': #000000;'));
  const shuffled = require('../src/core.js').cssNameMap(M.tokens.slice().reverse());
  assert.deepEqual(shuffled.byFigma, N.byFigma, 'input order cannot change semantic names');
});
t('package: tokens.css is shipped; design.md carries mandatory AI rules and text classes; components.md carries exact sizes', () => {
  const M = cssM(); M.contentPack = false; M.components[0].variantDims = [{ name: 'Size=Small', w: 80, h: 32 }, { name: 'Size=Medium', w: 96, h: 40 }];
  M.components[0].spec = [{ prop: 'height', raw: '40px', bound: 'Size/Medium' }, { prop: 'padding-left', raw: '16px', bound: 'Spacing/16' }, { prop: 'background-color', raw: '#3F6FB5', bound: 'Color/Primary', boundId: 'Color/Primary' }, { prop: 'text', node: 'Label', textStyle: 'Heading/H1', raw: '32px' }];
  const f = gen(M, 'standard', [], []), d = f.find(x => x.path === 'design.md').content, c = f.find(x => x.path === 'components.md').content;
  assert.ok(f.some(x => x.path === 'tokens.css')); assert.ok(gen(M, 'minimal', [], []).some(x => x.path === 'tokens.css'));
  assert.match(d, /Rules for AI agents \(mandatory\)/); assert.match(d, /MISSING TOKEN/); assert.match(d, /`\.text-heading-h1`/); assert.match(d, /tokens\.css/);
  assert.match(c, /Dimensions by variant/); assert.match(c, /Size=Medium \| 96px \| 40px/); assert.match(c, /height: var\(--size-medium\);/); assert.match(c, /padding: .*var\(--spacing-16\)/); assert.match(c, /background-color: var\(--color-primary\);/); assert.ok(!/#3F6FB5/.test(c.split('```css')[1].split('```')[0]), 'no literal color in Spec CSS'); assert.match(c, /"Label" → \.text-heading-h1/);
  assert.match(f.find(x => x.path === 'tokens.md').content, /`--color-primary`/);
});
t('prompt: tokens are given as exact CSS variables with the Figma name', () => {
  const M = cssM(); const d = require('../src/core.js').promptData(Object.assign(M, { icons: [], iconPack: '' }));
  const p = buildPrompt({ detail: 'full' }, d); assert.match(p, /var\(--color-primary\) = #3F6FB5\s+\/\* Color\/Primary \*\//); assert.match(p, /\.text-heading-h1/); assert.match(p, /Never write a literal color/);
});
t('token resolver: multi-level aliases retain stable IDs; broken and circular aliases are explicit', () => {
  const core = require('../src/core.js'), v = (id, name, value) => ({ id, name, variableCollectionId: 'c', resolvedType: 'COLOR', valuesByMode: { m: value } }), alias = id => ({ type: 'VARIABLE_ALIAS', id });
  const byId = { a: v('a', 'A', alias('b')), b: v('b', 'B', alias('c')), c: v('c', 'C', { r: 0, g: 0, b: 0 }) }, cols = { c: { defaultModeId: 'm' } };
  const r = core.resolve(byId.a, 'm', byId, cols); assert.equal(r.status, 'resolved'); assert.equal(r.value, '#000000'); assert.equal(r.aliasId, 'b'); assert.deepEqual(r.ids, ['b', 'c']); assert.deepEqual(r.chain, ['B', 'C']);
  assert.equal(core.resolve(v('x', 'Broken', alias('missing')), 'm', byId, cols).status, 'unresolved');
  const cycle = { a: v('a', 'A', alias('b')), b: v('b', 'B', alias('a')) }; assert.equal(core.resolve(cycle.a, 'm', cycle, cols).status, 'circular');
});
t('tokens.css: multiple collections and modes are preserved and naming is permutation-independent', () => {
  const core = require('../src/core.js'), M = cssM(), extra = mkTok('Other/Accent', 'color', 'COLOR', { Light: R('#111111'), Dark: R('#EEEEEE') }); extra.collection = 'Other'; M.tokens.push(extra); M.collections.push({ name: 'Other', modes: ['Light', 'Dark'] });
  const c = tokensCss(M).content; assert.match(c, /\/\* Theme \*\//); assert.match(c, /\/\* Other \*\//); assert.match(c, /--other-accent: #111111;/); assert.match(c, /\[data-theme="dark"\][\s\S]*--other-accent: #EEEEEE;/);
  const N = core.cssNameMap(M.tokens); [M.tokens.slice().reverse(), M.tokens.slice(3).concat(M.tokens.slice(0, 3)), M.tokens.slice().sort((a, b) => b.figmaId.localeCompare(a.figmaId))].forEach(tokens => assert.deepEqual(core.cssNameMap(tokens).byFigma, N.byFigma));
});
t('token resolution: equal values stay ambiguous, explicit bindings win, and font weights are valid CSS', () => {
  const core = require('../src/core.js'), M = cssM(), map = core.refTokenMap(M.tokens, M.styles); assert.equal(map.colors['#3F6FB5'], undefined); assert.ok(core.valueMatchIssues(M.tokens).some(i => i.code === 'TOKEN_VALUE_MATCH_AMBIGUOUS'));
  const regular = mkTok('Font/Weight/Regular', 'typography', 'STRING', { Light: R('Regular') }), custom = mkTok('Font/Weight/Custom', 'typography', 'STRING', { Light: R('CustomWeight') });
  assert.equal(core.cssValue(regular, 'Regular'), 400); assert.equal(core.cssValue(custom, 'CustomWeight'), null);
  const V = core.validate(Object.assign(M, { tokens: [custom] }), []); assert.ok(V.issues.some(i => i.code === 'TOKEN_INVALID_CSS_VALUE' && i.severity === 'error'));
});
t('token map: source, alias, mode and CSS counts are explainable and share one manifest calculation', () => {
  const core = require('../src/core.js'), M = cssM(), f = core.gen(M, 'full', [], []), TM = JSON.parse(f.find(x => x.path === 'metadata/token-map.json').content), man = JSON.parse(f.find(x => x.path === 'manifest.json').content);
  assert.equal(TM.stats.sourceTokens, M.tokens.length); assert.equal(TM.stats.aliasTokens, 1); assert.equal(TM.stats.modeValues.total, M.tokens.length * 2); assert.equal(TM.stats.modeValues.resolved, M.tokens.length * 2); assert.equal(TM.stats.cssVariables, M.tokens.length); assert.equal(TM.stats.notEmitted, 0); assert.equal(TM.stats.ambiguousValues, 1); assert.deepEqual(man.stats.tokens, TM.stats);
  const theme = TM.collections.find(c => c.name === 'Theme'); assert.equal(theme.defaultMode, 'Light'); assert.equal(theme.modes[1].theme, 'dark'); assert.equal(TM.tokens.find(t => t.name === 'Color/Primary').roleStatus, 'observed'); assert.match(f.find(x => x.path === 'tokens.md').content, /## Accounting/);
  M.tokens.push(mkTok('Color/Broken', 'color', 'COLOR', { Light: { status: 'unresolved', chain: ['Missing'] }, Dark: { status: 'unresolved', chain: ['Missing'] } }));
  const brokenFiles = core.gen(M, 'full', [], []), broken = JSON.parse(brokenFiles.find(x => x.path === 'metadata/token-map.json').content); assert.equal(broken.stats.notEmitted, 1); assert.equal(broken.stats.modeValues.unresolved, 2); assert.equal(broken.tokens.find(t => t.name === 'Color/Broken').status, 'unresolved'); assert.ok(!core.lintPackage(brokenFiles, M).findings.some(i => i.code === 'MANIFEST_TOKEN_MISSING'));
});
t('component graph: variants, tokens, dependencies and observed instances are retrievable from the index', () => {
  const core = require('../src/core.js'), M = cssM(), c = M.components[0]; c.figmaId = 'set:1'; c.variants = 2; c._tokenIds = ['Color/Primary']; c._nested = [{ name: 'Library Icon', nodeId: 'lib:icon', remote: true }, { name: 'Missing Icon', nodeId: 'missing:icon', remote: false }];
  const meta = (id, size) => ({ id, name: 'Size=' + size, familyId: 'set:1', familyName: 'Button', variantProperties: { Size: size } });
  M.componentHtml = { engine: 'fig-engine@test', ok: [
    { id: c.id, name: 'Button', figmaId: 'set:1', nodeId: 'v:medium', isDefault: true, className: 'button', html: '<button>OK</button>', css: '.button{color:var(--color-primary)}', w: 96, h: 40, nodes: 1, vars: ['--color-primary'], meta: meta('v:medium', 'Medium') },
    { id: c.id + '.variant.v-small', name: 'Button / Size=Small', figmaId: 'v:small', nodeId: 'v:small', variantOf: 'set:1', isDefault: false, className: 'button-small', html: '<button>OK</button>', css: '.button-small{color:var(--color-primary)}', w: 80, h: 32, nodes: 1, vars: ['--color-primary'], meta: meta('v:small', 'Small') }
  ], failed: [] };
  M.refs = [{ id: 'fr:1', name: 'Home', page: 'P', w: 390, h: 844, nodes: 2, truncated: false, body: '<div></div>', links: [], fonts: {}, vars: [], components: [{ id: 'v:medium', name: 'Size=Medium', familyId: 'set:1', familyName: 'Button', variantProperties: { Size: 'Medium' }, instances: [{ id: 'i:1', name: 'CTA' }] }] }];
  const files = core.gen(M, 'standard', [], []), index = JSON.parse(files.find(f => f.path === 'components/index.json').content), family = index.graph.families[0];
  assert.equal(index.graph.families.length, 1); assert.equal(family.variants.length, 2); assert.deepEqual(family.variants.map(v => v.properties.Size), ['Medium', 'Small']); assert.equal(family.extraction.status, 'extracted');
  assert.deepEqual(family.tokens.map(t => t.figmaId), ['Color/Primary']); assert.deepEqual(family.dependencies.map(d => d.status), ['external', 'missing']);
  assert.equal(family.instances[0].id, 'i:1'); assert.equal(family.instances[0].file, 'reference/Home.html'); assert.deepEqual(family.usedIn, ['Home.html']);
  assert.equal(index.graph.stats.instances, 1); assert.equal(index.graph.stats.externalDependencies, 1); assert.equal(index.graph.stats.missingDependencies, 1); assert.ok(!core.lintPackage(files, M).findings.some(i => i.code.indexOf('COMPONENT_GRAPH_') === 0));
});
t('patterns: deterministic structure grouping preserves evidence, states and exceptions', () => {
  const core = require('../src/core.js'), M = cssM();
  const structure = (root, instance, size) => ({ id: root, tag: 'div', children: [
    { id: instance, tag: 'button', componentId: 'v:' + size, componentName: 'Size=' + size, componentFamilyId: 'set:1', componentFamilyName: 'Button', variantProperties: { Size: size }, children: [{ id: instance + ':text', tag: 'span', children: [] }] },
    { id: root + ':copy', tag: 'p', children: [] }
  ] });
  const ref = (id, name, page, w, body, tree) => ({ id, name, page, w, h: 844, nodes: 3, truncated: false, body, css: '', links: [], fonts: {}, vars: [], files: [], structure: tree || null });
  M.refs = [
    ref('fr:2', 'Checkout', 'Flows', 1440, '<div class="generated-b">ignored</div>', structure('fr:2', 'i:2', 'Small')),
    ref('fr:1', 'Home', 'Screens', 390, '<div class="generated-a">ignored</div>', structure('fr:1', 'i:1', 'Medium')),
    ref('fr:3', 'Fallback', 'Screens', 390, '<div class="generated-c"><p>Visible text is not a fingerprint input</p></div>')
  ];
  const first = core.patternData(M), repeated = first.patterns.find(p => p.occurrences.length === 2);
  assert.deepEqual(first.stats, { references: 3, patterns: 2, repeatedPatterns: 1, groupedReferences: 2, singletonPatterns: 1 });
  assert.equal(repeated.status, 'Observed'); assert.deepEqual(repeated.occurrences.map(o => o.referenceId), ['fr:2', 'fr:1']);
  assert.ok(repeated.exceptions.some(e => e.type === 'viewport-size')); assert.ok(repeated.exceptions.some(e => e.type === 'component-variant'));
  assert.ok(repeated.occurrences[1].nodes.some(n => n.id === 'i:1')); assert.equal(repeated.occurrences[1].evidenceLevel, 'figma-ir');
  assert.ok(!JSON.stringify(repeated.structure).includes('i:1')); assert.ok(!JSON.stringify(repeated.structure).includes('generated-a'));
  const fingerprints = first.patterns.map(p => p.fingerprint).sort();
  M.refs.reverse(); M.refs.forEach(r => { if (r.structure) r.structure.id = 'changed:' + r.id; });
  const second = core.patternData(M); assert.deepEqual(second.patterns.map(p => p.fingerprint).sort(), fingerprints, 'reference order and node IDs cannot change fingerprints');
  assert.ok(second.patterns.some(p => p.occurrences[0].evidenceLevel === 'reference-html'), 'built-in HTML remains usable with explicit evidence limits');
  const files = core.gen(M, 'standard', [], []), index = JSON.parse(files.find(f => f.path === 'components/index.json').content);
  assert.deepEqual(index.patterns.stats, second.stats); assert.match(files.find(f => f.path === 'design.md').content, /## Patterns/);
  assert.ok(!core.lintPackage(files, M).findings.some(i => i.code.indexOf('PATTERN_') === 0));
  const damaged = files.map(f => f.path === 'components/index.json' ? Object.assign({}, f, { content: f.content.replace('"references": 3', '"references": 99') }) : f);
  assert.ok(core.lintPackage(damaged, M).findings.some(i => i.code === 'PATTERN_STATS_MISMATCH'), 'lint detects counts that bypass structure grouping');
});
t('reference index: contextual component, pattern, token and link retrieval stays exact', () => {
  const core = require('../src/core.js'), M = cssM();
  const ref = (id, name, body, links) => ({ id, name, page: 'Screens', w: 390, h: 844, nodes: 2, truncated: false, body, css: '', links: links || [], fonts: {}, vars: ['--color-primary'], files: [], structure: null });
  M.refs = [
    ref('fr:1', 'Home', '<div><button type="button" data-component="Size=Medium" data-component-id="v:medium" data-component-family="Button" data-component-family-id="set:1" data-variant-size="Medium"><span>Buy</span></button></div>', ['fr:2', 'fr:missing']),
    ref('fr:2', 'Settings', '<div><p>Preferences</p></div>')
  ];
  const files = core.gen(M, 'standard', [], []), index = JSON.parse(files.find(f => f.path === 'components/index.json').content), home = index.references.entries.find(e => e.id === 'fr:1');
  assert.equal(index.references.stats.references, 2); assert.equal(index.references.stats.withComponents, 1); assert.equal(index.references.stats.resolvedLinks, 1); assert.equal(index.references.stats.unresolvedLinks, 1);
  assert.equal(home.file, 'reference/Home.html'); assert.deepEqual(home.componentIds, ['v:medium']); assert.deepEqual(home.familyIds, ['set:1']); assert.equal(home.components[0].instanceId, 'fr:1');
  assert.equal(home.components[0].variantProperties.Size, 'Medium'); assert.deepEqual(home.vars, ['--color-primary']); assert.equal(home.patterns.length, 1);
  assert.deepEqual(home.links, [{ destinationId: 'fr:2', status: 'resolved', file: 'reference/Settings.html' }, { destinationId: 'fr:missing', status: 'unresolved-in-package', file: null }]);
  assert.match(files.find(f => f.path === 'SKILL.md').content, /## Contextual retrieval[\s\S]*Filter `references\.entries`/);
  assert.ok(!files.some(f => f.path === 'reference/index.html')); assert.ok(!core.lintPackage(files, M).findings.some(i => i.code.indexOf('REFERENCE_INDEX_') === 0));
  const damaged = files.map(f => f.path === 'components/index.json' ? Object.assign({}, f, { content: f.content.replace('"withComponents": 1', '"withComponents": 2') }) : f);
  assert.ok(core.lintPackage(damaged, M).findings.some(i => i.code === 'REFERENCE_INDEX_STATS_MISMATCH'));
});
// ---- Icon rules
t('icon detection: standard sizes and vector-only shapes (20×20, vector) are icons; rules are tunable', () => {
  const d = { name: 'Frame 9', w: 20, h: 20, page: 'Home', path: '', types: ['FRAME', 'VECTOR'], hasText: false };
  assert.equal(iconScore(d).isIcon, true); assert.ok(iconScore(d).evidence.some(e => /standard icon size 20×20/.test(e)));
  assert.equal(iconScore({ name: 'Vector', selfType: 'VECTOR', w: 18, h: 18, page: '', path: '', types: ['VECTOR'], hasText: false }).isIcon, true);
  assert.equal(iconScore(d, { max: 16 }).isIcon, false); assert.equal(iconScore({ name: 'Box', w: 20, h: 20, page: '', path: '', types: ['FRAME', 'RECTANGLE'], hasText: false }).isIcon, false);
  assert.equal(iconScore({ name: 'Frame 9', w: 22, h: 22, page: '', path: '', types: ['FRAME', 'VECTOR'], hasText: false }, { sizes: [22] }).evidence.some(e => /standard icon size/.test(e)), true);
});

// ---- AI control (adherence 0-10)
t('ai-control.md: front matter value, level behavior, always-rules, all 11 levels', () => {
  const m0 = aiControlMd(0), m7 = aiControlMd(7);
  assert.match(m0, /^---\nadherence_level: 0\n---/); assert.match(m7, /^---\nadherence_level: 7\n---/);
  assert.match(m0, /Current level: 0 — Strict/); assert.match(m7, /Current level: 7 — Creative/); assert.match(m7, /Proposed tokens/);
  assert.match(m0, /MISSING TOKEN/); assert.ok(!/Proposed tokens" list \(name, value, reason\) and reference it by that name\.\n\n## All/.test(m0));
  assert.match(m7, /Never write a literal color/); assert.match(m7, /Re-read it every time/); assert.match(aiControlMd(99), /adherence_level: 10/); assert.match(aiControlMd(-3), /adherence_level: 0/);
  for (let i = 0; i <= 10; i++) assert.match(aiControlMd(i), new RegExp('\\| ' + i + ' \\|'));
});
t('ai-control: every level keeps the no-literal-values rule; creativity never allows hand-set styles', () => {
  for (let i = 0; i <= 10; i++) { const m = aiControlMd(i); assert.match(m, /Never write a literal color, size, spacing, radius, shadow or font value/); assert.match(m, /Never edit tokens\.css/); }
});
t('package: ai-control.md ships with the chosen level; design.md points to it', () => {
  const M = cssM(); M.adherence = 6; const f = gen(M, 'standard', [], []);
  assert.match(f.find(x => x.path === 'ai-control.md').content, /adherence_level: 6/); assert.match(f.find(x => x.path === 'design.md').content, /adherence_level/); assert.match(f.find(x => x.path === 'tokens.css').content, /ai-control\.md/);
  assert.match(gen(cssM(), 'standard', [], []).find(x => x.path === 'ai-control.md').content, /adherence_level: 3/);
});
t('ai control: the slider has exactly five positions 0-4, each a real level of ai-control.md', () => {
  const s = require('../src/core.js').levelPicker();
  assert.deepEqual(s.map(x => x.position), [0, 1, 2, 3, 4], 'five discrete positions');
  assert.deepEqual(s.map(x => x.label), ['Strict', 'Conservative', 'Balanced', 'Creative', 'Open']);
  assert.deepEqual(s.map(x => x.rule), [100, 80, 60, 40, 20], 'rule adherence as specified');
  assert.deepEqual(s.map(x => x.creative), [0, 20, 40, 60, 80], 'creative freedom as specified');
  assert.deepEqual(s.map(x => x.adherence), [0, 2, 5, 7, 10], 'each position picks a real level of the file');
  assert.deepEqual(s.map(x => x.levelName), ['Strict', 'Faithful', 'Flexible', 'Creative', 'Open']);
  s.forEach(x => {
    assert.equal(x.rule + x.creative, 100);
    assert.match(aiControlMd(x.adherence), new RegExp('adherence_level: ' + x.adherence));
  });
});
t('prompt: adherence section tells the AI to read the file and gives a fallback summary', () => {  const p = buildPrompt({ adherence: 8 }, pdata); assert.match(p, /# CREATIVITY CONTROL/); assert.match(p, /Adherence level: 8 \/ 10/); assert.match(p, /ai-control\.md/); assert.match(p, /the file wins/); assert.match(p, /Exploratory/);
  assert.ok(!/CREATIVITY CONTROL/.test(buildPrompt({}, pdata)));
});
// ---- Reference HTML
t('reference: one HTML file per frame, named after the frame, only used token vars and prototype links', () => {
  const M = cssM(); M.collections = [{ name: 'Theme', modes: ['Light', 'Dark'] }];
  M.refs = [{ id: '1:1', name: 'Home screen', page: 'App', w: 390, h: 844, nodes: 4, truncated: false, body: '<div data-name="Home" data-go="1:2" style="width:390px;background-color:var(--color-primary, #3F6FB5)"></div>', links: ['1:2'], fonts: { Inter: [400, 700] }, vars: ['--color-primary'], notes: [] },
    { id: '1:2', name: 'Settings', page: 'App', w: 390, h: 844, nodes: 2, truncated: false, body: '<div></div>', links: [], fonts: {}, vars: [] }];
  const f = referenceFiles(M, M.tokens), by = p => (f.find(x => x.path === p) || {}).content || '';
  const home = by('reference/Home screen.html');
  assert.match(home, /<!doctype html>/); assert.match(home, /--color-primary: var\(--color-blue-600\)/); assert.match(home, /--color-blue-600: #3F6FB5/); assert.ok(!/--spacing-16/.test(home), 'only used variables are inlined');
  assert.match(home, /\[data-theme="dark"\]/, 'modes travel as CSS blocks, without a switcher UI');
  assert.match(home, /data-go="Settings\.html"/, 'a prototype link names the target frame file');
  assert.match(home, /family=Inter:wght@400;700/);
  assert.match(home, /<body>\n<div data-name="Home"[^>]*><\/div>\n<\/body>/, 'the body holds the frame and nothing else');
  assert.ok(!/<div class="bar"|<select|<script|index\.html|snapshots\/|thumbs\/|Compare|Fit|scaler/.test(home), 'no viewer chrome, no index, no Figma images');
  assert.deepEqual(f.map(x => x.path).sort(), ['reference/Home screen.html', 'reference/Settings.html'], 'the folder holds exactly one file per frame');
  assert.ok(!f.some(x => x.path === 'reference.md'));
});
t('reference: file names are the frame names, made filesystem-safe and unique', () => {
  const M = cssM();
  M.refs = [{ id: '1:1', name: 'Home/About', page: 'P', w: 10, h: 10, nodes: 1, truncated: false, body: '<i></i>', links: [], fonts: {}, vars: [] },
    { id: '1:2', name: 'Home/About', page: 'P', w: 10, h: 10, nodes: 1, truncated: false, body: '<i></i>', links: [], fonts: {}, vars: [] },
    { id: '1:3', name: '  صفحهٔ اصلی  ', page: 'P', w: 10, h: 10, nodes: 1, truncated: false, body: '<i></i>', links: [], fonts: {}, vars: [] }];
  assert.deepEqual(referenceFiles(M, M.tokens).map(x => x.path), ['reference/Home About.html', 'reference/Home About (2).html', 'reference/صفحهٔ اصلی.html']);
});
t('reference: the folder carries frames only — icons stay in components.md and icons.json', () => {
  const M = cssM(); M.refs = [{ id: '1:1', name: 'Home', page: 'P', w: 10, h: 10, nodes: 1, truncated: false, body: '<i></i>', links: [], fonts: {}, vars: [] }];
  M.icons = [{ name: 'Icon/Arrow', named: true, w: 24, h: 24, svg: '<svg viewBox="0 0 24 24"></svg>', evidence: [], usedIn: [] }];
  assert.deepEqual(referenceFiles(M, M.tokens).map(x => x.path), ['reference/Home.html']);
});

t('reference: custom fonts are inlined in the frame file, kept out of the Google link; images become shared files', () => {
  const M = cssM(); const big = 'A'.repeat(3000);
  M.refs = [{ id: '1:1', name: 'A', page: 'P', w: 100, h: 100, nodes: 1, truncated: false, body: '<img src="assets/x.png">', css: '', links: [], fonts: { 'Pinar-VF-FD': [400, 700], Inter: [400] }, vars: [], files: [{ path: 'assets/x.png', base64: big }], rtl: true },
    { id: '1:2', name: 'B', page: 'P', w: 100, h: 100, nodes: 1, truncated: false, body: '<img src="assets/x.png">', css: '', links: [], fonts: { Inter: [400] }, vars: [], files: [{ path: 'assets/x.png', base64: big }] }];
  const f = referenceFiles(M, M.tokens), by = p => (f.find(x => x.path === p) || {}).content || '', a = by('reference/A.html');
  assert.match(a, /font-family: "Pinar-VF-FD"; src: local\("Pinar-VF-FD"\)/, 'the @font-face rule is inside the frame file');
  assert.ok(!f.some(x => x.path === 'reference/fonts.css'), 'no separate stylesheet');
  assert.ok(!/family=Pinar/.test(a), 'custom font never goes into the Google link'); assert.match(a, /family=Inter:wght@400/); assert.match(a, /<html lang="en" dir="rtl">/);
  assert.match(a, /drop "Pinar-VF-FD\.woff2" into a fonts\/ folder/);
  assert.ok(!by('reference/B.html').includes('Pinar-VF-FD'), 'a frame without the custom font does not carry it');
  assert.equal(f.filter(x => x.path === 'reference/assets/x.png').length, 1, 'identical image stored once');
  const M2 = cssM(); M2.refEmbed = true; M2.refs = M.refs;
  const g = referenceFiles(M2, M2.tokens); assert.ok(!g.some(x => x.path === 'reference/assets/x.png'), 'embedded images travel inside the HTML');
});
t('reference: extractDataImages replaces large inline images with files and keeps tiny ones inline', () => {
  const m = new Map(), big = 'A'.repeat(2500), out = require('../src/core.js').extractDataImages('<img src="data:image/png;base64,' + big + '"><i style="background:url(data:image/png;base64,iVBORw0KGgo=)"></i>', m);
  assert.match(out, /<img src="assets\/[a-z0-9]+\.png">/); assert.match(out, /data:image\/png;base64,iVBORw0KGgo=/); assert.equal(m.size, 1);
});
t('files are sent in chunks and reassemble to the original', () => {
  const { sendFiles } = require('../src/core.js'); const sent = []; global.figma = { ui: { postMessage: m => sent.push(m) } };
  const big = 'x'.repeat(1500000); sendFiles([{ path: 'a.md', content: 'hi' }, { path: 'reference/big.html', content: big }, { path: 'reference/p.png', content: 'QUJD', binary: true }], { score: 100 });
  assert.equal(sent[0].type, 'files-begin'); assert.equal(sent[sent.length - 1].type, 'files-done'); const ch = sent.filter(m => m.type === 'file-chunk'); assert.equal(ch.length, 3);
  assert.equal(ch.sort((a, b) => a.data.i - b.data.i).map(m => m.data.part).join(''), big); assert.ok(sent.some(m => m.type === 'file' && m.data.binary)); delete global.figma;
});
t('package lint: JSON, Markdown, HTML and CSS defects are structured findings with file and location', () => {
  const core = require('../src/core.js'), M = cssM(); M.tokens = []; M.components = []; M.collections = [];
  const files = [
    { path: 'design.md', content: '# Design\n\n### Read order\n\n[Broken](missing.md)\n' },
    { path: 'reference/Home.html', content: '<a data-go="Missing.html">Go</a><img src="missing.png">' },
    { path: 'tokens.css', content: ':root { --ok: 1px; }\n.a { color: var(--missing); background: url("missing.png"); }' },
    { path: 'manifest.json', content: '{ invalid json' }
  ];
  const L = core.lintPackage(files, M), codes = L.findings.map(i => i.code);
  ['PACKAGE_BROKEN_REFERENCE', 'CSS_TOKEN_UNDEFINED', 'JSON_INVALID'].forEach(code => assert.ok(codes.includes(code), code)); assert.ok(L.findings.every(i => i.code && i.severity && i.file && i.location && i.message)); assert.ok(L.score < 100);
});
t('package lint: manifest/token mismatches and omitted mode selectors fail package integrity', () => {
  const core = require('../src/core.js'), M = cssM(), f = core.gen(M, 'full', [], []);
  assert.deepEqual(core.lintPackage(f, M).findings, []);
  const man = f.find(x => x.path === 'manifest.json'), data = JSON.parse(man.content), id = Object.keys(data.entities).find(k => data.entities[k].source.type === 'figma_variable'); data.entities[id].output.cssVar = '--not-real'; man.content = JSON.stringify(data);
  const css = f.find(x => x.path === 'tokens.css'); css.content = css.content.replace('[data-theme="dark"]', '[data-theme="night"]');
  const codes = core.lintPackage(f, M).findings.map(i => i.code); assert.ok(codes.includes('MANIFEST_TOKEN_MISSING')); assert.ok(codes.includes('THEME_MODE_MISSING'));
});
t('package quality: realistic file has no literal values or package-integrity findings, but warnings prevent a perfect self-check', () => {
  const core = require('../src/core.js'), M = require('./fixture-realistic.js')(), f = core.gen(M, 'standard', [], []), by = p => (f.find(x => x.path === p) || {}).content || '';
  assert.equal(M.lint.score, 95, JSON.stringify(M.lint.checks.filter(c => !c.pass))); assert.deepEqual(M.lint.findings, []);
  const md = f.filter(x => /\.md$/.test(x.path)); assert.ok(md.length <= 7); assert.ok(md.reduce((a, x) => a + Math.ceil(x.content.length / 4), 0) < 12000, 'total Markdown stays under 12k tokens');
  const comp = by('components.md'); assert.ok((comp.match(/^\| (vuesax|Unnamed)/gm) || []).length <= 80, 'icon library is not dumped'); assert.match(comp, /Icon pack: Iconsax \(inferred/); assert.match(comp, /## hero section \(2\)/); assert.match(comp, /## next&pervie bt \(2\)/);
  assert.match(by('tokens.css'), /--space-16: 16px;/); assert.match(by('tokens.css'), /--radius-12: 12px;/); assert.ok(!/\d\.\d{4,}/.test(by('tokens.css') + by('design.md')), 'no float noise');
  assert.match(by('design.md'), /### Read order/); assert.ok(!/Frame "/.test(by('design.md')) && !/Frame 21472/.test(by('content.md')), 'no generic frame names'); assert.match(by('content.md'), /26 icon sheet\(s\) were recognized/);
  assert.match(by('design.md'), /desktop|web or desktop/); assert.match(by('validation.md'), /Package self-check: 95 \/ 100/); assert.match(by('validation.md'), /## Fix first/);
  const css = comp.split('```css').slice(1).map(b => b.split('```')[0]).join('\n').replace(/\/\*.*?\*\//g, ''); assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), 'no literal colors in Spec CSS'); assert.ok(!/(padding|gap|radius)[^;]*\d+px/.test(css), 'no literal spacing in Spec CSS');
});
t('package quality: lint catches real defects', () => {
  const core = require('../src/core.js'), M = require('./fixture-realistic.js')(), f = core.gen(M, 'standard', [], []);
  const bad = f.map(x => x.path === 'components.md' ? Object.assign({}, x, { content: x.content + '\n```css\n.a {\n  padding: 13px;\n}\n```\n## hero section\n## hero section\n0.123456' }) : x);
  const L = core.lintPackage(bad, M); assert.ok(L.score < 100); assert.ok(L.checks.filter(c => !c.pass).map(c => c.id).includes('literals')); assert.ok(L.checks.filter(c => !c.pass).map(c => c.id).includes('unique'));
});
console.log('\n' + n + ' tests passed' + (fails.length ? ', ' + fails.length + ' FAILED' : '')); if (fails.length) process.exit(1);
