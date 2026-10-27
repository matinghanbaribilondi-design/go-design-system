// A realistic model modeled on a real exported file: few variables (colors + weights), no spacing/radius tokens,
// duplicate component names, a 1000+ icon library, unbound text/colors, many generic frame names, icon sheets.
const core = require('../src/core.js');
const R = (v, chain) => ({ status: 'resolved', value: v, chain: chain || [] });
const tok = (name, cat, type, v, role, chain) => ({ id: 'token.' + name, figmaId: 'v:' + name, name, category: cat, categorySource: 'type', type, collection: 'sementic', role: role || 'primitive', origin: 'dependency', requiredBy: [], usedBy: [], modes: { 'Mode 1': R(v, chain) } });
module.exports = function build() {
  const tokens = [tok('Color/Primary/Main', 'color', 'COLOR', '#191919'), tok('Color/Content/Primary', 'color', 'COLOR', '#191919', 'semantic', ['Color/Primary/Main']), tok('Color/Background/Muted', 'color', 'COLOR', '#F5F5F5'), tok('Color/Border/Default', 'color', 'COLOR', '#E0E0E0'), tok('Color/Accent', 'color', 'COLOR', '#E0C6B8'),
    tok('Number/Weight/Regular', 'typography', 'FLOAT', '400'), tok('Number/Weight/Bold', 'typography', 'FLOAT', '700')];
  tokens.forEach((t, i) => { t.usedBy = i < 3 ? ['cart pd', 'hero section', 'next&pervie bt'] : []; });
  const text = [['Title/Large', 48, 'Bold', '56px'], ['Title/Medium', 20, 'Bold', '28px'], ['Body/Large', 16, 'Regular', '32px'], ['Body/Small', 14, 'Regular', '24px']].map(a => ({ name: a[0], family: 'Pinar-VF-FD', fstyle: a[2], font: 'Pinar-VF-FD ' + a[2], size: a[1], lineHeight: a[3], letterSpacing: '-0.2px', origin: 'local' }));
  const sp = (extra) => [{ prop: 'width', raw: '413px' }, { prop: 'height', raw: '642px' }, { prop: 'display', raw: 'flex' }, { prop: 'flex-direction', raw: 'column' }, { prop: 'gap', raw: '8px' }, { prop: 'padding-top', raw: '16px' }, { prop: 'padding-right', raw: '24px' }, { prop: 'padding-bottom', raw: '16px' }, { prop: 'padding-left', raw: '24px' },
    { prop: 'border-radius', raw: '12px' }, { prop: 'background-color', raw: '#F4F4F4' }, { prop: 'border-width', raw: '2px' }, { prop: 'border-color', raw: '#191919', bound: 'Color/Content/Primary' },
    { prop: 'text', node: 'title', size: 16, weight: 400, lh: 32, raw: '16px' }, { prop: 'text', node: 'price', size: 48, weight: 700, lh: 56, raw: '48px' }, { prop: 'text', node: 'tiny', size: 11, weight: 400, lh: 16, raw: '11px' }].concat(extra || []);
  const names = ['cart pd', 'hero section', 'hero section', 'next&pervie bt', 'next&pervie bt', 'navbar', 'footer', 'card', 'button', 'input', 'tabs', 'badge', 'modal'];
  const components = names.map((n, i) => ({ id: 'component.' + n.replace(/[^a-z]+/g, '-'), figmaId: '1:' + i, name: n, kind: i % 2 ? 'component' : 'component-set', page: 'core design', description: '', origin: 'selection', requiredBy: [], variants: i % 2 ? 1 : 2, properties: [], states: [], tokens: ['Color/Content/Primary'], dependencies: ['vuesax/linear/home', 'Header'], variantDims: i % 2 ? [] : [{ name: 'a', w: 413, h: 642 }, { name: 'b', w: 413, h: 642 }], spec: sp() }));
  const icons = [];
  for (let i = 0; i < 1008; i++) icons.push({ name: 'vuesax/' + ['linear', 'bold', 'outline', 'broken'][i % 4] + '/icon' + Math.floor(i / 4), named: true, label: 'Icon', kind: 'component', w: 24, h: 24, confidence: 0.85, evidence: ['x'], usedIn: [], svg: '' });
  for (let i = 0; i < 151; i++) icons.push({ name: 'Unnamed icon ' + (i + 1) + ' (24×24)', named: false, label: 'Icon', kind: 'frame', w: 24, h: 24, confidence: 0.55, evidence: ['y'], usedIn: i < 2 ? ['hero section'] : [], svg: '' });
  icons[0].usedIn = ['navbar', 'footer']; icons[1].usedIn = ['card'];
  const screens = [];
  for (let i = 0; i < 60; i++) screens.push({ name: 'Frame 21472363' + (10 + i), page: 'core design', id: '9:' + i, w: 1440 });
  for (let i = 0; i < 6; i++) screens.push({ name: i % 2 ? 'Frame 2147236400' : 'Login', page: 'some design', id: '8:' + i, w: 393 });
  for (let i = 0; i < 26; i++) screens.push({ name: ['Money', 'Arrow', 'Weather'][i % 3], page: 'Icons', id: '7:' + i, w: 880, sheet: true });
  const M = { fileName: 'Cafe UI', pages: ['core design', 'some design', 'Icons'], tokens, styles: { text, paint: [], effect: [] }, components, screens, icons, iconPack: '', collections: [{ name: 'sementic', modes: ['Mode 1'] }], sections: {}, depPolicy: 'auto_include', depSummary: { tokens: tokens.length, components: 0 }, adherence: 3, refs: [], contentPack: true,
    context: core.buildContext({}, [], core.inferFromFrames(screens.filter(s => !s.sheet), ['core design']), { name: 'Cafe UI', description: 'Design system file with 13 component(s).' }) };
  M.validation = core.validate(M, []);
  return M;
};
