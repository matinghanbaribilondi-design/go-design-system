/**
 * Font metrics, so a fallback stands where the real font will stand.
 *
 * A custom font is embedded, so in the best case it is there before the first
 * paint. The cases that are not the best case are the ones that hurt: a font
 * served from `fonts/` while the page opens, a font that fails to load, a
 * print stylesheet that drops it. Then the browser uses the next family in the
 * stack — and that family has different vertical metrics, so every line box
 * changes height, every block of text reflows, and the design jumps.
 *
 * The fix is a second `@font-face` for a *named fallback* that carries the
 * custom font's own measurements: `ascent-override`, `descent-override`,
 * `line-gap-override` and `size-adjust`. Text laid out in the fallback then
 * occupies the same vertical space as text laid out in the real font.
 *
 * The numbers come from the font file itself — `head`, `hhea` and `OS/2` are
 * plain binary tables. Only uncompressed TTF/OTF are read: WOFF stores its
 * tables deflated and WOFF2 stores them brotli-compressed, and the plugin
 * sandbox has no decompressor to offer. A font that cannot be read simply gets
 * no fallback face, which is exactly what happens today.
 */

/** What a font says about its own vertical measurements, in font units. */
export interface FontMetrics {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  lineGap: number;
  /** `OS/2.xAvgCharWidth` — the only width signal a font exposes. */
  avgCharWidth: number | null;
}

/** The four descriptors a metric-compatible fallback needs. */
export interface MetricOverrides {
  sizeAdjust: number;
  ascentOverride: number;
  descentOverride: number;
  lineGapOverride: number;
}

/**
 * The reference every fallback is measured against.
 *
 * Arial is what the generic `sans-serif` resolves to on Windows and macOS, and
 * it is the font the standard fallback-metric technique calibrates against.
 * These are Arial's own numbers: 2048 units per em, 904 average character
 * width, 1854 ascender, 434 descender, 67 line gap.
 */
const REFERENCE = {
  unitsPerEm: 2048,
  ascender: 1854,
  descender: 434,
  lineGap: 67,
  avgCharWidth: 904,
};

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodes base64 without a platform dependency — the sandbox has neither `atob` nor `Buffer` guaranteed. */
export function base64ToBytes(input: string): Uint8Array {
  const clean = input.includes(',') ? input.slice(input.indexOf(',') + 1) : input;
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of clean) {
    const value = BASE64.indexOf(char);
    if (value < 0) continue; // padding and whitespace
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return Uint8Array.from(bytes);
}

function u16(view: DataView, offset: number): number {
  return view.getUint16(offset, false);
}

function i16(view: DataView, offset: number): number {
  return view.getInt16(offset, false);
}

