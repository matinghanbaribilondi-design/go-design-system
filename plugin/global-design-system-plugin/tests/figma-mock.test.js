// Integration test with a mocked Figma Plugin API. Run: node tests/figma-mock.test.js
const assert = require('node:assert/strict');
const os = require('node:os');
const OUT_DIR = require('node:path').join(os.tmpdir(), 'gds-refout');
const out = [], store = {}, sizes = [];
const mkVariant = (name, w, h, extra) => Object.assign({ id: 'v:' + name, type: 'COMPONENT', name, width: w, height: h, findAll: () => [], layoutMode: 'HORIZONTAL', itemSpacing: 8, paddingTop: 0, paddingRight: 16, paddingBottom: 0, paddingLeft: 16, cornerRadius: 8,
  boundVariables: { height: { type: 'VARIABLE_ALIAS', id: 'var:size' }, paddingLeft: { type: 'VARIABLE_ALIAS', id: 'var:space' } }, fills: [{ type: 'SOLID', color: { r: 0.247, g: 0.435, b: 0.71 }, opacity: 1, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'var:primary' } } }], strokes: [], textStyleId: '' }, extra || {});
const label = { id: 't1', type: 'TEXT', name: 'Label', fontSize: 14, textStyleId: 'S:text2', boundVariables: {}, characters: 'Go' };
const small = mkVariant('Size=Small', 80, 32), med = mkVariant('Size=Medium', 96, 40, { findAll: () => [label], textStyleId: '' });
const set = { id: 'set:1', type: 'COMPONENT_SET', name: 'Button', description: '', width: 96, height: 40, children: [med, small], componentPropertyDefinitions: { 'Size': { type: 'VARIANT', defaultValue: 'Medium', variantOptions: ['Small', 'Medium'] } }, findAll: () => [], boundVariables: {} };
small.parent = set; med.parent = set;
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
const mkText = (id, chars, o) => Object.assign({ id, type: 'TEXT', name: chars, characters: chars, width: 200, height: 24, x: 0, y: 0, fontSize: 16, fontName: { family: 'Inter', style: 'Bold' }, textAutoResize: 'HEIGHT', textAlignHorizontal: 'LEFT', textAlignVertical: 'TOP',
  fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1, visible: true, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'var:primary' } } }], lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PIXELS', value: 0 }, layoutSizingHorizontal: 'FILL', layoutSizingVertical: 'HUG',
  getStyledTextSegments: () => [{ characters: chars.slice(0, 2), fontSize: 16, fontName: { family: 'Inter', style: 'Bold' }, fontWeight: 700, fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 }], lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PIXELS', value: 0 } }, { characters: chars.slice(2), fontSize: 16, fontName: { family: 'Inter', style: 'Regular' }, fontWeight: 400, fills: [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 1 }, opacity: 1 }], lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PIXELS', value: 0 } }] }, o || {});
const grad = { id: 'g1', type: 'RECTANGLE', name: 'Hero', width: 342, height: 120, x: 0, y: 0, cornerRadius: 16, layoutSizingHorizontal: 'FILL', layoutSizingVertical: 'FIXED', fills: [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: [{ position: 0, color: { r: 0.25, g: 0.44, b: 0.71, a: 1 } }, { position: 1, color: { r: 0.1, g: 0.1, b: 0.4, a: 1 } }], opacity: 1 }], strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.1 }], strokeWeight: 1, strokeAlign: 'INSIDE', effects: [{ type: 'DROP_SHADOW', offset: { x: 0, y: 4 }, radius: 12, spread: 0, color: { r: 0, g: 0, b: 0, a: 0.2 } }] };
const iconVec = { id: 'vec1', type: 'VECTOR', name: 'Vector 7', width: 20, height: 20, parent: null, findAll: () => [], exportAsync: async o => o.format === 'SVG' ? new Uint8Array(Buffer.from('<svg viewBox="0 0 20 20"><path d="M2 2h16v16H2z"/></svg>')) : '<svg viewBox="0 0 20 20"><path d="M2 2h16v16H2z"/></svg>' };
const btn = { id: 'b1', type: 'FRAME', name: 'Button', width: 342, height: 40, x: 0, y: 0, layoutMode: 'HORIZONTAL', itemSpacing: 8, paddingTop: 0, paddingRight: 16, paddingBottom: 0, paddingLeft: 16, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER', cornerRadius: 8, layoutSizingHorizontal: 'FILL', layoutSizingVertical: 'FIXED',
  fills: [{ type: 'SOLID', color: { r: 0.247, g: 0.435, b: 0.71 }, opacity: 1, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'var:primary' } } }], strokes: [], effects: [], children: [], reactions: [{ actions: [{ type: 'NODE', destinationId: 'fr:2', navigation: 'NAVIGATE' }] }] };
