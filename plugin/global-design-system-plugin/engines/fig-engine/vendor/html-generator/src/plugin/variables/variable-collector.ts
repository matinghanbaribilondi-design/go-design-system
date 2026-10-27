import { figmaColorToRgba, figmaColorToHex, formatUnit, tokenValueMatchesPaint } from '../converter/utils';
import { ConversionOptions } from '../types/ir';
import { exportToCSS } from './varvar/collectionToCSS';
import { exportToTailwind } from './varvar/collectionToTailwind';
import { exportToJSON } from './varvar/collectionToJSON';
import { exportToJS } from './varvar/collectionToJS';
import { exportToCSV } from './varvar/collectionToCSV';
import { toCssVar } from './varvar/stringTransformation';
import { cssColorToRgba } from './varvar/color';
import { shouldUnitizeNumericValue } from './varvar/scopeToDTCG';
import { formatFloat32 } from './varvar/numberFormat';
import { formatNumericValue, toUnitOptions } from './varvar/units';
import { getFontWeightNumber } from '../converter/typography';
import { FONT_FALLBACK_CHAIN } from '../../shared/constants';
import { fontFamilyWithFallback, isEmbeddedFamily } from '../../shared/font-metrics';

export interface ExportedToken {
  id: string;
  name: string;
  cssVarName: string;
  type: 'color' | 'dimension' | 'string' | 'boolean' | 'shadow' | 'filter' | 'typography';
  value: string;
  collectionName?: string;
  modeName?: string;
  /** Where this token came from, so consumers can tell variables from styles. */
  source?: 'variable' | 'paint-style' | 'effect-style' | 'text-style' | 'synthetic';
  /** Variables only: the collection the token belongs to. */
  collectionId?: string;
  /** Variables only: the mode whose values live at `:root`. */
  defaultModeId?: string;
  /**
   * Variables only: the value this token resolves to in every mode, keyed by
   * mode id. `value` is the default-mode value; a node in another mode can
   * only reference the token when its theme class is applied.
   */
  modeValues?: Record<string, string>;
}

/**
 * Everything one Figma text style contributes, kept beside its tokens so the
 * typography converter can check a node's actual values against the style
 * before referencing them. A text style keeps its id on a node even after a
 * property is edited locally, so the style is a naming hint, not the value.
 */
export interface TextStyleTokenSet {
  id: string;
  name: string;
  family?: ExportedToken;
  size?: ExportedToken;
  weight?: ExportedToken;
  lineHeight?: ExportedToken;
  letterSpacing?: ExportedToken;
  paragraphSpacing?: ExportedToken;
  fontFamily: string;
  fontWeight: number;
  fontSizePx: number;
  lineHeightValue: LineHeight | null;
  letterSpacingValue: LetterSpacing | null;
  paragraphSpacingPx: number;
  fontStyleName: string;
  boundVariables?: Record<string, { id?: string }>;
}

/** The tokens an effect style can contribute, plus the effects they describe. */
export interface EffectStyleTokenSet {
  id: string;
  name: string;
  shadow?: ExportedToken;
  filter?: ExportedToken;
  backdropFilter?: ExportedToken;
  effects: readonly Effect[];
}

export interface VariablesExportResult {
  tokens: ExportedToken[];
  cssVariablesBlock: string;
  tailwindThemeBlock?: string;
  jsonExport?: string;
  jsExport?: string;
  csvExport?: string;
  tokensMap: Map<string, ExportedToken>; // Keyed by variable/style ID
  colorValueMap: Map<string, ExportedToken>; // Keyed by normalized color
  syntheticTokens: Map<string, ExportedToken>;
  /** Text style id -> its tokens and raw values. */
  textStyles: Map<string, TextStyleTokenSet>;
  /** Effect style id -> its tokens and raw effects. */
  effectStyles: Map<string, EffectStyleTokenSet>;
  /** `${collectionId}:${modeId}` -> the class VarVar emitted for that mode. */
  modeClasses: Map<string, string>;
  resolveColor: (color: RGB, opacity?: number, boundVarId?: string | null, styleId?: string | null) => string;
  getCssVariablesBlock: () => string;
  getTailwindThemeBlock: () => string;
}

/**
 * Normalizes an RGB color and opacity into a unique lookup key
 */
