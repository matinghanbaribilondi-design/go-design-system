/**
 * fig-engine adapter — the ONLY file the host plugin talks to.
 *
 * Contract version 1 (additive `exportComponent` / `capabilities`).
 *
 *   FigEngine.contract                          number
 *   FigEngine.id / .version                     string
 *   FigEngine.capabilities                      string[]
 *   FigEngine.exportFrame(node, tokens, opts)   -> Promise<FrameResult>
 *   FigEngine.exportComponent(node, tokens, opts, classNames?) -> Promise<ComponentResult>
 *
 * Everything under ./vendor/ is copied unchanged from two sibling projects:
 *   fig-engine      the .fig exporter this module is named after
 *   html-generator  the renderer fig-engine itself depends on (SceneNode -> HTML/CSS)
 * The plugin runs inside Figma, so only the renderer half is needed. Refresh
 * it with `node scripts/sync-fig-engine.mjs --build`; only this file has to
 * change if the vendored API moves.
 */
import { convertNodeToIR } from './vendor/html-generator/src/plugin/converter/index.ts';
import { figmaColorToHex, figmaColorToRgba } from './vendor/html-generator/src/plugin/converter/utils.ts';
import { normalizeColorKey } from './vendor/html-generator/src/plugin/variables/variable-collector.ts';
import { generateHtml, hasRtlInTree } from './vendor/html-generator/src/generator/html-generator.ts';
import { createCssBuilder } from './vendor/html-generator/src/generator/css-generator.ts';
import type { ConversionOptions, IRNode } from './vendor/html-generator/src/plugin/types/ir.ts';
import type {
  ExportedToken,
  VariablesExportResult,
} from './vendor/html-generator/src/plugin/variables/variable-collector.ts';
import type { TokenRegistry } from './vendor/html-generator/src/shared/token-resolver.ts';
import meta from './ENGINE.json';

export const contract = 1;
export const id: string = meta.id;
export const version: string = meta.version;
export const capabilities: string[] = ['frame', 'component', 'markers', 'metadata'];

/** Names of the host's CSS variables, so the HTML links to the same tokens as tokens.css. */
export interface TokenMap {
  /** Figma variable id -> css variable name (e.g. "--color-primary") */
  variables: Record<string, string>;
  /** Figma paint/effect style id -> css variable name (e.g. "--shadow-card") */
  styles: Record<string, string>;
  /** hex color (#RRGGBB or #RRGGBBAA) -> css variable name; used only when matchColorsByValue is on */
  colors: Record<string, string>;
}

export interface ExportOptions {
  /** Keep images inline as data URLs (standalone HTML). Default false: images become files under assets/. */
  embedImages?: boolean;
  matchColorsByValue?: boolean;
  semanticTags?: boolean;
  imageScale?: number | 'auto';
  /** Intrinsic responsive output (container queries). Off by default: pixel output matches Figma. */
  responsive?: boolean;
}

export interface FrameResult {
  engine: string;
  version: string;
  name: string;
  width: number;
  height: number;
  bodyHtml: string;
  css: string;
  vars: string[];
  links: string[];
  fonts: Record<string, number[]>;
  rtl: boolean;
  nodes: number;
  assets: number;
  /** External image files referenced by bodyHtml/css as `assets/<name>`; content is base64. Empty when embedImages is true. */
  files: Array<{ path: string; base64: string }>;
  /** The components this frame actually uses, with their variant, property and instance metadata. */
  components: ComponentUsage[];
  /** Source-backed structure for deterministic pattern extraction; text, classes and styles are excluded. */
  structure: FrameStructureNode;
  notes: string[];
}

export interface FrameStructureNode {
  id: string;
  tag: string;
  componentId?: string;
  componentName?: string;
  componentFamilyId?: string;
  componentFamilyName?: string;
  variantProperties?: Record<string, string>;
  link?: boolean;
  control?: string;
  children: FrameStructureNode[];
}

export interface ComponentResult {
  engine: string;
  version: string;
  /** Figma node id of the exported component. */
  nodeId: string;
  name: string;
  /** Root class the component CSS is written against. */
  className: string;
  width: number;
  height: number;
  html: string;
  css: string;
  vars: string[];
  nodes: number;
  /** External image files referenced by html/css as `assets/<name>`; content is base64. */
  files: Array<{ path: string; base64: string }>;
  /** Family, variant axes and declared properties of the exported component. */
  metadata?: ComponentMeta;
  notes: string[];
}