btn.children = [mkText('t2', 'Continue', { layoutSizingHorizontal: 'HUG' })];
const frame = { id: 'fr:1', type: 'FRAME', name: 'Home', width: 390, height: 844, parent: null, layoutMode: 'VERTICAL', itemSpacing: 16, paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24, primaryAxisAlignItems: 'MIN', counterAxisAlignItems: 'MIN', clipsContent: true,
  fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.12 }, opacity: 1 }], strokes: [], effects: [], children: [mkText('t1', 'Welcome back', { fontSize: 28 }), grad, btn, iconVec], findAllWithCriteria: () => [], findAll: fn => [iconVec].filter(fn),
  exportAsync: async () => png };
[grad, btn].concat(frame.children).forEach(c => { c.parent = frame; });
iconVec.parent = frame; iconVec.x = 24; iconVec.y = 400; iconVec.layoutSizingHorizontal = 'FIXED'; iconVec.layoutSizingVertical = 'FIXED'; iconVec.fills = []; iconVec.strokes = [];
const frame2 = { id: 'fr:2', type: 'FRAME', name: 'Settings', width: 390, height: 844, parent: null, fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 }], strokes: [], effects: [], children: [], findAllWithCriteria: () => [], findAll: () => [], exportAsync: async () => png };
const page = { id: 'p1', type: 'PAGE', name: 'Design System', children: [frame, frame2, set], loadAsync: async () => {}, parent: null, findAllWithCriteria: ({ types }) => [set].filter(n => types.includes(n.type)) };
set.parent = page; frame.parent = page; frame2.parent = page;
const defaults = n => { if (n.visible === undefined) n.visible = true; if (n.rotation === undefined) n.rotation = 0; if (n.opacity === undefined) n.opacity = 1; if (n.x === undefined) n.x = 0; if (n.y === undefined) n.y = 0; (n.children || []).forEach(defaults); };
[frame, frame2, set].forEach(defaults);
const nodes = { p1: page, 'set:1': set, 'fr:1': frame, 'fr:2': frame2 };
const vars = [{ id: 'var:primary', name: 'Color/Primary', resolvedType: 'COLOR', variableCollectionId: 'c1', valuesByMode: { m1: { r: 0.247, g: 0.435, b: 0.71 } } },
  { id: 'var:size', name: 'Size/Medium', resolvedType: 'FLOAT', variableCollectionId: 'c1', valuesByMode: { m1: 40 } }, { id: 'var:space', name: 'Spacing/16', resolvedType: 'FLOAT', variableCollectionId: 'c1', valuesByMode: { m1: 16 } }];
const styles = {
  text: [{ id: 'S:text1', type: 'TEXT', name: 'Heading/H1', fontName: { family: 'Inter', style: 'Bold' }, fontSize: 32, lineHeight: { unit: 'PIXELS', value: 40 }, letterSpacing: { unit: 'PERCENT', value: -2 } }],
  paint: [{ id: 'S:paint1', type: 'PAINT', name: 'Brand', paints: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 }, opacity: 1 }] }],
  effect: [{ id: 'S:eff1', type: 'EFFECT', name: 'Shadow/1', effects: [{ type: 'DROP_SHADOW', offset: { x: 0, y: 4 }, radius: 8, spread: 0, color: { r: 0, g: 0, b: 0, a: 0.25 } }] }] };
