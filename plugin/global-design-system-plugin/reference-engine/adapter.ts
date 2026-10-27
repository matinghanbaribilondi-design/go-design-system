/**
 * Reference Engine adapter — the ONLY file the host plugin talks to.
 *
 * Contract version 1. The host (src/core.js) depends on nothing but:
 *   ReferenceEngine.contract        number
 *   ReferenceEngine.id / .version   string
 *   ReferenceEngine.exportFrame(node, tokens, options) -> Promise<FrameResult>
 *
 * Everything under ./vendor/pixel-perfect is the converter/generator of the
 * "Pixel-Perfect HTML/CSS Exporter" plugin, copied unchanged. To update the
 * reference output: run `node scripts/sync-reference.mjs <path-to-that-plugin> --build`
 * (or replace the vendor folder / the prebuilt bundle). If the vendored API changes,
 * only this file needs to be adapted.
 */
import { convertNodeToIR } from './vendor/pixel-perfect/plugin/converter';
import { generateHtml, hasRtlInTree } from './vendor/pixel-perfect/generator/html-generator';
import { generateCss } from './vendor/pixel-perfect/generator/css-generator';
import { figmaColorToHex, figmaColorToRgba } from './vendor/pixel-perfect/plugin/converter/utils';
import { normalizeColorKey } from './vendor/pixel-perfect/plugin/variables/variable-collector';
import type { ConversionOptions, IRNode } from './vendor/pixel-perfect/plugin/types/ir';
import type { ExportedToken, VariablesExportResult } from './vendor/pixel-perfect/plugin/variables/variable-collector';
import meta from './ENGINE.json';

export const contract = 1;
export const id: string = meta.id;
export const version: string = meta.version;

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
  notes: string[];
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
  const mk = (key: string, css: string, type: ExportedToken['type'] = 'string'): ExportedToken => ({ id: key, name: css, cssVarName: css, type, value: '' });
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
    resolveColor: (color: RGB, opacity = 1, boundVarId?: string | null, styleId?: string | null) => {
      const bound = (boundVarId && tokensMap.get(boundVarId)) || (styleId && tokensMap.get(styleId)) || null;
      if (bound) return `var(${bound.cssVarName})`;
      const byValue = matchColors ? colorValueMap.get(normalizeColorKey(color, opacity)) : undefined;
      if (byValue) return `var(${byValue.cssVarName})`;
      return opacity >= 1 ? figmaColorToHex(color) : figmaColorToRgba(color, opacity);
    },
    getCssVariablesBlock: () => '',
    getTailwindThemeBlock: () => '',
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
    const rx = (node as unknown as { reactions?: Array<{ actions?: Array<Record<string, unknown>>; action?: Record<string, unknown> }> }).reactions || [];
    rx.forEach((r) => (r.actions || (r.action ? [r.action] : [])).forEach((a) => {
      if (a && a['type'] === 'NODE' && typeof a['destinationId'] === 'string' && a['navigation'] !== 'OVERLAY' && a['navigation'] !== 'SWAP') {
        const cls = byId.get(node.id);
        if (cls) gos.set(cls, a['destinationId'] as string);
      }
    }));
  } catch { /* ignore */ }
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
  return text.replace(/data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/g, (m, kind: string, b64: string) => {
    if (b64.length < 2000) return m;
    const path = `assets/${hashStr(b64)}.${kind === 'jpeg' ? 'jpg' : kind}`;
    if (!files.has(path)) files.set(path, b64);
    return path;
  });
}

export async function exportFrame(node: SceneNode, tokens: TokenMap, o: ExportOptions = {}): Promise<FrameResult> {
  const options: ConversionOptions = {
    outputMode: 'pure-css', useRem: false, baseFontSize: 16, includeReset: false, inlineAssets: true,
    semanticTags: o.semanticTags !== false, imageScale: o.imageScale === undefined ? 'auto' : o.imageScale,
  };
  const registry = buildRegistry(tokens, o.matchColorsByValue !== false);
  const ir = await convertNodeToIR(node, null, options, registry);
  if (!ir) throw new Error('The frame is hidden or cannot be exported.');
  const rtl = hasRtlInTree(ir);
  let body = generateHtml(ir, 0);
  let css = generateCss(ir, options, rtl, undefined);
  const fileMap = new Map<string, string>();
  if (!o.embedImages) { body = externalizeImages(body, fileMap); css = externalizeImages(css, fileMap); }

  const byId = new Map<string, string>(), count = { nodes: 0, assets: 0 };
  indexIR(ir, byId, count);
  const gos = new Map<string, string>();
  addLinks(node, byId, gos);
  const links: string[] = [];
  gos.forEach((dest, cls) => {
    links.push(dest);
    body = body.split(`class="${cls}"`).join(`class="${cls}" data-go="${dest}"`);
  });

  const fs: Record<string, Set<number>> = {};
  collectFonts(node, fs);
  if (rtl) (fs['Vazirmatn'] = fs['Vazirmatn'] || new Set()).add(400).add(700);
  const fonts: Record<string, number[]> = {};
  Object.keys(fs).forEach((f) => { fonts[f] = Array.from(fs[f]!).sort((a, b) => a - b); });

  const vars = Array.from(new Set((css.match(/var\((--[\w-]+)/g) || []).map((m) => m.slice(4))));
  return { engine: id, version, name: node.name, width: Math.round(node.width), height: Math.round(node.height), bodyHtml: body, css, vars, links: Array.from(new Set(links)), fonts, rtl, nodes: count.nodes, assets: count.assets, files: Array.from(fileMap.entries()).map(([path, base64]) => ({ path, base64 })), notes: [] };
}