function u32(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

/** `tag` at an offset, as ASCII. */
function tag(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

/**
 * Reads `head`, `hhea` and `OS/2` out of an sfnt file.
 *
 * Returns `null` for anything it cannot read with confidence: a WOFF/WOFF2
 * container, a collection, or a file whose table directory does not point at
 * real tables. A wrong override is worse than no override — it would move text
 * away from the design rather than towards it.
 */
export function parseFontMetrics(bytes: Uint8Array): FontMetrics | null {
  if (bytes.length < 12) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const version = u32(view, 0);
  // 0x00010000 = TrueType outlines, 'OTTO' = CFF outlines, 'true' = older Apple.
  const isSfnt = version === 0x00010000 || tag(view, 0) === 'OTTO' || tag(view, 0) === 'true';
  if (!isSfnt) return null;

  const numTables = u16(view, 4);
  if (numTables === 0 || numTables > 512) return null;

  const tables = new Map<string, { offset: number; length: number }>();
  for (let i = 0; i < numTables; i += 1) {
    const record = 12 + i * 16;
    if (record + 16 > bytes.length) return null;
    tables.set(tag(view, record), {
      offset: u32(view, record + 8),
      length: u32(view, record + 12),
    });
  }

  const head = tables.get('head');
  const hhea = tables.get('hhea');
  if (!head || !hhea) return null;
  if (head.offset + 54 > bytes.length || hhea.offset + 36 > bytes.length) return null;

  const unitsPerEm = u16(view, head.offset + 18);
  if (!unitsPerEm || unitsPerEm < 16 || unitsPerEm > 16384) return null;

  const ascender = i16(view, hhea.offset + 4);
  const descender = i16(view, hhea.offset + 6);
  const lineGap = i16(view, hhea.offset + 8);

  // A font with no vertical extent cannot describe a line box.
  if (ascender === 0 && descender === 0) return null;

  let avgCharWidth: number | null = null;
  const os2 = tables.get('OS/2');
  if (os2 && os2.offset + 4 <= bytes.length) {
    const value = i16(view, os2.offset + 2);
    if (value > 0) avgCharWidth = value;
  }

  return {
    unitsPerEm,
    ascender,
    descender: Math.abs(descender),
    lineGap: Math.max(0, lineGap),
    avgCharWidth,
  };
}

/**
 * The four descriptors, as percentages of the font size.
 *
 * `size-adjust` makes the fallback's average glyph the same width as the real
 * font's, so a line breaks in the same place. The three vertical overrides are
 * then divided by that same factor, because `size-adjust` has already scaled
 * the metrics they are replacing — this is the correction that keeps a
 * size-adjusted fallback's line box the height the design expects.
 */
export function metricOverrides(metrics: FontMetrics): MetricOverrides {
  const perEm = (units: number) => units / metrics.unitsPerEm;

  const sizeAdjust =
    metrics.avgCharWidth === null
      ? 1
      : perEm(metrics.avgCharWidth) / (REFERENCE.avgCharWidth / REFERENCE.unitsPerEm);

  const ascent = perEm(metrics.ascender) / sizeAdjust;
  const descent = perEm(metrics.descender) / sizeAdjust;
  const lineGap = perEm(metrics.lineGap) / sizeAdjust;

  return {
    sizeAdjust: Math.round(sizeAdjust * 10000) / 100,
    ascentOverride: Math.round(ascent * 10000) / 100,
    descentOverride: Math.round(descent * 10000) / 100,
    lineGapOverride: Math.round(lineGap * 10000) / 100,
  };
}

/** The family a metric fallback is registered under. */
export function fallbackFamily(family: string): string {
  return `${family} Fallback`;
}

/** Whether the export embeds this family — only those get a metric twin. */
export function isEmbeddedFamily(
  family: string,
  fonts: ReadonlyArray<{ family: string }> | undefined
): boolean {
  if (!fonts || fonts.length === 0) return false;
  const wanted = family.trim();
  return fonts.some((font) => font.family.trim() === wanted);
}

/**
 * The `font-family` value for a layer that uses `family`.
 *
 * When the export embeds the font, its metric twin is named right after it: the
 * twin is what paints the first frame, and it paints it in the right place. When
 * the font is not embedded the twin was never registered, so naming it would be
 * noise in every declaration — the plain stack is kept.
 */
export function fontFamilyWithFallback(family: string, chain: string): string {
  const fam = family.trim();
  if (!fam) return chain;
  const quoted = `'${fam.replace(/'/g, "\\'")}'`;
  const twin = fallbackFamily(fam).replace(/'/g, "\\'");
  return `${quoted}, '${twin}', ${chain}`;
}

/** Parsing is not free and the same font is asked about many times. */
const cache = new Map<string, MetricOverrides | null>();

/**
 * Overrides for an embedded font, or `null` when its file cannot be measured.
 *
 * Memoised by family + payload length: a document with a hundred text layers in
 * one custom font parses that font once.
 */
export function overridesFor(family: string, base64: string): MetricOverrides | null {
  const key = `${family}\u0000${base64.length}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const metrics = parseFontMetrics(base64ToBytes(base64));
  const overrides = metrics ? metricOverrides(metrics) : null;
  cache.set(key, overrides);
  return overrides;
}

/**
 * The `@font-face` block for a metric-compatible fallback.
 *
 * `src: local(…)` means nothing is downloaded: the fallback is whatever sans
 * the machine already has, wearing the custom font's measurements.
 */
export function fallbackFaceCss(family: string, overrides: MetricOverrides): string {
  return `@font-face {
  font-family: '${fallbackFamily(family)}';
  src: local('Arial'), local('Helvetica'), local('Liberation Sans'), local('Nimbus Sans');
  size-adjust: ${overrides.sizeAdjust}%;
  ascent-override: ${overrides.ascentOverride}%;
  descent-override: ${overrides.descentOverride}%;
  line-gap-override: ${overrides.lineGapOverride}%;
}`;
}
