// Global Design System — Figma <-> design.md compiler (v0.2, step-by-step)
// Flow: Discover -> Scope -> Sections -> Variables -> Components -> Dependencies -> Extract -> Review -> Generate
if (typeof figma !== 'undefined') {
  figma.showUI(__html__, { width: 920, height: 720 });
  figma.clientStorage.getAsync('ui-size').then(sz => { if (sz && sz.w && sz.h) { const s = uiSize(sz.w, sz.h); figma.ui.resize(s[0], s[1]); } });
}

const EXC = /(archive|old|draft|test|experiment|deprecated|legacy|temp|wip|sandbox)/i;
const REC = /(design system|foundation|token|component|ui kit|style|documentation|library|icon)/i;
const post = (type, data) => figma.ui.postMessage({ type, data });
const prog = (value, label) => post('progress', { value, label });
function uiSize(w, h) {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(v) || lo)));
  return [clamp(w, 520, 1400), clamp(h, 420, 1400)];
}
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unnamed';
const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase() +
  (c.a !== undefined && c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0').toUpperCase() : '');
const rgb = h => { h = h.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 }; };
let MODEL = null, DISC = null;

// ---------- Token helpers ----------
function fmt(val, type) {
  if (type === 'COLOR' && val && typeof val === 'object') return hex(val);
  if (typeof val === 'number') return String(Math.round(val * 1000) / 1000);
  if (typeof val === 'string' || typeof val === 'boolean') return String(val);
  return null;
}
function resolve(v, modeId, byId, colById) {
  const chain = [], ids = [], seen = new Set();
  let cur = v, mid = modeId;
  for (let i = 0; i < 25; i++) {
    if (seen.has(cur.id)) return { status: 'circular', chain, ids };
    seen.add(cur.id);
    if (!(mid in cur.valuesByMode)) mid = colById[cur.variableCollectionId].defaultModeId;
    const val = cur.valuesByMode[mid];
    if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') {
      const next = byId[val.id];
      if (!next) return { status: 'unresolved', chain, ids };
      chain.push(next.name); ids.push(next.id); cur = next; continue;
    }
    const f = fmt(val, cur.resolvedType);
    return f === null ? { status: 'invalid', chain, ids } : { status: 'resolved', value: f, chain, ids };
  }
  return { status: 'circular', chain, ids };
}
function category(v) {
  const n = v.name.toLowerCase();
  if (v.resolvedType === 'COLOR') return ['color', 'type'];
  const map = [['radius', /radius|corner/], ['spacing', /spacing|space|gap|padding|margin/], ['opacity', /opacity|alpha/],
    ['typography', /font|text|type|line|letter|weight/], ['size', /size|width|height/], ['border', /border|stroke/],
    ['z-index', /z-?index|layer/], ['motion', /motion|duration|ease/], ['breakpoint', /breakpoint/], ['shadow', /shadow|elevation/]];
  for (const [c, re] of map) if (re.test(n)) return [c, 'name-heuristic'];
  return ['other', 'name-heuristic'];
}

// ---------- Project Context (pure; user-provided vs figma facts vs inferences) ----------
const CTX_KEYS = { product: /^(product|project|app|brand|name)$/i, description: /^(description|summary|overview|about)$/i, users: /^(users?|audience|target users?|personas?|primary users?)$/i,
  goals: /^(goals?|objectives?|purpose|main goals?)$/i, capabilities: /^(capabilit(y|ies)|features?)$/i, flows: /^(flows?|journeys?|user flows?|main flows?)$/i,
  platforms: /^(platforms?)$/i, language: /^(languages?|locale)$/i, direction: /^(direction|dir|text direction)$/i };