export function normalizeColorKey(color: RGB, opacity: number = 1): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round(opacity * 1000) / 1000;
  return `${r},${g},${b},${a}`;
}

/**
 * Sanitizes a Figma variable/style name to a standard CSS variable name
 * (e.g. "Color/Brand/Primary 500" -> "--color-brand-primary-500")
 */
export function variableNameToCssVar(name: string): string {
  return toCssVar(name, true, '-');
}

/**
 * The selector class VarVar emits for a non-default mode.
 * @param collectionName - Figma collection name
 * @param modeName - Figma mode name
 */
function modeClassFor(collectionName: string, modeName: string): string {
  // Matches `collectionToCSS.ts` exactly: both segments use the exporter's
  // default group separator, independent of the variable-name separator.
  return `${toCssVar(collectionName)}--${toCssVar(modeName)}`;
}

/** Declarations inside one `{ … }` block, keyed by custom-property name. */
function parseDeclarations(body: string): Map<string, string> {
  const values = new Map<string, string>();
  const re = /(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    const name = match[1];
    const value = match[2]?.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (name && value !== undefined && !values.has(name)) values.set(name, value);
  }
  return values;
}

/**
 * Reads the VarVar CSS exporter's own output back into lookup tables. The
 * exporter decides units, quoting, booleans and aliases; reading its result is
 * the only way the collector's token values can be guaranteed to be the values
 * the stylesheet actually defines. They disagreed before — an unscoped FLOAT
 * was unitised by the collector while VarVar wrote it bare — and every `var()`
 * to the collector's version silently resolved to an invalid length.
 * @param css - The generated variables block
 */
function parseVarVarCss(css: string): {
  root: Map<string, string>;
  modes: Map<string, Map<string, string>>;
} {
  const root = new Map<string, string>();
  const modes = new Map<string, Map<string, string>>();
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(css)) !== null) {
    const selectors = match[1] ?? '';
    const body = match[2] ?? '';
    const declarations = parseDeclarations(body);
    for (const rawSelector of selectors.split(',')) {
      const selector = rawSelector.trim();
      if (!selector) continue;
      if (selector === ':root') {
        for (const [name, value] of declarations) {
          if (!root.has(name)) root.set(name, value);
        }
      } else if (selector.startsWith('.')) {
        const className = selector.slice(1);
        const existing = modes.get(className) ?? new Map<string, string>();
        for (const [name, value] of declarations) {
          if (!existing.has(name)) existing.set(name, value);
        }
        modes.set(className, existing);
      }
    }
  }
  return { root, modes };
}

/**
 * A variable value in the exact shape VarVar's CSS exporter writes it. Used
 * when the generated block does not carry a definition (exporter failure,
 * unreachable collection).
 */
function formatVariableValue(
  value: VariableValue,
  resolvedType: VariableResolvedDataType,
  scopes: VariableScope[],
  variablesById: Map<string, Variable>,
  unitOptions: ReturnType<typeof toUnitOptions>
): string {
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    const linked = variablesById.get(value.id);
    return linked ? `var(${variableNameToCssVar(linked.name)})` : 'initial';
  }
  if (resolvedType === 'COLOR' && typeof value === 'object' && value !== null && 'r' in value) {
    const maybeAlpha = (value as { a?: unknown }).a;
    const alpha = typeof maybeAlpha === 'number' ? maybeAlpha : 1;
    return figmaColorToRgba(value as RGB, alpha);
  }
  if (resolvedType === 'FLOAT' && typeof value === 'number') {
    return shouldUnitizeNumericValue(scopes, false)
      ? formatNumericValue(value, unitOptions)
      : formatFloat32(value);
  }
  if (resolvedType === 'BOOLEAN') {
    return Boolean(value) ? 'var(--TRUE)' : 'var(--FALSE)';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return String(value);
}

/**
 * Follows a variable alias for one mode until it reaches a concrete value.
 * Returns the final variable and value so callers can colour-match aliases
 * (a semantic token usually aliases a base token, and the base token's colour
 * is what the node actually paints).
 */
function resolveAliasValue(
  variable: Variable,
  modeId: string,
  variablesById: Map<string, Variable>,
  depth = 0
): { variable: Variable; value: VariableValue } | null {
  const value = variable.valuesByMode[modeId];
  if (value === undefined || depth > 16) return null;
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    const linked = variablesById.get(value.id);
    if (!linked) return null;
    return resolveAliasValue(linked, modeId, variablesById, depth + 1);
  }
  return { variable, value };
}