const libStyle = { id: 'S:text2', type: 'TEXT', remote: true, name: 'Lib/Body', fontName: { family: 'Inter', style: 'Regular' }, fontSize: 14, lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PIXELS', value: 0 } };
global.__html__ = '';
global.figma = { base64Encode: b => Buffer.from(b).toString('base64'), getImageByHash: () => null, showUI() {}, root: { name: 'Acme', children: [page] }, loadAllPagesAsync: async () => {}, notify() {}, closePlugin() {},
  ui: { postMessage: m => out.push(m), resize: (w, h) => sizes.push([w, h]) }, clientStorage: { getAsync: async k => store[k], setAsync: async (k, v) => { store[k] = v; }, deleteAsync: async k => { delete store[k]; } },
  variables: { getLocalVariablesAsync: async () => vars, getLocalVariableCollectionsAsync: async () => [{ id: 'c1', name: 'Theme', modes: [{ modeId: 'm1', name: 'Light' }], defaultModeId: 'm1' }] },
  getLocalTextStylesAsync: async () => styles.text, getLocalPaintStylesAsync: async () => styles.paint, getLocalEffectStylesAsync: async () => styles.effect,
  getStyleByIdAsync: async id => id === 'S:text2' ? libStyle : null, getNodeByIdAsync: async id => nodes[id] || null };
require('../code.js');
const send = async msg => { out.length = 0; await figma.ui.onmessage(msg); return out.slice(); };
const get = (arr, t) => (arr.find(m => m.type === t) || {}).data;
const collectFiles = msgs => { const files = [], parts = {}; msgs.forEach(m => { if (m.type === 'file') files.push({ path: m.data.path, content: m.data.content, binary: m.data.binary }); if (m.type === 'file-chunk') { const o = parts[m.data.path] = parts[m.data.path] || { p: [], n: m.data.n, b: m.data.binary }; o.p[m.data.i] = m.data.part; } }); Object.keys(parts).forEach(k => files.push({ path: k, content: parts[k].p.join(''), binary: parts[k].b })); return files; };
(async () => {
  const d = get(await send({ type: 'discover' }), 'discover');
  assert.equal(d.counts.styles, 3, 'discover counts local styles'); assert.deepEqual(d.styleList.map(x => x.kind).sort(), ['effect', 'paint', 'text']); assert.equal(d.counts.components, 1);
  const sel = { pageIds: ['p1'], collectionIds: ['c1'], categories: null, styles: true, icons: true, iconSvg: true, componentIds: ['set:1'], refFrameIds: ['fr:1', 'fr:2'], depPolicy: 'auto_include', sections: {}, iconPack: 'Lucide Icons' };
  await send({ type: 'detect', sel });
  const msgs = await send({ type: 'analyze', sel, ctx: { mode: 'auto' }, dd: {} });
  assert.ok(!msgs.some(m => m.type === 'error'), 'no error: ' + JSON.stringify((msgs.find(m => m.type === 'error') || {}).data));
  const an = get(msgs, 'analysis'); console.log('summary:', JSON.stringify(an.summary));
  assert.equal(an.summary.styles, 4, 'local (3) + library style used by a component (1)');
  const gen = collectFiles(await send({ type: 'generate', mode: 'standard', rejected: [], rejInf: [] })), by = p => (gen.find(f => f.path === p) || {}).content || '';
  const css = by('tokens.css'), tk = by('tokens.md'), cm = by('components.md'), dm = by('design.md'); assert.ok(get(await send({ type: 'generate', mode: 'standard', rejected: [], rejInf: [] }), 'files-done').lint.score >= 0, 'lint is sent');
  assert.match(css, /\.text-heading-h1/); assert.match(css, /--text-lib-body-size: 14px/); assert.match(css, /--paint-brand: #FF0000/); assert.match(css, /--shadow-shadow-1: 0px 4px 8px 0px #00000040/);
  assert.match(tk, /Paint styles/); assert.match(tk, /Effect styles/); assert.match(dm, /library/);
  assert.match(dm, /`\.text-lib-body`/); assert.match(cm, /Size=Medium \| 96px \| 40px/); assert.match(cm, /height: var\(--size-medium\)/); assert.match(cm, /→ \.text-lib-body/);
  assert.ok(an.summary.icons >= 1, 'unnamed 20×20 vector in a frame detected as icon'); assert.match(cm, /Unnamed icon/); assert.match(cm, /Lucide Icons/);
  const sub = (extra) => Object.assign({}, sel, extra);
  let a2 = get(await send({ type: 'analyze', sel: sub({ styleIds: ['S:text1'] }), ctx: { mode: 'skip' }, dd: {} }), 'analysis'); assert.equal(a2.summary.styles, 2, 'one chosen local style + library style used by the component');
  a2 = get(await send({ type: 'analyze', sel: sub({ styleIds: ['S:text1'], libStyles: false }), ctx: { mode: 'skip' }, dd: {} }), 'analysis'); assert.equal(a2.summary.styles, 1, 'library styles can be turned off');
  a2 = get(await send({ type: 'analyze', sel: sub({ styles: false }), ctx: { mode: 'skip' }, dd: {} }), 'analysis'); assert.equal(a2.summary.styles, 0, 'styles off');
  const fs = require('fs'), path = require('path'); const home = by('reference/home.html'); fs.rmSync(OUT_DIR, { recursive: true, force: true }); gen.forEach(f => { if (f.path.startsWith('reference/')) { const dest = OUT_DIR + '/' + f.path; fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, f.binary ? Buffer.from(f.content, 'base64') : f.content); } });
  assert.match(home, /\.home \{[\s\S]*display: flex;[\s\S]*flex-direction: column;[\s\S]*gap: 16px;/); assert.match(home, /\.home__hero \{[\s\S]*linear-gradient\(180deg/); assert.match(home, /background: var\(--color-primary\);/);
  assert.match(home, /box-shadow: 0px 4px 12px/); assert.match(home, /data-go="fr:2"/); assert.match(home, /"fr:2":"settings\.html"/); assert.match(home, /--color-primary: #3F6FB5/, 'only the used variable is inlined'); assert.ok(!/--spacing-16/.test(home));
  assert.match(home, /<svg/); assert.ok(!/snapshots\/|thumbs\/|Compare|data-v=/.test(home), 'reference HTML carries no Figma image and no compare controls');
  assert.ok(!gen.some(f => /\.(png|jpe?g|webp)$/i.test(f.path)), 'the package contains no Figma layer images');
  assert.match(by('reference/index.html'), /settings\.html/); assert.match(home, /class="home__button" data-go="fr:2"/);
  assert.equal(get(await send({ type: 'discover' }), 'discover').engine.id, 'fig-engine');
  assert.ok(get(await send({ type: 'discover' }), 'discover').engine.capabilities.includes('component'), 'engine exposes component export');
  const th = get(await send({ type: 'frame-thumb', id: 'fr:1' }), 'frame-thumb');
  assert.equal(th.id, 'fr:1'); assert.ok(th.dataUrl.startsWith('data:image/png;base64,'), 'reference card preview is a PNG data URL shown only in the UI');
  assert.equal(get(await send({ type: 'frame-thumb', id: 'fr:1' }), 'frame-thumb').dataUrl, th.dataUrl, 'preview is cached');
  assert.ok(get(await send({ type: 'frame-thumb', id: 'missing:1' }), 'frame-thumb').error, 'missing frame reports an error');
  sizes.length = 0;
  await send({ type: 'resize', w: 4000, h: 100 }); assert.deepEqual(sizes[0], [1400, 420], 'window size is clamped');
  await send({ type: 'resize', w: 1000, h: 800, commit: true }); assert.deepEqual(store['ui-size'], { w: 1000, h: 800 }, 'a committed drag is remembered for the next run');
  const fb = get(await send({ type: 'analyze', sel: Object.assign({}, sel, { refEngine: 'builtin' }), ctx: { mode: 'skip' }, dd: {} }), 'analysis'); assert.equal(fb.summary.refs, 2, 'built-in fallback engine still works');
  const gen2 = collectFiles(await send({ type: 'generate', mode: 'standard', rejected: [], rejInf: [] })); assert.match(gen2.find(f => f.path === 'reference/home.html').content, /data-name="Home"/, 'fallback renderer output');
  console.log('files:', gen.map(f => f.path).join(', ')); console.log('figma-mock tests passed');
})().catch(e => { console.error(e); process.exit(1); });