/** What the engine knows about one Figma component: family, variant axes, properties. */
export interface ComponentMeta {
  id: string;
  name: string;
  familyId: string;
  familyName: string;
  variantProperties?: Record<string, string>;
  propertyDefinitions?: Record<string, { type: string; defaultValue?: string | boolean; variantOptions?: string[] }>;
}

export interface ComponentUsage extends ComponentMeta {
  instances: Array<{ id: string; name: string }>;
}

function readOpt<T>(get: () => T): T | undefined {
  try { return get(); } catch { return undefined; }
}

/** The component's own metadata, read the same way the engine reads an instance's. */
function componentMeta(node: SceneNode): ComponentMeta | undefined {
  const parent = readOpt(() => (node as ComponentNode).parent);
  const family = (parent && parent.type === 'COMPONENT_SET' ? parent : node) as ComponentSetNode;
  const meta: ComponentMeta = { id: node.id, name: node.name, familyId: family.id, familyName: family.name };
  const variants = readOpt(() => (node as ComponentNode).variantProperties) as Record<string, string> | undefined;
  if (variants && Object.keys(variants).length) meta.variantProperties = variants;
  const defs = readOpt(() => family.componentPropertyDefinitions) as Record<string, Record<string, unknown>> | undefined;
  const out: ComponentMeta['propertyDefinitions'] = {};
  Object.keys(defs || {}).forEach(k => {
    const d = (defs as Record<string, Record<string, unknown>>)[k];
    if (!d || typeof d.type !== 'string') return;
    const one: { type: string; defaultValue?: string | boolean; variantOptions?: string[] } = { type: d.type };
    if (typeof d.defaultValue === 'string' || typeof d.defaultValue === 'boolean') one.defaultValue = d.defaultValue;
    if (Array.isArray(d.variantOptions) && d.variantOptions.length) one.variantOptions = d.variantOptions.filter(x => typeof x === 'string') as string[];
    out[k] = one;
  });
  if (Object.keys(out).length) meta.propertyDefinitions = out;
  return meta;
}

/** Every component an exported frame actually uses, harvested from the IR. */
function usedComponents(root: IRNode): ComponentUsage[] {
  const byId = new Map<string, ComponentUsage>();
  const walk = (n: IRNode) => {
    const ref = n.componentRef as ComponentMeta & { componentProperties?: Record<string, string | boolean> } | undefined;
    if (ref) {
      let usage = byId.get(ref.id);
      if (!usage) {
        usage = { id: ref.id, name: ref.name, familyId: ref.familyId || ref.id, familyName: ref.familyName || ref.name, variantProperties: ref.variantProperties, propertyDefinitions: ref.propertyDefinitions, instances: [] };
        byId.set(ref.id, usage);
      }
      if (!usage.instances.some(x => x.id === n.id)) usage.instances.push({ id: n.id, name: n.name });
    }
    n.children.forEach(walk);
  };
  walk(root);
  return Array.from(byId.values());
}

function frameStructure(n: IRNode): FrameStructureNode {
  const ref = n.componentRef as ComponentMeta | undefined;
  const out: FrameStructureNode = { id: n.id, tag: n.tag, children: n.children.map(frameStructure) };
  if (ref) {
    out.componentId = ref.id;
    out.componentName = ref.name;
    out.componentFamilyId = ref.familyId || ref.id;
    out.componentFamilyName = ref.familyName || ref.name;
    if (ref.variantProperties) out.variantProperties = ref.variantProperties;
  }
  if (n.href) out.link = true;
  if (n.attrs && n.attrs.type) out.control = n.attrs.type;
  return out;
}

function hexKey(hex: string): string | null {
  const h = hex.replace('#', '');
  if (h.length !== 6 && h.length !== 8) return null;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? Math.round((parseInt(h.slice(6, 8), 16) / 255) * 1000) / 1000 : 1;
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return `${r},${g},${b},${a}`;
}