/**
 * Collects all local variables and styles from the Figma file and compiles them into CSS Custom Properties
 */
export async function collectVariablesAndStyles(
  options: ConversionOptions
): Promise<VariablesExportResult> {
  const tokens: ExportedToken[] = [];
  const tokensMap = new Map<string, ExportedToken>();
  const colorValueMap = new Map<string, ExportedToken>();
  const syntheticTokens = new Map<string, ExportedToken>();
  const textStyles = new Map<string, TextStyleTokenSet>();
  const effectStyles = new Map<string, EffectStyleTokenSet>();
  const modeClasses = new Map<string, string>();

  let varvarCssRaw = '';
  let varvarTailwindRaw = '';
  let varvarJsonRaw = '';
  let varvarJsRaw = '';
  let varvarCsvRaw = '';

  const exportUnit = options.useRem ? 'rem' : 'px';
  const rootFontSize = options.baseFontSize;
  const unitOptions = toUnitOptions(exportUnit, rootFontSize);

  // 1. Fetch Figma Variables using VarVar exporters
  try {
    if (typeof figma.variables !== 'undefined' && typeof figma.variables.getLocalVariablesAsync === 'function') {
      const [cssRes, twRes, jsonRes, jsRes, csvRes, variables, collections] = await Promise.all([
        exportToCSS(true, false, exportUnit, rootFontSize).catch(() => ''),
        exportToTailwind(true, false, exportUnit, rootFontSize).catch(() => ''),
        exportToJSON(exportUnit, rootFontSize, false, true).catch(() => []),
        exportToJS(false).catch(() => ''),
        exportToCSV(false).catch(() => ''),
        figma.variables.getLocalVariablesAsync().catch(() => []),
        figma.variables.getLocalVariableCollectionsAsync().catch(() => []),
      ]);

      varvarCssRaw = cssRes || '';
      varvarTailwindRaw = twRes || '';
      varvarJsonRaw = jsonRes && jsonRes[0] ? jsonRes[0].content : '';
      varvarJsRaw = jsRes || '';
      varvarCsvRaw = csvRes || '';

      const variablesById = new Map<string, Variable>(variables.map((v) => [v.id, v]));
      const collectionsById = new Map<string, VariableCollection>(collections.map((c) => [c.id, c]));
      const parsedCss = parseVarVarCss(varvarCssRaw);

      for (const variable of variables) {
        const collection = collectionsById.get(variable.variableCollectionId);
        const collectionName = collection ? collection.name : 'Variables';
        const modes = collection?.modes ?? [];

        const defaultModeId =
          collection?.defaultModeId ?? modes[0]?.modeId ?? Object.keys(variable.valuesByMode)[0];
        if (!defaultModeId) continue;
        const rawValue = variable.valuesByMode[defaultModeId];
        if (rawValue === undefined) continue;

        const cssVarName = variableNameToCssVar(variable.name);
        const cssValue =
          parsedCss.root.get(cssVarName) ??
          formatVariableValue(
            rawValue,
            variable.resolvedType,
            variable.scopes ?? [],
            variablesById,
            unitOptions
          );

        const modeValues: Record<string, string> = {};
        for (const mode of modes) {
          const modeValue = variable.valuesByMode[mode.modeId];
          if (modeValue === undefined) continue;
          const className = modeClassFor(collectionName, mode.name);
          const isDefault = mode.modeId === defaultModeId;
          const fromExporter = isDefault
            ? parsedCss.root.get(cssVarName)
            : parsedCss.modes.get(className)?.get(cssVarName);
          modeValues[mode.modeId] =
            fromExporter ??
            formatVariableValue(
              modeValue,
              variable.resolvedType,
              variable.scopes ?? [],
              variablesById,
              unitOptions
            );
          if (!isDefault) {
            modeClasses.set(`${variable.variableCollectionId}:${mode.modeId}`, className);
          }
        }
        if (Object.keys(modeValues).length === 0) modeValues[defaultModeId] = cssValue;

        let tokenType: ExportedToken['type'] = 'string';
        if (variable.resolvedType === 'COLOR') tokenType = 'color';
        else if (variable.resolvedType === 'FLOAT') tokenType = 'dimension';
        else if (variable.resolvedType === 'BOOLEAN') tokenType = 'boolean';

        const token: ExportedToken = {
          id: variable.id,
          name: variable.name,
          cssVarName,
          type: tokenType,
          value: cssValue,
          collectionName,
          source: 'variable',
          collectionId: variable.variableCollectionId,
          defaultModeId,
          modeValues,
        };

        tokens.push(token);
        tokensMap.set(variable.id, token);

        // Colour aliases are mapped by the colour they actually resolve to,
        // not by their `var()` text, so a node without a binding can still
        // land on the semantic token.
        const resolved = resolveAliasValue(variable, defaultModeId, variablesById);
        if (
          variable.resolvedType === 'COLOR' &&
          resolved &&
          typeof resolved.value === 'object' &&
          resolved.value !== null &&
          'r' in resolved.value
        ) {
          const maybeAlpha = (resolved.value as { a?: unknown }).a;
          const alpha = typeof maybeAlpha === 'number' ? maybeAlpha : 1;
          const key = normalizeColorKey(resolved.value as RGB, alpha);
          if (!colorValueMap.has(key)) colorValueMap.set(key, token);
        }
      }
    }
  } catch (err) {
    console.warn('Figma variables API not available or error occurred:', err);
  }

  // 2. Fetch Paint Styles (Color Styles)
  try {
    const paintStyles = typeof figma.getLocalPaintStylesAsync === 'function'
      ? await figma.getLocalPaintStylesAsync()
      : (figma.getLocalPaintStyles ? figma.getLocalPaintStyles() : []);

    for (const style of paintStyles) {
      if (!style.paints || style.paints.length === 0) continue;
      const activePaint = style.paints.find((p) => p.visible !== false && p.type === 'SOLID');
      if (activePaint && activePaint.type === 'SOLID') {
        const cssVarName = variableNameToCssVar(`color-${style.name}`);
        const opacity = activePaint.opacity ?? 1;
        const cssValue = figmaColorToRgba(activePaint.color, opacity);

        const token: ExportedToken = {
          id: style.id,
          name: style.name,
          cssVarName,
          type: 'color',
          value: cssValue,
          collectionName: 'Paint Styles',
          source: 'paint-style',
        };

        tokens.push(token);
        tokensMap.set(style.id, token);

        const key = normalizeColorKey(activePaint.color, opacity);
        colorValueMap.set(key, token);
      }
    }
  } catch (err) {
    console.warn('Paint styles error:', err);
  }

  // 3. Fetch Effect Styles (Shadows & Blurs)
  try {
    const effectStylesRaw = typeof figma.getLocalEffectStylesAsync === 'function'
      ? await figma.getLocalEffectStylesAsync()
      : (figma.getLocalEffectStyles ? figma.getLocalEffectStyles() : []);

    for (const style of effectStylesRaw) {
      const baseSlug = variableNameToCssVar(style.name).replace(/^--/, '');
      const activeEffects = style.effects.filter((e) => e.visible !== false);
      if (activeEffects.length === 0) continue;

      const shadowParts: string[] = [];
      const filterParts: string[] = [];
      const backdropParts: string[] = [];
      for (const eff of activeEffects) {
        if (eff.type === 'DROP_SHADOW' || eff.type === 'INNER_SHADOW') {
          const isInset = eff.type === 'INNER_SHADOW' ? 'inset ' : '';
          const x = formatUnit(eff.offset.x, options.useRem, options.baseFontSize);
          const y = formatUnit(eff.offset.y, options.useRem, options.baseFontSize);
          const radius = formatUnit(eff.radius, options.useRem, options.baseFontSize);
          const spread = formatUnit(eff.spread || 0, options.useRem, options.baseFontSize);
          const color = figmaColorToRgba(eff.color, eff.color.a);
          shadowParts.push(`${isInset}${x} ${y} ${radius} ${spread} ${color}`);
        } else if (eff.type === 'LAYER_BLUR') {
          filterParts.push(`blur(${formatUnit(eff.radius, options.useRem, options.baseFontSize)})`);
        } else if (eff.type === 'BACKGROUND_BLUR') {
          backdropParts.push(`blur(${formatUnit(eff.radius, options.useRem, options.baseFontSize)})`);
        }
      }

      let shadowToken: ExportedToken | undefined;
      let filterToken: ExportedToken | undefined;
      let backdropToken: ExportedToken | undefined;

      if (shadowParts.length > 0) {
        shadowToken = {
          id: `${style.id}_shadow`,
          name: `${style.name} Shadow`,
          cssVarName: `--shadow-${baseSlug}`,
          type: 'shadow',
          value: shadowParts.join(', '),
          collectionName: 'Effect Styles',
          source: 'effect-style',
        };
      }
      if (filterParts.length > 0) {
        filterToken = {
          id: `${style.id}_filter`,
          name: `${style.name} Blur`,
          cssVarName: `--filter-${baseSlug}`,
          type: 'filter',
          value: filterParts.join(' '),
          collectionName: 'Effect Styles',
          source: 'effect-style',
        };
      }
      if (backdropParts.length > 0) {
        backdropToken = {
          id: `${style.id}_backdrop`,
          name: `${style.name} Backdrop Blur`,
          cssVarName: `--backdrop-blur-${baseSlug}`,
          type: 'filter',
          value: backdropParts.join(' '),
          collectionName: 'Effect Styles',
          source: 'effect-style',
        };
      }

      for (const t of [shadowToken, filterToken, backdropToken]) {
        if (!t) continue;
        tokens.push(t);
        tokensMap.set(t.id, t);
      }
      const primary = shadowToken ?? filterToken ?? backdropToken;
      if (primary) tokensMap.set(style.id, primary);

      effectStyles.set(style.id, {
        id: style.id,
        name: style.name,
        shadow: shadowToken,
        filter: filterToken,
        backdropFilter: backdropToken,
        effects: style.effects,
      });
    }
  } catch (err) {
    console.warn('Effect styles error:', err);
  }

  // 4. Fetch Text Styles (Typography Tokens)
  try {
    const textStylesRaw = typeof figma.getLocalTextStylesAsync === 'function'
      ? await figma.getLocalTextStylesAsync()
      : (figma.getLocalTextStyles ? figma.getLocalTextStyles() : []);

    for (const style of textStylesRaw) {
      const baseSlug = variableNameToCssVar(style.name).replace(/^--/, '');
      const fam = style.fontName?.family || '';
      const weight = getFontWeightNumber(style.fontName?.style || 'Regular');
      const fontSize = formatUnit(style.fontSize, options.useRem, options.baseFontSize);

      const lineHeightValue =
        style.lineHeight && typeof style.lineHeight === 'object' && style.lineHeight.unit
          ? (style.lineHeight as LineHeight)
          : null;
      let lineHeight = 'normal';
      if (lineHeightValue) {
        if (lineHeightValue.unit === 'PIXELS') {
          lineHeight = formatUnit(lineHeightValue.value, options.useRem, options.baseFontSize);
        } else if (lineHeightValue.unit === 'PERCENT') {
          lineHeight = `${Math.round((lineHeightValue.value / 100) * 100) / 100}`;
        }
      }

      const letterSpacingValue =
        style.letterSpacing && typeof style.letterSpacing === 'object' && style.letterSpacing.unit
          ? (style.letterSpacing as LetterSpacing)
          : null;
      let letterSpacing: string | null = null;
      if (letterSpacingValue && letterSpacingValue.value !== 0) {
        if (letterSpacingValue.unit === 'PIXELS') {
          letterSpacing = formatUnit(
            letterSpacingValue.value,
            options.useRem,
            options.baseFontSize
          );
        } else if (letterSpacingValue.unit === 'PERCENT') {
          const em = Math.round((letterSpacingValue.value / 100) * 1000) / 1000;
          if (em !== 0) letterSpacing = `${em}em`;
        }
      }

      const paragraphSpacingPx =
        typeof (style as TextStyle & { paragraphSpacing?: number }).paragraphSpacing === 'number'
          ? (style as TextStyle & { paragraphSpacing: number }).paragraphSpacing
          : 0;

      const fontVal = fam
        ? isEmbeddedFamily(fam, options.customFonts)
          ? fontFamilyWithFallback(fam, FONT_FALLBACK_CHAIN)
          : `'${fam}', ${FONT_FALLBACK_CHAIN}`
        : FONT_FALLBACK_CHAIN;

      const familyToken: ExportedToken = {
        id: `${style.id}_family`,
        name: `${style.name} Family`,
        cssVarName: `--font-family-${baseSlug}`,
        type: 'typography',
        value: fontVal,
        collectionName: 'Typography Styles',
        source: 'text-style',
      };
      const sizeToken: ExportedToken = {
        id: `${style.id}_size`,
        name: `${style.name} Size`,
        cssVarName: `--text-${baseSlug}`,
        type: 'typography',
        value: fontSize,
        collectionName: 'Typography Styles',
        source: 'text-style',
      };
      const weightToken: ExportedToken = {
        id: `${style.id}_weight`,
        name: `${style.name} Weight`,
        cssVarName: `--font-weight-${baseSlug}`,
        type: 'typography',
        value: String(weight),
        collectionName: 'Typography Styles',
        source: 'text-style',
      };

      const lineHeightToken: ExportedToken | undefined =
        lineHeight !== 'normal'
          ? {
              id: `${style.id}_leading`,
              name: `${style.name} Line Height`,
              cssVarName: `--leading-${baseSlug}`,
              type: 'typography',
              value: lineHeight,
              collectionName: 'Typography Styles',
              source: 'text-style',
            }
          : undefined;

      const letterSpacingToken: ExportedToken | undefined =
        letterSpacing !== null
          ? {
              id: `${style.id}_tracking`,
              name: `${style.name} Letter Spacing`,
              cssVarName: `--tracking-${baseSlug}`,
              type: 'typography',
              value: letterSpacing,
              collectionName: 'Typography Styles',
              source: 'text-style',
            }
          : undefined;

      const paragraphSpacingToken: ExportedToken | undefined =
        paragraphSpacingPx > 0
          ? {
              id: `${style.id}_paragraph`,
              name: `${style.name} Paragraph Spacing`,
              cssVarName: `--paragraph-spacing-${baseSlug}`,
              type: 'typography',
              value: formatUnit(paragraphSpacingPx, options.useRem, options.baseFontSize),
              collectionName: 'Typography Styles',
              source: 'text-style',
            }
          : undefined;

      const typoTokens = [
        familyToken,
        sizeToken,
        weightToken,
        lineHeightToken,
        letterSpacingToken,
        paragraphSpacingToken,
      ].filter((t): t is ExportedToken => Boolean(t));

      for (const t of typoTokens) {
        tokens.push(t);
        tokensMap.set(t.id, t);
      }
      // Kept for callers that look a style up by id; the typography converter
      // reads `textStyles` instead, because one id owns several properties.
      tokensMap.set(style.id, familyToken);

      const boundVariables = (style as TextStyle & {
        boundVariables?: Record<string, { id?: string }>;
      }).boundVariables;

      textStyles.set(style.id, {
        id: style.id,
        name: style.name,
        family: familyToken,
        size: sizeToken,
        weight: weightToken,
        lineHeight: lineHeightToken,
        letterSpacing: letterSpacingToken,
        paragraphSpacing: paragraphSpacingToken,
        fontFamily: fam,
        fontWeight: weight,
        fontSizePx: style.fontSize,
        lineHeightValue,
        letterSpacingValue,
        paragraphSpacingPx,
        fontStyleName: style.fontName?.style || '',
        boundVariables,
      });
    }
  } catch (err) {
    console.warn('Text styles error:', err);
  }

  const tokensByCssVar = new Map<string, ExportedToken>();
  for (const token of tokens) {
    if (!tokensByCssVar.has(token.cssVarName)) tokensByCssVar.set(token.cssVarName, token);
  }

  /**
   * Follows `var(--a)` chains through the collected tokens to the value a
   * browser would actually see. Returns null for a dangling alias: a reference
   * whose definition is not in the document cannot be colour-matched or used
   * as a length.
   */
  function resolveCssValue(value: string): string | null {
    let current = value.trim();
    const seen = new Set<string>();
    for (let depth = 0; depth < 16; depth++) {
      const match = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,[^)]*)?\)$/.exec(current);
      if (!match || !match[1]) return current;
      const name = match[1];
      if (seen.has(name)) return null;
      seen.add(name);
      const next = tokensByCssVar.get(name);
      if (!next) return null;
      current = next.value.trim();
    }
    return null;
  }

  /**
   * Resolves ANY color strictly to a CSS variable `var(--...)`.
   * NEVER returns a hardcoded hex or rgb value in classes or declarations!
   */
  function resolveColor(
    color: RGB,
    opacity: number = 1,
    boundVarId?: string | null,
    styleId?: string | null
  ): string {
    // The node's own paint is the truth; an id is a naming hint. A binding
    // whose token no longer describes the paint (locally edited fill,
    // repainted style, another mode) must not be emitted, or the exported
    // colour drifts away from the design.
    const honestToken = (id: string | null | undefined): string | null => {
      if (!id) return null;
      const token = tokensMap.get(id);
      if (!token) return null;
      const resolved = resolveCssValue(token.value);
      if (!resolved || !tokenValueMatchesPaint(resolved, color, opacity)) return null;
      return `var(${token.cssVarName})`;
    };

    const bound = honestToken(boundVarId) ?? honestToken(styleId);
    if (bound) return bound;

    // 3. Matched in collected tokens
    const key = normalizeColorKey(color, opacity);
    if (colorValueMap.has(key)) {
      return `var(${colorValueMap.get(key)!.cssVarName})`;
    }

    // 4. Matched in already synthesized document tokens
    if (syntheticTokens.has(key)) {
      return `var(${syntheticTokens.get(key)!.cssVarName})`;
    }

    // 5. Synthesize clean document token in :root / @theme
    const hex = figmaColorToHex(color).toLowerCase();
    const hexClean = hex.replace('#', '');
    let varName = '';
    if (opacity < 1) {
      varName = `--color-${hexClean}-${Math.round(opacity * 100)}`;
    } else if (hexClean === 'ffffff') {
      varName = '--color-white';
    } else if (hexClean === '000000') {
      varName = '--color-black';
    } else {
      varName = `--color-${hexClean}`;
    }

    const cssVal = opacity < 1 ? figmaColorToRgba(color, opacity) : hex;
    const synthToken: ExportedToken = {
      id: `synth_${key}`,
      name: varName.replace('--', ''),
      cssVarName: varName,
      type: 'color',
      value: cssVal,
      collectionName: 'Document Colors',
      source: 'synthetic',
    };

    syntheticTokens.set(key, synthToken);
    tokensMap.set(synthToken.id, synthToken);
    colorValueMap.set(key, synthToken);

    return `var(${varName})`;
  }

  /**
   * Combines all tokens (VarVar CSS + Paint/Effect/Text styles + Synthesized Colors) into CSS
   */
  function getCssVariablesBlock(): string {
    // 'Variables' tokens are normally defined by the VarVar CSS block merged
    // below. That block is not guaranteed to carry a given variable — the
    // exporter may have failed, or the collection may have been unreachable —
    // and a var() with no definition is dropped by the browser, which silently
    // erased every such colour in the document. So a Variables token is only
    // deferred to VarVar when the raw block actually defines its exact name.
    const isDefinedByVarVar = (cssVarName: string) => varvarCssRaw.includes(`${cssVarName}:`);
    const nonVarVarTokens = [
      ...tokens.filter((t) => t.collectionName !== 'Variables' || !isDefinedByVarVar(t.cssVarName)),
      ...Array.from(syntheticTokens.values()),
    ];

    const grouped = new Map<string, ExportedToken[]>();
    for (const token of nonVarVarTokens) {
      const groupName = token.collectionName || 'General';
      if (!grouped.has(groupName)) grouped.set(groupName, []);
      grouped.get(groupName)!.push(token);
    }

    const seenVarNames = new Set<string>();
    const extraLines: string[] = [];

    for (const [groupName, groupTokens] of grouped.entries()) {
      const uniqueGroupTokens = groupTokens.filter((t) => {
        if (seenVarNames.has(t.cssVarName)) return false;
        seenVarNames.add(t.cssVarName);
        return true;
      });
      if (uniqueGroupTokens.length === 0) continue;

      extraLines.push(`  /* --- ${groupName} --- */`);
      for (const t of uniqueGroupTokens) {
        extraLines.push(`  ${t.cssVarName}: ${t.value};`);
      }
      extraLines.push('');
    }

    if (varvarCssRaw && varvarCssRaw.trim().length > 0) {
      if (extraLines.length > 0) {
        // Inject extra tokens before the closing bracket of :root in varvarCssRaw
        if (varvarCssRaw.includes(':root {')) {
          return varvarCssRaw.replace(':root {', `:root {\n${extraLines.join('\n')}`);
        }
        return `${varvarCssRaw}\n\n:root {\n${extraLines.join('\n')}\n}`;
      }
      return varvarCssRaw;
    }

    if (extraLines.length === 0) {
      return '';
    }

    return `:root {\n  --TRUE: 1;\n  --FALSE: 0;\n${extraLines.join('\n')}\n}`;
  }

  /**
   * Combines VarVar Tailwind v4 @theme with synthesized colors and text styles
   */
  function getTailwindThemeBlock(): string {
    // Same reason as getCssVariablesBlock: a 'Variables' token is only deferred
    // to the VarVar Tailwind block when that block actually defines its exact
    // name. Tailwind's naming scheme differs from the CSS exporter's, so the
    // markup (which always uses CSS names) also needs its own definition in
    // `@theme`.
    const isDefinedByVarVar = (cssVarName: string) => varvarTailwindRaw.includes(`${cssVarName}:`);
    const extraTokens = [
      ...tokens.filter((t) => t.collectionName !== 'Variables' || !isDefinedByVarVar(t.cssVarName)),
      ...Array.from(syntheticTokens.values()),
    ];

    const seenVarNames = new Set<string>();
    const extraLines: string[] = [];
    for (const t of extraTokens) {
      if (seenVarNames.has(t.cssVarName)) continue;
      seenVarNames.add(t.cssVarName);
      extraLines.push(`  ${t.cssVarName}: ${t.value};`);
    }

    if (varvarTailwindRaw && varvarTailwindRaw.includes('@theme {')) {
      if (extraLines.length > 0) {
        return varvarTailwindRaw.replace('@theme {', `@theme {\n${extraLines.join('\n')}`);
      }
      return varvarTailwindRaw;
    }

    return `@theme {\n${extraLines.join('\n')}\n}`;
  }

  /**
   * One custom-property name must mean one value across the whole document:
   * the VarVar block, the collected styles, and the synthesized colours.
   * `toCssVar` collapses different Figma names onto the same property — a
   * style "Background/N5" and a variable "color/background/n 5" are one
   * `--color-background-n5` — and the definition race then silently repainted
   * whichever one lost. The later declaration keeps the meaning by moving to
   * a suffixed name; references follow it because they carry the token.
   */
  const definedValues = new Map<string, string>();
  for (const match of varvarCssRaw.matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1];
    const value = match[2]?.trim();
    if (name && value !== undefined && !definedValues.has(name)) definedValues.set(name, value);
  }

  const sameCssColor = (a: string, b: string): boolean => {
    if (a.trim() === b.trim()) return true;
    try {
      const x = cssColorToRgba(a);
      const y = cssColorToRgba(b);
      const eps = 1e-4;
      return (
        Math.abs(x.r - y.r) < eps &&
        Math.abs(x.g - y.g) < eps &&
        Math.abs(x.b - y.b) < eps &&
        Math.abs(x.a - y.a) < eps
      );
    } catch {
      return false;
    }
  };

  for (const token of [...tokens, ...Array.from(syntheticTokens.values())]) {
    const existing = definedValues.get(token.cssVarName);
    if (existing !== undefined && sameCssColor(existing, token.value)) continue;
    if (existing !== undefined) {
      let n = 2;
      while (
        definedValues.has(`${token.cssVarName}-${n}`) &&
        !sameCssColor(definedValues.get(`${token.cssVarName}-${n}`)!, token.value)
      ) {
        n += 1;
      }
      token.cssVarName = `${token.cssVarName}-${n}`;
    }
    definedValues.set(token.cssVarName, token.value);
  }

  const cssVariablesBlock = getCssVariablesBlock();
  const tailwindThemeBlock = getTailwindThemeBlock();

  return {
    tokens,
    cssVariablesBlock,
    tailwindThemeBlock,
    jsonExport: varvarJsonRaw,
    jsExport: varvarJsRaw,
    csvExport: varvarCsvRaw,
    tokensMap,
    colorValueMap,
    syntheticTokens,
    textStyles,
    effectStyles,
    modeClasses,
    resolveColor,
    getCssVariablesBlock,
    getTailwindThemeBlock,
  };
}
