import { figmaColorToRgba, figmaColorToHex, formatUnit } from '../converter/utils';
import { ConversionOptions } from '../types/ir';
import { exportToCSS } from './varvar/collectionToCSS';
import { exportToTailwind } from './varvar/collectionToTailwind';
import { exportToJSON } from './varvar/collectionToJSON';
import { exportToJS } from './varvar/collectionToJS';
import { exportToCSV } from './varvar/collectionToCSV';
import { toCssVar } from './varvar/stringTransformation';
import { getFontWeightNumber } from '../converter/typography';
import { FONT_FALLBACK_CHAIN } from '../../shared/constants';

export interface ExportedToken {
  id: string;
  name: string;
  cssVarName: string;
  type: 'color' | 'dimension' | 'string' | 'boolean' | 'shadow' | 'typography';
  value: string;
  collectionName?: string;
  modeName?: string;
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
 * Resolves a Figma Variable value into a CSS string
 */
function resolveVariableValue(
  value: VariableValue,
  type: VariableResolvedDataType,
  options: ConversionOptions,
  variablesById: Map<string, Variable>
): string {
  // If it's a linked variable alias:
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    const aliasedVar = variablesById.get(value.id);
    if (aliasedVar) {
      return `var(${variableNameToCssVar(aliasedVar.name)})`;
    }
  }

  // Color variable: { r, g, b, a? }
  if (type === 'COLOR' && typeof value === 'object' && value !== null && 'r' in value) {
    const maybeAlpha = (value as { a?: unknown }).a;
    const a = typeof maybeAlpha === 'number' ? maybeAlpha : 1;
    return figmaColorToRgba(value as RGB, a);
  }

  // Float variable (dimension, spacing, radius, opacity)
  if (type === 'FLOAT' && typeof value === 'number') {
    return formatUnit(value, options.useRem, options.baseFontSize);
  }

  // String / Boolean
  if (typeof value === 'string' || typeof value === 'boolean') {
    return String(value);
  }

  return String(value);
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

  let varvarCssRaw = '';
  let varvarTailwindRaw = '';
  let varvarJsonRaw = '';
  let varvarJsRaw = '';
  let varvarCsvRaw = '';