function buildRegistry(tokens: TokenMap, matchColors: boolean): VariablesExportResult {
  const tokensMap = new Map<string, ExportedToken>();
  const colorValueMap = new Map<string, ExportedToken>();
  const mk = (key: string, css: string, type: ExportedToken['type'] = 'string'): ExportedToken => ({
    id: key,
    name: css,
    cssVarName: css,
    type,
    value: '',
  });
  Object.keys(tokens.variables || {}).forEach((k) => tokensMap.set(k, mk(k, tokens.variables[k]!)));
  Object.keys(tokens.styles || {}).forEach((k) => tokensMap.set(k, mk(k, tokens.styles[k]!)));
  if (matchColors) {
    Object.keys(tokens.colors || {}).forEach((hex) => {
      const key = hexKey(hex);
      if (key) colorValueMap.set(key, mk(key, tokens.colors[hex]!, 'color'));
    });
  }
  return {
    tokens: [],
    cssVariablesBlock: '',
    tokensMap,
    colorValueMap,
    syntheticTokens: new Map<string, ExportedToken>(),
    textStyles: new Map(),
    effectStyles: new Map(),
    modeClasses: new Map(),
    resolveColor: (color: RGB, opacity = 1, boundVarId?: string | null, styleId?: string | null) => {
      const bound = (boundVarId && tokensMap.get(boundVarId)) || (styleId && tokensMap.get(styleId)) || null;
      if (bound) return `var(${bound.cssVarName})`;
      const byValue = matchColors ? colorValueMap.get(normalizeColorKey(color, opacity)) : undefined;
      if (byValue) return `var(${byValue.cssVarName})`;
      return opacity >= 1 ? figmaColorToHex(color) : figmaColorToRgba(color, opacity);
    },
    getCssVariablesBlock: () => '',
    getTailwindThemeBlock: () => '',
  } as VariablesExportResult;
}

function conversionOptions(o: ExportOptions): ConversionOptions {
  return {
    outputMode: 'pure-css',
    useRem: false,
    baseFontSize: 16,
    includeReset: false,
    inlineAssets: true,
    semanticTags: o.semanticTags !== false,
    imageScale: o.imageScale === undefined ? 'auto' : o.imageScale,
    responsive: o.responsive === true,
    componentDedup: false,
  };
}

function indexIR(n: IRNode, byId: Map<string, string>, count: { nodes: number; assets: number }) {
  byId.set(n.id, n.className);
  count.nodes++;
  if (n.asset) count.assets++;
  n.children.forEach((c) => indexIR(c, byId, count));
}

/** Prototype "navigate to" reactions -> data-go attributes (the host viewer turns them into links). */
function addLinks(node: SceneNode, byId: Map<string, string>, gos: Map<string, string>) {
  try {
    const rx = (node as unknown as { reactions?: Array<{ actions?: Array<Record<string, unknown>>; action?: Record<string, unknown> }> })
      .reactions || [];
    rx.forEach((r) =>
      (r.actions || (r.action ? [r.action] : [])).forEach((a) => {
        if (
          a &&
          a['type'] === 'NODE' &&
          typeof a['destinationId'] === 'string' &&
          a['navigation'] !== 'OVERLAY' &&
          a['navigation'] !== 'SWAP'
        ) {
          const cls = byId.get(node.id);
          if (cls) gos.set(cls, a['destinationId'] as string);
        }
      })
    );
  } catch {
    /* ignore */
  }
  if ('children' in node && Array.isArray((node as unknown as { children: SceneNode[] }).children)) {
    (node as unknown as { children: SceneNode[] }).children.forEach((c) => addLinks(c, byId, gos));
  }
}

function collectFonts(node: SceneNode, fonts: Record<string, Set<number>>) {
  if (node.type === 'TEXT') {
    const t = node as TextNode;
    try {
      t.getStyledTextSegments(['fontName', 'fontWeight']).forEach((s) => {
        const fam = s.fontName && (s.fontName as FontName).family;
        if (fam) (fonts[fam] = fonts[fam] || new Set()).add(s.fontWeight || 400);
      });
    } catch {
      const fn = t.fontName as FontName;
      if (fn && fn.family) (fonts[fn.family] = fonts[fn.family] || new Set()).add(400);
    }
  }
  if ('children' in node && Array.isArray((node as unknown as { children: SceneNode[] }).children)) {
    (node as unknown as { children: SceneNode[] }).children.forEach((c) => collectFonts(c, fonts));
  }
}

function hashStr(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + s.length.toString(36);
}

/** Replaces large inline images with relative files (assets/<hash>.<ext>); identical images are shared. */
function externalizeImages(text: string, files: Map<string, string>): string {
  return text.replace(
    /data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/g,
    (m, kind: string, b64: string) => {
      if (b64.length < 2000) return m;
      const path = `assets/${hashStr(b64)}.${kind === 'jpeg' ? 'jpg' : kind}`;
      if (!files.has(path)) files.set(path, b64);
      return path;
    }
  );
}

