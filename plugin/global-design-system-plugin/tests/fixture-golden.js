// Deterministic package fixture: no clocks, random IDs or environment-dependent names.
const core = require('../src/core.js');
const R = value => ({ status: 'resolved', value, chain: [] });

module.exports = function build(options) {
  const reverse = !!(options && options.reverse);
  const token = (name, type, category, value) => ({ id: 'token.' + name.toLowerCase().replace(/[^a-z0-9]+/g, '.'), figmaId: 'var:' + name, name, type, category, categorySource: 'type', collection: 'Theme', collectionId: 'c1', defaultMode: 'Light', role: name === 'Color/Primary' ? 'semantic' : 'primitive', roleStatus: 'observed', roleSource: name === 'Color/Primary' ? 'figma-alias' : 'figma-value', origin: 'selection', requiredBy: [], usedBy: [], aliasIds: {}, modes: { Light: R(value), Dark: R(value) } });
  const tokens = [
    token('Color/Blue/600', 'COLOR', 'color', '#3F6FB5'),
    token('Color/Primary', 'COLOR', 'color', '#3F6FB5'),
    token('Size/Medium', 'FLOAT', 'size', '40'),
    token('Spacing/16', 'FLOAT', 'spacing', '16')
  ];
  tokens[0].modes.Dark = R('#6B9BE0');
  tokens[1].modes = { Light: { status: 'resolved', value: '#3F6FB5', aliasId: 'var:Color/Blue/600', chain: ['Color/Blue/600'] }, Dark: { status: 'resolved', value: '#6B9BE0', aliasId: 'var:Color/Blue/600', chain: ['Color/Blue/600'] } };
  const component = {
    spec: [{ prop: 'height', raw: '40px', bound: 'Size/Medium', boundId: 'var:Size/Medium' }, { prop: 'padding-left', raw: '16px', bound: 'Spacing/16', boundId: 'var:Spacing/16' }, { prop: 'background-color', raw: '#3F6FB5', bound: 'Color/Primary', boundId: 'var:Color/Primary' }],
    variantDims: [{ name: 'Size=Medium', w: 96, h: 40 }], icon: false, id: 'component.button', figmaId: 'set:1', name: 'Button', kind: 'component-set', page: 'Components', description: 'Primary action.', origin: 'selection', requiredBy: [], variants: 1,
    properties: [{ name: 'Size', type: 'VARIANT', default: 'Medium', options: ['Medium'] }], states: [], tokens: ['Color/Primary', 'Size/Medium', 'Spacing/16'], dependencies: [], _nested: [], _tokenIds: ['var:Color/Primary', 'var:Size/Medium', 'var:Spacing/16'], _styleIds: []
  };
  const meta = { id: 'v:medium', name: 'Size=Medium', familyId: 'set:1', familyName: 'Button', variantProperties: { Size: 'Medium' }, propertyDefinitions: { Size: { type: 'VARIANT', defaultValue: 'Medium', variantOptions: ['Medium'] } } };
  const structure = (root, instance) => ({ id: root, tag: 'div', children: [{ id: instance, tag: 'button', componentId: 'v:medium', componentName: 'Size=Medium', componentFamilyId: 'set:1', componentFamilyName: 'Button', variantProperties: { Size: 'Medium' }, control: 'button', children: [{ id: instance + ':label', tag: 'span', children: [] }] }] });
  const ref = (id, name, page, width) => ({ id, name, page, w: width, h: 844, nodes: 2, truncated: false, body: '<div class="generated"><button type="button" data-component="Size=Medium" data-component-id="v:medium" data-component-family="Button" data-component-family-id="set:1" data-variant-size="Medium"><span>Continue</span></button></div>', css: '', files: [], engine: 'fig-engine@1.0.0', rtl: false, links: id === 'fr:1' ? ['fr:2'] : [], fonts: { Inter: [400] }, vars: ['--color-primary'], components: [{ id: 'v:medium', name: 'Size=Medium', familyId: 'set:1', familyName: 'Button', variantProperties: { Size: 'Medium' }, propertyDefinitions: meta.propertyDefinitions, instances: [{ id: instanceIdOf(id), name: 'CTA' }] }], structure: structure(id, instanceIdOf(id)), notes: [] });
  const instanceIdOf = id => id === 'fr:1' ? 'i:1' : 'i:2';
  const refs = [ref('fr:1', 'Home', 'Screens', 390), ref('fr:2', 'Settings', 'Screens', 1440)];
  const components = [component];
  if (reverse) { tokens.reverse(); refs.reverse(); components.reverse(); }
  const M = {
    fileName: 'Golden UI', pages: ['Screens', 'Components'], tokens, components,
    styles: { text: [{ name: 'Heading/H1', family: 'Inter', fstyle: 'Bold', font: 'Inter Bold', size: 32, lineHeight: '40px', letterSpacing: '-2%', origin: 'local' }], paint: [], effect: [] },
    screens: [{ name: 'Home', page: 'Screens', id: 'fr:1', w: 390 }, { name: 'Settings', page: 'Screens', id: 'fr:2', w: 1440 }], icons: [], iconPack: '',
    collections: [{ id: 'c1', name: 'Theme', defaultMode: 'Light', modes: ['Light', 'Dark'], modeMap: { Light: 'm1', Dark: 'm2' } }], sections: {}, depPolicy: 'auto_include', depSummary: { tokens: 0, components: 0 }, adherence: 7, refs, refEmbed: true, contentPack: false,
    componentHtml: { ok: [{ id: 'component.button', name: 'Button', figmaId: 'set:1', nodeId: 'v:medium', variantOf: null, isDefault: true, className: 'button-golden', html: '<button class="button-golden" type="button"><span>Button</span></button>', css: '.button-golden{height:var(--size-medium);background-color:var(--color-primary);padding-left:var(--spacing-16);}', w: 96, h: 40, nodes: 2, vars: ['--size-medium', '--color-primary', '--spacing-16'], meta }], failed: [], engine: 'fig-engine@1.0.0', coverage: { sourceFamilies: 1, sourceVariants: 1, exportedFamilies: 1, exportedVariants: 1, failedVariants: 0 } },
    context: core.buildContext({ product: 'Golden' }, ['A deterministic fixture.'])
  };
  M.validation = core.validate(M, []);
  return M;
};