  // 1. Fetch Figma Variables using VarVar exporters
  try {
    if (typeof figma.variables !== 'undefined' && typeof figma.variables.getLocalVariablesAsync === 'function') {
      const exportUnit = options.useRem ? 'rem' : 'px';
      const rootFontSize = options.baseFontSize;

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

      for (const variable of variables) {
        const collection = collectionsById.get(variable.variableCollectionId);
        const collectionName = collection ? collection.name : 'Variables';

        const defaultModeId = collection ? collection.defaultModeId : Object.keys(variable.valuesByMode)[0];
        if (!defaultModeId) continue;
        const rawValue = variable.valuesByMode[defaultModeId];
        if (rawValue === undefined) continue;

        const cssVarName = variableNameToCssVar(variable.name);
        const cssValue = resolveVariableValue(rawValue, variable.resolvedType, options, variablesById);

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
        };

        tokens.push(token);
        tokensMap.set(variable.id, token);

        if (variable.resolvedType === 'COLOR' && typeof rawValue === 'object' && rawValue && 'r' in rawValue) {
          const alpha = (rawValue as { a?: unknown }).a;
          const a = typeof alpha === 'number' ? alpha : 1;
          const key = normalizeColorKey(rawValue as RGB, a);
          colorValueMap.set(key, token);
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
    const effectStyles = typeof figma.getLocalEffectStylesAsync === 'function'
      ? await figma.getLocalEffectStylesAsync()
      : (figma.getLocalEffectStyles ? figma.getLocalEffectStyles() : []);

    for (const style of effectStyles) {
      const activeEffects = style.effects.filter(
        (e): e is DropShadowEffect | InnerShadowEffect =>
          e.visible !== false && (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW')
      );
      if (activeEffects.length > 0) {
        const shadowParts = activeEffects.map((eff) => {
          const isInset = eff.type === 'INNER_SHADOW' ? 'inset ' : '';
          const x = formatUnit(eff.offset.x, options.useRem, options.baseFontSize);
          const y = formatUnit(eff.offset.y, options.useRem, options.baseFontSize);
          const radius = formatUnit(eff.radius, options.useRem, options.baseFontSize);
          const spread = formatUnit(eff.spread || 0, options.useRem, options.baseFontSize);
          const color = figmaColorToRgba(eff.color, eff.color.a);
          return `${isInset}${x} ${y} ${radius} ${spread} ${color}`;
        });

        const cssVarName = variableNameToCssVar(`shadow-${style.name}`);
        const cssValue = shadowParts.join(', ');

        const token: ExportedToken = {
          id: style.id,
          name: style.name,
          cssVarName,
          type: 'shadow',
          value: cssValue,
          collectionName: 'Effect Styles',
        };

        tokens.push(token);
        tokensMap.set(style.id, token);
      }
    }
  } catch (err) {
    console.warn('Effect styles error:', err);
  }

  // 4. Fetch Text Styles (Typography Tokens)
  try {
    const textStyles = typeof figma.getLocalTextStylesAsync === 'function'
      ? await figma.getLocalTextStylesAsync()
      : (figma.getLocalTextStyles ? figma.getLocalTextStyles() : []);

    for (const style of textStyles) {
      const baseSlug = variableNameToCssVar(`font-${style.name}`).replace(/^--/, '');
      const fam = style.fontName?.family || '';
      const weight = getFontWeightNumber(style.fontName?.style || 'Regular');
      const fontSize = formatUnit(style.fontSize, options.useRem, options.baseFontSize);

      let lineHeight = 'normal';
      if (style.lineHeight && typeof style.lineHeight === 'object' && style.lineHeight.unit) {
        if (style.lineHeight.unit === 'PIXELS') {
          lineHeight = formatUnit(style.lineHeight.value, options.useRem, options.baseFontSize);
        } else if (style.lineHeight.unit === 'PERCENT') {
          lineHeight = `${Math.round((style.lineHeight.value / 100) * 100) / 100}`;
        }
      }

      const fontVal = fam ? `'${fam}', ${FONT_FALLBACK_CHAIN}` : FONT_FALLBACK_CHAIN;

      // Grouped tokens for typography
      const typoTokens: ExportedToken[] = [
        {
          id: `${style.id}_family`,
          name: `${style.name} Family`,
          cssVarName: `--font-family-${baseSlug}`,
          type: 'typography',
          value: fontVal,
          collectionName: 'Typography Styles',
        },
        {
          id: `${style.id}_size`,
          name: `${style.name} Size`,
          cssVarName: `--text-${baseSlug}`,
          type: 'typography',
          value: fontSize,
          collectionName: 'Typography Styles',
        },
        {
          id: `${style.id}_weight`,
          name: `${style.name} Weight`,
          cssVarName: `--font-weight-${baseSlug}`,
          type: 'typography',
          value: String(weight),
          collectionName: 'Typography Styles',
        },
      ];

      if (lineHeight !== 'normal') {
        typoTokens.push({
          id: `${style.id}_leading`,
          name: `${style.name} Line Height`,
          cssVarName: `--leading-${baseSlug}`,
          type: 'typography',
          value: lineHeight,
          collectionName: 'Typography Styles',
        });
      }

      for (const t of typoTokens) {
        tokens.push(t);
        tokensMap.set(t.id, t);
      }
      tokensMap.set(style.id, typoTokens[0]!);
    }
  } catch (err) {
    console.warn('Text styles error:', err);
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
    // 1. Bound Variable
    if (boundVarId && tokensMap.has(boundVarId)) {
      return `var(${tokensMap.get(boundVarId)!.cssVarName})`;
    }

    // 2. Bound Style
    if (styleId && tokensMap.has(styleId)) {
      return `var(${tokensMap.get(styleId)!.cssVarName})`;
    }

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
    const nonVarVarTokens = [
      ...tokens.filter((t) => t.collectionName !== 'Variables'),
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
    const extraTokens = [
      ...tokens.filter((t) => t.collectionName !== 'Variables'),
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
    resolveColor,
    getCssVariablesBlock,
    getTailwindThemeBlock,
  };
}