const keyOf = s => Object.keys(CTX_KEYS).find(k => CTX_KEYS[k].test(String(s).trim().replace(/:$/, '')));
const splitList = s => String(s || '').split(/\n|;|,|•/).map(x => x.replace(/^\s*[-*]\s*/, '').trim()).filter(Boolean);
const PLAT = [['web', /\bweb(site)?\b|browser/i], ['mobile', /\bmobile\b|\bios\b|\bandroid\b|iphone/i], ['desktop', /\bdesktop\b|\bmac(os)?\b|\bwindows\b/i]];
const normPlat = s => { const hit = PLAT.find(p => p[1].test(s)); return hit ? hit[0] : 'other'; };
function parseContext(text) {
  const f = { product: '', description: '', users: [], goals: [], capabilities: [], flows: [], platforms: [], language: '', direction: '' }, notes = [];
  const put = (k, v) => { if (!v) return; if (['users', 'goals', 'capabilities', 'flows', 'platforms'].includes(k)) f[k].push(...splitList(v)); else f[k] = f[k] ? f[k] + ' ' + v : v; };
  let cur = null, sawBullet = false;
  const LISTS = ['users', 'goals', 'capabilities', 'flows', 'platforms'];
  String(text || '').split(/\r?\n/).forEach(raw => {
    const l = raw.trim(); if (!l) return;
    let m = l.match(/^#{1,6}\s*(.+?)\s*$/);
    if (m) { cur = keyOf(m[1]) || null; sawBullet = false; if (!cur) notes.push(m[1]); return; }
    m = l.match(/^[-*]?\s*([A-Za-z ]{2,24}):\s*(.*)$/);
    if (m && keyOf(m[1])) { cur = keyOf(m[1]); sawBullet = false; put(cur, m[2]); return; }
    const bullet = /^[-*\u2022]\s+/.test(l);
    if (cur && LISTS.includes(cur) && !bullet && sawBullet) { notes.push(l); cur = null; return; }
    if (bullet) sawBullet = true;
    if (cur) put(cur, l); else notes.push(l);
  });
  const inferences = [], t = String(text || '');
  if (!f.platforms.length) PLAT.forEach(p => { const mm = t.match(p[1]); if (mm) inferences.push({ field: 'platforms', value: p[0], statement: 'Platform may include ' + p[0], confidence: 0.6, evidence: ['pasted text mentions "' + mm[0] + '"'] }); });
  const rtl = (t.match(/[\u0590-\u08FF]/g) || []).length, letters = (t.match(/\p{L}/gu) || []).length;
  if (!f.direction && letters > 20 && rtl / letters > 0.3) inferences.push({ field: 'direction', value: 'RTL', statement: 'Text direction may be RTL', confidence: 0.8, evidence: [Math.round(rtl / letters * 100) + '% of letters in the pasted text are right-to-left script'] });
  return { fields: f, inferences, unmapped: notes };
}
const toList = v => Array.isArray(v) ? v.filter(Boolean) : splitList(v);
function buildContext(form, figmaFacts, figInf, auto) {
  form = form || {};
  const P = parseContext(form.pasted), pf = P.fields, facts = [], pick = (k, scalar) => {
    const fv = scalar ? String(form[k] || '').trim() : toList(form[k]);
    const empty = scalar ? !fv : !fv.length;
    if (!empty) return { v: fv, src: 'user' };
    const pv = pf[k]; return (scalar ? pv : pv.length) ? { v: pv, src: 'user (pasted context)' } : { v: scalar ? '' : [], src: null };
  };
  const C = { src: {}, descAuto: false, provided: false, product: { name: '', description: '' }, users: [], goals: [], capabilities: [], flows: [], platforms: [], localization: { language: '', direction: '' }, notes: [], facts, inferences: [], unknown: [] };
  const fill = (k, scalar, set, label) => { const r = pick(k, scalar); if (r.src) { C.src[label] = r.src; C.provided = true; set(r.v); (scalar ? [r.v] : r.v).forEach(x => facts.push({ statement: label + ': ' + x, source: r.src })); } else C.unknown.push(label); };
  fill('product', true, v => C.product.name = v, 'Product');
  fill('description', true, v => C.product.description = v, 'Description');
  fill('users', false, v => C.users = v, 'Users'); fill('goals', false, v => C.goals = v, 'Goals');
  fill('capabilities', false, v => C.capabilities = v, 'Capabilities'); fill('flows', false, v => C.flows = v, 'Flows');
  fill('platforms', false, v => C.platforms = v.map(x => /^(web|mobile|desktop|other)$/i.test(x) ? x.toLowerCase() : normPlat(x)).filter((x, i, a) => a.indexOf(x) === i), 'Platforms');
  fill('language', true, v => C.localization.language = v, 'Language'); fill('direction', true, v => C.localization.direction = v.toUpperCase(), 'Direction');
  if (auto && auto.name && !C.product.name) { C.product.name = auto.name; C.src.Product = 'figma (file name)'; C.unknown = C.unknown.filter(x => x !== 'Product'); facts.push({ statement: 'Product: ' + auto.name, source: 'figma (file name)' }); }
  if (auto && auto.description && !C.product.description) { C.product.description = auto.description; C.descAuto = true; C.unknown = C.unknown.filter(x => x !== 'Description'); facts.push({ statement: 'Description: ' + auto.description, source: 'auto (from file data)' }); }
  const notes = []; if (String(form.notes || '').trim()) { notes.push(String(form.notes).trim()); C.provided = true; }
  C.notes = notes.concat(P.unmapped);
  P.inferences.forEach(i => { const taken = i.field === 'direction' ? C.localization.direction : C.platforms.length; if (!taken) C.inferences.push({ id: 'inf:' + C.inferences.length, statement: i.statement, confidence: i.confidence, evidence: i.evidence, source: 'inference' }); });
  (figInf || []).filter(i => !((i.field === 'platforms' && C.platforms.length) || (i.field === 'direction' && C.localization.direction) || (i.field === 'language' && C.localization.language))).forEach(i => C.inferences.push({ id: 'inf:' + C.inferences.length, statement: i.statement, confidence: i.confidence, evidence: i.evidence, source: 'inference' }));
  (figmaFacts || []).forEach(s => facts.push({ statement: s, source: 'figma' }));
  return C;
}

// ---------- Dependencies (pure): plan -> policy ----------
function planDependencies(components, tokens, have, byId, expand) {
  const map = {}, q = [], add = (id, by, reason) => {
    if (have.has(id) || !byId[id]) return;
    let e = map[id]; if (!e) { e = map[id] = { key: 'token:' + id, kind: 'token', id, name: byId[id].name, requiredBy: [] }; q.push(id); }
    if (!e.requiredBy.some(r => r.by === by && r.reason === reason)) e.requiredBy.push({ by, reason });
  };
  components.forEach(c => c._tokenIds.forEach(id => add(id, c.name, 'Bound variable')));
  tokens.forEach(t => t._chainIds.forEach(id => add(id, t.name, 'Alias target')));
  while (q.length) { const id = q.pop(); expand(id).forEach(x => add(x, byId[id].name, 'Alias target')); }
  const sel = new Set(components.map(c => c.name)), miss = {};
  components.forEach(c => (c._nested || []).forEach(n => {
    if (sel.has(n.name)) return;
    const e = miss[n.name] || (miss[n.name] = { key: 'component:' + n.name, kind: 'component', name: n.name, nodeId: n.nodeId, remote: !!n.remote, requiredBy: [] });
    if (!e.requiredBy.some(r => r.by === c.name)) e.requiredBy.push({ by: c.name, reason: 'Nested component instance' });
  }));
  const byName = (a, b) => a.name.localeCompare(b.name);
  return { tokenDeps: Object.values(map).sort(byName), missing: Object.values(miss).sort(byName) };
}
// policy: 'auto_include' | 'ask' | 'ignore'; dd = { include: [keys] (ask), components: { name: 'include'|'continue' } }
function applyPolicy(plan, policy, dd) {
  dd = dd || {}; const inc = new Set(dd.include || []), cd = dd.components || {};
  const tokens = plan.tokenDeps.filter(d => policy === 'auto_include' || (policy === 'ask' && inc.has(d.key)));
  const comps = plan.missing.filter(m => !m.remote && (cd[m.name] === 'include' || (cd[m.name] !== 'continue' && (policy === 'auto_include' || (policy === 'ask' && inc.has(m.key))))));
  const tk = new Set(tokens.map(t => t.key)), ck = new Set(comps.map(c => c.key)), warn = [], cnt = {};
  plan.tokenDeps.filter(d => !tk.has(d.key)).forEach(d => d.requiredBy.forEach(r => cnt[r.by] = (cnt[r.by] || 0) + 1));
  Object.keys(cnt).sort().forEach(by => warn.push({ code: 'DEPENDENCY_EXCLUDED', severity: 'warning', entityId: by, message: by + ' depends on ' + cnt[by] + ' token(s) that are not included. The generated design.md may be incomplete.', recovery: 'Use Auto Include or review dependencies.' }));
  plan.missing.filter(m => !ck.has(m.key)).forEach(m => m.requiredBy.forEach(r => warn.push({ code: 'DEPENDENCY_MISSING_COMPONENT', severity: 'warning', entityId: r.by, message: r.by + ' contains nested component "' + m.name + '" which is not included' + (m.remote ? ' (library component, cannot be read)' : '') + '.', recovery: 'Expand scope or include the component.' })));
  return { tokenIds: tokens.map(t => t.id), tokenDeps: tokens, components: comps, warnings: warn };
}

// ---------- Icons & frame inference (pure) ----------
const VEC = ['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'POLYGON'];
const ICON_DEFAULT = { max: 64, min: 8, sizes: [12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48], selfVector: true, names: true };
let ICON_RULES = ICON_DEFAULT;
function iconScore(d, rules) {
  const R = Object.assign({}, ICON_DEFAULT, ICON_RULES, rules || {});
  let s = 0; const ev = [], nm = String(d.name || ''), ctx = (d.page || '') + ' ' + (d.path || '');
  if (R.names && /(^|[\s/_-])(icons?|ic|glyphs?|symbols?|pictograms?)([\s/_-]|$)/i.test(nm)) { s += 0.5; ev.push('name contains an icon keyword'); }
  if (R.names && /icon/i.test(ctx)) { s += 0.2; ev.push('lives in an icon-named page or group'); }
  const w = Math.round(d.w || 0), h = Math.round(d.h || 0), mx = Math.max(w, h), mn = Math.min(w, h);
  if (mx > 0 && mx <= R.max && mn >= R.min) {
    s += mx <= 32 ? 0.25 : 0.2; ev.push(w + '×' + h + 'px is icon-sized'); if (mn / mx >= 0.8) s += 0.05;
    if (Math.abs(w - h) <= 1 && R.sizes.includes(w) && R.sizes.includes(h)) { s += 0.2; ev.push('standard icon size ' + w + '×' + h); }
    if (R.selfVector && VEC.includes(d.selfType)) { s += 0.3; ev.push('is a vector shape'); }
  }
  const t = d.types || [];
  if (t.some(x => VEC.includes(x)) && t.every(x => VEC.includes(x) || ['FRAME', 'GROUP', 'ELLIPSE', 'RECTANGLE', 'COMPONENT', 'INSTANCE'].includes(x)) && !d.hasText) { s += 0.25; ev.push('contains vector shapes and no text'); }
  if (d.hasText) { s -= 0.4; ev.push('contains text (less likely an icon)'); }
  s = Math.max(0, Math.min(1, s));
  return { score: Math.round(s * 100) / 100, isIcon: s >= 0.55, evidence: ev };
}

// ---------- CSS tokens (pure): exact names, aliases kept as var(), modes as [data-theme] ----------
const cssVar = n => '--' + String(n).split('/').map(slug).join('-');
const fontWeightOf = sty => { sty = String(sty || '').toLowerCase(); return /black|heavy/.test(sty) ? 900 : /extra ?bold|ultra ?bold/.test(sty) ? 800 : /semi ?bold|demi/.test(sty) ? 600 : /bold/.test(sty) ? 700 : /medium/.test(sty) ? 500 : /extra ?light|ultra ?light/.test(sty) ? 200 : /light/.test(sty) ? 300 : /thin|hairline/.test(sty) ? 100 : 400; };
function cssUnit(t) {
  const n = t.name.toLowerCase(), c = t.category;
  if (['spacing', 'radius', 'size', 'border', 'breakpoint'].includes(c)) return 'px';
  if (c === 'typography') return /weight|family|style|ratio/.test(n) ? '' : 'px';
  if (c === 'motion') return /duration|delay|time/.test(n) ? 'ms' : '';
  return '';
}
function cssValue(t, v) {
  if (t.type === 'FLOAT') { let x = String(v); if (t.category === 'opacity' && Number(v) > 1) x = String(Math.round(Number(v)) / 100); return x + cssUnit(t); }
  if (t.type === 'STRING') return '"' + String(v).replace(/"/g, '\\"') + '"';
  return String(v);
}
const lhCss = s => s === 'auto' ? 'normal' : /%$/.test(s) ? String(Math.round(parseFloat(s) * 100) / 10000) : s;
const lsCss = s => /%$/.test(s) ? (Math.round(parseFloat(s) * 100) / 10000) + 'em' : s;
const styleSlug = n => String(n).split('/').map(slug).join('-');
function cssNameMap(tokens) {
  const used = {}, byFigma = {}, byName = {}, collisions = [];
  tokens.forEach(t => { let nm = cssVar(t.name); if (used[nm]) { collisions.push(t.name); let k = 2; while (used[nm + '-' + k]) k++; nm += '-' + k; } used[nm] = 1; byFigma[t.figmaId] = nm; byName[t.name] = nm; });
  return { byFigma, byName, collisions };
}
function tokensCss(M, tokens, only) {
  tokens = tokens || M.tokens;
  const N = cssNameMap(tokens), root = [], themes = {}, modeOrder = [];
  let keep = null;
  if (only) { keep = new Set(only); let ch = true; while (ch) { ch = false; tokens.forEach(t => { if (!keep.has(N.byFigma[t.figmaId])) return; Object.values(t.modes).forEach(r => { const a = r.chain && r.chain.length ? N.byName[r.chain[0]] : null; if (a && !keep.has(a)) { keep.add(a); ch = true; } }); }); } }
  const L = [];
  if (!only) L.push('/* tokens.css — generated from the Figma file "' + M.fileName + '"', ' * Rules: see design.md > "Rules for AI agents". Use ONLY the variables and .text-* classes below, written exactly.', ' * If a value is missing, follow ai-control.md for the current adherence level. Comments show the exact Figma names. */', '');
  const allDep = tokens.length > 0 && tokens.every(t => t.origin === 'dependency');
  const byCol = {}; tokens.forEach(t => (byCol[t.collection] = byCol[t.collection] || []).push(t));
  Object.keys(byCol).sort().forEach(col => {
    const list = byCol[col].filter(t => !keep || keep.has(N.byFigma[t.figmaId])); if (!list.length) return; const modes = Object.keys(list[0].modes);
    root.push('', '  /* ' + col + ' */');
    list.forEach(t => {
      const valOf = m => {
        const r = t.modes[m]; if (!r || r.status !== 'resolved' || t.type === 'BOOLEAN') return null;
        if (r.chain && r.chain.length && N.byName[r.chain[0]]) return 'var(' + N.byName[r.chain[0]] + ')';
        return cssValue(t, r.value);
      };
      const base = valOf(modes[0]), name = N.byFigma[t.figmaId];
      if (base === null) { root.push('  /* ' + name + ': ' + t.name + ' — unresolved or unsupported type, not emitted */'); return; }
      root.push('  ' + name + ': ' + base + '; /* ' + t.name + (!allDep && t.origin === 'dependency' ? ' (dependency)' : '') + ' */');
      modes.slice(1).forEach(m => {
        const v = valOf(m); if (v === null || v === base) return;
        const key = styleSlug(m); if (!themes[key]) { themes[key] = { mode: m, lines: [] }; modeOrder.push(key); }
        themes[key].lines.push('  ' + name + ': ' + v + ';');
      });
    });
  });
  const DV = !only && M.enriched ? M.enriched.derived : [];
  if (DV.length) { root.push('', '  /* derived from the design (no Figma variable exists for these values) */'); DV.forEach(d => root.push('  ' + d.css + ': ' + d.value + ';')); }
  const S = only ? { text: [], paint: [], effect: [] } : (M.styles || { text: [], paint: [], effect: [] }), tl = [];
  S.text.forEach(s => { const k = '--text-' + styleSlug(s.name); root.push('', '  /* text style: ' + s.name + ' */', '  ' + k + '-family: "' + s.family + '";', '  ' + k + '-size: ' + s.size + 'px;', '  ' + k + '-weight: ' + fontWeightOf(s.fstyle) + ';', '  ' + k + '-line-height: ' + lhCss(s.lineHeight) + ';', '  ' + k + '-letter-spacing: ' + lsCss(s.letterSpacing) + ';');
    tl.push('.text-' + styleSlug(s.name) + ' { /* ' + s.name + ' */\n  font-family: var(' + k + '-family);\n  font-size: var(' + k + '-size);\n  font-weight: var(' + k + '-weight);\n  line-height: var(' + k + '-line-height);\n  letter-spacing: var(' + k + '-letter-spacing);\n' + (/italic/i.test(s.fstyle) ? '  font-style: italic;\n' : '') + '}'); });
  S.paint.forEach(s => { if (s.css) root.push('  --paint-' + styleSlug(s.name) + ': ' + s.css + '; /* paint style: ' + s.name + ' */'); });
  S.effect.forEach(s => { if (s.css) root.push('  --shadow-' + styleSlug(s.name) + ': ' + s.css + '; /* effect style: ' + s.name + ' */'); });
  L.push(':root {' + root.join('\n') + '\n}');
  modeOrder.forEach(k => L.push('', '[data-theme="' + k + '"] { /* mode: ' + themes[k].mode + ' */\n' + themes[k].lines.join('\n') + '\n}'));
  if (tl.length) L.push('', '/* ---- Text styles ---- */', tl.join('\n\n'));
  return { content: L.join('\n') + '\n', names: N };
}

// ---------- Reference HTML documents (pure assembly) ----------
const fileSlug = (name, used) => { const base = slug(name); let k = base, i = 2; while (used[k]) k = base + '-' + i++; used[k] = 1; return k; };
const GOOGLE_FONTS = new Set('inter,roboto,open sans,lato,poppins,montserrat,vazirmatn,vazir,noto sans,noto sans arabic,noto naskh arabic,noto kufi arabic,nunito,nunito sans,raleway,source sans 3,source sans pro,dm sans,work sans,manrope,ibm plex sans,ibm plex sans arabic,playfair display,merriweather,cairo,tajawal,almarai,rubik,mulish,ubuntu,oswald,outfit,sora,plus jakarta sans,space grotesk,figtree,lexend,jost,barlow,karla,quicksand,josefin sans,fira sans,heebo,assistant,pt sans,roboto condensed,roboto mono,jetbrains mono,fira code,inconsolata,cormorant garamond,lora,libre baskerville,dm serif display,arvo,bebas neue,anton,archivo,red hat display,urbanist,albert sans,instrument sans,geist,readex pro,harmattan,lalezar,changa,reem kufi,markazi text,amiri,scheherazade new,mada,el messiri,baloo bhaijaan 2'.split(','));
const isGoogleFont = f => GOOGLE_FONTS.has(String(f).toLowerCase());
const fontsLink = f => { const fam = Object.keys(f || {}).filter(isGoogleFont); return fam.length ? '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + fam.map(n => 'family=' + encodeURIComponent(n).replace(/%20/g, '+') + ':wght@' + [...new Set((f[n] || []).concat([400]))].sort((a, b) => a - b).join(';')).join('&') + '&display=swap">' : ''; };
const fontsCss = all => Object.keys(all).filter(f => !isGoogleFont(f)).sort().map(f => '@font-face { font-family: "' + f + '"; src: local("' + f + '"), url("fonts/' + f + '.woff2") format("woff2"), url("fonts/' + f + '.ttf") format("truetype"), url("fonts/' + f + '.otf") format("opentype"); font-weight: 100 900; font-display: swap; }').join('\n');
function extractDataImages(text, files) {
  return String(text).replace(/data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/g, (m, kind, b64) => {
    if (b64.length < 2000) return m; let h = 5381; for (let i = 0; i < b64.length; i++) h = ((h << 5) + h + b64.charCodeAt(i)) | 0;
    const path = 'assets/' + (h >>> 0).toString(36) + b64.length.toString(36) + '.' + (kind === 'jpeg' ? 'jpg' : kind); if (!files.has(path)) files.set(path, b64); return path;
  });
}
const VIEWER_CSS = '*{box-sizing:border-box}html,body{margin:0;min-height:100%}body{font:13px/1.4 system-ui,-apple-system,"Inter",sans-serif;background:#ececee;color:#111}.bar{position:fixed;top:0;left:0;right:0;height:44px;background:#fff;border-bottom:1px solid #e5e5e5;display:flex;align-items:center;gap:12px;padding:0 16px;z-index:10}.bar a{color:#111;text-decoration:none;font-weight:600}.bar .t{color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bar .sp{flex:1}select{font:inherit;border:1px solid #d2d2d7;border-radius:8px;padding:3px 8px;background:#fff}.stage{padding:64px 24px 40px;display:flex;gap:24px;justify-content:center;align-items:flex-start}.pane{background:#fff;box-shadow:0 0 0 1px #e5e5e5,0 8px 24px rgba(0,0,0,.08);overflow:hidden}.frame{position:relative;overflow:hidden}:where(.frame,.frame *,.frame *::before,.frame *::after){box-sizing:border-box;margin:0;padding:0}:where(.frame button){font:inherit;color:inherit;background:transparent;border:none;cursor:pointer;text-align:inherit}:where(.frame img){display:block;max-width:100%}.frame{-webkit-font-smoothing:antialiased}';
function refDoc(M, r, fileOf, themes, vars, x) {
  x = x || {}; const map = {}; (r.links || []).forEach(id => { if (fileOf[id]) map[id] = fileOf[id]; });
  const th = themes.length ? '<select id="th" aria-label="Theme"><option value="">Theme: default</option>' + themes.map(t => '<option value="' + escH(t.key) + '">' + escH(t.label) + '</option>').join('') + '</select>' : '';
  return '<!doctype html>\n<html lang="en"' + (r.rtl ? ' dir="rtl"' : '') + '><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escH(r.name) + ' — reference</title>' + fontsLink(r.fonts) + (x.hasFonts ? '<link rel="stylesheet" href="fonts.css">' : '') + '\n<style>\n' + vars + '\n' + VIEWER_CSS + '\n' + (r.css || '') + '\n</style></head><body>\n' +
    '<div class="bar" dir="ltr"><a href="index.html">← All frames</a><span class="t">' + escH(r.page) + ' / ' + escH(r.name) + ' · ' + r.w + '×' + r.h + '</span><span class="sp"></span>' + th + '</div>\n' +
    '<div class="stage" dir="ltr"><div class="pane"><div class="frame"' + (r.rtl ? ' dir="rtl"' : '') + ' style="width:' + r.w + 'px;height:' + r.h + 'px">\n' + r.body + '\n</div></div></div>\n' +
    '<script>(function(){var MAP=' + JSON.stringify(map) + ';var th=document.getElementById("th");if(th)th.onchange=function(){if(this.value)document.documentElement.setAttribute("data-theme",this.value);else document.documentElement.removeAttribute("data-theme")};' +
    'document.querySelectorAll("[data-go]").forEach(function(el){el.addEventListener("click",function(e){var f=MAP[el.getAttribute("data-go")];if(f){e.stopPropagation();location.href=f}})});})();</script></body></html>\n';
}
function refIndex(M, refs, fileOf, pack, x) {
  x = x || {}; const custom = x.customFonts || [];
  const cards = refs.map(r => '<a class="card" href="' + fileOf[r.id] + '"><div class="t">' + escH(r.name) + '</div><div class="m">' + escH(r.page) + ' · ' + r.w + '×' + r.h + ' · ' + r.nodes + ' nodes' + (r.truncated ? ' · truncated' : '') + '</div></a>').join('\n');
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escH(M.fileName) + ' — reference frames</title>' + (x.hasFonts ? '<link rel="stylesheet" href="fonts.css">' : '') + '\n<style>' + VIEWER_CSS + '.wrap{max-width:1100px;margin:0 auto;padding:32px 24px}h1{font-size:22px;margin:0 0 4px}p{color:#6b6b6b;margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}.card{display:block;background:#fff;border-radius:12px;box-shadow:0 0 0 1px #e5e5e5;text-decoration:none;color:#111;overflow:hidden;padding:12px 14px}.card:hover{box-shadow:0 0 0 1px #111}.t{font-weight:600}.m{color:#8e8e93;font-size:12px;margin-top:3px}.note{background:#fff;border-radius:10px;box-shadow:0 0 0 1px #e5e5e5;padding:10px 14px;margin:0 0 16px;color:#6b6b6b;font-size:12px}</style></head><body><div class="wrap"><h1>' + escH(M.fileName) + '</h1><p>' + refs.length + ' frame(s) exported from Figma as HTML. Open a frame to view the rendered markup and switch themes.' + (pack ? ' <a href="icons.html">Icon sheet</a>' : '') + '</p>' +
    (custom.length ? '<div class="note"><b>Custom fonts:</b> ' + custom.map(escH).join(', ') + '. Copy the font files (e.g. <code>' + escH(custom[0]) + '.woff2</code>, <code>.ttf</code> or <code>.otf</code>) into <code>reference/fonts/</code> so text renders exactly as in Figma; otherwise a fallback font is used.</div>' : '') + '<div class="grid">\n' + cards + '\n</div></div></body></html>\n';
}
function iconsHtml(M) {
  const I = (M.icons || []).filter(i => i.svg);
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>Icons — ' + escH(M.fileName) + '</title><style>' + VIEWER_CSS + '.wrap{max-width:1100px;margin:0 auto;padding:32px 24px}h1{font-size:22px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}.c{background:#fff;border-radius:12px;box-shadow:0 0 0 1px #e5e5e5;padding:14px;text-align:center}.c .i{height:48px;display:grid;place-items:center}.c .i svg{max-width:40px;max-height:40px}.c b{display:block;font-size:11px;margin-top:8px;word-break:break-word}.c span{font-size:11px;color:#8e8e93}</style></head><body><div class="wrap"><h1>Icons' + (M.iconPack ? ' · ' + escH(M.iconPack) : '') + '</h1><div class="grid">\n' +
    I.map(i => '<div class="c"><div class="i">' + i.svg + '</div><b>' + escH(i.name) + '</b><span>Icon · ' + i.w + '×' + i.h + (i.named ? '' : ' · unnamed') + '</span></div>').join('\n') + '\n</div></div></body></html>\n';
}
function referenceFiles(M, toks) {
  const files = [], refs = M.refs || [], used = {}, fileOf = {}, themes = [], seen = {}, embed = !!M.refEmbed, bin = new Map(), allFonts = {};
  (M.collections || []).forEach(c => c.modes.slice(1).forEach(m => { const k = styleSlug(m); if (!seen[k]) { seen[k] = 1; themes.push({ key: k, label: m }); } }));
  refs.forEach(r => { fileOf[r.id] = fileSlug(r.name, used) + '.html'; Object.keys(r.fonts || {}).forEach(f => { allFonts[f] = (allFonts[f] || []).concat(r.fonts[f]); }); });
  const fcss = fontsCss(allFonts), custom = Object.keys(allFonts).filter(f => !isGoogleFont(f)).sort();
  refs.forEach(r => {
    if (!embed) (r.files || []).forEach(f => bin.set(f.path, f.base64));
    files.push({ path: 'reference/' + fileOf[r.id], content: refDoc(M, r, fileOf, themes, tokensCss(M, toks, new Set(r.vars || [])).content, { hasFonts: !!fcss }), tier: 0 });
  });
  const hasIcons = (M.icons || []).some(i => i.svg);
  if (refs.length) files.push({ path: 'reference/index.html', content: refIndex(M, refs, fileOf, hasIcons, { customFonts: custom, hasFonts: !!fcss }), tier: 0 });
  if (fcss) files.push({ path: 'reference/fonts.css', content: '/* Custom fonts used by the exported frames. Add the font files to reference/fonts/ (same name as the family). */\n' + fcss + '\n', tier: 0 });
  if (hasIcons) files.push({ path: 'reference/icons.html', content: iconsHtml(M), tier: 0 });
  bin.forEach((b64, p) => files.push({ path: 'reference/' + p, content: b64, binary: true, tier: 0 }));
  return files;
}

// ---------- AI control: adherence level 0-10 ----------
const LEVELS = [
  ['Strict', 'Assemble screens only from existing components, using exact variants and sizes from components.md. Copy existing patterns and layouts as they appear in the reference frames.', 'Invent layouts, components, spacing combinations or states.', 'Stop and report `MISSING TOKEN` or `MISSING COMPONENT`.'],
  ['Near-strict', 'Same as 0, and also reorder, repeat or remove existing blocks and change content (text, data).', 'Create new component structures.', 'Stop and report `MISSING TOKEN` or `MISSING COMPONENT`.'],
  ['Faithful', 'Compose new screens from existing components and patterns, using any existing spacing and size tokens.', 'Create new components or variants.', 'Stop and report `MISSING TOKEN` or `MISSING COMPONENT`.'],
  ['Guided', 'Create new layouts and compositions from existing components, using any existing variant or state.', 'Create new component structures.', 'Use the closest existing token and list it under "Closest-match substitutions".'],
  ['Balanced', 'Build simple new components from existing tokens and text styles, following the naming convention.', 'Leave the visual language of the system.', 'Use the closest existing token and list it under "Closest-match substitutions".'],
  ['Flexible', 'Create new components and layouts; vary density, hierarchy and alignment; combine tokens freely.', 'Use values outside the token set.', 'Use the closest existing token and list it under "Closest-match substitutions".'],
  ['Adaptive', 'Propose alternative layouts and flows; extend components with new states or variants built from tokens.', 'Use values outside the token set.', 'Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.'],
  ['Creative', 'Introduce new patterns, visual hierarchy ideas, motion (using motion tokens if they exist) and imagery placeholders.', 'Use values outside the token set.', 'Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.'],
  ['Exploratory', 'Rethink layout and structure substantially; deliver 2–3 distinct options; propose new components.', 'Use values outside the token set.', 'Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.'],
  ['Bold', 'Explore composition, rhythm and expression freely within the palette and type scale.', 'Use values outside the token set.', 'Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.'],
  ['Open', 'Maximum creative freedom: treat the system as a visual language and propose new tokens, components and patterns.', 'Write a literal value inline. Every value is a token or a named proposed token.', 'Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.']
];
const clampLevel = n => Math.max(0, Math.min(10, Math.round(Number(n))) || 0);
function levelLine(n) { const L = LEVELS[clampLevel(n)]; return 'Level ' + clampLevel(n) + ' — ' + L[0] + '. You may: ' + L[1] + ' You must not: ' + L[2] + ' If something is missing: ' + L[3]; }
function aiControlMd(level) {
  const n = clampLevel(level), L = LEVELS[n];
  return '---\nadherence_level: ' + n + '\n---\n# AI Control — adherence to the design system\n\nAdherence goes from 0 (follow the rules exactly) to 10 (maximum creative freedom). **Change the number above to change the behavior.** You can also tell the AI: "set adherence_level to 7".\n\n' +
    '## How to use (for AI agents)\n\n1. At the start of every task, read `adherence_level` from the front matter above. Re-read it every time; the user may have changed it.\n2. Apply the "Always" rules and the behavior of the current level.\n3. End your answer with `Adherence level used: N`.\n\n' +
    '## Always (every level)\n\n- Never write a literal color, size, spacing, radius, shadow or font value. Use `var(--name)` from tokens.css and the `.text-*` classes.\n- Never edit tokens.css or the Figma variables and styles.\n- Never use a font, text style or icon that is not in the system. Creativity lives in composition, hierarchy and structure, not in hand-set styles.\n- Creativity never changes how values are written: every value stays a token (or a named proposed token at levels 6–10).\n\n' +
    '## Current level: ' + n + ' — ' + L[0] + '\n\n- You may: ' + L[1] + '\n- You must not: ' + L[2] + '\n- If something is missing: ' + L[3] + '\n\n' +
    '## All levels\n\n' + tbl(['Level', 'Name', 'You may', 'You must not', 'If something is missing'], LEVELS.map((x, i) => [i, x[0], x[1], x[2], x[3]]));
}

function skillMd(M, X) {
  const comps = M.components || [], refs = M.refs || [], html = (M.componentHtml && M.componentHtml.ok) || [];
  const files = ['`design.md` — rules and overview', '`tokens.css` — every value', '`components.css` + `components/*.html` — component markup and spec', '`components/index.json` — component registry'];
  if (refs.length) files.push('`reference/*.html` — visual reference pages');
  files.push('`manifest.json` — sources, entities and outputs');
  return '---\nname: ' + slug(M.fileName || 'design-system') + '-design-system\ndescription: Design system exported from the Figma file "' + (M.fileName || '') + '". Use when building UI that must follow these tokens, components and rules.\n---\n' +
    '# ' + (M.fileName || 'Design System') + ' — agent entrypoint\n\n' +
    'This package is the source of truth. Do not restyle it from screenshots; read the files.\n\n' +
    '## Read order\n\n' + files.map((f, i) => (i + 1) + '. ' + f).join('\n') + '\n\n' +
    '## Authority\n\n' +
    '- Values come from `tokens.css` only: colors, spacing, radius, borders, shadows, typography.\n' +
    '- Components come from `components/index.json`; the HTML next to it is the canonical markup for the default variant.\n' +
    '- `reference/` pages are evidence of composition, not a source of values.\n' +
    '- If a value or component is missing, say so and propose a token; never hard-code a replacement.\n\n' +
    '## Rules\n\n' +
    '- Use `var(--name)` and the `.text-*` classes; never literals.\n' +
    '- Keep component structure and class names from `components/*.html` unless the user asks for a variant.\n' +
    '- Do not edit `tokens.css`, `components.css` or `manifest.json` by hand.\n' +
    '- Read `ai-control.md` before creative work: its `adherence_level` controls how far you may deviate.\n\n' +
    '## Inventory\n\n' + tbl(['Item', 'Count'], [['Tokens', (M.tokens || []).length], ['Components', comps.length], ['Component HTML', html.length], ['Icons', X && X.icons ? X.icons.total : 0], ['Reference pages', refs.length], ['Text styles', M.styles.text.length]]) +
    (comps.length ? '\n## Components\n\n' + comps.slice(0, 40).map(c => '- ' + c.name + ' (' + c.kind + ', ' + c.variants + ' variant(s))').join('\n') + '\n' : '') +
    (refs.length ? '\n## References\n\n' + refs.slice(0, 40).map(r => '- ' + r.name + ' → `reference/' + slug(r.name) + '.html`').join('\n') + '\n' : '');
}

const r2n = v => Math.round(v * 100) / 100;
const estTokens = s => Math.ceil(String(s).length / 4);
const GENERIC_NAME = /^(frame|group|rectangle|ellipse|vector|section|page|artboard|untitled)[\s_-]*\d*$/i;
const hexRgb = h => { h = String(h).replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
function nearestColor(hexv, list) {
  const a = hexRgb(hexv); let best = null;
  list.forEach(t => { const b = hexRgb(t.hex), d = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)); if (!best || d < best.d) best = { css: t.css, hex: t.hex, d: Math.round(d * 10) / 10 }; });
  return best;
}
function uniquifyComponents(components) {
  const seen = {}; components.forEach(c => { c.baseName = c.baseName || c.name; });
  components.forEach(c => { const k = c.baseName; seen[k] = (seen[k] || 0) + 1; if (seen[k] > 1) { c.name = k + ' (' + seen[k] + ')'; c.id = 'component.' + slug(c.name); } });
}
function matchTextStyle(t, styles) {
  if (t.size == null) return { exact: [], near: [] };
  const same = styles.filter(s => Math.abs(s.size - t.size) < 0.5), lhPx = s => /px$/.test(s.lineHeight) ? parseFloat(s.lineHeight) : null, cls = s => '.text-' + styleSlug(s.name);
  const exact = same.filter(s => (!t.weight || fontWeightOf(s.fstyle) === t.weight) && (t.lh == null || lhPx(s) == null || Math.abs(lhPx(s) - t.lh) < 0.5));
  return { exact: exact.map(cls), near: same.filter(s => exact.indexOf(s) < 0).map(cls) };
}
const PACKS_RE = [['Iconsax', /(^|\/)(vuesax|iconsax)(\/|$)/i], ['Lucide Icons', /lucide/i], ['Phosphor Icons', /(^|\/)ph[-/]|phosphor/i], ['Tabler Icons', /tabler/i], ['Heroicons', /heroicons?/i], ['Remix Icon', /(^|\/)ri[-/]|remix/i],
  ['Material Symbols', /material|(^|\/)md[-/]/i], ['Font Awesome', /(^|\/)fa[srlb]?[-/]|font ?awesome/i], ['Icons8', /icons8/i], ['Streamline Icons', /streamline/i], ['Radix Icons', /radix/i], ['Fluent UI Icons', /fluent/i], ['Eva Icons', /(^|\/)eva[-/]/i],
  ['Hugeicons', /huge ?icons/i], ['Solar Icons', /solar/i], ['Iconoir', /iconoir/i], ['Iconly', /iconly/i]];
function guessPack(names) {
  let best = null; PACKS_RE.forEach(p => { const n = names.filter(x => p[1].test(x)).length; if (n && (!best || n > best.n)) best = { name: p[0], n }; });
  return best && best.n / Math.max(names.length, 1) >= 0.4 ? best.name : '';
}
function iconSummary(M) {
  const I = M.icons || []; if (!I.length) return null;
  const used = I.filter(i => (i.usedIn || []).length), lib = I.filter(i => !(i.usedIn || []).length), pref = {}, sizes = {};
  I.forEach(i => { const p = i.name.split('/').slice(0, -1).join('/'); if (p) pref[p] = (pref[p] || 0) + 1; sizes[i.w + '×' + i.h] = (sizes[i.w + '×' + i.h] || 0) + 1; });
  const topPref = Object.keys(pref).sort((a, b) => pref[b] - pref[a])[0] || '', topSize = Object.keys(sizes).sort((a, b) => sizes[b] - sizes[a])[0];
  const guess = M.iconPack ? '' : guessPack(I.filter(i => i.named).map(i => i.name)), uniqNames = [...new Set(I.filter(i => i.named).map(i => i.name))];
  const byName = {}; used.forEach(i => { const o = byName[i.name] = byName[i.name] || { name: i.name, w: i.w, h: i.h, kind: i.kind, places: new Set(), n: 0 }; o.n++; (i.usedIn || []).forEach(x => o.places.add(x)); });
  return { total: I.length, uniqueNamed: uniqNames.length, unnamed: I.filter(i => !i.named).length, usedList: Object.keys(byName).sort().map(k => ({ name: k, w: byName[k].w, h: byName[k].h, kind: byName[k].kind, places: [...byName[k].places].sort() })), libraryCount: lib.length, pack: M.iconPack || guess, packSource: M.iconPack ? 'chosen by you' : guess ? 'inferred from icon names' : '', pattern: topPref ? topPref + '/{name}' : '', size: topSize || '', examples: uniqNames.slice(0, 6) };
}
function groupScreens(M) {
  const all = M.screens || [], real = all.filter(s => !s.sheet), sheets = all.filter(s => s.sheet), by = {};
  real.forEach(s => (by[s.page] = by[s.page] || []).push(s));
  const klass = w => w >= 1024 ? 'desktop (≥1024px)' : w <= 480 ? 'mobile (≤480px)' : 'tablet/other';
  return { pages: Object.keys(by).sort().map(pg => { const L = by[pg], sz = {}; L.forEach(s => { const k = klass(s.w); sz[k] = (sz[k] || 0) + 1; }); return { page: pg, count: L.length, sizes: sz, named: [...new Set(L.filter(s => !GENERIC_NAME.test(String(s.name).trim())).map(s => s.name))] }; }), sheets: sheets.length, total: all.length };
}
function deriveTokens(components, taken) {
  const sp = {}, rad = {}, bw = {};
  components.forEach(c => (c.spec || []).forEach(x => { if (x.bound || !x.raw) return; const v = parseFloat(x.raw); if (!isFinite(v) || v <= 0) return; if (/^(padding-|gap$)/.test(x.prop)) sp[v] = (sp[v] || 0) + 1; else if (x.prop === 'border-radius') rad[v] = (rad[v] || 0) + 1; else if (x.prop === 'border-width') bw[v] = (bw[v] || 0) + 1; }));
  const out = [], mk = (map, prefix, cat) => Object.keys(map).map(Number).sort((a, b) => a - b).forEach(v => { let css = '--' + prefix + '-' + String(v).replace('.', '-'); while (taken[css]) css += '-d'; taken[css] = 1; out.push({ css, value: v + 'px', category: cat, uses: map[v], px: v }); });
  mk(sp, 'space', 'spacing'); mk(rad, 'radius', 'radius'); mk(bw, 'border-width', 'border'); return out;
}
function enrichModel(M) {
  if (M.enriched) return M.enriched;
  uniquifyComponents(M.components);
  const N = cssNameMap(M.tokens), taken = {}; Object.keys(N.byName).forEach(k => taken[N.byName[k]] = 1);
  const colorToks = M.tokens.filter(t => t.type === 'COLOR').map(t => { const r = Object.values(t.modes)[0]; return r && r.status === 'resolved' ? { css: N.byFigma[t.figmaId], hex: String(r.value).slice(0, 7).toUpperCase(), role: t.role } : null; }).filter(Boolean).sort((a, b) => (a.role === 'semantic' ? 0 : 1) - (b.role === 'semantic' ? 0 : 1));
  const derived = deriveTokens(M.components, taken), dmap = {}; derived.forEach(d => dmap[d.px + '|' + d.category] = d.css);
  const cov = { total: 0, bound: 0, derived: 0, exact: 0, nearest: 0, text: { total: 0, bound: 0, exact: 0, near: 0, none: 0 } }, gaps = {};
  M.components.forEach(c => {
    const lines = [], sp = c.spec || [], get = p => sp.find(x => x.prop === p), box = (names, mapKey) => {
      const items = names.map(n => get(n)); if (!items.some(Boolean)) return null;
      return items.map(x => { if (!x) return '0'; const v = parseFloat(x.raw); if (x.bound) { cov.total++; cov.bound++; return 'var(' + (N.byName[x.bound] || cssVar(x.bound)) + ')'; } if (!isFinite(v) || v === 0) return '0'; cov.total++; cov.derived++; return 'var(' + dmap[v + '|' + mapKey] + ')'; });
    };
    lines.push('display: flex; flex-direction: ' + ((get('flex-direction') || {}).raw || 'row') + ';'); if (!get('display')) lines.pop();
    const pad = box(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'], 'spacing');
    if (pad && pad.some(v => v !== '0')) lines.push('padding: ' + (pad[0] === pad[2] && pad[1] === pad[3] ? (pad[0] === pad[1] ? pad[0] : pad[0] + ' ' + pad[1]) : pad.join(' ')) + ';');
    const gap = box(['gap'], 'spacing'); if (gap && gap[0] !== '0') lines.push('gap: ' + gap[0] + ';');
    const rd = box(['border-radius'], 'radius'); if (rd && rd[0] !== '0') lines.push('border-radius: ' + rd[0] + ';');
    const bwid = box(['border-width'], 'border');
    const colorOf = x => {
      cov.total++;
      if (x.bound) { cov.bound++; return { v: 'var(' + (N.byName[x.bound] || cssVar(x.bound)) + ')', note: '' }; }
      const hx = String(x.raw).slice(0, 7).toUpperCase(), nn = nearestColor(hx, colorToks); if (!nn) return { v: x.raw, note: '' };
      if (nn.d === 0) { cov.exact++; return { v: 'var(' + nn.css + ')', note: '' }; }
      cov.nearest++; const g = gaps[hx] = gaps[hx] || { hex: hx, uses: 0, nearest: nn }; g.uses++; return { v: 'var(' + nn.css + ')', note: ' /* Figma: ' + hx + ' has no token; nearest, distance ' + nn.d + ' */' };
    };
    const bc = get('border-color'), bg = get('background-color');
    if (bwid && bc && bwid[0] !== '0') { const cc = colorOf(bc); lines.push('border: ' + bwid[0] + ' solid ' + cc.v + ';' + cc.note); }
    if (bg) { const cc = colorOf(bg); lines.push('background-color: ' + cc.v + ';' + cc.note); }
    const w = get('width'), h = get('height'); if (w && h && !w.bound && !h.bound) lines.push('width: ' + w.raw + '; height: ' + h.raw + '; /* fixed size from Figma */'); else { if (w) lines.push('width: ' + (w.bound ? 'var(' + (N.byName[w.bound] || cssVar(w.bound)) + ')' : w.raw) + ';'); if (h) lines.push('height: ' + (h.bound ? 'var(' + (N.byName[h.bound] || cssVar(h.bound)) + ')' : h.raw) + ';'); }
    const texts = [];
    sp.filter(x => x.prop === 'text').forEach(x => { cov.text.total++; if (x.textStyle) { cov.text.bound++; texts.push('"' + x.node + '" → .text-' + styleSlug(x.textStyle)); return; } const m = matchTextStyle({ size: x.size, weight: x.weight, lh: x.lh }, M.styles.text || []); if (m.exact.length) { cov.text.exact++; texts.push('"' + x.node + '" → ' + m.exact[0] + ' (exact match: ' + x.raw + ')'); } else if (m.near.length) { cov.text.near++; texts.push('"' + x.node + '" → closest ' + m.near.slice(0, 2).join(' or ') + ' (same size, weight differs)'); } else { cov.text.none++; texts.push('"' + x.node + '" → no text style has size ' + x.raw + ' (report it, do not invent one)'); } });
    c.css = { lines, texts };
  });
  M.enriched = { derived, colorGaps: Object.keys(gaps).map(k => gaps[k]).sort((a, b) => b.uses - a.uses), coverage: cov, icons: iconSummary(M), screens: groupScreens(M) };
  return M.enriched;
}

// ---------- Project context rendering (compact) ----------
function ctxMd(C, rejInf, X) {
  const rej = new Set(rejInf || []), L = [];
  const src = k => (C.src && C.src[k]) || '', tag = k => /user/.test(src(k)) ? '' : src(k) ? ' (' + src(k).replace(/\s*\(.*$/, '') + ')' : '';
  if (C.product.name) L.push('- Product: ' + C.product.name + (C.provided && /user/.test(src('Product')) ? '' : ' (from the Figma file name)'));
  if (C.product.description && !C.descAuto) L.push('- Description: ' + C.product.description);
  if (C.users.length) L.push('- Users: ' + C.users.join(', ') + tag('Users')); if (C.goals.length) L.push('- Goals: ' + C.goals.join(', ') + tag('Goals'));
  if (C.capabilities.length) L.push('- Capabilities: ' + C.capabilities.join(', ')); if (C.flows.length) L.push('- Flows: ' + C.flows.join(', '));
  if (C.platforms.length) L.push('- Platforms: ' + C.platforms.join(', ')); if (C.localization.language) L.push('- Language: ' + C.localization.language + tag('Language')); if (C.localization.direction) L.push('- Direction: ' + C.localization.direction + tag('Direction'));
  C.notes.forEach(n => L.push('- Note: ' + n));
  if (X && X.screens && X.screens.total) L.push('- Screens: ' + (X.screens.total - X.screens.sheets) + ' top-level frame(s) on ' + X.screens.pages.length + ' page(s)' + (X.screens.sheets ? ', ' + X.screens.sheets + ' icon sheet(s) excluded' : '') + ' (details in content.md)');
  C.inferences.filter(i => !rej.has(i.id)).forEach(i => L.push('- [inference ' + Math.round(i.confidence * 100) + '%] ' + i.statement + ' — ' + i.evidence.join('; ')));
  const miss = C.unknown.filter(u => !(u === 'Product' && C.product.name) && !(u === 'Description' && C.product.description));
  if (miss.length && C.provided) L.push('- Not provided: ' + miss.join(', '));
  return '## Project Context\n\n' + (C.provided ? '' : '_No user-provided context._\n\n') + L.join('\n') + '\n';
}

// ---------- Frame inference (clusters, icon sheets excluded by the caller) ----------
function inferFromFrames(frames, texts) {
  const out = [], w = frames.map(f => f.w).filter(Boolean), n = w.length, narrow = w.filter(x => x <= 480).length, wide = w.filter(x => x >= 1024).length;
  if (n >= 3 && wide >= 2 && wide / n >= 0.15) out.push({ field: 'platforms', value: 'web', statement: 'Platform may include web or desktop', confidence: 0.65, evidence: [wide + ' of ' + n + ' top-level frames are 1024px wide or more'] });
  if (n >= 3 && narrow >= 2 && narrow / n >= 0.15) out.push({ field: 'platforms', value: 'mobile', statement: 'Platform may include mobile', confidence: 0.65, evidence: [narrow + ' of ' + n + ' top-level frames are 480px wide or less'] });
  const t = (texts || []).join(' '), rtl = (t.match(/[\u0590-\u08FF]/g) || []).length, letters = (t.match(/\p{L}/gu) || []).length;
  if (letters >= 12 && rtl / letters > 0.3) {
    out.push({ field: 'direction', value: 'RTL', statement: 'Text direction may be RTL', confidence: 0.7, evidence: [Math.round(rtl / letters * 100) + '% of letters in page, frame and component names are right-to-left script'] });
    const fa = /[\u067E\u0686\u0698\u06AF\u06A9\u06CC]/.test(t);
    out.push({ field: 'language', value: fa ? 'Persian' : 'Arabic', statement: 'Language may be ' + (fa ? 'Persian' : 'Arabic'), confidence: 0.6, evidence: ['right-to-left script found in names' + (fa ? ' (Persian-specific letters present)' : '')] });
  }
  return out;
}

// ---------- Validation (weighted, explainable) ----------
function validate(M, extra) {
  const X = enrichModel(M), issues = (extra || []).slice(), add = (code, severity, entityId, message, recovery) => issues.push({ code, severity, entityId, message, recovery });
  M.tokens.forEach(t => Object.entries(t.modes).forEach(([m, r]) => {
    if (r.status === 'circular') add('TOKEN_CIRCULAR_REFERENCE', 'error', t.id, 'Circular alias in mode "' + m + '".', 'Review token aliases.');
    else if (r.status === 'unresolved') add('TOKEN_UNRESOLVED_REFERENCE', 'error', t.id, 'Alias target missing in mode "' + m + '".', 'Restore or relink the aliased variable.');
    else if (r.status === 'invalid') add('TOKEN_INVALID_VALUE', 'warning', t.id, 'Unsupported value type in mode "' + m + '".', 'Check variable value.');
  }));
  const sepOf = n => n.includes('/') ? '/' : n.includes('.') ? '.' : n.includes('-') ? '-' : 'none', cnt = {};
  M.tokens.forEach(t => { const s = sepOf(t.name); cnt[s] = (cnt[s] || 0) + 1; });
  const dom = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; let bad = 0;
  M.tokens.forEach(t => { if (sepOf(t.name) !== dom) { bad++; add('NAMING_INCONSISTENT', 'warning', t.id, 'Name differs from dominant separator "' + dom + '".', 'Rename for consistency.'); } });
  M.components.forEach(c => {
    if (!c.description) add('COMPONENT_UNDOCUMENTED', 'warning', c.name, 'No description.', 'Add a component description in Figma.');
    if (c.kind === 'component-set' && !c.states.length) add('COMPONENT_NO_STATES', 'info', c.name, 'No State variant property detected.', 'Add a State property if the component is interactive.');
    if (c.css && c.css.texts.some(x => /closest|no text style/.test(x))) add('TEXT_STYLE_NOT_BOUND', 'info', c.name, 'Text is not bound to a text style.', 'Bind the text to the suggested text style in Figma.');
  });
  X.colorGaps.forEach(g => add('COLOR_NOT_TOKENIZED', 'info', g.hex, 'Color used ' + g.uses + '× has no token (nearest ' + g.nearest.css + ', distance ' + g.nearest.d + ').', 'Create a color variable or use the nearest token.'));
  const tr = M.tokens.reduce((a, t) => a + Object.values(t.modes).filter(r => r.status === 'resolved').length, 0), tt = M.tokens.reduce((a, t) => a + Object.keys(t.modes).length, 0), dims = [], cov = X.coverage;
  if (tt) dims.push({ name: 'Token integrity', w: 3, score: Math.round(tr / tt * 100), basis: tr + ' of ' + tt + ' mode values resolved' });
  if (M.tokens.length) dims.push({ name: 'Naming consistency', w: 1, score: Math.round((M.tokens.length - bad) / M.tokens.length * 100), basis: (M.tokens.length - bad) + ' of ' + M.tokens.length + ' names follow "' + dom + '"' });
  if (cov.total) dims.push({ name: 'Variable coverage', w: 3, score: Math.round(cov.bound / cov.total * 100), basis: cov.bound + ' of ' + cov.total + ' style properties in components are bound to Figma variables' });
  if (cov.text.total) dims.push({ name: 'Text-style coverage', w: 2, score: Math.round(cov.text.bound / cov.text.total * 100), basis: cov.text.bound + ' of ' + cov.text.total + ' text layers use a text style' });
  if (M.components.length) {
    const d = M.components.filter(c => c.description).length, s = M.components.filter(c => c.kind === 'component' || c.states.length).length;
    dims.push({ name: 'Documentation', w: 1, score: Math.round(d / M.components.length * 100), basis: d + ' of ' + M.components.length + ' components documented' });
    dims.push({ name: 'State coverage', w: 1, score: Math.round(s / M.components.length * 100), basis: s + ' of ' + M.components.length + ' components with states (or single)' });
  }
  const W = dims.reduce((a, d) => a + d.w, 0);
  return { issues, dims, overall: dims.length ? Math.round(dims.reduce((a, d) => a + d.score * d.w, 0) / W) : null, errors: issues.filter(i => i.severity === 'error').length, warnings: issues.filter(i => i.severity === 'warning').length, info: issues.filter(i => i.severity === 'info').length };
}
function aggregateIssues(issues) {
  const by = {}; issues.forEach(i => { const k = i.severity + '|' + i.code; (by[k] = by[k] || { severity: i.severity, code: i.code, recovery: i.recovery, items: [], message: i.message }).items.push(i.entityId); });
  const rank = { error: 3, warning: 2, info: 1 };
  return Object.keys(by).map(k => by[k]).sort((a, b) => rank[b.severity] * b.items.length - rank[a.severity] * a.items.length || a.code.localeCompare(b.code));
}
// ---------- Markdown builders ----------
const anchorOf = s => String(s).toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');
const modeVal = t => { const ks = Object.keys(t.modes); if (ks.length === 1) { const r = t.modes[ks[0]]; return r.status === 'resolved' ? r.value : '(' + r.status + ')'; } return modeStr(t); };
const capList = (a, n) => a.length > n ? a.slice(0, n).join(', ') + ' +' + (a.length - n) : a.join(', ');
function iconsMd(M, X) {
  const I = X.icons; if (!I && !M.iconPack) return '';
  if (!I) return '\n## Icons\n\n- Icon pack: ' + M.iconPack + '\n';
  const L = ['\n## Icons\n', '- Icon pack: ' + (I.pack || 'Not provided') + (I.packSource ? ' (' + I.packSource + ')' : ''), '- Detected: ' + I.total + ' (' + I.uniqueNamed + ' distinct names' + (I.unnamed ? ', ' + I.unnamed + ' without a meaningful name' : '') + ')', '- Used in the selected design: ' + I.usedList.length];
  if (I.size) L.push('- Typical size: ' + I.size + 'px'); if (I.pattern) L.push('- Naming pattern: `' + I.pattern + '`'); if (I.libraryCount) L.push('- ' + I.libraryCount + ' more icons exist in the library but are not used in the selected design' + (I.examples.length ? ' (examples: ' + I.examples.join(', ') + '). The full list is in icons.json (Full / Agent mode)' : ''));
  L.push('', 'Use an icon from the pack by name; never draw a custom icon.', '');
  if (I.usedList.length) L.push(tbl(['Icon', 'Size', 'Used in'], I.usedList.slice(0, 80).map(i => [i.name, i.w + '×' + i.h, capList(i.places, 4)])) + (I.usedList.length > 80 ? '\n_+' + (I.usedList.length - 80) + ' more used icons._\n' : ''));
  return L.join('\n') + '\n';
}
function componentsMd(M, X, TCN) {
  const iconNames = new Set((M.icons || []).map(i => i.name));
  let t = '# Components\n\n';
  const sizeOf = c => { const d = c.variantDims || []; if (!d.length) return ''; const u = [...new Set(d.map(v => v.w + '×' + v.h))]; return u.length === 1 ? u[0] : u.length + ' sizes'; };
  if (M.components.length) {
    t += tbl(['Component', 'Kind', 'Variants', 'Size', 'Page'], M.components.map(c => ['[' + c.name + '](#' + anchorOf(c.name) + ')', c.kind, c.variants, sizeOf(c) || '—', c.page])) + '\n';
    M.components.forEach(c => {
      const head = ['`' + c.id + '`', c.kind, 'page: ' + c.page, c.variants + ' variant(s)', 'figma:' + c.figmaId]; if (c.origin === 'dependency') head.push('dependency of ' + c.requiredBy.join(', '));
      t += '## ' + c.name + '\n\n' + head.join(' · ') + '\n' + (c.description ? '\nPurpose: ' + c.description + '\n' : '') + '\n';
      const d = c.variantDims || [], u = [...new Set(d.map(v => v.w + '×' + v.h))];
      if (u.length > 1) t += '**Dimensions by variant**\n\n' + tbl(['Variant', 'Width', 'Height'], d.map(v => [v.name, v.w + 'px', v.h + 'px'])) + '\n'; else if (u.length === 1) t += '**Size:** ' + u[0] + 'px (all variants)\n\n';
      if (c.properties.length) t += '**Properties**\n\n' + tbl(['Name', 'Type', 'Default', 'Options'], c.properties.map(p => [p.name, p.type, p.default, (p.options || []).join(', ')])) + '\n';
      if (c.states.length) t += '**States:** ' + c.states.join(', ') + '\n\n';
      const tv = c.tokens.map(n => '`' + (TCN.byName[n] || cssVar(n)) + '`'); if (tv.length) t += '**Tokens:** ' + tv.join(', ') + '\n\n';
      const ic = c.dependencies.filter(x => iconNames.has(x) || (X.icons && X.icons.pattern && x.indexOf(X.icons.pattern.split('/{')[0].split('/')[0] + '/') === 0)), oth = c.dependencies.filter(x => ic.indexOf(x) < 0);
      if (oth.length || ic.length) t += '**Uses:** ' + [oth.length ? 'components: ' + oth.join(', ') : '', ic.length ? 'icons: ' + ic.length + ' (' + capList(ic, 4) + ')' : ''].filter(Boolean).join('; ') + '\n\n';
      if (c.css && c.css.lines.length) t += '**Spec (CSS, default variant)**\n\n```css\n.' + slug(c.name) + ' {\n' + c.css.lines.map(l => '  ' + l).join('\n') + '\n}\n```\n\n';
      if (c.css && c.css.texts.length) t += '**Text**\n\n' + c.css.texts.map(x => '- ' + x).join('\n') + '\n\n';
    });
  } else t += NA + '\n';
  return t + iconsMd(M, X);
}
function contentMd(M, rejInf) {
  const X = enrichModel(M), C = M.context, rej = new Set(rejInf || []), list = a => a.map(x => '- ' + x).join('\n'), cats = {}; M.tokens.forEach(t => cats[t.category] = (cats[t.category] || 0) + 1);
  let s = '# Content & Product Handoff\n\n> For a designer or AI agent who continues this product. Facts come from Figma or from you; derived rules and inferences are marked.\n\n';
  s += '## Product\n\n- Name: ' + (C.product.name || 'Not provided') + '\n' + (C.product.description && !C.descAuto ? '- Description: ' + C.product.description + '\n' : '') + '- Source file: ' + M.fileName + '\n';
  const given = [['Users', C.users], ['Goals', C.goals], ['Capabilities', C.capabilities], ['Flows', C.flows]].filter(x => x[1].length);
  given.forEach(x => s += '\n## ' + x[0] + '\n\n' + list(x[1]) + '\n');
  const miss = ['Users', 'Goals', 'Capabilities', 'Flows'].filter(k => !given.some(x => x[0] === k));
  s += '\n## Platforms & Localization\n\n- Platforms: ' + (C.platforms.join(', ') || 'Not provided') + '\n- Language: ' + (C.localization.language || 'Not provided') + '\n- Direction: ' + (C.localization.direction || 'Not provided') + '\n';
  if (C.notes.length) s += '\n## Notes\n\n' + list(C.notes) + '\n';
  const themeN = M.collections.filter(c => c.modes.length > 1);
  s += '\n## Design system at a glance\n\n- Tokens: ' + M.tokens.length + (X.derived.length ? ' + ' + X.derived.length + ' derived' : '') + ' (' + (Object.keys(cats).sort().map(k => k + ' ' + cats[k]).join(', ') || 'none') + ')\n- Themes: ' + (themeN.length ? themeN.map(c => c.name + ' [' + c.modes.join(', ') + ']').join('; ') : 'single mode') + '\n- Text styles: ' + M.styles.text.length + '\n- Components: ' + M.components.length + '\n- Icons: ' + (X.icons ? X.icons.total + ' (pack: ' + (X.icons.pack || 'not provided') + ')' : 'none') + '\n- Token naming separator: "' + domSep(M.tokens) + '"\n';
  s += '\n## Components\n\n' + (M.components.length ? tbl(['Component', 'Variants', 'States', 'Purpose'], M.components.map(c => [c.name, c.variants, c.states.join(', ') || '—', c.description || '—'])) : NA);
  const S = X.screens;
  s += '\n## Screens & structure\n\n';
  if (!S.total) s += NA; else {
    S.pages.forEach(p => { s += '- **' + p.page + '** — ' + p.count + ' frame(s): ' + Object.keys(p.sizes).map(k => p.sizes[k] + ' ' + k).join(', ') + (p.named.length ? '. Named: ' + capList(p.named, 10) : '') + '\n'; });
    if (S.sheets) s += '- ' + S.sheets + ' icon sheet(s) were recognized and are not counted as screens.\n';
  }
  s += '\n## Guidance for continuing (derived from the data)\n\n- Use only variables and `.text-*` classes from tokens.css, written exactly; never hard-code values.\n- Follow the "' + domSep(M.tokens) + '" naming separator and reuse the existing components before creating new ones.\n';
  if (themeN.length) s += '- Support every theme mode: ' + themeN.map(c => c.modes.join(', ')).join('; ') + '.\n';
  const inf = C.inferences.filter(i => !rej.has(i.id));
  if (inf.length) s += '\n## Inferences (not verified)\n\n' + inf.map(i => '- [' + Math.round(i.confidence * 100) + '%] ' + i.statement + ' — ' + i.evidence.join('; ')).join('\n') + '\n';
  if (miss.length) s += '\n## To complete\n\nAdd in the Content step and regenerate: ' + miss.join(', ') + '.\n';
  return s;
}
function rulesMd(M) {
  const themes = (M.collections || []).filter(c => c.modes.length > 1);
  return '\n### Rules for AI agents (mandatory)\n\n1. Use ONLY the CSS variables, `.text-*` classes, paint and shadow variables defined in tokens.css (including the derived tokens), written exactly: `var(--name)`. tokens.css is the single source of truth for values.\n' +
    '2. Never write a literal color, spacing, radius, shadow or font value. Never estimate, round or "normalize" a value. The only literals allowed are the fixed component sizes (width, height) given in components.md.\n3. Typography: use only the `.text-*` classes listed under Typography. Font sizes that are not listed do not exist.\n' +
    '4. Component structure and sizes: take them from components.md (Size and Spec CSS). The Spec already uses tokens; do not guess heights, paddings or radii.\n5. Prefer semantic tokens over primitive tokens.\n' +
    '6. If a needed value does not exist, follow the "If something is missing" line of the current level in ai-control.md (strict levels: stop and report `MISSING TOKEN: <what is needed>`; higher levels: closest token or a named proposed token). Never invent a literal value.\n' +
    (themes.length ? '7. Support every theme mode via `[data-theme="<mode>"]`: ' + [...new Set([].concat(...themes.map(c => c.modes)))].join(', ') + '.\n' : '7. This file has a single mode; no theme switching is needed.\n') +
    '8. Before answering, list every variable and class you used and confirm each exists in tokens.css.\n9. Creative freedom is set by `adherence_level` (0–10) in ai-control.md. Read it before every task. Rules 1 and 2 never change at any level.\n';
}
function lintPackage(files, M) {
  const by = p => (files.find(f => f.path === p) || { content: '' }).content, md = files.filter(f => /\.md$/.test(f.path)), mdAll = md.map(f => f.content).join('\n'), tokensTotal = md.reduce((a, f) => a + estTokens(f.content), 0);
  const comp = by('components.md'), design = by('design.md'), css = by('tokens.css'), checks = [];
  const add = (id, label, w, pass, detail, partial) => checks.push({ id, label, w, got: pass ? w : (partial || 0), pass, detail });
  add('size', 'Total Markdown size is small enough for an AI context', 15, tokensTotal <= 30000, '≈ ' + tokensTotal + ' tokens (limit 30000)', tokensTotal <= 60000 ? 7 : 0);
  const iconRows = (comp.split('## Icons')[1] || '').split('\n').filter(l => /^\| /.test(l)).length - 2;
  add('icons', 'Icon library is summarized, not dumped', 10, iconRows <= 80, Math.max(iconRows, 0) + ' icon rows (limit 80)');
  const heads = comp.match(/^## .+$/gm) || [], dup = heads.filter((h, i) => heads.indexOf(h) !== i), ids = (comp.match(/^`component\.[^`]+`/gm) || []), dupId = ids.filter((h, i) => ids.indexOf(h) !== i);
  add('unique', 'Component names and IDs are unique', 10, !dup.length && !dupId.length, dup.length + dupId.length + ' duplicate(s)');
  const noise = (design + by('tokens.md') + comp + css).match(/\d+\.\d{4,}/g) || [];
  add('floats', 'No floating-point noise in numbers', 5, !noise.length, noise.length + ' value(s)');
  let lit = 0; (comp.match(/```css[\s\S]*?```/g) || []).forEach(b => b.split('\n').forEach(l => { const m = l.match(/^\s+([a-z-]+):\s*(.*)$/); if (!m || /^(width|height|min-|max-)/.test(m[1])) return; const v = m[2].replace(/\/\*.*?\*\//g, '').replace(/width:\s*[\d.]+px;?\s*height:\s*[\d.]+px;?/, ''); if (/#[0-9a-fA-F]{3,8}\b/.test(v) || /\b\d*\.?\d+px\b/.test(v)) lit++; }));
  add('literals', 'Spec CSS has no literal colors or spacing (rules match the data)', 15, lit === 0, lit + ' literal line(s)');
  const unguided = (comp.match(/^- ".*"(?! →).*$/gm) || []).length;
  add('text', 'Every text layer has a mapping, a suggestion or an explicit report', 10, unguided === 0, unguided + ' text layer(s) without guidance');
  const boiler = (mdAll.match(/not available from the selected sources/gi) || []).length;
  add('boiler', 'No repeated boilerplate', 5, boiler <= 3, boiler + ' repeated notice(s)');
  const generic = (mdAll.match(/Frame \d{6,}/g) || []).length;
  add('names', 'No meaningless frame names', 5, generic === 0, generic + ' generic name(s)');
  add('dupfacts', 'Frame list appears once (no duplication across files)', 5, !/Frame "/.test(design), /Frame "/.test(design) ? 'frame list in design.md' : 'ok');
  add('order', 'design.md starts with a read order', 5, /### Read order/.test(design), 'read order');
  const mentioned = (design.match(/- Package: ([^\n]+)/) || ['', ''])[1].split(',').map(x => x.trim().replace(/ \(this file\)| \(HTML\)/g, '').replace(/\/ .*$/, '/')).filter(Boolean), missing = mentioned.filter(m => !files.some(f => f.path === m || f.path.indexOf(m) === 0));
  add('exists', 'Every file named in the package line exists', 5, missing.length === 0, missing.length ? 'missing: ' + missing.join(', ') : 'ok');
  const multi = (M.collections || []).some(c => c.modes.length > 1), contr = !multi && /Support every theme mode/.test(mdAll + css);
  add('contra', 'No contradictions (themes, rules and data agree)', 5, !contr, contr ? 'theme rule without modes' : 'ok');
  const rows = (by('validation.md').split('## Findings')[1] || '').split('\n').filter(l => /^\| /.test(l)).length - 2;
  add('valid', 'Validation findings are aggregated', 5, rows <= 25, Math.max(rows, 0) + ' rows (limit 25)');
  const total = checks.reduce((a, c) => a + c.w, 0), got = checks.reduce((a, c) => a + c.got, 0);
  return { score: Math.round(got / total * 100), checks };
}
function gen(M, mode, rejected, rejInf) {
  const X = enrichModel(M), OS = M.sections, on = k => OS[k] !== false, V = M.validation, rej = new Set(rejected || []), minimal = mode === 'minimal', files = [];
  const toks = M.tokens.map(t => t.categorySource === 'name-heuristic' && rej.has(t.category) ? Object.assign({}, t, { category: 'other' }) : t);
  const cats = {}; toks.forEach(t => (cats[t.category] = cats[t.category] || []).push(t));
  const catNames = Object.keys(cats).sort(), nStyles = M.styles.text.length + M.styles.paint.length + M.styles.effect.length;
  const TC = tokensCss(M, toks), TCN = TC.names, allDep = toks.length > 0 && toks.every(t => t.origin === 'dependency');
  const usedStr = t => { const u = t.usedBy || []; return u.length ? capList(u, 4) : '—'; };
  const catTbl = c => tbl(['Figma name', 'CSS variable', 'Role', 'Value', 'Alias', 'Used by'], cats[c].map(t => [t.name + (!allDep && t.origin === 'dependency' ? ' (dependency)' : ''), '`' + TCN.byFigma[t.figmaId] + '`', t.role, modeVal(t), (Object.values(t.modes)[0].chain || []).join(' → ') || '—', usedStr(t)]));
  const anyLib = M.styles.text.some(s => s.origin === 'library');
  const textClassTbl = tbl(['Figma text style', 'CSS class', 'Font', 'Size', 'Weight', 'Line height', 'Letter spacing'].concat(anyLib ? ['Origin'] : []), M.styles.text.map(s => [s.name, '`.text-' + styleSlug(s.name) + '`', s.family, s.size + 'px', fontWeightOf(s.fstyle), lhCss(s.lineHeight), lsCss(s.letterSpacing)].concat(anyLib ? [s.origin || 'local'] : [])));
  const themes = M.collections.filter(c => c.modes.length > 1);
  const derivedTbl = X.derived.length ? tbl(['CSS variable', 'Value', 'Used'], X.derived.map(d => ['`' + d.css + '`', d.value, d.uses + '×'])) : '';
  const gapTbl = X.colorGaps.length ? tbl(['Figma color', 'Used', 'Nearest token', 'Distance'], X.colorGaps.map(g => [g.hex, g.uses + '×', '`' + g.nearest.css + '` (' + g.nearest.hex + ')', g.nearest.d])) : '';

  // ---- tokens.md
  if ((on('tokens') && (toks.length || M.styles.paint.length || M.styles.effect.length || X.derived.length)) && !minimal) {
    let t = '# Tokens\n\nValues live in `tokens.css`; this file explains them.\n\n';
    catNames.forEach(c => { t += '## ' + c + '\n\n' + (cats[c][0].categorySource === 'name-heuristic' ? '_Category inferred from variable names._\n\n' : '') + catTbl(c) + '\n'; });
    if (derivedTbl) t += '## Derived tokens\n\nValues used in the design that have no Figma variable. They are real tokens in tokens.css; use them instead of literals.\n\n' + derivedTbl + '\n';
    if (gapTbl) t += '## Colors used but not tokenized\n\nA design-system gap: these colors appear in components without a variable. The nearest token is used in the Spec CSS.\n\n' + gapTbl + '\n';
    if (M.styles.paint.length) t += '## Paint styles\n\n' + tbl(['Style', 'CSS variable', 'Value', 'Origin'], M.styles.paint.map(s => [s.name, s.css ? '`--paint-' + styleSlug(s.name) + '`' : '—', s.value, s.origin || 'local'])) + '\n';
    if (M.styles.effect.length) t += '## Effect styles\n\n' + tbl(['Style', 'CSS variable', 'Value', 'Origin'], M.styles.effect.map(s => [s.name, s.css ? '`--shadow-' + styleSlug(s.name) + '`' : '—', s.value, s.origin || 'local'])) + '\n';
    files.push({ path: 'tokens.md', content: t, tier: 1 });
  }
  // ---- components.md, content.md
  if (!minimal && on('components') && (M.components.length || (M.icons || []).length || M.iconPack)) files.push({ path: 'components.md', content: componentsMd(M, X, TCN), tier: 1 });
  if (M.contentPack) files.push({ path: 'content.md', content: contentMd(M, rejInf), tier: 0 });
  // ---- tokens.css, reference, component HTML, ai-control
  if (toks.length || nStyles || X.derived.length) files.push({ path: 'tokens.css', content: TC.content, tier: 0 });
  files.push({ path: 'SKILL.md', content: skillMd(M, X), tier: 0 });
  referenceFiles(M, toks).forEach(f => files.push(f));
  const CH = M.componentHtml || { ok: [], failed: [] }, compFiles = {};
  if (!minimal && CH.ok.length) {
    const used = {}, rows = [];
    let ccss = '/* Component HTML rendered by ' + (CH.engine || 'the HTML engine') + '. Values come from tokens.css. */\n';
    CH.ok.forEach(c => {
      const file = 'components/' + fileSlug(c.name, used) + '.html';
      compFiles[c.figmaId] = file;
      ccss += '\n/* ' + c.name + ' */\n' + c.css + '\n';
      const doc = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + escH(c.name) + ' — component</title>\n<link rel="stylesheet" href="../tokens.css">\n<link rel="stylesheet" href="../components.css">\n</head>\n<body style="margin:24px;background:#fff">\n' + c.html + '\n</body>\n</html>\n';
      files.push({ path: file, content: doc, tier: 1 });
      rows.push({ id: c.id, name: c.name, figmaId: c.figmaId, className: c.className, file, width: c.w, height: c.h, nodes: c.nodes, vars: c.vars });
    });
    files.push({ path: 'components.css', content: ccss, tier: 0 });
    files.push({ path: 'components/index.json', content: JSON.stringify({ schemaVersion: '1.0.0', engine: CH.engine || null, components: rows, failed: CH.failed }, null, 2), tier: 1 });
  }
  if (toks.length || nStyles) files.push({ path: 'ai-control.md', content: aiControlMd(M.adherence === undefined ? 3 : M.adherence), tier: 0 });
  // ---- validation.md (self-check added after lint)
  const agg = aggregateIssues(V.issues), fixFirst = agg.slice(0, 3);
  const validationBase = '# Validation\n\n## Health' + (V.overall === null ? '' : ': ' + V.overall + '%') + '\n\n' + (tbl(['Dimension', 'Weight', 'Score', 'Basis'], V.dims.map(x => [x.name, x.w, x.score + '%', x.basis])) || NA) +
    (fixFirst.length ? '\n## Fix first\n\n' + fixFirst.map((a, i) => (i + 1) + '. **' + a.code + '** ×' + a.items.length + ' — ' + a.recovery).join('\n') + '\n' : '') +
    '\n## Findings\n\n' + (agg.length ? tbl(['Severity', 'Code', 'Count', 'Affected', 'How to fix'], agg.map(a => [a.severity, a.code, a.items.length, capList(a.items, 6), a.recovery])) : '_No findings._\n');
  // ---- design.md (read order uses real sizes)
  const sizeOf = f => f ? '≈ ' + estTokens(f.content) + ' tokens' : '';
  const cs = X.coverage, covPct = cs.total ? Math.round(cs.bound / cs.total * 100) : null;
  const pkgNames = ['SKILL.md', 'design.md', 'tokens.css', 'tokens.md', 'components.md', 'content.md', 'ai-control.md', 'validation.md'];
  const present = n => files.some(f => f.path === n) || n === 'design.md' || n === 'validation.md';
  const hasRefs = M.refs && M.refs.length, fileOf = n => files.find(f => f.path === n);
  const readOrder = [['SKILL.md', 'Agent entrypoint: read order, authority, inventory', sizeOf(fileOf('SKILL.md'))], ['design.md', 'Rules, typography, overview', 'this file'], ['tokens.css', 'ALL values: variables, text classes, shadows (single source of truth)', sizeOf(fileOf('tokens.css'))], ['ai-control.md', 'Creative freedom level (read before every task)', sizeOf(fileOf('ai-control.md'))],
    ['components.md', 'Component list, sizes and Spec CSS; open only the component you need', sizeOf(fileOf('components.md'))], ['tokens.md', 'Explains tokens: names, usage, gaps', sizeOf(fileOf('tokens.md'))], ['content.md', 'Product, users, screens (context only)', sizeOf(fileOf('content.md'))],
    ['validation.md', 'Design-system health and what to fix', '≈ ' + estTokens(validationBase) + ' tokens']].filter(r => present(r[0]));
  const pkgLine = pkgNames.filter(present).join(', ') + (hasRefs ? ', reference/ (HTML)' : '') + (M.componentHtml && M.componentHtml.ok.length ? ', components/ (HTML)' : '');
  let d = '# Design System\n\n## Overview\n\n- Source: Figma file "' + M.fileName + '"\n- Scope: ' + (M.pages.join(', ') || 'none') + '\n- Entities: ' + toks.length + ' tokens' + (X.derived.length ? ' (+' + X.derived.length + ' derived)' : '') + ', ' + M.components.length + ' components, ' + (X.icons ? X.icons.total + ' icons (' + (X.icons.pack || 'pack not provided') + '), ' : '') + nStyles + ' styles\n' +
    (covPct === null ? '' : '- Variable coverage: ' + cs.bound + ' of ' + cs.total + ' style properties in components use Figma variables (' + covPct + '%); the rest use derived or nearest tokens, so Spec CSS never needs literals.\n') + '- Dependency policy: ' + M.depPolicy + ' (' + M.depSummary.tokens + ' token(s), ' + M.depSummary.components + ' component(s) included as dependencies)\n- Package: ' + pkgLine + '\n';
  d += '\n### Read order\n\n' + tbl(['File', 'Purpose', 'Size'], readOrder.map(r => ['`' + r[0] + '`', r[1], r[2]])) + RULES_PLACEHOLDER;
  d = d.replace(RULES_PLACEHOLDER, rulesMd(M));
  const sec = {};
  sec.projectContext = ctxMd(M.context, rejInf, X);
  sec.tokens = '## Tokens\n\nSource of truth for values: `tokens.css` (exact Figma names in comments).\n\n' + (!toks.length ? NA : minimal ? catNames.map(c => '### ' + c + '\n\n' + catTbl(c)).join('\n') : tbl(['Category', 'Count'], catNames.map(c => [c, cats[c].length])) + (X.derived.length ? '\nDerived tokens: ' + X.derived.length + ' (spacing, radius, border widths used in the design)\n' : '') + (nStyles ? '\nStyles: ' + M.styles.text.length + ' text, ' + M.styles.paint.length + ' paint, ' + M.styles.effect.length + ' effect\n' : '') + '\nDetails: tokens.md\n');
  sec.themes = '## Themes\n\n' + (themes.length ? tbl(['Collection', 'Modes'], themes.map(c => [c.name, c.modes.join(', ')])) : 'Single mode. No theme switching.\n');
  sec.typography = '## Typography\n\nUse only these text styles (classes are defined in tokens.css).\n\n' + (!M.styles.text.length ? NA : textClassTbl);
  sec.components = '## Components\n\n' + (M.components.length ? tbl(['Component', 'Kind', 'Variants', 'States'], M.components.map(c => [minimal ? c.name : '[' + c.name + '](components.md#' + anchorOf(c.name) + ')', c.kind, c.variants, c.states.join(', ') || '—'])) + (X.icons ? '\nIcons: ' + X.icons.total + ' (pack: ' + (X.icons.pack || 'not provided') + (minimal ? ')' : '), see components.md') + '\n' : '') : NA);
  sec.validation = '## Validation\n\n- Health: ' + (V.overall === null ? 'n/a' : V.overall + '%') + ' · Errors ' + V.errors + ' · Warnings ' + V.warnings + ' · Info ' + V.info + (minimal ? '' : ' (details: validation.md)') + '\n';
  const order = ['projectContext', 'tokens', 'themes', 'typography', 'components'], out = order.filter(k => (k === 'projectContext' ? on('projectContext') : on(k))).map(k => sec[k]);
  const absent = UNS.filter(u => on(u[0])).map(u => u[1]);
  d += '\n' + out.join('\n') + (absent.length ? '\n## Other sections\n\n' + absent.join(', ') + ': not available from the selected sources.\n' : '') + (on('validation') ? '\n' + sec.validation : '');
  const designFile = { path: 'design.md', content: d, tier: 0 };
  // ---- lint -> validation.md
  const prelim = [designFile].concat(files, [{ path: 'validation.md', content: validationBase, tier: 1 }]);
  const lint = lintPackage(prelim, M); M.lint = lint;
  const validation = validationBase + '\n## Package self-check: ' + lint.score + ' / 100\n\n' + tbl(['Check', 'Result', 'Detail'], lint.checks.map(c => [c.label, c.pass ? 'pass' : 'FAIL', c.detail]));
  if (on('validation')) files.push({ path: 'validation.md', content: validation, tier: 1 });
  files.unshift(designFile);
  files.push({ path: 'metadata.json', content: JSON.stringify({ schemaVersion: '1.0.0', generatorVersion: '0.10.0', generatedAt: new Date().toISOString(), source: 'figma', sourceFileName: M.fileName, scopePages: M.pages, mode, packageQuality: lint.score }, null, 2), tier: 2 });
  const man = { entities: {} };
  toks.forEach(t => man.entities[t.id] = { source: { type: 'figma_variable', id: t.figmaId }, output: { mdPath: 'tokens.md#' + slug(t.category), cssVar: TCN.byFigma[t.figmaId] } });
  M.components.forEach(c => man.entities[c.id] = { source: { type: 'figma_' + c.kind.replace('-', '_'), id: c.figmaId }, output: { mdPath: 'components.md#' + anchorOf(c.name), html: compFiles[c.figmaId] || null } });
  files.push({ path: 'manifest.json', content: JSON.stringify(man, null, 2), tier: 2 }, { path: 'validation-report.json', content: JSON.stringify(V, null, 2), tier: 2 });
  if ((M.icons || []).length) files.push({ path: 'icons.json', content: JSON.stringify((M.icons || []).map(i => ({ name: i.name, named: i.named, kind: i.kind, size: i.w + 'x' + i.h, confidence: i.confidence, usedIn: i.usedIn, figmaId: i.figmaId })), null, 2), tier: 2 });
  files.push({ path: 'rules/validation-rules.json', content: JSON.stringify([...new Set(V.issues.map(i => i.code))].sort().map(c => ({ ruleId: c, source: 'derived', deterministic: true })), null, 2), tier: 3 });
  return files.filter(f => f.tier <= { minimal: 0, standard: 1, full: 2, agent: 3 }[mode]);
}
const RULES_PLACEHOLDER = '\n@@RULES@@\n';

// ---------- Prompt generator (pure) ----------
const OUT_FMT = {
  spec: ['Design specification', 'A structured, tool-agnostic specification: layout tree, which token and component each element uses, every state, and responsive behaviour. No code.'],
  html: ['HTML + CSS', 'Semantic HTML and CSS that uses CSS custom properties named after the tokens below. No hard-coded colors, sizes or radii.'],
  react: ['React + TypeScript', 'Functional React components in TypeScript. Map tokens to CSS variables or a Tailwind theme. Components must mirror the listed design-system components.'],
  swiftui: ['SwiftUI', 'SwiftUI views with a Theme type that holds the tokens below. Mirror the listed components.'],
  figma: ['Figma Plugin API code', 'JavaScript for the Figma Plugin API that builds the frame from the existing variables and components by name. Do not create new styles.']
};
function promptData(M) {
  const first = t => { const r = Object.values(t.modes)[0]; return r && r.status === 'resolved' ? r.value : '(' + (r ? r.status : 'n/a') + ')'; };
  return { name: M.context.product.name || M.fileName, description: M.context.product.description, users: M.context.users, goals: M.context.goals, platforms: M.context.platforms,
    language: M.context.localization.language, direction: M.context.localization.direction, themes: M.collections.map(c => c.name + ' [' + c.modes.join(', ') + ']'),
    tokens: M.tokens.map(t => ({ name: t.name, css: cssNameMap(M.tokens).byFigma[t.figmaId], category: t.category, role: t.role, value: first(t) })), textStyles: M.styles.text.map(s => '.text-' + styleSlug(s.name) + ' — ' + s.font + ' ' + s.size + 'px, line ' + s.lineHeight + ' (Figma: ' + s.name + ')'),
    components: M.components.map(c => ({ name: c.name, variants: c.variants, states: c.states, props: c.properties.map(p => p.name) })), icons: (M.icons || []).filter(i => i.named).map(i => i.name), iconPack: M.iconPack || '', sep: domSep(M.tokens), files: M.fileList || [] };
}
function buildPrompt(o, d) {
  o = o || {}; d = d || {};
  const f = OUT_FMT[o.format] || OUT_FMT.spec, NP = 'Not provided', lvl = o.detail || 'standard', states = o.states && o.states.length ? o.states : ['default', 'hover', 'focus', 'disabled'];
  const tok = d.tokens || [], comps = d.components || [], L = [], H = t => L.push('', '# ' + t, ''), cap = (a, n) => a.length > n ? a.slice(0, n).concat(['… (' + (a.length - n) + ' more in the attached files)']) : a;
  const sem = tok.filter(t => t.role === 'semantic'), pick = lvl === 'full' ? tok : (sem.length ? sem : tok), tn = lvl === 'full' ? 400 : lvl === 'standard' ? 60 : 0;
  H('ROLE'); L.push('You are a senior product designer and front-end engineer. You work strictly inside an existing design system and never improvise visual values.');
  H('OBJECTIVE'); L.push('Design: ' + (o.target || '[describe the screen, flow, component or section to design]'), 'Name: ' + (o.name || NP), 'Purpose: ' + (o.purpose || NP));
  H('PRODUCT CONTEXT');
  L.push('- Product: ' + (d.name || NP), '- Description: ' + (d.description || NP), '- Users: ' + ((d.users || []).join(', ') || NP), '- Goals: ' + ((d.goals || []).join(', ') || NP),
    '- Platform: ' + (o.platform || (d.platforms || []).join(', ') || NP), '- Language: ' + (o.language || d.language || NP), '- Direction: ' + (o.direction || d.direction || NP));
  H('DESIGN SYSTEM — SINGLE SOURCE OF TRUTH');
  if ((d.files || []).length) L.push('Attached files (authoritative if you can read them): ' + d.files.join(', '), '');
  L.push('Rules:', '1. Use only the tokens, text styles, components and icons listed here, written exactly (CSS variables as var(--name), text styles as their class). Never write a literal color, size, spacing, radius or font value.', '2. Never invent a color, spacing, radius, font, icon or component. If something is missing, say so and propose the closest existing option.',
    '3. Prefer semantic tokens over primitive tokens.', '4. Name every token and component you use.', '5. Support every theme mode listed.', '6. For icons, use only the listed icons or the named icon pack. Never draw custom icons.', '',
    'Naming convention: "' + (d.sep || 'unknown') + '" separator', 'Themes: ' + ((d.themes || []).join('; ') || NP));
  L.push('', '## Tokens (' + tok.length + ')');
  if (!tok.length) L.push(NP); else if (lvl === 'compact') { const c = {}; tok.forEach(t => c[t.category] = (c[t.category] || 0) + 1); L.push(Object.keys(c).sort().map(k => k + ': ' + c[k]).join(', '), 'Semantic examples: ' + (sem.slice(0, 30).map(t => t.name).join(', ') || NP)); }
  else cap(pick.map(t => '- ' + (t.css ? 'var(' + t.css + ')' : t.name) + ' = ' + t.value + (t.css ? '   /* ' + t.name + ' */' : '')), tn).forEach(x => L.push(x));
  L.push('', '## Text styles'); (d.textStyles || []).length ? cap(d.textStyles.map(x => '- ' + x), lvl === 'compact' ? 8 : 25).forEach(x => L.push(x)) : L.push(NP);
  L.push('', '## Components (' + comps.length + ')');
  comps.length ? cap(comps.map(c => '- ' + c.name + (lvl === 'compact' ? '' : ' — ' + c.variants + ' variant(s)' + (c.states.length ? '; states: ' + c.states.join(', ') : '') + (c.props.length ? '; props: ' + c.props.join(', ') : ''))), lvl === 'full' ? 300 : lvl === 'standard' ? 60 : 25).forEach(x => L.push(x)) : L.push(NP);
  L.push('', '## Icons (' + (d.icons || []).length + ')', 'Icon pack: ' + (o.iconPack || d.iconPack || NP), (d.icons || []).length ? cap(d.icons, lvl === 'compact' ? 15 : 60).join(', ') : NP);
  H('REQUIREMENTS');
  L.push('- Cover these states: ' + states.join(', '), '- Responsive: define behaviour for the target platform' + (o.platform ? ' (' + o.platform + ')' : '') + '.');
  if (o.a11y !== false) L.push('- Accessibility: text contrast at least 4.5:1, visible focus state, touch targets at least 44px, never rely on color alone.');
  if (String(o.direction || d.direction).toUpperCase() === 'RTL') L.push('- RTL: mirror layout, icons that imply direction, and alignment.');
  if (o.extra) L.push('- Additional: ' + o.extra);
  if (o.adherence !== undefined && o.adherence !== null && o.adherence !== '') { H('CREATIVITY CONTROL'); L.push('Adherence level: ' + clampLevel(o.adherence) + ' / 10 (0 = follow the rules exactly, 10 = maximum creative freedom).', 'If ai-control.md is attached, read `adherence_level` from it and follow its table; if it differs from this value, the file wins. Re-read it before every task, because it may change.', 'If it is not attached, apply: ' + levelLine(o.adherence), 'At every level: never write a literal color, size, spacing, radius, shadow or font value.'); }
  H('OUTPUT FORMAT');
  L.push('Format: ' + f[0], f[1], '', 'Answer with these parts, in order:', '1. Assumptions (only if something was missing)', '2. The result', '3. Table of every token and component used', '4. Open questions');
  H('PROCESS');
  L.push(o.ask === false ? '1. State your assumptions, then proceed.' : '1. If critical information is missing, ask at most 3 questions first. Otherwise state assumptions and proceed.', '2. Build the result using only the design system above.', '3. Run the self-check below before answering.');
  H('SELF-CHECK');
  L.push('- [ ] Every color, size, radius and font comes from a listed token or text style', '- [ ] Every component and icon used exists in the lists above', '- [ ] All requested states are covered', '- [ ] Every theme mode is supported', '- [ ] The output follows the requested format');
  return L.join('\n').replace(/^\n/, '') + '\n';
}

// ---------- Discovery ----------
async function discover() {
  await figma.loadAllPagesAsync();
  const comps = []; let descN = 0;
  const pages = figma.root.children.map(p => {
    const found = p.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] }).filter(n => !(n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET'));
    found.forEach(n => { const b = n.type === 'COMPONENT_SET' ? (n.children[0] || n) : n; const ic = iconScore(descN++ < 600 ? Object.assign(describe(b), { name: n.name }) : { name: n.name, w: b.width, h: b.height, page: p.name, types: [], hasText: false }); comps.push({ id: n.id, name: n.name, pageId: p.id, page: p.name, kind: n.type === 'COMPONENT_SET' ? 'component-set' : 'component', variants: n.type === 'COMPONENT_SET' ? n.children.length : 1, excluded: EXC.test(n.name), icon: ic.isIcon, iconConf: ic.score }); });
    return { id: p.id, name: p.name, frames: p.children.length, components: found.length, recommendation: EXC.test(p.name) ? 'Excluded' : REC.test(p.name) ? 'Recommended' : 'Review' };
  });
  const [vars, cols, ps, ts, es] = await Promise.all([figma.variables.getLocalVariablesAsync(), figma.variables.getLocalVariableCollectionsAsync(),
    figma.getLocalPaintStylesAsync(), figma.getLocalTextStylesAsync(), figma.getLocalEffectStylesAsync()]);
  const cats = {}, vcount = {}; vars.forEach(v => { const c = category(v)[0]; cats[c] = (cats[c] || 0) + 1; const o = vcount[v.variableCollectionId] = vcount[v.variableCollectionId] || {}; o[c] = (o[c] || 0) + 1; });
  DISC = { fileName: figma.root.name, comps };
  const collections = cols.map(c => ({ id: c.id, name: c.name, excluded: EXC.test(c.name), modes: c.modes.length, variables: vars.filter(v => v.variableCollectionId === c.id).length }));
  const styleList = [].concat(ts.map(x => ({ id: x.id, kind: 'text', name: x.name })), ps.map(x => ({ id: x.id, kind: 'paint', name: x.name })), es.map(x => ({ id: x.id, kind: 'effect', name: x.name })));
  const saved = await figma.clientStorage.getAsync('sel2'), settings = await figma.clientStorage.getAsync('settings');
  post('discover', { fileName: figma.root.name, pages, collections, comps, cats, vcount, styleList, saved, settings, engine: engineInfo(),
    counts: { pages: pages.length, collections: cols.length, variables: vars.length, styles: ps.length + ts.length + es.length, components: comps.length } });
}

// ---------- Figma-side helpers: icons, styles, frames ----------
let ICON = { cache: {}, map: {}, smallN: 0 }, BYID = {}, STYN = {};
const topFrames = page => { const o = []; page.children.forEach(c => { if (c.type === 'FRAME') o.push(c); else if (c.type === 'SECTION') c.children.forEach(k => { if (k.type === 'FRAME') o.push(k); }); }); return o; };
function describe(n) {
  const types = new Set([n.type]); let hasText = n.type === 'TEXT';
  try { (n.findAll ? n.findAll(() => true) : []).slice(0, 60).forEach(c => { types.add(c.type); if (c.type === 'TEXT') hasText = true; }); } catch (e) { /* ignore */ }
  const path = []; let p = n.parent; while (p && p.type !== 'PAGE' && path.length < 6) { path.push(p.name); p = p.parent; }
  return { selfType: n.type, name: n.name, w: n.width, h: n.height, page: p && p.type === 'PAGE' ? p.name : '', path: path.join('/'), types: [...types], hasText };
}
function iconInfo(t) {
  if (ICON.cache[t.id] !== undefined) return ICON.cache[t.id];
  const base = t.type === 'COMPONENT_SET' ? (t.children[0] || t) : t, d = describe(base); d.name = t.name; d.path = describe(t).path;
  const r = iconScore(d);
  ICON.cache[t.id] = r.isIcon ? { id: t.id, name: t.name, kind: t.type === 'COMPONENT_SET' ? 'component-set' : 'component', w: Math.round(base.width), h: Math.round(base.height), score: r.score, evidence: r.evidence, base } : null;
  return ICON.cache[t.id];
}
function noteIcon(t, usedIn) {
  const i = iconInfo(t); if (!i) return null;
  const rec = ICON.map[t.id] || (ICON.map[t.id] = { id: i.id, name: i.name, kind: i.kind, w: i.w, h: i.h, score: i.score, evidence: i.evidence, usedIn: new Set() });
  if (usedIn) rec.usedIn.add(usedIn);
  return i;
}
function noteFrameIcon(x, usedIn) {
  const key = 'frame:' + x.name; if (ICON.map[key]) { ICON.map[key].usedIn.add(usedIn); return; }
  const r = iconScore(describe(x)); if (!r.isIcon) return;
  ICON.cache[x.id] = { base: x }; ICON.map[key] = { id: x.id, name: x.name, kind: 'frame', w: Math.round(x.width), h: Math.round(x.height), score: r.score, evidence: r.evidence, usedIn: new Set([usedIn]) };
}
const GENERIC = /^(frame|group|vector|rectangle|ellipse|union|subtract|intersect|exclude|line|polygon|star|boolean|icon)[\s_-]*\d*$/i;
const hashS = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
async function scanSmall(fr, usedInName) {
  let cand = [];
  try { cand = fr.findAll(x => ['FRAME', 'GROUP', 'BOOLEAN_OPERATION', 'VECTOR'].includes(x.type) && x.width <= 64 && x.height <= 64 && x.width >= 8 && x.height >= 8).slice(0, 200); } catch (e) { return; }
  const matched = new Set();
  for (const x of cand) {
    if (ICON.smallN >= 300) return;
    let p = x.parent, skip = false; while (p && p.id !== fr.id) { if (matched.has(p.id)) { skip = true; break; } p = p.parent; }
    if (skip) continue;
    const r = iconScore(describe(x)); if (!r.isIcon) continue;
    matched.add(x.id); ICON.smallN++;
    const named = !GENERIC.test(String(x.name).trim());
    let key = 'frame:' + x.name;
    if (!named) { let sv = ''; try { sv = await x.exportAsync({ format: 'SVG_STRING' }); } catch (e) { /* ignore */ } key = 'svg:' + hashS(sv || x.id); }
    if (ICON.map[key]) { ICON.map[key].usedIn.add(usedInName); continue; }
    ICON.cache[x.id] = { base: x };
    ICON.map[key] = { id: x.id, name: named ? x.name : '', unnamed: !named, kind: 'frame', w: Math.round(x.width), h: Math.round(x.height), score: r.score, evidence: r.evidence.concat(named ? [] : ['has no meaningful name; identified by shape and size']), usedIn: new Set([usedInName]) };
  }
}
let SHEETS = new Set();
async function scanFrames(pageIds) {
  let n = 0; SHEETS = new Set();
  for (const pid of pageIds) {
    const page = await figma.getNodeByIdAsync(pid); if (!page || page.type !== 'PAGE') continue;
    for (const fr of topFrames(page)) {
      if (n++ >= 80) return;
      const insts = fr.findAllWithCriteria({ types: ['INSTANCE'] }).slice(0, 800);
      let iconInst = 0;
      for (let i = 0; i < insts.length; i += 50) {
        const mcs = await Promise.all(insts.slice(i, i + 50).map(x => x.getMainComponentAsync().catch(() => null)));
        mcs.forEach(mc => { if (mc && noteIcon(mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc, fr.name)) iconInst++; });
      }
      const before = ICON.smallN;
      await scanSmall(fr, fr.name);
      const smallFound = ICON.smallN - before, total = insts.length + smallFound;
      if ((iconInst + smallFound) >= 8 && (iconInst + smallFound) / Math.max(total, 1) >= 0.7) SHEETS.add(fr.id);
    }
  }
}
function styleRec(s, origin) {
  const g = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
  const hx = c => c ? hex(c) : '';
  if (s.type === 'TEXT') {
    const lh = g(() => s.lineHeight, { unit: 'AUTO' }), ls = g(() => s.letterSpacing, { unit: 'PIXELS', value: 0 }), fam = g(() => s.fontName.family, 'Unknown'), sty = g(() => s.fontName.style, 'Regular');
    return { kind: 'text', id: s.id, name: s.name, origin, family: fam, fstyle: sty, font: fam + ' ' + sty, size: Math.round(g(() => s.fontSize, 0) * 100) / 100,
      lineHeight: lh.unit === 'AUTO' ? 'auto' : Math.round(lh.value * 100) / 100 + (lh.unit === 'PERCENT' ? '%' : 'px'), letterSpacing: Math.round((ls.value || 0) * 100) / 100 + (ls.unit === 'PERCENT' ? '%' : 'px') };
  }
  if (s.type === 'PAINT') {
    const p = g(() => s.paints[0], null), stops = p && p.gradientStops ? p.gradientStops : [];
    const c = !p ? '' : p.type === 'SOLID' ? hex(Object.assign({}, p.color, { a: p.opacity })) : p.type.indexOf('GRADIENT') === 0 ? 'linear-gradient(180deg, ' + stops.map(x => hx(x.color) + ' ' + Math.round(x.position * 100) + '%').join(', ') + ')' : '';
    return { kind: 'paint', id: s.id, name: s.name, origin, css: c, value: !p ? 'empty' : p.type === 'SOLID' ? c : p.type.indexOf('GRADIENT') === 0 ? p.type.toLowerCase().replace('_', ' ') + ' (' + stops.map(x => hx(x.color)).join(' → ') + ')' : p.type.toLowerCase() + ' (not representable as CSS)' };
  }
  if (s.type === 'EFFECT') {
    const fx = g(() => s.effects, []), sh = fx.filter(e => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW');
    return { kind: 'effect', id: s.id, name: s.name, origin, css: sh.map(e => (e.type === 'INNER_SHADOW' ? 'inset ' : '') + (e.offset ? e.offset.x : 0) + 'px ' + (e.offset ? e.offset.y : 0) + 'px ' + e.radius + 'px ' + (e.spread || 0) + 'px ' + hx(e.color)).join(', '),
      value: fx.map(e => e.type + (e.radius !== undefined ? ' blur ' + e.radius : '') + (e.offset ? ' offset ' + e.offset.x + ',' + e.offset.y : '') + (e.color ? ' ' + hx(e.color) : '')).join('; ') || 'empty' };
  }
  return null;
}

// ---------- Frame -> standalone HTML (design-faithful, tokens as var()) ----------
const cssNum = v => Math.round(v * 100) / 100;
const varName = cssVar;
const escH = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const BLEND = { MULTIPLY: 'multiply', SCREEN: 'screen', OVERLAY: 'overlay', DARKEN: 'darken', LIGHTEN: 'lighten', COLOR_DODGE: 'color-dodge', COLOR_BURN: 'color-burn', HARD_LIGHT: 'hard-light', SOFT_LIGHT: 'soft-light', DIFFERENCE: 'difference', EXCLUSION: 'exclusion', HUE: 'hue', SATURATION: 'saturation', COLOR: 'color', LUMINOSITY: 'luminosity' };
const JUST = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', SPACE_BETWEEN: 'space-between' }, ALIGN = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', BASELINE: 'baseline' };
function colorCss(c, o, boundId, byId) {
  const a = (o === undefined ? 1 : o) * (c.a === undefined ? 1 : c.a), h = a < 1 ? 'rgba(' + [c.r, c.g, c.b].map(x => Math.round(x * 255)).join(',') + ',' + cssNum(a) + ')' : hex({ r: c.r, g: c.g, b: c.b });
  if (boundId && byId && byId[boundId]) { st_used(byId[boundId].name); return 'var(' + varName(byId[boundId].name) + ', ' + h + ')'; }
  return h;
}
let USED_VARS = new Set(); const st_used = n => USED_VARS.add(varName(n));
function imgMime(b) { return b[0] === 0xFF && b[1] === 0xD8 ? 'image/jpeg' : b[0] === 0x47 ? 'image/gif' : b[0] === 0x52 && b[1] === 0x49 ? 'image/webp' : 'image/png'; }
async function imageUrl(hash, st) {
  if (!hash || st.imgBytes > 3000000) return null;
  try { const im = figma.getImageByHash(hash); if (!im) return null; const b = await im.getBytesAsync(); st.imgBytes += b.length; return 'data:' + imgMime(b) + ';base64,' + figma.base64Encode(b); } catch (e) { return null; }
}
function gradCss(p, w, h, st) {
  const T = p.gradientTransform, stops = p.gradientStops; if (!T || !stops || !stops.length) return null;
  const a = T[0][0], b = T[0][1], tx = T[0][2], c = T[1][0], d = T[1][1], ty = T[1][2], det = a * d - b * c; if (!det) return null;
  const inv = (x, y) => [(d * (x - tx) - b * (y - ty)) / det, (-c * (x - tx) + a * (y - ty)) / det];
  const col = s => colorCss(s.color, p.opacity, s.boundVariables && s.boundVariables.color && s.boundVariables.color.id, st.byId);
  if (p.type === 'GRADIENT_LINEAR') {
    const s = inv(0, 0.5), e = inv(1, 0.5), sx = s[0] * w, sy = s[1] * h, dx = e[0] * w - sx, dy = e[1] * h - sy, len = Math.hypot(dx, dy); if (!len) return null;
    const ux = dx / len, uy = dy / len, L = Math.abs(w * ux) + Math.abs(h * uy) || 1, ang = Math.atan2(ux, -uy) * 180 / Math.PI;
    return 'linear-gradient(' + cssNum(ang) + 'deg, ' + stops.map(g => { const px = sx + g.position * dx, py = sy + g.position * dy, t = ((px - w / 2) * ux + (py - h / 2) * uy) / L + 0.5; return col(g) + ' ' + cssNum(t * 100) + '%'; }).join(', ') + ')';
  }
  if (p.type === 'GRADIENT_RADIAL' || p.type === 'GRADIENT_DIAMOND') {
    const c0 = inv(0.5, 0.5), r1 = inv(1, 0.5), r2 = inv(0.5, 1), rx = Math.hypot((r1[0] - c0[0]) * w, (r1[1] - c0[1]) * h), ry = Math.hypot((r2[0] - c0[0]) * w, (r2[1] - c0[1]) * h);
    return 'radial-gradient(ellipse ' + cssNum(rx) + 'px ' + cssNum(ry) + 'px at ' + cssNum(c0[0] * w) + 'px ' + cssNum(c0[1] * h) + 'px, ' + stops.map(g => col(g) + ' ' + cssNum(g.position * 100) + '%').join(', ') + ')';
  }
  return 'linear-gradient(' + col(stops[0]) + ', ' + col(stops[stops.length - 1]) + ')';
}
async function paintLayers(paints, w, h, st) {
  if (!Array.isArray(paints)) return [];
  const out = [];
  for (const p of paints.filter(x => x.visible !== false).reverse()) {
    if (p.type === 'SOLID') out.push({ kind: 'solid', css: colorCss(p.color, p.opacity, p.boundVariables && p.boundVariables.color && p.boundVariables.color.id, st.byId) });
    else if (p.type.indexOf('GRADIENT_') === 0) { const g = gradCss(p, w, h, st); if (g) out.push({ kind: 'grad', css: g }); }
    else if (p.type === 'IMAGE') { const u = await imageUrl(p.imageHash, st); out.push({ kind: 'img', css: u ? 'url("' + u + '") center / ' + (p.scaleMode === 'FIT' ? 'contain no-repeat' : p.scaleMode === 'TILE' ? 'auto repeat' : 'cover no-repeat') : 'linear-gradient(#d9d9d9, #d9d9d9)' }); }
  }
  return out;
}
async function svgOf(n, st) {
  if (st.svgs++ > 400) return '<!-- svg budget reached -->';
  try { const s = await n.exportAsync({ format: 'SVG_STRING' }); return s.length <= 30000 ? s.replace(/<\?xml[^>]*>\s*/, '').replace(/\s(width|height)="[\d.]+"/g, (m, k) => m) : '<!-- svg omitted: larger than 30 KB -->'; } catch (e) { return '<!-- svg export failed -->'; }
}
function textSeg(seg, st) {
  const css = [], sty = String(seg.fontName && seg.fontName.style || '').toLowerCase();
  if (seg.fontName && seg.fontName.family) { css.push('font-family:"' + seg.fontName.family + '",system-ui,sans-serif'); (st.fonts[seg.fontName.family] = st.fonts[seg.fontName.family] || new Set()).add(seg.fontWeight || fontWeightOf(sty)); }
  if (typeof seg.fontSize === 'number') css.push('font-size:' + cssNum(seg.fontSize) + 'px');
  css.push('font-weight:' + (seg.fontWeight || fontWeightOf(sty))); if (/italic|oblique/.test(sty)) css.push('font-style:italic');
  if (seg.lineHeight && seg.lineHeight.unit) css.push('line-height:' + (seg.lineHeight.unit === 'AUTO' ? 'normal' : seg.lineHeight.unit === 'PERCENT' ? cssNum(seg.lineHeight.value / 100) : cssNum(seg.lineHeight.value) + 'px'));
  if (seg.letterSpacing && seg.letterSpacing.value) css.push('letter-spacing:' + (seg.letterSpacing.unit === 'PERCENT' ? cssNum(seg.letterSpacing.value / 100) + 'em' : cssNum(seg.letterSpacing.value) + 'px'));
  if (seg.textDecoration === 'UNDERLINE') css.push('text-decoration:underline'); else if (seg.textDecoration === 'STRIKETHROUGH') css.push('text-decoration:line-through');
  if (seg.textCase === 'UPPER') css.push('text-transform:uppercase'); else if (seg.textCase === 'LOWER') css.push('text-transform:lowercase'); else if (seg.textCase === 'TITLE') css.push('text-transform:capitalize');
  const f = Array.isArray(seg.fills) ? seg.fills.find(x => x.visible !== false && x.type === 'SOLID') : null;
  if (f) css.push('color:' + colorCss(f.color, f.opacity, f.boundVariables && f.boundVariables.color && f.boundVariables.color.id, st.byId));
  return css.join(';');
}
async function nodeHtml(n, st, parent, depth) {
  if (st.count >= st.max || st.chars > st.maxChars) { st.truncated = true; return ''; }
  if (n.visible === false) return '';
  if (n.isMask) { st.notes.add('mask layers are not applied'); return ''; }
  st.count++;
  const pad = '  '.repeat(Math.min(depth, 12)), css = [], isText = n.type === 'TEXT', isVec = VEC.includes(n.type), w = n.width, h = n.height;
  const pAL = parent && parent.layoutMode && parent.layoutMode !== 'NONE' && n.layoutPositioning !== 'ABSOLUTE', horizP = pAL && parent.layoutMode === 'HORIZONTAL';
  const abs = parent && !pAL;
  const gx = parent && parent.type === 'GROUP' ? parent.x : 0, gy = parent && parent.type === 'GROUP' ? parent.y : 0;
  if (abs) css.push('position:absolute', 'left:' + cssNum(n.x - gx) + 'px', 'top:' + cssNum(n.y - gy) + 'px');
  const sh = n.layoutSizingHorizontal, sv = n.layoutSizingVertical;
  if (sh === 'FILL' && parent) css.push(pAL ? (horizP ? 'flex:1 1 0;min-width:0' : 'align-self:stretch') : 'width:100%'); else if (sh === 'HUG' && !isVec) css.push(isText ? 'width:max-content' : 'width:fit-content'); else css.push('width:' + cssNum(w) + 'px');
  if (sv === 'FILL' && parent) css.push(pAL ? (!horizP ? 'flex:1 1 0;min-height:0' : 'align-self:stretch') : 'height:100%'); else if (sv === 'HUG' && !isVec) { /* natural height */ } else if (!isText) css.push('height:' + cssNum(h) + 'px'); else css.push('min-height:' + cssNum(h) + 'px');
  if (pAL && sh !== 'FILL' && sv !== 'FILL') css.push('flex-shrink:0');
  ['minWidth', 'maxWidth', 'minHeight', 'maxHeight'].forEach(k => { if (typeof n[k] === 'number') css.push(k.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) + ':' + cssNum(n[k]) + 'px'); });
  const kids = 'children' in n ? n.children : [];
  if (n.layoutMode && n.layoutMode !== 'NONE') {
    css.push('display:flex', 'flex-direction:' + (n.layoutMode === 'HORIZONTAL' ? 'row' : 'column'), 'gap:' + cssNum(n.itemSpacing || 0) + 'px', 'justify-content:' + (JUST[n.primaryAxisAlignItems] || 'flex-start'), 'align-items:' + (ALIGN[n.counterAxisAlignItems] || 'flex-start'));
    if (n.layoutWrap === 'WRAP') { css.push('flex-wrap:wrap'); if (n.counterAxisSpacing) css.push('row-gap:' + cssNum(n.counterAxisSpacing) + 'px'); }
    css.push('padding:' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].map(x => cssNum(x || 0) + 'px').join(' '), 'box-sizing:border-box');
  } else if (kids.length && !abs) css.push('position:relative');
  else if (kids.length && abs) { /* already absolute: acts as containing block */ }
  const layers = isVec ? [] : await paintLayers(n.fills, w, h, st);
  if (!isText && layers.length) { if (layers.length === 1 && layers[0].kind === 'solid') css.push('background-color:' + layers[0].css); else css.push('background:' + layers.map(l => l.kind === 'solid' ? 'linear-gradient(' + l.css + ',' + l.css + ')' : l.css).join(', ')); }
  const sl = isVec ? [] : await paintLayers(n.strokes, w, h, st), shadows = [];
  if (sl.length && sl[0].kind !== 'img' && typeof n.strokeWeight === 'number' && n.strokeWeight > 0) {
    const sc = sl[0].kind === 'solid' ? sl[0].css : 'currentColor', wt = n.strokeWeight, sty = n.dashPattern && n.dashPattern.length ? 'dashed' : 'solid';
    if (n.strokeAlign === 'OUTSIDE') shadows.push('0 0 0 ' + cssNum(wt) + 'px ' + sc);
    else if (typeof n.strokeTopWeight === 'number' && (n.strokeTopWeight !== n.strokeBottomWeight || n.strokeLeftWeight !== n.strokeRightWeight || n.strokeTopWeight !== n.strokeLeftWeight)) css.push('border-style:' + sty, 'border-color:' + sc, 'border-width:' + [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight].map(x => cssNum(x) + 'px').join(' '), 'box-sizing:border-box');
    else css.push('border:' + cssNum(wt) + 'px ' + sty + ' ' + sc, 'box-sizing:border-box');
  }
  if (n.type === 'ELLIPSE') css.push('border-radius:50%'); else if (typeof n.cornerRadius === 'number' && n.cornerRadius > 0) css.push('border-radius:' + cssNum(n.cornerRadius) + 'px');
  else if ('topLeftRadius' in n && (n.topLeftRadius || n.topRightRadius || n.bottomRightRadius || n.bottomLeftRadius)) css.push('border-radius:' + [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius].map(x => cssNum(x || 0) + 'px').join(' '));
  if (Array.isArray(n.effects) && !isVec) n.effects.filter(e => e.visible !== false).forEach(e => {
    if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') shadows.push((e.type === 'INNER_SHADOW' ? 'inset ' : '') + cssNum(e.offset.x) + 'px ' + cssNum(e.offset.y) + 'px ' + cssNum(e.radius) + 'px ' + cssNum(e.spread || 0) + 'px ' + colorCss(e.color, undefined, null, st.byId));
    else if (e.type === 'LAYER_BLUR') css.push('filter:blur(' + cssNum(e.radius / 2) + 'px)'); else if (e.type === 'BACKGROUND_BLUR') css.push('backdrop-filter:blur(' + cssNum(e.radius / 2) + 'px)');
  });
  if (shadows.length) css.push('box-shadow:' + shadows.join(', '));
  if (typeof n.opacity === 'number' && n.opacity < 1) css.push('opacity:' + cssNum(n.opacity));
  if (n.blendMode && BLEND[n.blendMode]) css.push('mix-blend-mode:' + BLEND[n.blendMode]);
  if (typeof n.rotation === 'number' && Math.abs(n.rotation) > 0.01) css.push('transform:rotate(' + cssNum(-n.rotation) + 'deg)', 'transform-origin:0 0');
  if (n.clipsContent) css.push('overflow:hidden');
  let tag = 'div', inner = '', attrs = ' data-name="' + escH(n.name) + '"';
  if (isText) {
    css.push('margin:0', 'white-space:' + (n.textAutoResize === 'WIDTH_AND_HEIGHT' ? 'pre' : 'pre-wrap'), 'word-break:break-word');
    if (n.textAlignHorizontal) css.push('text-align:' + ({ LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' })[n.textAlignHorizontal]);
    if (n.textAlignVertical === 'CENTER' || n.textAlignVertical === 'BOTTOM') css.push('display:flex', 'flex-direction:column', 'justify-content:' + (n.textAlignVertical === 'CENTER' ? 'center' : 'flex-end'));
    if (n.textTruncation === 'ENDING') css.push('overflow:hidden', 'text-overflow:ellipsis');
    let segs = null;
    try { segs = n.getStyledTextSegments(['fontSize', 'fontName', 'fontWeight', 'fills', 'letterSpacing', 'lineHeight', 'textDecoration', 'textCase']); } catch (e) { /* fall back */ }
    if (!segs || !segs.length) segs = [{ characters: n.characters, fontSize: n.fontSize, fontName: n.fontName, fills: n.fills, lineHeight: n.lineHeight, letterSpacing: n.letterSpacing }];
    inner = segs.map(sg => '<span style="' + escH(textSeg(sg, st)) + '">' + escH(sg.characters) + '</span>').join('');
    if (n.textAlignVertical === 'CENTER' || n.textAlignVertical === 'BOTTOM') inner = '<span style="display:block">' + inner + '</span>';
  } else if (isVec) {
    inner = '\n' + pad + '  ' + await svgOf(n, st) + '\n' + pad; css.push('display:block');
  } else if (n.type === 'INSTANCE') {
    const mc = await n.getMainComponentAsync().catch(() => null), t = mc && (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc);
    if (t) { attrs += ' data-component="' + escH(t.name) + '"'; if (iconInfo(t)) { inner = '\n' + pad + '  ' + await svgOf(n, st) + '\n' + pad; attrs += ' data-icon="true"'; } }
  }
  try { (n.reactions || []).forEach(r => (r.actions || (r.action ? [r.action] : [])).forEach(a => { if (a && a.type === 'NODE' && a.destinationId && a.navigation !== 'OVERLAY' && a.navigation !== 'SWAP') { attrs += ' data-go="' + escH(a.destinationId) + '"'; st.links.add(a.destinationId); css.push('cursor:pointer'); } })); } catch (e) { /* ignore */ }
  if (!inner && kids.length) { const parts = []; for (const k of kids) { const s = await nodeHtml(k, st, n, depth + 1); if (s) parts.push(s); } if (parts.length) inner = '\n' + parts.join('\n') + '\n' + pad; }
  const out = pad + '<' + tag + attrs + ' style="' + css.filter(Boolean).join(';') + '">' + inner + '</' + tag + '>';
  st.chars += out.length; return out;
}
async function frameRef(n, byId) {
  USED_VARS = new Set();
  const st = { count: 0, max: 1500, chars: 0, maxChars: 700000, truncated: false, byId, imgBytes: 0, svgs: 0, fonts: {}, links: new Set(), notes: new Set() };
  const body = await nodeHtml(n, st, null, 0);
  const fonts = {}; Object.keys(st.fonts).forEach(f => fonts[f] = [...st.fonts[f]].sort((a, b) => a - b));
  return { id: n.id, name: n.name, page: pageOf(n), w: Math.round(n.width), h: Math.round(n.height), nodes: st.count, truncated: st.truncated, body, links: [...st.links], fonts, vars: [...USED_VARS], notes: [...st.notes] };
}
function rootVars(tokens) {
  const U = { spacing: 'px', radius: 'px', size: 'px', border: 'px', breakpoint: 'px' };
  return tokens.map(t => { const r = Object.values(t.modes)[0]; if (!r || r.status !== 'resolved' || (t.type !== 'COLOR' && t.type !== 'FLOAT')) return null; return '  ' + varName(t.name) + ': ' + r.value + (t.type === 'FLOAT' ? (U[t.category] || '') : '') + ';'; }).filter(Boolean).slice(0, 300);
}
async function rescanIcons(msg) {
  const flags = {};
  for (const c of (DISC ? DISC.comps : []).slice(0, 600)) {
    const nd = await figma.getNodeByIdAsync(c.id); if (!nd) continue;
    const b = nd.type === 'COMPONENT_SET' ? (nd.children[0] || nd) : nd, r = iconScore(Object.assign(describe(b), { name: nd.name }), msg.rules || {});
    flags[c.id] = { icon: r.isIcon, conf: r.score };
  }
  post('icons-rescanned', { flags });
}
async function listFrames(msg) {
  await figma.loadAllPagesAsync(); const out = [], names = [], t0 = Date.now();
  for (const pid of msg.pageIds) {
    const page = await figma.getNodeByIdAsync(pid); if (!page || page.type !== 'PAGE') continue;
    await page.loadAsync(); names.push(page.name);
    for (const f of topFrames(page).slice(0, 80)) { let inst = null; if (Date.now() - t0 < 4000) { try { inst = f.findAllWithCriteria({ types: ['INSTANCE'] }).length; } catch (e) { inst = null; } } out.push({ id: f.id, name: f.name, page: page.name, w: Math.round(f.width), h: Math.round(f.height), instances: inst, excluded: EXC.test(f.name) || EXC.test(page.name) }); }
  }
  const rec = out.filter(f => !f.excluded && f.w >= 280 && (f.instances || 0) >= 3).sort((a, b) => (b.instances || 0) - (a.instances || 0)).slice(0, 10).map(f => f.id);
  out.forEach(f => f.recommended = rec.includes(f.id));
  const c = msg.counts || {};
  post('frames', { frames: out, draft: { product: figma.root.name, description: 'Design system file with ' + (c.components || 0) + ' component(s), ' + (c.tokens || 0) + ' token(s) and ' + (c.styles || 0) + ' style(s) across ' + names.length + ' page(s).', inferences: inferFromFrames(out, names.concat(out.map(f => f.name), msg.compNames || [])) } });
}
const THUMBS = {};
async function frameThumb(msg) {
  const id = msg.id; if (!id) return;
  if (THUMBS[id] !== undefined) { post('frame-thumb', { id, dataUrl: THUMBS[id] }); return; }
  try {
    const n = await figma.getNodeByIdAsync(id);
    if (!n) throw new Error('Frame is no longer in the file');
    if (typeof n.loadAsync === 'function') await n.loadAsync();
    const w = Math.max(1, n.width), h = Math.max(1, n.height);
    const scale = Math.min(1, 360 / w, 700 / h);
    let b = await n.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
    if (b.length > 350000) b = await n.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale * 0.55 } });
    if (b.length > 350000) throw new Error('Preview is too large');
    const dataUrl = 'data:image/png;base64,' + figma.base64Encode(b);
    THUMBS[id] = dataUrl;
    post('frame-thumb', { id, dataUrl });
  } catch (e) {
    THUMBS[id] = '';
    post('frame-thumb', { id, error: String((e && e.message) || e) });
  }
}

// ---------- HTML engine (pluggable module: engines/fig-engine/) ----------
function engineModule() {
  try { if (typeof FigEngine !== 'undefined' && FigEngine && FigEngine.contract === 1) return FigEngine; } catch (e) { /* not bundled */ }
  try { if (typeof ReferenceEngine !== 'undefined' && ReferenceEngine && ReferenceEngine.contract === 1) return ReferenceEngine; } catch (e) { /* legacy engine */ }
  return null;
}
function getEngine(sel) {
  const E = engineModule();
  return E && sel.refEngine !== 'builtin' ? E : null;
}
function engineInfo() {
  const E = engineModule();
  return E ? { available: true, id: E.id, version: E.version, capabilities: E.capabilities || ['frame'] } : { available: false };
}
function refTokenMap(tokens, styles) {
  const N = cssNameMap(tokens), variables = {}, st = {}, cand = {}, colors = {};
  tokens.forEach(t => { variables[t.figmaId] = N.byFigma[t.figmaId]; const r = Object.values(t.modes)[0]; if (t.type === 'COLOR' && r && r.status === 'resolved') (cand[String(r.value).toUpperCase()] = cand[String(r.value).toUpperCase()] || []).push(t); });
  Object.keys(cand).forEach(k => { const L = cand[k], sem = L.filter(t => t.role === 'semantic'); const pick = L.length === 1 ? L[0] : sem.length === 1 ? sem[0] : null; if (pick) colors[k] = N.byFigma[pick.figmaId]; });
  ((styles && styles.paint) || []).forEach(x => { if (x.css) st[x.id] = '--paint-' + styleSlug(x.name); });
  ((styles && styles.effect) || []).forEach(x => { if (x.css) st[x.id] = '--shadow-' + styleSlug(x.name); });
  return { variables, styles: st, colors };
}
async function refFrame(nd, byId, E, tokMap, sel) {
  const embed = sel.refEmbedImages === true; let engineErr = null;
  if (E) {
    try {
      const r = await E.exportFrame(nd, tokMap, { matchColorsByValue: sel.refMatchColors !== false, embedImages: embed });
      return { id: nd.id, name: nd.name, page: pageOf(nd), w: r.width, h: r.height, nodes: r.nodes, truncated: false, body: r.bodyHtml, css: r.css, files: r.files || [], engine: r.engine + '@' + r.version, rtl: r.rtl, links: r.links, fonts: r.fonts, vars: r.vars, notes: [...(r.notes || [])] };
    } catch (e) { engineErr = String((e && e.message) || e); }
  }
  const rec = await frameRef(nd, byId); rec.css = rec.css || ''; rec.files = [];
  if (!embed) { const m = new Map(); rec.body = extractDataImages(rec.body, m); m.forEach((b64, path) => rec.files.push({ path, base64: b64 })); }
  rec.engine = engineErr ? 'builtin (fallback)' : 'builtin'; if (engineErr) rec.notes = (rec.notes || []).concat(['Rendered with the built-in renderer because the engine failed: ' + engineErr]);
  return rec;
}

function sendFiles(files, lint) {
  const CH = 600000; post('files-begin', { count: files.length });
  files.forEach(f => {
    if (f.content.length <= CH) post('file', { path: f.path, content: f.content, binary: !!f.binary });
    else { const n = Math.ceil(f.content.length / CH); for (let i = 0; i < n; i++) post('file-chunk', { path: f.path, binary: !!f.binary, i, n, part: f.content.slice(i * CH, (i + 1) * CH) }); }
  });
  post('files-done', { lint });
}

// ---------- Extraction ----------
let DRAFT = null;
const selKey = s => JSON.stringify([s.pageIds, s.collectionIds, s.categories, s.styles, s.styleIds, s.libStyles, s.componentIds, s.iconRules]);
const pageOf = n => { let p = n; while (p && p.type !== 'PAGE') p = p.parent; return p ? p.name : '(external library)'; };

async function componentSpec(root) {
  const sp = [], b = root.boundVariables || {}, px = v => typeof v === 'number' ? Math.round(v * 100) / 100 + 'px' : null;
  const bn = k => { const a = b[k], al = Array.isArray(a) ? a[0] : a; return al && al.id && BYID[al.id] ? BYID[al.id].name : null; };
  const paintOf = arr => Array.isArray(arr) ? arr.find(x => x.visible !== false && x.type === 'SOLID') : null;
  const pb = p => p && p.boundVariables && p.boundVariables.color && BYID[p.boundVariables.color.id] ? BYID[p.boundVariables.color.id].name : null;
  sp.push({ prop: 'width', raw: px(root.width), bound: bn('width') }, { prop: 'height', raw: px(root.height), bound: bn('height') });
  if (root.layoutMode && root.layoutMode !== 'NONE') {
    sp.push({ prop: 'display', raw: 'flex' }, { prop: 'flex-direction', raw: root.layoutMode === 'HORIZONTAL' ? 'row' : 'column' }, { prop: 'gap', raw: px(root.itemSpacing), bound: bn('itemSpacing') });
    [['padding-top', 'paddingTop'], ['padding-right', 'paddingRight'], ['padding-bottom', 'paddingBottom'], ['padding-left', 'paddingLeft']].forEach(x => sp.push({ prop: x[0], raw: px(root[x[1]]), bound: bn(x[1]) }));
  }
  const rad = typeof root.cornerRadius === 'number' ? root.cornerRadius : (typeof root.topLeftRadius === 'number' ? root.topLeftRadius : null);
  if (rad !== null) sp.push({ prop: 'border-radius', raw: px(rad), bound: bn('topLeftRadius') || bn('cornerRadius') });
  const f = paintOf(root.fills); if (f) sp.push({ prop: 'background-color', raw: hex({ r: f.color.r, g: f.color.g, b: f.color.b, a: f.opacity }), bound: pb(f) });
  const st = paintOf(root.strokes);
  if (st && typeof root.strokeWeight === 'number' && root.strokeWeight > 0) sp.push({ prop: 'border-width', raw: px(root.strokeWeight), bound: bn('strokeWeight') }, { prop: 'border-color', raw: hex({ r: st.color.r, g: st.color.g, b: st.color.b, a: st.opacity }), bound: pb(st) });
  const texts = root.findAll ? root.findAll(x => x.type === 'TEXT').slice(0, 4) : [];
  for (const t of texts) {
    let sn = null;
    try { if (typeof t.textStyleId === 'string' && t.textStyleId) { if (!STYN[t.textStyleId]) { const stl = await figma.getStyleByIdAsync(t.textStyleId); STYN[t.textStyleId] = stl ? stl.name : ''; } sn = STYN[t.textStyleId] || null; } } catch (e) { /* ignore */ }
    const lhv = t.lineHeight && t.lineHeight.unit === 'PIXELS' ? Math.round(t.lineHeight.value * 100) / 100 : null, wt = typeof t.fontWeight === 'number' ? t.fontWeight : null;
    sp.push({ prop: 'text', node: t.name, textStyle: sn, size: typeof t.fontSize === 'number' ? Math.round(t.fontSize * 100) / 100 : null, weight: wt, lh: lhv, raw: typeof t.fontSize === 'number' ? Math.round(t.fontSize * 100) / 100 + 'px' : null });
  }
  return sp.filter(x => x.raw || x.bound || x.textStyle);
}
async function extractComponent(n, pageName) {
  const isSet = n.type === 'COMPONENT_SET', issues = [];
  let properties;
  try {
    properties = Object.entries(n.componentPropertyDefinitions || {}).map(([k, d]) => ({ name: k.replace(/#\d+:\d+$/, ''), type: d.type, default: String(d.defaultValue), options: d.variantOptions || null }));
  } catch (e) {
    const map = {};
    (isSet ? n.children : []).forEach(ch => ch.name.split(',').forEach(part => { const kv = part.split('='); if (kv.length !== 2) return; const k = kv[0].trim(), v = kv[1].trim(); (map[k] = map[k] || []); if (!map[k].includes(v)) map[k].push(v); }));
    properties = Object.keys(map).map(k => ({ name: k, type: 'VARIANT', default: map[k][0], options: map[k] }));
    issues.push({ code: 'COMPONENT_SET_HAS_ERRORS', severity: 'warning', entityId: 'component.' + slug(n.name), message: 'Figma reports errors in component set "' + n.name + '"; properties were read from variant names.', recovery: 'Fix duplicate or invalid variants in Figma.' });
  }
  const states = []; properties.forEach(p => { if (p.type === 'VARIANT' && /state|status/i.test(p.name) && p.options) p.options.forEach(o => states.push(o)); });
  const root = isSet ? (n.children[0] || n) : n, ids = new Set(), styleIds = new Set(), nested = {}, nodes = [root].concat(root.findAll(() => true).slice(0, 400));
  const walk = x => { if (!x || typeof x !== 'object') return; if (Array.isArray(x)) return x.forEach(walk); if (x.type === 'VARIABLE_ALIAS' && x.id) ids.add(x.id); else Object.values(x).forEach(walk); };
  let inst = 0;
  for (const nd of nodes) {
    try { walk(nd.boundVariables); } catch (e) { /* mixed values */ }
    try { ['textStyleId', 'fillStyleId', 'strokeStyleId', 'effectStyleId'].forEach(k => { const v = nd[k]; if (typeof v === 'string' && v) styleIds.add(v); }); } catch (e) { /* mixed */ }
    if (nd.type === 'INSTANCE' && inst++ < 60) {
      const mc = await nd.getMainComponentAsync();
      if (mc) { const t = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc; if (t.name !== n.name) nested[t.name] = { name: t.name, nodeId: t.id, remote: t.remote === true }; noteIcon(t, n.name); }
    }
  }
  const iconR = noteIcon(n, null);
  let spec = [], variantDims = [];
  try { spec = await componentSpec(root); } catch (e) { /* ignore */ }
  if (isSet) variantDims = n.children.slice(0, 30).map(ch => ({ name: ch.name, w: Math.round(ch.width), h: Math.round(ch.height) }));
  if (!iconR) { try { await scanSmall(root, n.name); } catch (e) { /* ignore */ } }
  return { issues, comp: { spec, variantDims, icon: !!iconR, id: 'component.' + slug(n.name), figmaId: n.id, name: n.name, kind: isSet ? 'component-set' : 'component', page: pageName, description: n.description || '', origin: 'selection', requiredBy: [],
    variants: isSet ? n.children.length : 1, properties, states, tokens: [], dependencies: Object.keys(nested).sort(), _nested: Object.values(nested), _tokenIds: [...ids], _styleIds: [...styleIds] } };
}

async function buildDraft(sel, quiet) {
  const say = (v, l) => { if (!quiet) prog(v, l); };
  say(5, 'Reading variables…');
  const allVars = await figma.variables.getLocalVariablesAsync(), cols = await figma.variables.getLocalVariableCollectionsAsync(), byId = {}, colById = {};
  allVars.forEach(v => byId[v.id] = v); cols.forEach(c => colById[c.id] = c);
  const mk = (v, dep) => {
    const col = colById[v.variableCollectionId], modes = {}, chainIds = [];
    col.modes.forEach(m => { const r = resolve(v, m.modeId, byId, colById); chainIds.push(...r.ids); delete r.ids; modes[m.name] = r; });
    const [cat, src] = category(v), first = v.valuesByMode[col.defaultModeId];
    return { id: 'token.' + v.name.split('/').map(slug).join('.'), figmaId: v.id, name: v.name, type: v.resolvedType, category: cat, categorySource: src, collection: col.name,
      role: first && first.type === 'VARIABLE_ALIAS' ? 'semantic' : 'primitive', origin: dep ? 'dependency' : 'selection', requiredBy: [], modes, usedBy: [], _chainIds: chainIds };
  };
  const tokens = [], have = new Set();
  allVars.forEach(v => { if (sel.collectionIds.includes(v.variableCollectionId) && (!sel.categories || sel.categories.includes(category(v)[0]))) { tokens.push(mk(v, false)); have.add(v.id); } });

  say(20, 'Reading styles…');
  ICON = { cache: {}, map: {}, smallN: 0 }; BYID = byId; STYN = {}; ICON_RULES = Object.assign({}, ICON_DEFAULT, sel.iconRules || {});
  const styles = { text: [], paint: [], effect: [] }, issues = [];
  if (sel.styles) {
    const readers = [['text', () => figma.getLocalTextStylesAsync()], ['paint', () => figma.getLocalPaintStylesAsync()], ['effect', () => figma.getLocalEffectStylesAsync()]];
    for (const [k, fn] of readers) {
      try { (await fn()).forEach(x => { if (sel.styleIds && !sel.styleIds.includes(x.id)) return; const r = styleRec(x, 'local'); if (r) styles[k].push(r); else issues.push({ code: 'STYLE_UNREADABLE', severity: 'warning', entityId: 'style:' + x.name, message: 'Style "' + x.name + '" could not be read.', recovery: 'Open the style in Figma and check it.' }); }); }
      catch (e) { issues.push({ code: 'STYLES_UNREADABLE', severity: 'warning', entityId: 'styles.' + k, message: 'Could not read ' + k + ' styles: ' + String((e && e.message) || e), recovery: 'Retry; if it persists, check the file for broken styles.' }); }
    }
  }
  const components = [], screens = [], pagesOut = [], wanted = sel.componentIds ? new Set(sel.componentIds) : null;
  for (let pi = 0; pi < sel.pageIds.length; pi++) {
    const page = await figma.getNodeByIdAsync(sel.pageIds[pi]);
    if (!page || page.type !== 'PAGE') continue;
    await page.loadAsync(); pagesOut.push(page.name);
    topFrames(page).forEach(c => { if (screens.length < 200) screens.push({ name: c.name, page: page.name, id: c.id, w: Math.round(c.width) }); });
    const found = page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }).filter(n => !(n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') && (!wanted || wanted.has(n.id)));
    for (let i = 0; i < found.length; i++) {
      say(30 + Math.round(((pi + i / found.length) / sel.pageIds.length) * 50), 'Component: ' + found[i].name);
      const r = await extractComponent(found[i], page.name); components.push(r.comp); issues.push(...r.issues);
    }
  }
  if (sel.styles && sel.libStyles !== false) {
    const known = new Set([].concat(styles.text, styles.paint, styles.effect).map(x => x.id)), used = new Set(); components.forEach(c => c._styleIds.forEach(id => used.add(id)));
    for (const id of used) { if (known.has(id)) continue; try { const st = await figma.getStyleByIdAsync(id), r = st && styleRec(st, st.remote ? 'library' : 'local'); if (r) { styles[r.kind].push(r); known.add(id); } } catch (e) { /* inaccessible style */ } }
    Object.keys(styles).forEach(k => styles[k].sort((a, b) => a.name.localeCompare(b.name)));
  }
  components.sort((a, b) => a.name.localeCompare(b.name));
  const expand = id => mk(byId[id], true)._chainIds;
  DRAFT = { key: selKey(sel), byId, colById, mk, expand, tokens, have, styles, components, screens, pagesOut, issues, cols };
  return DRAFT;
}

async function detect(sel) {
  const D = await buildDraft(sel, true), plan = planDependencies(D.components, D.tokens, D.have, D.byId, D.expand);
  post('deps', { plan, selected: { components: D.components.length, tokens: D.tokens.length } });
}

async function analyze(sel, ctxForm, dd) {
  await figma.clientStorage.setAsync('sel2', sel);
  const D = DRAFT && DRAFT.key === selKey(sel) ? DRAFT : await buildDraft(sel, false);
  prog(82, 'Resolving dependencies…');
  const plan = planDependencies(D.components, D.tokens, D.have, D.byId, D.expand), pol = applyPolicy(plan, sel.depPolicy, dd);
  const tokens = D.tokens.slice(), have = new Set(D.have), components = D.components.slice(), issues = D.issues.concat(pol.warnings);
  const addTokens = list => list.forEach(d => { if (have.has(d.id) || !D.byId[d.id]) return; const t = D.mk(D.byId[d.id], true); t.requiredBy = d.requiredBy.map(r => r.by).filter((x, i, a) => a.indexOf(x) === i).sort(); tokens.push(t); have.add(d.id); });
  addTokens(pol.tokenDeps);
  const added = [];
  for (const m of pol.components) {
    const node = await figma.getNodeByIdAsync(m.nodeId);
    if (!node || node.remote) { issues.push({ code: 'DEPENDENCY_MISSING_COMPONENT', severity: 'warning', entityId: m.name, message: 'Component "' + m.name + '" could not be read.', recovery: 'Open the library file or expand scope.' }); continue; }
    const r = await extractComponent(node, pageOf(node)); r.comp.origin = 'dependency'; r.comp.requiredBy = m.requiredBy.map(x => x.by).sort();
    components.push(r.comp); added.push(r.comp); issues.push(...r.issues);
  }
  if (added.length && sel.depPolicy === 'auto_include') addTokens(planDependencies(added, [], have, D.byId, D.expand).tokenDeps);
  components.sort((a, b) => a.name.localeCompare(b.name) || a.figmaId.localeCompare(b.figmaId)); tokens.sort((a, b) => a.name.localeCompare(b.name));
  uniquifyComponents(components);
  const usedBy = {};
  components.forEach(c => { c.tokens = [...new Set(c._tokenIds.map(id => D.byId[id] && D.byId[id].name).filter(Boolean))].sort(); c._tokenIds.forEach(id => (usedBy[id] = usedBy[id] || new Set()).add(c.name)); });
  tokens.forEach(t => { if (usedBy[t.figmaId]) t.usedBy = [...usedBy[t.figmaId]].sort(); });

  const facts = ['Selected scope contains ' + D.pagesOut.length + ' page(s) and ' + D.screens.length + ' top-level frame(s).'].concat(D.screens.slice(0, 30).map(s => 'Frame "' + s.name + '" on page "' + s.page + '" (' + s.id + ')'));
  const designComps = components.filter(c => !c.icon);
  const cm = (ctxForm && ctxForm.mode) || 'skip';
  if (sel.icons !== false) { prog(88, 'Detecting icons…'); await scanFrames(sel.pageIds); } else SHEETS = new Set();
  D.screens.forEach(x => { x.sheet = SHEETS.has(x.id); });
  const figInf = inferFromFrames(D.screens.filter(x => !x.sheet), D.pagesOut.concat(D.screens.filter(x => !x.sheet).map(x => x.name), components.map(c => c.name)));
  if (sel.icons === false) ICON.map = {};
  Object.values(ICON.map).filter(r => r.unnamed).sort((a, b) => a.w - b.w || a.h - b.h || String(a.id).localeCompare(String(b.id))).forEach((r, i) => { r.name = 'Unnamed icon ' + (i + 1) + ' (' + r.w + '×' + r.h + ')'; });
  const icons = Object.values(ICON.map).map(r => ({ id: 'icon.' + slug(r.name), figmaId: r.id, name: r.name, named: !r.unnamed, label: 'Icon', kind: r.kind, w: r.w, h: r.h, confidence: r.score, evidence: r.evidence, usedIn: [...r.usedIn].sort(), svg: '' })).sort((a, b) => (a.named === b.named ? a.name.localeCompare(b.name) : a.named ? -1 : 1));
  if (sel.iconSvg) { prog(92, 'Exporting icon SVG…'); for (const ic of icons.slice(0, 150)) { try { const c = ICON.cache[ic.figmaId], sv = c && c.base ? await c.base.exportAsync({ format: 'SVG_STRING' }) : ''; ic.svg = sv && sv.length <= 8000 ? sv.replace(/<\?xml[^>]*>\s*/, '') : ''; } catch (e) { /* skip */ } } }
  const refs = [], refReport = { ok: [], failed: [] };
  for (const id of (sel.refFrameIds || []).slice(0, 100)) { prog(95, 'Reference frame ' + (refs.length + 1) + '…'); try { const nd = await figma.getNodeByIdAsync(id); if (nd && nd.type === 'FRAME') { const rf = await refFrame(nd, D.byId, getEngine(sel), refTokenMap(tokens, D.styles), sel); refs.push(rf); refReport.ok.push({ id: rf.id, name: rf.name, nodes: rf.nodes, engine: rf.engine, images: (rf.files || []).length, notes: rf.notes || [] }); } else refReport.failed.push({ id, name: nd ? nd.name : id, reason: 'Not a top-level frame' }); } catch (e) { const why = String((e && e.message) || e); refReport.failed.push({ id, name: id, reason: why }); issues.push({ code: 'REFERENCE_FAILED', severity: 'warning', entityId: id, message: 'Frame could not be converted to code: ' + why, recovery: 'Deselect it or simplify the frame.' }); } }
  const E = getEngine(sel), compExport = { ok: [], failed: [], engine: E ? E.id + '@' + E.version : null };
  if (E && typeof E.exportComponent === 'function' && sel.componentHtml !== false) {
    prog(96, 'Rendering component HTML…');
    const tokMap = refTokenMap(tokens, D.styles), classNames = new Set(), cap = 80;
    for (const c of designComps.slice(0, cap)) {
      try {
        const nd = await figma.getNodeByIdAsync(c.figmaId);
        if (!nd) throw new Error('Node is no longer in the file');
        const r = await E.exportComponent(nd, tokMap, { matchColorsByValue: sel.refMatchColors !== false, embedImages: true }, classNames);
        compExport.ok.push({ id: c.id, name: c.name, figmaId: c.figmaId, className: r.className, html: r.html, css: r.css, w: r.width, h: r.height, nodes: r.nodes, vars: r.vars });
      } catch (e) { compExport.failed.push({ id: c.id, name: c.name, reason: String((e && e.message) || e) }); }
    }
    if (designComps.length > cap) compExport.failed.push({ id: '', name: '', reason: 'Component HTML limit reached (' + cap + ')' });
  }
  const nSty = D.styles.text.length + D.styles.paint.length + D.styles.effect.length, autoDesc = 'Design system file with ' + designComps.length + ' component(s), ' + tokens.length + ' token(s) and ' + nSty + ' style(s) across ' + D.pagesOut.length + ' page(s).';
  D.cols.filter(c => sel.collectionIds.includes(c.id)).forEach(c => facts.push('Variable collection "' + c.name + '" has ' + c.modes.length + ' mode(s): ' + c.modes.map(m => m.name).join(', ')));
  if (designComps.length) facts.push('Selected scope contains ' + designComps.length + ' component(s) or component set(s).');
  MODEL = { icons, iconPack: sel.iconPack || '', refs, refEmbed: sel.refEmbedImages === true, rootVars: rootVars(tokens), fileName: figma.root.name, pages: D.pagesOut, tokens, styles: D.styles, components: designComps, screens: D.screens, collections: D.cols.filter(c => sel.collectionIds.includes(c.id)).map(c => ({ name: c.name, modes: c.modes.map(m => m.name) })),
    componentHtml: compExport,
    sections: sel.sections || {}, context: cm === 'skip' ? buildContext({}, facts, []) : buildContext(ctxForm, facts, figInf, { name: figma.root.name, description: autoDesc }), contentPack: cm !== 'skip', ctxMode: cm, depPolicy: sel.depPolicy,
    depSummary: { tokens: tokens.filter(t => t.origin === 'dependency').length, components: components.filter(c => c.origin === 'dependency').length } };
  MODEL.validation = validate(MODEL, issues);
  MODEL.fileList = null;
  const review = [], heur = {};
  tokens.forEach(t => { if (t.categorySource === 'name-heuristic' && t.category !== 'other') (heur[t.category] = heur[t.category] || []).push(t.name); });
  Object.keys(heur).sort().forEach(c => review.push({ id: 'cat:' + c, kind: 'Low confidence', title: 'Category "' + c + '" was inferred from variable names', detail: heur[c].length + ' token(s)', confidence: 0.7, evidence: heur[c].slice(0, 3), decidable: true }));
  MODEL.context.inferences.forEach(i => review.push({ id: i.id, kind: 'Context inference', title: i.statement, detail: 'from pasted context', confidence: i.confidence, evidence: i.evidence, decidable: true }));
  MODEL.validation.issues.filter(i => i.severity === 'error' || i.code.indexOf('DEPENDENCY_') === 0).slice(0, 60).forEach((i, k) => review.push({ id: 'iss:' + k, kind: i.code === 'DEPENDENCY_EXCLUDED' || i.code === 'DEPENDENCY_MISSING_COMPONENT' ? 'Missing dependency' : 'Unresolved reference', title: i.code + ' · ' + i.entityId, detail: i.message + ' ' + i.recovery, confidence: 1, evidence: [], decidable: false }));
  prog(100, 'Done');
  post('analysis', { summary: { pages: D.pagesOut.length, tokens: tokens.length, deps: MODEL.depSummary.tokens + MODEL.depSummary.components, components: designComps.length, componentsHtml: compExport.ok.length, styles: D.styles.text.length + D.styles.paint.length + D.styles.effect.length, screens: D.screens.length, icons: icons.length, refs: refs.length }, validation: MODEL.validation, review, refReport, compReport: { ok: compExport.ok.length, failed: compExport.failed, engine: compExport.engine } });
}

// ---------- Validation ----------

// ---------- design.md package generator (max 5 Markdown files, grouped by category) ----------
const esc = s => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const tbl = (h, rows) => rows.length ? '| ' + h.join(' | ') + ' |\n|' + h.map(() => '---').join('|') + '|\n' + rows.map(r => '| ' + r.map(esc).join(' | ') + ' |').join('\n') + '\n' : '';
const NA = '_Not available from the selected sources (unsupported or not detected)._\n';
const modeStr = t => Object.entries(t.modes).map(([m, r]) => m + ': ' + (r.status === 'resolved' ? r.value : '(' + r.status + ')')).join('; ');
const tokRows = L => L.map(t => [t.name + (t.origin === 'dependency' ? ' (dependency)' : ''), t.role, modeStr(t), (Object.values(t.modes)[0].chain || []).join(' → ') || '—']);
const UNS = [['foundations', 'Foundations'], ['patterns', 'Patterns'], ['layout', 'Layout'], ['responsive', 'Responsive'], ['interaction', 'Interaction'], ['accessibility', 'Accessibility'], ['content', 'Content'], ['documentation', 'Documentation'], ['governance', 'Governance']];



function referenceMd(M) {
  let s = '# Reference\n\n> Visual reference exported from Figma as HTML + CSS. Layout is generated from the node tree and can differ from Figma in details. Colors point to token variables when they were bound.\n\n';
  if ((M.rootVars || []).length) s += '## CSS variables (from tokens)\n\n```css\n:root {\n' + M.rootVars.join('\n') + '\n}\n```\n\n';
  (M.refs || []).forEach(r => { s += '## ' + r.name + '\n\n- Page: ' + r.page + '\n- Size: ' + r.w + '×' + r.h + 'px\n- Nodes: ' + r.nodes + (r.truncated ? ' (truncated)' : '') + '\n- Source: figma:' + r.id + '\n\n```html\n' + r.html + '\n```\n\n'; });
  const sv = (M.icons || []).filter(i => i.svg);
  if (sv.length) { s += '## Icons (SVG)\n\n'; sv.forEach(i => s += '### ' + i.name + '\n\n```svg\n' + i.svg + '\n```\n\n'); }
  return s;
}

// ---------- content.md: product identity & handoff document ----------
function domSep(tokens) {
  const f = n => n.includes('/') ? '/' : n.includes('.') ? '.' : n.includes('-') ? '-' : 'none', c = {};
  tokens.forEach(t => { const k = f(t.name); c[k] = (c[k] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a])[0] || 'none';
}

// ---------- design.md -> Figma (colors only, create-only) ----------
async function build(items) {
  if (!items.length) return post('built', { created: 0, skipped: 0 });
  const existing = new Set((await figma.variables.getLocalVariablesAsync()).map(v => v.name));
  const col = figma.variables.createVariableCollection('design.md import');
  let created = 0, skipped = 0;
  for (const it of items) {
    if (existing.has(it.name)) { skipped++; continue; }
    figma.variables.createVariable(it.name, col, 'COLOR').setValueForMode(col.defaultModeId, rgb(it.hex)); created++;
  }
  if (!created) col.remove();
  figma.notify('Created ' + created + ' variable(s)');
  post('built', { created, skipped });
}

async function resizeUi(msg) {
  const s = uiSize(msg.w, msg.h);
  figma.ui.resize(s[0], s[1]);
  if (msg.commit) await figma.clientStorage.setAsync('ui-size', { w: s[0], h: s[1] });
}

if (typeof figma !== 'undefined') figma.ui.onmessage = async msg => {
  try {
    if (msg.type === 'discover') await discover();
    else if (msg.type === 'detect') await detect(msg.sel);
    else if (msg.type === 'frames') await listFrames(msg);
    else if (msg.type === 'frame-thumb') await frameThumb(msg);
    else if (msg.type === 'resize') await resizeUi(msg);
    else if (msg.type === 'rescan-icons') await rescanIcons(msg);
    else if (msg.type === 'prompt') {
      const d = MODEL ? promptData(MODEL) : { name: DISC ? DISC.fileName : '', components: DISC ? DISC.comps.slice(0, 200).map(c => ({ name: c.name, variants: c.variants, states: [], props: [] })) : [], tokens: [], textStyles: [], icons: DISC ? DISC.comps.filter(c => c.icon).map(c => c.name) : [], themes: [] };
      d.files = msg.files || []; post('prompt-result', { text: buildPrompt(msg.opts, d), hasModel: !!MODEL, defaults: { name: d.name, platform: (d.platforms || [])[0] || '', language: d.language || '', direction: d.direction || '' } });
    }
    else if (msg.type === 'parse-context') post('context-parsed', parseContext(msg.text));
    else if (msg.type === 'analyze') await analyze(msg.sel, msg.ctx, msg.dd);
    else if (msg.type === 'generate') { if (!MODEL) throw new Error('Run the analysis first.'); MODEL.adherence = msg.adherence === undefined ? 3 : msg.adherence; { const out = gen(MODEL, msg.mode, msg.rejected, msg.rejInf); sendFiles(out, MODEL.lint); } }
    else if (msg.type === 'build') await build(msg.items);
    else if (msg.type === 'settings-set') await figma.clientStorage.setAsync('settings', msg.data);
    else if (msg.type === 'reset') { await figma.clientStorage.deleteAsync('sel2'); figma.notify('Saved selection cleared'); }
    else if (msg.type === 'close') figma.closePlugin();
  } catch (e) { post('error', { message: String((e && e.message) || e) }); }
};
if (typeof module !== 'undefined') module.exports = { sendFiles, uiSize, extractDataImages, refDoc, refIndex, validate, enrichModel, lintPackage, aggregateIssues, uniquifyComponents, matchTextStyle, nearestColor, guessPack, engineInfo, refTokenMap, aiControlMd, levelLine, referenceFiles, tokensCss, cssVar, iconScore, inferFromFrames, buildPrompt, promptData, referenceMd, iconsMd, parseContext, buildContext, ctxMd, contentMd, planDependencies, applyPolicy, resolve, gen };