function varsOf(css: string): string[] {
  return Array.from(new Set((css.match(/var\((--[\w-]+)/g) || []).map((m) => m.slice(4))));
}

function fontsOf(node: SceneNode, rtl: boolean): Record<string, number[]> {
  const fs: Record<string, Set<number>> = {};
  collectFonts(node, fs);
  if (rtl) (fs['Vazirmatn'] = fs['Vazirmatn'] || new Set()).add(400).add(700);
  const fonts: Record<string, number[]> = {};
  Object.keys(fs).forEach((f) => {
    fonts[f] = Array.from(fs[f]!).sort((a, b) => a - b);
  });
  return fonts;
}

function renderCss(ir: IRNode, options: ConversionOptions, rtl: boolean): string {
  const builder = createCssBuilder(options, false);
  builder.addRoot(ir);
  return builder.finish(rtl);
}

export async function exportFrame(node: SceneNode, tokens: TokenMap, o: ExportOptions = {}): Promise<FrameResult> {
  const options = conversionOptions(o);
  const registry = buildRegistry(tokens, o.matchColorsByValue !== false);
  const ir = await convertNodeToIR(node as SceneNode, null, options, registry as unknown as TokenRegistry);
  if (!ir) throw new Error('The frame is hidden or cannot be exported.');
  const rtl = hasRtlInTree(ir);
  // data-component / data-component-id: the reference page says which Figma
  // component each subtree is, which is the only link a standalone HTML file can
  // carry to components/*.html.
  // Component *dedup* stays off on purpose: it shares one class across frames and
  // emits its rules once, so a second frame's own stylesheet would miss them.
  let body = generateHtml(ir, 0, false, { componentMarkers: true });
  let css = renderCss(ir, options, rtl);
  const fileMap = new Map<string, string>();
  if (!o.embedImages) {
    body = externalizeImages(body, fileMap);
    css = externalizeImages(css, fileMap);
  }

  const byId = new Map<string, string>(),
    count = { nodes: 0, assets: 0 };
  indexIR(ir, byId, count);
  const gos = new Map<string, string>();
  addLinks(node, byId, gos);
  const links: string[] = [];
  gos.forEach((dest, cls) => {
    links.push(dest);
    body = body.split(`class="${cls}"`).join(`class="${cls}" data-go="${dest}"`);
  });

  return {
    engine: id,
    version,
    name: node.name,
    width: Math.round(node.width),
    height: Math.round(node.height),
    bodyHtml: body,
    css,
    vars: varsOf(css),
    links: Array.from(new Set(links)),
    fonts: fontsOf(node, rtl),
    rtl,
    nodes: count.nodes,
    assets: count.assets,
    components: usedComponents(ir),
    structure: frameStructure(ir),
    files: Array.from(fileMap.entries()).map(([path, base64]) => ({ path, base64 })),
    notes: [],
  };
}

/**
 * Renders one component (a COMPONENT node, or the default variant of a set)
 * as a standalone fragment. Pass one shared `classNames` set when exporting a
 * batch into a single components.css, so two components never claim the same
 * class.
 */
export async function exportComponent(
  node: SceneNode,
  tokens: TokenMap,
  o: ExportOptions = {},
  classNames?: Set<string>
): Promise<ComponentResult> {
  const options = conversionOptions(o);
  const registry = buildRegistry(tokens, o.matchColorsByValue !== false);
  const root = node.type === 'COMPONENT_SET' ? (node.children[0] || node) : node;
  const ir = await convertNodeToIR(
    root as SceneNode,
    null,
    options,
    registry as unknown as TokenRegistry,
    undefined,
    classNames || new Set<string>()
  );
  if (!ir) throw new Error('The component is hidden or cannot be exported.');
  const rtl = hasRtlInTree(ir);
  let html = generateHtml(ir, 0);
  let css = renderCss(ir, options, rtl);
  const fileMap = new Map<string, string>();
  if (!o.embedImages) {
    html = externalizeImages(html, fileMap);
    css = externalizeImages(css, fileMap);
  }
  const count = { nodes: 0, assets: 0 };
  indexIR(ir, new Map(), count);
  return {
    engine: id,
    version,
    nodeId: node.id,
    name: node.name,
    className: ir.className,
    width: Math.round(root.width),
    height: Math.round(root.height),
    html,
    css,
    vars: varsOf(css),
    nodes: count.nodes,
    metadata: componentMeta(root),
    files: Array.from(fileMap.entries()).map(([path, base64]) => ({ path, base64 })),
    notes: [],
  };
}
