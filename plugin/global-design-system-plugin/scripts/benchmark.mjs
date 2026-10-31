#!/usr/bin/env node
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';

const require = createRequire(import.meta.url), core = require('../src/core.js');
const count = Math.max(10, Math.min(5000, Number(process.argv[2]) || 500));
const R = value => ({ status: 'resolved', value, chain: [] });
const tokens = [{ id: 'token.color.primary', figmaId: 'var:primary', name: 'Color/Primary', type: 'COLOR', category: 'color', categorySource: 'type', collection: 'Theme', role: 'semantic', roleStatus: 'observed', origin: 'selection', requiredBy: [], usedBy: [], aliasIds: {}, modes: { Light: R('#3F6FB5') } }];
const branch = (prefix, depth, out) => {
  const node = { id: prefix, tag: 'div', children: [] };
  out.push(node);
  if (depth > 0) node.children.push(branch(prefix + '-a', depth - 1, out), { id: prefix + '-text', tag: 'span', children: [] });
  return node;
};
const refs = Array.from({ length: count }, (_, i) => {
  const flat = [], structure = branch('n' + i, 4, flat);
  return { id: 'fr:' + i, name: 'Screen ' + (i + 1), page: 'P' + (i % 4), w: i % 3 ? 390 : 1440, h: 844, nodes: flat.length, truncated: false, body: '<div></div>', css: '', files: [], engine: 'fig-engine@benchmark', rtl: false, links: [], fonts: {}, vars: ['--color-primary'], components: [], structure, notes: [] };
});
const M = {
  fileName: 'Benchmark', pages: ['P0', 'P1', 'P2', 'P3'], tokens, components: [], styles: { text: [], paint: [], effect: [] }, screens: [], icons: [], iconPack: '', collections: [{ name: 'Theme', modes: ['Light'] }], sections: {}, depPolicy: 'auto_include', depSummary: { tokens: 0, components: 0 }, adherence: 0, refs, contentPack: false,
  context: core.buildContext({}, []), validation: { issues: [], dims: [], overall: null, errors: 0, warnings: 0, info: 0 }
};
const time = fn => { const start = performance.now(); const value = fn(); return { ms: Math.round((performance.now() - start) * 100) / 100, value }; };
const patterns = time(() => core.patternData(M)), index = time(() => core.referenceIndexData(M, patterns.value)), generated = time(() => core.gen(M, 'standard', [], []));
const size = generated.value.reduce((n, f) => n + (typeof f.content === 'string' ? f.content.length : 0), 0);
console.log(JSON.stringify({ references: count, nodesPerReference: refs[0].nodes, patterns: patterns.value.stats.patterns, patternDataMs: patterns.ms, referenceIndexMs: index.ms, packageMs: generated.ms, packageBytes: size, packageFiles: generated.value.length }, null, 2));
